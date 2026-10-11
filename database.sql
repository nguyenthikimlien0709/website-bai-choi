-- ==============================================================================
-- CƠ SỞ DỮ LIỆU BÀI CHÒI DI SẢN (HỖ TRỢ SUPABASE POSTGRESQL)
-- Hướng dẫn: Mở Supabase -> Chọn SQL Editor -> Dán toàn bộ file này -> Bấm Run
-- ==============================================================================

-- 1. BẢNG HỒ SƠ TÀI KHOẢN & PHÂN QUYỀN
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  role TEXT CHECK (role IN ('customer', 'staff', 'admin')) DEFAULT 'customer',
  coins INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tự động thêm cột coins nếu bảng profiles đã tồn tại
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'coins'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN coins INT NOT NULL DEFAULT 50;
  END IF;
END $$;

-- 1.1 BẢNG LỊCH SỬ GIAO DỊCH XU (VÍ XU CHÒI)
CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID,
  amount INT NOT NULL,
  type TEXT CHECK (type IN ('bonus', 'topup', 'spend')) NOT NULL,
  description TEXT NOT NULL,
  payment_method TEXT,
  balance_after INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG SỰ KIỆN BÀI CHÒI
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  sale_start_date TIMESTAMPTZ NOT NULL,
  sale_end_date TIMESTAMPTZ NOT NULL,
  total_tickets INT NOT NULL DEFAULT 100,
  ticket_price INT NOT NULL DEFAULT 50000,
  banner_url TEXT,
  status TEXT CHECK (status IN ('upcoming', 'online_sale', 'closed_online', 'offline_sale', 'ended')) DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG ẤN PHẨM & ĐỒ LƯU NIỆM
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price INT NOT NULL,
  stock INT NOT NULL DEFAULT 50,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG ĐƠN HÀNG (Ấn phẩm & Vé - Quản lý trong Admin)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT,
  total_amount INT NOT NULL,
  order_type TEXT CHECK (order_type IN ('publication', 'ticket')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'shipping', 'delivered', 'cancelled')) DEFAULT 'pending',
  payment_method TEXT DEFAULT 'cod',
  coins_paid INT DEFAULT 0,
  items JSONB NOT NULL,
  event_id UUID REFERENCES public.events ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tự động thêm cột payment_method và coins_paid nếu bảng orders đã tồn tại
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN payment_method TEXT DEFAULT 'cod';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'coins_paid'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN coins_paid INT DEFAULT 0;
  END IF;
END $$;

-- 5. BẢNG VÉ SỰ KIỆN (Staff soát vé & bán tại quầy)
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders ON DELETE SET NULL,
  ticket_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  ticket_channel TEXT CHECK (ticket_channel IN ('online_early', 'offline_door')) NOT NULL,
  status TEXT CHECK (status IN ('unused', 'checked_in')) DEFAULT 'unused',
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- BẬT ROW LEVEL SECURITY (RLS) & THIẾT LẬP QUYỀN TRUY CẬP ĐẦY ĐỦ
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

-- Dọn dẹp policy cũ trước khi tạo lại để tránh lỗi "already exists"
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public update profiles" ON public.profiles;

DROP POLICY IF EXISTS "Public read coin_transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Public insert coin_transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Public update coin_transactions" ON public.coin_transactions;
DROP POLICY IF EXISTS "Public delete coin_transactions" ON public.coin_transactions;

DROP POLICY IF EXISTS "Public read events" ON public.events;
DROP POLICY IF EXISTS "Allow insert events" ON public.events;
DROP POLICY IF EXISTS "Allow update events" ON public.events;
DROP POLICY IF EXISTS "Allow delete events" ON public.events;

DROP POLICY IF EXISTS "Public read publications" ON public.publications;
DROP POLICY IF EXISTS "Allow insert publications" ON public.publications;
DROP POLICY IF EXISTS "Allow update publications" ON public.publications;
DROP POLICY IF EXISTS "Allow delete publications" ON public.publications;

DROP POLICY IF EXISTS "Users read own orders" ON public.orders;
DROP POLICY IF EXISTS "Users create orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public update orders" ON public.orders;
DROP POLICY IF EXISTS "Public delete orders" ON public.orders;

DROP POLICY IF EXISTS "Staff and admin manage tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Public delete tickets" ON public.tickets;

-- CHÍNH SÁCH MỚI (Cho phép ứng dụng Web & Admin đọc, ghi, chỉnh sửa trơn tru)
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update profiles" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Public read coin_transactions" ON public.coin_transactions FOR SELECT USING (true);
CREATE POLICY "Public insert coin_transactions" ON public.coin_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update coin_transactions" ON public.coin_transactions FOR UPDATE USING (true);
CREATE POLICY "Public delete coin_transactions" ON public.coin_transactions FOR DELETE USING (true);

CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow delete events" ON public.events FOR DELETE USING (true);

CREATE POLICY "Public read publications" ON public.publications FOR SELECT USING (true);
CREATE POLICY "Allow insert publications" ON public.publications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update publications" ON public.publications FOR UPDATE USING (true);
CREATE POLICY "Allow delete publications" ON public.publications FOR DELETE USING (true);

CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Public delete orders" ON public.orders FOR DELETE USING (true);

CREATE POLICY "Public read tickets" ON public.tickets FOR SELECT USING (true);
CREATE POLICY "Public insert tickets" ON public.tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tickets" ON public.tickets FOR UPDATE USING (true);
CREATE POLICY "Public delete tickets" ON public.tickets FOR DELETE USING (true);


-- ==============================================================================
-- DỮ LIỆU MẪU ĐẦY ĐỦ (SEED DATA CHO CẢ 4 BẢNG - KHÔNG BỊ TRỐNG TABLE)
-- ==============================================================================

-- 1. SEED SỰ KIỆN (EVENTS)
INSERT INTO public.events (title, description, location, event_date, sale_start_date, sale_end_date, total_tickets, ticket_price, banner_url, status)
VALUES
  ('Hội Đánh Bài Chòi Xuân 2026 - Quảng Trường Quy Nhơn', 'Hội chơi bài chòi cổ truyền mừng xuân với sự tham gia của các nghệ nhân ưu tú.', 'Quảng trường Chiến Thắng, TP. Quy Nhơn, Bình Định', '2026-03-20 19:30:00+07', '2026-03-01 00:00:00+07', '2026-03-05 23:59:00+07', 120, 50000, '/assets/mock up (1).png', 'online_sale'),
  ('Đêm Thơ Ca & Di Sản Bài Chòi Cổ Truyền Hội An', 'Không gian diễn xướng bài chòi ven sông Hoài phố cổ Hội An.', 'Sân đình Hội An, Phố cổ Hội An, Quảng Nam', '2026-04-12 19:00:00+07', '2026-03-15 00:00:00+07', '2026-03-28 23:59:00+07', 80, 60000, '/assets/mock up (1).png', 'offline_sale'),
  ('Giao Lưu Hiệu Bài Chòi & Tinh Hoa Nghệ Nhân Miền Trung', 'Đêm giao lưu nghệ thuật dân gian giữa các đoàn nghệ thuật miền Trung.', 'Trung tâm Văn hóa Tỉnh Quảng Ngãi', '2026-02-15 18:30:00+07', '2026-01-15 00:00:00+07', '2026-02-01 23:59:00+07', 100, 45000, '/assets/mock up (1).png', 'ended')
ON CONFLICT DO NOTHING;

-- 2. SEED ẤN PHẨM DI SẢN (PUBLICATIONS)
INSERT INTO public.publications (name, description, price, stock, image_url, category)
VALUES
  ('Bộ Bài Chòi Dân Gian 30 Thẻ Gỗ Tự Nhiên', 'Chế tác từ gỗ tự nhiên khắc laser 3 pho Văn, Vạn, Hạch. Gồm túi vải bảo quản và sách hướng dẫn luật chơi cổ truyền.', 290000, 25, '/assets/thedungbai.jpg', 'Bộ Thẻ Bài'),
  ('Hộp Đựng Bài Chòi Sơn Mài Cách Điệu', 'Hộp đựng bài cao cấp với hệ hoa văn mây sóng, nắp trượt thông minh giữ thẻ luôn nguyên vẹn.', 150000, 40, '/assets/thedungbai1.jpg', 'Hộp Đựng'),
  ('Áo Thun Di Sản Bài Chòi Cổ Truyền', 'Cotton 100% 250gsm thoáng mát, in họa tiết biểu tượng anh Hiệu và câu ca Bài Chòi đặc sắc.', 180000, 50, '/assets/quatangsukien(1).jpg', 'Thời Trang'),
  ('Móc Khóa Thẻ Bài Chòi Gỗ Khắc Tay', 'Móc khóa gỗ tự nhiên khắc hình các quân bài may mắn (Nhứt Nọc, Nhì Nghèo, Tam Quăng...).', 35000, 120, '/assets/quatangsukien4.jpg', 'Quà Lưu Niệm'),
  ('Túi Tote Canvas Họa Tiết Mái Chòi', 'Vải canvas dày dặn thân thiện môi trường, in logo mái chòi và hoa văn dân gian miền Trung.', 95000, 35, '/assets/anpham1.png', 'Bao Bì & Túi'),
  ('Combo Quà Tặng Gốm & Lịch Di Sản', 'Bộ quà tặng cao cấp gồm gốm sứ mộc tráng men và lịch để bàn minh họa 30 lá bài Chòi qua 12 tháng.', 220000, 18, '/assets/quatangsukien(2).jpg', 'Bộ Quà Tặng')
ON CONFLICT DO NOTHING;

-- 3. SEED ĐƠN HÀNG (ORDERS)
INSERT INTO public.orders (customer_name, customer_phone, shipping_address, total_amount, order_type, status, items)
VALUES
  (
    'Trần Minh Quân',
    '0918 234 567',
    '120 Lê Lợi, TP. Quy Nhơn, Bình Định',
    100000,
    'ticket',
    'delivered',
    '[{"id": "evt-01", "name": "2 Vé Sự Kiện Quy Nhơn", "quantity": 2, "price": 50000}]'::jsonb
  ),
  (
    'Lê Thu Trang',
    '0905 678 910',
    '45 Trần Phú, Phường Cẩm Châu, TP. Hội An',
    360000,
    'publication',
    'pending',
    '[{"id": "pub-01", "name": "Bộ Bài Chòi Gỗ", "quantity": 1, "price": 290000}, {"id": "pub-04", "name": "Móc Khóa", "quantity": 2, "price": 35000}]'::jsonb
  ),
  (
    'Nguyễn Thị Kim Liên',
    '0907 775 897',
    '234 Nguyễn Huệ, TP. Quy Nhơn, Bình Định',
    180000,
    'publication',
    'shipping',
    '[{"id": "pub-03", "name": "Áo Thun Di Sản Bài Chòi (Size L)", "quantity": 1, "price": 180000, "size": "L"}]'::jsonb
  )
ON CONFLICT DO NOTHING;

-- 4. SEED VÉ SỰ KIỆN (TICKETS)
INSERT INTO public.tickets (ticket_code, customer_name, customer_phone, ticket_channel, status)
VALUES
  ('VE-2026-001', 'Nguyễn Văn Hùng', '0901 888 777', 'online_early', 'unused'),
  ('VE-2026-002', 'Trần Thị Mai', '0935 444 333', 'online_early', 'checked_in'),
  ('VE-2026-003', 'Lê Hoàng Nam', '0912 333 999', 'online_early', 'unused')
ON CONFLICT DO NOTHING;
