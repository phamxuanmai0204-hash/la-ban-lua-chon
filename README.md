<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/e51d160e-229e-4d0f-8f07-e8187fbcd6a1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cơ sở dữ liệu tập trung (Supabase) – đồng bộ máy tính ↔ điện thoại

Ứng dụng lưu tài khoản (học sinh / phụ huynh / giáo viên), hồ sơ 5 chặng,
lịch sử trò chuyện AI và ghi chú của giáo viên trong Supabase. Nếu chưa cấu
hình Supabase, máy chủ tự lưu vào tệp JSON trong `.data/` (chỉ phù hợp để thử
trên máy; Render sẽ xoá thư mục này mỗi lần deploy).

### 1. Tạo project Supabase miễn phí
1. Vào https://supabase.com → đăng nhập → **New project**.
2. Đặt tên, chọn mật khẩu database, chờ project khởi tạo xong.

### 2. Tạo bảng dữ liệu
1. Mở **SQL Editor** của project.
2. Copy toàn bộ nội dung file `supabase/schema.sql` trong repo, dán vào và bấm **Run**.

### 3. Lấy khóa kết nối
1. Vào **Project Settings → API**.
2. Ghi lại **Project URL** (dạng `https://xxxx.supabase.co`).
3. Ghi lại **Secret key** (mới) hoặc **service_role** key (cũ) ở mục *Project API keys*.
   Đây là khóa bí mật, chỉ dùng ở máy chủ – không dán vào mã giao diện.
4. **Publishable key** (`sb_publishable_...`) không bắt buộc với máy chủ hiện tại.

### 4. Dán khóa vào `.env` khi chạy trên máy
Tạo file `.env` ở thư mục gốc (đã có trong `.gitignore`, không commit):

```
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="dán-service-role-key"
GEMINI_API_KEY="khóa-gemini"
```

### 5. Khai báo trên Render
1. Vào Render → chọn service của ứng dụng → tab **Environment**.
2. Thêm hai biến `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` (cùng
   `GEMINI_API_KEY` nếu chưa có), bấm **Save Changes**.
3. Render tự redeploy. Khi khởi động, log máy chủ sẽ ghi
   `... Supabase ...` nếu kết nối đám mây đã bật.

Sau khi cấu hình, đăng nhập trên máy tính rồi mở điện thoại bằng cùng tài
khoản: dữ liệu 5 chặng, nhật ký và lịch sử AI được tải từ cơ sở dữ liệu chung;
mọi thay đổi mới được lưu lại và đồng bộ cho phụ huynh đã liên kết PIN cùng
giáo viên chủ nhiệm `CoThuy912`.
