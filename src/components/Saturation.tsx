import type { KeyboardEvent, PointerEvent } from 'react'

import { clamp, formatColor, hsvToHex } from '../colorMath'
import { cx } from '../cx'
import css from '../ReactColorPicker.module.css'
import type { HSVA, ReactColorPickerClassNames, ReactColorPickerStyles } from '../types'

type SaturationProps = {
  hsva: HSVA
  onChange: (hsva: HSVA) => void
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
}

export function Saturation({ hsva, onChange, classNames, styles }: SaturationProps) {
  const color = formatColor(hsva)
  const hueColor = hsvToHex({ h: hsva.h, s: 100, v: 100 })

  function updateSaturation(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1)

    onChange({
      h: hsva.h,
      s: x * 100,
      v: 100 - y * 100,
      a: hsva.a,
    })
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateSaturation(event)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return
    updateSaturation(event)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onChange({ ...hsva, s: hsva.s - step })
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      onChange({ ...hsva, s: hsva.s + step })
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      onChange({ ...hsva, v: hsva.v + step })
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      onChange({ ...hsva, v: hsva.v - step })
    }
  }

  return (
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
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
  )
}
