import type { CSSProperties } from 'react'

export type ReactColorPickerActiveMode = 'solid' | 'gradient'
export type ReactColorPickerMode = ReactColorPickerActiveMode | 'both'

export type ReactColorPickerClassNames = {
  root?: string
  modeToggle?: string
  modeThumb?: string
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
  modeThumb?: CSSProperties
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

export type RGB = {
  r: number
  g: number
  b: number
}

export type HSV = {
  h: number
  s: number
  v: number
}

export type HSVA = HSV & {
  a: number
}

export type GradientStopIndex = 0 | 1

export type GradientStop = {
  color: HSVA
  position: number
}

export type LinearGradient = {
  angle: number
  stops: [GradientStop, GradientStop]
}
