import { useRef } from 'react'
import type { ChangeEvent } from 'react'

import { cx } from '../cx'
import css from '../ReactColorPicker.module.css'
import type { ReactColorPickerClassNames, ReactColorPickerStyles } from '../types'

type EyeDropperConstructor = new () => {
  open: () => Promise<{ sRGBHex: string }>
}

type WindowWithEyeDropper = Window & {
  EyeDropper?: EyeDropperConstructor
}

type EyedropButtonProps = {
  /** Current color as a hex string, used as the fallback native picker's value. */
  solidColor: string
  onPick: (color: string) => void
  classNames?: ReactColorPickerClassNames
  styles?: ReactColorPickerStyles
}

export function EyedropButton({ solidColor, onPick, classNames, styles }: EyedropButtonProps) {
  const colorInputRef = useRef<HTMLInputElement>(null)

  async function handleClick() {
    const EyeDropper =
      typeof window === 'undefined' ? undefined : (window as WindowWithEyeDropper).EyeDropper

    if (!EyeDropper) {
      colorInputRef.current?.click()
      return
    }

    try {
      const { sRGBHex } = await new EyeDropper().open()
      onPick(sRGBHex)
    } catch {
      // The browser throws if the user cancels the picker. No state update is needed.
    }
  }

  function handleNativePickerChange(event: ChangeEvent<HTMLInputElement>) {
    onPick(event.target.value)
  }

  return (
    <>
      <button
        className={cx(css.eyedrop, classNames?.eyedrop)}
        style={styles?.eyedrop}
        type="button"
        aria-label="Pick a color"
        title="Pick a color"
        onClick={handleClick}
      >
        <svg
          className={cx(css.eyedropIcon, classNames?.eyedropIcon)}
          style={styles?.eyedropIcon}
          viewBox="0 -960 960 960"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M120-120v-190l358-358-58-56 58-56 76 76 124-124q5-5 12.5-8t15.5-3q8 0 15 3t13 8l94 94q5 6 8 13t3 15q0 8-3 15.5t-8 12.5L705-555l76 78-57 57-56-58-358 358H120Zm80-80h78l332-334-76-76-334 332v78Zm447-410 96-96-37-37-96 96 37 37Zm0 0-37-37 37 37Z" />
        </svg>
      </button>

      <input
        ref={colorInputRef}
        className={css.eyedropInput}
        type="color"
        value={solidColor}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleNativePickerChange}
      />
    </>
  )
}
