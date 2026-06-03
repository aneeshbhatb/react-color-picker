import type { CSSProperties } from 'react'

import { useEffect, useId, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, PointerEvent } from 'react'
import css from './ReactColorPicker.module.css'

export type ReactColorPickerActiveMode = 'solid' | 'gradient'
export type ReactColorPickerMode = ReactColorPickerActiveMode | 'both'

export type ReactColorPickerClassNames = {
  root?: string
  modeToggle?: string
  modeOption?: string
  modeOptionActive?: string
  modeInput?: string
  gradient?: string
  gradientStop?: string
  gradientStopActive?: string
  saturation?: string
  saturationPointer?: string
  hue?: string
  huePointer?: string
  alpha?: string
  alphaPointer?: string
  eyedrop?: string
  eyedropIcon?: string
  controls?: string
}

export type ReactColorPickerStyles = {
  root?: CSSProperties
  modeToggle?: CSSProperties
  modeOption?: CSSProperties
  modeOptionActive?: CSSProperties
  modeInput?: CSSProperties
  gradient?: CSSProperties
  gradientStop?: CSSProperties
  gradientStopActive?: CSSProperties
  saturation?: CSSProperties
  saturationPointer?: CSSProperties
  hue?: CSSProperties
  huePointer?: CSSProperties
  alpha?: CSSProperties
  alphaPointer?: CSSProperties
  eyedrop?: CSSProperties
  eyedropIcon?: CSSProperties
  controls?: CSSProperties
}

export type ReactColorPickerProps = {
  /** The current color. Accepts hex (`#f00`, `#ff0000ff`), `rgb()`/`rgba()`, or a `linear-gradient(...)` string. Invalid values fall back to `#ffffff`. */
  value?: string
  /** Called whenever the color changes. Emits a hex string when fully opaque, `rgba()` when the alpha is below 100%, or a `linear-gradient(...)` string in gradient mode. */
  onChange?: (color: string) => void
  /** Which modes are available. `'both'` shows the switcher; `'solid'`/`'gradient'` locks to a single mode. */
  mode?: ReactColorPickerMode
  /** Initial active mode when uncontrolled and `mode` is `'both'`. */
  defaultMode?: ReactColorPickerActiveMode
  /** Controlled active mode. When provided, the parent owns the value (pair with `onModeChange`). */
  activeMode?: ReactColorPickerActiveMode
  /** Called when the active mode changes, from the built-in switcher or an internal switch. Wire to your state setter to keep a controlled `activeMode` in sync. */
  onModeChange?: (mode: ReactColorPickerActiveMode) => void
  /** Custom class names for individual parts of the picker. See `ReactColorPickerClassNames` for the available slots. */
  classNames?: ReactColorPickerClassNames
  /** Inline style overrides for individual parts of the picker. See `ReactColorPickerStyles` for the available slots. */
  styles?: ReactColorPickerStyles
  /** Hides the eyedropper button. */
  hideEyedrop?: boolean
  /** Hides the alpha/opacity slider. */
  hideOpacityControl?: boolean
  /** Hides the built-in solid/gradient switcher (e.g. when supplying your own). */
  hideModeSwitcher?: boolean
}

const DEFAULT_COLOR = '#ffffff'
const DEFAULT_GRADIENT_END_COLOR = '#000000'
const DEFAULT_GRADIENT_ANGLE = 90

type RGB = {
  r: number
  g: number
  b: number
}

type HSV = {
  h: number
  s: number
  v: number
}

type HSVA = HSV & {
  a: number
}

type GradientStopIndex = 0 | 1

type GradientStop = {
  color: HSVA
  position: number
}

type LinearGradient = {
  angle: number
  stops: [GradientStop, GradientStop]
}

type EyeDropperConstructor = new () => {
  open: () => Promise<{ sRGBHex: string }>
}

type WindowWithEyeDropper = Window & {
  EyeDropper?: EyeDropperConstructor
}

function cx(...classNames: Array<string | undefined | null | false>) {
  return classNames.filter(Boolean).join(' ')
}

function clamp(value: number, min: number, max: number) {
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

function parseColorValue(value: string): HSVA | null {
  const parsedColor = parseHexColor(value) ?? parseCssRgbColor(value)

  if (!parsedColor) {
    return null
  }

  return {
    ...rgbToHsv(parsedColor.rgb),
    a: parsedColor.a,
  }
}

function parseColor(value: string): HSVA {
  return parseColorValue(value) ?? parseColorValue(DEFAULT_COLOR)!
}

function rgbToHsv({ r, g, b }: RGB): HSV {
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

function hsvToRgb({ h, s, v }: HSV): RGB {
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

function rgbToHex({ r, g, b }: RGB) {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

function hsvToHex(hsv: HSV) {
  return rgbToHex(hsvToRgb(hsv))
}

function formatAlpha(alpha: number) {
  const normalizedAlpha = clamp(alpha, 0, 100) / 100

  if (normalizedAlpha === 0 || normalizedAlpha === 1) {
    return normalizedAlpha
  }

  return Math.max(0.001, Math.floor(normalizedAlpha * 1000) / 1000)
}

function formatColor(hsva: HSVA) {
  const rgb = hsvToRgb(hsva)

  if (hsva.a >= 100) {
    return rgbToHex(rgb)
  }

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${formatAlpha(hsva.a)})`
}

function formatPercent(value: number) {
  return Number(clamp(value, 0, 100).toFixed(2))
}

function formatLinearGradient(gradient: LinearGradient) {
  const [from, to] = gradient.stops

  return `linear-gradient(${gradient.angle}deg, ${formatColor(from.color)} ${formatPercent(
    from.position
  )}%, ${formatColor(to.color)} ${formatPercent(to.position)}%)`
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

function createDefaultGradient(): LinearGradient {
  return {
    angle: DEFAULT_GRADIENT_ANGLE,
    stops: [
      { color: parseColor(DEFAULT_COLOR), position: 0 },
      { color: parseColor(DEFAULT_GRADIENT_END_COLOR), position: 100 },
    ],
  }
}

function createGradientFromColor(value: string): LinearGradient {
  return {
    angle: DEFAULT_GRADIENT_ANGLE,
    stops: [
      { color: parseColor(value), position: 0 },
      { color: parseColor(DEFAULT_GRADIENT_END_COLOR), position: 100 },
    ],
  }
}

function parseLinearGradient(value: string): LinearGradient {
  const gradientMatch = value.trim().match(/^linear-gradient\((.*)\)$/i)

  if (!gradientMatch) {
    return createGradientFromColor(value)
  }

  const parts = splitByTopLevelCommas(gradientMatch[1])

  if (parts.length < 2) {
    return createDefaultGradient()
  }

  const parsedAngle = parseGradientAngle(parts[0])
  const stopParts = parsedAngle === null ? parts : parts.slice(1)

  if (stopParts.length < 2) {
    return createDefaultGradient()
  }

  const firstStop = parseGradientStop(stopParts[0], 0)
  const secondStop = parseGradientStop(stopParts[1], 100)

  if (!firstStop || !secondStop) {
    return createDefaultGradient()
  }

  return {
    angle: parsedAngle ?? DEFAULT_GRADIENT_ANGLE,
    stops: [firstStop, secondStop],
  }
}

function preserveHue(nextHsva: HSVA, currentHsva: HSVA) {
  return {
    h: nextHsva.s === 0 || nextHsva.v === 0 ? currentHsva.h : nextHsva.h,
    s: nextHsva.s,
    v: nextHsva.v,
    a: nextHsva.a,
  }
}

function updateGradientStopColor(
  gradient: LinearGradient,
  selectedGradientStop: GradientStopIndex,
  color: HSVA
): LinearGradient {
  return {
    ...gradient,
    stops: gradient.stops.map((stop, index) =>
      index === selectedGradientStop ? { ...stop, color } : stop
    ) as [GradientStop, GradientStop],
  }
}

function updateGradientStopPosition(
  gradient: LinearGradient,
  selectedGradientStop: GradientStopIndex,
  position: number
): LinearGradient {
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

export function ReactColorPicker({
  value = DEFAULT_COLOR,
  onChange,
  mode = 'both',
  defaultMode = 'solid',
  activeMode: controlledActiveMode,
  onModeChange,
  classNames,
  styles,
  hideEyedrop = false,
  hideOpacityControl = false,
  hideModeSwitcher = false,
}: ReactColorPickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const gradientRef = useRef<HTMLDivElement>(null)
  const draggingGradientStopRef = useRef<GradientStopIndex | null>(null)
  const lastEmittedValueRef = useRef<string | null>(null)
  const modeInputName = useId()

  const [internalActiveMode, setInternalActiveMode] = useState<ReactColorPickerActiveMode>(() =>
    mode === 'both' ? defaultMode : mode
  )
  const [hsva, setHsva] = useState<HSVA>(() => parseColor(value))
  const [gradient, setGradient] = useState<LinearGradient>(() => parseLinearGradient(value))
  const [selectedGradientStop, setSelectedGradientStop] = useState<GradientStopIndex>(0)

  // Locked mode wins; otherwise a provided `activeMode` makes the picker controlled.
  const activeMode: ReactColorPickerActiveMode =
    mode !== 'both' ? mode : (controlledActiveMode ?? internalActiveMode)
  const shouldShowModeToggle = mode === 'both' && !hideModeSwitcher

  useEffect(() => {
    if (activeMode === 'gradient') {
      const nextGradient = parseLinearGradient(value)
      const nextFormattedGradient = formatLinearGradient(nextGradient)

      if (lastEmittedValueRef.current === nextFormattedGradient) {
        return
      }

      setGradient((currentGradient) => ({
        angle: nextGradient.angle,
        stops: [
          {
            position: nextGradient.stops[0].position,
            color: preserveHue(nextGradient.stops[0].color, currentGradient.stops[0].color),
          },
          {
            position: nextGradient.stops[1].position,
            color: preserveHue(nextGradient.stops[1].color, currentGradient.stops[1].color),
          },
        ],
      }))

      return
    }

    const nextColor = parseColor(value)
    const nextFormattedColor = formatColor(nextColor)

    if (lastEmittedValueRef.current === nextFormattedColor) {
      return
    }

    setHsva((currentHsva) => preserveHue(nextColor, currentHsva))
  }, [activeMode, value])

  // Carries the color across a mode switch and emits the value in the new
  // format. Declared after the value-sync effect above so its direct state
  // writes take precedence when both run in the same commit.
  function applyModeTransition(nextMode: ReactColorPickerActiveMode) {
    if (nextMode === 'gradient') {
      const nextGradient = {
        ...gradient,
        stops: [
          {
            ...gradient.stops[0],
            color: hsva,
          },
          gradient.stops[1],
        ],
      } satisfies LinearGradient
      const nextValue = formatLinearGradient(nextGradient)

      setGradient(nextGradient)
      setSelectedGradientStop(0)
      lastEmittedValueRef.current = nextValue
      onChange?.(nextValue)
      return
    }

    const nextColor = formatColor(gradient.stops[selectedGradientStop].color)

    setHsva(gradient.stops[selectedGradientStop].color)
    lastEmittedValueRef.current = nextColor
    onChange?.(nextColor)
  }

  // Runs the transition whenever the active mode changes from any source —
  // the built-in switcher, a controlled `activeMode`, or a custom switcher.
  // Skips the initial mount so no spurious onChange fires.
  const appliedModeRef = useRef(activeMode)
  useEffect(() => {
    if (appliedModeRef.current === activeMode) {
      return
    }
    appliedModeRef.current = activeMode
    applyModeTransition(activeMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode])

  const activeHsva = activeMode === 'gradient' ? gradient.stops[selectedGradientStop].color : hsva
  const rgb = hsvToRgb(activeHsva)
  const color = formatColor(activeHsva)
  const solidColor = rgbToHex(rgb)
  const hueColor = hsvToHex({ h: activeHsva.h, s: 100, v: 100 })
  const gradientValue = formatLinearGradient(gradient)
  const alphaGradient = `
    linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgb(${rgb.r}, ${rgb.g}, ${rgb.b})),
    repeating-conic-gradient(#fff 0% 25%, #c9c9c9 0% 50%) 50% / 12px 12px
  `

  function emitGradient(nextGradient: LinearGradient) {
    const nextValue = formatLinearGradient(nextGradient)

    setGradient(nextGradient)
    lastEmittedValueRef.current = nextValue
    onChange?.(nextValue)
  }

  function updateColor(nextHsva: HSVA) {
    const clampedHsva = {
      h: clamp(nextHsva.h, 0, 359),
      s: clamp(nextHsva.s, 0, 100),
      v: clamp(nextHsva.v, 0, 100),
      a: clamp(nextHsva.a, 0, 100),
    }

    if (activeMode === 'gradient') {
      emitGradient(updateGradientStopColor(gradient, selectedGradientStop, clampedHsva))
      return
    }

    const nextColor = formatColor(clampedHsva)

    setHsva(clampedHsva)
    lastEmittedValueRef.current = nextColor
    onChange?.(nextColor)
  }

  function getGradientPosition(clientX: number) {
    const rect = gradientRef.current?.getBoundingClientRect()

    if (!rect || rect.width === 0) {
      return null
    }

    return clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
  }

  function getNearestGradientStop(position: number): GradientStopIndex {
    const firstDistance = Math.abs(position - gradient.stops[0].position)
    const secondDistance = Math.abs(position - gradient.stops[1].position)

    return firstDistance <= secondDistance ? 0 : 1
  }

  function moveGradientStop(stopIndex: GradientStopIndex, position: number) {
    emitGradient(updateGradientStopPosition(gradient, stopIndex, position))
  }

  function updateSaturation(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1)

    updateColor({
      h: activeHsva.h,
      s: x * 100,
      v: 100 - y * 100,
      a: activeHsva.a,
    })
  }

  function updateHue(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)

    updateColor({
      h: x * 359,
      s: activeHsva.s,
      v: activeHsva.v,
      a: activeHsva.a,
    })
  }

  function updateAlpha(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)

    updateColor({
      ...activeHsva,
      a: x * 100,
    })
  }

  function handleGradientPointerDown(event: PointerEvent<HTMLDivElement>) {
    const position = getGradientPosition(event.clientX)

    if (position === null) return

    const stopIndex = getNearestGradientStop(position)

    draggingGradientStopRef.current = stopIndex
    setSelectedGradientStop(stopIndex)
    event.currentTarget.setPointerCapture(event.pointerId)
    moveGradientStop(stopIndex, position)
  }

  function handleGradientPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return

    const stopIndex = draggingGradientStopRef.current
    const position = getGradientPosition(event.clientX)

    if (stopIndex === null || position === null) return

    moveGradientStop(stopIndex, position)
  }

  function handleGradientPointerUp(event: PointerEvent<HTMLDivElement>) {
    draggingGradientStopRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleGradientStopPointerDown(
    event: PointerEvent<HTMLButtonElement>,
    stopIndex: GradientStopIndex
  ) {
    event.preventDefault()
    event.stopPropagation()
    draggingGradientStopRef.current = stopIndex
    setSelectedGradientStop(stopIndex)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleGradientStopPointerMove(
    event: PointerEvent<HTMLButtonElement>,
    stopIndex: GradientStopIndex
  ) {
    if (event.buttons !== 1) return

    const position = getGradientPosition(event.clientX)

    if (position === null) return

    moveGradientStop(stopIndex, position)
  }

  function handleGradientStopPointerUp(event: PointerEvent<HTMLButtonElement>) {
    draggingGradientStopRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function handleGradientStopKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    stopIndex: GradientStopIndex
  ) {
    const step = event.shiftKey ? 10 : 1
    const currentPosition = gradient.stops[stopIndex].position

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveGradientStop(stopIndex, currentPosition - step)
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveGradientStop(stopIndex, currentPosition + step)
    }

    if (event.key === 'Home') {
      event.preventDefault()
      moveGradientStop(stopIndex, stopIndex === 0 ? 0 : gradient.stops[0].position)
    }

    if (event.key === 'End') {
      event.preventDefault()
      moveGradientStop(stopIndex, stopIndex === 0 ? gradient.stops[1].position : 100)
    }
  }

  function handleSaturationPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateSaturation(event)
  }

  function handleSaturationPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return
    updateSaturation(event)
  }

  function handleHuePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateHue(event)
  }

  function handleHuePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return
    updateHue(event)
  }

  function handleAlphaPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateAlpha(event)
  }

  function handleAlphaPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return
    updateAlpha(event)
  }

  function handleSaturationKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      updateColor({ ...activeHsva, s: activeHsva.s - step })
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      updateColor({ ...activeHsva, s: activeHsva.s + step })
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      updateColor({ ...activeHsva, v: activeHsva.v + step })
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      updateColor({ ...activeHsva, v: activeHsva.v - step })
    }
  }

  function handleHueKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      updateColor({ ...activeHsva, h: activeHsva.h - step })
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      updateColor({ ...activeHsva, h: activeHsva.h + step })
    }
  }

  function handleAlphaKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      updateColor({ ...activeHsva, a: activeHsva.a - step })
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      updateColor({ ...activeHsva, a: activeHsva.a + step })
    }
  }

  function updateFromPickedColor(nextColor: string) {
    const nextHsva = parseColor(nextColor)

    updateColor(preserveHue(nextHsva, activeHsva))
  }

  async function handlePickerClick() {
    const EyeDropper =
      typeof window === 'undefined' ? undefined : (window as WindowWithEyeDropper).EyeDropper

    if (!EyeDropper) {
      colorInputRef.current?.click()
      return
    }

    try {
      const { sRGBHex } = await new EyeDropper().open()
      updateFromPickedColor(sRGBHex)
    } catch {
      // The browser throws if the user cancels the picker. No state update is needed.
    }
  }

  function handleNativePickerChange(event: ChangeEvent<HTMLInputElement>) {
    updateFromPickedColor(event.target.value)
  }

  // Flips the active mode. Respects controlled vs. uncontrolled; the value
  // conversion itself is handled by the mode-transition effect, so this runs
  // identically whether triggered by the built-in switcher or a custom one.
  function changeMode(nextMode: ReactColorPickerActiveMode) {
    if (controlledActiveMode === undefined) {
      setInternalActiveMode(nextMode)
    }
    onModeChange?.(nextMode)
  }

  function handleModeChange(event: ChangeEvent<HTMLInputElement>) {
    changeMode(event.target.value as ReactColorPickerActiveMode)
  }

  return (
    <div className={cx(css.rcp, classNames?.root)} style={styles?.root}>
      <div
        className={cx(css.saturation, classNames?.saturation)}
        style={{
          background: `
        linear-gradient(to top, #000, transparent),
        linear-gradient(to right, #fff, ${hueColor})
      `,
          ...styles?.saturation,
        }}
        role="slider"
        tabIndex={0}
        aria-label="Color saturation and brightness"
        aria-valuetext={color}
        onPointerDown={handleSaturationPointerDown}
        onPointerMove={handleSaturationPointerMove}
        onKeyDown={handleSaturationKeyDown}
      >
        <div
          className={cx(css.saturationPointer, classNames?.saturationPointer)}
          style={{
            left: `${activeHsva.s}%`,
            top: `${100 - activeHsva.v}%`,
            backgroundColor: color,
            ...styles?.saturationPointer,
          }}
        />
      </div>

      <div
        className={cx(css.hue, classNames?.hue)}
        style={styles?.hue}
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(activeHsva.h)}
        onPointerDown={handleHuePointerDown}
        onPointerMove={handleHuePointerMove}
        onKeyDown={handleHueKeyDown}
      >
        <div
          className={cx(css.huePointer, classNames?.huePointer)}
          style={{
            left: `${(activeHsva.h / 359) * 100}%`,
            ...styles?.huePointer,
          }}
        />
      </div>

      {!hideOpacityControl && (
        <div
          className={cx(css.alpha, classNames?.alpha)}
          style={{
            background: alphaGradient,
            ...styles?.alpha,
          }}
          role="slider"
          tabIndex={0}
          aria-label="Alpha"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(activeHsva.a)}
          aria-valuetext={`${Math.round(activeHsva.a)}%`}
          onPointerDown={handleAlphaPointerDown}
          onPointerMove={handleAlphaPointerMove}
          onKeyDown={handleAlphaKeyDown}
        >
          <div
            className={cx(css.alphaPointer, classNames?.alphaPointer)}
            style={{
              left: `${activeHsva.a}%`,
              backgroundColor: solidColor,
              ...styles?.alphaPointer,
            }}
          />
        </div>
      )}

      {activeMode === 'gradient' && (
        <div
          ref={gradientRef}
          className={cx(css.gradient, classNames?.gradient)}
          style={{
            background: gradientValue,
            ...styles?.gradient,
          }}
          role="group"
          aria-label="Gradient color stops"
          onPointerDown={handleGradientPointerDown}
          onPointerMove={handleGradientPointerMove}
          onPointerUp={handleGradientPointerUp}
          onLostPointerCapture={() => {
            draggingGradientStopRef.current = null
          }}
        >
          {gradient.stops.map((stop, index) => {
            const stopIndex = index as GradientStopIndex
            const isSelected = selectedGradientStop === stopIndex

            return (
              <button
                key={stopIndex}
                className={cx(
                  css.gradientStop,
                  isSelected && css.gradientStopActive,
                  classNames?.gradientStop,
                  isSelected && classNames?.gradientStopActive
                )}
                style={{
                  left: `${stop.position}%`,
                  background: formatColor(stop.color),
                  ...styles?.gradientStop,
                  ...(isSelected ? styles?.gradientStopActive : undefined),
                }}
                type="button"
                role="slider"
                aria-label={`Gradient stop ${stopIndex + 1} position`}
                aria-valuemin={stopIndex === 0 ? 0 : Math.round(gradient.stops[0].position)}
                aria-valuemax={stopIndex === 0 ? Math.round(gradient.stops[1].position) : 100}
                aria-valuenow={Math.round(stop.position)}
                aria-valuetext={`${Math.round(stop.position)}%`}
                aria-pressed={isSelected}
                onClick={() => setSelectedGradientStop(stopIndex)}
                onPointerDown={(event) => handleGradientStopPointerDown(event, stopIndex)}
                onPointerMove={(event) => handleGradientStopPointerMove(event, stopIndex)}
                onPointerUp={handleGradientStopPointerUp}
                onLostPointerCapture={() => {
                  draggingGradientStopRef.current = null
                }}
                onKeyDown={(event) => handleGradientStopKeyDown(event, stopIndex)}
              />
            )
          })}
        </div>
      )}

      <div className={cx(css.controls, classNames?.controls)}>
        {shouldShowModeToggle && (
          <div
            className={cx(css.modeToggle, classNames?.modeToggle)}
            style={styles?.modeToggle}
            role="radiogroup"
            aria-label="Color picker mode"
          >
            <label
              className={cx(
                css.modeOption,
                activeMode === 'solid' && css.modeOptionActive,
                classNames?.modeOption,
                activeMode === 'solid' && classNames?.modeOptionActive
              )}
              style={{
                ...styles?.modeOption,
                ...(activeMode === 'solid' ? styles?.modeOptionActive : undefined),
              }}
            >
              <input
                className={cx(css.modeInput, classNames?.modeInput)}
                style={styles?.modeInput}
                type="radio"
                name={modeInputName}
                value="solid"
                checked={activeMode === 'solid'}
                onChange={handleModeChange}
              />
              Solid
            </label>

            <label
              className={cx(
                css.modeOption,
                activeMode === 'gradient' && css.modeOptionActive,
                classNames?.modeOption,
                activeMode === 'gradient' && classNames?.modeOptionActive
              )}
              style={{
                ...styles?.modeOption,
                ...(activeMode === 'gradient' ? styles?.modeOptionActive : undefined),
              }}
            >
              <input
                className={cx(css.modeInput, classNames?.modeInput)}
                style={styles?.modeInput}
                type="radio"
                name={modeInputName}
                value="gradient"
                checked={activeMode === 'gradient'}
                onChange={handleModeChange}
              />
              Gradient
            </label>
          </div>
        )}
        {!hideEyedrop && (
          <button
            className={cx(css.eyedrop, classNames?.eyedrop)}
            style={styles?.eyedrop}
            type="button"
            aria-label="Pick a color"
            title="Pick a color"
            onClick={handlePickerClick}
          >
            <svg
              className={cx(css.eyedropIcon, classNames?.eyedropIcon)}
              style={styles?.eyedropIcon}
              viewBox="0 -960 960 960"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M120-120v-190l358-358-58-56 58-56 76 76 124-124q5-5 12.5-8t15.5-3q8 0 15 3t13 8l94 94q5 6 8 13t3 15q0 8-3 15.5t-8 12.5L705-555l76 78-57 57-56-58-358 358H120Zm80-80h78l332-334-76-76-334 332v78Zm447-410 96-96-37-37-96 96 37 37Zm0 0-37-37 37 37Z" />
            </svg>
          </button>
        )}
      </div>

      <input
        ref={colorInputRef}
        className={css.eyedropInput}
        type="color"
        value={solidColor}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleNativePickerChange}
      />
    </div>
  )
}
