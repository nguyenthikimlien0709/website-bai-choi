// CẤU HÌNH ẢNH ẤN PHẨM
// Cách nhanh nhất để thay ảnh chính:
// 1. Chép ảnh mới vào public/assets.
// 2. Đổi đường dẫn `src` tương ứng bên dưới.
//
// Nếu giữ nguyên tên anpham1.png, anpham2.png, anpham3.png thì chỉ cần
// chép đè file ảnh trong public/assets, không phải sửa code.
// Khi đã có ảnh chính thức, đổi giá trị này thành false để ẩn nhãn minh họa.
export const PUBLICATIONS_ARE_DEMOS = true

export const PUBLICATION_IMAGES = [
  {
    src: '/assets/anpham1.png',
    alt: 'Bộ nhận diện và bao bì ấn phẩm Chòi',
  },
  {
    src: '/assets/anpham2.png',
    alt: 'Ứng dụng nhận diện Chòi trên vật phẩm',
  },
  {
    src: '/assets/anpham3.png',
    alt: 'Bộ ấn phẩm truyền thông Chòi',
  },
] as const
