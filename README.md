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

The picker fits the dimensions of its container. `onChange` emits a hex string (`#rrggbb`) when the color is fully opaque, an `rgba(r, g, b, a)` string when the alpha channel is below 100%, or a CSS gradient string in gradient mode.

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
| CSS linear gradient      | `linear-gradient(90deg, #fff 0%, #000 100%)` |
| CSS radial gradient      | `radial-gradient(circle, #fff 0%, #000 100%)` |

Invalid values fall back to `#ffffff`.

## Props

| Prop                   | Type                         | Default     | Description                                                                          |
| ---------------------- |------------------------------| ----------- | ------------------------------------------------------------------------------------ |
| `value`                | `string`                     | see note    | The current color value. Accepts hex, `rgb()`/`rgba()`, `linear-gradient(...)`, or `radial-gradient(...)`. When omitted, defaults to `#ffffff` in solid mode, `linear-gradient(90deg, #fffdf6 0%, #ffe3e3 100%)` for linear gradients, and `radial-gradient(circle, #fffdf6 0%, #ffe3e3 100%)` for radial gradients. |
| `onChange`             | `(color: string) => void`    | —           | Called whenever the color changes. Emits hex when fully opaque, `rgba()` with opacity, or a CSS gradient in gradient mode. |
| `mode`                 | `'solid' \| 'gradient' \| 'both'` | `'both'` | Which modes are available. `'both'` shows the switcher; a single value locks the picker to that mode. |
| `defaultMode`          | `'solid' \| 'gradient'`      | `'solid'`   | Initial active mode when `mode` is `'both'` and `activeMode` is not provided.        |
| `activeMode`           | `'solid' \| 'gradient'`      | —           | Controlled active mode. When set, the parent owns it — pair with `onModeChange`. Enables custom switchers. |
| `onModeChange`         | `(mode: 'solid' \| 'gradient') => void` | —  | Called when the active mode changes.                                                 |
| `hideModeSwitcher`     | `boolean`                    | `false`     | Hides the built-in solid/gradient switcher (e.g. when supplying your own).           |
| `gradientType`         | `'linear' \| 'radial' \| 'both'` | `'both'` | Which gradient types are available. `'both'` shows the switcher in gradient mode; a single value locks the gradient type. |
| `defaultGradientType`  | `'linear' \| 'radial'`       | `'linear'`  | Initial gradient type when `gradientType` is `'both'` and `activeGradientType` is not provided. |
| `activeGradientType`   | `'linear' \| 'radial'`       | —           | Controlled gradient type. When set, the parent owns it — pair with `onGradientTypeChange`. Enables custom switchers. |
| `onGradientTypeChange` | `(type: 'linear' \| 'radial') => void` | — | Called when the active gradient type changes.                                        |
| `hideGradientTypeSwitcher` | `boolean`                | `false`     | Hides the built-in linear/radial switcher (e.g. when supplying your own).            |
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
| `modeToggle`         | The solid/gradient switcher                  |
| `modeThumb`          | The sliding thumb inside the mode switcher   |
| `modeOption`         | A solid/gradient switcher option             |
| `modeOptionActive`   | The active solid/gradient option             |
| `modeInput`          | The visually hidden solid/gradient radio     |
| `gradientTypeToggle` | The linear/radial gradient switcher          |
| `gradientTypeThumb`  | The sliding thumb inside the gradient switcher |
| `gradientTypeOption` | A linear/radial gradient option              |
| `gradientTypeOptionActive` | The active linear/radial option        |
| `gradientTypeInput`  | The visually hidden linear/radial radio      |
| `gradientTypeIcon`   | A linear/radial gradient icon                |

## Solid & gradient modes

By default the picker offers both solid and gradient modes with a built-in switcher.
When gradient mode is active, an icon switcher appears next to the mode switcher for choosing linear or radial gradients.

```tsx
// Both modes, starting on gradient
<ReactColorPicker value={color} onChange={setColor} defaultMode="gradient" />

// Lock to a single mode (switcher is hidden automatically)
<ReactColorPicker value={color} onChange={setColor} mode="solid" />

// Start gradient mode with a radial gradient
<ReactColorPicker
  value={color}
  onChange={setColor}
  defaultMode="gradient"
  defaultGradientType="radial"
/>

// Lock gradient mode to radial gradients (switcher is hidden automatically)
<ReactColorPicker value={color} onChange={setColor} mode="gradient" gradientType="radial" />
```

### Bring your own switcher

Hide the built-in switchers and drive the mode or gradient type yourself with
the controlled prop pairs:

```tsx
const [color, setColor] = useState('#ff0000')
const [mode, setMode] = useState<'solid' | 'gradient'>('solid')
const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear')

return (
  <>
    <button onClick={() => setMode('solid')} aria-pressed={mode === 'solid'}>
      Solid
    </button>
    <button onClick={() => setMode('gradient')} aria-pressed={mode === 'gradient'}>
      Gradient
    </button>
    {mode === 'gradient' && (
      <>
        <button onClick={() => setGradientType('linear')} aria-pressed={gradientType === 'linear'}>
          Linear
        </button>
        <button onClick={() => setGradientType('radial')} aria-pressed={gradientType === 'radial'}>
          Radial
        </button>
      </>
    )}

    <ReactColorPicker
      value={color}
      onChange={setColor}
      activeMode={mode}
      onModeChange={setMode}
      activeGradientType={gradientType}
      onGradientTypeChange={setGradientType}
      hideModeSwitcher
      hideGradientTypeSwitcher
    />
  </>
)
```

When `activeMode` or `activeGradientType` is provided the picker is controlled:
switching still carries the color across and emits the value in the new format
via `onChange`.

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
