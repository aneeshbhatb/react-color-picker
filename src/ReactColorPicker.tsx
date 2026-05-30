import { useEffect, useRef, useState } from 'react'
import type { PointerEvent, KeyboardEvent } from 'react'
import styles from './ReactColorPicker.module.css'

export type ReactColorPickerProps = {
  value?: string
  onChange?: (color: string) => void
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeHex(value: string) {
  let hex = value.trim()

  if (!hex.startsWith('#')) {
    hex = `#${hex}`
  }

  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase()
  }

  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase()
  }

  return DEFAULT_COLOR
}

function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex)

  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
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

function hexToHsv(hex: string) {
  return rgbToHsv(hexToRgb(hex))
}

export function ReactColorPicker({ value = DEFAULT_COLOR, onChange }: ReactColorPickerProps) {
  const normalizedValue = normalizeHex(value)
  const lastEmittedColorRef = useRef<string | null>(null)

  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(normalizedValue))

  useEffect(() => {
    const nextColor = normalizeHex(value)

    if (lastEmittedColorRef.current === nextColor) {
      return
    }

    const nextHsv = hexToHsv(nextColor)

    setHsv((currentHsv) => ({
      h: nextHsv.s === 0 || nextHsv.v === 0 ? currentHsv.h : nextHsv.h,
      s: nextHsv.s,
      v: nextHsv.v,
    }))
  }, [value])

  const color = hsvToHex(hsv)
  const hueColor = hsvToHex({ h: hsv.h, s: 100, v: 100 })

  function updateColor(nextHsv: HSV) {
    const clampedHsv = {
      h: clamp(nextHsv.h, 0, 359),
      s: clamp(nextHsv.s, 0, 100),
      v: clamp(nextHsv.v, 0, 100),
    }

    const nextColor = hsvToHex(clampedHsv)

    setHsv(clampedHsv)
    lastEmittedColorRef.current = nextColor
    onChange?.(nextColor)
  }

  function updateSaturation(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1)

    updateColor({
      h: hsv.h,
      s: x * 100,
      v: 100 - y * 100,
    })
  }

  function updateHue(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)

    updateColor({
      h: x * 359,
      s: hsv.s,
      v: hsv.v,
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

  function handleSaturationKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      updateColor({ ...hsv, s: hsv.s - step })
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      updateColor({ ...hsv, s: hsv.s + step })
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      updateColor({ ...hsv, v: hsv.v + step })
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      updateColor({ ...hsv, v: hsv.v - step })
    }
  }

  function handleHueKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      updateColor({ ...hsv, h: hsv.h - step })
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      updateColor({ ...hsv, h: hsv.h + step })
    }
  }

  return (
    <div className={styles.rcp}>
      <div
        className={styles.saturation}
        style={{
          background: `
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #fff, ${hueColor})
          `,
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
          className={styles.saturationPointer}
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            backgroundColor: color,
          }}
        />
      </div>

      <div
        className={styles.hue}
        role="slider"
        tabIndex={0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(hsv.h)}
        onPointerDown={handleHuePointerDown}
        onPointerMove={handleHuePointerMove}
        onKeyDown={handleHueKeyDown}
      >
        <div
          className={styles.huePointer}
          style={{
            left: `${(hsv.h / 359) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
