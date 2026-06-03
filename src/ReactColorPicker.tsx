import { useEffect, useRef, useState } from 'react'

import { Alpha } from './components/Alpha'
import { EyedropButton } from './components/EyedropButton'
import { GradientBar } from './components/GradientBar'
import { Hue } from './components/Hue'
import { ModeSwitcher } from './components/ModeSwitcher'
import { Saturation } from './components/Saturation'
import {
  clamp,
  DEFAULT_COLOR,
  DEFAULT_GRADIENT,
  formatColor,
  formatLinearGradient,
  hsvToRgb,
  parseColor,
  parseLinearGradient,
  preserveHue,
  rgbToHex,
  updateGradientStopColor,
} from './colorMath'
import { cx } from './cx'
import css from './ReactColorPicker.module.css'
import type {
  GradientStopIndex,
  HSVA,
  LinearGradient,
  ReactColorPickerActiveMode,
  ReactColorPickerProps,
} from './types'

export type {
  ReactColorPickerActiveMode,
  ReactColorPickerMode,
  ReactColorPickerClassNames,
  ReactColorPickerStyles,
  ReactColorPickerProps,
} from './types'

export function ReactColorPicker({
  value,
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
  const lastEmittedValueRef = useRef<string | null>(null)

  // An empty/blank `value` (e.g. `useState('')`) counts as "not supplied".
  const providedValue = value != null && value.trim() !== '' ? value : undefined

  // The active mode at mount, used to pick the right default when no `value`
  // is supplied — gradient mode defaults to a gradient, solid mode to a color.
  const initialActiveMode: ReactColorPickerActiveMode =
    mode !== 'both' ? mode : (controlledActiveMode ?? defaultMode)
  const initialValue =
    providedValue ?? (initialActiveMode === 'gradient' ? DEFAULT_GRADIENT : DEFAULT_COLOR)

  const [internalActiveMode, setInternalActiveMode] = useState<ReactColorPickerActiveMode>(() =>
    mode === 'both' ? defaultMode : mode
  )
  const [hsva, setHsva] = useState<HSVA>(() => parseColor(initialValue))
  const [gradient, setGradient] = useState<LinearGradient>(() => parseLinearGradient(initialValue))
  const [selectedGradientStop, setSelectedGradientStop] = useState<GradientStopIndex>(0)

  // Locked mode wins; otherwise a provided `activeMode` makes the picker controlled.
  const activeMode: ReactColorPickerActiveMode =
    mode !== 'both' ? mode : (controlledActiveMode ?? internalActiveMode)
  const shouldShowModeToggle = mode === 'both' && !hideModeSwitcher

  // Falls back to the mode-appropriate default whenever `value` is omitted.
  const resolvedValue =
    providedValue ?? (activeMode === 'gradient' ? DEFAULT_GRADIENT : DEFAULT_COLOR)

  useEffect(() => {
    if (activeMode === 'gradient') {
      const nextGradient = parseLinearGradient(resolvedValue)
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

    const nextColor = parseColor(resolvedValue)
    const nextFormattedColor = formatColor(nextColor)

    if (lastEmittedValueRef.current === nextFormattedColor) {
      return
    }

    setHsva((currentHsva) => preserveHue(nextColor, currentHsva))
  }, [activeMode, resolvedValue])

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
  const solidColor = rgbToHex(hsvToRgb(activeHsva))

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

  function updateFromPickedColor(nextColor: string) {
    updateColor(preserveHue(parseColor(nextColor), activeHsva))
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

  return (
    <div className={cx(css.rcp, classNames?.root)} style={styles?.root}>
      <Saturation
        hsva={activeHsva}
        onChange={updateColor}
        classNames={classNames}
        styles={styles}
      />

      <Hue hsva={activeHsva} onChange={updateColor} classNames={classNames} styles={styles} />

      {!hideOpacityControl && (
        <Alpha hsva={activeHsva} onChange={updateColor} classNames={classNames} styles={styles} />
      )}

      {activeMode === 'gradient' && (
        <GradientBar
          gradient={gradient}
          selectedStop={selectedGradientStop}
          onSelectStop={setSelectedGradientStop}
          onChange={emitGradient}
          classNames={classNames}
          styles={styles}
        />
      )}

      <div className={cx(css.controls, classNames?.controls)}>
        {shouldShowModeToggle && (
          <ModeSwitcher
            activeMode={activeMode}
            onChange={changeMode}
            classNames={classNames}
            styles={styles}
          />
        )}
        {!hideEyedrop && (
          <EyedropButton
            solidColor={solidColor}
            onPick={updateFromPickedColor}
            classNames={classNames}
            styles={styles}
          />
        )}
      </div>
    </div>
  )
}
