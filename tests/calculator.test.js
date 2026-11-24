import { describe, expect, it } from 'vitest';
import { Calculator } from '../src/calculator.js';

function enter(calc, text) {
  for (const char of text) {
    if (char === '.') calc.inputDecimal();
    else if (char === '-') calc.toggleSign();
    else calc.inputDigit(char);
  }
  return calc;
}

function make() {
  return new Calculator();
}

describe('basic arithmetic', () => {
  it('adds', () => {
    const calc = enter(make(), '2');
    calc.chooseOperator('+');
    enter(calc, '3');
    calc.equals();
    expect(calc.display).toBe('5');
  });

  it('subtracts into negatives', () => {
    const calc = enter(make(), '9');
    calc.chooseOperator('-');
    enter(calc, '15');
    calc.equals();
    expect(calc.display).toBe('-6');
  });

  it('multiplies', () => {
    const calc = enter(make(), '6');
    calc.chooseOperator('*');
    enter(calc, '7');
    calc.equals();
    expect(calc.display).toBe('42');
  });

  it('divides', () => {
    const calc = enter(make(), '9');
    calc.chooseOperator('/');
    enter(calc, '4');
    calc.equals();
    expect(calc.display).toBe('2.25');
  });

  it('chains left to right', () => {
    const calc = enter(make(), '2');
    calc.chooseOperator('+');
    enter(calc, '3');
    calc.chooseOperator('+');
    enter(calc, '4');
    calc.equals();
    expect(calc.display).toBe('9');
  });

  it('resolves the previous operator when a new one is pressed', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('*');
    enter(calc, '2');
    calc.chooseOperator('-');
    expect(calc.display).toBe('10');
    enter(calc, '4');
    calc.equals();
    expect(calc.display).toBe('6');
  });

  it('supports consecutive division', () => {
    const calc = enter(make(), '100');
    calc.chooseOperator('/');
    enter(calc, '5');
    calc.chooseOperator('/');
    enter(calc, '2');
    calc.equals();
    expect(calc.display).toBe('10');
  });

  it('replaces the pending operator when none follows it', () => {
    const calc = enter(make(), '8');
    calc.chooseOperator('+');
    calc.chooseOperator('*');
    enter(calc, '2');
    calc.equals();
    expect(calc.display).toBe('16');
  });
});

describe('decimal precision', () => {
  it('avoids floating point artefacts', () => {
    const calc = enter(make(), '0.1');
    calc.chooseOperator('+');
    enter(calc, '0.2');
    calc.equals();
    expect(calc.display).toBe('0.3');
  });

  it('limits results to twelve significant digits', () => {
    const calc = enter(make(), '1');
    calc.chooseOperator('/');
    enter(calc, '3');
    calc.equals();
    expect(calc.display).toBe('0.333333333333');
  });

  it('handles decimals in the middle of a calculation', () => {
    const calc = enter(make(), '2.5');
    calc.chooseOperator('*');
    enter(calc, '4');
    calc.equals();
    expect(calc.display).toBe('10');
  });
});

describe('number entry', () => {
  it('strips leading zeros', () => {
    expect(enter(make(), '007').entry).toBe('7');
  });

  it('ignores a second decimal point', () => {
    expect(enter(make(), '1.2.3').entry).toBe('1.23');
  });

  it('starts a decimal with a leading zero', () => {
    const calc = make();
    calc.inputDecimal();
    expect(calc.entry).toBe('0.');
  });

  it('caps entry at twelve digits', () => {
    const calc = enter(make(), '1234567890123');
    expect(calc.entry).toBe('123456789012');
    expect(calc.display).toBe('123,456,789,012');
  });

  it('backspaces digits down to zero', () => {
    const calc = enter(make(), '123');
    calc.backspace();
    expect(calc.entry).toBe('12');
    calc.backspace();
    calc.backspace();
    expect(calc.entry).toBe('0');
    calc.backspace();
    expect(calc.entry).toBe('0');
  });

  it('toggles the sign of the current entry', () => {
    const calc = enter(make(), '5');
    calc.toggleSign();
    expect(calc.display).toBe('-5');
    calc.toggleSign();
    expect(calc.display).toBe('5');
  });

  it('toggles the sign of zero without breaking entry', () => {
    const calc = make();
    calc.toggleSign();
    expect(calc.display).toBe('-0');
    calc.toggleSign();
    expect(calc.display).toBe('0');
  });
});

describe('clearing', () => {
  it('AC resets the calculation', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('+');
    enter(calc, '3');
    calc.clearAll();
    expect(calc.display).toBe('0');
    expect(calc.pendingOp).toBeNull();
    calc.equals();
    expect(calc.display).toBe('0');
  });

  it('C clears only the current entry and keeps the pending operator', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('+');
    enter(calc, '3');
    calc.clearEntry();
    expect(calc.display).toBe('0');
    enter(calc, '2');
    calc.equals();
    expect(calc.display).toBe('7');
  });

  it('C recovers from an error', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('/');
    enter(calc, '0');
    calc.equals();
    expect(calc.display).toBe('Error');
    calc.clearEntry();
    expect(calc.display).toBe('0');
    expect(calc.error).toBe(false);
  });
});

describe('repeat equals', () => {
  it('repeats the last operation', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('+');
    enter(calc, '3');
    calc.equals();
    expect(calc.display).toBe('8');
    calc.equals();
    expect(calc.display).toBe('11');
    calc.equals();
    expect(calc.display).toBe('14');
  });

  it('repeats multiplication', () => {
    const calc = enter(make(), '2');
    calc.chooseOperator('*');
    enter(calc, '3');
    calc.equals();
    calc.equals();
    expect(calc.display).toBe('18');
  });

  it('stops repeating once a new entry starts', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('+');
    enter(calc, '3');
    calc.equals();
    enter(calc, '9');
    calc.equals();
    expect(calc.display).toBe('9');
  });
});

describe('errors', () => {
  it('reports division by zero', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('/');
    enter(calc, '0');
    calc.equals();
    expect(calc.display).toBe('Error');
    expect(calc.error).toBe(true);
  });

  it('recovers when a new digit is typed', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('/');
    enter(calc, '0');
    calc.equals();
    enter(calc, '7');
    expect(calc.display).toBe('7');
    expect(calc.error).toBe(false);
  });

  it('rejects the square root of a negative number', () => {
    const calc = enter(make(), '1');
    calc.toggleSign();
    calc.unary('sqrt');
    expect(calc.display).toBe('Error');
  });

  it('rejects the reciprocal of zero', () => {
    const calc = make();
    calc.unary('reciprocal');
    expect(calc.display).toBe('Error');
  });

  it('rejects tangent at 90 degrees', () => {
    const calc = enter(make(), '90');
    calc.unary('tan');
    expect(calc.display).toBe('Error');
  });

  it('rejects tangent at pi/2 radians', () => {
    const calc = make();
    calc.toggleAngleMode();
    calc.loadValue(Math.PI / 2);
    calc.unary('tan');
    expect(calc.display).toBe('Error');
  });

  it('reports overflow', () => {
    const calc = make();
    calc.loadValue(1e308);
    calc.chooseOperator('*');
    enter(calc, '10');
    calc.equals();
    expect(calc.display).toBe('Error');
  });

  it('ignores invalid loaded values', () => {
    const calc = make();
    calc.loadValue(Number.POSITIVE_INFINITY);
    expect(calc.display).toBe('0');
    calc.loadValue(Number.NaN);
    expect(calc.display).toBe('0');
  });
});

describe('percent', () => {
  it('converts a bare number to a fraction', () => {
    const calc = enter(make(), '50');
    calc.percent();
    expect(calc.display).toBe('0.5');
  });

  it('applies a percentage of the accumulator for addition', () => {
    const calc = enter(make(), '200');
    calc.chooseOperator('+');
    enter(calc, '10');
    calc.percent();
    calc.equals();
    expect(calc.display).toBe('220');
  });

  it('applies a percentage of the accumulator for subtraction', () => {
    const calc = enter(make(), '200');
    calc.chooseOperator('-');
    enter(calc, '10');
    calc.percent();
    calc.equals();
    expect(calc.display).toBe('180');
  });

  it('treats percent as a plain fraction when multiplying', () => {
    const calc = enter(make(), '200');
    calc.chooseOperator('*');
    enter(calc, '10');
    calc.percent();
    calc.equals();
    expect(calc.display).toBe('20');
  });
});

describe('scientific functions', () => {
  it('takes square roots', () => {
    const calc = enter(make(), '9');
    calc.unary('sqrt');
    expect(calc.display).toBe('3');
  });

  it('squares numbers', () => {
    const calc = enter(make(), '12');
    calc.unary('square');
    expect(calc.display).toBe('144');
  });

  it('takes reciprocals', () => {
    const calc = enter(make(), '4');
    calc.unary('reciprocal');
    expect(calc.display).toBe('0.25');
  });

  it('computes sine in degrees', () => {
    const calc = enter(make(), '30');
    calc.unary('sin');
    expect(calc.display).toBe('0.5');
  });

  it('computes cosine in degrees', () => {
    const calc = enter(make(), '60');
    calc.unary('cos');
    expect(calc.display).toBe('0.5');
  });

  it('snaps tiny trig results to zero', () => {
    const calc = enter(make(), '180');
    calc.unary('sin');
    expect(calc.display).toBe('0');
  });

  it('computes sine in radians after switching mode', () => {
    const calc = make();
    calc.toggleAngleMode();
    calc.loadValue(Math.PI / 2);
    calc.unary('sin');
    expect(calc.display).toBe('1');
  });

  it('computes tangent at 45 degrees', () => {
    const calc = enter(make(), '45');
    calc.unary('tan');
    expect(calc.display).toBe('1');
  });

  it('chains into a following operator', () => {
    const calc = enter(make(), '9');
    calc.chooseOperator('+');
    enter(calc, '16');
    calc.unary('sqrt');
    calc.chooseOperator('*');
    enter(calc, '2');
    calc.equals();
    expect(calc.display).toBe('26');
  });

  it('ignores unknown unary operations', () => {
    const calc = enter(make(), '5');
    calc.unary('nope');
    expect(calc.display).toBe('5');
  });
});

describe('memory', () => {
  it('adds and recalls a value', () => {
    const calc = enter(make(), '5');
    calc.memoryAdd();
    expect(calc.memory).toBe(5);
    calc.clearAll();
    calc.memoryRecall();
    expect(calc.display).toBe('5');
  });

  it('subtracts from memory', () => {
    const calc = enter(make(), '5');
    calc.memoryAdd();
    calc.clearAll();
    enter(calc, '3');
    calc.memorySubtract();
    calc.memoryRecall();
    expect(calc.display).toBe('2');
  });

  it('clears memory', () => {
    const calc = enter(make(), '9');
    calc.memoryAdd();
    calc.memoryClear();
    expect(calc.memory).toBe(0);
    calc.memoryRecall();
    expect(calc.display).toBe('0');
  });

  it('survives AC', () => {
    const calc = enter(make(), '7');
    calc.memoryAdd();
    calc.clearAll();
    expect(calc.memory).toBe(7);
  });
});

describe('angle mode', () => {
  it('toggles between degrees and radians', () => {
    const calc = make();
    expect(calc.angleMode).toBe('DEG');
    expect(calc.toggleAngleMode()).toBe('RAD');
    expect(calc.toggleAngleMode()).toBe('DEG');
  });
});

describe('history', () => {
  it('records completed calculations', () => {
    const calc = enter(make(), '2');
    calc.chooseOperator('+');
    enter(calc, '3');
    calc.equals();
    expect(calc.history).toHaveLength(1);
    expect(calc.history[0]).toEqual({ expression: '2 + 3', result: 5 });
  });

  it('records repeated equals runs', () => {
    const calc = enter(make(), '5');
    calc.chooseOperator('+');
    enter(calc, '3');
    calc.equals();
    calc.equals();
    expect(calc.history).toHaveLength(2);
    expect(calc.history[0].result).toBe(11);
  });

  it('honours the history limit', () => {
    const calc = new Calculator({ historyLimit: 2 });
    for (const value of ['1', '2', '3']) {
      enter(calc, value);
      calc.chooseOperator('+');
      enter(calc, value);
      calc.equals();
    }
    expect(calc.history).toHaveLength(2);
    expect(calc.history[0].expression).toBe('3 + 3');
  });

  it('can be cleared', () => {
    const calc = enter(make(), '1');
    calc.chooseOperator('+');
    enter(calc, '1');
    calc.equals();
    calc.clearHistory();
    expect(calc.history).toHaveLength(0);
  });
});
