import { useId } from 'react'
import type { ChangeEvent } from 'react'

import { cx } from '../cx'
import css from '../ReactColorPicker.module.css'
import type {
  ReactColorPickerActiveMode,
  ReactColorPickerClassNames,
  ReactColorPickerStyles,
} from '../types'

type ModeSwitcherProps = {
  activeMode: ReactColorPickerActiveMode
  onChange: (mode: ReactColorPickerActiveMode) => void
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
}

export function ModeSwitcher({ activeMode, onChange, classNames, styles }: ModeSwitcherProps) {
  const modeInputName = useId()

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value as ReactColorPickerActiveMode)
  }

  return (
    <div
      className={cx(css.modeToggle, classNames?.modeToggle)}
      style={styles?.modeToggle}
      role="radiogroup"
      aria-label="Color picker mode"
      data-active-mode={activeMode}
    >
      <span
        className={cx(css.modeThumb, classNames?.modeThumb)}
        style={styles?.modeThumb}
        aria-hidden="true"
      />
      <label
        className={cx(
          css.modeOption,
          activeMode === 'solid' && css.modeOptionActive,
          classNames?.modeOption,
          activeMode === 'solid' && classNames?.modeOptionActive
        )}
        style={{
          ...styles?.modeOption,
          ...(activeMode === 'solid' ? styles?.modeOptionActive : undefined),
        }}
      >
        <input
          className={cx(css.modeInput, classNames?.modeInput)}
          style={styles?.modeInput}
          type="radio"
          name={modeInputName}
          value="solid"
          checked={activeMode === 'solid'}
          onChange={handleChange}
        />
        Solid
      </label>

      <label
        className={cx(
          css.modeOption,
          activeMode === 'gradient' && css.modeOptionActive,
          classNames?.modeOption,
          activeMode === 'gradient' && classNames?.modeOptionActive
        )}
        style={{
          ...styles?.modeOption,
          ...(activeMode === 'gradient' ? styles?.modeOptionActive : undefined),
        }}
      >
        <input
          className={cx(css.modeInput, classNames?.modeInput)}
          style={styles?.modeInput}
          type="radio"
          name={modeInputName}
          value="gradient"
          checked={activeMode === 'gradient'}
          onChange={handleChange}
        />
        Gradient
      </label>
    </div>
  )
}
