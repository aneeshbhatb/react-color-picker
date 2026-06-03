# @aneeshbhat/react-color-picker

A lightweight React color picker with saturation, hue, and alpha controls.

> This project is in early development. The API may change as the component evolves.

## Playground

Demo: https://aneeshbhatb.github.io/react-color-picker-playground/


## Installation

```bash
npm install @aneeshbhat/react-color-picker
# or
bun add @aneeshbhat/react-color-picker
```

## Usage

Import the component and its stylesheet, then wire it up as a controlled input.

```tsx
import { useState } from 'react'
import { ReactColorPicker } from '@aneeshbhat/react-color-picker'
import '@aneeshbhat/react-color-picker/style.css'

function App() {
  const [color, setColor] = useState('#3b82f6')

  return (
    <div style={{ width: 320, height: 240 }}>
      <ReactColorPicker value={color} onChange={setColor} />
    </div>
  )
}
```

The picker fits the dimensions of its container. `onChange` emits a hex string (`#rrggbb`) when the color is fully opaque, or an `rgba(r, g, b, a)` string when the alpha channel is below 100%.

## Supported color formats

The `value` prop accepts:

| Format                   | Example                  |
| ------------------------ | ------------------------ |
| 3-digit hex              | `#f00`                   |
| 6-digit hex              | `#ff0000`                |
| 4-digit hex (with alpha) | `#f00f`                  |
| 8-digit hex (with alpha) | `#ff0000ff`              |
| CSS `rgb()`              | `rgb(255, 0, 0)`         |
| CSS `rgba()`             | `rgba(255, 0, 0, 0.5)`   |

Invalid values fall back to `#ffffff`.

## Props

| Prop                   | Type                         | Default     | Description                                                                          |
| ---------------------- |------------------------------| ----------- | ------------------------------------------------------------------------------------ |
| `value`                | `string`                     | see note    | The current color value. Accepts hex, `rgb()`/`rgba()`, or a `linear-gradient(...)`. When omitted, defaults to `#ffffff` in solid mode and `linear-gradient(90deg, #fffdf6 0%, #ffe3e3 100%)` when starting in gradient mode. |
| `onChange`             | `(color: string) => void`    | —           | Called whenever the color changes. Emits hex when fully opaque, `rgba()` otherwise.  |
| `mode`                 | `'solid' \| 'gradient' \| 'both'` | `'both'` | Which modes are available. `'both'` shows the switcher; a single value locks the picker to that mode. |
| `defaultMode`          | `'solid' \| 'gradient'`      | `'solid'`   | Initial active mode when `mode` is `'both'` and `activeMode` is not provided.        |
| `activeMode`           | `'solid' \| 'gradient'`      | —           | Controlled active mode. When set, the parent owns it — pair with `onModeChange`. Enables custom switchers. |
| `onModeChange`         | `(mode: 'solid' \| 'gradient') => void` | —  | Called when the active mode changes.                                                 |
| `hideModeSwitcher`     | `boolean`                    | `false`     | Hides the built-in solid/gradient switcher (e.g. when supplying your own).           |
| `classNames`           | `ReactColorPickerClassNames` | —           | Custom class names for individual parts of the picker.                               |
| `styles`               | `ReactColorPickerStyles`     | —           | Inline style overrides for individual parts of the picker.                           |
| `hideEyedrop`          | `boolean`                    | `false`     | Hides the eyedropper button.                                                         |
| `hideOpacityControl`   | `boolean`                    | `false`     | Hides the alpha/opacity slider.                                                      |

### `ReactColorPickerClassNames` / `ReactColorPickerStyles`

Both `classNames` and `styles` share the same slot names:

| Slot                 | Targets                                      |
| -------------------- | -------------------------------------------- |
| `root`               | The outer wrapper                            |
| `saturation`         | The saturation/brightness panel              |
| `saturationPointer`  | The draggable thumb on the saturation panel  |
| `hue`                | The hue slider                               |
| `huePointer`         | The draggable thumb on the hue slider        |
| `alpha`              | The alpha slider                             |
| `alphaPointer`       | The draggable thumb on the alpha slider      |

## Solid & gradient modes

By default the picker offers both solid and gradient modes with a built-in switcher.

```tsx
// Both modes, starting on gradient
<ReactColorPicker value={color} onChange={setColor} defaultMode="gradient" />

// Lock to a single mode (switcher is hidden automatically)
<ReactColorPicker value={color} onChange={setColor} mode="solid" />
```

### Bring your own switcher

Hide the built-in switcher and drive the mode yourself with the controlled
`activeMode` / `onModeChange` pair:

```tsx
const [color, setColor] = useState('#ff0000')
const [mode, setMode] = useState<'solid' | 'gradient'>('solid')

return (
  <>
    <button onClick={() => setMode('solid')} aria-pressed={mode === 'solid'}>
      Solid
    </button>
    <button onClick={() => setMode('gradient')} aria-pressed={mode === 'gradient'}>
      Gradient
    </button>

    <ReactColorPicker
      value={color}
      onChange={setColor}
      activeMode={mode}
      onModeChange={setMode}
      hideModeSwitcher
    />
  </>
)
```

When `activeMode` is provided the picker is controlled: switching modes still
carries the color across and emits the value in the new format via `onChange`.

## Customization

### Override styles with `styles`

```tsx
<ReactColorPicker
  value={color}
  onChange={setColor}
  styles={{
    root: { background: 'transparent', padding: 0 },
    saturation: { borderRadius: 4 },
    saturationPointer: { border: '2px solid #fff' },
    hue: { borderRadius: 4 },
    huePointer: { border: '2px solid #fff' },
    alpha: { borderRadius: 4 },
    alphaPointer: { border: '2px solid #fff' },
  }}
/>
```

### Override styles with `classNames`

```tsx
<ReactColorPicker
  value={color}
  onChange={setColor}
  classNames={{
    root: 'my-picker',
    saturation: 'my-picker__saturation',
    saturationPointer: 'my-picker__saturation-thumb',
    hue: 'my-picker__hue',
    huePointer: 'my-picker__hue-thumb',
    alpha: 'my-picker__alpha',
    alphaPointer: 'my-picker__alpha-thumb',
  }}
/>
```

## Keyboard support

Each slider is focusable and supports keyboard navigation:

| Slider | Keys |
| --- | --- |
| Saturation/brightness | Arrow Left / Right adjusts saturation, Arrow Up / Down adjusts brightness |
| Hue | Arrow Left / Down decreases hue, Arrow Right / Up increases hue |
| Alpha | Arrow Left / Down decreases alpha, Arrow Right / Up increases alpha |

Hold `Shift` for a 10× step on any slider.

## License

MIT
