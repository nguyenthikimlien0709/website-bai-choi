import React, { useState, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface PolicyItem {
  id: string
  title: string
  badge: string
  activeBadgeBg?: string
  iconName: 'document' | 'shield' | 'cookie' | 'card' | 'truck' | 'refresh' | 'question' | 'info'
  summary: string
  sections: {
    heading: string
    content: string[]
    bullets?: string[]
    highlight?: string
  }[]
}

export const POLICIES: PolicyItem[] = [
  {
    id: 'dieu-khoan',
    title: 'Điều Khoản Sử Dụng',
    badge: 'Quy định chung',
    iconName: 'document',
    summary: 'Quy định chung về quyền, nghĩa vụ và trách nhiệm khi truy cập nền tảng số hóa và sử dụng dịch vụ của Dự án Di sản Bài Chòi.',
    sections: [
      {
        heading: '1. Phạm vi áp dụng & Mục đích nền tảng',
        content: [
          'Điều khoản sử dụng này ("Điều khoản") điều chỉnh việc truy cập và sử dụng website Di sản Bài Chòi (baichoi.id.vn), bao gồm hệ sinh thái trải nghiệm văn hóa số, hệ thống mô phỏng trò chơi Bài Chòi dân gian, cổng đặt vé sự kiện hội chơi và cửa hàng ấn phẩm di sản.',
          'Nền tảng được xây dựng với mục tiêu phi lợi nhuận kết hợp truyền thông văn hóa sáng tạo nhằm số hóa, bảo tồn và lan tỏa giá trị Di sản Văn hóa Phi vật thể Nghệ thuật Bài Chòi Trung Bộ (được UNESCO công nhận năm 2017) đến cộng đồng thế hệ trẻ.',
        ],
        bullets: [
          'Áp dụng cho mọi cá nhân truy cập, người chơi trải nghiệm và khách hàng đặt vé/ấn phẩm.',
          'Người dùng mặc nhiên đồng ý tuân thủ toàn bộ các điều khoản khi tiếp tục sử dụng website.',
          'Các quy định bổ sung cho từng sự kiện sẽ được thông báo rõ ràng trước khi người dùng xác nhận đặt vé.',
        ],
      },
      {
        heading: '2. Quyền sở hữu trí tuệ & Nhận diện di sản',
        content: [
          'Toàn bộ tư liệu, tranh vẽ minh họa 30 thẻ bài dân gian thuộc 3 pho (Pho Văn, Pho Vạn, Pho Hạch), các mẫu thiết kế phôi vé sự kiện, hộp quà pop-up di sản, giao diện đồ họa, âm thanh tiếng hô anh Hiệu và mã nguồn đều thuộc quyền sở hữu trí tuệ của Nhóm Dự án Bài Chòi — Cuộc thi Color Up 2026.',
        ],
        highlight: 'Nghiêm cấm mọi hành vi sao chép, tái bản, phân phối thương mại hoặc can thiệp kỹ thuật trái phép khi chưa có sự đồng thuận bằng văn bản từ Ban quản trị dự án.',
      },
      {
        heading: '3. Quy định tham gia trò chơi & Đặt vé sự kiện',
        content: [
          'Khi tham gia trò chơi Bài Chòi (Online/Offline) hoặc đăng ký đặt vé sự kiện, người dùng cam kết:',
        ],
        bullets: [
          'Cung cấp thông tin họ tên, số điện thoại và địa chỉ nhận vé chính xác để đảm bảo nhận bưu kiện tận nhà thành công.',
          'Không sử dụng bất kỳ công cụ gian lận, bot tự động hoặc can thiệp vào thuật toán bốc thẻ bài ngẫu nhiên.',
          'Tuân thủ thuần phong mỹ tục, giữ gìn nét văn hóa ứng xử lịch sự trong không gian hội chơi dân gian.',
        ],
      },
      {
        heading: '4. Giới hạn trách nhiệm pháp lý',
        content: [
          'Ban điều hành cam kết duy trì nền tảng hoạt động liên tục và ổn định. Tuy nhiên, chúng tôi không chịu trách nhiệm đối với các sự cố gián đoạn phát sinh từ phía nhà cung cấp dịch vụ mạng viễn thông hoặc sự kiện bất khả kháng.',
          'Chúng tôi có quyền tạm ngưng hoặc khóa quyền truy cập của người dùng nếu phát hiện hành vi cố ý phá hoại dữ liệu, xúc phạm nét đẹp di sản hoặc vi phạm pháp luật hiện hành.',
        ],
      },
    ],
  },
  {
    id: 'bao-mat',
    title: 'Chính Sách Bảo Mật',
    badge: 'Nghị định 13/2023',
    iconName: 'shield',
    summary: 'Cam kết bảo vệ toàn vẹn dữ liệu cá nhân theo đúng khuôn khổ Nghị định số 13/2023/NĐ-CP của Chính phủ về Bảo vệ Dữ liệu Cá nhân.',
    sections: [
      {
        heading: '1. Căn cứ pháp lý & Nguyên tắc thu thập dữ liệu',
        content: [
          'Chính sách bảo mật này tuân thủ đầy đủ các nguyên tắc bảo vệ dữ liệu cá nhân theo Nghị định số 13/2023/NĐ-CP do Chính phủ ban hành.',
          'Chúng tôi chỉ thu thập những thông tin cần thiết tối thiểu nhằm phục vụ việc tạo tài khoản thành viên, giao nhận phôi vé sự kiện, ấn phẩm di sản và hỗ trợ người dùng.',
        ],
        bullets: [
          'Họ và tên người nhận vé/ấn phẩm quà tặng.',
          'Số điện thoại liên hệ giao hàng và nhận mã tra cứu vé.',
          'Địa chỉ nhận bưu kiện tận nhà (đối với vé sự kiện và đơn đặt hàng).',
          'Địa chỉ Email dùng để xác thực tài khoản và gửi hóa đơn/vé điện tử.',
        ],
      },
      {
        heading: '2. Mục đích xử lý & Sử dụng thông tin',
        content: [
          'Dữ liệu cá nhân của quý khách được sử dụng duy nhất cho các mục đích chính đáng sau:',
        ],
        bullets: [
          'Xác nhận đơn hàng, in mã định danh vé sự kiện Bài Chòi và gửi qua đơn vị chuyển phát nhanh đến tận nhà.',
          'Thông báo lịch diễn, thông tin cập nhật nếu có sự thay đổi thời tiết hoặc địa điểm tổ chức hội chơi.',
          'Hỗ trợ tra cứu lịch sử ván chơi, điểm thưởng và tiếp nhận khiếu nại khách hàng.',
          'Tuyệt đối KHÔNG chia sẻ, cho thuê hoặc bán dữ liệu cho bên thứ ba vì mục đích tiếp thị, quảng cáo.',
        ],
      },
      {
        heading: '3. Biện pháp an toàn & Bảo mật kỹ thuật số',
        content: [
          'Hệ thống áp dụng công nghệ mã hóa kết nối SSL/TLS 256-bit theo tiêu chuẩn quốc tế. Mọi dữ liệu nhạy cảm được lưu trữ trên cơ sở dữ liệu Supabase với cơ chế phân quyền bảo mật hàng RLS (Row Level Security) nghiêm ngặt.',
          'Mật khẩu tài khoản người dùng được băm (hash) một chiều an toàn và không ai có thể giải mã được mật khẩu nguyên bản.',
        ],
      },
      {
        heading: '4. Quyền của chủ thể dữ liệu',
        content: [
          'Theo Nghị định 13/2023/NĐ-CP, quý khách có đầy đủ các quyền: Quyền được biết, Quyền truy cập, Quyền chỉnh sửa thông tin, Quyền yêu cầu xóa dữ liệu cá nhân và Quyền rút lại sự đồng ý.',
          'Quý khách có thể tự chỉnh sửa thông tin tại Trung tâm tài khoản hoặc gửi yêu cầu xóa tài khoản qua email hỗ trợ của dự án: lienntk.ce190812@gmail.com.',
        ],
      },
    ],
  },
  {
    id: 'cookie',
    title: 'Chính Sách Cookie & Lưu Trữ',
    badge: 'Minh bạch',
    iconName: 'cookie',
    summary: 'Công khai, minh bạch về việc sử dụng Cookie và LocalStorage nhằm tối ưu hóa trải nghiệm tương tác trên website.',
    sections: [
      {
        heading: '1. Cookie & Công nghệ lưu trữ cục bộ là gì?',
        content: [
          'Cookie và LocalStorage là các tập tin văn bản nhỏ được lưu trữ tạm thời trên trình duyệt của thiết bị người dùng nhằm ghi nhớ trạng thái tương tác và tùy chọn cá nhân giữa các phiên làm việc.',
        ],
      },
      {
        heading: '2. Các loại dữ liệu chúng tôi lưu trữ cục bộ',
        content: [
          'Website Bài Chòi chỉ lưu trữ các thông tin kỹ thuật phục vụ trải nghiệm người dùng, bao gồm:',
        ],
        bullets: [
          'Phiên đăng nhập an toàn (Auth Session) để bạn không cần đăng nhập lại khi tải lại trang.',
          'Trạng thái giỏ hàng tạm thời và danh sách vé đang chọn mua.',
          'Tiến trình ván chơi Bài Chòi Offline (số thẻ đã lật, cờ thưởng, điểm số hiện tại).',
          'Tùy chọn ngôn ngữ hiển thị (Tiếng Việt / English) và bật/tắt hiệu ứng âm thanh tiếng hô anh Hiệu.',
        ],
      },
      {
        heading: '3. Cam kết không theo dõi chéo bên thứ ba',
        content: [
          'Chúng tôi tôn trọng quyền riêng tư tuyệt đối. Nền tảng KHÔNG cài đặt các mã theo dõi chéo (third-party tracking cookies) nhằm phục vụ mục đích quảng cáo bám đuôi hay bán dữ liệu hành vi của người dùng.',
        ],
        highlight: 'Người dùng có toàn quyền xóa dữ liệu Cookie và LocalStorage bất kỳ lúc nào thông qua phần cài đặt của trình duyệt web.',
      },
    ],
  },
  {
    id: 'thanh-toan',
    title: 'Chính Sách Thanh Toán (COD)',
    badge: 'An toàn 100%',
    iconName: 'card',
    summary: 'Áp dụng hình thức thanh toán khi nhận hàng (COD) an toàn 100%, đồng kiểm minh bạch cho toàn bộ vé và ấn phẩm di sản.',
    sections: [
      {
        heading: '1. Hình thức thanh toán khi nhận hàng (COD)',
        content: [
          'Nhằm mang lại sự an tâm tuyệt đối cho người yêu di sản văn hóa, chúng tôi áp dụng chính sách Thanh Toán Khi Nhận Hàng (COD - Cash On Delivery) cho toàn bộ các đơn đặt vé sự kiện và ấn phẩm bài chòi.',
          'Quý khách chỉ phải thanh toán tiền mặt cho nhân viên bưu tá sau khi đã nhận được kiện hàng phôi vé chính thức và hộp quà pop-up 3D nguyên vẹn.',
        ],
      },
      {
        heading: '2. Quyền lợi đồng kiểm hàng trước khi thanh toán',
        content: [
          'Quý khách được quyền ĐỒNG KIỂM cùng nhân viên giao hàng khi nhận bưu phẩm:',
        ],
        bullets: [
          'Kiểm tra ngoại quan bưu kiện: hộp bồi carton nguyên seal, không móp méo rách nát.',
          'Kiểm tra số lượng phôi vé tham gia, mã vé sự kiện và hộp quà pop-up di sản đi kèm.',
          'Đối với bộ thẻ gỗ: kiểm tra đủ 30 thẻ bài thuộc 3 pho Văn, Vạn, Hạch và cẩm nang hướng dẫn.',
          'Nếu phát hiện hàng bị lỗi hoặc sai quy cách, quý khách có quyền từ chối nhận hàng mà không mất bất kỳ khoản chi phí nào.',
        ],
      },
      {
        heading: '3. Cam kết không phát sinh chi phí',
        content: [
          'Dự án Bài Chòi cam kết không thu trước bất kỳ chi phí nào khi quý khách đặt vé hoặc ấn phẩm trực tuyến trên hệ thống.',
          'Toàn bộ đơn hàng đều áp dụng hình thức thanh toán tiền mặt trực tiếp khi nhận hàng (COD) sau khi quý khách đã đồng kiểm hài lòng.',
        ],
      },
    ],
  },
  {
    id: 'giao-hang',
    title: 'Chính Sách Giao Hàng & Vận Chuyển',
    badge: 'Freeship từ 200k',
    iconName: 'truck',
    summary: 'Quy trình giao phôi vé vật lý và hộp quà di sản tận nhà toàn quốc với cam kết đóng gói an toàn và thời gian vận chuyển nhanh chóng.',
    sections: [
      {
        heading: '1. Giao tận nhà toàn quốc (100% không cần nhận tại quầy)',
        content: [
          'Để mang lại trải nghiệm trọn vẹn nhất, toàn bộ vé tham dự Hội Đánh Bài Chòi đều được phát hành dưới dạng Ấn phẩm Phôi Vé Kỷ Niệm đặt trang trọng trong Hộp Quà Pop-up 3D và được giao tận nhà duy nhất.',
          'Khách hàng không cần xếp hàng đổi vé tại quầy trước giờ diễn ra hội chơi, chỉ cần mang theo phôi vé đã được giao tới sự kiện để check-in trực tiếp.',
        ],
      },
      {
        heading: '2. Thời gian vận chuyển dự kiến',
        content: [
          'Đơn hàng được bàn giao cho đối tác bưu chính chuyên nghiệp trong vòng 12 - 24 giờ kể từ khi được hệ thống xác nhận:',
        ],
        bullets: [
          'Khu vực Quy Nhơn (Bình Định) & Hội An (Quảng Nam): Giao trong vòng 24 - 36 giờ.',
          'Khu vực TP. Hồ Chí Minh, Hà Nội, Đà Nẵng: 2 - 3 ngày làm việc.',
          'Các tỉnh thành khác trên toàn quốc: 3 - 4 ngày làm việc.',
        ],
      },
      {
        heading: '3. Cước phí vận chuyển & Chính sách Freeship',
        content: [
          'Cước phí vận chuyển tiêu chuẩn đồng giá 25.000đ - 35.000đ tùy theo khu vực địa lý.',
        ],
        highlight: '🎉 MIỄN PHÍ VẬN CHUYỂN (FREESHIP TOÀN QUỐC) cho tất cả các đơn hàng hoặc đơn vé có tổng giá trị từ 200.000 VNĐ trở lên!',
      },
      {
        heading: '4. Quy chuẩn đóng gói bảo vệ ấn phẩm',
        content: [
          'Mỗi bưu kiện đều được đóng gói bằng hộp carton chuyên dụng 3 lớp chống va đập, bọc màng co kháng nước 100% nhằm đảm bảo phôi vé nghệ thuật và hộp pop-up di sản đến tay quý khách trong tình trạng hoàn mỹ nhất.',
        ],
      },
    ],
  },
  {
    id: 'doi-tra',
    title: 'Chính Sách Đổi Trả & Hoàn Tiền',
    badge: '07 ngày',
    iconName: 'refresh',
    summary: 'Chính sách hỗ trợ đổi trả trong vòng 07 ngày đối với ấn phẩm lỗi và hoàn tiền 100% nếu sự kiện bị hoãn vì lý do bất khả kháng.',
    sections: [
      {
        heading: '1. Thời hạn áp dụng đổi trả',
        content: [
          'Quý khách được hỗ trợ đổi sản phẩm mới hoặc yêu cầu hoàn tiền trong vòng 07 NGÀY kể từ ngày nhận hàng thành công theo biên bản của đơn vị bưu tá.',
        ],
      },
      {
        heading: '2. Điều kiện đổi trả ấn phẩm lưu niệm (Bộ thẻ bài gỗ / Hộp quà)',
        content: [
          'Chấp nhận đổi mới 1 - 1 miễn phí hoàn toàn nếu phát hiện các trường hợp sau:',
        ],
        bullets: [
          'Sản phẩm bị nứt, mẻ, cong vênh do lỗi chế tác gỗ hoặc vận chuyển.',
          'Bộ bài bị thiếu thẻ trong 30 quân cờ truyền thống hoặc in sai lệch màu tranh dân gian.',
          'Hộp pop-up 3D bị lỗi cấu trúc gập không mở bung được đúng thiết kế.',
        ],
      },
      {
        heading: '3. Quy định đổi & hoàn tiền đối với Vé Sự Kiện',
        content: [
          'Đối với vé tham dự Hội Đánh Bài Chòi:',
        ],
        bullets: [
          'Đổi suất diễn miễn phí: Hỗ trợ chuyển sang suất diễn kế tiếp nếu quý khách thông báo trước ít nhất 48 giờ trước giờ khai hội.',
          'Hoàn tiền 100%: Trong trường hợp sự kiện bị hoãn hoặc hủy bởi Ban tổ chức do điều kiện thời tiết xấu (bão lũ miền Trung) hoặc lý do bất khả kháng, ban dự án sẽ hoàn trả 100% tiền vé qua tài khoản ngân hàng trong vòng 24 - 48 giờ.',
        ],
      },
      {
        heading: '4. Phương thức hoàn tiền',
        content: [
          'Tiền hoàn sẽ được chuyển khoản trực tiếp vào số tài khoản ngân hàng chính chủ của quý khách ngay sau khi bộ phận CSKH xác nhận yêu cầu hợp lệ.',
        ],
      },
    ],
  },
  {
    id: 'khieu-nai',
    title: 'Chính Sách Xử Lý Khiếu Nại',
    badge: 'Phản hồi 24h',
    iconName: 'question',
    summary: 'Cam kết lắng nghe, đồng hành và xử lý mọi phản ánh của khách hàng một cách công tâm, minh bạch trong vòng 24 giờ làm việc.',
    sections: [
      {
        heading: '1. Tôn chỉ lắng nghe & Phụng sự di sản',
        content: [
          'Dự án Di sản Bài Chòi luôn đặt sự hài lòng và niềm tự hào văn hóa của công chúng lên hàng đầu. Mọi ý kiến phản ánh, góp ý về nội dung trò chơi, ấn phẩm hay dịch vụ bán vé đều là động lực quý báu giúp chúng tôi hoàn thiện.',
        ],
      },
      {
        heading: '2. Quy trình xử lý khiếu nại 3 bước chuẩn',
        content: [
          'Quy trình tiếp nhận và xử lý được thực hiện khép kín, minh bạch:',
        ],
        bullets: [
          'Bước 1 - Tiếp nhận: Ghi nhận thông tin khiếu nại qua Hotline, Email hoặc Fanpage chính thức kèm mã đơn hàng và hình ảnh/video bưu phẩm.',
          'Bước 2 - Thẩm tra & Giải pháp (Trong 24h): Đội ngũ CSKH kiểm tra đối soát với bộ phận kho vận và đưa ra phương án giải quyết thỏa đáng nhất cho khách hàng.',
          'Bước 3 - Xử lý dứt điểm: Thực hiện gửi hàng đổi mới hoặc hoàn tiền ngay trong 24 - 48 giờ làm việc tiếp theo.',
        ],
      },
      {
        heading: '3. Kênh tiếp nhận hỗ trợ chính thức',
        content: [
          'Quý khách có thể liên hệ trực tiếp qua các cổng thông tin sau:',
        ],
        bullets: [
          '📞 Hotline Chăm sóc Khách hàng: 0848 180 081 / 0905 123 456 (8:00 - 21:00 hàng ngày)',
          '📧 Email Dự án: lienntk.ce190812@gmail.com',
          '💬 Fanpage Dự án: fb.com/baichoi.heritage',
          '📍 Văn phòng dự án: Đường Xuân Diệu, TP. Quy Nhơn, Bình Định',
        ],
      },
    ],
  },
  {
    id: 'du-an',
    title: 'Thông Tin Dự Án & Sứ Mệnh',
    badge: 'Color Up 2026',
    iconName: 'info',
    summary: 'Dự án truyền thông & thiết kế văn hóa tôn vinh di sản nghệ thuật Bài Chòi Trung Bộ tham dự cuộc thi sáng tạo Color Up 2026.',
    sections: [
      {
        heading: '1. Về Cuộc thi Color Up 2026',
        content: [
          'Dự án "CHÒI — Di Sản Bài Chòi Việt Nam" được nghiên cứu, phát triển và thiết kế nhằm tham dự Cuộc thi Sáng tạo Thiết kế & Truyền thông Văn hóa Color Up 2026.',
          'Dự án là tiếng nói của những người trẻ yêu di sản, khát khao dùng ngôn ngữ thị giác đương đại và giải pháp công nghệ số để tái hiện sinh động một nét đẹp văn hóa dân gian độc đáo của miền Trung.',
        ],
      },
      {
        heading: '2. Sứ mệnh tôn vinh Di sản UNESCO',
        content: [
          'Nghệ thuật Bài Chòi Trung Bộ Việt Nam đã được Tổ chức Giáo dục, Khoa học và Văn hóa của Liên Hợp Quốc (UNESCO) ghi danh là Di sản Văn hóa Phi vật thể đại diện của nhân loại vào ngày 07 tháng 12 năm 2017.',
          'Bài Chòi không chỉ là trò chơi may rủi dân gian trong những ngày Tết hay đêm trăng rằm, mà là bản hòa ca của âm nhạc, thơ ca, diễn xướng, văn hóa làng xã và triết lý sống chân chất, nghĩa tình của người miền Trung.',
        ],
      },
      {
        heading: '3. Các trụ cột chính của Dự án',
        content: [
          'Hệ sinh thái dự án bao gồm 4 trụ cột tương tác xuyên suốt:',
        ],
        bullets: [
          'Nền tảng số hóa tương tác: Web app mô phỏng chơi Bài Chòi, nghe âm thanh tiếng hô anh Hiệu, tra cứu 30 con bài và nguồn gốc văn hóa.',
          'Bộ nhận diện & Ấn phẩm di sản: Bộ thẻ bài gỗ 30 quân chế tác thủ công, hộp pop-up 3D và cẩm nang văn hóa Bài Chòi.',
          'Hệ thống vé sự kiện kỷ niệm: Phôi vé nghệ thuật chính thức đưa khán giả trực tiếp đến với các đêm hội Bài Chòi Quy Nhơn & Hội An.',
          'Cộng đồng lan tỏa: Kết nối thế hệ trẻ với các nghệ nhân dân gian lão thành để bảo tồn ngọn lửa văn hóa ngàn đời.',
        ],
        highlight: '🏆 Dự án hướng tới việc chứng minh rằng: Di sản văn hóa truyền thống hoàn toàn có thể sống động, thời thượng và chạm đến trái tim thế hệ trẻ hôm nay!',
      },
    ],
  },
]

// Render SVG icon tương ứng với từng mục
function PolicyIcon({ name, active }: { name: PolicyItem['iconName']; active: boolean }) {
  const strokeColor = active ? 'currentColor' : '#c8382b'
  const fillColor = active ? 'currentColor' : 'none'

  switch (name) {
    case 'document':
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    case 'shield':
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )
    case 'cookie':
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 15.5v.01" />
          <path d="M8.5 15.5v.01" />
          <path d="M12 12v.01" />
        </svg>
      )
    case 'card':
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="5" rx="2" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      )
    case 'truck':
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" />
          <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.24-4.05a1 1 0 0 0-.78-.38H15v10Z" />
          <circle cx="17" cy="18.5" r="2.5" />
          <circle cx="7" cy="18.5" r="2.5" />
        </svg>
      )
    case 'refresh':
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M8 16H3v5" />
        </svg>
      )
    case 'question':
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>
      )
    case 'info':
      return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill={fillColor} stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      )
    default:
      return null
  }
}

interface PolicyModalProps {
  isOpen: boolean
  onClose: () => void
  initialPolicyId?: string
}

export function PolicyModal({ isOpen, onClose, initialPolicyId = 'dieu-khoan' }: PolicyModalProps) {
  const [activePolicyId, setActivePolicyId] = useState<string>(initialPolicyId)
  const [searchFilter, setSearchFilter] = useState('')
  const [copyFeedback, setCopyFeedback] = useState(false)
  const headingId = useId()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (initialPolicyId) {
      setActivePolicyId(initialPolicyId)
    }
  }, [initialPolicyId])

  // Tự động cuộn trang chi tiết về đầu khi chuyển danh mục chính sách
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [activePolicyId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const activePolicy = POLICIES.find((p) => p.id === activePolicyId) || POLICIES[0]

  const filteredPolicies = searchFilter.trim()
    ? POLICIES.filter(
        (p) =>
          p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.badge.toLowerCase().includes(searchFilter.toLowerCase()) ||
          p.summary.toLowerCase().includes(searchFilter.toLowerCase())
      )
    : POLICIES

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#policy-${activePolicy.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-md animate-fade-in text-slate-900"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
    >
      <div
        className="relative flex flex-col w-[96vw] max-w-6xl h-[88vh] max-h-[760px] min-h-[500px] rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER THANH ĐIỀU HƯỚNG TRÊN CÙNG ── */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 bg-gradient-to-r from-[#c8382b] to-[#981b1e] text-white border-b border-red-900/30 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs text-lg shadow-inner shrink-0">
              📜
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-extrabold text-sm sm:text-base tracking-wide uppercase"
                  style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
                >
                  Điều khoản & Chính sách Di sản
                </span>
                <span className="rounded-full bg-white/20 text-white px-2.5 py-0.5 text-[10px] font-bold">
                  Color Up 2026
                </span>
              </div>
              <p className="text-[11px] text-red-100 hidden sm:block">
                Hệ thống điều khoản & chính sách minh bạch bảo vệ quyền lợi người dùng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              title="Sao chép liên kết mục này"
              className="flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
            >
              <span>{copyFeedback ? '✓ Đã sao chép' : '🔗 Chia sẻ'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-950 transition cursor-pointer font-bold text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── BODY CHIA 2 CỘT: DANH MỤC (TRÁI) & NỘI DUNG (PHẢI) ── */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-slate-50">
          {/* CỘT TRÁI: DANH MỤC CHÍNH SÁCH 8 MỤC (RỘNG RÃI, KHÔNG CẮT CHỮ) */}
          <div className="w-full md:w-[390px] lg:w-[410px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0">
            {/* Header Danh mục chính sách */}
            <div className="px-4.5 pt-4 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-2.5">
                <h3
                  id={headingId}
                  className="text-sm sm:text-base font-extrabold tracking-wider text-slate-900 uppercase"
                  style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
                >
                  DANH MỤC CHÍNH SÁCH
                </h3>
                <span className="rounded-full bg-pink-100 text-[#d80032] px-2.5 py-0.5 text-xs font-black shadow-2xs">
                  8 mục
                </span>
              </div>

              {/* Ô tìm kiếm nhanh */}
              <div className="relative">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Tìm chính sách nhanh..."
                  className="w-full rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 pl-8 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#c8382b]/30 focus:bg-white transition"
                />
                <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Danh sách 8 mục chính sách: Rộng rãi, toàn bộ tiêu đề nguyên vẹn */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1 custom-scrollbar">
              {filteredPolicies.map((item) => {
                const isActive = item.id === activePolicyId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActivePolicyId(item.id)}
                    className={`w-full flex items-center justify-between py-2 px-3 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                      isActive
                        ? 'bg-[#d80032] text-white shadow-md shadow-red-900/20 font-bold'
                        : 'bg-white hover:bg-slate-100/80 text-slate-800 hover:text-slate-950 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 mr-2">
                      <span className={isActive ? 'text-white' : 'text-[#c8382b]'}>
                        <PolicyIcon name={item.iconName} active={isActive} />
                      </span>
                      <span
                        className={`text-xs sm:text-[13px] whitespace-nowrap leading-tight ${
                          isActive
                            ? 'font-extrabold text-white'
                            : 'font-semibold text-slate-800 group-hover:text-slate-950'
                        }`}
                        style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
                      >
                        {item.title}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap transition ${
                        isActive
                          ? 'bg-white/20 text-white border border-white/30'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                )
              })}

              {filteredPolicies.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  Không tìm thấy chính sách nào khớp với từ khóa.
                </div>
              )}
            </div>

            {/* Chân sidebar: Huy hiệu Color Up 2026 */}
            <div className="py-2.5 px-3 border-t border-slate-100 bg-slate-50/80 shrink-0 text-center">
              <span className="text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1.5">
                <span>🎖️</span>
                <span>Cuộc thi Thiết kế & Truyền thông</span>
                <strong className="text-[#c8382b]">Color Up 2026</strong>
              </span>
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT NỘI DUNG CHÍNH SÁCH ĐƯỢC CHỌN */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-white overflow-hidden">
            {/* Header bài chính sách */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-br from-amber-50/30 via-white to-slate-50/50 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-0.5 text-xs font-extrabold text-[#c8382b]">
                  <PolicyIcon name={activePolicy.iconName} active={false} />
                  <span>{activePolicy.badge}</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Cập nhật lần cuối: Tháng 10/2026
                </span>
              </div>

              <h2
                className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
              >
                {activePolicy.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                {activePolicy.summary}
              </p>
            </div>

            {/* Nội dung chi tiết các điều khoản */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-slate-700 leading-relaxed text-xs sm:text-sm custom-scrollbar"
            >
              {activePolicy.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-2.5"
                >
                  <h4
                    className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#c8382b]/10 text-[#c8382b] text-xs font-black">
                      {idx + 1}
                    </span>
                    <span>{sec.heading}</span>
                  </h4>

                  {sec.content.map((p, pIdx) => (
                    <p key={pIdx} className="text-slate-600 leading-relaxed">
                      {p}
                    </p>
                  ))}

                  {sec.bullets && sec.bullets.length > 0 && (
                    <ul className="space-y-1.5 pt-1 pl-1">
                      {sec.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-2 text-slate-700">
                          <span className="text-[#c8382b] font-bold mt-0.5">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {sec.highlight && (
                    <div className="rounded-xl bg-amber-50/90 border border-amber-200 p-3 text-xs text-amber-900 font-semibold flex items-center gap-2">
                      <span className="text-base">💡</span>
                      <span>{sec.highlight}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Callout Hỗ trợ trực tiếp ở cuối mỗi chính sách */}
              <div className="rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h5
                    className="font-extrabold text-sm text-[#981b1e] flex items-center gap-1.5"
                    style={{ fontFamily: 'var(--font-body, system-ui, sans-serif)' }}
                  >
                    <span>💬</span>
                    <span>Bạn có thắc mắc về quy định này?</span>
                  </h5>
                  <p className="text-xs text-slate-600">
                    Bộ phận hỗ trợ pháp lý và CSKH luôn sẵn sàng giải đáp trong 24h làm việc.
                  </p>
                </div>
                <div className="flex items-center w-full sm:w-auto shrink-0">
                  <a
                    href="tel:0848180081"
                    className="w-full sm:w-auto text-center rounded-xl bg-[#c8382b] hover:bg-[#a82d21] text-white font-bold text-xs px-4 py-2 transition shadow-xs"
                  >
                    📞 0848 180 081
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
