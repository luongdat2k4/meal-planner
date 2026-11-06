# Chống giật layout khi thêm quảng cáo

Dành cho app web trong Capacitor (Vue 3), quảng cáo native của AppLovin MAX (banner, MREC dùng làm "native") vẽ đè lên WebView. Các ví dụ lấy từ app Pulse, thư mục `App/src/features/ads/`.

**Trạng thái kiểm chứng:** logic đã qua `vue-tsc`, `npm run build`, và kiểm tra bố cục trên trình duyệt. **Chưa kiểm tra trên máy thật** vì quảng cáo chỉ hiện ở bản native. Mục 8 nêu rõ phần nào đã và chưa kiểm tra.

---

## 1. Vấn đề

Quảng cáo đến muộn và không chắc chắn: SDK khởi tạo xong mới biết, quảng cáo tải xong mới có, và có thể không bao giờ có (no fill). Nếu layout chỉ thêm ô quảng cáo khi "đã có", mỗi lần như vậy nội dung bên dưới bị đẩy xuống hoặc kéo lên:

| Cách làm dễ mắc | Hậu quả |
|---|---|
| `v-if="adsAvailable"` bao quanh ô quảng cáo | SDK khởi tạo xong thì cả trang dịch xuống một đoạn |
| Lấy chiều cao banner bằng một lệnh bất đồng bộ rồi mới chừa chỗ | Phần đáy trang nhảy sau khi lệnh trả về |
| Ẩn ô khi quảng cáo lỗi hoặc quá lâu | Nội dung bên dưới kéo lên đột ngột, có thể vài chục giây sau khi người dùng đã vào màn |
| Mỗi màn tự đo chiều cao banner riêng | Mỗi màn có một khoảnh khắc nhảy khác nhau, khó sửa đồng bộ |

Nguyên tắc rút ra: **chỗ chứa quảng cáo phải có từ khung hình đầu tiên và không đổi kích thước theo trạng thái của quảng cáo.** Quảng cáo chỉ được phép "lấp vào" chỗ đã có, không được "tạo ra" chỗ.

## 2. Năm quy tắc

1. **Giữ chỗ không phụ thuộc quảng cáo.** Điều kiện giữ chỗ chỉ nên hỏi "thiết bị này có vẽ quảng cáo native không" (`Capacitor.isNativePlatform()`), không hỏi SDK đã sẵn sàng chưa hoặc đã có quảng cáo chưa.
2. **Chiều cao biết ngay, đồng bộ.** Dùng hằng số hợp lý làm giá trị đầu, rồi chỉnh khi native trả lời. Không chờ lệnh bất đồng bộ trước khi chừa chỗ.
3. **Một nguồn chiều cao dùng chung.** Mọi màn đọc cùng một giá trị, không màn nào tự đo.
4. **Trạng thái đổi giao diện bên trong khung, không đổi kích thước khung.** Đang tải thì shimmer, hết hạn hoặc lỗi thì nền tĩnh, có quảng cáo thì quảng cáo phủ lên. Ba trạng thái này cùng một kích thước.
5. **Thay đổi kích thước chỉ được do sự kiện của người dùng gây ra** (mở bàn phím, mở popup, quảng cáo toàn màn hình), không do tiến độ tải quảng cáo.

## 3. Cách làm

### 3.1. Điều kiện giữ chỗ và chiều cao dùng chung

`banner.ts`:

```ts
// Quảng cáo native chỉ có trên thiết bị. Chỗ của chúng được giữ từ khung hình đầu,
// trước khi biết có quảng cáo hay không, để banner hay native ad đến (hoặc không đến)
// không làm layout dịch chuyển.
export const adsPossible = Capacitor.isNativePlatform()

// Banner điện thoại cao 50px (tablet 90px, được chỉnh ngay khi native trả lời).
export const bannerHeight = ref(adsPossible ? 50 : 0)

export function syncBannerHeight() {
  if (adsPossible) void bannerHeightPx().then(h => { bannerHeight.value = h })
}
```

`bannerHeightPx()` chỉ gọi native một lần (`heightRequest ??= ...`). `syncBannerHeight()` được gọi một lần sau khi SDK khởi tạo xong. Trên điện thoại phần lớn giá trị 50 là đúng nên không có lần nhảy nào.

### 3.2. Dải banner

Dải giữ chỗ phụ thuộc `adsPossible`, không phụ thuộc quảng cáo:

```vue
<!-- App.vue -->
<div v-if="adsPossible" v-show="shellBanner" class="fixed inset-x-0 bottom-0 z-20 bg-[#F5F4F2]"
     :style="{ height: `${bannerHeight}px` }">
  <BannerAd :visible="shellBanner" />
</div>
```

`shellBanner` chỉ phụ thuộc vào các sự kiện của người dùng:

```ts
const shellBanner = computed(() => adsPossible && !fullScreenShowing.value && !nativeOverlayHold.value
  && !keyboardOpen.value && phase.value === 'idle' && !result.value && !editingProfile.value && /* route */)
```

Quan trọng: **không có `adsAvailable`, `bannerState` hay "banner đã tải" trong điều kiện này.** Nội dung chừa chỗ cũng đọc cùng giá trị (`--banner-inset`), nên dải và phần đệm đổi cùng lúc.

Phần chữ bên trong dải (`BannerAd.vue`) chỉ đổi lớp CSS:

```vue
<div v-if="native" class="w-full shrink-0"
     :class="bannerLoading() ? 'skeleton' : ''"
     :style="{ height: `${height}px` }" aria-hidden="true" />
```

### 3.3. Ô native (MREC trong feed)

`NativeAd.vue` luôn dựng ô khi `native && mrecEnabled`, kể cả khi chưa có quảng cáo:

```vue
<div v-if="native && mrecEnabled" ref="box"
     class="w-full shrink-0 overflow-hidden rounded-[24px]"
     :class="mrecLoading() ? 'skeleton' : 'bg-[#F1EEEB]'"
     :style="{ height: `${MREC_HEIGHT}px` }" aria-hidden="true" />
```

Chiều cao cố định 250px (MREC luôn 300×250, template không đổi kích thước). `InFeedAd.vue` cũng chỉ hỏi `adsPossible && mrecEnabled`; nhãn "Ad" cũng luôn có mặt để bố cục của feed giữ nguyên.

### 3.4. Trạng thái bên trong khung

`mrec.ts` và `banner.ts` dùng cùng một bộ trạng thái:

| Trạng thái | Ý nghĩa | Khung hiển thị |
|---|---|---|
| `idle` / `loading` | Chưa có quảng cáo, đang tải | shimmer |
| `slow` | Quá 10 giây chưa có | nền tĩnh, **giữ nguyên kích thước**; quảng cáo vẫn được tải tiếp và lấp vào nếu về |
| `ready` | Có quảng cáo | quảng cáo native phủ lên đúng khung |
| `failed` / `retry` | MAX báo thất bại, thử lại nền (tối đa 3 lần, cách 30 giây) | nền tĩnh, thử lại **im lặng** |

Hai điểm tinh tế:

- MAX thử lại cấp số nhân (khoảng 2, 4, 8, 16, 32 giây) trước khi báo lỗi, tổng khoảng **64 giây**. Không chờ nó: mốc 10 giây (`LOADING_MS`) chỉ để **dừng animation shimmer**, không để thu ô.
- Các lần thử lại sau lỗi dùng trạng thái riêng (`retry`) không hiện lại shimmer, để khung không nhấp nháy mỗi nửa phút.

Đoạn điều khiển:

```ts
export function preloadMrec(silent = false) {
  if (!mrecEnabled || ['loading', 'slow', 'retry', 'ready'].includes(mrecState.value)) return
  mrecState.value = silent ? 'retry' : 'loading'
  if (!silent) setTimeout(() => { if (mrecState.value === 'loading') mrecState.value = 'slow' }, LOADING_MS)
  /* ... createMRec(...).then(onLoaded, onFailed) */
}
```

### 3.5. Tải sẵn để ô có hàng sớm

Giữ chỗ giải quyết giật layout, tải sẵn giải quyết thời gian chờ. Hai việc độc lập nhưng nên làm cùng nhau:

- Tạo banner và MREC ngay khi SDK sẵn sàng (`preloadBanner()`, `preloadMrec()` trong `initializeAds`), không đợi view dựng. Plugin MAX (`createBanner`, `createMRec`) hoàn tất khi quảng cáo đầu tiên **đã tải xong**, nên promise đó chính là tín hiệu "có hàng", và phải `await` ngoài hàng đợi để không chặn việc dời vị trí.
- Với MAX, `LoadBannerAd` của SDK **không** tạo banner MAX (việc đó nằm trong `ShowBannerAd`). Gọi `ALFAppLovinMAX.createBanner` trực tiếp mới thật sự tải sẵn.
- Khởi tạo quảng cáo song song với mở database, và chỉ chờ MAX (AdMob chạy nền).

### 3.6. Một MREC dùng chung

Một view MREC được tạo một lần rồi chỉ di chuyển, hiện, ẩn, không huỷ (tạo mới phải tải lại, chậm). Slot nào hỏi sau cùng thì nhận quảng cáo. Nếu slot hỏi lúc quảng cáo chưa tải xong, nó được nhớ lại và nhận quảng cáo ngay khi có. Điều này không liên quan trực tiếp tới layout, nhưng nó là lý do ô trống không bao giờ cần "chờ rồi mới dựng".

## 4. Những chỗ cần thống nhất khi áp dụng cho nhiều màn

Thay mọi chỗ kiểu này:

```ts
// Trước: mỗi màn tự đo, và chỉ giữ chỗ khi mọi thứ đã sẵn sàng
const bannerHeight = ref(0)
const showBanner = computed(() => adsAvailable.value && bannerHeight.value > 0 && ...)
onMounted(async () => { bannerHeight.value = await ALF.Instance.Ads.GetAdHeight('banner') })
```

bằng:

```ts
// Sau: một nguồn, có ngay từ đầu
import { adsPossible, bannerHeight } from '@/features/ads/banner'
const showBanner = computed(() => adsPossible && /* sự kiện của người dùng */)
```

Danh sách màn đã đổi trong Pulse: App shell, màn bắt đầu, onboarding, hồ sơ, kết quả buổi tập, màn tập, và ba chỗ đặt `NativeAd` (onboarding, hồ sơ ngôn ngữ, hồ sơ huấn luyện).

## 5. Checklist khi thêm một ô quảng cáo mới

- [ ] Điều kiện `v-if` của ô chỉ gồm "có thể có quảng cáo trên thiết bị này" và cấu hình (có ad unit chưa), **không** gồm trạng thái SDK hay trạng thái tải.
- [ ] Chiều cao của ô là hằng số hoặc đọc từ nguồn dùng chung, không từ lệnh bất đồng bộ trong `onMounted`.
- [ ] Ô có khung shimmer khi chưa có quảng cáo, nền tĩnh khi quá lâu hoặc lỗi, cùng một kích thước.
- [ ] Không có chỗ nào thu ô lại vì quảng cáo chậm hoặc lỗi.
- [ ] Quảng cáo được tạo sẵn lúc khởi tạo, không đợi ô được dựng.
- [ ] Nếu màn có phần đệm chừa chỗ cho banner, nó đọc cùng `bannerHeight` với dải banner.
- [ ] Ô có `data-ad-scroll-region` hoặc nằm cuộn theo cửa sổ đã được tính để quảng cáo không đè lên thanh dính và banner (xem `native-ad-slot-guide.md` và `native-ad-scroll-fix.md`).

## 6. Đánh đổi cần chấp nhận

- **Khoảng trống khi không có quảng cáo.** Nếu unit no fill vĩnh viễn, mỗi ô và dải banner là một khoảng xám cố định. Đây là hệ quả trực tiếp của ưu tiên layout ổn định. Cách giảm: cấu hình mạng trong MAX để unit có fill, hoặc tắt hẳn quảng cáo bằng cấu hình (khi đó `adsPossible` và `mrecEnabled` là `false`, không chừa chỗ).
- **Tablet có thể nhảy một lần.** Giá trị đầu 50, tablet thật là 90, nên một thiết bị tablet có thể điều chỉnh một lần khi native trả lời. Có thể đặt giá trị đầu theo `window.innerWidth >= 600` nếu cần.
- **Sự kiện của người dùng vẫn đổi layout.** Mở bàn phím hay popup ẩn banner theo thiết kế (quy tắc 5).

## 7. Những điều đã thử và không dùng

| Cách | Vì sao bỏ |
|---|---|
| Ẩn ô khi quảng cáo lỗi (collapse) | Phiên bản đầu của Pulse làm vậy; layout nhảy sau 10 đến 64 giây, đúng lúc người dùng đang đọc |
| Chờ SDK sẵn sàng rồi mới dựng ô | Cả trang dịch một đoạn ngay sau khi khởi động |
| Mỗi màn tự gọi `GetAdHeight` | Lệnh bất đồng bộ trả về lệch nhau, giá trị lúc đầu bằng 0 |
| `position: fixed` banner không chừa đệm cho nội dung | Banner che phần cuối nội dung |

## 8. Đã kiểm tra và giới hạn

**Đã kiểm tra:**
- `vue-tsc --noEmit`, `npm run build` qua.
- Màn chào onboarding: kích thước các thẻ đều nhau, vị trí không đổi giữa các slide, đã đo trên 360×640 và 375×812. (Phần này không liên quan trực tiếp tới quảng cáo nhưng cùng mục tiêu ổn định bố cục.)
- Web không dựng ô quảng cáo (`adsPossible = false`), console sạch.

**Chưa kiểm tra:**
- Hành vi của ô giữ chỗ trên máy Android thật, bao gồm lúc quảng cáo về muộn và lúc no fill.
- Tablet.
- Quảng cáo thật: log thiết bị cho thấy các unit banner và MREC hiện trả no fill (mã 204), nên chưa thấy quảng cáo nào phủ lên khung. Cần thêm thiết bị vào Test Devices của MAX để có quảng cáo thử.

## 9. Các file liên quan

| File | Vai trò |
|---|---|
| `App/src/features/ads/banner.ts` | `adsPossible`, `bannerHeight`, trạng thái và tải sẵn banner |
| `App/src/features/ads/mrec.ts` | Trạng thái và tải sẵn MREC dùng chung |
| `App/src/features/ads/components/NativeAd.vue` | Ô native luôn có mặt, shimmer hoặc nền tĩnh |
| `App/src/features/ads/components/InFeedAd.vue` | Ô trong feed, nhãn "Ad" luôn có |
| `App/src/features/ads/components/BannerAd.vue` | Dải banner, chiều cao đồng bộ, shimmer khi tải |
| `App/src/App.vue` | Dải banner của shell, `shellBanner` chỉ phụ thuộc sự kiện người dùng |
| `App/src/features/ads/adRuntime.ts` | Gọi `preloadBanner`, `preloadMrec`, `syncBannerHeight` lúc khởi tạo |
