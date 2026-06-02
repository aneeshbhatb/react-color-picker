import type { CSSProperties } from 'react'

import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, PointerEvent } from 'react'
import css from './ReactColorPicker.module.css'

export type ReactColorPickerClassNames = {
  root?: string
  saturation?: string
  saturationPointer?: string
  hue?: string
  huePointer?: string
  alpha?: string
  alphaPointer?: string
  eyedrop?: string
  eyedropIcon?: string
}

export type ReactColorPickerStyles = {
  root?: CSSProperties
  saturation?: CSSProperties
  saturationPointer?: CSSProperties
  hue?: CSSProperties
  huePointer?: CSSProperties
  alpha?: CSSProperties
  alphaPointer?: CSSProperties
  eyedrop?: CSSProperties
  eyedropIcon?: CSSProperties
}

export type ReactColorPickerProps = {
  value?: string
  onChange?: (color: string) => void
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
  hideEyedrop?: boolean
  hideOpacityControl?: boolean
}

const DEFAULT_COLOR = '#ffffff'

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

function parseColor(value: string): HSVA {
  const parsedColor =
    parseHexColor(value) ?? parseCssRgbColor(value) ?? parseHexColor(DEFAULT_COLOR)!

  return {
    ...rgbToHsv(parsedColor.rgb),
    a: parsedColor.a,
  }
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

export function ReactColorPicker({
  value = DEFAULT_COLOR,
  onChange,
  classNames,
  styles,
  hideEyedrop = false,
  hideOpacityControl = false,
}: ReactColorPickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const lastEmittedColorRef = useRef<string | null>(null)

  const [hsva, setHsva] = useState<HSVA>(() => parseColor(value))

  useEffect(() => {
    const nextColor = parseColor(value)
    const nextFormattedColor = formatColor(nextColor)

    if (lastEmittedColorRef.current === nextFormattedColor) {
      return
    }

    setHsva((currentHsva) => ({
      h: nextColor.s === 0 || nextColor.v === 0 ? currentHsva.h : nextColor.h,
      s: nextColor.s,
      v: nextColor.v,
      a: nextColor.a,
    }))
  }, [value])

  const rgb = hsvToRgb(hsva)
  const color = formatColor(hsva)
  const solidColor = rgbToHex(rgb)
  const hueColor = hsvToHex({ h: hsva.h, s: 100, v: 100 })
  const alphaGradient = `
    linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgb(${rgb.r}, ${rgb.g}, ${rgb.b})),
    repeating-conic-gradient(#fff 0% 25%, #c9c9c9 0% 50%) 50% / 12px 12px
  `

  function updateColor(nextHsva: HSVA) {
    const clampedHsva = {
      h: clamp(nextHsva.h, 0, 359),
      s: clamp(nextHsva.s, 0, 100),
      v: clamp(nextHsva.v, 0, 100),
      a: clamp(nextHsva.a, 0, 100),
    }

    const nextColor = formatColor(clampedHsva)

    setHsva(clampedHsva)
    lastEmittedColorRef.current = nextColor
    onChange?.(nextColor)
  }

  function updateSaturation(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1)

    updateColor({
      h: hsva.h,
      s: x * 100,
      v: 100 - y * 100,
      a: hsva.a,
    })
  }

  function updateHue(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)

    updateColor({
      h: x * 359,
      s: hsva.s,
      v: hsva.v,
      a: hsva.a,
    })
  }

  function updateAlpha(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)

    updateColor({
      ...hsva,
      a: x * 100,
    })
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
      updateColor({ ...hsva, s: hsva.s - step })
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      updateColor({ ...hsva, s: hsva.s + step })
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      updateColor({ ...hsva, v: hsva.v + step })
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      updateColor({ ...hsva, v: hsva.v - step })
    }
  }

  function handleHueKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      updateColor({ ...hsva, h: hsva.h - step })
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      updateColor({ ...hsva, h: hsva.h + step })
    }
  }

  function handleAlphaKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      updateColor({ ...hsva, a: hsva.a - step })
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      updateColor({ ...hsva, a: hsva.a + step })
    }
  }

  function updateFromPickedColor(nextColor: string) {
    const nextHsva = parseColor(nextColor)

    updateColor({
      h: nextHsva.s === 0 || nextHsva.v === 0 ? hsva.h : nextHsva.h,
      s: nextHsva.s,
      v: nextHsva.v,
      a: nextHsva.a,
    })
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
            left: `${hsva.s}%`,
            top: `${100 - hsva.v}%`,
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
        aria-valuenow={Math.round(hsva.h)}
        onPointerDown={handleHuePointerDown}
        onPointerMove={handleHuePointerMove}
        onKeyDown={handleHueKeyDown}
      >
        <div
          className={cx(css.huePointer, classNames?.huePointer)}
          style={{
            left: `${(hsva.h / 359) * 100}%`,
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
          aria-valuenow={Math.round(hsva.a)}
          aria-valuetext={`${Math.round(hsva.a)}%`}
          onPointerDown={handleAlphaPointerDown}
          onPointerMove={handleAlphaPointerMove}
          onKeyDown={handleAlphaKeyDown}
        >
          <div
            className={cx(css.alphaPointer, classNames?.alphaPointer)}
            style={{
              left: `${hsva.a}%`,
              backgroundColor: solidColor,
              ...styles?.alphaPointer,
            }}
          />
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
