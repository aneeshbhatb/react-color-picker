import { useEffect, useRef, useState } from 'react'

import { Alpha } from './components/Alpha'
import { EyedropButton } from './components/EyedropButton'
import { GradientBar } from './components/GradientBar'
import { GradientTypeSwitcher } from './components/GradientTypeSwitcher'
import { Hue } from './components/Hue'
import { ModeSwitcher } from './components/ModeSwitcher'
import { Saturation } from './components/Saturation'
import {
  clamp,
  DEFAULT_COLOR,
  formatColor,
  formatGradient,
  getDefaultGradientValue,
  hsvToRgb,
  parseColor,
  parseGradient,
  preserveHue,
  rgbToHex,
  updateGradientStopColor,
} from './colorMath'
import { cx } from './cx'
import css from './ReactColorPicker.module.css'
import type {
  Gradient,
  GradientStopIndex,
  HSVA,
  ReactColorPickerActiveMode,
  ReactColorPickerGradientType,
  ReactColorPickerProps,
} from './types'

export type {
  ReactColorPickerActiveMode,
  ReactColorPickerGradientType,
  ReactColorPickerGradientTypeMode,
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
  gradientType = 'both',
  defaultGradientType = 'linear',
  activeGradientType: controlledActiveGradientType,
  onGradientTypeChange,
  classNames,
  styles,
  hideEyedrop = false,
  hideOpacityControl = false,
  hideModeSwitcher = false,
  hideGradientTypeSwitcher = false,
}: ReactColorPickerProps) {
  const lastEmittedValueRef = useRef<string | null>(null)

  // An empty/blank `value` (e.g. `useState('')`) counts as "not supplied".
  const providedValue = value != null && value.trim() !== '' ? value : undefined

  // The active mode at mount, used to pick the right default when no `value`
  // is supplied — gradient mode defaults to a gradient, solid mode to a color.
  const initialActiveMode: ReactColorPickerActiveMode =
    mode !== 'both' ? mode : (controlledActiveMode ?? defaultMode)
  const initialFallbackGradientType: ReactColorPickerGradientType =
    gradientType !== 'both' ? gradientType : (controlledActiveGradientType ?? defaultGradientType)
  const initialValue =
    providedValue ??
    (initialActiveMode === 'gradient'
      ? getDefaultGradientValue(initialFallbackGradientType)
      : DEFAULT_COLOR)
  const initialGradient = parseGradient(initialValue, initialFallbackGradientType)
  const initialGradientType: ReactColorPickerGradientType =
    gradientType !== 'both'
      ? gradientType
      : (controlledActiveGradientType ??
        (providedValue === undefined ? initialFallbackGradientType : initialGradient.type))

  const [internalActiveMode, setInternalActiveMode] = useState<ReactColorPickerActiveMode>(() =>
    mode === 'both' ? defaultMode : mode
  )
  const [hsva, setHsva] = useState<HSVA>(() => parseColor(initialValue))
  const [gradient, setGradient] = useState<Gradient>(() => ({
    ...initialGradient,
    type: initialGradientType,
  }))
  const [selectedGradientStop, setSelectedGradientStop] = useState<GradientStopIndex>(0)

  // Locked mode wins; otherwise a provided `activeMode` makes the picker controlled.
  const activeMode: ReactColorPickerActiveMode =
    mode !== 'both' ? mode : (controlledActiveMode ?? internalActiveMode)
  const activeGradientType: ReactColorPickerGradientType =
    gradientType !== 'both' ? gradientType : (controlledActiveGradientType ?? gradient.type)
  const activeGradient: Gradient =
    gradient.type === activeGradientType ? gradient : { ...gradient, type: activeGradientType }
  const shouldShowModeToggle = mode === 'both' && !hideModeSwitcher
  const shouldShowGradientTypeToggle =
    activeMode === 'gradient' && gradientType === 'both' && !hideGradientTypeSwitcher
  const shouldForceGradientType =
    gradientType !== 'both' ||
    controlledActiveGradientType !== undefined ||
    providedValue === undefined

  // Falls back to the mode-appropriate default whenever `value` is omitted.
  const resolvedValue =
    providedValue ??
    (activeMode === 'gradient' ? getDefaultGradientValue(activeGradientType) : DEFAULT_COLOR)

  useEffect(() => {
    if (activeMode === 'gradient') {
      const parsedGradient = parseGradient(resolvedValue, activeGradientType)
      const nextGradient = {
        ...parsedGradient,
        type: shouldForceGradientType ? activeGradientType : parsedGradient.type,
      } satisfies Gradient
      const nextFormattedGradient = formatGradient(nextGradient)

      if (lastEmittedValueRef.current === nextFormattedGradient) {
        return
      }

      setGradient((currentGradient) => ({
        type: nextGradient.type,
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
  }, [activeGradientType, activeMode, resolvedValue, shouldForceGradientType])

  // Carries the color across a mode switch and emits the value in the new
  // format. Declared after the value-sync effect above so its direct state
  // writes take precedence when both run in the same commit.
  function applyModeTransition(nextMode: ReactColorPickerActiveMode) {
    if (nextMode === 'gradient') {
      const nextGradient = {
        ...activeGradient,
        stops: [
          {
            ...activeGradient.stops[0],
            color: hsva,
          },
          activeGradient.stops[1],
        ],
      } satisfies Gradient
      const nextValue = formatGradient(nextGradient)

      setGradient(nextGradient)
      setSelectedGradientStop(0)
      lastEmittedValueRef.current = nextValue
      onChange?.(nextValue)
      return
    }

    const nextColor = formatColor(activeGradient.stops[selectedGradientStop].color)

    setHsva(activeGradient.stops[selectedGradientStop].color)
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

  // Runs the value conversion when the gradient type changes externally,
  // including controlled custom switchers and locked gradient type updates.
  const appliedGradientTypeRef = useRef(activeGradientType)
  useEffect(() => {
    if (appliedGradientTypeRef.current === activeGradientType) {
      return
    }
    appliedGradientTypeRef.current = activeGradientType

    const nextGradient = {
      ...activeGradient,
      type: activeGradientType,
    } satisfies Gradient

    if (activeMode === 'gradient') {
      emitGradient(nextGradient)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGradientType])

  const activeHsva =
    activeMode === 'gradient' ? activeGradient.stops[selectedGradientStop].color : hsva
  const solidColor = rgbToHex(hsvToRgb(activeHsva))

  function emitGradient(nextGradient: Gradient) {
    const nextValue = formatGradient(nextGradient)

    setGradient(nextGradient)
    if (lastEmittedValueRef.current === nextValue) {
      return
    }

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
      emitGradient(updateGradientStopColor(activeGradient, selectedGradientStop, clampedHsva))
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

  function changeGradientType(nextGradientType: ReactColorPickerGradientType) {
    if (activeGradientType === nextGradientType) {
      return
    }

    if (gradientType === 'both' && controlledActiveGradientType === undefined) {
      const nextGradient = {
        ...activeGradient,
        type: nextGradientType,
      } satisfies Gradient

      if (activeMode === 'gradient') {
        emitGradient(nextGradient)
      } else {
        setGradient(nextGradient)
      }
    }

    onGradientTypeChange?.(nextGradientType)
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
          gradient={activeGradient}
          selectedStop={selectedGradientStop}
          onSelectStop={setSelectedGradientStop}
          onChange={emitGradient}
          classNames={classNames}
          styles={styles}
        />
      )}

      <div className={cx(css.controls, classNames?.controls)}>
        {(shouldShowModeToggle || shouldShowGradientTypeToggle) && (
          <div className={css.controlSwitchers}>
            {shouldShowModeToggle && (
              <ModeSwitcher
                activeMode={activeMode}
                onChange={changeMode}
                classNames={classNames}
                styles={styles}
              />
            )}
            {shouldShowGradientTypeToggle && (
              <GradientTypeSwitcher
                activeType={activeGradientType}
                onChange={changeGradientType}
                classNames={classNames}
                styles={styles}
              />
            )}
          </div>
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
