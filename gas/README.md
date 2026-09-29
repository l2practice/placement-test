# Backend Apps Script — cập nhật cho Phiếu nhận xét mới

`Code.gs` trong thư mục này là bản backend của sheet **Placement test_v2**. Bản này
**không chứa mật khẩu giáo viên** (mật khẩu được đọc từ Script properties).

## Thay đổi so với bản đang chạy

| Thay đổi | Lý do |
|---|---|
| Action mới `exportReportDoc` | Nhận HTML phiếu nhận xét do trang `teacher-detail.html` dựng sẵn (đúng template: font Lexend / Be Vietnam Pro, màu, cỡ chữ, emoji) và để Drive chuyển HTML → Google Doc. Doc được lưu vào `FEEDBACK_FOLDER_ID`. |
| Action mới `saveReportNotes` + cột `reportNotes` | Lưu phần nhận xét giáo viên đã chỉnh sửa, mở lại trên máy khác vẫn còn. |
| `gradeWriting` lưu thêm `aiBand` + `aiComment` (JSON) | Lưu kết quả AI chấm chi tiết (Task Response, Grammar, Lexical, Coherence…) để đưa vào phiếu. |
| `getStudentDetail` trả thêm các câu khảo sát + `reportNotes` | Trang giáo viên hiển thị đủ phần khảo sát. |
| **Sửa đáp án câu 50 V&G: `c` → `a`** | Đáp án đúng là "as such" (phương án a); bản cũ chấm "in its own" là đúng. Chạy `rescoreVG()` để chấm lại các bài đã nộp. |
| Bỏ action `exportFeedback` cũ | Phiếu cũ không định dạng, không có nhận xét AI; thay bằng `exportReportDoc`. |

## Các bước cập nhật (khoảng 5 phút)

1. Mở Apps Script của sheet **Placement test_v2** → thay toàn bộ nội dung `Code.gs` bằng file này.
2. **Project Settings (⚙️) → Script properties → Add script property**
   - Property: `TEACHER_PASSWORD`
   - Value: mật khẩu giáo viên đang dùng
3. Chọn hàm **`upgradeSheets`** → Run (thêm cột `reportNotes`, không xoá dữ liệu).
4. Chọn hàm **`rescoreVG`** → Run (chấm lại câu 50 cho các bài đã nộp).
5. Chọn hàm **`authorizeOnce`** → Run → cấp quyền khi Google hỏi (Drive + kết nối ngoài để tạo Google Doc).
6. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.**
   Giữ nguyên deployment cũ để URL `GAS_URL` trong các file HTML không đổi.

Khi backend chưa cập nhật, trang giáo viên vẫn xem trước được phiếu và có 2 cách xuất
dự phòng: **📋 Copy để dán** vào một Google Doc trống (docs.new) hoặc **⬇️ Tải .doc**.
