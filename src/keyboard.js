const DIGIT = /^\d$/;

/**
 * Maps a physical key to a calculator action. Returns null for keys we do not
 * handle. Kept pure so the mapping can be unit tested.
 */
export function resolveKey(key) {
  if (typeof key !== 'string' || key.length === 0) return null;
  if (DIGIT.test(key)) return { action: 'digit', value: key };

  switch (key) {
    case '.':
    case ',':
      return { action: 'decimal' };
    case '+':
      return { action: 'operator', value: '+' };
    case '-':
      return { action: 'operator', value: '-' };
    case '*':
    case 'x':
    case 'X':
      return { action: 'operator', value: '*' };
    case '/':
      return { action: 'operator', value: '/' };
    case '=':
    case 'Enter':
      return { action: 'equals' };
    case 'Escape':
      return { action: 'clear-all' };
    case 'Delete':
      return { action: 'clear-entry' };
    case 'Backspace':
      return { action: 'backspace' };
    case '%':
      return { action: 'percent' };
    case 'r':
    case 'R':
      return { action: 'unary', value: 'sqrt' };
    case 's':
    case 'S':
      return { action: 'unary', value: 'square' };
    case 'i':
    case 'I':
      return { action: 'unary', value: 'reciprocal' };
    case 'm':
    case 'M':
      return { action: 'memory', value: 'recall' };
    default:
      return null;
  }
}
