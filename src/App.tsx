import { Component, useCallback, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import IntroAnimation from './IntroAnimation'

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
      menu: ['Trang chủ', 'Lịch sử', 'Luật chơi', 'Nhân vật', 'Thư viện'],
      cta: 'Trải Nghiệm Ngay',
    },
    hero: {
      badge: 'Di sản Văn hóa Phi vật thể UNESCO 2017',
      title: 'BÀI CHÒI DI TRUYỀN',
      subtitle: 'HỒN DÂN GIAN TRONG NHỊP SỐNG HIỆN ĐẠI',
      body: 'Khám phá nghệ thuật diễn xướng dân gian và trò chơi hội làng đặc sắc của Trung Bộ đã được UNESCO ghi danh là Di sản Văn hóa Phi vật thể đại diện của nhân loại.',
      cta1: 'Khám Phá Di Sản',
      cta2: 'Xem Thư Viện',
    },
    history: {
      title: 'Hành Trình Di Sản UNESCO',
      sub: 'Từ làng quê đến sân khấu thế giới',
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
      title: 'Hướng Dẫn Cách Chơi Bài Chòi',
      sub: 'Bốn bước đơn giản để tham gia hội làng truyền thống',
      steps: [
        {
          num: '01',
          title: 'Dựng Chòi & Mua Thẻ Bài',
          body: 'Người chơi lên ngồi trong chòi tre được dựng riêng, mua thẻ bài có in hình quân bài. Mỗi chòi giữ 3 thẻ bài cho một ván chơi.',
          icon: '🏠',
        },
        {
          num: '02',
          title: 'Anh Hiệu Rút Bài',
          body: 'Người điều phối (Anh Hiệu) lắc ống đựng bài tre rồi rút ngẫu nhiên một quân bài để công bố cho toàn hội.',
          icon: '🎋',
        },
        {
          num: '03',
          title: 'Hô Bài & Hát Hò',
          body: 'Thay vì gọi thẳng tên, Anh Hiệu hát những câu ca dao, câu đố dân gian gợi ý tên quân bài — đây là linh hồn nghệ thuật của Bài Chòi.',
          icon: '🎵',
        },
        {
          num: '04',
          title: 'Gõ Phách & Nhận Thưởng',
          body: 'Người chơi có đủ 3 quân bài trùng khớp gõ phách báo hiệu chiến thắng. Người thắng nhận cờ đuôi nheo và phần thưởng từ ban tổ chức.',
          icon: '🥁',
        },
      ],
    },
    characters: {
      title: 'Ý Nghĩa Các Quân Bài Chòi',
      sub: 'Mỗi quân bài là một câu chuyện dân gian sâu sắc',
      cards: [
        { name: 'Ông Ầm', symbol: '龍', verse: 'Ông ầm ầm / Đùng đùng tiếng trống / Hội làng vui suốt / Đêm dài thâu canh' },
        { name: 'Thái Tử', symbol: '王', verse: 'Thái tử ngự trên ngai / Áo vàng rực rỡ / Nhân nghĩa trị vì / Muôn dân thái bình' },
        { name: 'Ba Gà', symbol: '鳳', verse: 'Ba con gà gáy / Sáng trời hừng đông / Làng quê thức dậy / Tiếng hát vang lừng' },
        { name: 'Nhứt Nọc', symbol: '一', verse: 'Một cây nêu dựng / Giữa sân đình làng / Xuân về phơi phới / Hội vui miên man' },
        { name: 'Tứ Cẳng', symbol: '四', verse: 'Bốn chân con ngựa / Ruổi khắp đồng quê / Mang theo tin vui / Từ làng về làng' },
        { name: 'Trường Hầm', symbol: '將', verse: 'Trường hầm sâu thẳm / Ẩn chứa bao điều / Người chơi khéo léo / Vận may mỉm cười' },
        { name: 'Ngũ Trợt', symbol: '五', verse: 'Năm sắc hoa văn / Tô điểm trang phục / Nghệ nhân tài hoa / Dệt nên sắc xuân' },
        { name: 'Bạch Huê', symbol: '白', verse: 'Hoa trắng tinh khôi / Nở giữa vườn xuân / Thanh cao dịu dàng / Như lòng người quê' },
      ],
    },
    audio: {
      title: 'Nghe Câu Hò Bài Chòi',
      sub: 'Trải nghiệm âm nhạc dân gian đặc sắc miền Trung',
      trackName: 'Hò Bài Chòi — Bình Định 2017',
      trackArtist: 'Nghệ nhân Minh Đức',
      duration: '4:32',
    },
    gallery: {
      title: 'Thư Viện Hình Ảnh',
      sub: 'Hội Bài Chòi tại Hội An & Bình Định',
    },
    footer: {
      desc: 'Dự án bảo tồn và phát huy giá trị Nghệ thuật Bài Chòi Trung Bộ — Di sản Văn hóa Phi vật thể UNESCO.',
      links: ['Về chúng tôi', 'Chính sách', 'Liên hệ', 'Hợp tác'],
      credit: '© 2025 Bài Chòi Di Sản. Được thực hiện với ❤️ tại Việt Nam.',
      qrLabel: 'Quét mã để chia sẻ',
    },
  },
  ENG: {
    nav: {
      menu: ['Home', 'History', 'Rules', 'Characters', 'Gallery'],
      cta: 'Experience Now',
    },
    hero: {
      badge: 'UNESCO Intangible Cultural Heritage 2017',
      title: 'BAI CHOI HERITAGE',
      subtitle: 'FOLK SOUL IN THE RHYTHM OF MODERN LIFE',
      body: 'Discover the traditional performing arts and village festival game of Central Vietnam, recognized by UNESCO as Representative Intangible Cultural Heritage of Humanity.',
      cta1: 'Explore Heritage',
      cta2: 'View Gallery',
    },
    history: {
      title: 'UNESCO Heritage Journey',
      sub: 'From village fields to the world stage',
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
      title: 'How to Play Bai Choi',
      sub: 'Four simple steps to join the traditional village festival',
      steps: [
        {
          num: '01',
          title: 'Enter the Hut & Buy Cards',
          body: 'Players sit inside individually built bamboo huts and purchase card tiles printed with traditional characters. Each hut holds 3 tiles for one round.',
          icon: '🏠',
        },
        {
          num: '02',
          title: 'The Caller Draws a Card',
          body: 'The game caller (Anh Hiệu) shakes a bamboo tube of cards and draws one randomly to announce to all participants.',
          icon: '🎋',
        },
        {
          num: '03',
          title: 'Singing the Folk Verse',
          body: 'Instead of naming the card directly, the caller sings folk riddles and traditional verses that hint at the card — the artistic soul of Bai Choi.',
          icon: '🎵',
        },
        {
          num: '04',
          title: 'Strike the Clapper & Win',
          body: 'The player who matches all 3 of their card tiles strikes a wooden clapper to signal victory and receives a ceremonial flag and prize from the organizers.',
          icon: '🥁',
        },
      ],
    },
    characters: {
      title: 'The Bai Choi Card Characters',
      sub: 'Each card tells a profound folk story',
      cards: [
        { name: 'Ông Ầm', symbol: '龍', verse: 'The booming elder / Drums thunder loud / Village festival joy / Through the long night' },
        { name: 'Thái Tử', symbol: '王', verse: 'The prince on his throne / Golden robes gleaming / Benevolent rule / People live in peace' },
        { name: 'Ba Gà', symbol: '鳳', verse: 'Three roosters crow / Dawn breaks over fields / Villages awaken / Songs ring through the air' },
        { name: 'Nhứt Nọc', symbol: '一', verse: 'One pole stands tall / In the village courtyard / Spring comes blooming / Festival joy flows' },
        { name: 'Tứ Cẳng', symbol: '四', verse: 'Four hooves of the horse / Gallop through the fields / Carrying good news / From village to village' },
        { name: 'Trường Hầm', symbol: '將', verse: 'The deep long tunnel / Holds so many secrets / The skillful player / Smiles at fortune' },
        { name: 'Ngũ Trợt', symbol: '五', verse: 'Five colorful patterns / Adorn the costume / Skilled artisan hands / Weave in spring colors' },
        { name: 'Bạch Huê', symbol: '白', verse: 'Pure white blossoms / Open in spring gardens / Graceful and gentle / As village hearts' },
      ],
    },
    audio: {
      title: 'Listen to Bai Choi Folk Song',
      sub: "Experience Central Vietnam's distinctive folk music",
      trackName: 'Bai Choi Verse — Binh Dinh 2017',
      trackArtist: 'Master Minh Đức',
      duration: '4:32',
    },
    gallery: {
      title: 'Photo Gallery',
      sub: 'Bai Choi Festivals in Hoi An & Binh Dinh',
    },
    footer: {
      desc: 'A project to preserve and promote the art of Central Vietnamese Bai Choi — UNESCO Intangible Cultural Heritage.',
      links: ['About Us', 'Policy', 'Contact', 'Partnership'],
      credit: '© 2025 Bai Choi Heritage. Made with ❤️ in Vietnam.',
      qrLabel: 'Scan to share',
    },
  },
}

// ─── Ornament SVG ─────────────────────────────────────────────────────────────
function LotusOrnament({ size = 28, color = '#006368' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 3C14 3 10 8 10 13C10 15.2 11.8 17 14 17C16.2 17 18 15.2 18 13C18 8 14 3 14 3Z" fill={color} opacity="0.8"/>
      <path d="M14 25C14 25 10 20 10 15C10 12.8 11.8 11 14 11C16.2 11 18 12.8 18 15C18 20 14 25 14 25Z" fill={color} opacity="0.5"/>
      <path d="M3 14C3 14 8 10 13 10C15.2 10 17 11.8 17 14C17 16.2 15.2 18 13 18C8 18 3 14 3 14Z" fill={color} opacity="0.5"/>
      <path d="M25 14C25 14 20 10 15 10C12.8 10 11 11.8 11 14C11 16.2 12.8 18 15 18C20 18 25 14 25 14Z" fill={color} opacity="0.8"/>
      <circle cx="14" cy="14" r="3" fill={color}/>
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

// ─── Navigation ───────────────────────────────────────────────────────────────
function Nav({ lang, setLang, c }: { lang: Lang; setLang: (l: Lang) => void; c: typeof content.VIE }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const anchors = ['#home', '#history', '#rules', '#characters', '#gallery']

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        height: 80,
        background: scrolled ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: scrolled ? '1px solid rgba(0,99,104,0.26)' : '1px solid transparent',
        boxShadow: scrolled ? '0 2px 20px rgba(0,42,45,0.28)' : 'none',
      }}
    >
      {/* Top gold line */}
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent 0%, #006368 24%, #F29963 44%, #C44837 62%, #006368 78%, transparent 100%)' }} />

      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 shrink-0 group">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #C44837 0%, #7C2421 100%)', color: '#FFFFFF', fontFamily: 'var(--font-display)', border: '2px solid #006368' }}
          >
            柱
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold leading-tight" style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
              BÀI CHÒI
            </div>
            <div className="text-xs" style={{ color: 'rgba(0,99,104,0.72)', letterSpacing: '0.08em' }}>DI SẢN UNESCO</div>
          </div>
        </a>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-1">
          {c.nav.menu.map((item, i) => (
            <a
              key={item}
              href={anchors[i]}
              className="px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 relative group"
              style={{ color: '#006368', fontFamily: 'var(--font-body)' }}
            >
              <span className="relative z-10 group-hover:text-vermilion transition-colors" style={{ color: 'inherit' }}>{item}</span>
              <span className="absolute bottom-1 left-4 right-4 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" style={{ background: '#F29963' }} />
            </a>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="hidden sm:flex rounded-full overflow-hidden border" style={{ borderColor: 'rgba(0,99,104,0.55)' }}>
            {(['VIE', 'ENG'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-3 py-1 text-xs font-semibold transition-all duration-200"
                style={{
                  background: lang === l ? '#006368' : 'transparent',
                  color: lang === l ? '#FFFFFF' : '#006368',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* CTA */}
          <a
            href="#rules"
            className="hidden sm:block px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #C44837 0%, #7C2421 100%)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 14px rgba(196,72,55,0.35)',
            }}
          >
            {c.nav.cta}
          </a>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {[0,1,2].map(i => (
              <span key={i} className="block w-5 h-0.5 transition-all" style={{ background: '#006368' }} />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 py-4 px-6 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.98)', borderBottom: '1px solid rgba(0,99,104,0.24)' }}>
          {c.nav.menu.map((item, i) => (
            <a key={item} href={anchors[i]} onClick={() => setMobileOpen(false)}
              className="text-sm font-medium py-2 border-b" style={{ color: '#006368', borderColor: 'rgba(0,99,104,0.16)' }}>
              {item}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <div className="flex rounded-full overflow-hidden border" style={{ borderColor: 'rgba(0,99,104,0.55)' }}>
              {(['VIE', 'ENG'] as Lang[]).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className="px-3 py-1 text-xs font-semibold"
                  style={{ background: lang === l ? '#006368' : 'transparent', color: lang === l ? '#FFFFFF' : '#006368' }}>
                  {l}
                </button>
              ))}
            </div>
            <a href="#rules" onClick={() => setMobileOpen(false)}
              className="flex-1 text-center px-4 py-2 rounded-full text-sm font-semibold"
              style={{ background: '#C44837', color: '#FFFFFF' }}>
              {c.nav.cta}
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero({ c }: { c: typeof content.VIE }) {
  return (
    <section id="home" className="relative overflow-hidden" style={{ paddingTop: 80, minHeight: '100vh', background: '#FFFFFF' }}>
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: '#C44837' }} />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-[0.14]" style={{ background: '#FFFFFF' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #006368 0%, transparent 70%)' }} />
        {/* Traditional grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#006368" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text content */}
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 self-start">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#C44837' : i === 1 ? '#F29963' : '#006368', opacity: 1 - i * 0.18 }} />)}
              </div>
              <span className="text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full border"
                style={{ color: '#006368', borderColor: 'rgba(0,99,104,0.28)', background: 'rgba(0,99,104,0.08)', fontFamily: 'var(--font-body)' }}>
                {c.hero.badge}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-none mb-2"
                style={{ fontFamily: 'var(--font-display)', color: '#006368', letterSpacing: 0 }}>
                {c.hero.title}
              </h1>
              <h2 className="text-lg lg:text-xl font-semibold tracking-[0.12em]"
                style={{ fontFamily: 'var(--font-display)', color: '#F29963', fontStyle: 'italic' }}>
                {c.hero.subtitle}
              </h2>
            </div>

            <DragonDivider />

            <p className="text-base lg:text-lg leading-relaxed max-w-lg"
              style={{ color: 'rgba(0,99,104,0.82)', fontFamily: 'var(--font-body)', lineHeight: 1.8 }}>
              {c.hero.body}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mt-2">
              <a href="#history"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #C44837 0%, #7C2421 100%)', color: '#FFFFFF', fontFamily: 'var(--font-body)', boxShadow: '0 6px 20px rgba(196,72,55,0.4)' }}>
                {c.hero.cta1}
                <span>→</span>
              </a>
              <a href="#gallery"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm border-2 transition-all duration-200 hover:scale-105"
                style={{ borderColor: '#006368', color: '#006368', fontFamily: 'var(--font-body)', background: 'rgba(0,99,104,0.09)' }}>
                {c.hero.cta2}
                <span>↗</span>
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              {[
                { num: '2017', label: 'UNESCO' },
                { num: '9', label: 'Tỉnh thành' },
                { num: '300+', label: 'Năm lịch sử' },
              ].map(s => (
                <div key={s.num}>
                  <div className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: '#F29963' }}>{s.num}</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: 'rgba(0,99,104,0.68)', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero image composition */}
          <div className="relative">
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
                <path d="M0 0 L64 0 L64 64" fill="none" stroke="#006368" strokeWidth="2"/>
                <path d="M8 0 L64 0 L64 56" fill="none" stroke="#006368" strokeWidth="1" opacity="0.5"/>
              </svg>
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 opacity-60 rotate-180">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0 L64 0 L64 64" fill="none" stroke="#006368" strokeWidth="2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none">
        <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 64 L0 32 Q360 0 720 32 Q1080 64 1440 32 L1440 64 Z" fill="#FFFFFF"/>
        </svg>
      </div>
    </section>
  )
}

// ─── History ──────────────────────────────────────────────────────────────────
function History({ c }: { c: typeof content.VIE }) {
  return (
    <section id="history" className="py-20 lg:py-28" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <LotusOrnament size={20} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#006368' }}>{c.history.sub}</span>
            <LotusOrnament size={20} />
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
            {c.history.title}
          </h2>
          <DragonDivider />
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {c.history.cards.map((card, i) => (
            <div key={i} className="card-lift relative p-7 rounded-2xl"
              style={{
                background: 'linear-gradient(160deg, #FFFFFF 0%, #F7FCFA 100%)',
                border: '1.5px solid rgba(0,99,104,0.38)',
                boxShadow: '0 4px 22px rgba(0,42,45,0.22)',
              }}>
              {/* Gold corner top-left */}
              <div className="absolute top-0 left-0 w-8 h-8 overflow-hidden rounded-tl-2xl opacity-50">
                <svg viewBox="0 0 32 32" fill="none">
                  <path d="M0 0 L32 0 L0 32 Z" fill="#006368" opacity="0.22"/>
                </svg>
              </div>

              {/* Year badge */}
              <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4"
                style={{ background: 'rgba(196,72,55,0.24)', color: '#006368', border: '1px solid rgba(0,99,104,0.24)' }}>
                {card.year}
              </div>

              {/* Icon */}
              <div className="text-4xl mb-4">{card.icon}</div>

              {/* Title */}
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
                {card.title}
              </h3>

              {/* Gold line */}
              <div className="w-12 h-0.5 mb-4" style={{ background: 'linear-gradient(90deg, #F29963, #006368, transparent)' }} />

              {/* Body */}
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(0,99,104,0.76)', lineHeight: 1.8 }}>
                {card.body}
              </p>

              {/* Step number */}
              <div className="absolute bottom-5 right-5 text-5xl font-black opacity-[0.06]"
                style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline connector */}
        <div className="hidden md:flex items-center justify-center mt-10 gap-0">
          {c.history.cards.map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#006368', background: '#C44837' }} />
              {i < c.history.cards.length - 1 && (
                <div className="w-40 lg:w-64 h-px" style={{ background: 'linear-gradient(90deg, #006368, #C44837, #006368)' }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Rules ────────────────────────────────────────────────────────────────────
function Rules({ c }: { c: typeof content.VIE }) {
  return (
    <section id="rules" className="py-20 lg:py-28" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <LotusOrnament size={20} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#006368' }}>{c.rules.sub}</span>
            <LotusOrnament size={20} />
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
            {c.rules.title}
          </h2>
          <DragonDivider />
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {c.rules.steps.map((step, i) => (
            <div key={i} className="relative group">
              {/* Connector line (desktop) */}
              {i < c.rules.steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-full w-full h-px z-0 -translate-x-1/2"
                  style={{ background: 'linear-gradient(90deg, rgba(0,99,104,0.48), rgba(196,72,55,0.38))' }} />
              )}

              <div className="relative z-10 p-6 rounded-2xl h-full flex flex-col gap-4 card-lift"
                style={{
                  background: 'linear-gradient(160deg, #F7FCFA 0%, #FFFFFF 100%)',
                  border: '1.5px solid rgba(0,99,104,0.36)',
                  boxShadow: '0 2px 18px rgba(0,42,45,0.24)',
                }}>

                {/* Number badge */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #C44837 0%, #7C2421 100%)',
                      color: '#FFFFFF',
                      fontFamily: 'var(--font-display)',
                      boxShadow: '0 4px 12px rgba(196,72,55,0.35)',
                    }}>
                    {step.num}
                  </div>
                  <div className="text-2xl">{step.icon}</div>
                </div>

                {/* Title */}
                <h3 className="font-bold text-base leading-snug" style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
                  {step.title}
                </h3>

                {/* Gold rule */}
                <div className="w-8 h-0.5" style={{ background: '#F29963' }} />

                {/* Body */}
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(0,99,104,0.75)', lineHeight: 1.75 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(107,179,145,0.18) 0%, rgba(0,99,104,0.1) 100%)', border: '1px solid rgba(0,99,104,0.28)' }}>
            <LotusOrnament size={18} />
            <span className="text-sm font-medium italic" style={{ color: 'rgba(0,99,104,0.82)', fontFamily: 'var(--font-display)' }}>
              "Hát hay mà chơi giỏi — Tài nghệ mới thắng người"
            </span>
            <LotusOrnament size={18} />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Characters ───────────────────────────────────────────────────────────────
function Characters({ c }: { c: typeof content.VIE }) {
  const [flipped, setFlipped] = useState<number | null>(null)

  return (
    <section id="characters" className="py-20 lg:py-28" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 mb-4">
            <LotusOrnament size={20} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#006368' }}>{c.characters.sub}</span>
            <LotusOrnament size={20} />
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>
            {c.characters.title}
          </h2>
          <DragonDivider />
        </div>

        {/* 4×2 Card Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {c.characters.cards.map((card, i) => (
            <div
              key={i}
              className="cursor-pointer"
              style={{ perspective: '800px' }}
              onClick={() => setFlipped(flipped === i ? null : i)}
            >
              <div className="relative w-full transition-all duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: flipped === i ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  aspectRatio: '2/3',
                }}>

                {/* Front */}
                <div className="absolute inset-0 bai-choi-card flex flex-col items-center justify-between p-4"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                  {/* Top border strip */}
                  <div className="w-full h-1.5 rounded-full mb-1" style={{ background: 'linear-gradient(90deg, #7C2421, #006368, #D7F0EA)' }} />

                  {/* Chinese character symbol */}
                  <div className="text-5xl lg:text-6xl font-black leading-none"
                    style={{ color: '#006368', fontFamily: 'var(--font-display)', textShadow: '2px 2px 4px rgba(0,42,45,0.28)' }}>
                    {card.symbol}
                  </div>

                  {/* Name */}
                  <div className="text-center">
                    <div className="text-sm font-bold px-3 py-1 rounded-full"
                      style={{ background: '#7C2421', color: '#FFFFFF', fontFamily: 'var(--font-body)' }}>
                      {card.name}
                    </div>
                  </div>

                  {/* Tap hint */}
                  <div className="text-xs opacity-50" style={{ color: '#006368' }}>↺</div>

                  {/* Bottom border strip */}
                  <div className="w-full h-1.5 rounded-full mt-1" style={{ background: 'linear-gradient(90deg, #D7F0EA, #006368, #7C2421)' }} />
                </div>

                {/* Back */}
                <div className="absolute inset-0 bai-choi-card flex flex-col items-center justify-center p-4 text-center gap-3"
                  style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <div className="text-xs font-bold" style={{ color: '#F29963', letterSpacing: '0.08em' }}>{card.name}</div>
                  <div className="w-10 h-px" style={{ background: '#006368' }} />
                  <p className="text-xs italic leading-relaxed" style={{ color: 'rgba(0,99,104,0.82)', fontFamily: 'var(--font-display)', lineHeight: 1.7 }}>
                    "{card.verse}"
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs mt-6 opacity-60" style={{ color: '#006368', fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
          * Nhấn vào thẻ bài để đọc câu thơ dân gian / Click cards to reveal folk verses
        </p>
      </div>
    </section>
  )
}

// ─── Audio ────────────────────────────────────────────────────────────────────
function AudioPlayer({ c }: { c: typeof content.VIE }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(75)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const togglePlay = () => {
    if (playing) {
      if (intervalRef.current) clearInterval(intervalRef.current)
    } else {
      intervalRef.current = setInterval(() => {
        setProgress(p => (p >= 100 ? 0 : p + 0.15))
      }, 100)
    }
    setPlaying(!playing)
  }

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  const elapsed = Math.floor((progress / 100) * 272)
  const mm = Math.floor(elapsed / 60)
  const ss = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="relative p-8 rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FCFB 62%, #EAF6F3 100%)',
        boxShadow: '0 20px 60px rgba(0,99,104,0.18)',
        border: '1px solid rgba(0,99,104,0.3)',
      }}>
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
            setProgress(((e.clientX - rect.left) / rect.width) * 100)
          }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #C44837, #006368)' }}>
            <div className="w-3 h-3 rounded-full -translate-y-[3px] ml-auto -mr-1.5" style={{ background: '#FFFFFF', boxShadow: '0 0 6px rgba(196,72,55,0.5)' }} />
          </div>
        </div>
        <div className="flex justify-between text-xs" style={{ color: 'rgba(0,99,104,0.5)' }}>
          <span>{mm}:{ss}</span>
          <span>{c.audio.duration}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Prev */}
          <button className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: '#006368' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #C44837 0%, #7C2421 100%)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(196,72,55,0.5)' }}>
            {playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 3 }}><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
          {/* Next */}
          <button className="opacity-50 hover:opacity-100 transition-opacity" style={{ color: '#006368' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zm2.5-6l5.5 3.89V8.11L8.5 12zM16 6h2v12h-2z"/></svg>
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,99,104,0.7)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          <div className="w-20 h-1.5 rounded-full cursor-pointer" style={{ background: 'rgba(0,99,104,0.12)' }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setVolume(Math.round(((e.clientX - rect.left) / rect.width) * 100))
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
    <section id="gallery" className="py-20 lg:py-28" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[380px,1fr] gap-12 lg:gap-16">
          {/* Audio player column */}
          <div>
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
          <div>
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
      <rect width="80" height="80" rx="6" fill="rgba(0,99,104,0.08)" stroke="rgba(0,99,104,0.3)" strokeWidth="1"/>
      {/* QR finder pattern TL */}
      <rect x="8" y="8" width="22" height="22" rx="2" fill="none" stroke="rgba(0,99,104,0.7)" strokeWidth="2"/>
      <rect x="13" y="13" width="12" height="12" rx="1" fill="rgba(0,99,104,0.7)"/>
      {/* QR finder pattern TR */}
      <rect x="50" y="8" width="22" height="22" rx="2" fill="none" stroke="rgba(0,99,104,0.7)" strokeWidth="2"/>
      <rect x="55" y="13" width="12" height="12" rx="1" fill="rgba(0,99,104,0.7)"/>
      {/* QR finder pattern BL */}
      <rect x="8" y="50" width="22" height="22" rx="2" fill="none" stroke="rgba(0,99,104,0.7)" strokeWidth="2"/>
      <rect x="13" y="55" width="12" height="12" rx="1" fill="rgba(0,99,104,0.7)"/>
      {/* Data dots */}
      {[36,40,44,48,52,56,60,64].map(x => [36,40,44,48,52,56,60,64].map(y =>
        Math.sin(x * y) > 0.3 ? <rect key={`${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="rgba(0,99,104,0.5)"/> : null
      ))}
      {[36,40,44,48].map(y => [8,12,16,20,24,28].map(x =>
        Math.cos(x + y) > 0.2 ? <rect key={`d${x}-${y}`} x={x} y={y} width="3" height="3" rx="0.5" fill="rgba(0,99,104,0.5)"/> : null
      ))}
    </svg>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer({ c }: { c: typeof content.VIE }) {
  return (
    <footer style={{ background: '#FFFFFF', borderTop: '3px solid #006368' }}>
      {/* Top gold line */}
      <div className="h-1" style={{ background: 'linear-gradient(90deg, #C44837, #006368, #C44837, #006368, #C44837)' }} />

      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: 'linear-gradient(135deg, #C44837 0%, #7C2421 100%)', color: '#FFFFFF', fontFamily: 'var(--font-display)', border: '2px solid #006368' }}>
                柱
              </div>
              <div>
                <div className="font-black text-xl" style={{ fontFamily: 'var(--font-display)', color: '#006368' }}>BÀI CHÒI</div>
                <div className="text-xs tracking-widest" style={{ color: '#006368' }}>DI SẢN UNESCO</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: 'rgba(0,99,104,0.65)', lineHeight: 1.8 }}>
              {c.footer.desc}
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {['Facebook', 'YouTube', 'Instagram'].map(s => (
                <div key={s} className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all hover:scale-110"
                  style={{ border: '1px solid rgba(0,99,104,0.3)', color: 'rgba(0,99,104,0.7)' }}>
                  {s[0]}
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold mb-4 text-sm tracking-wider" style={{ color: '#006368', fontFamily: 'var(--font-body)' }}>LIÊN KẾT</h4>
            <div className="flex flex-col gap-3">
              {c.footer.links.map(link => (
                <a key={link} href="#" className="text-sm transition-colors hover:text-amber-300"
                  style={{ color: 'rgba(0,99,104,0.6)', fontFamily: 'var(--font-body)' }}>
                  {link}
                </a>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-start gap-3">
            <h4 className="font-bold text-sm tracking-wider" style={{ color: '#006368' }}>{c.footer.qrLabel}</h4>
            <QRCode />
            <p className="text-xs" style={{ color: 'rgba(0,99,104,0.45)' }}>baichoi.vn</p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,99,104,0.3), transparent)' }} />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-center sm:text-left" style={{ color: 'rgba(0,99,104,0.45)' }}>
            {c.footer.credit}
          </p>
          <div className="flex items-center gap-2">
            <LotusOrnament size={14} color="rgba(0,99,104,0.5)" />
            <span className="text-xs italic" style={{ color: 'rgba(0,99,104,0.5)', fontFamily: 'var(--font-display)' }}>
              Gìn giữ hồn dân tộc
            </span>
            <LotusOrnament size={14} color="rgba(0,99,104,0.5)" />
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState<Lang>('VIE')
  const c = content[lang]
  
  // ── Intro animation state ──
  const [introShown, setIntroShown] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    document.title = 'Bài Chòi'
    setIntroShown(true)
  }, [])

  const handleIntroDone = useCallback(() => {
    setShowContent(true)
    setTimeout(() => setIntroShown(false), 300)
  }, [])

  useEffect(() => {
    if (!introShown || showContent) return

    const fallbackTimer = window.setTimeout(handleIntroDone, 15000)
    return () => window.clearTimeout(fallbackTimer)
  }, [handleIntroDone, introShown, showContent])

  return (
    <>
      {introShown && (
        <IntroErrorBoundary onRecover={handleIntroDone}>
          <IntroAnimation onDone={handleIntroDone} />
        </IntroErrorBoundary>
      )}
      <div 
        style={{ 
          fontFamily: 'var(--font-body)', 
          background: '#FFFFFF', 
          color: '#006368',
          opacity: showContent ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}
      >
        <Nav lang={lang} setLang={setLang} c={c} />
        <Hero c={c} />
        <History c={c} />
        <Rules c={c} />
        <Characters c={c} />
        <AudioGallerySection c={c} />
        <Footer c={c} />
      </div>
    </>
  )
}
