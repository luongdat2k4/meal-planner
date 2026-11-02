# Chính sách triển khai quảng cáo: Interstitial, Banner và Native Ads

> Phạm vi: ứng dụng Android/iOS sử dụng Google AdMob, đặc biệt phù hợp với ứng dụng React + Capacitor. Đây là checklist kỹ thuật tổng hợp, không thay thế chính sách chính thức của Google AdMob, Google Play hoặc Apple. Cần kiểm tra bản cập nhật trước khi phát hành.

## 1. Interstitial Ads (quảng cáo toàn màn hình)

### Yêu cầu và điều không được làm
- [ ] Chỉ hiển thị tại **điểm chuyển tiếp tự nhiên** (ví dụ: kết thúc màn chơi, hoàn tất một tác vụ), không đột ngột ngắt thao tác.
- [ ] Không hiển thị Interstitial ngay khi ứng dụng khởi chạy hoặc khi người dùng cố thoát ứng dụng; nếu cần quảng cáo lúc mở app, xem xét định dạng App Open Ads và chính sách riêng.
- [ ] Không hiển thị Interstitial sau **mỗi** thao tác/nhấn nút. Tránh mật độ quảng cáo cao và quảng cáo liên tiếp.
- [ ] Không đặt quảng cáo theo cách khiến người dùng vô tình nhấn, ví dụ xuất hiện đúng lúc chuẩn bị nhấn nút.
- [ ] Không cản trở điều hướng hoặc buộc người dùng tương tác với quảng cáo để tiếp tục sử dụng app, trừ cơ chế định dạng quảng cáo được cho phép.
- [ ] Tuân thủ quy định Google Play về quảng cáo toàn màn hình gây gián đoạn, gồm hạn chế đối với quảng cáo không thể đóng sau 15 giây (có ngoại lệ theo loại quảng cáo/ngữ cảnh).
- [ ] Không tự nhấn quảng cáo, tạo traffic ảo hoặc khuyến khích người dùng nhấn quảng cáo.
- [ ] Dùng quảng cáo thử nghiệm (test ads) trong giai đoạn phát triển.

### Khuyến nghị UX/kỹ thuật (không phải ngưỡng bắt buộc chung của Google)
- Đặt **frequency cap** nội bộ theo thời gian và số lần chuyển màn hình, điều chỉnh theo trải nghiệm thực tế.
- Chỉ gọi `show()` khi quảng cáo đã tải và app đang ở trạng thái thích hợp.
- Nếu quảng cáo không tải được, tiếp tục luồng sử dụng bình thường.
- Không hiển thị ngay sau khi người dùng đóng một quảng cáo khác.

### Ví dụ
- **Nên:** Hiển thị sau khi người dùng hoàn thành một màn chơi và trước khi sang màn tiếp theo.
- **Không nên:** Hiển thị ngay khi nhấn nút “Quay lại”, hoặc mỗi lần chuyển tab.

## 2. Banner Ads (quảng cáo biểu ngữ)

### Yêu cầu và điều không được làm
- [ ] Đặt banner ở vùng riêng, rõ ràng, không che nội dung hay nút chức năng.
- [ ] Không đặt quá sát nút điều hướng, vùng cuộn, nút bấm hoặc vùng tương tác dễ gây nhấn nhầm.
- [ ] Không dùng bố cục đánh lừa người dùng rằng banner là thành phần điều khiển của ứng dụng.
- [ ] Không yêu cầu, gợi ý hoặc thưởng cho người dùng nhấn banner.
- [ ] Không tự động nhấn hoặc tạo lượt hiển thị/click không hợp lệ.
- [ ] Đảm bảo nội dung chính của app vẫn có giá trị, không bị quảng cáo chiếm ưu thế quá mức.
- [ ] Sử dụng kích thước banner được SDK hỗ trợ; ưu tiên **anchored adaptive banner** khi phù hợp.
- [ ] Tôn trọng safe area, thanh điều hướng hệ thống và thay đổi kích thước màn hình.
- [ ] Dùng test ads khi phát triển và kiểm thử.

### Khuyến nghị UX/kỹ thuật
- Dành sẵn không gian cho banner để tránh layout shift khi quảng cáo tải.
- Không đặt banner đè lên nội dung cuộn hoặc trên bàn phím ảo.
- Không tự triển khai cơ chế refresh quá dày đặc; tuân thủ hướng dẫn SDK và chính sách mạng quảng cáo.
- Kiểm tra vị trí banner trên các thiết bị có notch, gesture navigation và màn hình nhỏ.

### Ví dụ
- **Nên:** Banner cố định phía dưới trong vùng được bố trí riêng, không đè lên thanh tab.
- **Không nên:** Banner nằm sát nút “Tiếp tục”, khiến người dùng dễ nhấn nhầm.

## 3. Native Ads (quảng cáo tích hợp giao diện)

### Yêu cầu và điều không được làm
- [ ] Quảng cáo phải **được nhận diện rõ là quảng cáo**, không ngụy trang thành nội dung biên tập hoặc kết quả tự nhiên.
- [ ] Hiển thị nhãn nhận diện quảng cáo (ví dụ “Ad”/“Quảng cáo”) theo yêu cầu định dạng và SDK.
- [ ] Hiển thị các thành phần bắt buộc của mẫu quảng cáo, bao gồm **AdChoices** khi SDK/định dạng yêu cầu; không che, sửa hoặc làm mất khả năng tương tác.
- [ ] Sử dụng asset quảng cáo do SDK cung cấp theo hướng dẫn; không sửa nội dung quảng cáo theo cách gây hiểu lầm.
- [ ] Không tự tạo nút CTA giả hoặc vùng nhấn gây nhầm lẫn với chức năng app.
- [ ] Không chèn Native Ads vào vị trí làm người dùng tưởng đó là mục nội dung họ vừa chọn.
- [ ] Không khuyến khích hoặc thưởng cho việc nhấn quảng cáo.
- [ ] Không tự tạo click/impression ảo; dùng test ads khi phát triển.
- [ ] Tuân thủ hướng dẫn về cách đăng ký và hiển thị asset/clickable views của Native Ads SDK.

### Khuyến nghị UX/kỹ thuật
- Tách component `NativeAdCard` khỏi component nội dung thông thường.
- Duy trì nhãn “Quảng cáo” dễ thấy ở mọi theme (sáng/tối).
- Kiểm tra khả năng đọc, tương phản và vùng chạm trên màn hình nhỏ.
- Không đặt quá nhiều Native Ads liên tiếp khiến feed trở thành danh sách quảng cáo.

### Ví dụ
- **Nên:** Thẻ quảng cáo trong feed, có nhãn “Quảng cáo”, AdChoices và CTA rõ ràng.
- **Không nên:** Thẻ quảng cáo trông hệt bài viết thông thường, không có dấu hiệu nhận diện.

## 4. Checklist chung trước khi phát hành

- [ ] Ứng dụng có Privacy Policy công khai và chính xác.
- [ ] Khai báo dữ liệu thu thập/chia sẻ theo yêu cầu Google Play Data safety hoặc Apple App Privacy.
- [ ] Triển khai consent phù hợp khu vực pháp lý và yêu cầu của Google (ví dụ UMP/CMP khi áp dụng).
- [ ] Nếu app hướng đến trẻ em, tuân thủ Google Play Families và quy định quảng cáo cho trẻ em.
- [ ] Không hiển thị quảng cáo cạnh nội dung bị cấm/hạn chế theo chính sách nền tảng.
- [ ] Dùng AdMob SDK/plugin tương thích và cập nhật.
- [ ] Không dùng quảng cáo thật để thử click trong quá trình QA.
- [ ] Kiểm thử các tình huống offline, load thất bại, đóng quảng cáo, chuyển app nền/foreground và xoay màn hình.
- [ ] Kiểm tra cả **AdMob policies** và **Google Play Ads policy**; nếu phát hành iOS, kiểm tra thêm **Apple App Review Guidelines**.

## 5. Phân biệt chính sách và cấu hình tự chọn

| Nội dung | Loại |
|---|---|
| Không tạo click hoặc traffic giả | Chính sách bắt buộc |
| Không bố trí quảng cáo gây nhấn nhầm | Chính sách bắt buộc |
| Native Ads phải nhận diện rõ là quảng cáo | Chính sách bắt buộc |
| Đặt frequency cap 60–120 giây cho Interstitial | Ví dụ cấu hình UX, **không phải giới hạn chung bắt buộc** |
| Đặt banner ở đáy màn hình | Lựa chọn thiết kế, không phải vị trí bắt buộc |
| Chèn Native Ads sau 5–10 mục nội dung | Ví dụ thiết kế, không phải quy định số lượng chung |

## 6. Nguồn chính thức để đối chiếu

- [Google AdMob Policies](https://support.google.com/admob/answer/6128543)
- [Google Play — Ads Policy](https://support.google.com/googleplay/android-developer/answer/9857753)
- [AdMob — Disallowed Interstitial Implementations](https://support.google.com/admob/answer/6201362)
- [Google AdMob — Native Ads](https://developers.google.com/admob/android/native)
- [Google AdMob — Banner Ads](https://developers.google.com/admob/android/banner)
- [Google AdMob — Interstitial Ads](https://developers.google.com/admob/android/interstitial)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

*Cập nhật tài liệu: 31/10/2026. Những ví dụ và checklist là hướng dẫn triển khai; chính sách chính thức tại các liên kết trên luôn là nguồn quyết định.*
