import type { KeyboardEvent, PointerEvent } from 'react'

import { clamp } from '../colorMath'
import { cx } from '../cx'
import css from '../ReactColorPicker.module.css'
import type { HSVA, ReactColorPickerClassNames, ReactColorPickerStyles } from '../types'

type HueProps = {
  hsva: HSVA
  onChange: (hsva: HSVA) => void
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
}

export function Hue({ hsva, onChange, classNames, styles }: HueProps) {
  function updateHue(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1)

    onChange({
      h: x * 359,
      s: hsva.s,
      v: hsva.v,
      a: hsva.a,
    })
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    updateHue(event)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.buttons !== 1) return
    updateHue(event)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      event.preventDefault()
      onChange({ ...hsva, h: hsva.h - step })
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      event.preventDefault()
      onChange({ ...hsva, h: hsva.h + step })
    }
  }

  return (
    <div
      className={cx(css.hue, classNames?.hue)}
      style={styles?.hue}
      role="slider"
      tabIndex={0}
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={Math.round(hsva.h)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onKeyDown={handleKeyDown}
    >
      <div
        className={cx(css.huePointer, classNames?.huePointer)}
        style={{
          left: `${(hsva.h / 359) * 100}%`,
          ...styles?.huePointer,
        }}
      />
    </div>
  )
}
