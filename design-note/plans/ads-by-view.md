# Kế hoạch hiển thị quảng cáo theo từng view — Pulse

Ngày lập: 01/11/2026  
Phạm vi khảo sát: toàn bộ UI/UX trong `App/src`, gồm route, các bước onboarding, màn phủ khi tập và các component quảng cáo.  
Chuẩn đối chiếu: [`../ads_policy_interstitial_banner_native.md`](../ads_policy_interstitial_banner_native.md). Đây là phương án thiết kế; trước khi phát hành vẫn cần đối chiếu chính sách AdMob, Google Play và Apple hiện hành.

## 1. Luồng thực tế cần bám theo

```text
Mở app → /begin → (người mới: /onboarding; người cũ: nút Vào app → /workout)
                           onboarding: ngôn ngữ → 3 slide giới thiệu/“Tiếp tục”
                           → giới tính → năm sinh/chiều cao → cân nặng → mục tiêu → số ngày tập
                           → /workout
/workout ↔ /discover ↔ /report ↔ /profile
  └─ mở khóa tập → /discover/:courseId → chuẩn bị → đếm ngược → tập/nghỉ
                                              → kết quả buổi tập (màn phủ, không phải route)
/profile → /profile/details | /profile/training | /profile/reminder | /profile/language
Chỉnh hồ sơ từ app → onboarding dạng màn phủ (`edit`), không đi qua /onboarding.
```

`/begin` hiện có bộ đếm 3 giây và banner. Người mới bị chuyển ngay sang `/onboarding` qua `needsOnboarding`, nên sẽ không thấy bộ đếm. “Màn tiếp tục” trong yêu cầu được hiểu là ba slide `welcome` có nút **Tiếp tục**; hiện chưa có route tên `continue`. `App.vue` giữ tab bar và các màn phủ; `CourseDetail` chứa `WorkoutPlayer`, còn `SessionResult` nằm ngoài router. Các điểm này cần được xử lý theo trạng thái UI, không thể chỉ nghe sự kiện đổi URL.

## 2. Quyết định thiết kế

| Mong muốn | Thiết kế áp dụng |
|---|---|
| Vào màn start và đợi quảng cáo full screen | Dùng **App Open Ad** đúng định dạng lúc mở app, sau khi splash/app sẵn sàng. Không dùng Interstitial tại khởi chạy. Không kéo dài bộ đếm 3 giây chỉ để chờ ad. Nếu ad chưa sẵn sàng, bỏ qua và tiếp tục. |
| Màn Tiếp tục có native | Đặt **một** native nhỏ dưới nội dung giới thiệu ở slide `welcome` đầu tiên hoặc trong vùng cuộn riêng, có nhãn “Quảng cáo”. Giữ cùng vị trí khi chuyển 3 slide; không tải lại mỗi lần bấm Tiếp tục. Chỉ hiện nếu đủ chỗ, không sát nút cố định. |
| Vào app có banner | Một banner cho shell `/workout`, `/discover`, `/report`, `/profile` ở dải riêng phía dưới nội dung, **phía trên** bottom tab bar trên điện thoại; tôn trọng safe area. Không tạo một banner mới sau mỗi lần đổi tab. Ẩn khi có màn phủ. |
| Mỗi lần mở router khác có full screen | **Không áp dụng nguyên văn**: trái quy tắc không hiện Interstitial sau mỗi thao tác/chuyển tab. Chỉ xét Interstitial ở điểm hoàn tất tác vụ tự nhiên, theo bảng dưới và frequency cap. Đổi tab, mở/back khóa tập, vào/ra cài đặt không kích hoạt. |
| Chọn ngôn ngữ có native + banner | Áp dụng cho bước `language` khi onboarding và `/profile/language`, nhưng chỉ khi màn hình đủ cao để danh sách, nhãn ad và CTA/tab bar không bị che. Native ở cuối danh sách, tách khỏi các lựa chọn; banner ở dải cố định riêng. Với máy thấp/bàn phím mở, ưu tiên native **hoặc** banner, không ép cả hai. |

### Vị trí theo view

| View/trạng thái | Quảng cáo đề xuất | Vị trí và điều kiện |
|---|---|---|
| Boot/splash và `/begin` | App Open Ad tối đa một lần mỗi lần mở phù hợp; bỏ banner hiện tại ở `/begin` | Chỉ sau khi app đã sẵn sàng và consent đã xử lý; không che logo bằng placeholder giả. Đóng ad hoặc tải lỗi thì vào luồng bình thường. Không hiện lặp giữa `/begin` và onboarding. |
| Onboarding `language` | Native nhỏ + banner có điều kiện | Native sau danh sách ngôn ngữ trong vùng cuộn; banner ở dải riêng **trên** footer Tiếp tục, có khoảng cách rõ. Nếu không đủ chỗ, chỉ native; nếu native không có fill, chỉ banner. |
| Onboarding `welcome` 3 slide | Một native nhỏ | Sau phần giới thiệu, trước vùng dành cho footer; không nằm trong vùng vuốt slide và không chen giữa nút Tiếp tục với nội dung chính. Không có Interstitial giữa các slide. |
| Onboarding `gender`, `about`, `weight` | Không quảng cáo | Người dùng đang chọn hoặc nhập thông tin cá nhân; giữ luồng liên tục, không che wheel/input/CTA. |
| Onboarding `goal`, `days` | Tối đa một native ở **một** bước, ưu tiên `days` nếu còn chỗ | Hiện mã đang có native ở cả hai bước (small/medium). Giảm mật độ; không dùng native medium cạnh footer trên màn nhỏ. Sau nút Hoàn tất, có thể **xét** một Interstitial trước Home cho người dùng mới, nhưng khuyến nghị lần đầu miễn quảng cáo để bắt đầu tập ngay. |
| `/workout` | Banner shell; native trong danh sách gợi ý có điều kiện | Giữ native sau gợi ý thứ hai nếu danh sách đủ dài; không đặt sát CTA “Bắt đầu ngay”. Không thêm banner trong nội dung Home vì đã có banner shell. |
| `/discover` | Banner shell; tối đa một native trong feed | Giữ native sau 8 khóa tập nếu kết quả đủ dài; quảng cáo là một hàng riêng có nhãn, không giả dạng thẻ khóa tập. Lọc/tìm kiếm/favorites không kích hoạt full screen. |
| `/report` | Banner shell; native trong lịch sử khi đủ bản ghi | Giữ native sau bản ghi thứ ba; màn trống không hiện native. Không hiện full screen khi người dùng nhập cân nặng/cảm nhận. |
| `/profile` | Banner shell | Không đặt native giữa các hàng cài đặt. Mở các trang con không kích hoạt full screen. |
| `/profile/details` | Không quảng cáo | Màn phủ form chỉnh thông tin; tạm ẩn banner shell. |
| `/profile/training` | Không quảng cáo | Màn phủ cài đặt giọng nói; tạm ẩn banner shell. |
| `/profile/reminder` | Không quảng cáo | Màn phủ chỉnh giờ, xin quyền thông báo/hệ thống; tạm ẩn banner shell. |
| `/profile/language` | Native nhỏ + banner có điều kiện | Native sau danh sách ngôn ngữ trong vùng cuộn, không thành một lựa chọn radio; banner trong dải cố định của panel, tách khỏi nút Back và danh sách. Máy thấp: một định dạng hoặc không ads nếu nội dung bị ép. |
| `/discover/:courseId` | Banner shell nếu không che CTA Start; không native/full screen | Khi vào khóa tập từ Home/Discover, giữ trải nghiệm liên tục. Nếu banner shell không thể dành vùng riêng, ẩn tại detail. |
| `WorkoutPlayer`: chuẩn bị, đếm ngược, đang tập, nghỉ, pause, xác nhận thoát | Không quảng cáo | Ẩn cả banner/native; không dùng khoảng trống `adInset` khi ẩn. Không chèn quảng cáo vào vòng tập/nghỉ hoặc khi bấm thoát. |
| `SessionResult` | Không banner/native trên nội dung kết quả; Interstitial **chỉ có thể xét sau khi người dùng bấm Xong** | Hiển thị đầy đủ thống kê, cảm nhận, lưu cân nặng và chia sẻ trước. Nếu đủ điều kiện, hiện tối đa một Interstitial ở chuyển tiếp từ kết quả về Home; nếu không thì về Home ngay. Không hiện khi kết thúc buổi tập trước lúc người dùng xem kết quả. |
| Onboarding `edit` dạng màn phủ | Không quảng cáo | Chỉnh hồ sơ hiện loại trừ native; giữ nguyên nguyên tắc này và ẩn banner shell dưới màn phủ. |

## 3. Quy tắc full screen và tần suất

1. **App Open Ad**: chỉ cho đợt mở app/đưa app lên foreground sau một khoảng rời app đủ dài, khi app ở trạng thái an toàn. Không hiện khi trở lại từ màn xin quyền, settings, chia sẻ, ad click, lúc đang tập, xem kết quả hoặc đang chỉnh form. Một phiên mở chỉ hiện tối đa một App Open Ad. Việc “đợi” ở start nghĩa là có một cửa sổ chờ ngắn để ad đã tải xuất hiện; hết cửa sổ thì đi tiếp, không khóa CTA.
2. **Interstitial**: không gắn vào `router.beforeEach` theo kiểu “mỗi route một ad”. Chỉ xét tại sự kiện `session_result_done` sau khi hoàn tất bài tập. Có thể thử thêm một điểm sau khi hoàn tất onboarding cho người dùng quay lại thiết lập, nhưng mặc định tắt. Không hiện ở thao tác Back, đổi tab, mở khóa tập, bắt đầu/tạm dừng/bỏ bài, chọn ngôn ngữ, hay lưu thông tin.
3. **Cap khởi đầu để kiểm thử UX** (cấu hình nội bộ, không phải ngưỡng bắt buộc của Google): tối đa 1 Interstitial trong 2 phút, tối đa 2 trong một phiên, và cần một tác vụ hoàn thành mới giữa hai lần. Sau mọi full screen ad, chặn full screen khác ít nhất 2 phút. Chỉ `show()` khi ad đã preload, app foreground, không có modal/keyboard/player, không có ad khác; không chờ tải tại điểm chuyển tiếp.
4. Nếu không có fill, offline, lỗi SDK, consent chưa đủ điều kiện hoặc người dùng đóng ad: tiếp tục điều hướng ngay. Không dùng overlay tự dựng để mô phỏng quảng cáo thật, không tự nhấn/khuyến khích nhấn ads.

## 4. Cách triển khai vào cấu trúc hiện tại

### SDK và component hiện có (kiểm tra với `@alf/app-sdk` 1.9.0)

`App/package.json` dùng gói local `vendor/alf-app-sdk-1.9.0.tgz`. Các API dưới đây được đối chiếu với `App/node_modules/@alf/app-sdk/dist/alf/controllers/AdController.d.ts` và `dist/alf/types/ad.types.d.ts`; trên trình duyệt web các API quảng cáo native không hiện ad thật. `adsConfig.ts` hiện **chỉ** gọi `initAdMob()`, cấu hình AdMob test cho Android/iOS và chưa cấu hình AppLovin MAX.

| Định dạng | SDK 1.9.0 hỗ trợ | Component trong app | Tình trạng thực tế và cách dùng trong plan |
|---|---|---|---|
| Banner | `LoadBannerAd`, `ShowBannerAd`, `InitBannerAd`, `HideBannerAd`, `DestroyBannerAd`; mặc định adaptive, có size/collapsible tùy nền tảng | `BannerAd.vue` gọi SDK thật | Đang dùng ở `/begin`. Chuyển thành banner host của shell; banner trên màn ngôn ngữ cần kiểm tra vị trí neo mép màn hình của SDK. |
| Native | `ShowAdMobNativeAd`, `UpdateAdMobNativeAdRect`, `HideAdMobNativeAd`, `DestroyAdMobNativeAd`; template `small`, `mrec`, `medium`, tùy chọn video | `NativeAd.vue` gọi SDK thật; `InFeedAd.vue` bọc native với nhãn Ad | Đang dùng ở Home/Discover/Report và onboarding `goal`/`days`. `InFeedAd` là **cách đặt native**, không phải ad format riêng. Video trong native là dạng creative, không phải `VideoAd.vue`. |
| App Open | `LoadAdMobAppOpenAd`, `IsAdMobAppOpenAdReady`, `ShowAdMobAppOpenAd`; SDK cũng có nhánh AppLovin `LoadAppOpenAd`/`ShowAppOpenAd` | `AppOpenAd.vue` chỉ là overlay mẫu, **không gọi SDK** | Với cấu hình hiện tại nên thiết kế dùng nhánh **AdMob App Open**; cần viết bộ điều phối load/ready/show và callback đóng/lỗi. |
| Interstitial | `LoadInterstitial`, `ShowInterstitial` của `AdController` (nhánh MAX/test fallback); plugin AdMob native có hàm riêng, nhưng controller không expose một cặp `LoadAdMobInterstitial`/`ShowAdMobInterstitial` | `InterstitialAd.vue` chỉ là overlay mẫu | App chưa cấu hình/khởi tạo MAX nên **chưa thể coi Interstitial production đã tích hợp**. Muốn dùng điểm sau kết quả buổi tập, cần cấu hình và init MAX theo SDK, hoặc tích hợp có kiểm soát API AdMob plugin; không dùng overlay mẫu. |
| Rewarded | `LoadRewardedVideo`, `ShowRewardedVideo` của controller; plugin AdMob native có API riêng | `RewardedAd.vue` chỉ là overlay mẫu | SDK có khả năng, app chưa dùng. Không đưa vào kịch bản hiện tại vì app chưa có lợi ích tự chọn để đổi lấy ad. |
| MREC 300×250 | `InitMRECAd`, `HideMRECAd`, `DestroyMRECAd` (nhánh MAX; test fallback có banner AdMob cỡ MREC) | Không có component MREC riêng | Không đưa vào các màn ngôn ngữ/onboarding vì chiếm nhiều diện tích. `NativeAd` template `mrec` vẫn là **native**, không phải MREC banner. |
| Rewarded Interstitial, Offerwall, Playable, Video Ads độc lập | Không có API tương ứng trong `AdController`/`AdFormat` hiện tại | `RewardedInterstitialAd.vue`, `OfferwallAd.vue`, `PlayableAd.vue`, `VideoAd.vue` đều là giao diện mẫu | Không tính là format SDK đã tích hợp và không đưa vào plan hiển thị. |

Lưu ý kỹ thuật: SDK 1.9.0 có `slot` cho nhiều native ad đồng thời (Android; iOS còn giới hạn khi các slot dùng cùng unit). Plan này vẫn chọn tối đa một native đang thấy trên mỗi view để giữ mật độ hợp lý, không phải vì SDK chỉ hỗ trợ một ad. SDK native vẽ bằng view thật phía trên WebView; cần dùng event `impression` để biết ad thực sự được nhìn thấy, vì `ShowAdMobNativeAd()` trả `true` chỉ xác nhận đã gắn view. `settings.testAds: true` đang bật cho QA; không dùng test unit hay fallback test ad làm phương án có doanh thu khi phát hành.

### Thay đổi cần làm

- Tạo bộ điều phối quảng cáo dùng chung, nhận `route.name`, `phase`, `result`, `editingProfile`, visibility/foreground, trạng thái bàn phím và consent. Bộ này quyết định **được phép hiện**; component từng view chỉ khai báo slot/vùng chứa. App Open và Interstitial được gọi ở sự kiện nghiệp vụ, không phải mọi `router.push`.
- Trong `App.vue`, đặt một banner host cho shell và dự trữ chiều cao thật của banner cộng safe area; trên mobile phải ở trên thanh tab 72px cùng nút Start nổi. Khi `course` có CTA quá gần, panel profile mở, player/result/edit phủ lên, hoặc bàn phím đang mở thì hủy/ẩn banner theo khả năng SDK. Tránh banner native vẽ đè WebView dù `z-index` của Vue thấp hơn.
- `BeginView.vue`: bỏ `BannerAd`; điều phối App Open trước/ở đầu luồng `/begin` kể cả người mới (hiện redirect tức thì). Không chờ ad tải vô hạn và không khóa nút vì quảng cáo. Quyết định có giữ bộ đếm 3 giây cho preload UI độc lập với ads.
- `OnboardingView.vue`: thêm slot native ở `language`/`welcome`, cấu hình banner riêng cho `language`; bỏ hoặc giảm native `goal`/`days`. Footer cố định phải tính đúng chiều cao banner **chỉ khi banner thực sự hiện**. `ProfileLanguage.vue` và `ProfilePanel.vue` cần vùng cuộn và vùng banner riêng.
- `NativeAd.vue` hiện vẽ native view lên WebView và theo dõi `rect`; cần ẩn/hủy khi placeholder ra ngoài viewport, panel khác phủ lên, chuyển step, app về nền. Plan giới hạn một native ad host nhìn thấy trên mỗi view; nhãn “Quảng cáo”, badge SDK và AdChoices luôn nhìn thấy, asset/clickable view do SDK quản lý. `InFeedAd.vue` đã có nhãn nhưng onboarding native hiện chưa có nhãn ngoài component.
- `BannerAd.vue` hiện neo banner ở mép màn hình. Thiết kế “trên tab bar/footer” chỉ triển khai được nếu SDK hỗ trợ tọa độ/offset đúng và vùng trống khớp; nếu API chỉ neo mép màn hình, đổi bố cục tab/footer để có dải banner ở mép và các nút nằm phía trên, hoặc ẩn banner ở view đó. Không chỉ thêm `margin` cho placeholder rồi để SDK phủ nút.
- `AppOpenAd.vue` và `InterstitialAd.vue` hiện là overlay mẫu có nút đóng, không phải quảng cáo AdMob. Không dùng các overlay này như ad khi phát hành; dùng API SDK và callback đóng/lỗi để tiếp tục luồng. `adsConfig.ts` đang dùng test app ID, `testAds: true`, ad unit rỗng; giữ test ads trong QA và cấu hình ID/consent/privacy trước bản phát hành.

## 5. Tiêu chí nghiệm thu

- Người mới và người cũ đều vào app được khi ad không tải; mỗi lần mở chỉ tối đa một App Open Ad, không bị lặp ở onboarding/Home.
- Không có full screen ad khi đổi tab, vào/ra profile panel, bấm Back, mở khóa tập, đang tập/nghỉ/pause/thoát, đang nhập dữ liệu; Interstitial chỉ có thể xuất hiện sau khi người dùng đóng màn kết quả và qua cap.
- Trên điện thoại thấp, có notch/gesture navigation, xoay màn hình và khi bàn phím hiện: banner không che CTA/tab bar; native không chồng lên radio/ngôn ngữ; nội dung chính vẫn sử dụng được.
- Kiểm tra nhãn quảng cáo, AdChoices, khả năng đóng full screen theo SDK; dùng test ads, không tạo click/impression giả. Kiểm thử offline, no fill, đóng ad, foreground/background, thay đổi consent.
- Trước phát hành: Privacy Policy, khai báo Data safety/App Privacy, consent phù hợp khu vực, kiểm tra độ phù hợp đối tượng trẻ em nếu áp dụng và đối chiếu lại chính sách chính thức được liên kết trong file policy của dự án.
