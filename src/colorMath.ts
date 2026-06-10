import type {
  Gradient,
  GradientStop,
  GradientStopIndex,
  HSV,
  HSVA,
  ReactColorPickerGradientType,
  RGB,
} from './types'

export const DEFAULT_COLOR = '#ffffff'
export const DEFAULT_LINEAR_GRADIENT = 'linear-gradient(90deg, #fffdf6 0%, #ffe3e3 100%)'
export const DEFAULT_RADIAL_GRADIENT = 'radial-gradient(circle, #fffdf6 0%, #ffe3e3 100%)'
export const DEFAULT_GRADIENT = DEFAULT_LINEAR_GRADIENT
const DEFAULT_GRADIENT_START_COLOR = '#fffdf6'
const DEFAULT_GRADIENT_END_COLOR = '#ffe3e3'
const DEFAULT_COLOR_GRADIENT_END_COLOR = '#000000'
const DEFAULT_GRADIENT_ANGLE = 90

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function expandHexChannel(channel: string) {
  return `${channel}${channel}`
}

function parseHexColor(value: string): { rgb: RGB; a: number } | null {
  let hex = value.trim()

  if (!hex.startsWith('#')) {
    hex = `#${hex}`
  }

  if (/^#[0-9a-fA-F]{3,4}$/.test(hex)) {
    const r = parseInt(expandHexChannel(hex[1]), 16)
    const g = parseInt(expandHexChannel(hex[2]), 16)
    const b = parseInt(expandHexChannel(hex[3]), 16)
    const a = hex.length === 5 ? (parseInt(expandHexChannel(hex[4]), 16) / 255) * 100 : 100

    return { rgb: { r, g, b }, a }
  }

  if (/^#[0-9a-fA-F]{6,8}$/.test(hex)) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const a = hex.length === 9 ? (parseInt(hex.slice(7, 9), 16) / 255) * 100 : 100

    return { rgb: { r, g, b }, a }
  }

  return null
}

function parseCssRgbColor(value: string): { rgb: RGB; a: number } | null {
  const match = value
    .trim()
    .match(
      /^rgba?\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)(?:\s*,\s*([+-]?\d*\.?\d+%?))?\s*\)$/i
    )

  if (!match) {
    return null
  }

  const [, red, green, blue, alpha] = match

  let a = 100

  if (alpha) {
    a = alpha.endsWith('%') ? Number(alpha.slice(0, -1)) : Number(alpha) * 100
  }

  return {
    rgb: {
      r: Math.round(clamp(Number(red), 0, 255)),
      g: Math.round(clamp(Number(green), 0, 255)),
      b: Math.round(clamp(Number(blue), 0, 255)),
    },
    a: clamp(a, 0, 100),
  }
}

export function parseColorValue(value: string): HSVA | null {
  const parsedColor = parseHexColor(value) ?? parseCssRgbColor(value)

  if (!parsedColor) {
    return null
  }

  return {
    ...rgbToHsv(parsedColor.rgb),
    a: parsedColor.a,
  }
}

export function parseColor(value: string): HSVA {
  return parseColorValue(value) ?? parseColorValue(DEFAULT_COLOR)!
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const red = r / 255
  const green = g / 255
  const blue = b / 255

  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min

  let h = 0

  if (delta !== 0) {
    if (max === red) {
      h = 60 * (((green - blue) / delta) % 6)
    } else if (max === green) {
      h = 60 * ((blue - red) / delta + 2)
    } else {
      h = 60 * ((red - green) / delta + 4)
    }
  }

  if (h < 0) {
    h += 360
  }

  return {
    h,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  }
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const saturation = s / 100
  const value = v / 100

  const chroma = value * saturation
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = value - chroma

  let red = 0
  let green = 0
  let blue = 0

  if (h >= 0 && h < 60) {
    red = chroma
    green = x
  } else if (h >= 60 && h < 120) {
    red = x
    green = chroma
  } else if (h >= 120 && h < 180) {
    green = chroma
    blue = x
  } else if (h >= 180 && h < 240) {
    green = x
    blue = chroma
  } else if (h >= 240 && h < 300) {
    red = x
    blue = chroma
  } else {
    red = chroma
    blue = x
  }

  return {
    r: Math.round((red + m) * 255),
    g: Math.round((green + m) * 255),
    b: Math.round((blue + m) * 255),
  }
}

export function rgbToHex({ r, g, b }: RGB) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

export function hsvToHex(hsv: HSV) {
  return rgbToHex(hsvToRgb(hsv))
}

function formatAlpha(alpha: number) {
  const normalizedAlpha = clamp(alpha, 0, 100) / 100

  if (normalizedAlpha === 0 || normalizedAlpha === 1) {
    return normalizedAlpha
  }

  return Math.max(0.001, Math.floor(normalizedAlpha * 1000) / 1000)
}

export function formatColor(hsva: HSVA) {
  const rgb = hsvToRgb(hsva)

  if (hsva.a >= 100) {
    return rgbToHex(rgb)
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${formatAlpha(hsva.a)})`
}

function formatPercent(value: number) {
  return Number(clamp(value, 0, 100).toFixed(2))
}

function formatGradientStops(gradient: Gradient) {
  const [from, to] = gradient.stops

  return `${formatColor(from.color)} ${formatPercent(
    from.position
  )}%, ${formatColor(to.color)} ${formatPercent(to.position)}%`
}

export function formatGradient(gradient: Gradient) {
  const stops = formatGradientStops(gradient)

  if (gradient.type === 'radial') {
    return `radial-gradient(circle, ${stops})`
  }

  return `linear-gradient(${gradient.angle}deg, ${stops})`
}

export function getDefaultGradientValue(type: ReactColorPickerGradientType) {
  return type === 'radial' ? DEFAULT_RADIAL_GRADIENT : DEFAULT_LINEAR_GRADIENT
}

function splitByTopLevelCommas(value: string) {
  const parts: string[] = []
  let current = ''
  let depth = 0

  for (const character of value) {
    if (character === '(') {
      depth += 1
    }

    if (character === ')') {
      depth -= 1
    }

    if (character === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts
}

function parseGradientAngle(value: string) {
  const angle = value.trim().match(/^([+-]?\d*\.?\d+)deg$/i)

  if (angle) {
    return clamp(Number(angle[1]), 0, 360)
  }

  const direction = value.trim().toLowerCase()

  if (direction === 'to right') return 90
  if (direction === 'to bottom') return 180
  if (direction === 'to left') return 270
  if (direction === 'to top') return 0

  return null
}

function parseGradientStop(value: string, fallbackPosition: number): GradientStop | null {
  const positionMatch = value.match(/\s+([+-]?\d*\.?\d+)%\s*$/)
  const position = positionMatch ? Number(positionMatch[1]) : fallbackPosition
  const colorValue = positionMatch ? value.slice(0, positionMatch.index).trim() : value.trim()
  const color = parseColorValue(colorValue)

  if (!color) {
    return null
  }

  return {
    color,
    position: clamp(position, 0, 100),
  }
}

function createDefaultGradient(type: ReactColorPickerGradientType = 'linear'): Gradient {
  return {
    type,
    angle: DEFAULT_GRADIENT_ANGLE,
    stops: [
      { color: parseColor(DEFAULT_GRADIENT_START_COLOR), position: 0 },
      { color: parseColor(DEFAULT_GRADIENT_END_COLOR), position: 100 },
    ],
  }
}

function createGradientFromColor(
  value: string,
  type: ReactColorPickerGradientType = 'linear'
): Gradient {
  return {
    type,
    angle: DEFAULT_GRADIENT_ANGLE,
    stops: [
      { color: parseColor(value), position: 0 },
      { color: parseColor(DEFAULT_COLOR_GRADIENT_END_COLOR), position: 100 },
    ],
  }
}

function parseGradientParts(parts: string[], type: ReactColorPickerGradientType): Gradient {
  if (parts.length < 2) {
    return createDefaultGradient(type)
  }

  const parsedAngle = type === 'linear' ? parseGradientAngle(parts[0]) : null
  const firstPartIsStop = type === 'radial' ? parseGradientStop(parts[0], 0) !== null : false
  const stopParts =
    type === 'linear'
      ? parsedAngle === null
        ? parts
        : parts.slice(1)
      : firstPartIsStop
        ? parts
        : parts.slice(1)

  if (stopParts.length < 2) {
    return createDefaultGradient(type)
  }

  const firstStop = parseGradientStop(stopParts[0], 0)
  const secondStop = parseGradientStop(stopParts[1], 100)

  if (!firstStop || !secondStop) {
    return createDefaultGradient(type)
  }

  return {
    type,
    angle: parsedAngle ?? DEFAULT_GRADIENT_ANGLE,
    stops: [firstStop, secondStop],
  }
}

export function parseGradient(
  value: string,
  fallbackType: ReactColorPickerGradientType = 'linear'
): Gradient {
  const trimmedValue = value.trim()
  const linearGradientMatch = trimmedValue.match(/^linear-gradient\((.*)\)$/i)

  if (linearGradientMatch) {
    return parseGradientParts(splitByTopLevelCommas(linearGradientMatch[1]), 'linear')
  }

  const radialGradientMatch = trimmedValue.match(/^radial-gradient\((.*)\)$/i)

  if (radialGradientMatch) {
    return parseGradientParts(splitByTopLevelCommas(radialGradientMatch[1]), 'radial')
  }

  return createGradientFromColor(value, fallbackType)
}

export function preserveHue(nextHsva: HSVA, currentHsva: HSVA) {
  return {
    h: nextHsva.s === 0 || nextHsva.v === 0 ? currentHsva.h : nextHsva.h,
    s: nextHsva.s,
    v: nextHsva.v,
    a: nextHsva.a,
  }
}

export function updateGradientStopColor(
  gradient: Gradient,
  selectedGradientStop: GradientStopIndex,
  color: HSVA
): Gradient {
  return {
    ...gradient,
    stops: gradient.stops.map((stop, index) =>
      index === selectedGradientStop ? { ...stop, color } : stop
    ) as [GradientStop, GradientStop],
  }
}

export function updateGradientStopPosition(
  gradient: Gradient,
  selectedGradientStop: GradientStopIndex,
  position: number
): Gradient {
  const min = selectedGradientStop === 0 ? 0 : gradient.stops[0].position
  const max = selectedGradientStop === 0 ? gradient.stops[1].position : 100
  const clampedPosition = clamp(position, min, max)

  return {
    ...gradient,
    stops: gradient.stops.map((stop, index) =>
      index === selectedGradientStop ? { ...stop, position: clampedPosition } : stop
    ) as [GradientStop, GradientStop],
  }
}
