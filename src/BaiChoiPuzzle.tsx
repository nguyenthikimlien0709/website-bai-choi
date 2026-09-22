import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { getChantLyrics } from './chantLyrics'

export interface PuzzleCard {
  id: string
  name: string
  image: string
  sound: string
}

export type PuzzleLevel = 1 | 2 | 3 | 4

interface BaiChoiPuzzleProps {
  card: PuzzleCard
  isCalling: boolean
  level: PuzzleLevel
  lyricIndex?: number
  onComplete: () => void
  onAutoCompleted?: () => void
  onClose?: () => void
}

const LEVEL_NAMES: Record<PuzzleLevel, { name: string; tag: string; tip: string; color: string }> = {
  1: {
    name: 'Sơ Hội',
    tag: 'Dễ (4 mảnh)',
    tip: 'Nắm lôi mảnh từ 2 cánh vào ô, hoặc click chọn rồi bấm vào ô trên bàn cờ!',
    color: '#4ade80'
  },
  2: {
    name: 'Quen Lối',
    tag: 'Trung bình (9 mảnh)',
    tip: 'Quan sát các mấu răng cưa để kéo thả mảnh vào đúng khớp!',
    color: '#38bdf8'
  },
  3: {
    name: 'Ẩn Tướng',
    tag: 'Khó (9 mảnh - Ẩn hình)',
    tip: 'Ấn vào mảnh để soi tranh trong 3s! Quan sát tranh mẫu trên bàn cờ để so khớp.',
    color: '#c084fc'
  },
  4: {
    name: 'Nghịch Phách',
    tag: 'Cực khó (4 mảnh - Xoay)',
    tip: 'Click vào bất kỳ chỗ nào của mảnh để xoay về thẳng đứng!',
    color: '#fb923c'
  }
}

// Âm thanh thock gỗ khi ghép trúng khớp
function playSnapSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(340, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.35, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.08)
  } catch {
    // Ignore audio error
  }
}

// Âm thanh chuông vàng chúc mừng khi hoàn thành
function playVictorySound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const notes = [523.25, 659.25, 783.99, 1046.50]
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = ctx.currentTime + idx * 0.08
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.35)
    })
  } catch {
    // Ignore audio error
  }
}

// Hàm sinh đường cong răng cưa Jigsaw cổ điển (tabs/blanks chuẩn)
function createJigsawEdge(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tabSign: number // +1: lồi, -1: lõm, 0: đường thẳng viền ngoài
): string {
  if (tabSign === 0) {
    return `L ${x2.toFixed(2)} ${y2.toFixed(2)} `
  }

  const dx = x2 - x1
  const dy = y2 - y1
  const L = Math.hypot(dx, dy)
  const ux = dx / L
  const uy = dy / L
  // Vector pháp tuyến vuông góc (hướng ra ngoài)
  const nx = -uy * tabSign
  const ny = ux * tabSign

  const p = (t: number, d: number) => {
    const px = x1 + t * dx + d * L * nx
    const py = y1 + t * dy + d * L * ny
    return `${px.toFixed(2)} ${py.toFixed(2)}`
  }

  // Đường cong răng cưa jigsaw cổ điển gồm cổ thắt và đầu tròn
  return (
    `L ${p(0.35, 0)} ` +
    `C ${p(0.36, 0.02)}, ${p(0.38, 0.05)}, ${p(0.36, 0.10)} ` +
    `C ${p(0.32, 0.18)}, ${p(0.40, 0.22)}, ${p(0.50, 0.22)} ` +
    `C ${p(0.60, 0.22)}, ${p(0.68, 0.18)}, ${p(0.64, 0.10)} ` +
    `C ${p(0.62, 0.05)}, ${p(0.64, 0.02)}, ${p(0.65, 0)} ` +
    `L ${x2.toFixed(2)} ${y2.toFixed(2)} `
  )
}

export default function BaiChoiPuzzle({
  card,
  isCalling,
  level,
  lyricIndex: externalLyricIndex,
  onComplete,
  onAutoCompleted,
  onClose
}: BaiChoiPuzzleProps) {
  // Lưới số mảnh (Đã đảo màn 3 và màn 4 theo yêu cầu):
  // Cấp 1: 2x2 = 4 mảnh (Sơ Hội - Dễ)
  // Cấp 2: 3x3 = 9 mảnh (Quen Lối - Trung bình)
  // Cấp 3: 3x3 = 9 mảnh (Ẩn Tướng - Khó: Ẩn hình sương mù soi 3s, kèm tranh nền mờ)
  // Cấp 4: 2x2 = 4 mảnh (Nghịch Phách - Cực khó: Xoay mảnh 90/180/270 độ)
  const gridSize = level === 2 || level === 3 ? 3 : 2
  const totalPieces = gridSize * gridSize

  const boardSize = 300 // Kích thước khung vuông chuẩn của bàn cờ
  const pieceSize = boardSize / gridSize
  const tabPadding = pieceSize * 0.28 // Phần đệm mở rộng cho mấu lồi tròn

  // Bàn cờ trung tâm: ref để tính bounding box khi drag & drop
  const boardRef = useRef<HTMLDivElement>(null)

  // Danh sách các mảnh còn ở khay 2 bên (chưa đặt vào bàn cờ)
  const [unplacedPieceIds, setUnplacedPieceIds] = useState<number[]>([])
  // Mảng lưu ID mảnh đã được đặt vào từng ô trên bàn cờ (index = slotIndex, giá trị = pieceId hoặc null)
  const [boardSlots, setBoardSlots] = useState<(number | null)[]>([])
  // Mảnh đang được chọn ở khay (theo cách click)
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null)
  // Góc xoay của từng mảnh (Cấp 4)
  const [pieceRotations, setPieceRotations] = useState<Record<number, number>>({})
  // Ô đang được soi qua sương mù trong 3 giây (Cấp 3)
  const [peekedPieceIds, setPeekedPieceIds] = useState<number[]>([])
  // Báo hiệu ô bị chọn sai (để rung lắc đỏ)
  const [wrongSlotIndex, setWrongSlotIndex] = useState<number | null>(null)

  // Bộ lời câu hò dân gian Bài Chòi
  const chantLyrics = useMemo(() => getChantLyrics(card.id, card.name), [card.id, card.name])
  const [localLyricIndex, setLocalLyricIndex] = useState(0)

  // Đồng bộ lyric câu hò theo thời gian hò (~7s mỗi câu)
  useEffect(() => {
    if (!isCalling) {
      setLocalLyricIndex(chantLyrics.length - 1)
      return
    }
    setLocalLyricIndex(0)
    const interval = setInterval(() => {
      setLocalLyricIndex((prev) => (prev < chantLyrics.length - 1 ? prev + 1 : prev))
    }, 7000)
    return () => clearInterval(interval)
  }, [isCalling, card.id, chantLyrics.length])

  const activeLyricIndex = externalLyricIndex !== undefined ? externalLyricIndex : localLyricIndex

  // Trạng thái Drag & Drop (Nắm lôi vào bàn cờ)
  const [dragState, setDragState] = useState<{
    pieceId: number
    startX: number
    startY: number
    currentX: number
    currentY: number
    hasMoved: boolean
  } | null>(null)
  const [hoveredSlotIndex, setHoveredSlotIndex] = useState<number | null>(null)

  const [isSolved, setIsSolved] = useState(false)
  const [hasCelebrated, setHasCelebrated] = useState(false)

  const peekTimeoutsRef = useRef<Record<number, number>>({})

  // Sinh các mấu răng cưa (Tabs/Blanks) cố định cho bàn cờ
  const { piecePaths, allSeamsPath } = useMemo(() => {
    const h: number[][] = []
    for (let r = 0; r < gridSize - 1; r++) {
      h[r] = []
      for (let c = 0; c < gridSize; c++) {
        h[r][c] = (r + c) % 2 === 0 ? 1 : -1
      }
    }

    const v: number[][] = []
    for (let r = 0; r < gridSize; r++) {
      v[r] = []
      for (let c = 0; c < gridSize - 1; c++) {
        v[r][c] = (r + c) % 2 === 0 ? 1 : -1
      }
    }

    const paths: string[] = []
    for (let i = 0; i < totalPieces; i++) {
      const r = Math.floor(i / gridSize)
      const c = i % gridSize

      const x0 = c * pieceSize
      const y0 = r * pieceSize
      const x1 = (c + 1) * pieceSize
      const y1 = (r + 1) * pieceSize

      const topSign = r === 0 ? 0 : -h[r - 1][c]
      const rightSign = c === gridSize - 1 ? 0 : v[r][c]
      const bottomSign = r === gridSize - 1 ? 0 : h[r][c]
      const leftSign = c === 0 ? 0 : -v[r][c - 1]

      let d = `M ${x0.toFixed(2)} ${y0.toFixed(2)} `
      d += createJigsawEdge(x0, y0, x1, y0, topSign)
      d += createJigsawEdge(x1, y0, x1, y1, rightSign)
      d += createJigsawEdge(x1, y1, x0, y1, bottomSign)
      d += createJigsawEdge(x0, y1, x0, y0, leftSign)
      d += 'Z'

      paths.push(d)
    }

    let seams = ''
    for (let r = 0; r < gridSize - 1; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x0 = c * pieceSize
        const y = (r + 1) * pieceSize
        const x1 = (c + 1) * pieceSize
        seams += `M ${x0.toFixed(2)} ${y.toFixed(2)} ` + createJigsawEdge(x0, y, x1, y, h[r][c])
      }
    }
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize - 1; c++) {
        const x = (c + 1) * pieceSize
        const y0 = r * pieceSize
        const y1 = (r + 1) * pieceSize
        seams += `M ${x.toFixed(2)} ${y0.toFixed(2)} ` + createJigsawEdge(x, y0, x, y1, v[r][c])
      }
    }

    return { piecePaths: paths, allSeamsPath: seams }
  }, [gridSize, totalPieces, pieceSize])

  // Khởi tạo ván chơi: đưa toàn bộ mảnh ra 2 khay bên cạnh
  useEffect(() => {
    setIsSolved(false)
    setHasCelebrated(false)
    setSelectedPieceId(null)
    setDragState(null)
    setHoveredSlotIndex(null)
    setPeekedPieceIds([])
    setWrongSlotIndex(null)

    // Bàn cờ ban đầu hoàn toàn rỗng
    setBoardSlots(Array.from({ length: totalPieces }, () => null))

    // Toàn bộ mảnh được đưa ra khay và xáo trộn ngẫu nhiên
    const initialIndices = Array.from({ length: totalPieces }, (_, i) => i)
    for (let i = initialIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[initialIndices[i], initialIndices[j]] = [initialIndices[j], initialIndices[i]]
    }
    setUnplacedPieceIds(initialIndices)

    // Khởi tạo góc xoay cho Cấp 4 (Trùm cuối: Xoay mảnh)
    const rotations: Record<number, number> = {}
    initialIndices.forEach((id) => {
      if (level === 4) {
        const possible = [90, 180, 270]
        rotations[id] = possible[Math.floor(Math.random() * possible.length)]
      } else {
        rotations[id] = 0
      }
    })
    setPieceRotations(rotations)
  }, [card.id, level, totalPieces])

  // Tự động hoàn thành khi Chị Hiệu dứt tiếng hò (30s kết thúc)
  useEffect(() => {
    if (!isCalling) {
      setBoardSlots(Array.from({ length: totalPieces }, (_, i) => i))
      setUnplacedPieceIds([])
      setSelectedPieceId(null)
      setDragState(null)
      setIsSolved(true)

      const uprightRotations: Record<number, number> = {}
      for (let i = 0; i < totalPieces; i++) {
        uprightRotations[i] = 0
      }
      setPieceRotations(uprightRotations)

      if (!hasCelebrated) {
        onAutoCompleted?.()
      }
    }
  }, [isCalling, totalPieces, hasCelebrated, onAutoCompleted])

  // Chia đều các mảnh ở khay làm 2 bên (Trái và Phải)
  const { leftTrayPieces, rightTrayPieces } = useMemo(() => {
    const left: number[] = []
    const right: number[] = []
    unplacedPieceIds.forEach((id, index) => {
      if (index % 2 === 0) left.push(id)
      else right.push(id)
    })
    return { leftTrayPieces: left, rightTrayPieces: right }
  }, [unplacedPieceIds])

  // Soi sương mù trong đúng 3 giây (Cấp 3: Ẩn Tướng)
  const triggerPeek = useCallback((pieceId: number) => {
    setPeekedPieceIds((prev) => (prev.includes(pieceId) ? prev : [...prev, pieceId]))
    if (peekTimeoutsRef.current[pieceId]) {
      window.clearTimeout(peekTimeoutsRef.current[pieceId])
    }
    peekTimeoutsRef.current[pieceId] = window.setTimeout(() => {
      setPeekedPieceIds((prev) => prev.filter((id) => id !== pieceId))
    }, 3000)
  }, [])

  // Xoay mảnh 90 độ (Cấp 4: Nghịch Phách)
  const handleRotate = useCallback(
    (pieceId: number, e?: React.MouseEvent | React.PointerEvent) => {
      if (e) {
        e.stopPropagation()
      }
      if (!isCalling || isSolved || level !== 4) return

      setPieceRotations((prev) => ({
        ...prev,
        [pieceId]: ((prev[pieceId] || 0) + 90) % 360
      }))
    },
    [isCalling, isSolved, level]
  )

  // Chọn hoặc xoay mảnh ở khay (khi click vào bất kỳ chỗ nào của mảnh)
  const handlePieceClick = (pieceId: number) => {
    if (!isCalling || isSolved) return

    // Cấp 3: Ẩn Tướng (soi sương mù 3 giây)
    if (level === 3) {
      triggerPeek(pieceId)
    }

    // Cấp 4: Nghịch Phách (Click vào bất kỳ chỗ nào của mảnh đều xoay 90 độ)
    if (level === 4) {
      handleRotate(pieceId)
    }

    setSelectedPieceId(pieceId)
  }

  // Đặt mảnh vào ô trên bàn cờ (dùng chung cho cả Click & Drag)
  const placePieceIntoSlot = useCallback(
    (pieceId: number, slotIndex: number) => {
      // Ở Cấp 4 (Xoay): Phải xoay mảnh về thẳng đứng (rotation === 0) mới được đặt vào
      if (level === 4 && pieceRotations[pieceId] !== 0) {
        // Tự động xoay thêm 90 độ khi thử đặt sai góc để người chơi thuận tiện
        handleRotate(pieceId)
        setWrongSlotIndex(slotIndex)
        window.setTimeout(() => setWrongSlotIndex(null), 500)
        return false
      }

      // Kiểm tra xem có đúng ô khớp với mảnh ghép không
      if (pieceId === slotIndex) {
        // Đặt khớp thành công!
        playSnapSound()
        const nextSlots = [...boardSlots]
        nextSlots[slotIndex] = pieceId
        setBoardSlots(nextSlots)

        // Xóa khỏi danh sách mảnh ở khay
        setUnplacedPieceIds((prev) => prev.filter((id) => id !== pieceId))
        setSelectedPieceId(null)

        // Kiểm tra xem đã hoàn thành toàn bộ bàn cờ chưa
        const isAllFilled = nextSlots.every((val, idx) => val === idx)
        if (isAllFilled) {
          setIsSolved(true)
          setHasCelebrated(true)
          playVictorySound()
          onComplete()
        }
        return true
      } else {
        // Chưa khớp với ô này -> Rung lắc đỏ báo hiệu
        setWrongSlotIndex(slotIndex)
        window.setTimeout(() => setWrongSlotIndex(null), 500)
        return false
      }
    },
    [boardSlots, handleRotate, level, onComplete, pieceRotations]
  )

  // Khi click vào một ô trên bàn cờ
  const handleSlotClick = (slotIndex: number) => {
    if (!isCalling || isSolved) return
    if (selectedPieceId === null) return
    placePieceIntoSlot(selectedPieceId, slotIndex)
  }

  // ==========================================
  // XỬ LÝ KÉO THẢ (DRAG AND DROP - NẮM LÔI VÀO)
  // ==========================================
  const handlePointerDownPiece = (pieceId: number, e: React.PointerEvent) => {
    if (!isCalling || isSolved) return
    if (e.button !== 0 && e.pointerType === 'mouse') return

    if (level === 3) {
      triggerPeek(pieceId)
    }

    setDragState({
      pieceId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      hasMoved: false
    })
  }

  useEffect(() => {
    if (!dragState) return

    const handlePointerMove = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY)
      const hasMoved = dragState.hasMoved || dist > 6

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX,
              currentY: e.clientY,
              hasMoved
            }
          : null
      )

      // Kiểm tra xem con trỏ đang lơ lửng trên ô nào của bàn cờ
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect()
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const relX = (e.clientX - rect.left) / rect.width
          const relY = (e.clientY - rect.top) / rect.height
          const col = Math.floor(relX * gridSize)
          const row = Math.floor(relY * gridSize)
          const slotIdx = row * gridSize + col
          if (slotIdx >= 0 && slotIdx < totalPieces) {
            setHoveredSlotIndex(slotIdx)
            return
          }
        }
      }
      setHoveredSlotIndex(null)
    }

    const handlePointerUp = () => {
      if (dragState) {
        if (!dragState.hasMoved) {
          // Thao tác click ngắn: xoay (ở cấp 4) hoặc soi sương (ở cấp 3)
          handlePieceClick(dragState.pieceId)
        } else {
          // Thao tác kéo thả (nắm lôi vào bàn cờ)
          if (hoveredSlotIndex !== null) {
            placePieceIntoSlot(dragState.pieceId, hoveredSlotIndex)
          }
        }
      }
      setDragState(null)
      setHoveredSlotIndex(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [dragState, gridSize, hoveredSlotIndex, placePieceIntoSlot, totalPieces])

  // Phím Space/R để xoay mảnh đang chọn trên laptop (Cấp 4)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCalling || isSolved || level !== 4) return
      if ((e.code === 'Space' || e.code === 'KeyR') && selectedPieceId !== null) {
        e.preventDefault()
        handleRotate(selectedPieceId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleRotate, isCalling, isSolved, level, selectedPieceId])

  const levelInfo = LEVEL_NAMES[level]

  // =========================================================================
  // HÀM VẼ TRANH DÂN GIAN PHỦ KÍN KHUNG (CROP VÀ PHÓNG TO PHẦN TRANH NHƯ ẢNH 3)
  // Bỏ viền thừa xung quanh, loại bỏ phần tiêu đề để tranh nhân vật phủ kín 100%
  // =========================================================================
  const renderCardArtImage = (opacity = 1) => (
    <image
      href={card.image}
      x={-boardSize * 0.16}
      y={-boardSize * 0.22}
      width={boardSize * 1.32}
      height={boardSize * 1.44}
      preserveAspectRatio="xMidYMid slice"
      opacity={opacity}
    />
  )

  // Render một mảnh Jigsaw đơn lẻ (dành cho khay 2 bên)
  const renderTrayPiece = (pieceId: number) => {
    const isSelected = selectedPieceId === pieceId
    const isBeingDragged = dragState?.pieceId === pieceId && dragState.hasMoved
    const rotation = pieceRotations[pieceId] || 0
    const isPeeked = peekedPieceIds.includes(pieceId)
    // Ở Màn 3 (Ẩn Tướng): Mặc định bị che sương mù, chỉ hiện khi được ấn vào (isPeeked) trong 3 giây
    const shouldBlur = level === 3 && !isPeeked && !isSolved

    const r = Math.floor(pieceId / gridSize)
    const c = pieceId % gridSize

    // Tọa độ bounding box của mảnh đơn lẻ kèm phần đệm cho mấu lồi
    const vbX = c * pieceSize - tabPadding
    const vbY = r * pieceSize - tabPadding
    const vbW = pieceSize + tabPadding * 2
    const vbH = pieceSize + tabPadding * 2

    return (
      <div
        key={`tray-piece-${pieceId}`}
        onPointerDown={(e) => handlePointerDownPiece(pieceId, e)}
        onContextMenu={(e) => {
          e.preventDefault()
          if (level === 4) handleRotate(pieceId, e)
        }}
        className={`relative aspect-square w-full rounded-xl p-1 cursor-grab active:cursor-grabbing transition-all duration-200 group flex items-center justify-center select-none touch-none ${
          isBeingDragged
            ? 'opacity-30 border-2 border-dashed border-[#f6d274]/50'
            : isSelected
            ? 'bg-[#f6d274]/25 ring-2 ring-[#f6d274] scale-105 shadow-[0_0_16px_rgba(246,210,116,0.6)] z-20'
            : 'bg-[#0b3d40]/70 hover:bg-[#0e4d50] hover:scale-102 border border-[#85d4ce]/35 shadow-md'
        }`}
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isBeingDragged ? 'none' : 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), scale 0.15s ease'
        }}
      >
        <svg
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className="w-full h-full block drop-shadow-md overflow-visible pointer-events-none"
        >
          <defs>
            <clipPath id={`tray-clip-${pieceId}`}>
              <path d={piecePaths[pieceId]} />
            </clipPath>
          </defs>

          {/* Tranh dân gian lấp đầy 100% mảnh ghép (không có viền trống) */}
          <g clipPath={`url(#tray-clip-${pieceId})`}>
            {renderCardArtImage(1)}

            {/* Lớp sương mù cho Cấp 3 (Ẩn hình, ấn chuột soi 3s) */}
            {shouldBlur && (
              <g className="transition-opacity duration-300">
                <rect x={vbX} y={vbY} width={vbW} height={vbH} fill="#073638" opacity="0.94" />
                <text
                  x={c * pieceSize + pieceSize / 2}
                  y={r * pieceSize + pieceSize / 2 + 5}
                  fill="#f6d274"
                  fontSize="22"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  ☁
                </text>
              </g>
            )}
          </g>

          {/* Đường viền răng cưa Jigsaw cổ điển bao quanh mảnh */}
          <path
            d={piecePaths[pieceId]}
            fill="none"
            stroke={isSelected ? '#f6d274' : 'rgba(255, 255, 255, 0.8)'}
            strokeWidth={isSelected ? 3.5 : 2}
          />
        </svg>

        {/* Nút xoay 🔄 ở góc mảnh (Cấp 4: Nghịch Phách) */}
        {level === 4 && isCalling && !isBeingDragged && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => handleRotate(pieceId, e)}
            title="Click vào mảnh để xoay (hoặc click vào nút này / Space)"
            className="absolute -top-1.5 -right-1.5 z-30 h-5 w-5 rounded-full bg-[#f29963] hover:bg-[#ffb07f] active:scale-90 text-[#072d2e] font-black text-[10px] flex items-center justify-center shadow-md transition"
          >
            ↻
          </button>
        )}
      </div>
    )
  }

  // Render mảnh bóng ma đang bay theo chuột khi kéo thả (Ghost preview)
  const renderGhostDraggingPiece = () => {
    if (!dragState || !dragState.hasMoved) return null

    const pieceId = dragState.pieceId
    const rotation = pieceRotations[pieceId] || 0
    const r = Math.floor(pieceId / gridSize)
    const c = pieceId % gridSize

    const vbX = c * pieceSize - tabPadding
    const vbY = r * pieceSize - tabPadding
    const vbW = pieceSize + tabPadding * 2
    const vbH = pieceSize + tabPadding * 2

    return (
      <div
        className="fixed pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]"
        style={{
          left: dragState.currentX,
          top: dragState.currentY,
          width: 72,
          height: 72,
          transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(1.12)`
        }}
      >
        <svg
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          className="w-full h-full block overflow-visible"
        >
          <defs>
            <clipPath id={`ghost-clip-${pieceId}`}>
              <path d={piecePaths[pieceId]} />
            </clipPath>
          </defs>
          <g clipPath={`url(#ghost-clip-${pieceId})`}>
            {renderCardArtImage(1)}
          </g>
          <path
            d={piecePaths[pieceId]}
            fill="none"
            stroke="#f6d274"
            strokeWidth="3.5"
          />
        </svg>
      </div>
    )
  }

  return (
    <div className="bai-choi-puzzle-container flex flex-col items-center select-none w-full max-w-[460px] mx-auto px-1 sm:px-2">
      {/* GHOST PIECE KHI KÉO THẢ */}
      {renderGhostDraggingPiece()}

      {/* THANH THÔNG TIN CẤP ĐỘ & NÚT ĐÓNG */}
      <div className="w-full mb-2 flex items-center justify-between gap-1.5 px-0.5">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span
            className="text-[10px] min-[380px]:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm"
            style={{
              backgroundColor: `${levelInfo.color}25`,
              color: levelInfo.color,
              borderColor: `${levelInfo.color}70`
            }}
          >
            Cấp {level}: {levelInfo.name}
          </span>
          <span className="text-[10px] min-[380px]:text-[11px] text-white/60 font-medium">({levelInfo.tag})</span>
        </div>

        <div className="flex items-center gap-2">
          {isSolved ? (
            <span className="text-[11px] sm:text-xs font-bold text-[#f6d274] flex items-center gap-1 animate-pulse">
              <span>✨</span> Hoàn Thành Jigsaw!
            </span>
          ) : (
            <span className="text-[10px] min-[380px]:text-[11px] text-white/70">
              Còn: <strong>{unplacedPieceIds.length}</strong> mảnh
            </span>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-white/60 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10 transition"
              title="Đóng bảng ghép"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* BỐ CỤC CHUẨN: KHAY TRÁI - BÀN CỜ TRUNG TÂM - KHAY PHẢI */}
      <div className="flex items-center justify-center gap-1.5 min-[380px]:gap-2 sm:gap-4 w-full">
        {/* CỘT KHAY BÊN TRÁI (CHỨA CÁC MẢNH CHỜ GHÉP) */}
        <div className="flex flex-col gap-1.5 shrink-0 w-[50px] min-[390px]:w-[58px] sm:w-[76px] max-h-[min(60vh,340px)] overflow-y-auto overflow-x-hidden p-0.5 no-scrollbar justify-center">
          {leftTrayPieces.map((pieceId) => renderTrayPiece(pieceId))}
          {leftTrayPieces.length === 0 && !isSolved && (
            <div className="text-[10px] text-white/30 text-center py-3 border border-dashed border-white/10 rounded-xl">
              Hết
            </div>
          )}
        </div>

        {/* BÀN CỜ JIGSAW TRUNG TÂM (CHỨA ĐƯỜNG RÃNH RĂNG CƯA NHƯ ẢNH MẪU) */}
        <div
          ref={boardRef}
          className={`relative aspect-square w-[210px] min-[380px]:w-[236px] sm:w-[290px] shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-500 shadow-2xl ${
            isSolved
              ? 'border-[#f6d274] shadow-[0_0_35px_rgba(246,210,116,0.5)] ring-2 ring-[#f6d274]/50'
              : 'border-[#85d4ce]/50 shadow-[0_12px_32px_rgba(0,0,0,0.6)] bg-[#052326]'
          }`}
        >
          <svg
            viewBox={`0 0 ${boardSize} ${boardSize}`}
            className="w-full h-full block"
            style={{ touchAction: 'none' }}
          >
            <defs>
              {/* CLIPPATH CHUẨN RĂNG CƯA CHO TỪNG Ô CỦA BÀN CỜ */}
              {piecePaths.map((pathD, idx) => (
                <clipPath key={`board-slot-clip-${idx}`} id={`board-slot-clip-${idx}`}>
                  <path d={pathD} />
                </clipPath>
              ))}
            </defs>

            {/* BẢNG NỀN VỚI CÁC ĐƯỜNG RÃNH RĂNG CƯA */}
            <rect width={boardSize} height={boardSize} fill="#062629" />

            {/* ẢNH GỢI Ý MẪU NỀN: DÀNH CHO MÀN 3 ẨN TƯỚNG (ĐỂ DỄ SO KHỚP VỚI 9 MẢNH ẨN) */}
            {level === 3 && (
              <g opacity="0.26" className="transition-opacity duration-300">
                {renderCardArtImage(1)}
              </g>
            )}

            {/* Các đường rãnh răng cưa mờ định vị trên bàn cờ */}
            <path
              d={allSeamsPath}
              fill="none"
              stroke="rgba(246, 210, 116, 0.35)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />

            {/* CÁC Ô TRÊN BÀN CỜ */}
            {Array.from({ length: totalPieces }).map((_, slotIndex) => {
              const r = Math.floor(slotIndex / gridSize)
              const c = slotIndex % gridSize
              const placedPieceId = boardSlots[slotIndex]
              const isSlotPlaced = placedPieceId !== null
              const isWrong = wrongSlotIndex === slotIndex
              // ĐÃ BỎ HOÀN TOÀN GỢI Ý Ô ĐÍCH KHI CHỌN MẢNH (ÁP DỤNG MỌI MÀN)
              // Chỉ hiện viền hover khi đang nắm lôi (drag) mảnh lướt qua ô để biết vị trí thả
              const isHoveredByDrag = hoveredSlotIndex === slotIndex

              return (
                <g
                  key={`slot-${slotIndex}`}
                  onClick={() => handleSlotClick(slotIndex)}
                  className={`cursor-pointer transition-opacity ${
                    !isSlotPlaced ? 'hover:opacity-85' : ''
                  }`}
                >
                  {/* Ô CHƯA ĐẶT MẢNH: KHÔNG GỢI Ý TRƯỚC Ô NÀO! */}
                  {!isSlotPlaced && (
                    <path
                      d={piecePaths[slotIndex]}
                      fill={
                        isWrong
                          ? 'rgba(239, 68, 68, 0.35)'
                          : isHoveredByDrag
                          ? 'rgba(246, 210, 116, 0.25)'
                          : 'transparent'
                      }
                      stroke={
                        isWrong
                          ? '#ef4444'
                          : isHoveredByDrag
                          ? '#f6d274'
                          : 'transparent'
                      }
                      strokeWidth={isHoveredByDrag ? 2.5 : 1}
                      className="transition-colors duration-150"
                    />
                  )}

                  {/* Ô ĐÃ ĐẶT MẢNH KHỚP: HIỂN THỊ TRANH DÂN GIAN SẮC NÉT */}
                  {isSlotPlaced && (
                    <g>
                      <g clipPath={`url(#board-slot-clip-${slotIndex})`}>
                        {renderCardArtImage(1)}
                      </g>

                      {/* Viền răng cưa xanh ngọc báo hiệu đã khớp chuẩn */}
                      <path
                        d={piecePaths[slotIndex]}
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="2"
                        className="transition-all duration-300"
                      />

                      {/* Biểu tượng dấu tích nhỏ xác nhận */}
                      {!isSolved && (
                        <g
                          transform={`translate(${c * pieceSize + pieceSize - 16}, ${
                            r * pieceSize + pieceSize - 16
                          })`}
                        >
                          <circle cx="6" cy="6" r="6" fill="#4ade80" />
                          <text
                            x="6"
                            y="8.5"
                            fill="#072d2e"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ✓
                          </text>
                        </g>
                      )}
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {/* LỚP HÀO QUANG KHI HOÀN THÀNH TOÀN BỘ BÀN CỜ */}
          {isSolved && (
            <div className="absolute inset-0 pointer-events-none border-4 border-[#f6d274] rounded-2xl animate-pulse flex flex-col items-center justify-end pb-3 bg-gradient-to-t from-[#072d2e]/90 via-transparent to-transparent">
              <span className="text-sm sm:text-base font-black uppercase tracking-[.25em] text-[#f6d274] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                QUÂN {card.name.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* CỘT KHAY BÊN PHẢI (CHỨA CÁC MẢNH CHỜ GHÉP) */}
        <div className="flex flex-col gap-1.5 shrink-0 w-[50px] min-[390px]:w-[58px] sm:w-[76px] max-h-[min(60vh,340px)] overflow-y-auto overflow-x-hidden p-0.5 no-scrollbar justify-center">
          {rightTrayPieces.map((pieceId) => renderTrayPiece(pieceId))}
          {rightTrayPieces.length === 0 && !isSolved && (
            <div className="text-[10px] text-white/30 text-center py-3 border border-dashed border-white/10 rounded-xl">
              Hết
            </div>
          )}
        </div>
      </div>

      {/* DÒNG LYRIC CÂU HÒ DÂN GIAN THAY THẾ CHO DÒNG GỢI Ý (THEO YÊU CẦU NGƯỜI DÙNG) */}
      <div className="mt-2.5 sm:mt-3 w-full max-w-[440px] mx-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-[#052326]/90 border border-[#f6d274]/40 shadow-[0_4px_16px_rgba(0,0,0,0.5)] backdrop-blur-sm text-center transition-all duration-300">
        <p className="text-[11px] min-[380px]:text-xs sm:text-sm font-semibold text-[#f6d274] tracking-wide flex items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-base animate-pulse shrink-0">🎶</span>
          <span className="italic font-serif leading-snug">
            "{chantLyrics[activeLyricIndex]}"
          </span>
        </p>
      </div>
    </div>
  )
}
