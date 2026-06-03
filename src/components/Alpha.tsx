import type { KeyboardEvent, PointerEvent } from 'react'

import { clamp, hsvToRgb, rgbToHex } from '../colorMath'
import { cx } from '../cx'
import css from '../ReactColorPicker.module.css'
import type { HSVA, ReactColorPickerClassNames, ReactColorPickerStyles } from '../types'

type AlphaProps = {
  hsva: HSVA
  onChange: (hsva: HSVA) => void
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
}

export function Alpha({ hsva, onChange, classNames, styles }: AlphaProps) {
  const rgb = hsvToRgb(hsva)
  const solidColor = rgbToHex(rgb)
  const alphaGradient = `
    linear-gradient(to right, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgb(${rgb.r}, ${rgb.g}, ${rgb.b})),
    repeating-conic-gradient(#fff 0% 25%, #c9c9c9 0% 50%) 50% / 12px 12px
  `

  function updateAlpha(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)

    onChange({
      ...hsva,
      a: x * 100,
    })
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateAlpha(event)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return
    updateAlpha(event)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      onChange({ ...hsva, a: hsva.a - step })
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      onChange({ ...hsva, a: hsva.a + step })
    }
  }

  return (
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
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
  )
}
