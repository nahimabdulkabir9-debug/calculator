import '../styles/main.css';
import { Calculator } from './calculator.js';
import { formatDisplay } from './format.js';
import { resolveKey } from './keyboard.js';

const THEME_KEY = 'calculator-theme';

function prefersLight() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches
  );
}

export function initCalculator(root = document) {
  const app = root.querySelector?.('[data-calculator]');
  if (!app || app.dataset.initialized === 'true') return null;
  app.dataset.initialized = 'true';

  const calc = new Calculator();

  const elements = {
    output: app.querySelector('[data-output]'),
    expression: app.querySelector('[data-expression]'),
    memoryBadge: app.querySelector('[data-memory-badge]'),
    angleButton: app.querySelector('[data-angle]'),
    historyList: app.querySelector('[data-history]'),
    historyEmpty: app.querySelector('[data-history-empty]'),
    toast: document.querySelector('[data-toast]'),
    themeButton: app.querySelector('[data-action="toggle-theme"]'),
    themeIcon: app.querySelector('[data-theme-icon]'),
    themeTarget: document.documentElement,
  };

  let toastTimer = null;

  function renderHistory() {
    const items = calc.history.map((item, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'history__item';
      button.dataset.action = 'recall';
      button.dataset.index = String(index);

      const expression = document.createElement('span');
      expression.className = 'history__expression';
      expression.textContent = item.expression;

      const value = document.createElement('span');
      value.className = 'history__value';
      value.textContent = `= ${formatDisplay(item.result)}`;

      button.append(expression, value);
      li.append(button);
      return li;
    });

    elements.historyList.replaceChildren(...items);
    elements.historyEmpty.hidden = calc.history.length > 0;
  }

  function render() {
    elements.output.textContent = calc.display;
    elements.expression.textContent = calc.expression;
    elements.memoryBadge.hidden = calc.memory === 0;

    elements.angleButton.textContent = calc.angleMode;
    const target = calc.angleMode === 'DEG' ? 'radians' : 'degrees';
    elements.angleButton.setAttribute(
      'aria-label',
      `Angle mode ${calc.angleMode}. Switch to ${target}.`,
    );

    renderHistory();
    elements.output.scrollLeft = elements.output.scrollWidth;
  }

  function applyTheme(theme) {
    elements.themeTarget.dataset.theme = theme;
    if (elements.themeIcon) elements.themeIcon.textContent = theme === 'light' ? '☾' : '☀';
    elements.themeButton?.setAttribute(
      'aria-label',
      theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme',
    );
  }

  function toggleTheme() {
    const next = elements.themeTarget.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }

  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      elements.toast.classList.remove('is-visible');
    }, 1600);
  }

  const installButton = app.querySelector('[data-install]');
  let deferredInstallPrompt = null;

  function isStandalone() {
    return (
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone === true
    );
  }

  function syncInstallButton() {
    if (!installButton) return;
    installButton.hidden = !deferredInstallPrompt || isStandalone();
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    syncInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    syncInstallButton();
    showToast('Calculator installed');
  });

  installButton?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try {
      await deferredInstallPrompt.userChoice;
    } finally {
      deferredInstallPrompt = null;
      syncInstallButton();
    }
  });

  syncInstallButton();

  async function copyResult() {
    const text = calc.error ? 'Error' : calc.entry;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      showToast('Copied to clipboard');
    } catch {
      showToast('Could not copy');
    }
  }

  function handle(action, value) {
    switch (action) {
      case 'digit':
        calc.inputDigit(value);
        break;
      case 'decimal':
        calc.inputDecimal();
        break;
      case 'operator':
        calc.chooseOperator(value);
        break;
      case 'equals':
        calc.equals();
        break;
      case 'clear-all':
        calc.clearAll();
        break;
      case 'clear-entry':
        calc.clearEntry();
        break;
      case 'backspace':
        calc.backspace();
        break;
      case 'sign':
        calc.toggleSign();
        break;
      case 'percent':
        calc.percent();
        break;
      case 'unary':
        calc.unary(value);
        break;
      case 'angle':
        calc.toggleAngleMode();
        break;
      case 'memory':
        if (value === 'add') calc.memoryAdd();
        else if (value === 'subtract') calc.memorySubtract();
        else if (value === 'recall') calc.memoryRecall();
        else if (value === 'clear') calc.memoryClear();
        break;
      case 'clear-history':
        calc.clearHistory();
        break;
      case 'recall': {
        const item = calc.history[Number(value)];
        if (item) calc.loadValue(item.result);
        break;
      }
      case 'toggle-theme':
        toggleTheme();
        break;
      case 'copy':
        copyResult();
        break;
      default:
        return;
    }
    render();
  }

  app.addEventListener('click', (event) => {
    const button = event.target.closest?.('button[data-action]');
    if (!button || !app.contains(button)) return;
    handle(button.dataset.action, button.dataset.value ?? button.dataset.index);
  });

  function onKeydown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const target = event.target;
    const onButton = target instanceof Element && Boolean(target.closest('button'));
    if (onButton && (event.key === 'Enter' || event.key === ' ')) return;

    const mapping = resolveKey(event.key);
    if (!mapping) return;

    event.preventDefault();
    handle(mapping.action, mapping.value);
  }

  document.addEventListener('keydown', onKeydown);

  let storedTheme = null;
  try {
    storedTheme = localStorage.getItem(THEME_KEY);
  } catch {
    /* storage unavailable */
  }
  applyTheme(storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : prefersLight() ? 'light' : 'dark');

  render();
  return { calc, render, handle };
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initCalculator(), { once: true });
  } else {
    initCalculator();
  }
}
