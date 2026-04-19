Ví dụ login bằng Google:

🔁 Flow chuẩn:

Bước 1: FE → OAuth Server
Nhiệm vụ:→ redirect user qua Google login
👉 Thực tế nên có thêm:
client_id
redirect_uri
scope
state 🔥 (chống CSRF)

Bước 2: User login xong → OAuth Server redirect về BE (callback URL)
Nhiệm vụ:→ kèm theo: ?code=AUTH_CODE
👉 BE phải: check lại state (rất quan trọng)

Bước 3: BE (callback API) → OAuth Server
Nhiệm vụ: gửi:
code
client_id
client_secret
redirect_uri
👉Đổi lấy:
access_token
id_token

Bước 4: BE → OAuth Server (có thể xử lí ở callback API hoặc Auth API)
Nhiệm vụ:→ dùng access_token gọi API lấy: user info
hoặc:decode id_token (JWT) để lấy info nhanh hơn (id_token là JWT, có thể decode lấy thông tin ngay mà không cần gọi API thêm)

Bước 5: BE (Auth API) xử lý
Nhiệm vụ: tìm user trong DB: nếu chưa có → tạo mới

Bước 6: BE → FE
Nhiệm vụ: → trả:
access_token (của hệ thống bạn)
refresh_token
