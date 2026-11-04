# @alf/app-sdk 3.0.0 — Hướng dẫn import vào project mới

> Dành cho dev bắt đầu một app **mới tinh** (chưa có gì) và muốn dùng `@alf/app-sdk@3.0.0`.
> Đi từ `npm create vite` tới chạy được trên máy Android thật, có ads + Firebase.
>
> Tài liệu liên quan: [sdk-guide.md](../sdk/sdk-guide.md) (API từng controller) ·
> [export-sdk.md](../sdk/export-sdk.md) (publish package) · [firebase-guide.md](../sdk/firebase-guide.md) ·
> [CHANGELOG.md](../../CHANGELOG.md) (mục 3.0.0) · app mẫu chạy được: thư mục `src-dev/` của repo này.
>
> Nâng cấp từ 2.0.0 lên 3.0.0 trong app đã có: xem mục 10, không cần làm lại từ đầu.
>
> **SDK 3.0.0 không còn màn chọn ngôn ngữ và onboarding.** `SetupFlow`, `SetupFlowProvide`,
> `registerSetupRoutes`, `ChooseLanguageView`, `OnboardingView` và các setting đi kèm đã bị xoá
> (CHANGELOG 3.0.0, mục "Removed (setup flow)"). Các màn đầu tiên là của app; tài liệu này chỉ dùng API còn lại.

---

## 1. Chuẩn bị

| Thứ cần có | Ghi chú |
|---|---|
| Node.js ≥ 20, npm ≥ 9 | `@tsconfig/node20`, Vite 8 |
| JDK 21 + Android Studio (SDK 36) | Plugin native biên dịch với Java 21, `compileSdk`/`targetSdk` 36, `minSdk` 24 |
| Token đọc package của Gitea | Quyền `read:package`, tạo ở `https://git.ifr.vn/user/settings/applications` |
| File Firebase | `google-services.json` (Android), `GoogleService-Info.plist` (iOS) — xem [firebase-guide.md](../sdk/firebase-guide.md) |
| Key quảng cáo | AppLovin MAX (`sdkKey` + ad unit), AdMob (`appId` + ad unit), AppsFlyer `devKey` |
| Xcode 15+ (chỉ khi làm iOS) | SDK dùng Swift Package Manager, iOS ≥ 14 |

SDK chỉ cần Vue 3 + Vue Router. Không bắt buộc Pinia, UI library, v.v.

---

## 2. Tạo project

```bash
npm create vite@latest my-app -- --template vue-ts
cd my-app
npm install
```

Vue Router là peer dependency, project Vite mặc định chưa có:

```bash
npm install vue-router@^5.2.0
```

> **Chú ý phiên bản:** `peerDependencies` của 3.0.0 là `vue ^3.5.34` và `vue-router ^5.2.0`.
> `export-sdk.md` còn ghi `vue-router ^4.5.0` — đó là số cũ, đừng làm theo.

---

## 3. Cài `@alf/app-sdk@3.0.0`

Có hai cách. Chọn **A** khi registry dùng được, **B** khi test local/chưa publish.

### 3.A Từ Gitea registry (cách chuẩn)

Tạo `.npmrc` cạnh `package.json` của app:

```ini
@alf:registry=https://git.ifr.vn/api/packages/alf/npm/
//git.ifr.vn/api/packages/alf/npm/:_authToken=${ALF_NPM_TOKEN}
```

Đặt token vào biến môi trường thay vì ghi thẳng vào file:

```bash
# Git Bash / macOS / Linux
export ALF_NPM_TOKEN=xxxxxxxx
# PowerShell:  $env:ALF_NPM_TOKEN = "xxxxxxxx"
```

> Thêm `.npmrc` vào `.gitignore` nếu bạn có ghi token thật vào đó. Không commit token.

```bash
npm install @alf/app-sdk@3.0.0
```

Scope `@alf` chỉ kéo `@alf/*` từ Gitea; vue, capacitor, … vẫn lấy từ npmjs.

### 3.B Từ file `.tgz` (khi chưa publish)

Repo `app-framework` đã có sẵn bản đóng gói `release/alf-app-sdk-3.0.0.tgz`. Chép vào app rồi cài:

```bash
mkdir vendor
cp /đường/dẫn/app-framework/release/alf-app-sdk-3.0.0.tgz vendor/
npm install ./vendor/alf-app-sdk-3.0.0.tgz
```

Hoặc tự đóng gói từ source: trong `app-framework` chạy `npm run build && npm pack`.
Khi bản 3.0.0 lên registry, đổi lại `"@alf/app-sdk": "3.0.0"` trong `package.json` và xoá `vendor/`.

Kiểm tra cài đúng:

```bash
npm ls @alf/app-sdk                  # phải ra 3.0.0
ls node_modules/@alf/app-sdk/dist    # có index.mjs, index.cjs, index.d.ts, app-sdk.css, vite/
```

### 3.1 Các dependency đi kèm

`npm install` tự kéo các package sau (là `dependencies` của SDK, **không** cần cài lại):
`@capacitor/{core,app,device,filesystem,haptics,local-notifications,network,preferences,push-notifications,share,status-bar}`,
`@capacitor-firebase/remote-config`, `@capacitor-community/stripe`, `@capgo/native-purchases`,
`appsflyer-capacitor-plugin`, `firebase`, `html-to-image`, `vue-i18n`.

Plugin native của SDK (AppLovin MAX, AdMob, Firebase Analytics, Download) **nằm trong chính package**.
`package.json` của SDK khai báo `capacitor.android.src = sdk/android`, nên `npx cap sync` tự đăng ký,
không cần cài plugin riêng.

---

## 4. Cài Capacitor cho app

SDK cần `@capacitor/core` (đã được kéo theo) nhưng app phải tự có CLI và platform:

```bash
npm install -D @capacitor/cli@^8
npm install @capacitor/android@^8
npx cap init "My App" com.mycompany.myapp --web-dir dist
```

- `appId` (`com.mycompany.myapp`) phải khớp với app đã đăng ký trên Firebase / AdMob / AppLovin / Play Console.
- Dùng đúng major **8** cho mọi package `@capacitor/*` — SDK build với bản 8.

---

## 5. Cấu hình project web

### 5.1 `vite.config.ts`

Không cần plugin đặc biệt. Chỉ cần đảm bảo build ra `dist/`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { host: true, port: 4000 },
  build: { outDir: 'dist' },
})
```

Tuỳ chọn: plugin reload khi sửa file SDK (hữu ích nếu bạn `npm link` SDK để dev song song):

```ts
import { alfReloadPlugin } from '@alf/app-sdk/vite'
// plugins: [vue(), alfReloadPlugin('node_modules/@alf/app-sdk/**/*')]
```

> Không cần alias `@` trỏ vào SDK như `src-dev/` — đó chỉ là do app mẫu dùng source SDK trực tiếp.
> App thật luôn `import ... from '@alf/app-sdk'`.

### 5.2 Font

`@alf/app-sdk/style.css` chứa style cho overlay của SDK (`OverlayContainer`, `DateTimePicker`, `TimePicker`) và dùng
`font-family: var(--alf-font, "Nunito"), system-ui…`. Bản `dist` 3.0.0 **không** kèm `@font-face` hay file
font, nên nếu app không tự nạp font thì overlay rơi về font hệ thống (vẫn dùng được).
Muốn đúng Nunito: tự thêm `@font-face` + file font vào `public/fonts/` và đặt `settings.defaultFont`.
(App mẫu `src-dev/` chép font từ `sdk/assets/fonts` bằng `vite-plugin-static-copy`.)

### 5.3 `src/env.d.ts`

Nếu TypeScript phàn nàn khi import `style.css`, thêm:

```ts
/// <reference types="vite/client" />
```

---

## 6. Viết code khởi động

Thứ tự bắt buộc: `initControllers()` → khởi tạo i18n → mount Vue → `initSDK(config)` → `Screen.setRouter(router)` → vào màn đầu.
`src-dev/main.ts` là bản đầy đủ chạy được; dưới đây là bản rút gọn cho app mới.

### 6.1 `src/config.ts`

```ts
import type { Config } from '@alf/app-sdk'

export const config: Config = {
  settings: {
    dev: true,                  // bản store: false
    isGame: false,
    isApp: true,
    appName: 'My App',
    appVersion: '1.0.0',
    environment: 'dev',         // 'dev' | 'staging' | 'production'
    // testAds mặc định = dev. Bản store: dev false và KHÔNG đặt testAds: true.
    hasSettingsScreen: false,
    hasGameplayScreen: false,
    defaultFont: 'Nunito',
    defaultLocale: 'en',        // dùng tới khi user chọn ngôn ngữ (Data.setLocale)
    // Mới ở 3.0.0 — tất cả tuỳ chọn, mặc định đã ổn. Xem mục 7.
    adsPerformance: { startupAnchor: 'firstScreen' },
  },
  keys: {
    applovin: {
      android: { sdkKey: '…', banner: '…', mrec: '…', interstitial: '…', rewarded: '…', appOpen: '…' },
      ios:     { sdkKey: '…', banner: '…', mrec: '…', interstitial: '…', rewarded: '…', appOpen: '…' },
    },
    admob: {
      android: { appId: 'ca-app-pub-…~…', banner: '…', interstitial: '…', rewarded: '…', openApp: '…', native: '…' },
      ios:     { appId: 'ca-app-pub-…~…', banner: '…', interstitial: '…', rewarded: '…', openApp: '…', native: '…' },
    },
    appsflyer: { devKey: '…', iosAppId: '…', androidAppId: '…' },
    firebase: { apiKey: '…', projectId: '…', appId: '…', messagingSenderId: '…' },
    // iap: { enable: true, products: [...] }   // chỉ khi app có mua trong ứng dụng
  },
}
```

Chỉ khai báo những khối bạn dùng (`applovin`, `admob`, `appsflyer`, `firebase`, `iap` đều tuỳ chọn);
`initSDK` ném lỗi duy nhất khi thiếu `config.keys`. Đừng để chuỗi `YOUR_…` trong bản release.

Muốn thử nhanh khi chưa có key: để `dev: true` (test ads bật sẵn) và chỉ điền khối bạn đang thử.

### 6.2 `src/main.ts`

```ts
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { ALF, initSDK } from '@alf/app-sdk'
import '@alf/app-sdk/style.css'

import App from './App.vue'
import HomeView from './views/HomeView.vue'
import { config } from './config'

async function main() {
  const app = createApp(App)

  // 1. Nạp controller TRƯỚC để ALF.Instance.Localization dùng được
  await ALF.Instance.initControllers()
  ALF.Instance.Localization.init(config.settings.defaultLocale ?? 'en')
  app.use(ALF.Instance.Localization.getI18n())

  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', name: 'home', component: HomeView }],
  })
  app.use(router)
  app.mount('#app')

  // 2. Khởi tạo SDK (MAX, AdMob, Firebase, Storage, IAP, …). AppsFlyer chạy nền, không chặn.
  const status = await initSDK(config /*, extraMessages */)
  console.log('[SDK]', status, status.timings)   // 3.0.0: thời gian từng bước, ms

  // 3. Giao router cho ScreenController (Screen.NavigateTo cần nó), rồi vào màn đầu
  ALF.Instance.Screen.setRouter(router)
  ALF.Instance.Screen.NavigateTo('home').fade()

  // 4. 3.0.0: báo "màn đầu đã vẽ xong" để quảng cáo xếp lịch tính từ đây
  requestAnimationFrame(() =>
    requestAnimationFrame(() => ALF.Instance.Ads.MarkFirstScreenShown()),
  )
}

main()
```

Ghi chú:

- `initSDK(config, extraMessages?)`: tham số thứ hai là bản dịch riêng của app, gộp đè lên i18n của SDK
  (dạng `{ en: {...}, vi: {...} }`, xem `src-dev/i18n/`).
- `Screen.setRouter(router)` là bắt buộc nếu dùng `ALF.Instance.Screen` (`NavigateTo`, `GoBack`, …).
  Thiếu nó thì `NavigateTo` không làm gì và log `No router set`.
- Màn đầu (chọn ngôn ngữ, onboarding, …) nếu cần thì app tự làm như một route bình thường. Muốn nhớ
  lựa chọn qua các lần mở app: gọi `Localization.setLocale(code)` + `Data.setLocale(code)`;
  `initSDK` tự áp dụng lại locale đã lưu. Trạng thái khác (đã xem onboarding, …) app tự lưu,
  ví dụ bằng `ALF.Instance.Storage`.
- Nếu route đầu của app không tên `home`, đổi tên trong `NavigateTo(...)`.
- `src/views/HomeView.vue` và `App.vue` là của app — chỉ cần có `<router-view />`.

### 6.3 Dùng controller

```ts
import { ALF } from '@alf/app-sdk'
const alf = ALF.Instance

await alf.Ads.InitBannerAd()
await alf.Ads.LoadInterstitial()
await alf.Ads.ShowInterstitial()
await alf.Analytics.LogEvent('level_start', { level: 1 })
```

Danh sách đầy đủ controller và method: [sdk-guide.md](../sdk/sdk-guide.md) mục 5.
Quy tắc: app không tự viết lại device/network/camera/ads/IAP/storage, mà gọi `ALF.Instance.<Controller>`.

---

## 7. Điểm riêng của 3.0.0 mà app mới nên làm ngay

| Việc | Vì sao |
|---|---|
| Gọi `ALF.Instance.Ads.MarkFirstScreenShown()` khi màn đầu đã vẽ (mục 6.2, bước 4) | Cần khi dùng `adsPerformance.startupAnchor: 'firstScreen'`. Nếu đặt `'firstScreen'` mà quên gọi, các stage quảng cáo chờ tối đa 30s mới chạy |
| Nếu tự điều hướng không qua `ALF.Instance.Screen.NavigateTo`, gọi `Ads.NotifyScreenChange(promise, animationMs)` | Để native ad chờ màn mới vẽ xong; hỏi chi tiết ở [sdk-guide.md §4.5](../sdk/sdk-guide.md) |
| Không `Promise.all` nhiều `ShowAdMobNativeAd` để "nhanh hơn" | Scheduler vẽ native lần lượt cách nhau `nativeShowGapMs` (300ms). Lệnh xếp hàng bị bỏ (trả `false`) nếu slot bị `Hide`/`Destroy` trước lượt |
| Cần kết quả AppsFlyer thì `await ALF.Instance.Analytics.WhenReady()` | `status.appsflyer` có thể là `'pending'` ngay sau `initSDK`. `LogEvent`/`SetUserId` gọi lúc đó vẫn được gửi sau |
| Không xin video (`request.video`) cho pool dùng template `small` | `small` không có media view, video tải về mà không ai thấy (SDK cảnh báo một lần) |
| Đừng giả định thứ tự init giữa Storage, IAP, Payment, Firebase | Từ 3.0.0 hai nhóm ads và data chạy song song (đây là breaking change) |

`adsPerformance` chỉnh được lúc chạy, ví dụ từ Remote Config để A/B không cần build lại:

```ts
alf.Ads.SetPerformanceOptions({ nativeShowGapMs: 300, maxConcurrentLoads: 2 })
console.log(alf.Ads.GetPerfStats())
```

Cần quay về hành vi 2.0.0 khi nghi ngờ: `adsPerformance: { legacy: true }`.

---

## 8. Chạy trên Android

### 8.1 Thêm platform và đặt file cấu hình

```bash
npm run build
npx cap add android
```

1. **Firebase:** chép `google-services.json` vào `android/app/`. Cần plugin `com.google.gms.google-services`
   trong `android/build.gradle` + `android/app/build.gradle`; project Capacitor mới sinh sẵn đoạn
   `apply plugin` có điều kiện ở cuối `app/build.gradle` (chỉ áp dụng khi file tồn tại). Thiếu file thì
   Firebase Analytics tự tắt, không crash.
2. **AdMob App ID:** thêm vào `android/app/src/main/AndroidManifest.xml`, bên trong `<application>`.
   **Thiếu mục này app crash ngay khi mở** (Google Mobile Ads SDK):

   ```xml
   <meta-data
       android:name="com.google.android.gms.ads.APPLICATION_ID"
       android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
   ```

   Giá trị trùng `keys.admob.android.appId` trong `config.ts`.
3. **Quyền:** `INTERNET` đã có sẵn. Thêm quyền theo controller bạn dùng (camera, thông báo, …).
4. `minSdkVersion` trong `android/variables.gradle` phải ≥ **24**; `compileSdk`/`targetSdk` nên là 36.

### 8.2 Sync và chạy

```bash
npx cap sync android     # BẮT BUỘC mỗi khi đổi SDK hoặc plugin
npx cap open android     # mở Android Studio, chọn thiết bị thật → Run
```

> `bin/cli.mjs` (`build:android`, `build:dev`) có trong repo `app-framework`, nhưng `package.json` 3.0.0
> **không khai báo `bin`** và không đưa `bin/` vào `files`, nên `npx alf …` không chạy được từ package đã
> cài. Dùng các lệnh `npm run build` + `npx cap sync android` ở trên. Muốn dùng CLI thì chạy trực tiếp
> `node /đường/dẫn/app-framework/bin/cli.mjs build:android` từ thư mục app.

### 8.3 Dev với live reload (tuỳ chọn)

Chạy `npm run dev` (cổng 4000), rồi đặt tạm trong `capacitor.config.ts`
`server: { url: 'http://192.168.x.x:4000', cleartext: true }` và `npx cap sync android`.
Điện thoại và máy dev phải cùng mạng. Xoá đoạn này trước khi build bản phát hành.

---

## 9. iOS (nếu cần)

```bash
npm install @capacitor/ios@^8
npx cap add ios
npx cap sync ios
```

- Đặt `GoogleService-Info.plist` vào `ios/App/` (và add vào target trong Xcode).
- `Info.plist` cần `GADApplicationIdentifier` (AdMob App ID), `NSUserTrackingUsageDescription` (ATT) và
  danh sách `SKAdNetworkItems` theo hướng dẫn của AppLovin/AdMob.
- SDK kéo AppLovin MAX và Google Mobile Ads qua Swift Package Manager, mở `ios/App/App.xcworkspace`
  (hoặc `.xcodeproj` nếu dùng SPM thuần) và để Xcode resolve package lần đầu.
- Hạn chế hiện tại: Firebase Analytics chỉ chạy Android (iOS là no-op), banner AdMob chưa có trên iOS.

---

## 10. Nâng cấp app đã có từ 2.0.0

```bash
npm install @alf/app-sdk@3.0.0
npx cap sync android          # code native đổi (MAX, banner, rect mode)
```

Kiểm tra theo [CHANGELOG.md](../../CHANGELOG.md), mục "Breaking":

- App đọc `status.appsflyer` có thể gặp `'pending'` → dùng `Analytics.WhenReady()`.
- Code dựa vào thứ tự init ngầm giữa Storage / IAP / Payment / Firebase cần kiểm lại.
- `SDKStatus` giờ là interface có thêm `timings`; nếu app khai báo literal `SDKStatus` thì thêm `timings: {}`.
- Không cần sửa config cho phần ads. Muốn so với hành vi cũ thì đặt `adsPerformance.legacy: true`.

Nếu app 2.0.0 dùng setup flow (chọn ngôn ngữ / onboarding của SDK) — 3.0.0 đã xoá hẳn:

- Xoá `registerSetupRoutes(...)`, `SetupFlowProvide(...)`, `SetupFlow(...)` và import của chúng.
  Thay bằng `ALF.Instance.Screen.setRouter(router)` + `ALF.Instance.Screen.NavigateTo('home')` (mục 6.2).
- Xoá khỏi `config.settings`: `hasChooseLanguageScreen`, `hasOnboardingScreen`, `onboarding`,
  `choose_language`. TypeScript báo lỗi excess property nếu còn.
- Bỏ mọi chỗ dùng `ChooseLanguageView`, `OnboardingView`, `OnboardingConfig`, `Data.completeOnboarding()`,
  route `choose_language` / `onboarding`, và key i18n `language.*` / `onboarding.*` (key
  `settings.language` vẫn còn).
- Locale user đã chọn trước đây vẫn được giữ: `app-data.json` cũ đọc được, `initSDK` áp dụng lại.

---

## 11. Checklist trước khi coi là xong

- [ ] `npm ls @alf/app-sdk` ra `3.0.0`, `npm run build` (và `vue-tsc` nếu bật) không lỗi
- [ ] `npx cap sync android` không báo lỗi plugin
- [ ] Log khi mở app: `[initSDK] applovin …ms`, `[initSDK] admob …ms`, `status.timings` có `total`
- [ ] Banner / Interstitial hiển thị là **test ad** khi `dev: true`
- [ ] Firebase: event hiện ở DebugView (cần `google-services.json`)
- [ ] `ALF.Instance.Ads.GetPerfStats()` trả số liệu (không phải lỗi)
- [ ] Bản store: `dev: false`, `environment: 'production'`, **không** có `testAds: true`, không còn chuỗi `YOUR_…`
- [ ] Không commit token npm, `google-services.json` thật của app khác, hay key quảng cáo test vào repo công khai

---

## 12. Lỗi thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| `401 Unauthorized` / `404` khi `npm install` | Token sai hoặc thiếu `read:package`; dòng `@alf:registry=` thiếu hoặc sai. Thử `npm view @alf/app-sdk versions` |
| Cảnh báo `peer vue-router@"^5.2.0"` | Đang dùng vue-router 4. `npm install vue-router@^5.2.0` |
| App crash ngay khi mở, log `The Google Mobile Ads SDK was initialized incorrectly` | Thiếu `com.google.android.gms.ads.APPLICATION_ID` trong `AndroidManifest.xml` (mục 8.1) |
| `ALF.Instance.Localization` là `undefined` | Chưa `await ALF.Instance.initControllers()` trước khi dùng i18n |
| `Screen.NavigateTo` không chuyển màn, log `No router set` | Chưa gọi `ALF.Instance.Screen.setRouter(router)` (mục 6.2) |
| TS báo lỗi `hasChooseLanguageScreen` / `onboarding` không có trong `Settings` | Các setting này đã bị xoá cùng setup flow; bỏ khỏi config (mục 10) |
| Ads không hiện, log `no fill` | Bình thường với unit mới; chờ vài giờ hoặc bật `dev: true` để dùng test unit |
| Staged ads không chạy sau boot | Đặt `startupAnchor: 'firstScreen'` mà không gọi `MarkFirstScreenShown()` (chờ tối đa 30s) |
| Native ad bị cắt đáy | Ô giữ chỗ thấp hơn mức tối thiểu của template; xem [1.2.0 guide §4.2](./sdk-guide-1.2.0.md) |
| Firebase Analytics không ghi nhận | Thiếu `google-services.json`, hoặc `analyticsEnabled` mặc định `!dev` nên bản dev không gửi |
| `Cannot find module '@alf/app-sdk'` | Cài chưa xong hoặc cache; `rm -rf node_modules package-lock.json && npm install` |
| `cap sync` không thấy plugin ALF | Dùng `npm link`/symlink: Capacitor cần package nằm thật trong `node_modules`. Cài từ registry hoặc `.tgz` |
