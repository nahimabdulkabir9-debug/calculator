# Calculator

A modern calculator web app built with vanilla JavaScript and Vite. No production
dependencies, no framework.

## Features

- Four-function arithmetic with left-to-right chaining and repeat `=`
- Scientific functions: `√`, `x²`, `1/x`, `sin`, `cos`, `tan` with DEG/RAD modes
- Memory keys: `MC`, `MR`, `M+`, `M−`
- Percentage with context-aware behaviour (`200 + 10% = 220`)
- Calculation history with one-click reuse
- Full keyboard support
- Light and dark themes, remembered in `localStorage`
- Copy result to clipboard
- Accessible: semantic buttons, focus rings, `aria-live` results
- Responsive layout for desktop and mobile

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build into dist/
npm run preview   # preview the production build
```

## Tests

```bash
npm test              # run the Vitest suites
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

The suite has three layers:

- `tests/calculator.test.js` — arithmetic, entry rules, errors, memory, history
- `tests/format.test.js` — precision and display formatting
- `tests/keyboard.test.js` — key mapping
- `tests/integration.test.js` — real DOM driven by clicks and keyboard events

## Project structure

```
index.html          Markup and keypad
styles/main.css     Theme tokens, layout, responsive rules
src/calculator.js   Pure state machine (no DOM)
src/format.js       Number precision and display formatting
src/keyboard.js     Keyboard mapping (pure)
src/main.js         DOM wiring, theme, history, clipboard, toast
tests/              Vitest unit and integration suites
```

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `0`–`9` | Digits |
| `.` or `,` | Decimal point |
| `+` `-` `*` `/` | Operators (`x` also multiplies) |
| `Enter` or `=` | Equals |
| `Esc` | Clear all |
| `Delete` | Clear entry |
| `Backspace` | Delete last digit |
| `%` | Percent |
| `R` | Square root |
| `S` | Square |
| `I` | Reciprocal |
| `M` | Memory recall |
