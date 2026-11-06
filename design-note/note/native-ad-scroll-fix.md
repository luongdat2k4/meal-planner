# Làm native ad di chuyển mượt và khớp với danh sách khi cuộn

Áp dụng cho native ad của AdMob là view Android đặt đè lên WebView (Capacitor, `@alf/app-sdk` 3.0.0), nằm trong danh sách cuộn của trang web.

**Kết quả trên Galaxy A17 (90 Hz), test ad:** khi cuộn, ad lệch so với các hàng từ khoảng 11 CSS px xuống dưới 1 CSS px, không còn hiệu ứng "dây kéo". Độ mượt của cuộn không giảm, danh sách vẫn là virtual scroll.

Có hai việc phải làm, và phải làm đủ cả hai:

1. **Tắt native ad validator của Google.** Nó làm mọi màn hình giật và làm sai mọi phép đo.
2. **Cuộn trên document, và để Android tự di chuyển ad** theo vị trí cuộn trong frame đang vẽ, thay vì để JS gửi vị trí qua bridge.

## 1. Vì sao ad bị trễ

Ad là view Android, nên nó không tự cuộn cùng trang. Cách thường dùng là mỗi frame JS đọc vị trí rồi gửi xuống:

```text
Trang cuộn ngay trên compositor
JS đọc vị trí  →  Capacitor bridge  →  luồng plugin  →  UI thread  →  ad di chuyển
                  (ad đến sau trang khoảng 50–65 ms)
```

Ở tốc độ cuộn bình thường, 50–65 ms tương đương hàng chục CSS px. Đó là cảm giác "dây kéo". Khi dừng cuộn, ad vẫn đúng vị trí, nên lỗi chỉ thấy lúc đang cuộn.

Cách sửa dựa trên một giới hạn của Android WebView: **`WebView.getScrollY()` chỉ phản ánh cuộn của document**. Android không đọc được vị trí của khung `overflow` bên trong như `.view`. Vì vậy, muốn ad khớp tuyệt đối thì trang phải cuộn trên document.

## 2. Bước 1: tắt validator

Thêm vào `android/app/src/main/AndroidManifest.xml`, trong `<application>`:

```xml
<meta-data
    android:name="com.google.android.gms.ads.flag.NATIVE_AD_DEBUGGER_ENABLED"
    android:value="false" />
```

Với test ad, validator (bong bóng trắng "AdMob native ad validator") tạo một cửa sổ popup mỗi lần hiện ad. Các cửa sổ này bị bỏ lại và được relayout ở mỗi frame khi cuộn, nên app càng dùng càng chậm.

| Cuộn `.view`, không có ad | Có validator | Đã tắt |
|---|---|---|
| Tổng một frame (trung vị) | 66–84 ms | 17–20 ms |
| Pha `performTraversals` | 24–31 ms | 0,2 ms |
| Số cửa sổ của app | 8 | 1 |

Validator chỉ xuất hiện với test ad, nên lỗi này không ảnh hưởng ad thật. Nhưng nếu không tắt, mọi so sánh độ mượt đều vô nghĩa: chúng tôi từng bỏ đúng giải pháp ở bước 2 vì cảm thấy nó lag, trong khi rất có thể validator mới là nguyên nhân.

## 3. Bước 2: cuộn trên document

### 3.1. CSS

Chỉ màn hình có ad trong danh sách mới bật class này:

```css
html.doc-scroll, html.doc-scroll body, html.doc-scroll #app { height: auto; }
html.doc-scroll .shell { height: auto; min-height: 100vh; }
html.doc-scroll .view { overflow-y: visible; min-height: 100vh; }
/* trang đứng yên dưới popup */
html.doc-scroll.doc-locked { overflow: hidden; }
```

Các màn khác vẫn cuộn trong `.view`, vì chúng cần một khung có chiều cao cố định.

### 3.2. Helper: `composables/pageScroll.ts`

```ts
const ON = 'doc-scroll'
export const docScrolls = () => document.documentElement.classList.contains(ON)

/** Màn này cuộn trên document (khi `active` đúng). */
export function useDocScroll(active: () => boolean = () => true) {
  const set = (on: boolean) => { document.documentElement.classList.toggle(ON, on) }
  watch(active, set, { immediate: true })
  onBeforeUnmount(() => set(false))
}

/** Thứ thật sự cuộn: document nếu là `.view` trên màn đang cuộn document. */
export const scrollerOf = (el: HTMLElement) =>
  (el.classList.contains('view') && docScrolls() ? document.documentElement : el)
```

Bản trong repo có thêm công tắc `docScrollAllowed` để so sánh hai cách cuộn trong bản test. Công tắc này không cần cho giải pháp.

### 3.3. Giữ virtual scroll

Dùng `useWindowVirtualizer` của TanStack Virtual. **Không được truyền `getScrollElement`**, nếu không nó ghi đè `window` và danh sách ngừng cập nhật hàng. Lỗi này không báo gì và số đo độ mượt còn đẹp hơn, vì không có hàng mới được mount.

```ts
const onWindow = computed(() => { const { getScrollElement: _, ...rest } = options.value; return rest })
return useWindowVirtualizer(onWindow as never)
```

Nếu danh sách không nằm ở đầu trang, truyền `scrollMargin` là vị trí của danh sách trong trang, rồi trừ đi khi đặt từng hàng:

```ts
:style="{ transform: `translateY(${v.start - scrollMargin}px)` }"
```

### 3.4. Những chỗ phải đổi theo

| Chỗ | Đổi thành |
|---|---|
| Sự kiện `scroll` trên `.view` | Nghe trên `window` |
| `el.scrollTop` của `.view` | `document.documentElement.scrollTop` hoặc `scrollerOf(el)` |
| Lưu và khôi phục vị trí khi quay lại màn | Dùng scroller là `document.documentElement` |
| Kéo để refresh, kéo bằng chuột | Đọc và ghi qua `scrollerOf()` |
| Chuyển màn | Đặt lại `document.documentElement.scrollTop = 0` |
| Popup | Thêm class `doc-locked` khóa cuộn; `transform-origin` của màn phía sau tính theo `scrollY + innerHeight / 2` |
| Phần cố định của màn (thanh tìm kiếm…) | `position: sticky`, vì màn không còn khung cuộn riêng |

Trong CSS scoped của Vue, viết `html.doc-scroll .shop .pin { … }`. Đừng dùng `:global(html.doc-scroll) .shop .pin`, vì phần selector phía sau `:global()` bị bỏ đi.

## 4. Bước 3: sửa SDK để ad tự bám cuộn

Sửa qua `patch-package`, patch nằm ở `game/patches/@alf+app-sdk+3.0.0.patch`.

### 4.1. JS gửi vị trí trong trang, chỉ khi có thay đổi

Trong `useNativeAd.ts`, rect gửi xuống kèm `scrollY` và vùng được phép hiện:

```ts
function rectOf(el: HTMLElement, band: Band) {
  const r = el.getBoundingClientRect(), edge = { clipTop: px(band.top), clipBottom: px(band.bottom) }
  return { x: px(r.x), y: px(r.y), width: px(r.width), height: px(r.height), ...edge,
    ...(docScrolls() && el.closest('.view') ? { scrollY } : {}) }
}
```

`y + scrollY` không đổi khi trang cuộn, nên dùng làm khóa để bỏ các lần gửi thừa:

```ts
const placeKey = (r) => [r.x, r.scrollY === undefined ? r.y : px(r.y + r.scrollY),
  r.width, r.height, r.clipTop, r.clipBottom].join()

const rect = rectOf(box, band), key = placeKey(rect)
if (key !== sent) { sent = key; void sdk.moveNative(rect, slot) }
```

Ad nằm trong lớp phủ cố định (như story sponsored) không thuộc `.view`, nên không kèm `scrollY` và không bị cắt.

### 4.2. Android đặt vị trí ngay trong frame đang vẽ

Trong `ALFAdMobPlugin.java`. Đây là phần cốt lõi:

```java
private static final class NativeAdFollow { boolean follows; float pageTop; float clipTop = -1, clipBottom = -1; }
private final Map<String, NativeAdFollow> nativeAdFollows = new HashMap<>();
private final Map<String, NativeAdClip> nativeAdClips = new HashMap<>();
private android.view.ViewTreeObserver.OnPreDrawListener nativeAdFollowing;

private void noteNativeAdRect(String slot, JSObject rect) {
  float d = density();
  NativeAdFollow f = nativeAdFollows.get(slot);
  if (f == null) { f = new NativeAdFollow(); nativeAdFollows.put(slot, f); }
  double scrollY = rect.optDouble("scrollY", -1d);
  f.follows = scrollY >= 0;
  f.pageTop = (float) ((rect.optDouble("y", 0d) + Math.max(scrollY, 0d)) * d);
  double top = rect.optDouble("clipTop", -1d), bottom = rect.optDouble("clipBottom", -1d);
  f.clipTop = top < 0 ? -1 : (float) (top * d);
  f.clipBottom = bottom < 0 ? -1 : (float) (bottom * d);
  if (nativeAdFollowing == null) {
    nativeAdFollowing = () -> { followNativeAds(); return true; };
    getBridge().getWebView().getViewTreeObserver().addOnPreDrawListener(nativeAdFollowing);
  }
  followNativeAds();
}

private void followNativeAds() {
  int scroll = getBridge().getWebView().getScrollY();
  for (Map.Entry<String, NativeAdFollow> e : nativeAdFollows.entrySet()) {
    NativeAdView view = nativeAdViews.get(e.getKey());
    NativeAdFollow f = e.getValue();
    if (view == null || !(view.getLayoutParams() instanceof FrameLayout.LayoutParams)) continue;
    int margin = ((FrameLayout.LayoutParams) view.getLayoutParams()).topMargin;
    if (f.follows) {
      float y = Math.round(f.pageTop - scroll) - margin;
      if (view.getTranslationY() != y) { view.setTranslationY(y); layoutNativeAdOverlay(e.getKey()); }
    }
    NativeAdClip clip = nativeAdClips.get(e.getKey());
    if (clip == null) { clip = new NativeAdClip(view, getBridge().getWebView()); nativeAdClips.put(e.getKey(), clip); }
    float at = margin + view.getTranslationY();
    clip.to(f.clipTop < 0 ? -1 : Math.round(f.clipTop - at), f.clipBottom < 0 ? -1 : Math.round(f.clipBottom - at));
  }
}
```

`onPreDraw` chạy ngay trước khi vẽ frame, nên ad và trang dùng cùng một giá trị cuộn. Đây là lý do không còn độ trễ.

Những chỗ cần nối vào:

| Trong plugin | Thêm |
|---|---|
| `updateNativeAdRect` (trên UI thread) | `noteNativeAdRect(slot, rect);` |
| `showNativeAd`, khi view đã tồn tại | `noteNativeAdRect(slot, rect);` |
| `renderNativeAd`, sau `nativeAdViews.put` | `if (rect != null) noteNativeAdRect(slot, rect);` |
| `hideNativeAd` | `nativeAdFollows.remove(slot);` |
| `destroyNativeAdView` | Xóa khỏi cả `nativeAdFollows` và `nativeAdClips` |
| Dọn toàn bộ ad | Xóa hai map, gỡ `OnPreDrawListener` |

### 4.3. Cắt ad ở mép như một hàng bình thường

Ad nằm trên WebView nên nó sẽ che header và thanh tab. Thay vì ẩn cả ad, ta cắt phần bị che bằng `setClipBounds`.

`setClipBounds` không chặn chạm: bấm vào phần bị cắt vẫn trúng ad, tức click nhầm. `NativeAdView` là lớp `final` nên không kế thừa được. Vì vậy `NativeAdClip.java` đặt một view rỗng lên đúng phần bị cắt để chuyển chạm xuống WebView. Không cắt thì view đó có kích thước 0, nên không có gì đè lên phần ad đang hiện.

```java
final class NativeAdClip {
  private final NativeAdView ad;
  private final View page, above, below;
  private final Rect clip = new Rect();
  private int top = -1, bottom = -1;

  NativeAdClip(NativeAdView ad, View page) {
    this.ad = ad;
    this.page = page;
    above = cover();
    below = cover();
  }

  private View cover() {
    View v = new View(ad.getContext());
    v.setOnTouchListener((view, e) -> {
      int[] at = new int[2];
      page.getLocationOnScreen(at);
      MotionEvent on = MotionEvent.obtain(e);
      on.setLocation(e.getRawX() - at[0], e.getRawY() - at[1]);
      page.dispatchTouchEvent(on);
      on.recycle();
      return true;
    });
    v.setElevation(1000f);
    ad.addView(v, new FrameLayout.LayoutParams(0, 0));
    return v;
  }

  /** Hiện từ `from` đến `to` (px trong ad; nhỏ hơn 0: không cắt phía đó). */
  void to(int from, int to) {
    int w = ad.getWidth(), h = ad.getHeight();
    int a = from <= 0 ? -1 : Math.min(from, h), b = to < 0 || to >= h ? -1 : to;
    if (a != top || b != bottom) {
      top = a;
      bottom = b;
      if (a < 0 && b < 0) ad.setClipBounds(null);
      else {
        clip.set(0, Math.max(a, 0), w, b < 0 ? h : Math.max(b, Math.max(a, 0)));
        ad.setClipBounds(clip);
      }
    }
    place(above, w, 0, Math.max(a, 0));
    place(below, w, b < 0 ? h : b, h);
  }

  private static void place(View v, int w, int y0, int y1) {
    int r = y1 > y0 ? w : 0, t = y1 > y0 ? y0 : 0, e = y1 > y0 ? y1 : 0;
    if (v.getRight() != r || v.getTop() != t || v.getBottom() != e) v.layout(0, t, r, e);
  }
}
```

Phía JS tính vùng được phép hiện từ những phần tử ghim trên màn hình:

```ts
const OVER_LIST = '.hdr, .x-top, .tabs, .pin, .dock, .foot'
function showBand(el: HTMLElement) {
  let top = 0, bottom = innerHeight
  if (!el.closest('.view')) return { top, bottom }
  const inside = el.closest('.scroller, .view')?.getBoundingClientRect()
  if (inside && !docScrolls()) { top = inside.top; bottom = inside.bottom }
  for (const over of document.querySelectorAll(OVER_LIST)) {
    const r = over.getBoundingClientRect()
    if (!r.height) continue
    if (r.top < innerHeight / 2) top = Math.max(top, r.bottom)
    else bottom = Math.min(bottom, r.top)
  }
  return { top, bottom }
}
```

Màn hình mới có thanh ghim thì phải thêm selector của thanh đó vào `OVER_LIST`. Sheet và popup vẫn được phát hiện bằng `elementFromPoint` (`freeBand`, chạy mỗi 3 frame): nếu đỉnh phần đang hiện bị che thì ẩn ad; nếu một hàng điểm phía dưới bị che (nút nổi) thì cắt ad tại đó.

### 4.4. Hai dòng sửa trong `dist/AdController-DgNyhjYc.js`

```text
rectFlushScheduled=!0,o().then(()=>this.flushNativeAdRects())
  → rectFlushScheduled=!0,Promise.resolve().then(()=>this.flushNativeAdRects())

${Math.round(n.width)},${Math.round(n.height)}`
  → ${Math.round(n.width)},${Math.round(n.height)},${n.scrollY},${n.clipTop},${n.clipBottom}`
```

- **Dòng đầu:** SDK gộp lệnh theo `requestAnimationFrame`, nên khi được gọi từ trong rAF nó chỉ gửi được mỗi 2 frame. Dùng microtask thì không mất frame. Chỉ có ích khi cuộn trong `.view`.
- **Dòng sau:** khóa chống gửi trùng phải tính cả các trường mới, nếu không SDK sẽ bỏ qua thay đổi của `scrollY` và vùng cắt.

### 4.5. Tạo lại patch

`patch-package` không tạo được patch với SDK cài từ file tgz, nhưng vẫn áp được. Cách tạo:

1. Giải nén `vendor/alf-app-sdk-3.0.0.tgz`.
2. Tạo repo git tạm, đặt `core.autocrlf false` (file Java dùng CRLF). Chép bản gốc vào theo đường dẫn `node_modules/@alf/app-sdk/...`, rồi commit.
3. Chép đè các file đã sửa, chạy `git add -A`.
4. `git diff --cached --no-color > patches/@alf+app-sdk+3.0.0.patch`.
5. Khôi phục bản gốc trong `node_modules`, chạy `npx patch-package`, rồi so md5 để chắc patch áp ra đúng file.

Khi nâng phiên bản SDK, tên file trong `dist/` có thể đổi và patch sẽ không áp được.

## 5. Kết quả đo

Cùng một APK, 2 lượt, đổi thứ tự hai cách cuộn giữa các lượt.

| | Home, document | Home, `.view` | Shop, document | Shop, `.view` |
|---|---|---|---|---|
| **Ad lệch so với hàng, trung vị / p90 (CSS px)** | **0,4 / 0,7** | 11 / 38,4 | **0 / 0,4** | 8,9 / 25,2 |
| Frame giật, có ad | 26,6% | 27,3% | 6,5% | 14% |
| Frame giật, không ad | 5,5% | 5% | 4,9% | 6% |
| Tổng một frame, có ad (ms) | 31,4 | 28,1 | 19,6 | 19,8 |

Số lần gửi rect trong một lượt cuộn cũng giảm: Home từ khoảng 110 xuống khoảng 20, Shop từ khoảng 180 xuống khoảng 75.

Khoản tốn lớn còn lại là **ad video đang phát** trên Home, ở cả hai cách cuộn: khoảng 27% frame giật, so với 5% ở các lượt đo sau đó. Cuộn document không chữa được điểm này.

## 6. Các cách đã thử và không dùng

| Cách | Vì sao bỏ |
|---|---|
| Đoán trước vị trí theo tốc độ cuộn, ở JS | Lệch ít hơn nhưng ad vẫn nhảy theo từng lệnh |
| Đoán trước ở native, theo từng vsync | Ad vượt quá rồi kéo về khi tốc độ tay đổi, đúng cảm giác "sợi dây ngắn" |
| Chỉ gửi vị trí mỗi frame thay vì mỗi 2 frame | Giảm không đáng kể (khoảng 10 xuống 8 CSS px) |

Đừng dùng dự đoán: mọi cách đi qua bridge đều đến muộn, và đoán sai còn khó chịu hơn đến muộn.

## 7. Cách đo để khỏi kết luận sai

Những sai lầm dưới đây đều đã xảy ra trong quá trình sửa lỗi này:

- **Đo theo từng pha của frame:** dùng `adb shell dumpsys gfxinfo <package> framestats`. Chính pha `performTraversals` đã lộ ra validator, trong khi profile JS và thử tắt CSS không cho thấy gì.
- **Đo trên cùng một APK, nhiều lượt, đổi thứ tự.** Luôn đo một chế độ trước từng cho kết quả 41% so với 25%, và khi đổi thứ tự thì gần như không còn chênh lệch.
- **Kiểm tra virtual list vẫn hoạt động:** đếm số hàng trong DOM sau khi cuộn sâu. Danh sách bị đứng làm số đo độ mượt đẹp giả.
- **Kiểm tra phép đo đã thật sự chạy:** số giống hệt lần trước là dấu hiệu chỉ phân tích lại dữ liệu cũ.
- **Nhớ khoảng lệch của status bar khi giả lập chạm:** tọa độ trong WebView bắt đầu dưới status bar (35 CSS px trên máy test).
- **Đừng để nút nổi nằm dưới điểm vuốt:** vuốt bắt đầu từ `.event-btn` không cuộn danh sách.
- **Theo dõi vị trí trang từ video:** so frame liền kề, ở vùng dưới ad. Các hàng giống nhau làm phép so với frame đầu khớp nhầm.

## 8. Những gì đã kiểm tra và giới hạn

**Đã kiểm tra trên máy:**
- Virtual list khi cuộn sâu; Home vẫn khoảng 20 hàng trong DOM.
- Giữ vị trí khi quay lại Home, kéo để refresh, popup khóa cuộn.
- Thanh ghim của Shop, danh sách của Onboarding.
- Bấm trúng nút khi nút đè lên phần ad bị cắt.
- Gỡ ad khi rời màn hình.
- Mép cắt khi header trượt về, xem từng frame.

**Chưa kiểm tra:**
- Ad trong story sponsored khi trang cuộn bên dưới.
- Mép cắt ở thanh dưới của Onboarding, sau khi thêm `.foot`.
- Bản release cài trên máy: mọi phép đo đều làm trên bản debug.
- Ad thật: mọi phép đo đều dùng test ad.
- Máy khác: chỉ đo trên một chiếc Galaxy A17, và máy này đang bật Assistant Menu (dịch vụ trợ năng).
- View che phần ad bị cắt có bị AdMob đánh giá gì không: chưa bật validator để xem thử.

**Giới hạn đã biết:**
- Vị trí ad khớp theo từng frame, nhưng vùng cắt vẫn đi qua JS. Nếu header di chuyển rất nhanh, mép cắt có thể trễ vài frame. Lần kiểm tra ở tốc độ cuộn vừa không thấy ad vẽ đè lên header.
- Nếu trang tải lại mà JS không kịp gỡ ad (ví dụ WebView crash), ad có thể kẹt trên màn hình. Trường hợp này chưa được xử lý.
- Giải pháp chỉ áp dụng cho Android. Bản patch không sửa phần iOS của SDK.

## 9. Các file liên quan

| File | Vai trò |
|---|---|
| `game/android/app/src/main/AndroidManifest.xml` | Tắt validator |
| `game/src/composables/pageScroll.ts` | Bật cuộn document, chọn virtualizer |
| `game/src/composables/useNativeAd.ts` | Tính vị trí và vùng hiện, gửi khi thay đổi |
| `game/src/styles/global.css` | CSS của `doc-scroll` |
| `game/src/views/HomeView.vue`, `ShopView.vue`, `OnboardingView.vue` | Các màn cuộn trên document |
| `game/src/composables/dragScroll.ts`, `usePull.ts`, `game/src/App.vue` | Đổi scroller, khóa khi có popup |
| `game/patches/@alf+app-sdk+3.0.0.patch` | Toàn bộ sửa đổi SDK |
| `game/vendor/alf-app-sdk-patches.md` | Ghi chú nội bộ về patch |
