import type { CSSProperties } from 'react'

export type ReactColorPickerActiveMode = 'solid' | 'gradient'
export type ReactColorPickerMode = ReactColorPickerActiveMode | 'both'
export type ReactColorPickerGradientType = 'linear' | 'radial'
export type ReactColorPickerGradientTypeMode = ReactColorPickerGradientType | 'both'

export type ReactColorPickerClassNames = {
  root?: string
  modeToggle?: string
  modeThumb?: string
  modeOption?: string
  modeOptionActive?: string
  modeInput?: string
  gradientTypeToggle?: string
  gradientTypeThumb?: string
  gradientTypeOption?: string
  gradientTypeOptionActive?: string
  gradientTypeInput?: string
  gradientTypeIcon?: string
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
  gradientTypeToggle?: CSSProperties
  gradientTypeThumb?: CSSProperties
  gradientTypeOption?: CSSProperties
  gradientTypeOptionActive?: CSSProperties
  gradientTypeInput?: CSSProperties
  gradientTypeIcon?: CSSProperties
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
  /** The current color. Accepts hex (`#f00`, `#ff0000ff`), `rgb()`/`rgba()`, `linear-gradient(...)`, or `radial-gradient(...)`. Invalid values fall back to `#ffffff`. */
  value?: string
  /** Called whenever the color changes. Emits a hex string when fully opaque, `rgba()` when the alpha is below 100%, or a CSS gradient string in gradient mode. */
  onChange?: (color: string) => void
  /** Which modes are available. `'both'` shows the switcher; `'solid'`/`'gradient'` locks to a single mode. */
  mode?: ReactColorPickerMode
  /** Initial active mode when uncontrolled and `mode` is `'both'`. */
  defaultMode?: ReactColorPickerActiveMode
  /** Controlled active mode. When provided, the parent owns the value (pair with `onModeChange`). */
  activeMode?: ReactColorPickerActiveMode
  /** Called when the active mode changes, from the built-in switcher or an internal switch. Wire to your state setter to keep a controlled `activeMode` in sync. */
  onModeChange?: (mode: ReactColorPickerActiveMode) => void
  /** Which gradient types are available. `'both'` shows the switcher in gradient mode; `'linear'`/`'radial'` locks the gradient type. */
  gradientType?: ReactColorPickerGradientTypeMode
  /** Initial gradient type when uncontrolled and `gradientType` is `'both'`. */
  defaultGradientType?: ReactColorPickerGradientType
  /** Controlled gradient type. When provided, the parent owns it (pair with `onGradientTypeChange`). */
  activeGradientType?: ReactColorPickerGradientType
  /** Called when the active gradient type changes, from the built-in switcher or an internal switch. */
  onGradientTypeChange?: (gradientType: ReactColorPickerGradientType) => void
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
  /** Hides the built-in linear/radial gradient switcher (e.g. when supplying your own). */
  hideGradientTypeSwitcher?: boolean
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

export type Gradient = {
  type: ReactColorPickerGradientType
  angle: number
  stops: [GradientStop, GradientStop]
}
