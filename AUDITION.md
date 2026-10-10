## Tên giải pháp

Việt phục Remix

## Nhu cầu người dùng và tình huống sử dụng

Người trẻ đang quan tâm trở lại tới Việt phục, nhưng khoảng cách từ “thấy đẹp” đến “tự tin mặc” vẫn lớn: khó phân biệt kiểu áo, chọn màu và phụ kiện theo dịp, hình dung bộ phối trên bản thân và tìm thông tin văn hóa đáng tin cậy. Khi chuẩn bị kỷ yếu hay ngày hội văn hóa cho nhóm, ý tưởng còn bị phân tán trong nhiều ảnh và tin nhắn.

Việt phục Remix hướng tới học sinh, sinh viên với ba nhóm trang phục: áo dài trong đời sống đương đại, áo tứ thân gắn với Bắc Bộ và áo ngũ thân gắn với Huế. Nhu cầu cốt lõi là ra quyết định phối đồ nhanh, nhìn thấy phương án, hiểu đặc trưng và nhận biết cách tân trước khi sử dụng ở bối cảnh có yêu cầu riêng.

Tình huống sử dụng: chụp kỷ yếu, hội xuân/Tết, ngày hội văn hóa, tham quan di tích và đám cưới; tận dụng áo/phụ kiện đang có; phối đồng bộ cho 2–6 người; thử thay áo trên ảnh cá nhân, so sánh phương án và xuất ảnh để trao đổi. Sản phẩm được thiết kế quanh toàn bộ hành trình khám phá – phối – thử – chuẩn bị – lưu lại.

## Tóm tắt giải pháp

Việt phục Remix đưa Việt phục từ nguồn cảm hứng thành một lựa chọn có thể thực hành: một studio tiếng Việt kết nối hiểu biết văn hóa, cá tính Gen Z và trải nghiệm phối đồ trực quan.

Người dùng chọn áo dài, áo tứ thân hoặc áo ngũ thân; chọn sự kiện, phong cách, màu và phụ kiện; xem mockup cùng ba phương án có tên và lý do phối do Gemma diễn giải; đọc đặc trưng có nguồn; so sánh, lưu lookbook và xuất poster PNG. Điểm khác biệt nằm ở sự kết nối giữa thẩm mỹ và ngữ cảnh: gợi ý luôn gắn với loại áo, dịp sử dụng và những lưu ý cần biết.

Sản phẩm đi tiếp tới nhu cầu thực tế: Color Lab khám phá hòa sắc; Tủ đồ tận dụng món đang có và chỉ ra món thiếu; Phối nhóm điều chỉnh riêng 2–6 thành viên và xuất tổng thể; checklist chuẩn bị theo bối cảnh; quiz văn hóa có giải thích và nguồn. Dữ liệu được lưu theo tài khoản, có xử lý lỗi và xung đột, giúp người dùng quay lại tiếp tục kế hoạch.

Virtual try-on bằng CatVTON thuộc phạm vi bản nộp: tải ảnh người, chọn/tải ảnh áo, đánh dấu vùng thay, xác nhận xử lý ảnh, xem trước–sau và tải PNG. Thành phần GPU đã chạy thật cục bộ trên ba nhóm trang phục; giao diện web và mã triển khai đi kèm. Bản online hiện chưa nối máy GPU, nên chức năng sinh ảnh được thể hiện đúng trạng thái; video minh chứng trình bày kết quả cục bộ.

Gemma là lớp diễn giải cá nhân hóa trong trải nghiệm đang hoạt động; Gemini là đối tác rà soát giải pháp và kiểm chứng prompting qua cuộc trò chuyện thật. Hai vai trò kết hợp với bộ quy tắc và tư liệu biên soạn để AI hữu ích mà không chiếm quyền quyết định kiến thức văn hóa. Phối cách tân được ghi rõ là đương đại; các thẻ văn hóa dẫn Vietnam Tourism và các bảo tàng.

## Tác động kỳ vọng

Việt phục Remix hướng tới biến sự quan tâm tới Việt phục thành hành động: người trẻ có thể tự lên phương án cho một dịp cụ thể, giải thích lựa chọn và trao đổi bằng hình ảnh rõ ràng. Tủ đồ giúp tận dụng những món đã có; phối nhóm giảm công sức thống nhất ý tưởng; try-on bổ sung một bước hình dung trực quan trước khi thử trang phục thật.

Với cộng đồng, sản phẩm tạo một điểm chạm học văn hóa ngay trong quá trình phối đồ. Đặc trưng, nguồn tham khảo và nhãn “phối đương đại” giúp người dùng hiểu sự khác biệt giữa cảm hứng hiện đại và thông tin về trang phục. Lookbook, poster và ảnh nhóm có thể trở thành cách kể chuyện văn hóa gần với thói quen sáng tạo của Gen Z.

Tiềm năng phát triển là một công cụ chuẩn bị Việt phục cho trường học, câu lạc bộ và sự kiện văn hóa, với tư liệu tiếp tục được bổ sung và thẩm định. Thành công sẽ được đo bằng tỷ lệ hoàn thành bộ phối, quay lại lookbook, sử dụng món sẵn có, tương tác với nguồn văn hóa và phản hồi về mức tự tin lựa chọn. Đây là các chỉ số cho thử nghiệm tiếp theo; minh chứng hiện tại tập trung vào tính khả thi kỹ thuật và trải nghiệm đã vận hành, chưa quy đổi thành số liệu tác động cộng đồng.

## Hướng tiếp cận và giải pháp kỹ thuật

Kiến trúc phân tách ba nhiệm vụ: bộ quy tắc giữ cấu trúc bộ phối; mô hình ngôn ngữ diễn giải thẩm mỹ; mô hình thị giác thực hiện try-on. Cách phân công này giúp mỗi thành phần AI tạo giá trị ở đúng thế mạnh và giữ đầu ra có thể kiểm tra.

Frontend React, TypeScript và Vinext cung cấp Studio responsive, Canvas mockup đổi màu, poster/collage PNG và phông tiếng Việt lưu cùng ứng dụng. Kho nội dung chứa ba loại áo, năm sự kiện, ba phong cách, sáu màu, sáu phụ kiện cùng đặc trưng và URL nguồn. Color Lab hỗ trợ trung tính, tương đồng, bổ túc; thời tiết checklist là bối cảnh người dùng chọn.

Cloudflare Workers xử lý API; D1 lưu lookbook, bộ sưu tập, tủ đồ, kế hoạch nhóm, checklist và quiz theo tài khoản xác thực. Server kiểm tra schema Zod, Origin và quyền sở hữu. Revision ngăn phiên cũ ghi đè dữ liệu mới; giao diện giữ nội dung đang sửa khi có xung đột. Lựa chọn Studio được giữ trong sessionStorage để tiếp tục công việc sau tải lại.

Luồng gợi ý: lựa chọn hợp lệ → ba candidates do bộ quy tắc tạo → prompt có ngữ cảnh → adapter AI → kiểm tra JSON/trạng thái hoàn tất/độ dài → ghép title và reason vào thẻ gốc. Gemma qua Ollama Cloud đang phục vụ bản online; adapter Gemini generateContent có systemInstruction và responseSchema, sẵn sàng cấu hình khóa Google. Secret chỉ ở server. Lỗi/quota/timeout dùng gợi ý biên soạn sẵn để hành trình phối đồ tiếp tục.

Try-on: trình duyệt chuẩn hóa ảnh và vùng mask; API Worker xác thực, kiểm tra file, giới hạn kích thước và chuyển tới dịch vụ Python/FastAPI chạy CatVTON. GPU xử lý FP16, bảo toàn phần ảnh ngoài vùng chọn, trả PNG để so sánh/tải về. Ảnh không lưu D1/R2; dịch vụ có xác thực, hàng đợi giới hạn, kiểm tra an toàn đầu ra. Có runner cục bộ và Dockerfile; GPU online cần được cấu hình riêng. CatVTON dùng giấy phép CC BY-NC-SA 4.0, phù hợp bản thi phi thương mại.

Minh chứng: TypeScript/build thành công; 17 test Node và 8 test Python; ma trận 270 tổ hợp; 15 cấu hình Gemma thật tạo 45 thẻ đúng schema; UI 320/390 px, so sánh và xuất PNG. CatVTON chạy thật ba loại áo ở 384×512 trên RTX 4050 6GB, khoảng 9,8–10,2 giây/lượt; luồng giao diện cục bộ tới ảnh kết quả và tải PNG đã kiểm tra. Hồ sơ QA phân biệt rõ kết quả online và GPU cục bộ.

## Cách sử dụng Gemini

Gemini và Gemma tạo thành hai vai trò bổ trợ xuyên suốt việc hoàn thiện Việt phục Remix: Gemini giúp phản biện thiết kế và nâng chất lượng prompting; Gemma chuyển ngữ cảnh phối đồ thành lời gợi ý dễ hiểu trong sản phẩm đang hoạt động. Giá trị AI nằm ở khả năng nối lựa chọn kỹ thuật với ngôn ngữ gần gũi, giúp người dùng hiểu vì sao một phương án đáng thử.

Gemini được sử dụng thật để rà soát bài toán, trải nghiệm, giới hạn văn hóa và chiến lược kiểm thử. Đầu vào gồm đối tượng học sinh/sinh viên, ba nhóm trang phục, luồng sản phẩm, kiến trúc, danh mục lựa chọn và các chức năng đã triển khai. Đầu ra gồm gợi ý cải thiện UX, yêu cầu nguồn, quy tắc system prompt, checklist và ca thử. Đội đối chiếu các đề xuất với sản phẩm, chọn phần phù hợp và phản hồi lại những chi tiết chưa khớp. Cuộc trò chuyện công khai là minh chứng trực tiếp.

Một lượt kiểm chứng prompting cụ thể yêu cầu Gemini tạo đúng ba cặp title/reason cho ba phương án áo tứ thân cố định. Sau khi đội làm rõ danh mục phụ kiện và màu thắt lưng, Gemini trả JSON đúng ba phần tử, giữ thứ tự, title 30 ký tự và reason 131–137 ký tự; sneaker được mô tả là phối đương đại. Vòng phản hồi này cho thấy Gemini hỗ trợ chuyển ý tưởng thành một hợp đồng đầu ra có thể kiểm tra, thay vì chỉ tạo đoạn văn quảng bá.

Gemma đảm nhận lớp diễn giải trực tiếp trên bản online: nhận lựa chọn sự kiện, phong cách, bảng màu, phụ kiện, tư liệu và ba candidates; trả tên bộ phối và lý do thẩm mỹ. Nhờ đó, mỗi thẻ có nội dung gắn với lựa chọn của người dùng. 15 cấu hình gọi model thật đã tạo 45 thẻ hợp lệ. Bộ quy tắc giữ loại áo/màu/phụ kiện; tư liệu biên soạn giữ phần kiến thức văn hóa.

Mã nguồn cũng tích hợp adapter Gemini generateContent với systemInstruction, application/json và responseSchema để dùng chung hợp đồng đầu ra khi cấu hình Google API. Bản online hiện vận hành Gemma qua Ollama Cloud; Gemini được chứng minh bằng cuộc trò chuyện rà soát và thử prompt thật, chưa bằng lượt gọi Google API trên server. Sự phân công được công khai rõ: Gemini nâng chất lượng thiết kế và quy trình; Gemma phục vụ trải nghiệm; CatVTON thực hiện biến đổi ảnh try-on.

## Chiến lược và quy trình prompting

Đội thiết kế prompting như một phần của hệ thống sản phẩm: có nhiệm vụ rõ, ngữ cảnh chọn lọc, hợp đồng đầu ra và cơ chế kiểm chứng. Mục tiêu là tạo gợi ý vừa có cá tính, vừa ổn định trên giao diện và bám đúng lựa chọn của người dùng.

1. Phân quyền nội dung. AI chỉ viết tên và lý do thẩm mỹ cho ba phương án đã tạo. Loại áo, màu, phụ kiện và dữ kiện văn hóa nằm trong dữ liệu/bộ quy tắc. System prompt yêu cầu tiếng Việt rõ ràng, giữ thứ tự, ghi nhận phối đương đại và tránh sáng tác nguồn gốc, quy tắc nghi lễ hoặc tuyên bố phục dựng.

2. Ngữ cảnh có cấu trúc. Input JSON gồm garment, event, style, colors, accessories, tư liệu liên quan và candidates. Output duy nhất là {"looks":[{"title":"...","reason":"..."}]} với ba phần tử. Adapter Gemini dùng responseSchema; adapter Gemma qua Ollama kiểm tra kết quả phía server. Không gửi ảnh cá nhân hay dữ liệu tủ đồ đầy đủ vào prompt gợi ý.

3. Vòng phản biện Gemini. Đề xuất đầu tiên có ví dụ phụ kiện ngoài danh mục app. Đội sửa ngữ cảnh, cung cấp danh mục hợp lệ, phân biệt váy tối với màu thắt lưng tứ thân, yêu cầu title ≤50 ký tự và reason ≤160 ký tự cho ca thử. Gemini trả đúng ba title dài 30 ký tự, reason 131–137 ký tự và mô tả sneaker là phối đương đại. File JSON minh chứng được lưu cùng mã nguồn.

4. Kiểm chứng trên dữ liệu thật và ca lỗi. Gemma được gọi ở 15 cấu hình, 45 thẻ, bao phủ ba loại áo, năm dịp, sáu màu và 0–3 phụ kiện. Test kiểm tra thiếu/thừa phần tử, trường ngoài schema, JSON hỏng, output bị cắt, HTML/link, timeout và quota. Kiểm thử adapter Gemini trong mã nguồn dùng phản hồi mô phỏng; thử Gemini thật qua cuộc trò chuyện được ghi riêng để minh chứng có thể đối chiếu.

5. Chuyển đầu ra thành trải nghiệm đáng tin. Server kiểm tra schema, hoàn tất và độ dài; chỉ ghép title/reason vào candidates gốc. Gemma bị chặn HTML, URL, ký tự điều khiển và nội dung quá dài để bảo vệ bố cục. Khi lỗi, dùng gợi ý biên soạn sẵn và hiển thị đúng nguồn. Try-on dùng ảnh áo và vùng mask cho CatVTON, không để prompt ngôn ngữ quyết định thay toàn ảnh.

Quy trình này đặt AI vào một vòng tạo – đối chiếu – sửa – kiểm tra – hiển thị có kiểm soát. Bước tiếp theo là thử nghiệm người dùng và mở rộng tư liệu có thẩm định, dựa trên tiêu chí đã xây dựng.