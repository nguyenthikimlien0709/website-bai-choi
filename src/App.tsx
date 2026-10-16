import { Component, useCallback, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import IntroAnimation from './IntroAnimation'
import { CARD_ASSETS } from './cardAssets'
import { PUBLICATION_GROUPS, PUBLICATIONS_ARE_DEMOS } from './publications'
import BaiChoiGame from './BaiChoiGame'
import OfflinePlay from './OfflinePlay'
import AuthModal from './components/AuthModal'
import CookieBanner from './components/CookieBanner'
import AdminDashboard from './components/AdminDashboard'
import StaffPortal from './components/StaffPortal'
import ShopSection from './components/ShopSection'
import ShopPortal from './components/ShopPortal'
import GamePortal, { type GamePortalTab } from './components/GamePortal'
import { PolicyModal } from './components/PolicyModal'
import ChoiCoin from './components/ChoiCoin'
import CoinTopupModal from './components/CoinTopupModal'
import AccountCenterModal, { type AccountTabKey } from './components/AccountCenterModal'
import Footer from './components/Footer'
import { authService } from './lib/authService'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import type { UserProfile } from './types/auth'

// ─── Types ───────────────────────────────────────────────────────────────────
type Lang = 'VIE' | 'ENG'

class IntroErrorBoundary extends Component<
  { children: ReactNode; onRecover: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Intro animation failed:', error, info)
    this.props.onRecover()
  }

  render() {
    return this.state.hasError ? null : this.props.children
  }
}

// ─── Content ─────────────────────────────────────────────────────────────────
const content = {
  VIE: {
    nav: {
      menu: ['Trang chủ', 'Giới Thiệu', 'Thẻ Bài', 'Luật chơi', 'Hội Chơi Game', 'Cửa hàng'],
      cta: 'Trải Nghiệm Ngay',
    },
    hero: {
      badge: 'Nghệ thuật dân gian miền Trung',
      title: 'CHÒI',
      subtitle: 'THẺ BÀI · LỜI HÔ · NHỊP PHÁCH',
      body: 'Đánh thức nhịp phách Bài Chòi giữa hơi thở thời đại, để những câu hát xưa bước ra khỏi mái chòi, chạm đến thế hệ trẻ, những bước chân khám phá và mọi tâm hồn yêu vẻ đẹp văn hóa Việt.',
      cta1: 'Khám Phá Chòi',
      cta2: 'Xem Thư Viện',
    },
    history: {
      title: 'Giới Thiệu',
      sub: 'Tinh thần truyền thống trong ngôn ngữ đồ họa hiện đại',
      label: 'Bộ thẻ Chòi',
      description: 'Bộ bài được phát triển theo phong cách di sản hiện đại, kết hợp tinh thần truyền thống của nghệ thuật Bài Chòi với ngôn ngữ đồ họa tối giản. Hình ảnh được cách điệu, đường nét rõ ràng và bố cục trẻ trung, giúp bộ bài vừa lưu giữ bản sắc văn hóa miền Trung, vừa gần gũi và dễ tiếp cận với thế hệ trẻ.',
      cards: [
        {
          year: 'Thế kỷ XV',
          icon: '🌾',
          title: 'Nguồn Gốc',
          body: 'Bài Chòi khởi nguồn từ các chòi canh nương rẫy ở miền Trung. Nông dân dựng chòi cao để canh giữ mùa màng và hò hát giao duyên qua lại với nhau.',
        },
        {
          year: 'Thế kỷ XVIII–XIX',
          icon: '🎭',
          title: 'Phát Triển',
          body: 'Trò chơi trở thành món ăn tinh thần ngày Tết không thể thiếu trên dải đất Trung Bộ từ Quảng Bình đến Khánh Hòa, gắn liền với hội làng và lễ hội dân gian.',
        },
        {
          year: '2017',
          icon: '🏛️',
          title: 'Vinh Danh UNESCO',
          body: 'UNESCO chính thức ghi danh Nghệ thuật Bài Chòi Trung Bộ vào Danh sách Di sản Văn hóa Phi vật thể đại diện của nhân loại ngày 7/12/2017 tại Hàn Quốc.',
        },
      ],
    },
    rules: {
      title: 'Cách Chơi Bài Chòi',
      sub: 'Bốn nhịp chơi để hòa mình vào không khí hội làng',
      steps: [
        {
          num: '01',
          title: 'Vào Chòi & Nhận Thẻ',
          body: 'Người chơi chọn một chòi tre và nhận ba quân bài cho mỗi ván. Hãy giữ thẻ trong tay, sẵn sàng lắng nghe tiếng hô của Anh Hiệu.',
        },
        {
          num: '02',
          title: 'Anh Hiệu Rút Quân Bài',
          body: 'Anh Hiệu lắc ống bài, rút ngẫu nhiên từng quân rồi cất giọng bằng một câu thai dí dỏm, khéo léo gợi nhắc tên quân bài.',
        },
        {
          num: '03',
          title: 'Lắng Nghe & Đối Thẻ',
          body: 'Người chơi nghe câu hát, đoán ý rồi đối chiếu với những quân bài đang giữ. Nếu có quân trùng khớp, hãy hô “Có đây!” để nhận một lá cờ.',
        },
        {
          num: '04',
          title: 'Đủ Ba Cờ & Báo Thắng',
          body: 'Chòi đầu tiên nhận đủ ba lá cờ sẽ gõ mõ báo tin thắng cuộc. Tiếng trống hội vang lên và người chiến thắng nhận phần thưởng từ ban tổ chức.',
        },
      ],
    },
    characters: {
      title: 'Thẻ Bài',
      sub: '',
      cards: [
        { name: 'Nhất Trò', symbol: '一', meaning: 'Hình tượng người nghệ sĩ trong cuộc chơi, gợi tinh thần diễn xướng, sự dí dỏm và niềm vui hội làng.' },
        { name: 'Nhì Bí', symbol: '二', meaning: 'Quả bầu dân dã tượng trưng cho sự no đủ, sinh sôi và nét mộc mạc trong đời sống miền Trung.' },
        { name: 'Tam Quan', symbol: '三', meaning: 'Cổng tam quan biểu trưng cho không gian cộng đồng, nơi con người gặp gỡ và cùng gìn giữ nếp xưa.' },
        { name: 'Tứ Hương', symbol: '四', meaning: 'Hương khói gợi lòng thành kính với tổ tiên, kết nối đời sống hiện tại với những giá trị truyền thống.' },
        { name: 'Ngũ Trượt', symbol: '五', meaning: 'Chuyển động linh hoạt tượng trưng cho khả năng ứng biến và tinh thần vượt qua thử thách.' },
        { name: 'Lục Xơ', symbol: '六', meaning: 'Khung dệt và sợi tơ tôn vinh đôi tay khéo léo của người thợ cùng những nghề thủ công truyền thống.' },
        { name: 'Thất Nhọn', symbol: '七', meaning: 'Hình khối sắc nhọn tượng trưng cho sự tỉnh táo, quyết đoán và nguồn năng lượng mạnh mẽ.' },
        { name: 'Bát Bồng', symbol: '八', meaning: 'Bát Bồng tượng trưng cho sự khéo léo, uyển chuyển và duyên dáng. Hình ảnh người phụ nữ nâng bát trong điệu múa gợi nên không khí hội hè dân gian và vẻ đẹp mềm mại của văn hóa Bài Chòi.' },
        { name: 'Cửu Thầy', symbol: '九', meaning: 'Bút nghiên và người thầy tượng trưng cho tri thức, đạo học và sự truyền dạy qua nhiều thế hệ.' },
        { name: 'Thái Tử', symbol: '王', meaning: 'Hình tượng thái tử biểu trưng cho phẩm chất cao quý, trách nhiệm và khát vọng hướng tới tương lai.' },




        // PHÔ 02 — LÁ 11 → 20
        { name: 'Nhất Nọc', symbol: '', meaning: 'Gốc rễ & Cột trụ – Tượng trưng cho điểm tựa chắc chắn, nền tảng vững vàng và sự khởi đầu.' },
        { name: 'Nhì Nghèo', symbol: '', meaning: ' Thử thách & Vượt khó – Tượng trưng cho giai đoạn gian khó, nhắc nhở sự kiên trì để vượt qua thiếu sót.' },
        { name: 'Ba Gà', symbol: '', meaning: 'Siêng năng & Báo tin – Tượng trưng cho sự chăm chỉ, thức khuya dậy sớm và khởi đầu một ngày mới/tin vui.' },
        { name: 'Tứ Dóng', symbol: '', meaning: 'Gắn kết & Gánh vác – Tượng trưng cho sự kết nối, chịu khó gánh vác trách nhiệm và công việc.' },
        { name: 'Ngũ Đụm', symbol: '', meaning: 'Hội tụ & Tích lũy – Tượng trưng cho điểm trung tâm, sự cân bằng và gom góp thành quả.' },
        { name: 'Sáu Hột', symbol: '', meaning: 'Dẻo dai & Tích trữ – Tượng trưng cho thành quả lao động, sự tích lũy nhỏ tạo nên giá trị lớn.' },
        { name: 'Bảy Thưa', symbol: '', meaning: 'Tượng trưng cho sự thưa thớt, buông bớt rắc rối, linh hoạt thả lỏng và canh giữ thành quả (hình ảnh bù nhìn giữ ruộng lúa đã thu hoạch).' },
        { name: 'Tám Dầy', symbol: '', meaning: 'Tượng trưng cho sự dày dặn, đắt giá, khắt khe chuẩn mực và tình cảm/tài lộc gắn kết bền chặt (hình ảnh nút thắt may mắn đồng tâm).' },
        { name: 'Chín Gối', symbol: '', meaning: 'Tâm an & Bình yên – Tượng trưng cho sự nghỉ ngơi, thư thái nội tại và an ổn tinh thần.' },
        { name: 'Đỏ Mỏ', symbol: '', meaning: 'May mắn & Tỏa sáng – Tượng trưng cho cơ hội tốt lành, tin vui, tài lộc và sự khởi sắc rực rỡ.' },




        // PHÔ 03 — LÁ 21 → 30
        { name: 'Bạch Huê', symbol: '', meaning: 'Tượng trưng cho sự thuần khiết, tâm trong sáng và con đường học vấn rộng mở.' },
        { name: 'Bành Hai', symbol: '', meaning: 'Tượng trưng cho sự đầy đủ, vẹn toàn, gắn kết tình cảm và thành quả lao động.' },
        { name: 'Bành Ba', symbol: '', meaning: 'Tượng trưng cho sự kiên định, thế chân kiềng vững chắc, cùng sự phong phú và nhiều cơ hội lựa chọn.' },
        { name: 'Dái Doi', symbol: '', meaning: 'Tượng trưng cho sự dẻo dai, tài lộc hanh thông và những giá trị gắn kết lâu dài theo thời gian.' },
        { name: 'Năm Rún', symbol: '', meaning: 'Tượng trưng cho sự hội tụ, điểm tựa vững chắc và sự hài hòa trong cuộc sống.' },
        { name: 'Sáu Tiền', symbol: '', meaning: 'Tượng trưng cho dòng chảy tài chính nhỏ bắt đầu sinh lời, mang lại niềm vui.' },
        { name: 'Thất Liễu', symbol: '', meaning: 'Tượng trưng cho sự linh hoạt thích ứng và giải tỏa mọi áp lực, phiền muộn.' },
        { name: 'Tám Tiền', symbol: '', meaning: 'Tượng trưng cho sự sung túc, tài chính dồi dào và may mắn lớn về tiền bạc.' },
        { name: 'Chín Ghe', symbol: '', meaning: 'Tượng trưng cho sự chuyển động, đồng lòng tiến về phía trước, công việc thuận buồm xuôi gió.' },
        { name: 'Ông Âm', symbol: '', meaning: 'Tượng trưng cho sức mạnh, sự bừng tỉnh, cơ hội tạo nên tiếng vang và danh tiếng lớn.' },



      ],
    },
    publications: {
      title: 'Ấn Phẩm',
      sub: 'Từ di sản đến ngôn ngữ thiết kế đương đại',
      demoLabel: 'Ảnh minh họa',
      viewLabel: 'Xem toàn ảnh',
      items: [
        { title: 'Bộ Nhận Diện', category: 'Thương hiệu & bao bì' },
        { title: 'Ứng Dụng Thương Hiệu', category: 'Vật phẩm truyền thông' },
        { title: 'Bộ Ấn Phẩm', category: 'Thiết kế xuất bản' },
      ],
    },
    audio: {
      title: 'Nghe Câu Hò Bài Chòi',
      sub: 'Trải nghiệm âm nhạc dân gian đặc sắc miền Trung',
      trackName: 'Nhịp Phách Bài Chòi',
      trackArtist: 'Âm nhạc dân gian miền Trung',
      duration: '--:--',
    },
    gallery: {
      title: 'Thư Viện Hình Ảnh',
      sub: 'Hội Bài Chòi tại Hội An & Bình Định',
    },
    footer: {
      desc: 'Trong bối cảnh hiện đại, Bài Chòi vẫn còn hạn chế trong việc tiếp cận giới trẻ do hình ảnh truyền thống và thiếu các nền tảng số. Vì vậy, nhóm xây dựng dự án branding Bài Chòi với ngôn ngữ thiết kế hiện đại, kết hợp bộ nhận diện thương hiệu, website và các sản phẩm truyền thông nhằm lan tỏa giá trị di sản đến thế hệ trẻ.',
      links: ['Về chúng tôi', 'Chính sách', 'Liên hệ', 'Hợp tác'],
      credit: '© 2025 Chòi. Được thực hiện với ❤️ tại Việt Nam.',
      qrLabel: 'Quét mã để chia sẻ',
    },
  },
  ENG: {
    nav: {
      menu: ['Home', 'About', 'Cards', 'Rules', 'Game Arena', 'Shop'],
      cta: 'Experience Now',
    },
    hero: {
      badge: 'Folk art of Central Vietnam',
      title: 'CHÒI',
      subtitle: 'CARDS · CHANTS · RHYTHM',
      body: 'Explore Chòi through traditional folk cards, game rules, creative publications and a rich visual library.',
      cta1: 'Explore Chòi',
      cta2: 'View Library',
    },
    history: {
      title: 'Introduction (Cards)',
      sub: 'Traditional spirit in a modern graphic language',
      label: 'The Chòi Card Deck',
      description: 'The deck is developed in a modern heritage style, combining the traditional spirit of Bài Chòi with a minimalist graphic language. Stylized imagery, clear lines and youthful layouts preserve Central Vietnamese cultural identity while remaining approachable for younger generations.',
      cards: [
        {
          year: '15th Century',
          icon: '🌾',
          title: 'Origins',
          body: 'Bai Choi originated from watchtower huts in Central Vietnamese fields. Farmers built elevated huts to guard their crops and would sing folk songs to one another across the fields.',
        },
        {
          year: '18th–19th Century',
          icon: '🎭',
          title: 'Development',
          body: 'The game became an indispensable Tết tradition across Central Vietnam from Quảng Bình to Khánh Hòa, woven into village festivals and folk celebrations.',
        },
        {
          year: '2017',
          icon: '🏛️',
          title: 'UNESCO Recognition',
          body: "UNESCO officially inscribed Central Vietnam's Bai Choi Art onto the Representative List of Intangible Cultural Heritage of Humanity on December 7, 2017 in South Korea.",
        },
      ],
    },
    rules: {
      title: 'How to Play Bài Chòi',
      sub: 'Four rhythms that bring you into the village festival',
      steps: [
        {
          num: '01',
          title: 'Enter a Hut & Receive Cards',
          body: 'Choose a bamboo hut and receive three cards for the round. Keep them in hand and listen closely for the caller’s chant.',
        },
        {
          num: '02',
          title: 'The Caller Draws a Card',
          body: 'The caller shakes the card tube, draws one at random and begins a witty folk verse that subtly hints at the card’s name.',
        },
        {
          num: '03',
          title: 'Listen & Match',
          body: 'Listen to the song, solve its meaning and compare it with your cards. When one matches, call out and receive a small victory flag.',
        },
        {
          num: '04',
          title: 'Collect Three Flags & Win',
          body: 'The first hut to collect three flags strikes the wooden clapper. Festival drums announce the victory before the prize is presented.',
        },
      ],
    },
    characters: {
      title: 'Introducing 10 Chòi Cards',
      sub: 'Ten representative characters from the Chòi card deck',
      cards: [
        { name: 'Nhất Trò', symbol: '一', meaning: 'The performer represents folk theatre, playful improvisation and the joy of a village gathering.' },
        { name: 'Nhì Bí', symbol: '二', meaning: 'The humble gourd symbolizes abundance, growth and the simple rhythms of life in Central Vietnam.' },
        { name: 'Tam Quan', symbol: '三', meaning: 'The three-entrance gate represents a communal space where people meet and preserve shared traditions.' },
        { name: 'Tứ Hương', symbol: '四', meaning: 'Incense evokes respect for ancestors and the enduring connection between present life and tradition.' },
        { name: 'Ngũ Trượt', symbol: '五', meaning: 'Fluid movement symbolizes adaptability, quick thinking and the courage to overcome challenges.' },
        { name: 'Lục Xơ', symbol: '六', meaning: 'The loom and threads honor skilled hands and the enduring value of traditional crafts.' },
        { name: 'Thất Nhọn', symbol: '七', meaning: 'Sharp forms suggest alertness, decisiveness and a strong, focused source of energy.' },
        { name: 'Bát Bồng', symbol: '八', meaning: 'The act of carrying a child represents kinship, protection and the warmth of family.' },
        { name: 'Cửu Thầy', symbol: '九', meaning: 'The teacher and writing brush stand for knowledge, learning and wisdom passed through generations.' },
        { name: 'Thái Tử', symbol: '王', meaning: 'The prince represents dignity, responsibility and aspirations for a promising future.' },
      ],
    },
    publications: {
      title: 'Publications',
      sub: 'From cultural heritage to contemporary design',
      description: 'Early explorations of the Bài Chòi spirit across identity, packaging and communication materials. The current images demonstrate the layout and can be replaced with the final designs later.',
      demoLabel: 'Preview image',
      viewLabel: 'View full image',
      items: [
        { title: 'Identity Collection', category: 'Brand identity & packaging' },
        { title: 'Brand Applications', category: 'Communication materials' },
        { title: 'Publication Collection', category: 'Editorial design' },
      ],
    },
    audio: {
      title: 'Listen to Bai Choi Folk Song',
      sub: "Experience Central Vietnam's distinctive folk music",
      trackName: 'Rhythms of Bài Chòi',
      trackArtist: 'Traditional music of Central Vietnam',
      duration: '--:--',
    },
    gallery: {
      title: 'Photo Gallery',
      sub: 'Bai Choi Festivals in Hoi An & Binh Dinh',
    },
    footer: {
      desc: 'In a modern context, Bài Chòi still faces challenges in reaching younger audiences because of its traditional imagery and limited digital presence. The team therefore developed a contemporary Bài Chòi branding project that combines a visual identity, website and communication products to bring this heritage closer to a new generation.',
      links: ['About Us', 'Policy', 'Contact', 'Partnership'],
      credit: '© 2025 Chòi. Made with ❤️ in Vietnam.',
      qrLabel: 'Scan to share',
    },
  },
}

// ─── Ornament SVG ─────────────────────────────────────────────────────────────
function LotusOrnament({ size = 28, color = '#006368' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 3C14 3 10 8 10 13C10 15.2 11.8 17 14 17C16.2 17 18 15.2 18 13C18 8 14 3 14 3Z" fill={color} opacity="0.8" />
      <path d="M14 25C14 25 10 20 10 15C10 12.8 11.8 11 14 11C16.2 11 18 12.8 18 15C18 20 14 25 14 25Z" fill={color} opacity="0.5" />
      <path d="M3 14C3 14 8 10 13 10C15.2 10 17 11.8 17 14C17 16.2 15.2 18 13 18C8 18 3 14 3 14Z" fill={color} opacity="0.5" />
      <path d="M25 14C25 14 20 10 15 10C12.8 10 11 11.8 11 14C11 16.2 12.8 18 15 18C20 18 25 14 25 14Z" fill={color} opacity="0.8" />
      <circle cx="14" cy="14" r="3" fill={color} />
    </svg>
  )
}

function DragonDivider() {
  return (
    <div className="flex items-center gap-4 justify-center my-2">
      <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(90deg, transparent, #006368)' }} />
      <LotusOrnament size={22} />
      <div className="h-px flex-1 max-w-24" style={{ background: 'linear-gradient(90deg, #006368, transparent)' }} />
    </div>
  )
}

// ─── Reference landing screens ───────────────────────────────────────────────
function ReferenceScreen({
  id,
  className = '',
  overlay,
  children,
}: {
  id?: string
  className?: string
  overlay?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={`relative flex min-h-[100svh] scroll-mt-20 items-center overflow-x-clip px-4 pb-12 pt-24 sm:px-8 sm:pb-14 sm:pt-28 lg:px-12 landscape:min-h-0 landscape:py-10 landscape:pt-16 ${className}`}
    >
      {overlay}
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {children}
      </div>
    </section>
  )
}

function HeroScreen({
  c,
  lang,
  setLang,
  onPlay,
  currentUser,
  onOpenAuth,
  onLogout,
  onOpenCoins,
  onGoToPortal,
}: {
  c: typeof content.VIE
  lang: Lang
  setLang: (l: Lang) => void
  onPlay: () => void
  currentUser: UserProfile | null
  onOpenAuth: (mode?: 'login' | 'register') => void
  onLogout: () => void
  onOpenCoins?: () => void
  onGoToPortal?: (portal: 'site' | 'admin' | 'staff' | 'shop' | 'game') => void
}) {
  const isVietnamese = lang === 'VIE'
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [accountCenterOpen, setAccountCenterOpen] = useState(false)
  const [accountCenterInitialTab, setAccountCenterInitialTab] = useState<AccountTabKey>('profile')
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024 && window.innerHeight > window.innerWidth
  })

  useEffect(() => {
    const handleResize = () => {
      setIsMobilePortrait(window.innerWidth < 1024 && window.innerHeight > window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  return (
    <section
      id="home"
      className="relative w-full overflow-hidden flex flex-col justify-center items-center select-none"
      style={{
        backgroundColor: '#72D9DD',
        backgroundImage: 'linear-gradient(180deg, #62D5DC 0%, #A2EBDC 25%, #E3F2EE 65%, #F4F8F6 100%)',
      }}
    >
      {/* Thanh thông báo gợi ý xoay ngang màn hình trên thiết bị di động */}
      {isMobilePortrait && (
        <div className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-3 py-1.5 text-[10px] sm:text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-md z-40">
          <span>📱🔄</span>
          <span>Xoay ngang điện thoại (và tắt Khóa xoay màn hình 🔒) để xem toàn bộ website chuẩn 100% như trên máy tính</span>
        </div>
      )}

      {/* Khung hiển thị chuẩn tỉ lệ 16:9 matching Figma/mockup */}
      <div className={`relative w-full max-w-[1920px] aspect-[16/9] mx-auto ${userDropdown ? 'overflow-visible' : 'overflow-hidden'}`}>
        {/* Ảnh toàn cảnh Trang Chủ */}
        <img
          src="/assets/trangchu/trangchu-full.png"
          alt="Trang chủ Bài Chòi"
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* ========================================================
            CÁC VÙNG TƯƠNG TÁC (CLICKABLE HOTSPOTS)
            Hoàn toàn trong suốt, không viền lệch, không tooltip trình duyệt!
            ======================================================== */}

        {/* 1. Viên thuốc Ví Xu Chòi động (Khớp 100% với ảnh nền mới x: 66.0%, w: 10.6%) */}
        <button
          type="button"
          onClick={onOpenCoins}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform rounded-full flex items-center justify-between px-2 sm:px-2.5 bg-[#283c5d] border border-teal-400/60 shadow-xs hover:brightness-110"
          style={{
            left: '66.0%',
            top: '2.87%',
            width: '10.6%',
            height: '4.9%',
          }}
          title="Ví Xu Chòi - Bấm để nạp thêm hoặc xem lịch sử"
        >
          {/* Icon đồng xu Chòi */}
          <div className="h-[76%] aspect-square rounded-full overflow-hidden shrink-0 flex items-center justify-center">
            <img src="/assets/xu-choi.png" alt="Xu Chòi" className="w-full h-full object-contain" draggable={false} />
          </div>

          {/* Số dư Xu thật */}
          <span className="font-bold text-white text-[10px] sm:text-[12px] truncate px-1">
            {(currentUser?.coins ?? 50).toLocaleString()}
          </span>

          {/* Dấu cộng nạp xu */}
          <span className="text-white/80 font-bold text-xs sm:text-sm leading-none pl-0.5 shrink-0">+</span>
        </button>

        {/* 2. Vùng bấm Tài khoản người dùng (Khớp chuẩn 100% với huy hiệu nền mới x: 79.0%, w: 10.6%) */}
        <div
          ref={userMenuRef}
          className={`absolute ${userDropdown ? 'z-[60]' : 'z-30'}`}
          style={{
            left: '79.0%',
            top: '2.96%',
            width: '10.6%',
            height: '4.9%',
          }}
        >
          {/* Nút bấm ăn khớp hoàn toàn với viên thuốc gốc trên ảnh nền mới */}
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                setUserDropdown(!userDropdown)
              } else {
                onOpenAuth('login')
              }
            }}
            className="w-full h-full rounded-full flex items-center justify-between px-2 sm:px-2.5 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform bg-[#283c5d] border border-teal-400/60 shadow-xs"
          >
            {/* Avatar icon tròn bên trái */}
            <div className="h-[76%] aspect-square rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-[#27b8c7]">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="Avatar"
                  className="h-full w-full object-cover rounded-full"
                />
              ) : (
                <span className="text-[#243b57] text-[10px] sm:text-xs font-bold leading-none">
                  👤
                </span>
              )}
            </div>

            {currentUser ? (
              <>
                <span className="text-[10px] sm:text-[12px] font-bold text-white truncate max-w-[65px] sm:max-w-[90px] leading-none px-1">
                  {currentUser.username || currentUser.fullName}
                </span>
                <span className="text-[8px] sm:text-[10px] text-white/80 shrink-0 font-bold leading-none">
                  {userDropdown ? '▲' : '▼'}
                </span>
              </>
            ) : (
              <span className="text-[9px] sm:text-[11px] font-bold text-white truncate leading-none px-1">
                {isVietnamese ? 'Đăng nhập / Đăng ký' : 'Sign in / Register'}
              </span>
            )}
          </button>

          {/* Menu thả xuống thông tin tài khoản (Khớp 100% Ảnh tham khảo của bạn) */}
          {userDropdown && currentUser && (
            <div className="absolute right-0 top-[115%] w-64 sm:w-72 rounded-2xl bg-white p-3.5 shadow-2xl border border-slate-100 z-50 animate-in fade-in text-slate-800 max-h-[85vh] overflow-y-auto pointer-events-auto">
              {/* Header: Avatar, Tên đăng nhập, Email */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center text-slate-500 shadow-2xs">
                  {currentUser.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg">👤</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {currentUser.username || currentUser.fullName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {currentUser.email || 'user@example.com'}
                  </p>
                </div>
              </div>

              {/* Ô Ví Xu Chòi chuẩn thiết kế với nút + Nạp Xu */}
              <div className="my-2.5 p-2.5 rounded-xl bg-[#fffdf5] border border-[#fde68a] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChoiCoin size={22} glow />
                  <div>
                    <span className="text-[11px] text-amber-900 font-medium block leading-tight">Ví Xu Chòi:</span>
                    <span className="text-xs font-black text-amber-950 font-mono">
                      {(currentUser.coins ?? 50).toLocaleString()} Xu
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdown(false)
                    onOpenCoins?.()
                  }}
                  className="text-xs bg-[#c8382b] hover:bg-[#a82d21] text-white font-bold px-3 py-1.5 rounded-xl transition shadow-2xs cursor-pointer shrink-0"
                >
                  + Nạp Xu
                </button>
              </div>

              {/* Danh sách mục chọn trong menu tài khoản */}
              <div className="flex flex-col gap-0.5 text-xs font-semibold text-slate-700 py-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdown(false)
                    setAccountCenterInitialTab('profile')
                    setAccountCenterOpen(true)
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-base text-slate-400">⚙️</span>
                  <span>{isVietnamese ? 'Cài đặt tài khoản' : 'Account Settings'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdown(false)
                    setAccountCenterInitialTab('tickets')
                    setAccountCenterOpen(true)
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-base text-slate-400">🎟️</span>
                  <span>{isVietnamese ? 'Vé của tôi' : 'My Tickets'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdown(false)
                    setAccountCenterInitialTab('tracking')
                    setAccountCenterOpen(true)
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-base text-slate-400">🚚</span>
                  <span>{isVietnamese ? 'Theo dõi đơn hàng' : 'Track Orders'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUserDropdown(false)
                    setAccountCenterInitialTab('history')
                    setAccountCenterOpen(true)
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-base text-slate-400">✉️</span>
                  <span>{isVietnamese ? 'Lịch sử giao dịch' : 'Transaction History'}</span>
                </button>

                {/* Nút dành riêng cho Admin / Staff nếu có */}
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdown(false)
                      onGoToPortal?.('admin')
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-red-700 hover:bg-red-50 transition flex items-center gap-3 cursor-pointer font-bold"
                  >
                    <span className="text-base">👑</span>
                    <span>Trang Quản Trị (Admin)</span>
                  </button>
                )}

                {currentUser.role === 'staff' && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdown(false)
                      onGoToPortal?.('staff')
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-blue-700 hover:bg-blue-50 transition flex items-center gap-3 cursor-pointer font-bold"
                  >
                    <span className="text-base">🎫</span>
                    <span>Quầy Soát Vé (Staff)</span>
                  </button>
                )}
              </div>

              {/* Đường kẻ và nút Đăng xuất */}
              <div className="pt-2 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setUserDropdown(false)
                    onLogout()
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-red-600 font-bold hover:bg-red-50 transition cursor-pointer flex items-center gap-3 text-xs active:scale-95"
                >
                  <span className="text-base">🔄</span>
                  <span>{isVietnamese ? 'Đăng xuất' : 'Log out'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Vùng bấm Menu ☰ (Khớp vị trí trên ảnh mới) */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Menu"
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform"
          style={{
            left: '89.2%',
            top: '3.0%',
            width: '6.2%',
            height: '4.5%',
          }}
        />

        {/* 4. Vùng bấm Nút LUẬT CHƠI (Khớp chuẩn vị trí trên ảnh mới x: 50.5%, y: 63.5%) */}
        <a
          href="#rules"
          onClick={(e) => {
            e.preventDefault()
            const el = document.getElementById('rules')
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' })
            } else {
              window.location.hash = '#rules'
            }
          }}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform"
          style={{
            left: '50.5%',
            top: '63.5%',
            width: '21.5%',
            height: '12.5%',
          }}
        />

        {/* 5. Vùng bấm Nút CHƠI NGAY (Khớp chuẩn vị trí trên ảnh mới x: 75.5%, y: 63.5%) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onPlay()
          }}
          className="absolute z-30 cursor-pointer outline-none focus:outline-none focus:ring-0 active:scale-95 transition-transform"
          style={{
            left: '75.5%',
            top: '63.5%',
            width: '21.5%',
            height: '12.5%',
          }}
        />
      </div>

      {/* Modal Quản lý Tài Khoản (Cài đặt, Vé của tôi, Theo dõi đơn hàng, Lịch sử) */}
      {accountCenterOpen && currentUser && (
        <AccountCenterModal
          currentUser={currentUser}
          initialTab={accountCenterInitialTab}
          onClose={() => setAccountCenterOpen(false)}
          onLogout={() => {
            setAccountCenterOpen(false)
            onLogout()
          }}
        />
      )}

      {/* Drawer Menu Điều Hướng (Khi bấm nút ☰) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <img src="/assets/choi-transparent.png" alt="Logo" className="h-8 w-8 object-contain" />
                <span className="font-black text-slate-800 text-lg">Bài Chòi Di Sản</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Menu Links */}
            <div className="py-6 flex flex-col gap-2">
              <a
                href="#home"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-3 rounded-2xl font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition block text-left"
              >
                <span>{isVietnamese ? 'Trang chủ' : 'Home'}</span>
              </a>
              <a
                href="#history"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-3 rounded-2xl font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition block text-left"
              >
                <span>{isVietnamese ? 'Giới Thiệu Di Sản' : 'Introduction'}</span>
              </a>
              <a
                href="#characters"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-3 rounded-2xl font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition block text-left"
              >
                <span>{isVietnamese ? '30 Thẻ Bài Dân Gian' : '30 Cards'}</span>
              </a>
              <a
                href="#rules"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-3 rounded-2xl font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition block text-left"
              >
                <span>{isVietnamese ? 'Luật Chơi Truyền Thống' : 'Rules'}</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  onGoToPortal?.('game')
                }}
                className="px-4 py-3 rounded-2xl font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition text-left cursor-pointer block w-full"
              >
                <span>{isVietnamese ? 'Ống Rút Bài Quản Trò' : 'Virtual Caller Tube'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  onGoToPortal?.('shop')
                }}
                className="px-4 py-3 rounded-2xl font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition text-left cursor-pointer block w-full"
              >
                <span>{isVietnamese ? 'Cửa Hàng & Vé Sự Kiện' : 'Shop & Tickets'}</span>
              </button>
            </div>

            {/* Bottom info */}
            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false)
                  onOpenCoins?.()
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ChoiCoin size={22} glow />
                  <span className="text-xs font-extrabold text-amber-950">Ví Xu: {(currentUser?.coins ?? 50).toLocaleString()} Xu</span>
                </div>
                <span className="text-xs text-emerald-800 font-bold">+ Nạp</span>
              </button>

              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false)
                    onLogout()
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🚪</span>
                  <span>Đăng xuất ({currentUser.username || currentUser.fullName})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false)
                    onOpenAuth?.('login')
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#006368] text-white font-bold text-xs hover:bg-[#004d50] transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>👤</span>
                  <span>Đăng nhập / Đăng ký</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
function IntroScreens({ c, lang }: { c: typeof content.VIE; lang: Lang }) {
  const isVietnamese = lang === 'VIE'
  const overview = isVietnamese
    ? 'Ngày 07/12/2017, Bài Chòi Trung Bộ Việt Nam được UNESCO ghi danh là Di sản văn hóa phi vật thể đại diện của nhân loại, tôn vinh giá trị nghệ thuật và tinh thần cộng đồng.'
    : 'On December 7, 2017, Central Vietnamese Bài Chòi was inscribed by UNESCO on the Representative List of the Intangible Cultural Heritage of Humanity, honoring its artistic and communal values.'
  const longIntroduction = isVietnamese
    ? 'Bài Chòi không chỉ là một trò chơi dân gian mà còn là một loại hình nghệ thuật và di sản văn hóa đặc sắc của miền Trung Việt Nam. Giá trị của Bài Chòi được thể hiện qua sự kết hợp hài hòa giữa nghệ thuật diễn xướng, âm nhạc dân gian và tính gắn kết cộng đồng. Những câu hô, lời hát ứng tác của anh Hiệu, chị Hiệu cùng tiếng trống, tiếng mõ tạo nên không gian biểu diễn sinh động, giàu bản sắc. Thông qua các cuộc chơi, người dân có cơ hội giao lưu, sẻ chia và gìn giữ những giá trị văn hóa truyền thống được lưu truyền qua nhiều thế hệ.'
    : 'Bài Chòi is not only a folk game but also a distinctive performing art and cultural heritage of Central Vietnam. Its value lies in the harmony of improvised performance, folk music and community connection. The chants of the callers, accompanied by drums and wooden clappers, create a vivid cultural space where people meet, share and preserve traditions passed down through generations.'

  return (
    <>
      {/* Screen 2: home introduction (UNESCO) - Liền mạch, mượt mà không bị cắt */}
      <ReferenceScreen id="overview">
        <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
          <div data-reveal="up" className="mx-auto px-5 py-6 sm:px-8 sm:py-8">
            {/* Huy hiệu UNESCO - Chữ trắng, bự lên, in đậm */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm lg:text-base font-bold tracking-wider text-white backdrop-blur-md border border-white/30 uppercase shadow-md">
              <span className="text-sm sm:text-base">🏛️</span>
              <span className="font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                {isVietnamese ? 'Di sản văn hóa phi vật thể UNESCO' : 'UNESCO Intangible Cultural Heritage'}
              </span>
            </div>

            {/* Đoạn 1: Lời giới thiệu chính */}
            <p className="text-sm leading-7 sm:text-base sm:leading-8 lg:text-lg lg:leading-9 font-medium text-white/95 max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              {c.hero.body}
            </p>

            {/* Vạch ngăn cách trang nhã */}
            <div className="mx-auto my-4 sm:my-5 h-px w-20 sm:w-28 bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />

            {/* Đoạn 2: Thông tin vinh danh UNESCO */}
            <p className="text-xs leading-6 sm:text-sm sm:leading-7 lg:text-base text-emerald-100/90 font-medium max-w-xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              {overview}
            </p>
          </div>
        </div>
      </ReferenceScreen>

      {/* Screen 3: card introduction (Thẻ bài) - Bỏ ảnh phải, chuyển văn bản qua phải, khung loang đen */}
      <ReferenceScreen id="history">
        <div className="flex w-full justify-end">
          <div
            data-reveal="up"
            className="w-full max-w-xl lg:max-w-2xl rounded-3xl px-6 py-8 sm:px-10 sm:py-12"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.02) 60%, rgba(0,0,0,0.18) 78%, rgba(0,0,0,0.55) 100%)',
            }}
          >
            <h2
              className="mb-5 flex items-center gap-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: 'var(--font-section)' }}
            >
              <span className="h-3 w-3 shrink-0 rounded-full bg-amber-300 shadow-[0_0_8px_#FCD34D]" />
              {isVietnamese ? 'GIỚI THIỆU' : 'INTRODUCTION'}
            </h2>
            <p className="text-sm leading-7 sm:text-base sm:leading-8 lg:text-lg lg:leading-9 font-medium text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {c.history.description}
            </p>
          </div>
        </div>
      </ReferenceScreen>

      {/* Screen 4: cultural introduction (Di sản văn hóa) */}
      <ReferenceScreen>
        <div className="mx-auto max-w-4xl text-center">
          <div
            data-reveal="up"
            className="mx-auto rounded-3xl px-6 py-8 sm:px-10 sm:py-12"
            style={{
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 22%, rgba(0,0,0,0.02) 40%, rgba(0,0,0,0.02) 60%, rgba(0,0,0,0.18) 78%, rgba(0,0,0,0.55) 100%)',
            }}
          >
            <h2
              className="mb-5 inline-flex items-center gap-3 text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: 'var(--font-section)' }}
            >
              <span className="h-3 w-3 shrink-0 rounded-full bg-amber-300 shadow-[0_0_8px_#FCD34D]" />
              {isVietnamese ? 'GIỚI THIỆU' : 'INTRODUCTION'}
            </h2>
            <p
              className="mx-auto max-w-3xl text-sm leading-7 sm:text-base sm:leading-8 lg:text-lg lg:leading-9 font-medium text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
            >
              {longIntroduction}
            </p>
          </div>
        </div>
      </ReferenceScreen>
    </>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ c }: { c: typeof content.VIE }) {
  return (
    <section id="home" className="relative overflow-hidden" style={{ paddingTop: 80, minHeight: '100vh', background: '#174F51' }}>
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/assets/nen-ultrawide.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(12,62,65,0.84) 0%, rgba(17,71,74,0.66) 42%, rgba(12,62,65,0.22) 72%, rgba(12,62,65,0.4) 100%)' }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: '#C44837' }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-[0.14]" style={{ background: '#FFFFFF' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #006368 0%, transparent 70%)' }} />
        {/* Traditional grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#006368" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 gap-12 items-center max-w-3xl">
          {/* Left: Text content */}
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 self-start">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#C44837' : i === 1 ? '#F29963' : '#006368', opacity: 1 - i * 0.18 }} />)}
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border"
                style={{ color: '#174F51', borderColor: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.78)', fontFamily: 'var(--font-body)' }}>
                {c.hero.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-none mb-2"
                style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF', letterSpacing: 0, textShadow: '0 6px 24px rgba(23,79,81,0.24)' }}>
                {c.hero.title}
              </h1>
              <h2 className="text-lg lg:text-xl font-semibold tracking-[0.12em]"
                style={{ fontFamily: 'var(--font-display)', color: '#F29963', fontStyle: 'italic' }}>
                {c.hero.subtitle}
              </h2>
            </div>

            <DragonDivider />

            <p className="text-base lg:text-lg leading-relaxed max-w-lg"
              style={{ color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-body)', lineHeight: 1.8 }}>
              {c.hero.body}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mt-2">
              <a href="#gallery"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm border-2 transition-all duration-200 hover:scale-105"
                style={{ borderColor: 'rgba(255,255,255,0.72)', color: '#FFFFFF', fontFamily: 'var(--font-body)', background: 'rgba(23,79,81,0.18)' }}>
                {c.hero.cta2}
                <span>↗</span>
              </a>
            </div>

            {/* UNESCO recognition note */}
            <div
              className="max-w-2xl rounded-2xl border px-5 py-4 text-sm leading-relaxed"
              style={{
                color: 'rgba(255,255,255,0.9)',
                background: 'rgba(9,61,64,0.4)',
                borderColor: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(8px)',
              }}
            >
              Ngày 07/12/2017, Bài chòi Trung Bộ Việt Nam được UNESCO ghi danh là Di sản văn hóa phi vật thể đại diện của nhân loại, tôn vinh giá trị nghệ thuật và tinh thần cộng đồng.
            </div>
          </div>

          {/* Right: Hero image composition */}
          <div className="relative hidden">
            {/* Main image */}
            <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio: '4/5', boxShadow: '0 24px 64px rgba(0,42,45,0.38)', border: '3px solid rgba(0,99,104,0.46)' }}>
              <img
                src="https://images.unsplash.com/photo-1526139334526-f591a54b477c?w=700&h=875&fit=crop&auto=format"
                alt="Traditional Vietnamese Bai Choi festival with lanterns in Hoi An"
                className="w-full h-full object-cover"
              />
              {/* Warm overlay */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,99,104,0.05) 0%, rgba(0,99,104,0.3) 100%)' }} />
              {/* Caption badge */}
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,99,104,0.24)' }}>
                <div className="flex items-center gap-3">
                  <LotusOrnament size={20} color="#006368" />
                  <div>
                    <div className="text-xs font-semibold" style={{ color: '#006368', letterSpacing: '0.06em' }}>HỘI BÀI CHÒI</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(0,99,104,0.7)' }}>Phố Hội An, Quảng Nam</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating card: folk verse */}
            <div className="absolute -left-8 top-1/3 p-4 rounded-xl max-w-48 hidden lg:block"
              style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,99,104,0.32)', boxShadow: '0 8px 30px rgba(0,42,45,0.18)' }}>
              <div className="text-xs font-semibold mb-2" style={{ color: '#F29963', letterSpacing: '0.05em' }}>CÂU HÒ BÀI CHÒI</div>
              <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(0,99,104,0.86)', fontFamily: 'var(--font-display)' }}>
                "Ai ơi đừng ngủ trưa / Phải thức xem Bài Chòi / Hát ca, vui lắm thay..."
              </p>
            </div>

            {/* Gold corner ornament */}
            <div className="absolute -top-4 -right-4 w-16 h-16 opacity-60">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 L64 0 L64 64" fill="none" stroke="#006368" strokeWidth="2" />
                <path d="M8 0 L64 0 L64 56" fill="none" stroke="#006368" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 opacity-60 rotate-180">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 L64 0 L64 64" fill="none" stroke="#006368" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 64 L0 32 Q360 0 720 32 Q1080 64 1440 32 L1440 64 Z" fill="#E7F1F1" />
        </svg>
      </div>
    </section>
  )
}

// ─── History ──────────────────────────────────────────────────────────────────
function History({ c }: { c: typeof content.VIE }) {
  return (
    <section id="history" className="py-20 lg:py-28" style={{ background: '#E7F1F1' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div data-reveal="up" className="text-center mb-14">
          <div data-reveal="up" data-reveal-delay="1" className="inline-flex items-center gap-2 mb-4">
            <LotusOrnament size={20} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#006368' }}>{c.history.sub}</span>
            <LotusOrnament size={20} />
          </div>
          <h2 data-reveal="up" data-reveal-delay="2" className="text-3xl lg:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
            {c.history.title}
          </h2>
          <div data-reveal="up" data-reveal-delay="3">
            <DragonDivider />
          </div>
        </div>

        {/* Single introduction block */}
        <div
          data-reveal="up"
          data-reveal-delay="1"
          className="relative overflow-hidden rounded-[28px] px-7 py-9 sm:px-10 lg:px-14 lg:py-12"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(238,248,245,0.96) 100%)',
            border: '1.5px solid rgba(0,99,104,0.36)',
            boxShadow: '0 12px 38px rgba(0,42,45,0.16)',
          }}
        >
          <div
            className="absolute -right-16 -top-20 h-56 w-56 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(242,153,99,0.2), transparent 68%)' }}
          />
          <div
            className="absolute -bottom-20 -left-14 h-52 w-52 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,99,104,0.13), transparent 70%)' }}
          />

          <div className="relative flex flex-col items-center gap-7 md:flex-row md:items-stretch md:gap-10">
            <div
              data-reveal="left"
              data-reveal-delay="2"
              className="flex w-full shrink-0 items-center justify-center rounded-2xl px-6 py-5 md:w-48"
              style={{
                background: 'linear-gradient(145deg, #006368 0%, #004B50 100%)',
                boxShadow: '0 8px 24px rgba(0,65,69,0.25)',
              }}
            >
              <img
                src="/assets/choi-transparent.png"
                alt="Logo Chòi"
                className="h-24 w-auto object-contain md:h-32 transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div data-reveal="right" data-reveal-delay="2" className="flex flex-1 flex-col justify-center">
              <div
                data-reveal="up"
                data-reveal-delay="3"
                className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em]"
                style={{ background: 'rgba(196,72,55,0.12)', color: '#9C352B' }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#C44837' }} />
                {c.history.label}
              </div>
              <p
                data-reveal="up"
                data-reveal-delay="4"
                className="text-base leading-8 sm:text-lg lg:text-xl lg:leading-10"
                style={{ color: 'rgba(0,75,80,0.88)' }}
              >
                {c.history.description}
              </p>
            </div>
          </div>
        </div>

        <Characters c={c} />
      </div>
    </section>
  )
}

// ─── Rules ────────────────────────────────────────────────────────────────────
function Rules({ c }: { c: typeof content.VIE }) {
  return (
    <section id="rules" className="flex min-h-[100svh] scroll-mt-20 items-center px-4 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28 landscape:min-h-0 landscape:py-10">
      <div className="mx-auto w-full max-w-7xl">
        <div data-reveal="up" className="mb-9 text-center sm:mb-12 lg:mb-14">
          <div data-reveal="scale" className="inline-block rounded-3xl bg-white px-8 py-5 shadow-2xl border border-white">
            <div data-reveal="up" data-reveal-delay="1" className="mb-3 inline-flex items-center gap-2">
              <LotusOrnament size={20} />
              <span className="text-xs font-semibold uppercase tracking-widest text-amber-800">
                {c.rules.sub}
              </span>
              <LotusOrnament size={20} />
            </div>
            <h2
              data-reveal="up"
              data-reveal-delay="2"
              className="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl text-[#04374f]"
              style={{ fontFamily: 'var(--font-section)' }}
            >
              {c.rules.title}
            </h2>
            <div data-reveal="up" data-reveal-delay="3">
              <DragonDivider />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {c.rules.steps.map((step, index) => (
            <article
              key={step.num}
              data-reveal="up"
              data-reveal-delay={index + 1}
              className="relative flex h-full flex-col rounded-3xl bg-white/20 backdrop-blur-md p-5 sm:p-7 lg:p-8 shadow-2xl border border-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(0,0,0,0.18)] hover:border-amber-400/50"
            >
              <div
                data-reveal="scale"
                data-reveal-delay={index + 1}
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-full text-sm font-black sm:mb-6 sm:h-14 sm:w-14 sm:text-base"
                style={{
                  background: 'linear-gradient(135deg, #C44837 0%, #7C2421 100%)',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-display)',
                  boxShadow: '0 5px 14px rgba(196,72,55,0.3)',
                }}
              >
                {step.num}
              </div>
              <h3 data-reveal="up" data-reveal-delay={index + 2} className="text-lg font-bold leading-snug sm:text-xl lg:text-2xl text-[#04374f]" style={{ fontFamily: 'var(--font-display)' }}>
                {step.title}
              </h3>
              <div className="my-5 h-0.5 w-10 bg-amber-500" />
              <p data-reveal="up" data-reveal-delay={index + 2} className="flex-1 text-sm leading-7 sm:text-base sm:leading-8 text-stone-700">
                {step.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

// // ─── Characters ───────────────────────────────────────────────────────────────
// function Characters({ c }: { c: typeof content.VIE }) {
//   const [flippedCards, setFlippedCards] = useState<Set<number>>(() => new Set())
//   const cardRows = [CARD_ASSETS.slice(0, 3), CARD_ASSETS.slice(3, 6), CARD_ASSETS.slice(6, 10)]
//   const isVietnamese = c === content.VIE

//   const toggleCard = (cardIndex: number) => {
//     setFlippedCards((current) => {
//       const next = new Set(current)
//       if (next.has(cardIndex)) next.delete(cardIndex)
//       else next.add(cardIndex)
//       return next
//     })
//   }

//   return (
//     <section id="characters" className="scroll-mt-24 px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
//       <div className="mx-auto max-w-7xl">
//         {/* Header */}
//         <div data-reveal="up" className="text-center mb-10 lg:mb-12">
//           <div className="inline-flex items-center gap-2 mb-4">
//             <LotusOrnament size={20} />
//             <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#006368' }}>{c.characters.sub}</span>
//             <LotusOrnament size={20} />
//           </div>
//           <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
//             style={{ fontFamily: 'var(--font-section)', color: '#006368' }}>
//             {c.characters.title}
//           </h2>
//           <DragonDivider />
//         </div>

//         {/* Ba hàng thẻ: 3 – 3 – 4 */}
//         <div className="space-y-6 lg:space-y-8">
//           {cardRows.map((row, rowIndex) => (
//             <div
//               key={rowIndex}
//               data-reveal="up"
//               data-reveal-delay={rowIndex}
//               className={`mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:gap-4 lg:gap-6 ${
//                 rowIndex < 2 ? 'md:grid-cols-3' : 'md:grid-cols-4'
//               }`}
//             >
//               {row.map((card) => {
//                 const cardIndex = CARD_ASSETS.findIndex((item) => item.src === card.src)
//                 const cardInfo = c.characters.cards[cardIndex]
//                 const isFlipped = flippedCards.has(cardIndex)

//                 return (
//                   <button
//                     type="button"
//                     key={card.src}
//                     className="group min-w-0 rounded-xl bg-white/95 p-1.5 text-left transition-all duration-300 hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F29963]/45 sm:rounded-2xl sm:p-2"
//                     style={{
//                       border: '1.5px solid rgba(0,99,104,0.3)',
//                       boxShadow: '0 10px 26px rgba(0,42,45,0.14)',
//                     }}
//                     onClick={() => toggleCard(cardIndex)}
//                     aria-pressed={isFlipped}
//                     aria-label={`${isVietnamese ? 'Lật thẻ' : 'Flip card'} ${cardInfo.name}`}
//                   >
//                     <div
//                       className="card-flip-scene relative w-full rounded-xl"
//                       style={{ aspectRatio: '1 / 2', background: '#FFFDEB' }}
//                     >
//                       <div className={`card-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
//                         <div className="card-flip-face card-flip-front overflow-hidden rounded-xl">
//                           <img
//                             src={card.src}
//                             alt={card.alt}
//                             loading="lazy"
//                             className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.025]"
//                           />
//                           <span
//                             className="absolute inset-x-2 bottom-2 rounded-full px-2 py-1.5 text-center text-[8px] font-bold uppercase tracking-[0.08em] sm:inset-x-3 sm:bottom-3 sm:text-[10px]"
//                             style={{ background: 'rgba(0,65,70,0.82)', color: '#FFF8D8', backdropFilter: 'blur(5px)' }}
//                           >
//                             {isVietnamese ? 'Chạm để xem ý nghĩa' : 'Tap to see the meaning'}
//                           </span>
//                         </div>

//                         <div className="card-flip-face card-flip-back flex flex-col items-center justify-center overflow-hidden rounded-xl px-3 py-4 text-center sm:px-5 sm:py-6">
//                           <div className="absolute inset-x-5 top-5 h-px bg-gradient-to-r from-transparent via-[#E2BC5B] to-transparent" />
//                           <span className="text-3xl font-black text-[#E2BC5B] sm:text-5xl" style={{ fontFamily: 'var(--font-display)' }}>
//                             {cardInfo.symbol}
//                           </span>
//                           <span className="mt-2 text-[8px] font-bold uppercase tracking-[0.16em] text-[#E2BC5B] sm:text-[10px]">
//                             {isVietnamese ? 'Ý nghĩa lá bài' : 'Card meaning'}
//                           </span>
//                           <h3 className="mt-2 text-base font-bold leading-tight text-white sm:mt-3 sm:text-2xl" style={{ fontFamily: 'var(--font-display)' }}>
//                             {cardInfo.name}
//                           </h3>
//                           <div className="my-3 h-px w-10 bg-[#E2BC5B]/75 sm:my-5 sm:w-14" />
//                           <p className="text-[10px] leading-4 text-white/85 sm:text-sm sm:leading-6">
//                             {cardInfo.meaning}
//                           </p>
//                           <span className="absolute inset-x-2 bottom-3 text-[8px] font-semibold uppercase tracking-[0.1em] text-white/55 sm:text-[9px]">
//                             {isVietnamese ? 'Chạm để xem mặt trước' : 'Tap to see the front'}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                     <div
//                       className="px-1 pb-2 pt-3 text-center text-[10px] font-semibold uppercase tracking-[0.1em] sm:px-2 sm:text-xs sm:tracking-[0.14em]"
//                       style={{ color: 'rgba(0,99,104,0.68)' }}
//                     >
//                       {String(cardIndex + 1).padStart(2, '0')} · {cardInfo.name}
//                     </div>
//                   </button>
//                 )
//               })}
//             </div>
//           ))}
//         </div>

//         <p className="text-center text-xs mt-6 opacity-60" style={{ color: '#006368', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
//           Bộ 10 thẻ bài Chòi
//         </p>
//       </div>
//     </section>
//   )
// }



function Characters({ c }: { c: typeof content.VIE }) {
  const isVietnamese = c === content.VIE

  /* =====================================================
     CHIA BỘ BÀI THÀNH 3 PHÔ
     PHÔ 01 = lá 1 → 10
     PHÔ 02 = lá 11 → 20
     PHÔ 03 = lá 21 → 30

     Hiện tại mới có 10 lá nên chỉ PHÔ 01 xuất hiện.
     Sau này thêm CARD_ASSETS thì PHÔ mới tự hiện.
  ===================================================== */

  const phoGroups = [
    {
      id: 'pho-01',
      title: isVietnamese ? 'PHO VẠN' : 'SUIT 01',
      cards: CARD_ASSETS.slice(0, 10),
      startIndex: 0,
    },
    {
      id: 'pho-02',
      title: isVietnamese ? 'PHO SÁCH' : 'SUIT 02',
      cards: CARD_ASSETS.slice(10, 20),
      startIndex: 10,
    },
    {
      id: 'pho-03',
      title: isVietnamese ? 'PHO VĂN' : 'SUIT 03',
      cards: CARD_ASSETS.slice(20, 30),
      startIndex: 20,
    },
  ].filter((pho) => pho.cards.length > 0)


  /* Mỗi phô nhớ đang đứng ở lá thứ mấy */
  const [activeCards, setActiveCards] = useState<number[]>([0, 0, 0])

  /* Các lá đang lật mặt sau */
  const [flippedCards, setFlippedCards] =
    useState<Set<number>>(() => new Set())


  const changeCard = (
    phoIndex: number,
    direction: number,
    totalCards: number
  ) => {
    setActiveCards((current) => {
      const next = [...current]

      next[phoIndex] =
        (next[phoIndex] + direction + totalCards) % totalCards

      return next
    })
  }


  const toggleCard = (cardIndex: number) => {
    setFlippedCards((current) => {
      const next = new Set(current)

      if (next.has(cardIndex)) {
        next.delete(cardIndex)
      } else {
        next.add(cardIndex)
      }

      return next
    })
  }


  return (
    <div id="characters" className="w-full">
      {phoGroups.map((pho, phoIndex) => {
        const activeIndex =
          activeCards[phoIndex] ?? 0

        const card =
          pho.cards[activeIndex]

        if (!card) return null

        const prevIndex =
          (activeIndex - 1 + pho.cards.length) %
          pho.cards.length

        const nextIndex =
          (activeIndex + 1) %
          pho.cards.length

        const prevCard = pho.cards[prevIndex]
        const nextCard = pho.cards[nextIndex]

        const cardIndex =
          pho.startIndex + activeIndex

        const cardInfo =
          c.characters.cards[cardIndex]

        const isFlipped =
          flippedCards.has(cardIndex)

        return (
          <section
            key={pho.id}
            id={phoIndex === 0 ? 'characters-showcase' : undefined}
            data-reveal="up"
            className="relative flex min-h-[100svh] scroll-mt-20 items-center justify-center px-4 py-10 sm:px-8 sm:py-14 lg:px-12 landscape:min-h-0 landscape:py-8"
          >
            <div className="mx-auto w-full max-w-7xl">
              {phoIndex === 0 && (
                <div
                  data-reveal="up"
                  className="mb-6 text-center sm:mb-8"
                >
                  <div className="inline-block text-center">
                    <div data-reveal="up" data-reveal-delay="1" className="mb-1.5 inline-flex items-center gap-2">
                      <LotusOrnament size={18} />
                      <span
                        className="text-xs font-semibold uppercase tracking-widest text-amber-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]"
                      >
                        {c.characters.sub}
                      </span>
                      <LotusOrnament size={18} />
                    </div>
                    <h2
                      data-reveal="up"
                      data-reveal-delay="2"
                      className="text-2xl font-bold sm:text-3xl lg:text-4xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                      style={{
                        fontFamily: 'var(--font-section)',
                      }}
                    >
                      {c.characters.title}
                    </h2>
                  </div>
                </div>
              )}

              {/* =========================== */}
              {/* TÊN PHÔ */}
              {/* =========================== */}

              <div className="mb-6 text-center sm:mb-8">
                <span
                  className="
                    inline-flex
                    items-center
                    gap-3
                    px-6
                    py-2
                    text-sm
                    font-black
                    uppercase
                    tracking-[0.28em]
                    sm:text-base
                    text-white
                    drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]
                  "
                  style={{
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  <span
                    className="h-px w-6 sm:w-12 bg-gradient-to-r from-transparent to-amber-300"
                  />

                  {pho.title}

                  <span
                    className="h-px w-6 sm:w-12 bg-gradient-to-r from-amber-300 to-transparent"
                  />
                </span>
              </div>


              {/* =========================== */}
              {/* CAROUSEL */}
              {/* =========================== */}

              <div
                className="
                    relative
                    mx-auto

                    flex
                    w-full
                    max-w-6xl
                    items-center
                    justify-center

                    gap-1
                    sm:gap-3
                    lg:gap-5
                  "
              >

                {/* ========================= */}
                {/* MŨI TÊN TRÁI */}
                {/* ========================= */}

                <button
                  type="button"
                  onClick={() =>
                    changeCard(
                      phoIndex,
                      -1,
                      pho.cards.length
                    )
                  }
                  className="
                      pho-arrow

                      flex
                      h-12
                      w-12
                      shrink-0

                      items-center
                      justify-center

                      rounded-full

                      text-3xl
                      font-light
                      text-white/80
                      hover:text-white
                      drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]

                      transition
                      duration-300

                      hover:-translate-x-1
                      hover:scale-110

                      active:scale-95

                      sm:h-16
                      sm:w-16
                      sm:text-5xl
                    "
                  aria-label={
                    isVietnamese
                      ? 'Lá trước'
                      : 'Previous card'
                  }
                >
                  ‹
                </button>

                {/* ========================= */}
                {/* LÁ NHỎ BÊN TRÁI */}
                {/* ========================= */}

                <button
                  type="button"
                  onClick={() =>
                    changeCard(
                      phoIndex,
                      -1,
                      pho.cards.length
                    )
                  }
                  className="
    relative
    shrink-0

    w-[15vw]
    min-w-[65px]
    max-w-[120px]

    scale-[0.86]
    opacity-100

    transition-all
    duration-300

    hover:scale-[0.92]
  "
                  aria-label={
                    isVietnamese
                      ? 'Xem lá trước'
                      : 'View previous card'
                  }
                >
                  <div className="absolute -inset-1 rounded-2xl bg-black/40 blur-md pointer-events-none -z-10" />
                  <div
                    className="
      w-full
      overflow-hidden
      rounded-xl
      shadow-[0_16px_36px_rgba(0,0,0,0.7)]
      ring-1
      ring-white/20
    "
                    style={{
                      aspectRatio: '510 / 1417',
                    }}
                  >
                    <img
                      src={prevCard.src}
                      alt={prevCard.alt}
                      loading="lazy"
                      className="
        h-full
        w-full
        object-cover
      "
                    />
                  </div>
                </button>




                {/* ========================= */}
                {/* LÁ BÀI CHÍNH */}
                {/* ========================= */}

                <div
                  className="
                      relative

                      w-[36vw]
                      max-w-[165px]

                      sm:w-[150px]
                      lg:w-[165px]
                    "
                >

                  <button
                    type="button"
                    onClick={() =>
                      toggleCard(cardIndex)
                    }
                    className="
                        group
                        block
                        w-full

                        text-left

                        transition
                        duration-300

                        hover:-translate-y-2

                        focus-visible:outline-none
                      "
                  >

                    {/* ===================== */}
                    {/* FLIP CARD */}
                    {/* ===================== */}

                    {/* Ambient shadow behind main card */}
                    <div className="absolute -inset-2.5 rounded-3xl bg-black/45 blur-xl pointer-events-none -z-10" />

                    <div
                      className="
                          card-flip-scene
                          relative
                          w-full
                          overflow-hidden
                          rounded-2xl
                          shadow-[0_24px_50px_rgba(0,0,0,0.8),0_8px_18px_rgba(0,0,0,0.6)]
                          ring-1
                          ring-white/30
                        "
                      style={{
                        aspectRatio: '510 / 1417',
                      }}
                    >

                      <div
                        className={`
                            card-flip-inner
                            ${isFlipped
                            ? 'is-flipped'
                            : ''
                          }
                          `}
                      >

                        {/* MẶT TRƯỚC */}

                        <div
                          className="
                              card-flip-face
                              card-flip-front

                              overflow-hidden
                              rounded-xl
                            "
                        >

                          <img
                            src={card.src}
                            alt={card.alt}
                            loading="lazy"
                            className="
                                h-full
                                w-full

                                object-cover

                                transition-transform
                                duration-500

                                group-hover:scale-[1.025]
                              "
                          />




                        </div>


                        {/* ===================== */}
                        {/* MẶT SAU */}
                        {/* ===================== */}

                        <div
                          className="
    card-flip-face
    card-flip-back

    flex
    flex-col

    items-center
    justify-start

    overflow-y-auto
    overflow-x-hidden

    rounded-xl

    px-3
    py-4

    text-center

    sm:justify-center
    sm:px-4
    sm:py-5
  "
                          style={{
                            WebkitOverflowScrolling: 'touch',
                          }}
                        >

                          {cardInfo ? (
                            <>

                              <div
                                className="
                                    absolute

                                    inset-x-5
                                    top-5

                                    h-px

                                    bg-gradient-to-r
                                    from-transparent
                                    via-[#E2BC5B]
                                    to-transparent
                                  "
                              />


                              <span
                                className="
    text-xl
    font-black
    leading-none
    text-[#E2BC5B]

    sm:text-4xl
  "
                                style={{
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                {cardInfo.symbol}
                              </span>

                              <span
                                className="
    mt-1

    text-[7px]
    font-bold
    uppercase

    tracking-[0.12em]

    text-[#E2BC5B]

    sm:mt-2
    sm:text-[9px]
  "
                              >
                                {isVietnamese
                                  ? 'Ý nghĩa lá bài'
                                  : 'Card meaning'}
                              </span>

                              <h3
                                className="
    mt-1

    text-base
    font-bold
    leading-tight

    text-white

    sm:mt-2
    sm:text-xl
  "
                                style={{
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                {cardInfo.name}
                              </h3>

                              <div
                                className="
    my-2
    h-px
    w-10

    bg-[#E2BC5B]/75

    sm:my-3
    sm:w-12
  "
                              />


                              <p
                                className="
    w-full
    px-1
    pb-4

    text-[8px]
    leading-[12px]
    text-white/85

    sm:px-0
    sm:text-xs
    sm:leading-5

    lg:text-sm
    lg:leading-6
  "
                                style={{
                                  WebkitTextSizeAdjust: '100%',
                                  textSizeAdjust: '100%',
                                }}
                              >
                                {cardInfo.meaning}
                              </p>

                            </>
                          ) : (

                            <p className="text-sm text-white/70">
                              {isVietnamese
                                ? 'Nội dung lá bài đang được cập nhật.'
                                : 'Card information is being updated.'}
                            </p>

                          )}




                        </div>

                      </div>

                    </div>

                  </button>

                  {/* NÚT / CHỮ NẰM DƯỚI LÁ BÀI */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleCard(cardIndex)
                    }
                    className="
                      w-full
                      mt-2.5
                      flex
                      items-center
                      justify-center
                      text-center
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-widest
                      text-white/90
                      hover:text-amber-200
                      drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]
                      transition-all
                      duration-200
                      hover:scale-105
                      active:scale-95
                      cursor-pointer
                      sm:text-[11px]
                    "
                  >
                    {isFlipped
                      ? (isVietnamese ? 'Chạm để xem mặt trước' : 'Tap to view front')
                      : (isVietnamese ? 'Chạm để xem ý nghĩa' : 'Tap to see the meaning')}
                  </button>


                  {/* ========================= */}
                  {/* TÊN + SỐ LÁ */}
                  {/* ========================= */}

                  <div className="mt-2.5 text-center">

                    <p
                      className="
                          text-sm
                          font-bold
                          uppercase
                          tracking-[0.16em]
                          sm:text-base
                          text-white
                          drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]
                        "
                    >
                      {String(cardIndex + 1).padStart(
                        2,
                        '0'
                      )}

                      {' · '}

                      {cardInfo?.name ?? card.alt}
                    </p>


                    <p
                      className="
                          mt-1
                          text-xs
                          font-bold
                          tracking-[0.2em]
                          text-amber-300
                          drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]
                        "
                    >
                      {String(activeIndex + 1).padStart(
                        2,
                        '0'
                      )}

                      {' / '}

                      {String(
                        pho.cards.length
                      ).padStart(2, '0')}
                    </p>

                  </div>

                </div>



                {/* ========================= */}
                {/* LÁ NHỎ BÊN PHẢI */}
                {/* ========================= */}

                <button
                  type="button"
                  onClick={() =>
                    changeCard(
                      phoIndex,
                      1,
                      pho.cards.length
                    )
                  }
                  className="
    relative
    shrink-0

    w-[15vw]
    min-w-[65px]
    max-w-[120px]

    scale-[0.86]
    opacity-100

    transition-all
    duration-300

    hover:scale-[0.92]
  "
                  aria-label={
                    isVietnamese
                      ? 'Xem lá tiếp theo'
                      : 'View next card'
                  }
                >
                  <div className="absolute -inset-1 rounded-2xl bg-black/40 blur-md pointer-events-none -z-10" />
                  <div
                    className="
      w-full
      overflow-hidden
      rounded-xl
      shadow-[0_16px_36px_rgba(0,0,0,0.7)]
      ring-1
      ring-white/20
    "
                    style={{
                      aspectRatio: '510 / 1417',
                    }}
                  >
                    <img
                      src={nextCard.src}
                      alt={nextCard.alt}
                      loading="lazy"
                      className="
        h-full
        w-full
        object-cover
      "
                    />
                  </div>
                </button>



                {/* ========================= */}
                {/* MŨI TÊN PHẢI */}
                {/* ========================= */}

                <button
                  type="button"
                  onClick={() =>
                    changeCard(
                      phoIndex,
                      1,
                      pho.cards.length
                    )
                  }
                  className="
                      pho-arrow

                      flex
                      h-12
                      w-12
                      shrink-0

                      items-center
                      justify-center

                      rounded-full

                      text-3xl
                      font-light
                      text-white/80
                      hover:text-white
                      drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]

                      transition
                      duration-300

                      hover:translate-x-1
                      hover:scale-110

                      active:scale-95

                      sm:h-16
                      sm:w-16
                      sm:text-5xl
                    "
                  aria-label={
                    isVietnamese
                      ? 'Lá tiếp theo'
                      : 'Next card'
                  }
                >
                  ›
                </button>

              </div>


              {/* =========================== */}
              {/* CHẤM CHỌN LÁ */}
              {/* =========================== */}

              <div
                className="
                    mt-7

                    flex
                    flex-wrap

                    items-center
                    justify-center

                    gap-2
                  "
              >

                {pho.cards.map((_, index) => (

                  <button
                    type="button"
                    key={index}
                    onClick={() => {
                      setActiveCards((current) => {
                        const next = [...current]

                        next[phoIndex] = index

                        return next
                      })
                    }}
                    aria-label={`Card ${index + 1}`}
                    className="
                        h-2
                        rounded-full

                        transition-all
                        duration-300
                      "
                    style={{
                      width:
                        index === activeIndex
                          ? 28
                          : 8,

                      background:
                        index === activeIndex
                          ? '#F29963'
                          : 'rgba(255,255,255,0.4)',
                    }}
                  />

                ))}

              </div>


              {phoIndex === phoGroups.length - 1 && (
                <p
                  className="
                      mt-8
                      text-center
                      text-xs
                      font-semibold
                      italic
                      opacity-85
                      text-white/85
                      drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]
                    "
                  style={{
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {isVietnamese
                    ? `${CARD_ASSETS.length} thẻ bài hiện có`
                    : `${CARD_ASSETS.length} cards currently available`}
                </p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
// ─── Publications ─────────────────────────────────────────────────────────────
function Publications({ c }: { c: typeof content.VIE }) {
  const [selectedImage, setSelectedImage] = useState<{ groupIndex: number; imageIndex: number } | null>(null)
  const isVietnamese = c === content.VIE
  const showcases = isVietnamese
    ? [
      {
        eyebrow: '01 · Bao bì bộ bài',
        title: 'Hộp Đựng Bài',
        description: 'Hộp đựng bài được thiết kế như một vật phẩm lưu giữ trọn vẹn tinh thần Bài Chòi. Cấu trúc chắc chắn giúp bảo vệ bộ thẻ, trong khi hệ màu vàng kem, xanh ngọc cùng họa tiết mây và sóng tạo nên diện mạo trang nhã, gần gũi với bản sắc miền Trung.',
      },
      {
        eyebrow: '02 · Quà tặng sự kiện',
        title: 'Bộ Quà Tặng Chòi',
        description: 'Từ áo, lịch để bàn, móc khóa đến bộ gốm, mỗi món quà đều mang một mảnh ký ức của nghệ thuật Bài Chòi. Các vật phẩm được phát triển đồng bộ về màu sắc và họa tiết, phù hợp làm quà lưu niệm tại triển lãm, lễ hội và những hoạt động kết nối văn hóa.',
      },
      {
        eyebrow: '03 · Bao bì ứng dụng',
        title: 'Túi Giấy & Tote Bag',
        description: 'Túi giấy và túi tote đưa nhận diện Chòi bước ra đời sống thường ngày bằng một hình thức tiện dụng và thân thiện. Logo mái chòi kết hợp cùng hoa văn dân gian tạo điểm nhấn rõ ràng, giúp mỗi chiếc túi trở thành một phương tiện lan tỏa câu chuyện di sản.',
      },
      {
        eyebrow: '04 · Ấn phẩm sự kiện',
        title: 'Vé Tham Gia & Vé Mời',
        description: 'Hệ thống vé tham gia và vé mời được xây dựng như lời mở đầu cho hành trình trải nghiệm Bài Chòi. Bố cục trang trọng, thông tin dễ đọc và các chi tiết đồ họa lấy cảm hứng từ mây, núi, hoa văn truyền thống giúp sự kiện có một dấu ấn nhất quán ngay từ điểm chạm đầu tiên.',
      },
      {
        eyebrow: '05 · Không gian trải nghiệm',
        title: 'Booth Sự Kiện',
        description: 'Booth sự kiện tái hiện tinh thần mái chòi trong một không gian trưng bày hiện đại. Hệ nhận diện được triển khai xuyên suốt từ cổng chào, quầy tiếp đón đến khu vực giới thiệu sản phẩm, tạo nên điểm gặp gỡ nổi bật để khách tham quan khám phá, chụp ảnh và kết nối với văn hóa Bài Chòi.',
      },
      {
        eyebrow: '06 · Truyền thông thị giác',
        title: 'Poster Bài Chòi',
        description: 'Poster cô đọng không khí một đêm hội Bài Chòi qua hình ảnh mái chòi, người hiệu, khán giả, ánh trăng và những rặng tre miền Trung. Sắc xanh đậm kết hợp xanh ngọc tạo chiều sâu thị giác, giúp ấn phẩm vừa mang hơi thở truyền thống, vừa đủ nổi bật để sử dụng trong triển lãm, sự kiện và các chiến dịch truyền thông văn hóa.',
      },
    ]
    : [
      {
        eyebrow: '01 · Card packaging',
        title: 'Card Boxes',
        description: 'Designed as a keepsake for the complete Bài Chòi card set, these sturdy boxes combine practical protection with a refined palette of cream, jade, cloud and wave motifs inspired by Central Vietnam.',
      },
      {
        eyebrow: '02 · Event gifts',
        title: 'Chòi Gift Collection',
        description: 'From shirts and desk calendars to key rings and ceramics, every item carries a fragment of Bài Chòi culture. The coordinated collection is designed for exhibitions, festivals and meaningful cultural gifts.',
      },
      {
        eyebrow: '03 · Branded packaging',
        title: 'Paper & Tote Bags',
        description: 'Paper and tote bags bring the Chòi identity into everyday life. The pavilion logo and folk-inspired patterns turn each practical object into a small, mobile story about Vietnamese heritage.',
      },
      {
        eyebrow: '04 · Event stationery',
        title: 'Tickets & Invitations',
        description: 'The ticket and invitation system introduces the Bài Chòi experience with clear information, ceremonial balance and graphic details inspired by clouds, mountains and traditional ornament.',
      },
      {
        eyebrow: '05 · Experience space',
        title: 'Event Booth',
        description: 'The booth reinterprets the traditional pavilion as a contemporary exhibition environment, carrying the identity from the entrance and welcome desk to displays where visitors can discover and engage with Bài Chòi culture.',
      },
      {
        eyebrow: '06 · Visual communication',
        title: 'Bài Chòi Poster',
        description: 'The poster distills the atmosphere of a Bài Chòi evening through the pavilion, caller, audience, moonlight and Central Vietnamese bamboo. Deep navy and jade create a striking visual suitable for exhibitions, events and cultural communication campaigns.',
      },
    ]

  const stepSelectedImage = (direction: number) => {
    setSelectedImage((current) => {
      if (current === null) return null
      const imageCount = PUBLICATION_GROUPS[current.groupIndex].images.length
      return {
        ...current,
        imageIndex: (current.imageIndex + direction + imageCount) % imageCount,
      }
    })
  }

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedImage(null)
      if (event.key === 'ArrowLeft') stepSelectedImage(-1)
      if (event.key === 'ArrowRight') stepSelectedImage(1)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  useEffect(() => {
    if (selectedImage === null) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [selectedImage])

  const activeGroup = selectedImage === null ? null : PUBLICATION_GROUPS[selectedImage.groupIndex]
  const activeImage = selectedImage === null ? null : activeGroup?.images[selectedImage.imageIndex]

  return (
    <section id="publications" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div data-reveal="up" className="mx-auto mb-12 max-w-3xl text-center">
          <div data-reveal="up" data-reveal-delay="1" className="mb-4 inline-flex items-center gap-2">
            <LotusOrnament size={20} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#006368' }}>
              {c.publications.sub}
            </span>
            <LotusOrnament size={20} />
          </div>
          <h2
            data-reveal="up"
            data-reveal-delay="2"
            className="mb-5 text-3xl font-bold sm:text-4xl lg:text-6xl"
            style={{ fontFamily: 'var(--font-section)', color: '#006368' }}
          >
            {c.publications.title}
          </h2>
          <div data-reveal="up" data-reveal-delay="3">
            <DragonDivider />
          </div>
          <p data-reveal="up" data-reveal-delay="4" className="mt-6 text-base leading-8 lg:text-lg" style={{ color: 'rgba(0,75,80,0.78)' }}>
            {c.publications.sub}
          </p>
        </div>

        <div className="space-y-10 sm:space-y-14 lg:space-y-20">
          {PUBLICATION_GROUPS.map((group, index) => {
            const item = showcases[index]
            const imageOnRight = index % 2 === 0

            return (
              <article
                key={item.title}
                className="grid items-center gap-7 overflow-hidden rounded-[24px] px-4 py-6 sm:min-h-[68vh] sm:rounded-[34px] sm:px-10 sm:py-8 lg:grid-cols-2 lg:gap-14 lg:px-14"
                style={{
                  background: 'linear-gradient(135deg, rgba(5,66,65,0.96), rgba(10,82,78,0.94))',
                  border: '2px solid rgba(226,188,91,0.82)',
                  boxShadow: '0 18px 44px rgba(0,42,45,0.2)',
                }}
              >
                <div
                  data-reveal={imageOnRight ? 'right' : 'left'}
                  className={`relative grid aspect-[4/3] w-full gap-2 overflow-hidden rounded-[18px] p-2 sm:gap-3 sm:rounded-[24px] sm:p-3 ${imageOnRight ? 'lg:order-2' : 'lg:order-1'
                    } ${group.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} ${group.images.length === 4 ? 'grid-rows-2' : 'grid-rows-1'
                    }`}
                  style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(229,241,237,0.95))' }}
                >
                  {group.images.map((image, imageIndex) => (
                    <button
                      type="button"
                      key={image.src}
                      className="group relative min-h-0 min-w-0 cursor-zoom-in overflow-hidden rounded-xl bg-[#f6f4e9] sm:rounded-2xl"
                      onClick={() => setSelectedImage({ groupIndex: index, imageIndex })}
                      aria-label={`${c.publications.viewLabel}: ${image.alt}`}
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.035]"
                      />
                      <span
                        className="absolute inset-x-3 bottom-3 translate-y-2 rounded-full px-3 py-2 text-[10px] font-semibold opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:text-xs"
                        style={{ background: 'rgba(0,75,80,0.9)', color: '#FFFFFF' }}
                      >
                        {c.publications.viewLabel}
                      </span>
                    </button>
                  ))}

                  {PUBLICATIONS_ARE_DEMOS && (
                    <span
                      className="absolute left-5 top-5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
                      style={{
                        background: 'rgba(255,255,255,0.94)',
                        color: '#9C352B',
                        boxShadow: '0 4px 12px rgba(0,42,45,0.14)',
                      }}
                    >
                      {c.publications.demoLabel}
                    </span>
                  )}
                </div>

                <div
                  data-reveal={imageOnRight ? 'left' : 'right'}
                  className={`flex flex-col justify-center ${imageOnRight ? 'lg:order-1' : 'lg:order-2'}`}
                >
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: '#E2BC5B' }}>
                    {item.eyebrow}
                  </div>
                  <h3 className="text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl" style={{ fontFamily: 'var(--font-title)', color: '#FFFDF3' }}>
                    {item.title}
                  </h3>
                  <div className="my-6 h-px w-24" style={{ background: '#E2BC5B' }} />
                  <p className="text-sm leading-7 sm:text-base sm:leading-8" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    {item.description}
                  </p>
                  <button
                    type="button"
                    className="mt-8 w-fit rounded-full px-6 py-3 text-sm font-semibold transition hover:-translate-y-1"
                    style={{ background: '#E2BC5B', color: '#164F49' }}
                    onClick={() => setSelectedImage({ groupIndex: index, imageIndex: 0 })}
                  >
                    {c.publications.viewLabel} ↗
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {selectedImage !== null && activeGroup && activeImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={c.publications.viewLabel}
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-lg"
            style={{ color: '#006368' }}
            onClick={() => setSelectedImage(null)}
            aria-label="Đóng"
          >
            ×
          </button>
          <div
            className="relative flex max-h-[94vh] w-full max-w-6xl flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="max-h-[76vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl"
            />

            {activeGroup.images.length > 1 && (
              <>
                <button
                  type="button"
                  className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-3xl shadow-lg transition hover:scale-105 sm:left-4"
                  style={{ color: '#006368' }}
                  onClick={() => stepSelectedImage(-1)}
                  aria-label="Ảnh trước"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-3xl shadow-lg transition hover:scale-105 sm:right-4"
                  style={{ color: '#006368' }}
                  onClick={() => stepSelectedImage(1)}
                  aria-label="Ảnh tiếp theo"
                >
                  ›
                </button>
              </>
            )}

            <div className="flex max-w-full items-center gap-2 overflow-x-auto rounded-2xl bg-black/35 p-2">
              {activeGroup.images.map((image, imageIndex) => (
                <button
                  type="button"
                  key={image.src}
                  className="h-14 w-16 shrink-0 overflow-hidden rounded-lg transition sm:h-16 sm:w-20"
                  style={{
                    border: imageIndex === selectedImage.imageIndex ? '3px solid #E2BC5B' : '2px solid rgba(255,255,255,0.45)',
                    opacity: imageIndex === selectedImage.imageIndex ? 1 : 0.72,
                  }}
                  onClick={() => setSelectedImage({ groupIndex: selectedImage.groupIndex, imageIndex })}
                  aria-label={`${c.publications.viewLabel}: ${image.alt}`}
                >
                  <img src={image.src} alt="" className="h-full w-full bg-white object-contain" />
                </button>
              ))}
            </div>

            <p className="rounded-full bg-black/45 px-4 py-2 text-center text-xs text-white sm:text-sm">
              {activeImage.alt} · {selectedImage.imageIndex + 1}/{activeGroup.images.length}
            </p>
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}

// ─── Audio ────────────────────────────────────────────────────────────────────
function AudioPlayer({ c }: { c: typeof content.VIE }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(75)

  const togglePlay = async () => {
    const audio = audioRef.current
    if (!audio) return

    if (!audio.paused) {
      audio.pause()
    } else {
      try {
        await audio.play()
      } catch {
        setPlaying(false)
      }
    }
  }

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100
  }, [volume])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = String(Math.floor(seconds % 60)).padStart(2, '0')
    return `${minutes}:${remainingSeconds}`
  }

  const seekTo = (percent: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const nextTime = Math.min(duration, Math.max(0, duration * percent))
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const skipBy = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    const nextTime = Math.min(duration || audio.duration || 0, Math.max(0, audio.currentTime + seconds))
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  return (
    <div className="relative p-8 rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FCFB 62%, #EAF6F3 100%)',
        boxShadow: '0 20px 60px rgba(0,99,104,0.18)',
        border: '1px solid rgba(0,99,104,0.3)',
      }}>
      <audio
        ref={audioRef}
        src="/assets/bai-choi-intro.mp4"
        preload="metadata"
        onLoadedMetadata={(event) => {
          const realDuration = event.currentTarget.duration
          if (Number.isFinite(realDuration)) setDuration(realDuration)
        }}
        onDurationChange={(event) => {
          const realDuration = event.currentTarget.duration
          if (Number.isFinite(realDuration)) setDuration(realDuration)
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setCurrentTime(0)
        }}
      />

      {/* Wood grain texture */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(92deg, rgba(0,99,104,0.15) 0px, transparent 1px, transparent 8px, rgba(0,99,104,0.08) 9px, transparent 10px)' }} />

      {/* Gold border inset */}
      <div className="absolute inset-3 rounded-2xl pointer-events-none" style={{ border: '1px solid rgba(0,99,104,0.15)' }} />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,99,104,0.2)', border: '1px solid rgba(0,99,104,0.4)' }}>
          <LotusOrnament size={18} color="#006368" />
        </div>
        <div>
          <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#006368' }}>ÂM NHẠC DÂN GIAN</div>
          <div className="text-xs opacity-50" style={{ color: '#006368' }}>TRADITIONAL FOLK MUSIC</div>
        </div>
      </div>

      {/* Track info */}
      <div className="mb-6 relative z-10">
        <div className="text-lg font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
          {c.audio.trackName}
        </div>
        <div className="text-sm" style={{ color: 'rgba(0,99,104,0.8)' }}>{c.audio.trackArtist}</div>
      </div>

      {/* Wave bars visualization */}
      <div className="flex items-end gap-0.5 h-12 mb-5 relative z-10">
        {Array.from({ length: 48 }).map((_, i) => {
          const active = i < (progress / 100) * 48
          const height = 20 + Math.sin(i * 0.6) * 14 + Math.sin(i * 1.3) * 8
          return (
            <div
              key={i}
              className={playing ? 'wave-bar' : ''}
              style={{
                width: '100%',
                height: `${height}%`,
                background: active ? '#C44837' : 'rgba(0,99,104,0.25)',
                borderRadius: '2px 2px 0 0',
                minHeight: 4,
                animationDelay: playing ? `${i * 0.05}s` : '0s',
                animationDuration: `${0.8 + (i % 5) * 0.15}s`,
                transition: 'background 0.1s',
              }}
            />
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="relative z-10 mb-4">
        <div className="h-1.5 rounded-full mb-1 cursor-pointer" style={{ background: 'rgba(0,99,104,0.12)' }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            seekTo((e.clientX - rect.left) / rect.width)
          }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C44837, #006368)' }}>
            <div className="w-3 h-3 rounded-full -translate-y-[3px] ml-auto -mr-1.5" style={{ background: '#FFFFFF', boxShadow: '0 0 6px rgba(196,72,55,0.5)' }} />
          </div>
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'rgba(0,99,104,0.5)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : c.audio.duration}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Prev */}
          <button
            type="button"
            aria-label="Lùi 10 giây"
            onClick={() => skipBy(-10)}
            className="opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: '#006368' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
          </button>
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Tạm dừng' : 'Phát nhạc'}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #C44837 0%, #7C2421 100%)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(196,72,55,0.5)' }}>
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          {/* Next */}
          <button
            type="button"
            aria-label="Tiến 10 giây"
            onClick={() => skipBy(10)}
            className="opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: '#006368' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6l5.5 3.89V8.11L8.5 12zM16 6h2v12h-2z" /></svg>
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,99,104,0.7)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
          <div className="w-20 h-1.5 rounded-full cursor-pointer" style={{ background: 'rgba(0,99,104,0.12)' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setVolume(Math.min(100, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * 100))))
            }}>
            <div className="h-full rounded-full" style={{ width: `${volume}%`, background: 'rgba(0,99,104,0.6)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
const galleryImages = [
  { src: 'https://images.unsplash.com/photo-1759156240671-c646dc7386f4?w=400&h=500&fit=crop&auto=format', alt: 'Traditional Vietnamese musicians in folk costumes', tall: true },
  { src: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=400&h=260&fit=crop&auto=format', alt: 'Red and white paper lanterns at Vietnamese festival', tall: false },
  { src: 'https://images.unsplash.com/photo-1691927644490-e1a24b366a5e?w=400&h=260&fit=crop&auto=format', alt: 'Colorful lanterns hanging from trees at Hoi An', tall: false },
  { src: 'https://images.unsplash.com/photo-1569271532956-3fb81a207115?w=400&h=500&fit=crop&auto=format', alt: 'Illuminated Chinese lanterns on rope at night festival', tall: true },
  { src: 'https://images.unsplash.com/photo-1618165220283-e85246c4171c?w=400&h=300&fit=crop&auto=format', alt: 'Traditional Vietnamese pagoda temple architecture', tall: false },
  { src: 'https://images.unsplash.com/photo-1767603307546-dd29f0540a49?w=400&h=300&fit=crop&auto=format', alt: 'Four performers in traditional Vietnamese ao dai costumes', tall: false },
]

function Gallery({ c }: { c: typeof content.VIE }) {
  return (
    <div>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-4">
          <LotusOrnament size={20} />
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#006368' }}>{c.gallery.sub}</span>
          <LotusOrnament size={20} />
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
          {c.gallery.title}
        </h2>
        <DragonDivider />
      </div>

      {/* Masonry-style grid */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {galleryImages.map((img, i) => (
          <div key={i} className="break-inside-avoid relative overflow-hidden rounded-xl group card-lift cursor-pointer"
            style={{ border: '2px solid rgba(0,99,104,0.3)' }}>
            <img src={img.src} alt={img.alt} className="w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end"
              style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, transparent 60%)' }}>
              <p className="p-4 text-xs font-medium" style={{ color: '#006368' }}>{img.alt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Audio + Gallery Section ──────────────────────────────────────────────────
function AudioGallerySection({ c }: { c: typeof content.VIE }) {
  return (
    <section id="gallery" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[380px,1fr] gap-12 lg:gap-16">
          {/* Audio player column */}
          <div data-reveal="left">
            <div className="text-center lg:text-left mb-6">
              <div className="inline-flex items-center gap-2 mb-3">
                <LotusOrnament size={20} />
                <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#006368' }}>{c.audio.sub}</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
                {c.audio.title}
              </h2>
            </div>
            <AudioPlayer c={c} />
          </div>

          {/* Gallery column */}
          <div data-reveal="right">
            <Gallery c={c} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── QR Code SVG ─────────────────────────────────────────────────────────────
function QRCode() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="6" fill="rgba(0,99,104,0.08)" stroke="rgba(0,99,104,0.3)" strokeWidth="1" />
      {/* QR finder pattern TL */}
      <rect x="8" y="8" width="22" height="22" rx="2" fill="none" stroke="rgba(0,99,104,0.7)" strokeWidth="2" />
      <rect x="13" y="13" width="12" height="12" rx="1" fill="rgba(0,99,104,0.7)" />
      {/* QR finder pattern TR */}
      <rect x="50" y="8" width="22" height="22" rx="2" fill="none" stroke="rgba(0,99,104,0.7)" strokeWidth="2" />
      <rect x="55" y="13" width="12" height="12" rx="1" fill="rgba(0,99,104,0.7)" />
      {/* QR finder pattern BL */}
      <rect x="8" y="50" width="22" height="22" rx="2" fill="none" stroke="rgba(0,99,104,0.7)" strokeWidth="2" />
      <rect x="13" y="55" width="12" height="12" rx="1" fill="rgba(0,99,104,0.7)" />
      {/* Data dots */}
      {[36, 40, 44, 48, 52, 56, 60, 64].map(x => [36, 40, 44, 48, 52, 56, 60, 64].map(y =>
        Math.sin(x * y) > 0.3 ? <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="rgba(0,99,104,0.5)" /> : null
      ))}
      {[36, 40, 44, 48].map(y => [8, 12, 16, 20, 24, 28].map(x =>
        Math.cos(x + y) > 0.2 ? <rect key={`d${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="rgba(0,99,104,0.5)" /> : null
      ))}
    </svg>
  )
}

// ─── Phân tích URL hash / search để tự động mở thẳng trang con khi quét mã QR ───
function detectInitialPortal(): 'site' | 'admin' | 'staff' | 'shop' | 'game' {
  if (typeof window === 'undefined') return 'site'
  const hash = (window.location.hash || '').toLowerCase()
  const search = (window.location.search || '').toLowerCase()
  const pathname = (window.location.pathname || '').toLowerCase()

  // 1. Quét mã QR hoặc link trực tiếp: Ống Rút Bài Quản Trò
  if (
    hash.includes('quan-tro') ||
    hash.includes('ong-rut') ||
    hash.includes('caller') ||
    hash.includes('game') ||
    search.includes('portal=quan-tro') ||
    search.includes('portal=game') ||
    search.includes('page=quan-tro') ||
    pathname.includes('quan-tro')
  ) {
    return 'game'
  }

  // 2. Cửa hàng
  if (hash.includes('shop') || search.includes('portal=shop') || pathname.includes('shop')) {
    return 'shop'
  }

  // 3. Admin / Staff
  if (hash.includes('admin') || search.includes('portal=admin')) {
    return 'admin'
  }
  if (hash.includes('staff') || search.includes('portal=staff')) {
    return 'staff'
  }

  return 'site'
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState<Lang>('VIE')
  const c = content[lang]

  // ── Auth & Portal state ──
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser())
  const [activePortal, setActivePortal] = useState<'site' | 'admin' | 'staff' | 'shop' | 'game'>(detectInitialPortal)
  const isDirectScan = activePortal !== 'site'

  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 1024 && window.innerHeight > window.innerWidth
  })
  const mobileScrollRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const velocityRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const handleOrientation = () => {
      setIsMobilePortrait(window.innerWidth < 1024 && window.innerHeight > window.innerWidth)
    }
    window.addEventListener('resize', handleOrientation)
    window.addEventListener('orientationchange', handleOrientation)
    return () => {
      window.removeEventListener('resize', handleOrientation)
      window.removeEventListener('orientationchange', handleOrientation)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobilePortrait) return
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: performance.now() }
    velocityRef.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMobilePortrait || !touchStartRef.current || !mobileScrollRef.current) return
    const touch = e.touches[0]
    const now = performance.now()
    const dt = Math.max(1, now - touchStartRef.current.time)
    const deltaX = touchStartRef.current.x - touch.clientX
    const deltaY = touchStartRef.current.y - touch.clientY
    const dominantDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY
    
    velocityRef.current = dominantDelta / dt
    mobileScrollRef.current.scrollTop += dominantDelta
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now }
  }

  const handleTouchEnd = () => {
    if (!isMobilePortrait || !mobileScrollRef.current) return
    let v = velocityRef.current * 16 // px per 60fps frame
    if (v > 50) v = 50
    if (v < -50) v = -50

    const glide = () => {
      if (!mobileScrollRef.current) return
      if (Math.abs(v) > 0.4) {
        mobileScrollRef.current.scrollTop += v
        v *= 0.94 // Gentle deceleration curve
        animFrameRef.current = requestAnimationFrame(glide)
      } else {
        animFrameRef.current = null
      }
    }
    if (Math.abs(v) > 0.8) {
      animFrameRef.current = requestAnimationFrame(glide)
    }
  }

  const [gameInitialTab, setGameInitialTab] = useState<GamePortalTab>('arena')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'reset'>('login')
  const [coinModalOpen, setCoinModalOpen] = useState(false)

  // ── Policy Modal state (8 danh mục chính sách) ──
  const [policyModalOpen, setPolicyModalOpen] = useState(false)
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('dieu-khoan')

  const handleOpenPolicy = (id: string = 'dieu-khoan') => {
    setSelectedPolicyId(id)
    setPolicyModalOpen(true)
  }

  useEffect(() => {
    return authService.subscribe((user) => {
      setCurrentUser(user)
    })
  }, [])

  // Tự động mở màn hình đặt lại mật khẩu khi người dùng bấm vào liên kết trong email
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (
        event === 'PASSWORD_RECOVERY' ||
        (event === 'SIGNED_IN' && (window.location.hash.includes('type=magiclink') || window.location.hash.includes('type=recovery')))
      ) {
        setAuthModalMode('reset')
        setAuthModalOpen(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ── Lắng nghe sự kiện URL thay đổi (quét mã QR hoặc bấm nút back/forward) ──
  useEffect(() => {
    const handleUrlChange = () => {
      const portal = detectInitialPortal()
      setActivePortal(portal)
      if (portal !== 'site') {
        setIntroShown(false)
        setShowContent(true)
      } else {
        // Khi quay về trang chủ (site), tuyệt đối KHÔNG bật lại intro
        setIntroShown(false)
        setShowContent(true)
      }
    }

    window.addEventListener('hashchange', handleUrlChange)
    window.addEventListener('popstate', handleUrlChange)
    return () => {
      window.removeEventListener('hashchange', handleUrlChange)
      window.removeEventListener('popstate', handleUrlChange)
    }
  }, [])

  // Kiểm tra xem trong phiên này người dùng đã xem hoặc bỏ qua intro chưa
  const hasSeenIntro = (() => {
    try {
      return sessionStorage.getItem('bai_choi_intro_seen') === 'true'
    } catch {
      return false
    }
  })()

  // ── Intro animation state: chỉ phát DUY NHẤT 1 lần khi mới mở trang gốc '/', không bao giờ phát lại khi bấm Về Trang chủ ──
  const [introShown, setIntroShown] = useState(() => !isDirectScan && !hasSeenIntro)
  const [showContent, setShowContent] = useState(() => isDirectScan || hasSeenIntro)
  const [gameOpen, setGameOpen] = useState(false)
  const [gameAudioMode, setGameAudioMode] = useState<'online' | 'offline'>('online')

  useEffect(() => {
    document.title = 'Bài Chòi Di Sản'
  }, [])

  const handleIntroDone = useCallback(() => {
    try {
      sessionStorage.setItem('bai_choi_intro_seen', 'true')
    } catch {}
    setShowContent(true)
    setTimeout(() => setIntroShown(false), 300)
  }, [])

  useEffect(() => {
    if (!introShown || showContent) return

    const fallbackTimer = window.setTimeout(handleIntroDone, 22000)
    return () => window.clearTimeout(fallbackTimer)
  }, [handleIntroDone, introShown, showContent])

  const handleBackToSite = useCallback(() => {
    try {
      sessionStorage.setItem('bai_choi_intro_seen', 'true')
    } catch {}
    setIntroShown(false)
    setShowContent(true)
    setActivePortal('site')
    if (window.location.hash) {
      try {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  const handleGoToPortal = useCallback((portal: 'site' | 'admin' | 'staff' | 'shop' | 'game') => {
    if (portal === 'site') {
      try {
        sessionStorage.setItem('bai_choi_intro_seen', 'true')
      } catch {}
      setIntroShown(false)
      setShowContent(true)
      setActivePortal('site')
      if (window.location.hash) {
        try {
          history.replaceState(null, '', window.location.pathname + window.location.search)
        } catch {}
      }
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    setActivePortal(portal)
    if (portal === 'game') {
      window.location.hash = '#quan-tro'
    } else if (portal === 'shop') {
      window.location.hash = '#shop'
    } else if (portal === 'admin') {
      window.location.hash = '#admin'
    }
  }, [])

  useEffect(() => {
    if (!showContent || activePortal !== 'site') return

    const revealElements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))

    // Kích hoạt hiển thị ngay các phần tử nằm trong viewport khi tải trang
    revealElements.forEach((element) => {
      const rect = element.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        element.classList.add('is-visible')
      }
    })

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((element) => element.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px 40px 0px' },
    )

    revealElements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [showContent, activePortal])

  // Nếu đang ở cổng Quản trị viên (Admin)
  if (activePortal === 'admin' && currentUser?.role === 'admin') {
    return (
      <AdminDashboard
        currentUser={currentUser}
        onBackToSite={handleBackToSite}
        onLogout={() => {
          authService.logout()
          setCurrentUser(null)
          handleBackToSite()
        }}
      />
    )
  }

  // Nếu đang ở cổng Nhân viên Quầy vé (Staff)
  if (activePortal === 'staff' && currentUser?.role === 'staff') {
    return (
      <StaffPortal
        currentUser={currentUser}
        onBackToSite={handleBackToSite}
        onLogout={() => {
          authService.logout()
          setCurrentUser(null)
          handleBackToSite()
        }}
      />
    )
  }

  // Nếu đang ở trang Cửa Hàng & Vé Sự Kiện (Shop Portal)
  if (activePortal === 'shop') {
    return (
      <>
        <ShopPortal
          lang={lang}
          setLang={setLang}
          currentUser={currentUser}
          onBackToSite={handleBackToSite}
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode)
            setAuthModalOpen(true)
          }}
          onLogout={() => {
            authService.logout()
            setCurrentUser(null)
          }}
          onGoToPortal={handleGoToPortal}
          onOpenPolicy={handleOpenPolicy}
          onOpenCoins={() => setCoinModalOpen(true)}
        />
        <PolicyModal
          isOpen={policyModalOpen}
          onClose={() => setPolicyModalOpen(false)}
          initialPolicyId={selectedPolicyId}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user)
            setAuthModalOpen(false)
            if (user.role === 'admin') {
              setActivePortal('admin')
            } else if (user.role === 'staff') {
              setActivePortal('staff')
            }
          }}
        />
        <CoinTopupModal
          isOpen={coinModalOpen}
          onClose={() => setCoinModalOpen(false)}
          currentUser={currentUser}
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode)
            setAuthModalOpen(true)
          }}
          onSuccess={(newCoins) => {
            if (currentUser) {
              setCurrentUser({ ...currentUser, coins: newCoins })
            }
          }}
        />
      </>
    )
  }

  // Nếu đang ở cổng Hội Chơi Bài Chòi (Game Portal)
  if (activePortal === 'game') {
    return (
      <>
        <GamePortal
          lang={lang}
          setLang={setLang}
          currentUser={currentUser}
          initialTab={gameInitialTab}
          onBackToSite={handleBackToSite}
          onGoToShop={() => setActivePortal('shop')}
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode)
            setAuthModalOpen(true)
          }}
          onLogout={() => {
            authService.logout()
            setCurrentUser(null)
          }}
          onOpenPolicy={handleOpenPolicy}
          onOpenCoins={() => setCoinModalOpen(true)}
        />
        <PolicyModal
          isOpen={policyModalOpen}
          onClose={() => setPolicyModalOpen(false)}
          initialPolicyId={selectedPolicyId}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            setCurrentUser(user)
            setAuthModalOpen(false)
            if (user.role === 'admin') {
              setActivePortal('admin')
            } else if (user.role === 'staff') {
              setActivePortal('staff')
            }
          }}
        />
        <CoinTopupModal
          isOpen={coinModalOpen}
          onClose={() => setCoinModalOpen(false)}
          currentUser={currentUser}
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode)
            setAuthModalOpen(true)
          }}
          onSuccess={(newCoins) => {
            if (currentUser) {
              setCurrentUser({ ...currentUser, coins: newCoins })
            }
          }}
        />
      </>
    )
  }

  return (
    <>
      {introShown && (
        <IntroErrorBoundary onRecover={handleIntroDone}>
          <IntroAnimation onDone={handleIntroDone} />
        </IntroErrorBoundary>
      )}
      <div
        ref={mobileScrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={showContent ? 'web-entered' : ''}
        style={
          isMobilePortrait
            ? {
                position: 'fixed',
                left: '50%',
                top: '50%',
                width: '100dvh',
                height: '100dvw',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                transformOrigin: 'center center',
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                fontFamily: 'var(--font-body)',
                background: '#408A8C',
                color: '#006368',
                opacity: showContent ? 1 : 0,
                transition: 'opacity 0.8s ease',
              }
            : {
                position: 'relative',
                width: '100%',
                minHeight: '100vh',
                fontFamily: 'var(--font-body)',
                background: '#408A8C',
                color: '#006368',
                opacity: showContent ? 1 : 0,
                transition: 'opacity 0.8s ease',
              }
        }
      >
        <div className={`relative isolate ${showContent ? 'site-content-enter' : ''}`}>
          {/* Lướt 1: Trang chủ mới dựa trên CHOINGAY.png */}
          <HeroScreen
            c={c}
            lang={lang}
            setLang={setLang}
            onPlay={() => {
              setGameOpen(true)
            }}
            currentUser={currentUser}
            onOpenAuth={(mode = 'login') => {
              setAuthModalMode(mode)
              setAuthModalOpen(true)
            }}
            onLogout={() => {
              authService.logout()
              setCurrentUser(null)
              handleBackToSite()
            }}
            onOpenCoins={() => setCoinModalOpen(true)}
            onGoToPortal={handleGoToPortal}
          />

          {/* Dưới trang chủ: 7 lướt cuộn liền mạch với tranh cuộn nền.jpg */}
          <div className="relative w-full overflow-hidden scroll-panorama-bg">
            {/* Lớp phủ đen loang 2 bên từ đầu đến cuối (Edge vignette) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.48) 14%, rgba(0,0,0,0.08) 28%, transparent 38%, transparent 62%, rgba(0,0,0,0.08) 72%, rgba(0,0,0,0.48) 86%, rgba(0,0,0,0.85) 100%)',
              }}
            />
            <div className="relative z-10">
              <IntroScreens c={c} lang={lang} />
              <Characters c={c} />
              <Rules c={c} />
            </div>
          </div>

          <Footer
            c={c}
            onOpenPolicy={handleOpenPolicy}
            onNavigateSection={(sec) => {
              if (sec === 'shop') {
                setActivePortal('shop')
              } else if (sec === 'play-offline' || sec === 'game') {
                setGameOpen(true)
              }
            }}
          />
        </div>
      </div>
      {gameOpen && (
        <BaiChoiGame
          onClose={() => setGameOpen(false)}
          initialAudioMode={gameAudioMode}
        />
      )}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user)
          if (user.role === 'admin') {
            setActivePortal('admin')
          } else if (user.role === 'staff') {
            setActivePortal('staff')
          } else {
            setActivePortal('site')
          }
        }}
      />
      <PolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        initialPolicyId={selectedPolicyId}
      />
      <CoinTopupModal
        isOpen={coinModalOpen}
        onClose={() => setCoinModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode)
          setAuthModalOpen(true)
        }}
        onSuccess={(newCoins) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, coins: newCoins })
          }
        }}
      />
      {showContent && <CookieBanner lang={lang} onOpenPolicy={handleOpenPolicy} />}
    </>
  )
}
