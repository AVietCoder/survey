# Reward System: các điểm cần chốt

Tài liệu này liệt kê những điều **còn cần bạn/nhóm nghiên cứu quyết định** trước khi làm các phần phụ thuộc của hệ thống điểm thưởng (reward system). Mỗi mục có: vì sao cần hỏi, gợi ý mặc định của mình, và chỗ trả lời. Trả lời ngắn gọn là đủ; mục nào chưa biết thì ghi "chưa rõ" để mình đưa vào danh sách việc phải chốt.

## Đã chốt

- Bộ câu hỏi khảo sát do nhóm bạn tự tạo trong hệ thống; nhà khoa học khác tự thêm bộ của họ. Hệ thống chỉ tự chia 3 mức điểm.
- Mã định danh do app tự sinh khi học sinh bắt đầu (dùng lại mã khôi phục + cookie của Progress Tracking).
- Học sinh tự đồng ý trong app.
- Nhãn xanh/vàng/đỏ có hiện cho học sinh hay không: nhà nghiên cứu cấu hình từng khảo sát.
- Bản đầu chỉ có phần thưởng số (danh hiệu, giao diện, huy hiệu, sticker). Quà thật chưa bật.
- Game: thú cưng + chuỗi ngày (có thẻ nghỉ) + mini-game gắn với nhiệm vụ.
- Nhóm xanh có nhiệm vụ duy trì nhẹ; nhóm đỏ luôn có hộp hỗ trợ và nhà nghiên cứu thấy số liệu tổng hợp.

## A. Nội dung nhiệm vụ

### 1. Bạn gửi file nhiệm vụ nhóm xanh và bản cuối của nhiệm vụ nhóm vàng/đỏ được không?

- **Vì sao cần hỏi:** solution.md mới có nhóm vàng (Y-01…Y-05) và đỏ (R-01…R-05). Nhóm xanh chưa có. Y-03, Y-04, R-01 chưa ghi cách kiểm chứng.
- **Gợi ý của mình:** Mình dựng sẵn danh mục nhiệm vụ dạng dữ liệu (không viết cứng trong code) và dùng bộ nhiệm vụ xanh tạm, thay khi bạn gửi.
- **Trả lời của bạn:** 

### 2. Y-03 (giảm độ sáng màn hình), Y-04 (khung giờ vàng 90 phút), R-01 (cắt tải chủ động) được kiểm chứng thế nào?

- **Vì sao cần hỏi:** App chỉ biết dấu thời gian của chính nó, không biết độ sáng màn hình hay thời gian online ở app khác. Vì vậy "cờ nếu khai đã cắt giảm mà online nhiều" của R-01 không thể đo được.
- **Gợi ý của mình:** Coi Y-03, Y-04 là tự báo cáo (kèm câu xác nhận dễ thương). R-01 chỉ lưu loại hành động (hoãn / nhờ giúp / rút lui), không lưu chữ tự do và không đo thời gian online.
- **Trả lời của bạn:** 

### 3. Với nhiệm vụ cần bằng chứng, bạn chấp nhận "tự báo cáo" ở mức nào?

- **Vì sao cần hỏi:** Càng đòi bằng chứng càng nặng nề với học sinh; càng ít càng dễ gian lận điểm.
- **Gợi ý của mình:** Dùng bộ đếm giờ phía máy chủ (R-03, Y-01), dấu thời gian (R-02, R-04, Y-05), đếm ký tự ở trình duyệt (R-05, không đọc nội dung).
- **Trả lời của bạn:** 

## B. Điểm thưởng (TVT) và giới hạn

### 4. "TVT" là viết tắt của gì? Có đổi tên hiển thị cho dễ thương hơn không?

- **Vì sao cần hỏi:** Tên đơn vị điểm xuất hiện khắp giao diện.
- **Gợi ý của mình:** Giữ "TVT" làm mã nội bộ, tên hiển thị tùy bạn.
- **Trả lời của bạn:** 

### 5. Trần điểm mỗi ngày và mỗi tuần là bao nhiêu?

- **Vì sao cần hỏi:** Bạn muốn chặn việc cày điểm. Tổng điểm nhiệm vụ vàng là 85, đỏ là 130 mỗi ngày nếu làm hết.
- **Gợi ý của mình:** Mặc định 50 điểm/ngày và 250 điểm/tuần, mỗi nhiệm vụ tối đa 1 lần/ngày, chỉnh được. Cùng một trần cho mọi nhóm.
- **Trả lời của bạn:** 

### 6. Điểm nhiệm vụ nhóm đỏ cao hơn vàng (20–35 so với 15–20). Bạn có đồng ý dùng trần chung và hiển thị điểm theo nhiệm vụ nhưng không để tổng điểm nhóm đỏ cao hơn?

- **Vì sao cần hỏi:** Nếu nhóm đỏ được điểm nhiều hơn thì học sinh có động cơ trả lời khảo sát tệ hơn để vào nhóm đỏ. Điều này làm sai dữ liệu và làm hỏng can thiệp.
- **Gợi ý của mình:** Trần chung cho mọi nhóm, nhóm cố định theo từng phiên đánh giá, chỉ đổi khi đến kỳ đánh giá lại của lịch theo dõi. Không thưởng theo mức cải thiện điểm khảo sát.
- **Trả lời của bạn:** 

## C. Chia 3 mức điểm

### 7. Thang đo nào được dùng và ngưỡng cắt xanh/vàng/đỏ là bao nhiêu? Nguồn của ngưỡng?

- **Vì sao cần hỏi:** Hệ thống không tự suy ra ngưỡng. Ngưỡng phải lấy từ công cụ đã chuẩn hóa, nếu không việc phân loại học sinh thiếu căn cứ khoa học.
- **Gợi ý của mình:** Hệ thống cho nhà nghiên cứu nhập ngưỡng và hướng điểm (cao là tốt hơn hay tệ hơn), kiểm tra ngưỡng không chồng nhau và phủ hết khoảng điểm. Mỗi phiên lưu cả ngưỡng đã dùng.
- **Trả lời của bạn:** 

### 8. Nhãn nhóm hiển thị cho học sinh là gì (nếu hiện)? Có dùng tên thân thiện như "Gói ngủ ngon", "Gói hạ nhiệt" không?

- **Vì sao cần hỏi:** Nhãn "đỏ" có thể gây lo lắng hoặc bị bạn bè đánh giá.
- **Gợi ý của mình:** Mặc định ẩn màu và dùng tên gói thân thiện; nhà nghiên cứu vẫn thấy nhóm trong số liệu tổng hợp.
- **Trả lời của bạn:** 

## D. An toàn cho học sinh nhóm đỏ

### 9. Kênh hỗ trợ nào sẽ hiện cho học sinh (phòng tư vấn của trường, đường dây nóng, email)?

- **Vì sao cần hỏi:** Nhóm đỏ có thể gồm em đang rất kiệt sức hoặc có dấu hiệu nặng. Mình sẽ không tự viết số điện thoại hay địa chỉ hỗ trợ.
- **Gợi ý của mình:** Trường "Kênh hỗ trợ" là bắt buộc khi bật nhóm đỏ; hộp "Cần người nói chuyện?" luôn hiện ở trang kết quả, kể cả khi học sinh không đăng ký theo dõi.
- **Trả lời của bạn:** 

### 10. Có khảo sát nào chứa câu hỏi về ý định tự làm hại bản thân không? Nếu có, quy trình xử lý là gì?

- **Vì sao cần hỏi:** Hệ thống ẩn danh nên không thể liên hệ riêng từng em. Cần quy trình ở mức lớp/trường.
- **Gợi ý của mình:** Nhà nghiên cứu chỉ thấy số lượng tổng hợp theo nhóm (ẩn khi dưới 5 người). Quy trình can thiệp theo lớp do nhà trường quyết định.
- **Trả lời của bạn:** 

## E. Đạo đức và đồng ý

### 11. Hội đồng đạo đức hoặc nhà trường có chấp thuận học sinh dưới 18 tuổi tự đồng ý trong app không?

- **Vì sao cần hỏi:** Luồng hiện tại yêu cầu xác nhận từ 18 tuổi. Bạn đã chọn để học sinh tự đồng ý; nhiều nơi yêu cầu thêm sự đồng ý của phụ huynh với người chưa thành niên.
- **Gợi ý của mình:** Mình chuyển phần xác nhận tuổi thành tuyên bố phù hợp lứa tuổi và ghi phiên bản nội dung đồng ý. Bạn nên xin xác nhận bằng văn bản của nhà trường/hội đồng đạo đức trước khi dùng thật.
- **Trả lời của bạn:** 

### 12. Nội dung đồng ý (mục đích, dữ liệu thu thập, quyền rút lui, xóa hồ sơ) ai soạn và ai duyệt?

- **Vì sao cần hỏi:** Hệ thống chỉ có đoạn mẫu, chưa qua rà soát pháp lý hoặc đạo đức.
- **Gợi ý của mình:** Nhóm nghiên cứu soạn, hệ thống lưu phiên bản và mã băm của đúng nội dung học sinh đã đồng ý.
- **Trả lời của bạn:** 

## F. Thiết kế nghiên cứu

### 13. Có cần nhóm đối chứng không bật phần thưởng để đo hiệu ứng không?

- **Vì sao cần hỏi:** Phần thưởng làm thay đổi hành vi; nếu mọi học sinh đều có thưởng thì không tách được tác động của can thiệp khỏi tác động của việc được thưởng.
- **Gợi ý của mình:** Cho phép bật/tắt phần thưởng theo từng khảo sát hoặc theo lớp.
- **Trả lời của bạn:** 

### 14. Đánh giá lại bao lâu một lần (7 ngày? 14 ngày?) và có bao nhiêu lần?

- **Vì sao cần hỏi:** Nhóm của học sinh cố định giữa hai kỳ đánh giá; kỳ đánh giá lại dùng lịch theo dõi tiến triển hiện có.
- **Gợi ý của mình:** Dùng lịch theo dõi sẵn có (mặc định 7 ngày, chỉnh được).
- **Trả lời của bạn:** 

## G. Vận hành và dữ liệu

### 15. Có cần nhắc học sinh làm nhiệm vụ mỗi ngày không?

- **Vì sao cần hỏi:** Hệ thống không lưu email hay số điện thoại nên không thể nhắc từ xa. Đây là rủi ro lớn cho việc duy trì thói quen.
- **Gợi ý của mình:** Dựa vào chuỗi ngày, thú cưng "nhớ em" khi mở app, và giáo viên nhắc ở lớp. Có thể thêm lịch nhắc cục bộ trên thiết bị về sau.
- **Trả lời của bạn:** 

### 16. Ngày mới tính theo múi giờ nào, và cuối tuần/ngày lễ có tính vào chuỗi không?

- **Vì sao cần hỏi:** Ranh giới ngày quyết định "một lần mỗi ngày", chuỗi ngày và khung giờ ngủ trưa Y-01.
- **Gợi ý của mình:** Cố định Asia/Ho_Chi_Minh; ngày lễ không phá chuỗi nhờ thẻ nghỉ.
- **Trả lời của bạn:** 

### 17. Dữ liệu và hồ sơ học sinh giữ bao lâu và xóa thế nào?

- **Vì sao cần hỏi:** Cần chính sách lưu trữ và quyền xóa rõ ràng cho dữ liệu của người chưa thành niên.
- **Gợi ý của mình:** Học sinh tự xóa hồ sơ trong app; nhà nghiên cứu đặt thời hạn lưu dữ liệu tổng hợp.
- **Trả lời của bạn:** 

### 18. Khi nào có quà thật (nếu có ngân sách) và trao thế nào mà vẫn ẩn danh?

- **Vì sao cần hỏi:** Quà thật làm lệch động cơ làm khảo sát và cần danh tính mạnh hơn (một người dễ tạo nhiều mã).
- **Gợi ý của mình:** Để sau. Thiết kế sẵn chỗ gắn: mã nhận quà dùng một lần, trao qua giáo viên chủ nhiệm, không thu tên.
- **Trả lời của bạn:** 

---

Gửi lại file này kèm câu trả lời, hoặc nói thẳng trong cuộc trò chuyện. Phần chưa trả lời được sẽ dùng giá trị gợi ý và ghi rõ trong tài liệu thiết kế.
