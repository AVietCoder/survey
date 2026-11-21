# Reward System – Các quyết định thiết kế

## A. Nội dung nhiệm vụ

### 1. File nhiệm vụ nhóm xanh và bản cuối nhóm vàng/đỏ

**Trả lời:**

Hiện tại chưa chốt hoàn toàn nội dung nhiệm vụ nhóm xanh và bản cuối nhóm vàng/đỏ.

- Hãy thiết kế hệ thống nhiệm vụ theo hướng data-driven, không hard-code nhiệm vụ vào logic ứng dụng.
- Mỗi nhiệm vụ cần có ID, tên, mô tả, hướng dẫn thực hiện, điểm thưởng, nhóm áp dụng, thời gian thực hiện, điều kiện hoàn thành và phương thức xác minh.
- Hỗ trợ thêm, sửa, ẩn và thay thế nhiệm vụ thông qua trang quản trị.
- Sử dụng nhiệm vụ mẫu cho nhóm xanh trong giai đoạn phát triển, nhưng phải đánh dấu là dữ liệu tạm thời.
- Không tự ý biến nhiệm vụ mẫu thành nội dung can thiệp chính thức.

### 2. Kiểm chứng Y-03, Y-04 và R-01

**Trả lời:**

Ưu tiên phương pháp tự báo cáo, tránh thu thập dữ liệu ngoài phạm vi cần thiết.

- Y-03: Học sinh tự xác nhận đã điều chỉnh độ sáng màn hình.
- Y-04: Học sinh tự xác nhận đã thực hiện khung giờ vàng 90 phút.
- R-01: Chỉ ghi nhận loại hành động được lựa chọn như hoãn, nhờ giúp đỡ hoặc tạm dừng hoạt động.
- Không theo dõi hoạt động trên ứng dụng khác.
- Không yêu cầu quyền truy cập dữ liệu sử dụng điện thoại hoặc lịch sử hoạt động.
- Không sử dụng cơ chế giám sát gây cảm giác bị theo dõi.

### 3. Mức độ chấp nhận tự báo cáo

**Trả lời:**

Chấp nhận tự báo cáo đối với những nhiệm vụ không thể xác minh khách quan.

Áp dụng nguyên tắc xác minh tối thiểu:

- Bộ đếm thời gian phía máy chủ cho nhiệm vụ cần thời lượng.
- Timestamp cho nhiệm vụ có mốc thời gian.
- Kiểm tra số lượng ký tự ở trình duyệt nếu thực sự cần thiết, không đọc hoặc lưu nội dung nhập.
- Không yêu cầu ảnh chụp màn hình, camera, microphone hoặc bằng chứng riêng tư.
- Không sử dụng các biện pháp chống gian lận quá nghiêm ngặt khiến học sinh cảm thấy áp lực.

Ưu tiên trải nghiệm và quyền riêng tư hơn việc kiểm soát tuyệt đối điểm thưởng.

## B. Điểm thưởng (TVT) và giới hạn

### 4. Ý nghĩa TVT và tên hiển thị

**Trả lời:**

- Giữ TVT làm mã định danh nội bộ trong database và source code.
- Tên hiển thị trên giao diện là **Sao (⭐)**.
- Có thể tùy chỉnh tên và biểu tượng đơn vị điểm trong trang quản trị.
- Thiết kế hệ thống để có thể đổi tên đơn vị điểm mà không ảnh hưởng đến dữ liệu lịch sử.

### 5. Trần điểm mỗi ngày và mỗi tuần

**Trả lời:**

Đồng ý với mức mặc định:

- Tối đa 50 TVT/ngày.
- Tối đa 250 TVT/tuần.
- Mỗi nhiệm vụ chỉ được nhận thưởng một lần mỗi ngày, trừ nhiệm vụ có cấu hình khác.
- Trần điểm phải được cấu hình từ trang quản trị.
- Điểm đã nhận không bị thu hồi vì học sinh bỏ lỡ nhiệm vụ vào những ngày tiếp theo.

Cần có cơ chế chống cộng điểm trùng khi người dùng tải lại trang, đăng nhập lại hoặc gửi yêu cầu nhiều lần.

### 6. Trần điểm giữa nhóm vàng và đỏ

**Trả lời:**

Đồng ý sử dụng trần điểm chung cho cả ba nhóm.

- Không để nhóm đỏ nhận tổng điểm cao hơn nhóm vàng chỉ vì có mức độ khó khăn cao hơn.
- Không tạo động lực để học sinh cố tình trả lời khảo sát theo hướng tiêu cực nhằm nhận nhiều điểm.
- Nhóm được xác định dựa trên kết quả đánh giá và giữ cố định trong một chu kỳ theo dõi.
- Chỉ cập nhật nhóm khi có kỳ đánh giá lại hợp lệ.
- Không thưởng thêm điểm dựa trên mức độ cải thiện điểm khảo sát.
- Điểm thưởng chỉ khuyến khích quá trình tham gia nhiệm vụ, không đánh giá mức độ nghiêm trọng hay giá trị của học sinh.

## C. Chia 3 mức điểm

### 7. Thang đo và ngưỡng xanh/vàng/đỏ

**Trả lời:**

Không tự đặt ngưỡng phân loại khi chưa có căn cứ khoa học.

Hệ thống cần cho phép nhà nghiên cứu cấu hình:

- Tên công cụ khảo sát.
- Phiên bản và nguồn tham chiếu.
- Khoảng điểm hợp lệ.
- Chiều hướng điểm: cao là tốt hơn hay xấu hơn.
- Ngưỡng phân loại xanh, vàng và đỏ.
- Quy tắc xử lý dữ liệu thiếu hoặc câu trả lời không hợp lệ.

Hệ thống phải kiểm tra ngưỡng không chồng lấn, không có khoảng điểm bị bỏ sót và phù hợp với chiều hướng điểm.

Mỗi lần đánh giá phải lưu lại cấu hình ngưỡng được sử dụng để phục vụ đối chiếu và tái lập nghiên cứu.

Lưu ý: Phân nhóm chỉ mang tính sàng lọc theo công cụ nghiên cứu, không được hiển thị hoặc diễn giải như một chẩn đoán tâm lý.

### 8. Tên nhóm hiển thị cho học sinh

**Trả lời:**

Không mặc định hiển thị nhãn xanh/vàng/đỏ cho học sinh.

Thay vào đó, sử dụng các tên thân thiện:

- Nhóm xanh: Gói Duy trì.
- Nhóm vàng: Gói Cân bằng.
- Nhóm đỏ: Gói Đồng hành.

Tên gọi phải có thể tùy chỉnh trong trang quản trị.

Không sử dụng màu sắc hoặc ngôn ngữ mang tính đánh giá, phân biệt hay khiến học sinh cảm thấy mình thuộc nhóm tốt hoặc xấu.

Nhà nghiên cứu vẫn được xem thông tin phân nhóm trong phạm vi quyền truy cập được cấp.

## D. An toàn cho học sinh nhóm đỏ

### 9. Kênh hỗ trợ

**Trả lời:**

Thiết kế một khu vực hỗ trợ riêng, có tên thân thiện như **Bạn cần người đồng hành?**

Cho phép nhà nghiên cứu hoặc quản trị viên cấu hình:

- Phòng tư vấn tâm lý của trường.
- Giáo viên hoặc cán bộ phụ trách.
- Kênh liên hệ hỗ trợ chính thức.
- Địa chỉ và thông tin liên hệ.
- Hướng dẫn tìm kiếm sự trợ giúp trực tiếp.

Khi bật nhóm đỏ, nhà nghiên cứu bắt buộc phải cấu hình ít nhất một kênh hỗ trợ phù hợp trước khi công bố khảo sát.

Hộp hỗ trợ phải dễ tìm, không bị khóa sau khi hoàn thành nhiệm vụ hoặc đăng ký theo dõi.

Không tự tạo thông tin liên hệ hoặc hiển thị thông tin chưa được xác minh.

### 10. Câu hỏi về ý định tự làm hại bản thân

**Trả lời:**

Đây là nội dung cần được kiểm soát đặc biệt.

- Không tự ý thêm câu hỏi về nội dung này vào bộ khảo sát.
- Chỉ cho phép triển khai khi có công cụ phù hợp và quy trình xử lý được hội đồng đạo đức hoặc đơn vị có trách nhiệm phê duyệt.
- Phải có quy trình chuyển tiếp đến người có chuyên môn hoặc người phụ trách được nhà trường chỉ định.
- Không được để hệ thống tự động kết luận tình trạng của học sinh.
- Không được hứa hẹn tính ẩn danh tuyệt đối nếu dữ liệu hoặc quy trình xử lý có khả năng nhận diện cá nhân.
- Số liệu báo cáo cho nhà nghiên cứu phải được tổng hợp và áp dụng ngưỡng ẩn danh phù hợp.

Nếu chưa có quy trình can thiệp được phê duyệt, không triển khai loại câu hỏi này trong phiên bản hiện tại.

## E. Đạo đức và đồng ý

### 11. Sự đồng ý của học sinh dưới 18 tuổi

**Trả lời:**

Chưa thể mặc định rằng học sinh dưới 18 tuổi có thể tự đồng ý tham gia nghiên cứu.

Thiết kế hệ thống hỗ trợ:

- Xác nhận sự đồng thuận tham gia của học sinh (assent).
- Sự đồng ý của phụ huynh/người giám hộ khi được yêu cầu.
- Cấu hình các trường hợp được hội đồng đạo đức cho phép miễn hoặc thay đổi yêu cầu đồng ý.
- Lưu phiên bản nội dung đồng ý và thời điểm xác nhận.

Chỉ triển khai nghiên cứu thực tế sau khi có sự phê duyệt phù hợp của nhà trường và hội đồng đạo đức có thẩm quyền.

### 12. Soạn và duyệt nội dung đồng ý

**Trả lời:**

Nhóm nghiên cứu chịu trách nhiệm soạn nội dung, người có thẩm quyền chịu trách nhiệm duyệt.

Nội dung phải giải thích rõ:

- Mục đích nghiên cứu.
- Dữ liệu được thu thập.
- Cách sử dụng và lưu trữ dữ liệu.
- Quyền từ chối hoặc rút lui.
- Quy trình yêu cầu xóa dữ liệu.
- Phạm vi ẩn danh và các giới hạn của tính bảo mật.
- Thông tin liên hệ của đơn vị phụ trách.

Hệ thống phải lưu phiên bản nội dung đồng ý, thời gian xác nhận và mã băm của nội dung tương ứng.

Không cho phép thay đổi nội dung đồng ý đã được sử dụng trong các phiên nghiên cứu trước.

## F. Thiết kế nghiên cứu

### 13. Nhóm đối chứng

**Trả lời:**

Đồng ý. Hệ thống nên hỗ trợ nhóm đối chứng để đánh giá hiệu quả của reward system.

Cần có khả năng:

- Bật/tắt phần thưởng theo từng khảo sát hoặc nhóm nghiên cứu.
- Phân bổ nhóm theo thiết kế nghiên cứu được phê duyệt.
- Giữ các điều kiện nghiên cứu nhất quán.
- Ghi nhận nhóm thử nghiệm và nhóm đối chứng.
- Xuất dữ liệu phục vụ phân tích thống kê.

Không để học sinh tự chọn nhóm nghiên cứu.

Việc phân bổ nhóm phải được thực hiện theo phương pháp nghiên cứu đã xác định, tránh gây thiên lệch kết quả.

### 14. Chu kỳ đánh giá lại

**Trả lời:**

Ưu tiên tích hợp với Progress Tracking hiện có.

- Mặc định đề xuất: 14 ngày/lần.
- Cho phép nhà nghiên cứu cấu hình chu kỳ phù hợp với công cụ khảo sát và thiết kế nghiên cứu.
- Không tự động đánh giá lại quá thường xuyên nếu công cụ không phù hợp.
- Nhóm của học sinh giữ nguyên trong một chu kỳ.
- Mỗi lần đánh giá lưu thành một phiên riêng, không ghi đè dữ liệu cũ.
- Có thể so sánh tiến triển giữa các phiên đánh giá.

Không mặc định rằng thay đổi điểm khảo sát đồng nghĩa với cải thiện sức khỏe tinh thần.

## G. Vận hành và dữ liệu

### 15. Nhắc học sinh thực hiện nhiệm vụ

**Trả lời:**

Ưu tiên nhắc nhở nhẹ nhàng, không gây áp lực.

- Hiển thị lời nhắc khi học sinh mở ứng dụng.
- Cho phép bật/tắt thông báo nhắc nhiệm vụ.
- Có thể triển khai nhắc nhở cục bộ trên thiết bị.
- Không bắt buộc cung cấp email hoặc số điện thoại.
- Không gửi thông báo gây cảm giác tội lỗi khi bỏ lỡ nhiệm vụ.
- Không phạt hoặc trừ điểm khi học sinh không tham gia một ngày.

Thú cưng có thể có phản ứng dễ thương khi học sinh quay lại, nhưng không được thể hiện sự buồn bã, thất vọng hoặc trách móc khiến học sinh cảm thấy có lỗi.

### 16. Múi giờ và chuỗi ngày

**Trả lời:**

- Sử dụng múi giờ Asia/Ho_Chi_Minh (UTC+7) làm múi giờ mặc định.
- Một ngày mới bắt đầu lúc 00:00 theo giờ Việt Nam.
- Cuối tuần vẫn được tính như ngày bình thường.
- Ngày lễ không tự động làm mất chuỗi ngày.
- Hệ thống có thẻ nghỉ (Rest Card) để học sinh chủ động sử dụng.
- Không xóa tiến trình hoặc trừ điểm khi chuỗi ngày bị gián đoạn.
- Chuỗi ngày chỉ mang ý nghĩa khuyến khích, không phải thước đo sức khỏe tinh thần.

### 17. Thời gian lưu trữ và xóa dữ liệu

**Trả lời:**

Thiết kế theo nguyên tắc tối thiểu hóa dữ liệu và bảo vệ quyền riêng tư của người chưa thành niên.

- Không lưu thông tin cá nhân không cần thiết.
- Tách dữ liệu định danh khỏi dữ liệu khảo sát khi có thể.
- Mã định danh học sinh phải được quản lý an toàn.
- Cho phép người dùng yêu cầu xóa hồ sơ theo chính sách nghiên cứu.
- Có quy trình xử lý yêu cầu xóa dữ liệu và thông báo rõ những dữ liệu nào không thể xóa ngay do nghĩa vụ nghiên cứu hoặc pháp lý.
- Thời hạn lưu trữ do nhóm nghiên cứu và đơn vị có thẩm quyền xác định trước khi triển khai.
- Dữ liệu tổng hợp chỉ được giữ theo thời hạn đã phê duyệt.
- Có cơ chế xóa hoặc ẩn danh dữ liệu khi hết thời hạn lưu trữ.

Không tự đặt thời hạn lưu trữ cố định khi chưa có chính sách chính thức của nghiên cứu.

### 18. Quà thật

**Trả lời:**

Chưa triển khai quà tặng vật lý trong phiên bản đầu tiên.

MVP chỉ sử dụng phần thưởng kỹ thuật số:

- Danh hiệu.
- Huy hiệu.
- Sticker.
- Giao diện.
- Vật phẩm trang trí cho thú cưng.
- Nội dung mở khóa.

Thiết kế database có khả năng mở rộng sang phần thưởng vật lý trong tương lai, nhưng không triển khai logic đổi quà thật ở thời điểm hiện tại.

Nếu triển khai sau này, cần có cơ chế chống nhận thưởng trùng lặp, quy trình trao thưởng minh bạch và phương án bảo vệ danh tính học sinh.

---

## Nguyên tắc thiết kế tổng thể

1. Không biến sức khỏe tinh thần thành cuộc thi tích điểm.
2. Không thưởng nhiều hơn cho học sinh có kết quả khảo sát tiêu cực hơn.
3. Không sử dụng cơ chế phạt khi bỏ lỡ nhiệm vụ.
4. Không thu thập dữ liệu vượt quá nhu cầu nghiên cứu.
5. Không hiển thị nhãn phân nhóm gây kỳ thị.
6. Ưu tiên phần thưởng mang tính khích lệ, cá nhân hóa và tích cực.
7. Mọi cấu hình nghiên cứu phải được lưu lại để có thể kiểm tra và tái lập.
8. Phân biệt rõ chức năng hỗ trợ hành vi với chức năng sàng lọc tâm lý.
9. Thiết kế toàn bộ reward system theo hướng module hóa, có thể mở rộng mà không ảnh hưởng đến Progress Tracking, Survey System và các chức năng hiện có.
10. Các tính năng liên quan đến học sinh chưa thành niên phải tuân thủ quy trình đạo đức và bảo vệ dữ liệu phù hợp.