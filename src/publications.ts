// CẤU HÌNH ẢNH ẤN PHẨM
// Muốn thay ảnh về sau: chép ảnh mới vào public/assets rồi sửa đường dẫn `src`
// trong đúng nhóm bên dưới. Mỗi nhóm có thể chứa một hoặc nhiều ảnh.
export const PUBLICATIONS_ARE_DEMOS = false

export const PUBLICATION_GROUPS = [
  {
    images: [
      {
        src: '/assets/thedungbai.jpg',
        alt: 'Hộp đứng đựng bộ thẻ Bài Chòi',
      },
      {
        src: '/assets/thedungbai1.jpg',
        alt: 'Hộp ngang đựng bộ thẻ Bài Chòi',
      },
    ],
  },
  {
    images: [
      {
        src: '/assets/quatangsukien(1).jpg',
        alt: 'Áo quà tặng mang nhận diện Bài Chòi',
      },
      {
        src: '/assets/quatangsukien(2).jpg',
        alt: 'Bộ quà tặng gốm Bài Chòi',
      },
      {
        src: '/assets/quatangsukien(3).jpg',
        alt: 'Lịch để bàn Bài Chòi',
      },
      {
        src: '/assets/quatangsukien4.jpg',
        alt: 'Bộ móc khóa lưu niệm Bài Chòi',
      },
    ],
  },
  {
    images: [
      {
        src: '/assets/anpham1.png',
        alt: 'Túi giấy và túi tote Bài Chòi',
      },
    ],
  },
  {
    images: [
      {
        src: '/assets/ve(1).jpg',
        alt: 'Vé tham gia sự kiện Bài Chòi',
      },
      {
        src: '/assets/vethamgia.jpg',
        alt: 'Thiệp mời tham dự sự kiện Bài Chòi',
      },
    ],
  },
  {
    images: [
      {
        src: '/assets/booth.jpg',
        alt: 'Không gian booth sự kiện Bài Chòi',
      },
    ],
  },
  {
    images: [
      {
        src: '/assets/poster.jpg',
        alt: 'Poster quảng bá nghệ thuật Bài Chòi',
      },
    ],
  },
] as const
