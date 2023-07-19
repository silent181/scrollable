import { ScrollableProps } from '.';

export function raf(cb: () => void) {
  if (typeof window.requestAnimationFrame === 'function') {
    requestAnimationFrame(() => cb());
  } else {
    cb();
  }
}

export function px2Rem(px: number) {
  const fontSize = document.documentElement.style.fontSize;

  if (fontSize) {
    return px / parseFloat(fontSize);
  }

  return px;
}

export function rem2Px(rem: number) {
  const fontSize = document.documentElement.style.fontSize;

  if (fontSize) {
    return rem * parseFloat(fontSize);
  }

  return rem;
}

export function getDerivedPx(stringVal: string) {
  const numberVal = parseFloat(stringVal);

  if (stringVal.includes('rem')) {
    return rem2Px(numberVal);
  }

  return numberVal;
}

export function getPropPxValue(el: HTMLElement, prop: string) {
  const propStr =
    el.getAttribute(prop) || el.dataset[prop] || `${el.getBoundingClientRect?.()?.[prop as 'width' | 'height']}` || '0';

  return getDerivedPx(propStr);
}

export function getValueStr(unit: ScrollableProps['unit'], value: number) {
  if (unit === 'rem') {
    return `${px2Rem(value)}rem`;
  }

  return `${value}px`;
}

export function removeStyle(el: HTMLElement, prop: string) {
  if (typeof el.style.removeProperty === 'function') {
    el.style.removeProperty(prop);
  } else {
    el.style[prop as any] = '';
  }
}
