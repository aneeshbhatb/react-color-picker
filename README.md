# @aneeshbhat/react-color-picker

A lightweight React color picker component.

This project is currently in early development. The API and features may change as the component evolves.

## Installation

```bash
npm install @aneeshbhat/react-color-picker
```
#### Using Bun:
```bash
bun add @aneeshbhat/react-color-picker
```

## Usage
```jsx
import { useState } from "react";
import { ReactColorPicker } from "@aneeshbhat/react-color-picker";

function App() {
  const [color, setColor] = useState("#ffffff");

  return (
    <div style={{ width: 320, height: 320 }}>
      <ReactColorPicker value={color} onChange={setColor} />
    </div>
  );
}

export default App;
```

## Props
| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | `"#ffffff"` | The selected color value. |
| `onChange` | `(color: string) => void` | `undefined` | Called when the selected color changes. |

## Notes
* The component is controlled by the host application.
* The picker is intended to fit inside the container provided by the host app.
* More options and customization APIs may be added later.

## License

MIT
