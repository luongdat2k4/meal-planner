# Hướng dẫn chèn native ad vào component game

**Áp dụng cho:** SDK 3.0.0+, game dùng Vue trên Capacitor.

**Trạng thái:** đã đối chiếu với code SDK. Component ở mục 3 chưa được chạy trên máy, nên phải qua checklist ở mục 7 trước khi merge. Tài liệu này thay cho mục 5 của `design-note/chiennt/sdk-guide-1.2.0.md`.

---

## 1\. Quy tắc chính

> **Ô native ad luôn nằm ngoài vùng cuộn và không di chuyển khi người dùng cuộn.**

Native ad là view native nằm **trên** WebView, không phải phần tử DOM. Nếu đặt ad trong list:

- **Cuộn bị trễ:** nội dung cuộn trước, rồi vị trí mới mới đi qua JS và bridge tới ad, nên ad luôn đi sau.  
- **Che component:** `overflow` của list không cắt được ad, nên ad đè lên header và item.

Tối ưu thêm không hết được hai lỗi này. Không gửi vị trí ad khi đang cuộn thì chúng không còn xảy ra.

---

## 2\. Layout chuẩn

Chỉ `.list` được cuộn. Ô ad là phần tử anh em của list, không phải phần tử con:

```html
<div class="screen">
  <header>...</header>
  <div class="list">...</div>
  <NativeAdSlot
    v-if="!adsRemoved && slotVisible"
    pool="small"
    template="small"
    :suspended="popupOpen"
    @settled="(ok) => { slotVisible = ok }"
  />
</div>
```

&nbsp;

```css
.screen { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.list   { flex: 1; min-height: 0; overflow-y: auto; }
.native-ad-slot { flex: none; height: var(--native-ad-height); }
```

Nếu app scale cả khung bằng `transform: scale(var(--app-scale))`, tính chiều cao theo dp thật:

```css
.native-ad-slot { --native-ad-height: calc(330px / var(--app-scale)); }
```

### Vị trí thường dùng

| Màn | Vị trí ô | Template gợi ý |
| :---- | :---- | :---- |
| Home | Panel cố định cuối màn | `small` |
| Danh sách (shop, nhiệm vụ) | Dưới list, list co lại phần còn lại | `small` |
| Kết quả, loading | Vùng riêng giữa màn, xa nút Tiếp tục | `medium` hoặc `mrec` |
| Popup có ad | Footer của popup, ngoài vùng cuộn của popup | `small` |

- `small` không có `MediaView`, nên pool của nó không được xin `request.video`.  
- `mrec` hiện chỉ có trên Android; iOS dùng `medium` thay thế.

---

## 3\. Component `NativeAdSlot.vue`

Dùng chung cho mọi màn. Chọn một trong hai nguồn ad:

- **Pool (khuyên dùng):** truyền `pool` để ad hiện ngay vì đã nạp sẵn.  
- **Trực tiếp:** truyền `slotId` và `adUnitId`.

```vue
<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  pool: { type: String, default: '' },
  slotId: { type: String, default: '' },
  adUnitId: { type: String, default: undefined },
  template: { type: String, default: 'small' },
  request: { type: Object, default: () => ({}) }, // phải giống request của pool
  suspended: { type: Boolean, default: false },   // có overlay đang đè lên ô
})
const emit = defineEmits(['settled'])

const Ads = ALF.Instance.Ads
const box = ref(null)
let alive = true
let started = false
let showing = false
let everShown = false
let current = null // { slot, adUnitId }
let observer = null

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

function measure() {
  const r = box.value?.getBoundingClientRect()
  if (!r || r.width <= 0 || r.height <= 0) return null
  return { x: r.left, y: r.top, width: r.width, height: r.height }
}

async function show() {
  const rect = measure()
  if (!rect || !current || props.suspended) return

  showing = true
  const ok = await Ads.ShowAdMobNativeAd({
    ...props.request,
    slot: current.slot,
    adUnitId: current.adUnitId,
    template: props.template,
    rect,
  })
  showing = false
  if (ok) everShown = true

  // Màn đã đóng trong lúc chờ: gỡ ad để không sót lại trên màn mới.
  if (!alive) return void Ads.DestroyAdMobNativeAd(current.slot)
  // Popup mở trong lúc chờ: giữ ad, chờ popup đóng rồi hiện lại.
  if (props.suspended) return void Ads.HideAdMobNativeAd(current.slot)

  if (!ok && props.pool) {
    Ads.NativePool.Discard(current)
    current = null
  }
  emit('settled', ok)
}

async function start() {
  if (started) return
  started = true

  await Ads.WhenScreenSettled()
  await nextFrame()
  await nextFrame() // chờ layout và scale áp xong rồi mới đo
  if (!alive) return

  current = props.pool
    ? await Ads.NativePool.Acquire(props.pool, { maxWaitMs: 6000, isCurrent: () => alive })
    : { slot: props.slotId, adUnitId: props.adUnitId }

  if (!current) return emit('settled', false)
  if (!alive) {
    if (props.pool) Ads.NativePool.GiveBack(current)
    return
  }
  await show()
}

// Chỉ chạy khi layout đổi, tuyệt đối không gắn vào sự kiện scroll.
async function syncRect() {
  await nextFrame()
  await nextFrame()
  if (!alive || !everShown || props.suspended) return
  const rect = measure()
  if (rect) Ads.UpdateAdMobNativeAdRect(rect, current.slot)
}

onMounted(() => {
  window.addEventListener('resize', syncRect, { passive: true })
  // Theo dõi khung cha: banner hiện lên làm ô đổi vị trí mà không đổi kích thước.
  observer = new ResizeObserver(syncRect)
  observer.observe(box.value.parentElement)
  if (!props.suspended) start()
})

watch(() => props.suspended, (suspended) => {
  if (suspended) {
    if (current) Ads.HideAdMobNativeAd(current.slot)
  } else if (current) {
    show() // dùng lại view cũ, không tính thêm impression
  } else {
    start()
  }
})

onUnmounted(() => {
  alive = false
  observer?.disconnect()
  window.removeEventListener('resize', syncRect)
  if (!current) return

  if (showing || everShown || !props.pool) Ads.DestroyAdMobNativeAd(current.slot)
  else Ads.NativePool.GiveBack(current) // lấy ra nhưng chưa hiện thì trả về pool
})
</script>

<template>
  <div ref="box" class="native-ad-slot" />
</template>
```

&nbsp;

---

## 4\. Những điều bắt buộc

| \# | Quy tắc | Lý do |
| :---- | :---- | :---- |
| 1 | Không đặt ô trong phần tử có `overflow: auto/scroll`, kể cả `sticky` hay `fixed` | Ô sẽ đi theo scroll hoặc không khớp với list |
| 2 | Không gọi `UpdateAdMobNativeAdRect` từ sự kiện `scroll` | Đây là nguyên nhân gây trễ |
| 3 | Không dùng transition, GSAP hay fade trên ô ad và khung cha của nó | View native không đi theo CSS của DOM |
| 4 | Mọi popup, tooltip, menu có thể đè lên ô phải bật `suspended` | z-index không thắng được view native |
| 5 | Popup có animation thì chỉ mount ô sau khi animation xong | `WhenScreenSettled` chỉ biết chuyển màn, không biết animation của popup |
| 6 | Không dùng `Promise.all` để show nhiều ô | SDK tự xếp hàng, cách nhau `nativeShowGapMs` |
| 7 | Mỗi ô dùng `slot` riêng. Trên iOS còn phải dùng `adUnitId` riêng | Plugin iOS đang quản lý ad theo `adUnitId`, chưa theo `slot` |
| 8 | Không tự vẽ ad bằng HTML từ dữ liệu `LoadAdMobNativeAd` | Không có impression, click không hoạt động, vi phạm chính sách |
| 9 | Chuyển màn không qua `Screen.NavigateTo` thì gọi `Ads.NotifyScreenChange(routerPromise, animationMs)` | Nếu không, `WhenScreenSettled` không biết màn đang đổi |

---

## 5\. Vị trí và chính sách

Các điểm dưới đây lấy từ hướng dẫn triển khai và hướng dẫn banner của AdMob, chưa phải quy định riêng cho native. Trước khi phát hành, hãy đối chiếu thêm với checklist chính sách native của AdMob.

- Không đặt ô sát nút bấm hoặc thanh menu, vì [dễ gây click nhầm](https://support.google.com/admob/answer/6275345?hl=en-GB).  
- Cách banner ít nhất **48dp**, kể cả trên máy 16:9 khi khung game dính sát banner (quy ước nội bộ).  
- Không đặt ở màn gameplay đang thao tác liên tục.  
- [Giữ sẵn chỗ cho ad](https://support.google.com/admob/answer/2936217?hl=en) để ad không đẩy hoặc che nội dung.  
- [Không để ad cản nội dung và chức năng chính](https://support.google.com/admob/answer/3342054?hl=en). Với máy nhỏ, phải kiểm tra list còn đủ chỗ dùng.

---

## 6\. Trường hợp thường gặp

| Tình huống | Cách xử lý |
| :---- | :---- |
| Không có ad hoặc đã mua gỡ ad | `settled(false)` thì ẩn ô bằng `v-if`, list tự giãn ra. Trạng thái gỡ ad nên kiểm tra trước khi mount để ô không hiện thoáng qua |
| Màn có 2 ô | Đặt 2 `NativeAdSlot` với `slot` riêng. Ô thứ hai lên trễ khoảng 300ms là bình thường |
| Popup có ad đè lên màn có ad | Bật `suspended` cho ô của màn dưới, rồi mount ô của popup sau khi popup mở xong |
| Banner xuất hiện sau | Component tự đo lại qua `ResizeObserver` trên khung cha |
| Ad bắt buộc phải nằm trong list |  |

---

## 7\. Checklist nghiệm thu

Kiểm tra trên máy thật, gồm cả máy yếu (ví dụ SM-A166P), và làm cả với `testAds: false`:

- [ ] Cuộn nhanh liên tục: ad đứng yên, không đè header hay item.  
- [ ] Logcat không có `updateNativeAdRect` trong lúc cuộn.  
- [ ] Mở popup thì ad ẩn; đóng popup thì ad hiện lại và không phát thêm sự kiện `impression`.  
- [ ] Chuyển màn trong lúc ad đang nạp: không có ad sót lại ở màn mới.  
- [ ] Banner xuất hiện, xoay hoặc đổi kích thước màn hình: ad vẫn khớp đúng ô.  
- [ ] Không có ad hoặc đã gỡ ad: ô biến mất và list giãn đúng.  
- [ ] Impression và `paid` trên mỗi phiên không giảm so với bản trước.  
- [ ] Pool `small` không xin video (không có cảnh báo video trong log).

---