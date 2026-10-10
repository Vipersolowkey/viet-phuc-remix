# Prompting và phản biện Gemini

Cuộc trò chuyện thật, gồm rà soát UX, thử JSON ba phương án, cập nhật phạm vi try-on và phản hồi lại những nhận định quá mức: https://share.gemini.google/mF8MmfyKmAIY

Đội thiết kế prompting như một phần của hệ thống sản phẩm: có nhiệm vụ rõ, ngữ cảnh chọn lọc, hợp đồng đầu ra và cơ chế kiểm chứng. Mục tiêu là tạo gợi ý vừa có cá tính, vừa ổn định trên giao diện và bám đúng lựa chọn của người dùng.

1. Phân quyền nội dung. AI chỉ viết tên và lý do thẩm mỹ cho ba phương án đã tạo. Loại áo, màu, phụ kiện và dữ kiện văn hóa nằm trong dữ liệu/bộ quy tắc. System prompt yêu cầu tiếng Việt rõ ràng, giữ thứ tự, ghi nhận phối đương đại và tránh sáng tác nguồn gốc, quy tắc nghi lễ hoặc tuyên bố phục dựng.

2. Ngữ cảnh có cấu trúc. Input JSON gồm garment, event, style, colors, accessories, tư liệu liên quan và candidates. Output duy nhất là {"looks":[{"title":"...","reason":"..."}]} với ba phần tử. Adapter Gemini dùng responseSchema; adapter Gemma qua Ollama kiểm tra kết quả phía server. Không gửi ảnh cá nhân hay dữ liệu tủ đồ đầy đủ vào prompt gợi ý.

3. Vòng phản biện Gemini. Đề xuất đầu tiên có ví dụ phụ kiện ngoài danh mục app. Đội sửa ngữ cảnh, cung cấp danh mục hợp lệ, phân biệt váy tối với màu thắt lưng tứ thân, yêu cầu title ≤50 ký tự và reason ≤160 ký tự cho ca thử. Gemini trả đúng ba title dài 30 ký tự, reason 131–137 ký tự và mô tả sneaker là phối đương đại. File JSON minh chứng được lưu cùng mã nguồn.

4. Kiểm chứng trên dữ liệu thật và ca lỗi. Gemma được gọi ở 15 cấu hình, 45 thẻ, bao phủ ba loại áo, năm dịp, sáu màu và 0–3 phụ kiện. Test kiểm tra thiếu/thừa phần tử, trường ngoài schema, JSON hỏng, output bị cắt, HTML/link, timeout và quota. Kiểm thử adapter Gemini trong mã nguồn dùng phản hồi mô phỏng; thử Gemini thật qua cuộc trò chuyện được ghi riêng để minh chứng có thể đối chiếu.

5. Chuyển đầu ra thành trải nghiệm đáng tin. Server kiểm tra schema, hoàn tất và độ dài; chỉ ghép title/reason vào candidates gốc. Gemma bị chặn HTML, URL, ký tự điều khiển và nội dung quá dài để bảo vệ bố cục. Khi lỗi, dùng gợi ý biên soạn sẵn và hiển thị đúng nguồn. Try-on dùng ảnh áo và vùng mask cho CatVTON, không để prompt ngôn ngữ quyết định thay toàn ảnh.

Quy trình này đặt AI vào một vòng tạo – đối chiếu – sửa – kiểm tra – hiển thị có kiểm soát. Bước tiếp theo là thử nghiệm người dùng và mở rộng tư liệu có thẩm định, dựa trên tiêu chí đã xây dựng.

Sau khi mở rộng try-on, Gemini đề xuất pitch và tiêu chí kiểm tra. Đội giữ phân vai ba mô hình, tiêu chí mask/bảo toàn ảnh/giới hạn VRAM, đồng thời loại các câu “triệt để”, “loại bỏ hoàn toàn” và nhận định schema đã được Gemini tạo trước triển khai. Gemma chỉ diễn giải title/reason cho candidates có sẵn.
