import {
  MAX_ENTRY_DIGITS,
  formatDisplay,
  normalizeNumber,
  numberToEntry,
} from './format.js';

const SYMBOLS = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

const BINARY = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => (b === 0 ? NaN : a / b),
};

const UNARY_LABELS = {
  sqrt: '√',
  square: 'sqr',
  reciprocal: '1/',
  sin: 'sin',
  cos: 'cos',
  tan: 'tan',
};

const NEARLY_ZERO = 1e-12;

function compute(a, b, operator) {
  const fn = BINARY[operator];
  if (!fn || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return normalizeNumber(fn(a, b));
}

/**
 * Pure calculator state machine. It never touches the DOM, which keeps all of
 * the arithmetic and input rules directly testable.
 */
export class Calculator {
  constructor(options = {}) {
    this.memory = 0;
    this.angleMode = options.angleMode === 'RAD' ? 'RAD' : 'DEG';
    this.history = [];
    this.historyLimit = options.historyLimit ?? 50;
    this.reset();
  }

  reset() {
    this.entry = '0';
    this.accumulator = null;
    this.pendingOp = null;
    this.waitingForOperand = true;
    this.lastOperator = null;
    this.lastOperand = null;
    this.error = false;
    this.expression = '';
    this.entryDirty = false;
  }

  get value() {
    return Number(this.entry);
  }

  get display() {
    return this.error ? 'Error' : formatDisplay(this.entry);
  }

  inputDigit(digit) {
    if (!/^\d$/.test(digit)) return;
    if (this.error) this.reset();

    if (this.waitingForOperand) {
      this.entry = digit;
      this.waitingForOperand = false;
      this.entryDirty = true;
      if (this.lastOperator !== null) this.expression = '';
      this.lastOperator = null;
      this.lastOperand = null;
      return;
    }

    const digitCount = this.entry.replace(/[-.]/g, '').replace(/^0+/, '').length;
    if (digitCount >= MAX_ENTRY_DIGITS) return;

    if (this.entry === '0') this.entry = digit;
    else if (this.entry === '-0') this.entry = `-${digit}`;
    else this.entry += digit;
    this.entryDirty = true;
  }

  inputDecimal() {
    if (this.error) this.reset();

    if (this.waitingForOperand) {
      this.entry = '0.';
      this.waitingForOperand = false;
      this.entryDirty = true;
      if (this.lastOperator !== null) this.expression = '';
      this.lastOperator = null;
      this.lastOperand = null;
      return;
    }

    if (!this.entry.includes('.') && !/[eE]/.test(this.entry)) {
      this.entry += '.';
      this.entryDirty = true;
    }
  }

  chooseOperator(operator) {
    if (!BINARY[operator]) return;
    if (this.error) this.reset();

    let left = this.accumulator;
    if (this.pendingOp !== null && this.entryDirty) {
      const result = compute(left, this.value, this.pendingOp);
      if (result === null) {
        this.fail();
        return;
      }
      left = result;
      this.entry = numberToEntry(result);
    } else if (left === null) {
      left = this.value;
    }

    this.accumulator = left;
    this.pendingOp = operator;
    this.waitingForOperand = true;
    this.entryDirty = false;
    this.lastOperator = null;
    this.lastOperand = null;
    this.expression = `${formatDisplay(left)} ${SYMBOLS[operator]}`;
  }

  equals() {
    if (this.error) return;

    if (this.pendingOp !== null && this.accumulator !== null) {
      const operator = this.pendingOp;
      const left = this.accumulator;
      const right = this.value;
      const result = compute(left, right, operator);
      if (result === null) {
        this.fail();
        return;
      }

      const expression = `${formatDisplay(left)} ${SYMBOLS[operator]} ${formatDisplay(right)}`;
      this.record(expression, result);
      this.expression = `${expression} =`;
      this.entry = numberToEntry(result);
      this.lastOperator = operator;
      this.lastOperand = right;
      this.accumulator = null;
      this.pendingOp = null;
      this.waitingForOperand = true;
      this.entryDirty = false;
      return;
    }

    if (this.lastOperator !== null && this.lastOperand !== null) {
      const operator = this.lastOperator;
      const left = this.value;
      const right = this.lastOperand;
      const result = compute(left, right, operator);
      if (result === null) {
        this.fail();
        return;
      }

      const expression = `${formatDisplay(left)} ${SYMBOLS[operator]} ${formatDisplay(right)}`;
      this.record(expression, result);
      this.expression = `${expression} =`;
      this.entry = numberToEntry(result);
      this.waitingForOperand = true;
      this.entryDirty = false;
    }
  }

  clearAll() {
    this.reset();
  }

  clearEntry() {
    if (this.error) {
      this.reset();
      return;
    }
    this.entry = '0';
    this.waitingForOperand = true;
    this.entryDirty = true;
  }

  toggleSign() {
    if (this.error) this.reset();
    this.entryDirty = true;

    if (this.entry === '0') {
      this.entry = '-0';
      this.waitingForOperand = false;
      return;
    }
    if (this.entry === '-0') {
      this.entry = '0';
      this.waitingForOperand = false;
      return;
    }
    this.entry = this.entry.startsWith('-') ? this.entry.slice(1) : `-${this.entry}`;
  }

  backspace() {
    if (this.error) {
      this.reset();
      return;
    }
    if (this.waitingForOperand) return;

    this.entry = this.entry.slice(0, -1);
    if (this.entry === '' || this.entry === '-' || this.entry === '-0') this.entry = '0';
    this.entryDirty = true;
  }

  percent() {
    if (this.error) this.reset();

    let value = this.value;
    if (
      this.accumulator !== null &&
      (this.pendingOp === '+' || this.pendingOp === '-')
    ) {
      value = (this.accumulator * value) / 100;
    } else {
      value /= 100;
    }

    const result = normalizeNumber(value);
    if (result === null) {
      this.fail();
      return;
    }
    this.entry = numberToEntry(result);
    this.waitingForOperand = false;
    this.entryDirty = true;
    this.lastOperator = null;
    this.lastOperand = null;
  }

  unary(kind) {
    if (this.error) this.reset();

    const value = this.value;
    let result;

    switch (kind) {
      case 'sqrt':
        result = value < 0 ? NaN : Math.sqrt(value);
        break;
      case 'square':
        result = value * value;
        break;
      case 'reciprocal':
        result = value === 0 ? NaN : 1 / value;
        break;
      case 'sin':
        result = Math.sin(this.toRadians(value));
        if (Math.abs(result) < NEARLY_ZERO) result = 0;
        break;
      case 'cos':
        result = Math.cos(this.toRadians(value));
        if (Math.abs(result) < NEARLY_ZERO) result = 0;
        break;
      case 'tan':
        result = this.tangent(value);
        break;
      default:
        return;
    }

    const normalized = normalizeNumber(result);
    if (normalized === null) {
      this.fail();
      return;
    }

    this.entry = numberToEntry(normalized);
    this.waitingForOperand = true;
    this.entryDirty = true;
    this.lastOperator = null;
    this.lastOperand = null;
    this.expression = `${UNARY_LABELS[kind]}(${formatDisplay(value)})`;
  }

  memoryAdd() {
    if (this.error) this.reset();
    const next = normalizeNumber(this.memory + this.value);
    if (next !== null) this.memory = next;
  }

  memorySubtract() {
    if (this.error) this.reset();
    const next = normalizeNumber(this.memory - this.value);
    if (next !== null) this.memory = next;
  }

  memoryRecall() {
    if (this.error) this.reset();
    this.loadValue(this.memory);
  }

  memoryClear() {
    this.memory = 0;
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    return this.angleMode;
  }

  loadValue(value) {
    const normalized = normalizeNumber(value);
    if (normalized === null) return;
    this.entry = numberToEntry(normalized);
    this.error = false;
    this.waitingForOperand = true;
    this.entryDirty = true;
    this.expression = '';
    this.lastOperator = null;
    this.lastOperand = null;
  }

  clearHistory() {
    this.history.length = 0;
  }

  record(expression, result) {
    this.history.unshift({ expression, result });
    if (this.history.length > this.historyLimit) this.history.pop();
  }

  fail() {
    this.error = true;
    this.entry = '0';
    this.accumulator = null;
    this.pendingOp = null;
    this.waitingForOperand = true;
    this.entryDirty = false;
    this.lastOperator = null;
    this.lastOperand = null;
    this.expression = '';
  }

  toRadians(value) {
    return this.angleMode === 'DEG' ? (value * Math.PI) / 180 : value;
  }

  tangent(value) {
    if (this.angleMode === 'DEG') {
      const mod = ((value % 180) + 180) % 180;
      if (Math.abs(mod - 90) < 1e-9) return NaN;
      return Math.tan(this.toRadians(value));
    }
    if (Math.abs(Math.cos(value)) < 1e-9) return NaN;
    return Math.tan(value);
  }
}
