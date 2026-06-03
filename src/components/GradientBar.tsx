import { useRef } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

import { clamp, formatColor, formatLinearGradient, updateGradientStopPosition } from '../colorMath'
import { cx } from '../cx'
import css from '../ReactColorPicker.module.css'
import type {
  GradientStopIndex,
  LinearGradient,
  ReactColorPickerClassNames,
  ReactColorPickerStyles,
} from '../types'

type GradientBarProps = {
  gradient: LinearGradient
  selectedStop: GradientStopIndex
  onSelectStop: (stopIndex: GradientStopIndex) => void
  onChange: (gradient: LinearGradient) => void
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
}

export function GradientBar({
  gradient,
  selectedStop,
  onSelectStop,
  onChange,
  classNames,
  styles,
}: GradientBarProps) {
  const gradientRef = useRef<HTMLDivElement>(null)
  const draggingGradientStopRef = useRef<GradientStopIndex | null>(null)

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
    onChange(updateGradientStopPosition(gradient, stopIndex, position))
  }

  function handleGradientPointerDown(event: PointerEvent<HTMLDivElement>) {
    const position = getGradientPosition(event.clientX)

    if (position === null) return

    const stopIndex = getNearestGradientStop(position)

    draggingGradientStopRef.current = stopIndex
    onSelectStop(stopIndex)
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
    onSelectStop(stopIndex)
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

  return (
    <div
      ref={gradientRef}
      className={cx(css.gradient, classNames?.gradient)}
      style={{
        background: formatLinearGradient(gradient),
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
        const isSelected = selectedStop === stopIndex

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
            onClick={() => onSelectStop(stopIndex)}
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
  )
}
