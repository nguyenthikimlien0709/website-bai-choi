import React from 'react'

export interface ChoiCoinProps {
  size?: number | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  animate?: boolean
  glow?: boolean
}

const SIZE_MAP: Record<string, number> = {
  xs: 16,
  sm: 20,
  md: 26,
  lg: 36,
  xl: 48,
}

export default function ChoiCoin({
  size = 'md',
  className = '',
  animate = false,
  glow = false,
}: ChoiCoinProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size] || 24

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle select-none ${
        animate ? 'hover:rotate-12 hover:scale-110 transition-transform duration-300' : ''
      } ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        filter: glow ? 'drop-shadow(0 0 6px rgba(247, 221, 130, 0.75))' : undefined,
      }}
      title="Xu Chòi"
    >
      <img
        src="/assets/xu-choi.png"
        alt="Xu Chòi"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </span>
  )
}
