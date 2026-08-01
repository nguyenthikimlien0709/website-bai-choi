export type IntroBackground = {
  id: string
  label: string
  src: string
  position: string
  overlay: string
}

// Đổi giá trị này thành '1', '2' hoặc '3' để đổi nền mặc định.
export const DEFAULT_INTRO_BACKGROUND = '3'

export const INTRO_BACKGROUNDS: IntroBackground[] = [
  {
    id: '1',
    label: 'Khung lễ hội',
    src: '/assets/background-intro.jpg',
    position: 'center',
    overlay:
      'radial-gradient(circle at 50% 48%, rgba(64,138,140,0.06) 0%, rgba(34,91,93,0.2) 58%, rgba(18,65,67,0.46) 100%)',
  },
  {
    id: '2',
    label: 'Phong cảnh tối giản',
    src: '/assets/background-intro(1).jpg',
    position: 'center',
    overlay:
      'radial-gradient(circle at 50% 46%, rgba(64,138,140,0.08) 0%, rgba(34,91,93,0.2) 64%, rgba(18,65,67,0.38) 100%)',
  },
  {
    id: '3',
    label: 'Sơn thủy',
    src: '/assets/background-intro(2).jpg',
    position: 'center',
    overlay:
      'linear-gradient(rgba(20,83,85,0.38), rgba(20,83,85,0.5)), radial-gradient(circle at 50% 48%, transparent 0%, rgba(18,65,67,0.28) 100%)',
  },
]

export function getIntroBackground() {
  const requested =
    typeof window === 'undefined'
      ? DEFAULT_INTRO_BACKGROUND
      : new URLSearchParams(window.location.search).get('introBg') ??
        DEFAULT_INTRO_BACKGROUND

  return (
    INTRO_BACKGROUNDS.find((background) => background.id === requested) ??
    INTRO_BACKGROUNDS[0]
  )
}
