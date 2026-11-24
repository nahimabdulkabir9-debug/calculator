// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const htmlPath = resolve(process.cwd(), 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const bodyMarkup = html
  .match(/<body[^>]*>([\s\S]*)<\/body>/i)[1]
  .replace(/<script[\s\S]*?<\/script>/gi, '');

const output = () => document.querySelector('[data-output]').textContent;

function clickAction(action, value) {
  const selector =
    value === undefined
      ? `[data-action="${action}"]`
      : `[data-action="${action}"][data-value="${value}"]`;
  const button = document.querySelector(selector);
  if (!button) throw new Error(`Missing button: ${selector}`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function press(key) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function type(digits) {
  for (const char of digits) {
    if (char === '.') clickAction('decimal');
    else clickAction('digit', char);
  }
}

beforeAll(async () => {
  document.body.innerHTML = bodyMarkup;
  vi.resetModules();
  const module = await import('../src/main.js');
  module.initCalculator();
});

beforeEach(() => {
  clickAction('clear-all');
  clickAction('clear-history');
});

describe('rendering and clicking', () => {
  it('calculates with on-screen buttons', () => {
    type('2');
    clickAction('operator', '+');
    type('3');
    clickAction('equals');
    expect(output()).toBe('5');
  });

  it('formats thousands separators', () => {
    type('1234567');
    expect(output()).toBe('1,234,567');
  });

  it('clears with AC', () => {
    type('42');
    clickAction('clear-all');
    expect(output()).toBe('0');
  });
});

describe('keyboard support', () => {
  it('matches the on-screen behaviour', () => {
    press('7');
    press('*');
    press('6');
    press('Enter');
    expect(output()).toBe('42');
  });

  it('supports escape and backspace', () => {
    press('4');
    press('2');
    press('Backspace');
    expect(output()).toBe('4');
    press('Escape');
    expect(output()).toBe('0');
  });
});

describe('scientific and memory controls', () => {
  it('computes square roots from the keypad', () => {
    type('81');
    clickAction('unary', 'sqrt');
    expect(output()).toBe('9');
  });

  it('updates the angle mode button', () => {
    const button = document.querySelector('[data-angle]');
    expect(button.textContent).toBe('DEG');
    clickAction('angle');
    expect(button.textContent).toBe('RAD');
    clickAction('angle');
    expect(button.textContent).toBe('DEG');
  });

  it('stores and recalls memory with a visible badge', () => {
    type('5');
    clickAction('memory', 'add');
    expect(document.querySelector('[data-memory-badge]').hidden).toBe(false);
    clickAction('clear-all');
    clickAction('memory', 'recall');
    expect(output()).toBe('5');
  });

  it('applies percentages', () => {
    type('200');
    clickAction('operator', '+');
    type('10');
    clickAction('percent');
    clickAction('equals');
    expect(output()).toBe('220');
  });
});

describe('history panel', () => {
  it('lists a completed calculation', () => {
    type('2');
    clickAction('operator', '+');
    type('3');
    clickAction('equals');

    const items = document.querySelectorAll('[data-history] li');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toContain('2 + 3');
    expect(items[0].textContent).toContain('= 5');
  });

  it('reuses a history result when clicked', () => {
    type('2');
    clickAction('operator', '+');
    type('3');
    clickAction('equals');
    clickAction('clear-all');
    document.querySelector('[data-history] li button').dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(output()).toBe('5');
  });

  it('clears the history', () => {
    type('1');
    clickAction('operator', '+');
    type('1');
    clickAction('equals');
    clickAction('clear-history');
    expect(document.querySelectorAll('[data-history] li')).toHaveLength(0);
  });
});

describe('theme', () => {
  it('toggles the document theme', () => {
    const before = document.documentElement.dataset.theme;
    clickAction('toggle-theme');
    const after = document.documentElement.dataset.theme;
    expect(after).not.toBe(before);
    expect(['light', 'dark']).toContain(after);
  });
});
