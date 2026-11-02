# Kế hoạch tích hợp quảng cáo — Meal Planner

Ngày lập: 02/11/2026 (sửa lần 2 cùng ngày: bỏ Interstitial, đối chiếu từng điều khoản policy)  
Tham khảo cách làm: [`ads-by-view.md`](./ads-by-view.md). **Chuẩn bắt buộc phải tuân thủ:** [`../ads_policy_interstitial_banner_native.md`](../ads_policy_interstitial_banner_native.md).  
Phạm vi khảo sát: `App/src` (router, `App.vue`, các view, `BottomSheet`, `sdk.ts` cũ) và API `@alf/app-sdk` 1.9.0 (`AdController`, `ad.types`, `sdk-guide.md`).  
Chính sách chính thức của AdMob, Google Play, Apple luôn là nguồn quyết định; phải đối chiếu lại trước khi phát hành.

## 1. Quyết định đã chốt

| Nội dung | Quyết định |
|---|---|
| Interstitial | **Bỏ hoàn toàn.** Không load, không show, không có điểm kích hoạt. |
| App Open | **Chưa làm** (chưa nằm trong phạm vi lần này; policy yêu cầu xem xét riêng khi dùng lúc mở app). |
| Phạm vi view | Chỉ thêm vào **các view hiện có**: banner + native. Không thêm màn/route mới. |
| Onboarding | **Có** native (màn ngôn ngữ và 3 slide giới thiệu). |
| Khoá quảng cáo | Dùng **khoá test** hiện có trong `features/ads/adsConfig.ts` (`testAds: true`). Chưa cần khoá thật, chưa xử lý consent/UMP. |
| Chưa làm trong đợt này | Rewarded, MREC, Offerwall, Interstitial, App Open, khoá thật, consent, gói "bỏ quảng cáo". |

## 2. Hiện trạng

- Trước đợt này `src/app/sdk.ts` gọi `initSDK` (khởi động cả analytics, push, IAP). Đã bỏ file đó, thay bằng `adsConfig.ts`/`adRuntime.ts` chỉ khởi tạo quảng cáo, theo WorkoutApp.
- App chưa có component quảng cáo nào. Trên trình duyệt web các API quảng cáo không hiện gì, nên mọi kiểm thử hiển thị phải làm trên Android/iOS (build Android hiện bị chặn vì không tải được thư viện từ `maven.applovin.com`).
- Banner của SDK **chỉ neo ở mép đáy hoặc đỉnh màn hình** (`BannerPosition = 'TOP_CENTER' | 'BOTTOM_CENTER'`, không có offset). Native là view thật vẽ **trên** WebView, định vị bằng `rect` (toạ độ CSS của viewport), không bị cắt bởi phần tử web nào.
- `GetAdHeight('banner')` trả 50 (điện thoại) hoặc 90 (máy tính bảng), không phải chiều cao thật của banner adaptive.

### Luồng và chrome của app

```text
Mở app → router.beforeEach theo cờ trong localStorage (meal-planner:flow)
  languageChosen=false → /onboarding/language   (fullscreen)
  onboardingSeen=false → /onboarding            (fullscreen, 3 slide, footer dots + nút)
  setupDone=false      → /setup                 (fullscreen, 5 bước + màn phủ "đang tạo kế hoạch")
  xong                 → /home

Shell (không fullscreen): header sticky + <main> + tab bar cố định đáy (z-30)
  tab: /home · /planner · /meals · /shopping      nút giữa: QuickSuggestSheet
  trang con: /settings, /settings/language, /settings/reminder, /settings/preferences, /ingredients
Fullscreen khác: /meals/:id (thanh nút "Nấu" cố định đáy)
Bottom sheet (Teleport, z-50): QuickSuggestSheet, ImportRangeSheet
```

## 3. Đối chiếu policy → thiết kế

### Banner (policy §2)

| Điều khoản | Cách đáp ứng |
|---|---|
| Vùng riêng, không che nội dung/nút | Banner nằm ở mép đáy; tab bar được **đẩy lên** đúng bằng chiều cao banner + khoảng cách; `<main>` cộng cùng giá trị vào padding đáy để nội dung cuối cuộn tới không bị che. |
| Không sát nút điều hướng/vùng cuộn | Khoảng cách tối thiểu **12px** giữa mép trên banner và mép dưới tab bar (hằng số `BANNER_GAP`). Không đặt banner ở route có nút cố định đáy khác (`/meals/:id`). |
| Không giả điều khiển của app | Banner do SDK vẽ, không bọc thêm khung giống nút. |
| Anchored adaptive ưu tiên khi phù hợp | **Lệch có chủ đích:** dùng cỡ cố định `BANNER` (320×50) vì web không biết chiều cao thật của adaptive, cần dự trữ đúng chỗ để không nhảy layout. Có thể đổi sang adaptive khi đã đo được chiều cao thật trên máy. |
| Tôn trọng safe area/thanh điều hướng | Tab bar giữ padding `env(safe-area-inset-bottom)` của mình; chưa biết banner có tự tránh thanh điều hướng hệ thống không → **mục kiểm tra bắt buộc trên máy thật**. |
| Dành sẵn chỗ để tránh layout shift | Biến CSS `--ad-bottom` được đặt **trước** khi gọi hiện banner. |
| Không đè bàn phím ảo | Ẩn banner khi có `input`/`textarea` được focus. |
| Test ads khi phát triển | `testAds: true`. |

### Native (policy §3)

| Điều khoản | Cách đáp ứng |
|---|---|
| Nhận diện rõ là quảng cáo | Mỗi native có dòng nhãn **"Quảng cáo"/"Ad"** (i18n) ngay trên khung; thêm vào đó mẫu của SDK tự có badge và AdChoices — không che, không chỉnh. |
| Không ngụy trang nội dung | Khung native tách khỏi thẻ món ăn/hàng cài đặt bằng khoảng trống và nhãn riêng; không dùng cùng kiểu thẻ `bg-card` của nội dung. |
| Không chèn vào chỗ người dùng tưởng là mục họ chọn | Không đặt giữa danh sách chọn: ở màn ngôn ngữ nằm **dưới** danh sách radio và tách bằng khoảng cách; không đặt giữa các hàng cài đặt. |
| Không CTA giả | Không vẽ nút nào chồng lên native. |
| Không quá nhiều liên tiếp | **Tối đa một native** nhìn thấy mỗi view. |
| Không che AdChoices/asset | Native view do SDK vẽ; web không đè lên. Placeholder bị ẩn nếu rơi dưới header/tab bar (xem §4). |
| Không click/impression giả | Không tự gọi click/impression; chỉ **lắng nghe** event. |

### Chung (policy §4)

| Điều khoản | Cách đáp ứng |
|---|---|
| Không quảng cáo cạnh nội dung bị cấm | App nấu ăn, không thuộc nhóm hạn chế. |
| Test các tình huống offline/lỗi/nền-foreground/xoay | Mục 7. |
| Privacy Policy, Data safety, consent (UMP), Families | **Chưa làm** (đang dùng khoá test); là điều kiện chặn phát hành, ghi ở mục 8. |
| Interstitial/App Open | Không dùng ⇒ các điều khoản về Interstitial không áp dụng. |

## 4. Quảng cáo theo view

| View / trạng thái | Quảng cáo | Vị trí và điều kiện |
|---|---|---|
| `/onboarding/language` | Banner + native small | Dưới danh sách ngôn ngữ, cách danh sách ≥ 24px, nằm trong vùng cuộn; chỉ hiện nếu viewport cao ≥ 760px. Banner ở dải riêng dưới cùng, cách nút Tiếp tục ≥ 12px (nút nằm trong phần trang đã trừ chỗ banner). Cách nút Tiếp tục bởi phần `flex-1` của trang. |
| `/onboarding` (3 slide) | Banner + native small | **Một** native cố định giữa vùng slide và footer, ngoài vùng vuốt (không tải lại khi đổi slide); chỉ hiện nếu viewport cao ≥ 880px. Banner như màn ngôn ngữ. Cách footer (dots + nút) ≥ 16px. |
| `/setup` (5 bước) | Banner | Không native (đang nhập dữ liệu cá nhân, wheel giờ). Banner ở dải riêng dưới cùng, nút Tiếp tục nằm trong phần trang đã trừ chỗ banner; ở màn fullscreen cuộn được, dải này dính đáy và có nền đặc để nội dung không trượt xuống dưới banner. |
| Màn phủ "đang tạo kế hoạch" | Không | Banner tạm ẩn khi màn phủ hiện. |
| `/home` | Banner + native small | Native sau khối "Kế hoạch hôm nay", tách khỏi thẻ món; hiện khi nằm trọn giữa header/avatar và tab bar. |
| `/planner` | Banner | Lưới thao tác dày, không native. |
| `/meals` | Banner | Không native: lưới ảo hoá đo chiều cao hàng, và native vẽ đè khi cuộn. |
| `/meals/:id` | Không | Fullscreen, thanh "Nấu" cố định đáy. |
| `/shopping` | Banner + native small | Native sau danh sách khi có ≥ 5 mục chưa tick, không sát nút "Xoá đã mua" / nút thêm. |
| `/ingredients` | Banner | Có ô tìm kiếm: ẩn khi bàn phím hiện. |
| `/settings` | Banner | Không native giữa các hàng. |
| `/settings/language` | Banner + native small | Native dưới danh sách ngôn ngữ, tách bằng khoảng cách. |
| `/settings/preferences` | Banner | Chỉ chọn chip/nút, không nhập chữ; banner ở dải riêng dưới tab bar, không native. |
| `/settings/reminder` | Banner + native small | Native dưới thẻ cài đặt, cách ≥ 24px, chỉ hiện khi viewport cao ≥ 700px và khung nằm trọn giữa header và tab bar (khi bật nhắc, phần chọn ngày/giờ dài ra thì native tự ẩn). |
| `QuickSuggestSheet`, `ImportRangeSheet` | Không | Khi sheet mở: **ẩn banner và native** (native vẽ trên WebView sẽ đè lên sheet). |

## 5. Kiến trúc

Feature `App/src/features/ads/`, cùng cấu trúc với `WorkoutApp/App/src/features/ads`:

| File | Vai trò |
|---|---|
| `adsConfig.ts` | Cấu hình SDK (khoá test, `testAds: true`), hằng số vị trí (`BANNER_GAP`, chiều cao native) và `initAds()`: **chỉ khởi tạo quảng cáo** (`initControllers` → `Config.set` → `Ads.initAdMob`), không gọi `initSDK` nên không khởi động analytics, push, IAP. |
| `adRuntime.ts` | Trạng thái dùng chung: `adsAvailable` (native + đã init), `adsSuppressed` (sheet mở hoặc bàn phím hiện), `initializeAds()`, `useOverlayFlag()`. |
| `components/BannerAd.vue` | Tạo banner khi mount, huỷ khi unmount; đặt biến `--ad-bottom` để tab bar và padding trang nhường chỗ. `App.vue` chỉ gắn khi `route.meta.ads.banner` và không bị suppress. |
| `components/NativeAd.vue` | Khung giữ chỗ, theo dõi rect, hiện/ẩn native theo vùng giữa header và tab bar, theo `adsSuppressed`, theo KeepAlive. |
| `components/InFeedAd.vue` | `NativeAd` kèm nhãn "Quảng cáo"/"Ad"; tự biến mất khi load lỗi hoặc màn quá thấp. Các view dùng component này. |

Android (theo WorkoutApp): `AndroidManifest.xml` khai báo `com.google.android.gms.ads.APPLICATION_ID` (khớp `adsConfig.ts`); `android/build.gradle` thêm các kho Maven của mạng quảng cáo (applovin, mintegral, pangle, bidmachine); `package.json` chỉ giữ các plugin app thực sự dùng (`local-notifications`, `status-bar`), không cài các plugin phụ của SDK.

Sửa file hiện có: `main.ts` (gọi `initializeAds()`), `route-meta.d.ts` + `routes.ts` (`meta.ads`), `App.vue` (gắn `BannerAd`, `--ad-bottom`, đánh dấu vùng chrome), `shared/ui/BottomSheet.vue` (đếm overlay), `shared/languages/{vn,en}.json` (nhãn), và 5 view gắn `InFeedAd`.

### Điểm kỹ thuật

- **Vùng chrome**: tab bar, header sticky, dải status bar và nút avatar được đánh dấu `data-ad-chrome="top|bottom"`; `NativeAd` chỉ hiện khi placeholder nằm trọn giữa các vùng đó (view native không thể bị cắt nên chỉ hiện/ẩn nguyên khối).
- **Màn KeepAlive** (`HomeView`, `ShoppingView`): ẩn native ở `onDeactivated`, hiện lại ở `onActivated`; huỷ ở `onBeforeUnmount`.
- **Mỗi native một `slot` riêng** (`home`, `shopping`, `lang`, `onboarding`, `settings-lang`).
- **Hiệu năng**: cập nhật rect bằng `requestAnimationFrame` khi cuộn. Hiệu năng cuộn là điểm nhạy của app này (từng GPU-bound), cần đo lại sau khi thêm native vào `/home` và `/shopping`.
- **Web**: `Capacitor.isNativePlatform()` false ⇒ không render nhãn/khung, không dự trữ chỗ banner.

## 6. Các bước triển khai

| # | Bước | Xong khi |
|---|---|---|
| 1 | `features/ads` (adsConfig, adRuntime), nhãn i18n, `meta.ads`, hook `BottomSheet` | Typecheck qua; web chạy như cũ |
| 2 | `components/BannerAd` + `--ad-bottom` trong `App.vue` | Tab bar/nội dung không bị che trên máy thật |
| 3 | `components/NativeAd`, `InFeedAd` + gắn vào 5 view | Một native/view, có nhãn, ẩn đúng lúc |
| 4 | Kiểm thử thiết bị (mục 7) | Đạt mục 7 |

## 7. Tiêu chí nghiệm thu / kiểm thử (trên thiết bị)

- Không có quảng cáo ở `/meals/:id`, màn phủ "đang tạo kế hoạch", khi bottom sheet mở, khi bàn phím hiện.
- Banner không che tab bar, nội dung cuối trang cuộn tới được, khoảng cách banner–tab bar ≥ 12px; kiểm tra máy có notch + thanh cử chỉ + thanh điều hướng 3 nút.
- Native luôn có nhãn "Quảng cáo", AdChoices nhìn thấy, không đè lên header/tab bar/sheet, không có hơn một native mỗi view.
- Offline, không fill, nền/foreground, xoay màn hình, màn thấp, đổi ngôn ngữ vn/en. Chỉ dùng test ads, không click/impression giả.
- Đo FPS khi cuộn `/home`, `/shopping` có native so với bản không native.

## 8. Điều kiện trước khi phát hành (chưa làm)

Khoá AdMob thật + `testAds: false`; consent theo khu vực (UMP); Privacy Policy; khai báo Data safety / App Privacy; kiểm tra Families nếu áp dụng; đối chiếu lại AdMob policies, Google Play Ads policy (và Apple nếu phát hành iOS); không còn cảnh báo `TEST ADS ON` trong console.
