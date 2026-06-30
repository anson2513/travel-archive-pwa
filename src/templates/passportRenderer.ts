import { WEATHER_OPTIONS } from '../data'
import type { ArchiveEntry } from '../types'

export interface RenderOptions {
  scale?: number
  showSafeZone?: boolean
}

const W = 1080
const H = 1920
const INSET = 24
const STUB_Y = 1570
const IVORY = '#d8c7ae'
const RED = '#a43e35'
const BLUE = '#58789a'
const NAVY = '#071725'
const DISPLAY_FONT = '"Cormorant Garamond", Georgia, serif'
const SANS_FONT = '"IBM Plex Sans Condensed", Arial, sans-serif'
const MONO_FONT = '"Space Mono", "Courier New", monospace'

function upper(value: string, fallback: string) {
  return (value.trim() || fallback).toUpperCase()
}

function drawTrackedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  let cursor = x
  for (const char of text) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + tracking
  }
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, minSize: number, font: string) {
  let size = startSize
  while (size > minSize) {
    ctx.font = `${size}px ${font}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }
  return size
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const paragraphs = text.split(/\n+/).filter(Boolean)
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/)
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (ctx.measureText(candidate).width > maxWidth && current) {
        lines.push(current)
        current = word
      } else current = candidate
      if (lines.length >= maxLines) return lines
    }
    if (current) lines.push(current)
    if (lines.length >= maxLines) return lines.slice(0, maxLines)
  }
  return lines
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  focusX: number,
  focusY: number,
) {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight)
  const sourceWidth = width / ratio
  const sourceHeight = height / ratio
  const sourceX = Math.max(0, Math.min(image.naturalWidth - sourceWidth, (image.naturalWidth - sourceWidth) * focusX))
  const sourceY = Math.max(0, Math.min(image.naturalHeight - sourceHeight, (image.naturalHeight - sourceHeight) * focusY))
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}

function drawContain(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight)
  const drawWidth = image.naturalWidth * ratio
  const drawHeight = image.naturalHeight * ratio
  ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight)
}

function dateForStamp(value: string) {
  if (!value) return 'DATE'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
}

function ticketPath() {
  const path = new Path2D()
  path.roundRect(INSET, INSET, W - INSET * 2, H - INSET * 2, 34)
  path.moveTo(INSET + 38, STUB_Y)
  path.arc(INSET, STUB_Y, 38, 0, Math.PI * 2)
  path.closePath()
  path.moveTo(W - INSET + 38, STUB_Y)
  path.arc(W - INSET, STUB_Y, 38, 0, Math.PI * 2)
  path.closePath()
  return path
}

function drawTexture(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.globalAlpha = 0.1
  ctx.strokeStyle = '#c3a77a'
  ctx.lineWidth = 1
  for (let y = 50; y < H; y += 44) {
    ctx.beginPath()
    for (let x = -40; x < W + 40; x += 12) {
      const py = y + Math.sin((x + y) * 0.018) * 11
      if (x === -40) ctx.moveTo(x, py)
      else ctx.lineTo(x, py)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 0.045
  for (let i = 0; i < 260; i += 1) {
    const x = (i * 83) % W
    const y = (i * 149) % H
    ctx.fillStyle = i % 2 ? '#fff' : '#000'
    ctx.fillRect(x, y, 1.5, 1.5)
  }
  ctx.restore()
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
  gradient.addColorStop(0, '#263544')
  gradient.addColorStop(1, '#101923')
  ctx.fillStyle = gradient
  ctx.fillRect(x, y, width, height)
  ctx.strokeStyle = 'rgba(216,199,174,.28)'
  ctx.lineWidth = 2
  for (let offset = -height; offset < width; offset += 64) {
    ctx.beginPath()
    ctx.moveTo(x + offset, y)
    ctx.lineTo(x + offset + height, y + height)
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(216,199,174,.72)'
  ctx.textAlign = 'center'
  ctx.font = `600 22px ${SANS_FONT}`
  drawTrackedText(ctx, 'SELECT A PHOTO', x + width / 2 - 105, y + height / 2, 4)
  ctx.textAlign = 'left'
}

function drawHeader(ctx: CanvasRenderingContext2D, entry: ArchiveEntry, landscape: boolean) {
  ctx.fillStyle = IVORY
  ctx.font = `500 17px ${SANS_FONT}`
  drawTrackedText(ctx, 'TRAVEL ARCHIVE COLLECTION', 68, 78, 5)
  ctx.strokeStyle = 'rgba(216,199,174,.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(68, 108)
  ctx.lineTo(650, 108)
  ctx.stroke()

  ctx.fillStyle = RED
  ctx.font = `600 18px ${SANS_FONT}`
  drawTrackedText(ctx, `No.${String(entry.archiveNo).padStart(3, '0')}`, 895, 78, 3)
  ctx.fillStyle = IVORY
  ctx.font = `500 15px ${SANS_FONT}`
  drawTrackedText(ctx, 'PASSPORT EDITION', 785, 116, 4)

  const city = upper(entry.cityEn, 'CITY')
  const citySize = fitText(ctx, city, 635, landscape ? 110 : 120, 62, DISPLAY_FONT)
  ctx.font = `600 ${citySize}px ${DISPLAY_FONT}`
  ctx.fillStyle = IVORY
  ctx.fillText(city, 64, landscape ? 225 : 235)
  ctx.font = `500 25px ${SANS_FONT}`
  drawTrackedText(ctx, 'CITY ARCHIVE', 68, landscape ? 270 : 282, 8)
  if (landscape) {
    ctx.strokeStyle = 'rgba(216,199,174,.65)'
    ctx.strokeRect(68, 294, 260, 40)
    ctx.font = `600 13px ${SANS_FONT}`
    drawTrackedText(ctx, 'LANDSCAPE ARCHIVE', 88, 320, 3)
  }
}

function drawArrivalStamp(ctx: CanvasRenderingContext2D, entry: ArchiveEntry, x: number, y: number, radius: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.08)
  ctx.strokeStyle = RED
  ctx.fillStyle = RED
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(0, 0, radius - 11, 0, Math.PI * 2)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.font = `600 ${Math.max(12, radius * 0.16)}px ${SANS_FONT}`
  ctx.fillText('IMMIGRATION', 0, -radius * 0.45)
  ctx.font = `600 ${Math.max(14, radius * 0.18)}px ${SANS_FONT}`
  ctx.fillText(dateForStamp(entry.arrivalDate), 0, -3)
  ctx.fillText('ARRIVED', 0, radius * 0.28)
  ctx.fillText(upper(entry.countryEn, 'COUNTRY'), 0, radius * 0.55)
  ctx.restore()
}

function drawDepartureStamp(ctx: CanvasRenderingContext2D, entry: ArchiveEntry, x: number, y: number, size: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-0.09)
  ctx.strokeStyle = BLUE
  ctx.fillStyle = BLUE
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let i = 0; i < 8; i += 1) {
    const angle = Math.PI / 8 + i * Math.PI / 4
    const px = Math.cos(angle) * size
    const py = Math.sin(angle) * size
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.font = `600 19px ${DISPLAY_FONT}`
  ctx.fillText(upper(entry.cityEn, 'CITY'), 0, -39)
  ctx.font = `600 12px ${SANS_FONT}`
  ctx.fillText(upper(entry.countryEn, 'COUNTRY'), 0, -11)
  ctx.beginPath()
  ctx.moveTo(-size * 0.68, 7)
  ctx.lineTo(size * 0.68, 7)
  ctx.stroke()
  ctx.font = `600 14px ${SANS_FONT}`
  ctx.fillText(dateForStamp(entry.departureDate), 0, 36)
  ctx.fillText('DEPARTED', 0, 64)
  ctx.restore()
}

function drawMetaField(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, width: number) {
  ctx.fillStyle = RED
  ctx.font = `600 13px ${SANS_FONT}`
  drawTrackedText(ctx, label, x, y, 2.5)
  ctx.fillStyle = IVORY
  const size = fitText(ctx, value || '—', width, 22, 15, DISPLAY_FONT)
  ctx.font = `500 ${size}px ${DISPLAY_FONT}`
  ctx.fillText(value || '—', x, y + 39)
  ctx.strokeStyle = 'rgba(216,199,174,.45)'
  ctx.setLineDash([4, 5])
  ctx.beginPath()
  ctx.moveTo(x, y + 66)
  ctx.lineTo(x + width, y + 66)
  ctx.stroke()
  ctx.setLineDash([])
}

function drawPortraitContent(ctx: CanvasRenderingContext2D, entry: ArchiveEntry, image: HTMLImageElement | null) {
  const photoX = INSET
  const photoY = 320
  const photoW = 770
  const photoH = STUB_Y - photoY
  ctx.save()
  ctx.beginPath()
  ctx.rect(photoX, photoY, photoW, photoH)
  ctx.clip()
  if (image) drawCover(ctx, image, photoX, photoY, photoW, photoH, entry.focusX, entry.focusY)
  else drawPlaceholder(ctx, photoX, photoY, photoW, photoH)
  ctx.restore()
  const shade = ctx.createLinearGradient(760, 0, W - INSET, 0)
  shade.addColorStop(0, 'rgba(7,23,37,.72)')
  shade.addColorStop(1, 'rgba(7,23,37,.98)')
  ctx.fillStyle = shade
  ctx.fillRect(770, photoY, W - INSET - 770, photoH)

  drawArrivalStamp(ctx, entry, 128, 445, 108)
  drawMetaField(ctx, 'LOCATION', entry.locationEn || 'Location', 830, 422, 184)
  drawMetaField(ctx, 'DATE', entry.date.replaceAll('-', '.'), 830, 582, 184)
  drawMetaField(ctx, 'TIME', entry.time, 830, 742, 184)
  const weather = WEATHER_OPTIONS.find(item => item.code === entry.weatherCode)
  drawMetaField(ctx, 'WEATHER', `${entry.temperature || '—'}°C`, 830, 902, 184)
  ctx.fillStyle = IVORY
  ctx.font = '36px "Segoe UI Symbol", sans-serif'
  ctx.fillText(weather?.symbol ?? '☀', 970, 948)
  drawMetaField(ctx, 'CAMERA', entry.camera || 'Camera', 830, 1062, 184)
  drawDepartureStamp(ctx, entry, 908, 1373, 93)
}

function drawLandscapeContent(ctx: CanvasRenderingContext2D, entry: ArchiveEntry, image: HTMLImageElement | null) {
  const zoneY = 350
  const zoneH = STUB_Y - zoneY
  if (image) {
    ctx.save()
    ctx.filter = 'blur(26px) brightness(0.42) saturate(0.7)'
    drawCover(ctx, image, -18, zoneY - 20, W + 36, zoneH + 40, 0.5, 0.5)
    ctx.restore()
  } else drawPlaceholder(ctx, INSET, zoneY, W - INSET * 2, zoneH)

  ctx.fillStyle = 'rgba(7,23,37,.36)'
  ctx.fillRect(INSET, zoneY, W - INSET * 2, 190)
  const metaY = 407
  const fields = [
    ['LOCATION', entry.locationEn || 'Location', 70, 235],
    ['DATE', entry.date.replaceAll('-', '.'), 330, 145],
    ['TIME', entry.time, 500, 110],
    ['WEATHER', `${entry.temperature || '—'}°C`, 635, 125],
    ['CAMERA', entry.camera || 'Camera', 785, 225],
  ] as const
  for (const [label, value, x, width] of fields) {
    ctx.fillStyle = RED
    ctx.font = `600 12px ${SANS_FONT}`
    drawTrackedText(ctx, label, x, metaY, 2)
    ctx.fillStyle = IVORY
    const size = fitText(ctx, value, width, 18, 13, DISPLAY_FONT)
    ctx.font = `500 ${size}px ${DISPLAY_FONT}`
    ctx.fillText(value, x, metaY + 39)
  }

  const frameX = INSET
  const frameW = W - INSET * 2
  const frameH = frameW * 9 / 16
  const frameY = 545
  ctx.fillStyle = '#09121a'
  ctx.fillRect(frameX, frameY, frameW, frameH)
  if (image) drawContain(ctx, image, frameX, frameY, frameW, frameH)
  else drawPlaceholder(ctx, frameX, frameY, frameW, frameH)
  ctx.strokeStyle = 'rgba(216,199,174,.45)'
  ctx.strokeRect(frameX, frameY, frameW, frameH)
  drawArrivalStamp(ctx, entry, 125, 575, 104)
  drawDepartureStamp(ctx, entry, 900, 1368, 93)
}

function hashCode(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function drawBarcode(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = IVORY
  const hash = hashCode(value)
  let cursor = x
  let i = 0
  while (cursor < x + width) {
    const bar = 2 + ((hash >> (i % 24)) & 3)
    if (i % 3 !== 1) ctx.fillRect(cursor, y, bar, height)
    cursor += bar + 2
    i += 1
  }
}

function drawStub(ctx: CanvasRenderingContext2D, entry: ArchiveEntry) {
  ctx.strokeStyle = 'rgba(216,199,174,.85)'
  ctx.lineWidth = 2
  ctx.setLineDash([9, 8])
  ctx.beginPath()
  ctx.moveTo(INSET + 40, STUB_Y)
  ctx.lineTo(W - INSET - 40, STUB_Y)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = 'rgba(216,199,174,.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(INSET, STUB_Y, 38, -Math.PI / 2, Math.PI / 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(W - INSET, STUB_Y, 38, Math.PI / 2, Math.PI * 1.5)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(216,199,174,.3)'
  ctx.beginPath()
  ctx.moveTo(385, STUB_Y + 42)
  ctx.lineTo(385, 1810)
  ctx.moveTo(845, STUB_Y + 42)
  ctx.lineTo(845, 1810)
  ctx.stroke()

  ctx.fillStyle = RED
  ctx.font = `600 25px ${SANS_FONT}`
  const route = `${upper(entry.origin, 'ORG')}  ▸  ${upper(entry.destination, 'DST')}`
  ctx.fillText(route, 140, 1637)
  ctx.fillStyle = IVORY
  ctx.font = `600 30px ${DISPLAY_FONT}`
  ctx.fillText(upper(entry.flight, 'FLIGHT'), 140, 1678)
  ctx.fillStyle = RED
  ctx.font = `600 13px ${SANS_FONT}`
  drawTrackedText(ctx, 'SEAT', 60, 1748, 3)
  ctx.fillStyle = IVORY
  ctx.font = `600 30px ${DISPLAY_FONT}`
  ctx.fillText(upper(entry.seat, '—'), 140, 1750)
  ctx.strokeStyle = 'rgba(216,199,174,.35)'
  ctx.strokeRect(62, 1608, 55, 55)
  ctx.font = `28px ${SANS_FONT}`
  ctx.fillText('✈', 75, 1646)

  ctx.fillStyle = RED
  ctx.font = `600 15px ${SANS_FONT}`
  drawTrackedText(ctx, 'TRAVEL MEMORIES', 445, 1638, 3)
  ctx.fillStyle = IVORY
  ctx.font = `22px ${MONO_FONT}`
  const memory = entry.memoryEn || 'Collect moments,\nnot things.'
  const lines = wrapText(ctx, memory, 350, 4)
  lines.forEach((line, index) => ctx.fillText(line, 445, 1692 + index * 37))

  const barcodeValue = `${upper(entry.cityEn, 'ARCHIVE')}-${entry.date.slice(0, 4)}-${String(entry.archiveNo).padStart(3, '0')}`
  drawBarcode(ctx, barcodeValue, 895, 1615, 74, 170)
  ctx.save()
  ctx.translate(995, 1785)
  ctx.rotate(-Math.PI / 2)
  ctx.font = `600 11px ${SANS_FONT}`
  drawTrackedText(ctx, barcodeValue, 0, 0, 2)
  ctx.restore()

  ctx.strokeStyle = 'rgba(216,199,174,.35)'
  ctx.beginPath()
  ctx.moveTo(60, 1828)
  ctx.lineTo(1020, 1828)
  ctx.stroke()
  ctx.fillStyle = IVORY
  ctx.font = `500 14px ${SANS_FONT}`
  drawTrackedText(ctx, 'KEEP THIS MOMENT', 427, 1870, 4)
  ctx.fillStyle = 'rgba(216,199,174,.7)'
  ctx.font = `18px ${SANS_FONT}`
  ctx.fillText('‹ ‹ ‹ ‹ ‹ ‹ ‹', 62, 1872)
  ctx.fillText('› › › › › › ›', 880, 1872)
}

function drawSafeZone(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.fillStyle = 'rgba(164,62,53,.1)'
  ctx.fillRect(0, 0, W, 250)
  ctx.fillRect(0, H - 250, W, 250)
  ctx.strokeStyle = 'rgba(239,126,113,.85)'
  ctx.setLineDash([10, 8])
  ctx.strokeRect(18, 250, W - 36, H - 500)
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(255,220,210,.9)'
  ctx.font = `600 13px ${SANS_FONT}`
  ctx.fillText('INSTAGRAM 安全區', 38, 278)
  ctx.restore()
}

export function resolvePhotoMode(entry: ArchiveEntry, image: HTMLImageElement | null) {
  if (entry.photoMode !== 'auto') return entry.photoMode
  if (!image) return 'portrait'
  return image.naturalWidth / image.naturalHeight > 1.18 ? 'landscape' : 'portrait'
}

export function renderPassport(
  canvas: HTMLCanvasElement,
  entry: ArchiveEntry,
  image: HTMLImageElement | null,
  options: RenderOptions = {},
) {
  const scale = options.scale ?? 1
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.fillStyle = '#171615'
  ctx.fillRect(0, 0, W, H)
  const outer = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100)
  outer.addColorStop(0, '#24211f')
  outer.addColorStop(1, '#11100f')
  ctx.fillStyle = outer
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,.72)'
  ctx.shadowBlur = 28
  ctx.shadowOffsetY = 12
  ctx.fillStyle = NAVY
  ctx.beginPath()
  ctx.roundRect(INSET, INSET, W - INSET * 2, H - INSET * 2, 34)
  ctx.fill()
  ctx.restore()

  const path = ticketPath()
  ctx.fillStyle = NAVY
  ctx.fill(path, 'evenodd')
  ctx.save()
  ctx.clip(path, 'evenodd')
  drawTexture(ctx)
  const landscape = resolvePhotoMode(entry, image) === 'landscape'
  drawHeader(ctx, entry, landscape)
  if (landscape) drawLandscapeContent(ctx, entry, image)
  else drawPortraitContent(ctx, entry, image)
  drawStub(ctx, entry)
  ctx.restore()

  if (options.showSafeZone) drawSafeZone(ctx)
}
