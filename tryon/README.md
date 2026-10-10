# CatVTON trong Việt phục Remix

Phần model thuộc cùng repository, không dùng API tạo ảnh có trả phí. Giao diện và Worker gọi thành phần GPU của chính sản phẩm qua HTTP. Cloudflare Workers không có CUDA/GPU, nên không thể đóng gói trọng số vào Worker rồi chạy tại Sites. Để bản online thử đồ thật, thành phần GPU phải chạy trên máy có GPU và URL HTTPS truy cập được từ Worker. Laptop localhost chỉ kiểm thử tại máy, chưa phục vụ được bản online.

## Luồng thử đồ

Mở nút “Thử bộ này trên ảnh” hoặc “Thử trên ảnh của bạn” trên thẻ. Tải ảnh người, dùng mẫu trang phục hoặc tải ảnh áo riêng, tô vùng cần thay và đồng ý xử lý ảnh. Có cọ/tẩy và thanh trượt chọn vùng cho bàn phím. CatVTON nhận ảnh người, ảnh áo và mask; ảnh trả về có thể xem cạnh ảnh gốc hoặc tải PNG. Phụ kiện trong bộ phối chưa được ghép thêm. Ảnh AI không dùng để xác nhận độ vừa hay tính chính xác lịch sử.

Ảnh được thu nhỏ tối đa 1024 px và bỏ metadata trong trình duyệt trước khi gửi. JPG/PNG/WebP, giới hạn file gốc 10 MB và 24 megapixel; ảnh xử lý tối đa 4 MB mỗi file. Ảnh không vào D1, R2, sessionStorage hoặc lookbook. Model service giữ ảnh trong RAM trong lúc xử lý, không ghi file, không log request body; bỏ dữ liệu sau khi trả kết quả. Người dùng có thể xóa ảnh trong trình duyệt. Kiểm tra chính sách log/retention của nhà cung cấp GPU nếu triển khai bên ngoài.

Mask thủ công giúp kiểm soát vùng được thay và tránh phụ thuộc DensePose/Detectron2. Sau inference, U2Net tách người để khôi phục nền trong vùng tô rộng. Chỉ vùng mask được ghép vào ảnh gốc đã resize/pad; giữ mặt và tay khi các phần đó nằm ngoài mask. Tô hết áo cũ, kể cả vai và tay áo, để tránh sót vải cũ. Ảnh người nghiêng nhiều, áo dài/tứ thân nhiều lớp có thể mất chi tiết; cần QA thực tế, không có bảo đảm đạt cho mọi Việt phục.

## Chạy tại máy Windows có NVIDIA

1. Python 3.11 và PyTorch CUDA. Tạo môi trường riêng; không thay package Python toàn hệ thống.
2. Clone CatVTON và checkout `999bdbe81e6008a3f5749af7c1e0b0fa3d21b48e` vào `.sites-runtime/catvton-upstream`.
3. Cài `tryon/requirements.txt` vào môi trường GPU. Set `CATVTON_SOURCE` đến checkout, `HF_HOME` đến cache riêng. Lần đầu tải khoảng 5 GB trọng số; cần thêm dung lượng cho môi trường Python.
4. Chạy `npm run build`, sau đó `node tryon/run-local.mjs`. Một lệnh mở app và model tại `http://127.0.0.1:5174/?view=try-on`, tự tạo secret trong bộ nhớ, không cần nhập endpoint hoặc API key. Ctrl+C dừng cả hai thành phần. Nếu dùng môi trường Python khác, set `CATVTON_PYTHON` đến Python của môi trường đó.
5. Bản cục bộ chỉ nghe ở loopback, dùng một danh tính local và dữ liệu D1 riêng trong `.sites-runtime/local-data`; không đồng bộ tài khoản online. Adapter local không được dùng để deploy. Gemma trên bản online vẫn dùng cấu hình riêng tại Sites.

Nếu chỉ chạy GPU để nối vào bản web: set `TRYON_API_KEY` ngẫu nhiên tối thiểu 32 ký tự, rồi chạy trong thư mục `tryon`: `python -m uvicorn server:app --host 127.0.0.1 --port 7861 --no-access-log`. App development có thể dùng `TRYON_API_URL=http://127.0.0.1:7861` cùng key; bản hosted cần HTTPS trên GPU host.

Model khởi động bất đồng bộ. `/health` có xác thực, trả `ready=false` trong lúc nạp. Chỉ mở nút thử đồ khi model thực sự sẵn sàng. Cấu hình mặc định 384×512 phù hợp để thử trên GPU 6 GB; hỗ trợ 576×768/768×1024 qua `CATVTON_WIDTH` và `CATVTON_HEIGHT` trên máy đủ VRAM.

## Đóng gói GPU

`docker build -t vietphuc-catvton tryon` rồi chạy trên Linux với NVIDIA Container Toolkit, `--gpus all`, volume `/cache` và secret `TRYON_API_KEY`. Image dùng PyTorch CUDA; Dockerfile chưa được xác minh bằng Docker build trong lượt kiểm thử Windows. Chạy đúng một Uvicorn worker để giới hạn một inference tại một thời điểm; thêm request trả 429, tối đa 6 lượt/người/giờ theo process. Đặt reverse proxy TLS có body limit 9 MB, timeout trên 180 giây và tắt log body. Không xuất API key trong URL.

Set Sites secrets `TRYON_API_URL=https://<gpu-host>` và `TRYON_API_KEY`, rồi deploy app. Worker yêu cầu danh tính ChatGPT, kiểm tra Origin, chữ ký ảnh, consent, giới hạn body/output, từ chối redirect; chỉ chuyển hash user tới GPU để quota. Không trả endpoint hoặc secret cho browser. Khi thiếu cấu hình, giao diện nói rõ chưa mở thử đồ, không tạo ảnh giả hoặc dùng lớp ghép thay CatVTON.

## Quyền sử dụng

CatVTON: https://github.com/Zheng-Chong/CatVTON, Zheng Chong và cộng sự, ICLR 2025. Code và checkpoint được phát hành **CC BY-NC-SA 4.0**, chỉ dùng phi thương mại, ghi nguồn và chia sẻ sửa đổi theo cùng giấy phép. Tài liệu gốc: https://github.com/Zheng-Chong/CatVTON/blob/main/LICENSE. Thành phần tích hợp trong thư mục `tryon` dùng cùng CC BY-NC-SA 4.0. Đánh giá lại giấy phép trước khi kinh doanh sản phẩm. Base model, VAE và safety checker có giấy phép riêng trong repository của chúng.

Kiểm thử: `python -m unittest discover -s tryon -p 'test_*.py'` và `node --test tests/try-on.test.mjs`. Các test contract mô phỏng inference được ghi rõ; chỉ gọi GPU thật mới chứng minh chất lượng model.
