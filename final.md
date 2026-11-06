# Lumen — Full Implementation, UI/UX Refinement & Product Completion

Tôi muốn bạn tiếp tục phát triển Lumen cho đến khi hoàn thiện toàn bộ phạm vi nâng cấp đã thống nhất.

Đây không chỉ là nhiệm vụ bổ sung tính năng backend. Bạn cần hoàn thiện đồng bộ **Frontend, Backend, Database, UI/UX và User Experience**.

Đặc biệt, hãy dành sự chú ý lớn cho giao diện. Một tính năng chỉ được xem là hoàn thành khi nó hoạt động thực tế và có giao diện được thiết kế chỉn chu.

## 1. Initial Instructions

Trước khi sửa code:

1. Đọc `PROJECT_CONTEXT.md` và `UPGRADE_PROGRESS.md` nếu đã tồn tại.
2. Kiểm tra toàn bộ repository và trạng thái triển khai hiện tại.
3. Xác định các tính năng đã hoàn thành, đang triển khai và còn thiếu.
4. Kiểm tra các trang frontend, API, database và những luồng sử dụng liên quan.
5. Tiếp tục công việc từ trạng thái hiện tại, không làm lại những phần đã hoàn thiện.

Không giả định rằng tính năng đã hoàn thành chỉ vì có file hoặc giao diện tương ứng. Hãy kiểm tra hoạt động thực tế.

## 2. Main Development Scope

Tiếp tục hoàn thiện 4 module:

### A. Response Quality
- Response Quality Score.
- Completion Time Analysis.
- Straight-lining Detection.
- Attention Check.
- Duplicate Detection.
- Inconsistent Responses.
- Quality Flags.
- Review Interface.
- Quản lý trạng thái phản hồi.
- Thống kê chất lượng phản hồi.

### B. Psychology Analytics
- Descriptive Statistics.
- Likert Scale Analysis.
- Response Distribution.
- Question-level Analysis.
- Group Comparison.
- Cross-tabulation.
- Correlation Analysis.
- Scale Reliability (Cronbach's Alpha khi phù hợp).
- Visualization.
- Data Filtering.

### C. Research Management
- Research Projects.
- Project Overview.
- Survey Organization.
- Research Status.
- Progress Tracking.
- Research Notes.
- Participant Management.
- Collaboration và Access Control khi cần.
- Activity History.

### D. Export, Reporting & Data Management
- Excel Export.
- CSV Export.
- PDF Report.
- Custom Export.
- Research Report.
- Dataset Management.
- Data Filtering.
- Data Anonymization.
- Dataset Versioning.
- Data Integrity.

Đối với từng chức năng, hãy kiểm tra trạng thái hiện tại và chỉ triển khai phần còn thiếu.

## 3. UI/UX — Extremely Important

Đây là một trong những yêu cầu quan trọng nhất.

Tôi không muốn giao diện chỉ đẹp khi đã có dữ liệu. **Ngay cả khi database chưa có dữ liệu, trang chưa có nghiên cứu hoặc người dùng chưa thực hiện thao tác nào, giao diện vẫn phải hoàn chỉnh, cân đối và chuyên nghiệp.**

### A. Empty States

Kiểm tra tất cả các trang và component khi không có dữ liệu:

- Chưa có nghiên cứu nào.
- Chưa có khảo sát.
- Chưa có phản hồi.
- Chưa có dữ liệu analytics.
- Chưa có dataset.
- Chưa có báo cáo.
- Chưa có activity history.
- Không tìm thấy kết quả sau khi lọc.
- Người dùng chưa có quyền truy cập dữ liệu.

Mỗi empty state cần:
- Icon hoặc illustration phù hợp, không quá phô trương.
- Tiêu đề rõ ràng.
- Mô tả ngắn giải thích tình trạng.
- CTA phù hợp nếu người dùng có thể thực hiện hành động tiếp theo.
- Khoảng cách, căn chỉnh và kích thước hợp lý.

Không sử dụng những dòng chữ đơn giản như "No data found" rồi để trống phần còn lại của trang.

Không tạo dữ liệu giả chỉ để làm giao diện trông đầy đặn.

### B. Selection, Dropdown & Form Controls

Đặc biệt chú ý thiết kế lại các thành phần lựa chọn:

- `<select>` và custom dropdown.
- Native `<option>` nếu vẫn sử dụng.
- Checkbox.
- Radio button.
- Multi-select.
- Searchable select.
- Date picker.
- Filter dropdown.
- Tabs và segmented controls.
- Menu lựa chọn trong bảng.
- Bulk selection.
- Pagination controls.

Yêu cầu:
- Thiết kế nhất quán với nhận diện Lumen.
- Không để dropdown mặc định của trình duyệt làm giao diện thiếu đồng nhất khi có thể custom phù hợp.
- Selected state phải rõ ràng nhưng không quá nổi bật.
- Hover, focus, active, disabled và error states phải được thiết kế riêng.
- Có thể sử dụng icon check, indicator hoặc highlight tinh tế cho lựa chọn hiện tại.
- Menu phải có khoảng cách, padding, border radius và shadow hợp lý.
- Không để dropdown bị cắt bởi container hoặc tràn khỏi viewport.
- Hỗ trợ bàn phím và accessibility.
- Trên mobile, các thành phần lựa chọn phải dễ thao tác.

Đối với native `<select>`, hãy cân nhắc giữ nguyên khả năng truy cập và hành vi bàn phím; chỉ custom giao diện khi không làm giảm usability.

### C. Tables & Data Presentation

Các bảng quản lý dữ liệu phải được thiết kế chỉn chu:

- Header rõ ràng.
- Row spacing hợp lý.
- Hover state tinh tế.
- Selected row state.
- Checkbox selection.
- Status badges.
- Action menus.
- Pagination.
- Search và filters.
- Loading skeleton.
- Empty state.
- Responsive behavior.

Không để bảng quá dày, chữ quá nhỏ hoặc các nút hành động chen chúc.

Đối với bảng có nhiều cột, cần xử lý responsive hợp lý thay vì để trang tràn ngang không kiểm soát.

### D. Cards, Panels & Dashboard

- KPI cards có hierarchy rõ ràng.
- Biểu đồ có tiêu đề, chú thích và thông tin cần thiết.
- Cards có padding và spacing nhất quán.
- Không lạm dụng border, shadow hoặc màu sắc.
- Các khu vực nội dung phải có bố cục rõ ràng.
- Tránh các card quá lớn nhưng chỉ chứa một dòng chữ.
- Không để các khu vực trống bất thường khi chưa có dữ liệu.

### E. Loading & Feedback States

Thiết kế đầy đủ:
- Page loading.
- Component loading.
- Table skeleton.
- Chart loading.
- Button loading.
- Form submission.
- Success toast.
- Error toast.
- Confirmation dialog.
- Destructive action confirmation.
- Retry state.

Không để người dùng nhấn nút nhiều lần khi request đang xử lý.

### F. Typography & Spacing

Giữ nguyên typography và màu sắc thương hiệu hiện tại của Lumen.

Kiểm tra:
- Heading hierarchy.
- Font size.
- Font weight.
- Line height.
- Text truncation.
- Content width.
- Vertical rhythm.
- Padding và margin.
- Alignment giữa các thành phần.

Đặc biệt chú ý các trang có nhiều dữ liệu và nội dung phân tích.

### G. Responsive & Accessibility

Kiểm tra trên:
- Desktop.
- Tablet.
- Mobile.

Đảm bảo:
- Sidebar và navigation hoạt động tốt.
- Dialog không vượt viewport.
- Dropdown không bị che khuất.
- Bảng có cách hiển thị phù hợp.
- Không có horizontal overflow ngoài chủ đích.
- Focus state rõ ràng.
- Có thể sử dụng các chức năng chính bằng bàn phím.
- Contrast đủ tốt.

## 4. Design Consistency

Giữ nguyên phong cách nhận diện Lumen:

- Lavender background.
- Navy ink.
- Iris purple.
- Teal.
- Amber.
- Rose.
- Fraunces cho heading.
- Plus Jakarta Sans cho nội dung.

Không tự ý đổi palette hoặc redesign toàn bộ thương hiệu.

Hãy rà soát và thống nhất các design tokens, button styles, input styles, dropdown styles, card styles, badge styles và dialog styles.

Ưu tiên tái sử dụng component và CSS hiện có thay vì tạo nhiều biến thể không cần thiết.

## 5. Functional Requirements

Tất cả các thành phần giao diện phải kết nối với chức năng thực tế.

- Không có button giả.
- Không có filter chỉ thay đổi giao diện nhưng không lọc dữ liệu.
- Không có export button không tạo được file.
- Không có chart sử dụng số liệu hardcode.
- Không có form chỉ hiển thị mà không lưu dữ liệu.
- Không có menu điều hướng đến trang chưa được triển khai mà không có thông báo rõ ràng.

Các thao tác phải có loading, success và error feedback phù hợp.

## 6. Technical Requirements

Tiếp tục sử dụng kiến trúc hiện tại:

- HTML/CSS/JavaScript thuần.
- Node.js ES Modules.
- Express 4.
- Supabase PostgreSQL.
- JWT và cookie `httpOnly`.

Không chuyển framework hoặc viết lại hệ thống nếu không thực sự cần thiết.

Đảm bảo:
- Database migrations an toàn.
- API authentication và authorization.
- Bảo toàn dữ liệu khảo sát và phản hồi cũ.
- Kiểm soát quyền truy cập dữ liệu.
- Xử lý lỗi và validation.
- Tối ưu truy vấn.
- Không đưa secrets vào frontend.

## 7. Quality Assurance

Sau khi triển khai, hãy thực hiện kiểm tra toàn diện:

**Functional Testing**
- Tạo, chỉnh sửa và quản lý nghiên cứu.
- Xem và đánh giá chất lượng phản hồi.
- Lọc và phân tích dữ liệu.
- Tạo báo cáo.
- Xuất Excel, CSV và PDF.
- Kiểm tra phân quyền.

**UI Testing**
- Trang có dữ liệu.
- Trang không có dữ liệu.
- Trang có một bản ghi.
- Trang có nhiều bản ghi.
- Kết quả tìm kiếm rỗng.
- Dropdown mở và đóng.
- Selection và deselection.
- Dialog và confirmation.
- Loading và error states.
- Responsive và horizontal overflow.

**Regression Testing**
- Đăng nhập và đăng xuất.
- Tạo và xuất bản khảo sát.
- Gửi phản hồi công khai.
- Chỉnh sửa khảo sát có phản hồi cũ.
- Admin management.
- Các API và chức năng hiện tại.

Không chỉ kiểm tra cú pháp. Hãy kiểm tra các luồng sử dụng thực tế.

## 8. Progress Tracking

Tạo và cập nhật duy nhất file `UPGRADE_PROGRESS.md` để theo dõi tiến độ.

File phải ngắn gọn, gồm:

- Current Phase.
- Completed.
- In Progress.
- Pending.
- Last Updated.

Cập nhật sau mỗi giai đoạn hoàn thành.

Không tạo thêm tài liệu tiến độ hoặc báo cáo Markdown khác.

## 9. Completion Criteria

Chỉ xem dự án hoàn thành khi:

- Cả 4 module đã được triển khai theo phạm vi đã thống nhất.
- Các chức năng có kết nối backend và database thực tế.
- Không còn các button hoặc UI controls giả.
- Empty states được thiết kế đầy đủ.
- Dropdown, selection, checkbox, radio và filter có giao diện nhất quán.
- Tables, cards, charts và dialogs được hoàn thiện.
- Loading, error, success và confirmation states hoạt động.
- Responsive được kiểm tra.
- Các chức năng cũ không bị phá vỡ.
- Các kiểm thử quan trọng đã chạy và không còn lỗi nghiêm trọng chưa xử lý.
- `UPGRADE_PROGRESS.md` phản ánh chính xác trạng thái cuối cùng.

## 10. Final Instructions

Hãy tiếp tục làm việc từ trạng thái hiện tại và chủ động hoàn thành toàn bộ phạm vi nâng cấp.

Không dừng lại chỉ vì đã tạo xong một giao diện hoặc một vài API.

Ưu tiên chất lượng sản phẩm hoàn chỉnh thay vì số lượng tính năng.

Nếu một tính năng không thể triển khai an toàn hoặc thiếu thông tin quan trọng, hãy giải thích và ghi nhận trong tiến độ thay vì tạo giải pháp giả.

**Đặc biệt: Hãy kiểm tra lại toàn bộ giao diện sau khi hoàn thiện chức năng. Tôi muốn Lumen trông chỉn chu ngay cả khi chưa có dữ liệu, chứ không chỉ đẹp trong những trường hợp đã có dữ liệu mẫu.**