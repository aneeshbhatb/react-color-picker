import { useId } from 'react'
import type { ChangeEvent } from 'react'

import { cx } from '../cx'
import css from '../ReactColorPicker.module.css'
import type {
  ReactColorPickerClassNames,
  ReactColorPickerGradientType,
  ReactColorPickerStyles,
} from '../types'

type GradientTypeSwitcherProps = {
  activeType: ReactColorPickerGradientType
  onChange: (type: ReactColorPickerGradientType) => void
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
}

type GradientTypeIconProps = {
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
}

function LinearGradientIcon({ classNames, styles }: GradientTypeIconProps) {
  return (
    <svg
      className={cx(css.gradientTypeIcon, classNames?.gradientTypeIcon)}
      style={styles?.gradientTypeIcon}
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M760-80q-50 0-85-35t-35-85q0-14 3-27t9-25L252-652q-12 6-25 9t-27 3q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 14-3 27t-9 25l400 400q12-6 25-9t27-3q50 0 85 35t35 85q0 50-35 85t-85 35Z" />
    </svg>
  )
}

function RadialGradientIcon({ classNames, styles }: GradientTypeIconProps) {
  return (
    <svg
      className={cx(css.gradientTypeIcon, classNames?.gradientTypeIcon)}
      style={styles?.gradientTypeIcon}
      viewBox="0 -960 960 960"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M621.5-338.5Q680-397 680-480t-58.5-141.5Q563-680 480-680t-141.5 58.5Q280-563 280-480t58.5 141.5Q397-280 480-280t141.5-58.5ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Z" />
    </svg>
  )
}

export function GradientTypeSwitcher({
  activeType,
  onChange,
  classNames,
  styles,
}: GradientTypeSwitcherProps) {
  const gradientTypeInputName = useId()

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value as ReactColorPickerGradientType)
  }

  return (
    <div
      className={cx(css.modeToggle, css.gradientTypeToggle, classNames?.gradientTypeToggle)}
      style={styles?.gradientTypeToggle}
      role="radiogroup"
      aria-label="Gradient type"
      data-active-gradient-type={activeType}
    >
      <span
        className={cx(css.modeThumb, css.gradientTypeThumb, classNames?.gradientTypeThumb)}
        style={styles?.gradientTypeThumb}
        aria-hidden="true"
      />
      <label
        className={cx(
          css.modeOption,
          css.gradientTypeOption,
          activeType === 'linear' && css.modeOptionActive,
          activeType === 'linear' && css.gradientTypeOptionActive,
          classNames?.gradientTypeOption,
          activeType === 'linear' && classNames?.gradientTypeOptionActive
        )}
        style={{
          ...styles?.gradientTypeOption,
          ...(activeType === 'linear' ? styles?.gradientTypeOptionActive : undefined),
        }}
        title="Linear gradient"
      >
        <input
          className={cx(css.modeInput, classNames?.gradientTypeInput)}
          style={styles?.gradientTypeInput}
          type="radio"
          name={gradientTypeInputName}
          value="linear"
          checked={activeType === 'linear'}
          aria-label="Linear gradient"
          onChange={handleChange}
        />
        <LinearGradientIcon classNames={classNames} styles={styles} />
      </label>

      <label
        className={cx(
          css.modeOption,
          css.gradientTypeOption,
          activeType === 'radial' && css.modeOptionActive,
          activeType === 'radial' && css.gradientTypeOptionActive,
          classNames?.gradientTypeOption,
          activeType === 'radial' && classNames?.gradientTypeOptionActive
        )}
        style={{
          ...styles?.gradientTypeOption,
          ...(activeType === 'radial' ? styles?.gradientTypeOptionActive : undefined),
        }}
        title="Radial gradient"
      >
        <input
          className={cx(css.modeInput, classNames?.gradientTypeInput)}
          style={styles?.gradientTypeInput}
          type="radio"
          name={gradientTypeInputName}
          value="radial"
          checked={activeType === 'radial'}
          aria-label="Radial gradient"
          onChange={handleChange}
        />
        <RadialGradientIcon classNames={classNames} styles={styles} />
      </label>
    </div>
  )
}
