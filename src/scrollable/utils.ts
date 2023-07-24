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
  const propStr = el.getAttribute(prop) || el.dataset[prop] || '0';

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

export function getItemRect(el: HTMLElement, runtime = true) {
  const ret = (w: number, h: number) => {
    return {
      width: w,
      height: h,
    };
  };

  if (!runtime) {
    return ret(getPropPxValue(el, 'width'), getPropPxValue(el, 'height'));
  }

  if (el.getBoundingClientRect && el.getBoundingClientRect()?.width > 0 && el.getBoundingClientRect()?.height > 0) {
    return ret(el.getBoundingClientRect().width, el.getBoundingClientRect().height);
  }

  if (el.offsetWidth > 0 && el.offsetHeight > 0) {
    return ret(el.offsetWidth, el.offsetHeight);
  }

  if (getComputedStyle(el).width && getComputedStyle(el).height) {
    const w = getComputedStyle(el).width;
    const h = getComputedStyle(el).height;

    if (parseFloat(w) > 0 && parseFloat(h) > 0) {
      return ret(getDerivedPx(w), getDerivedPx(h));
    }
  }

  // fallback
  if (getPropPxValue(el, 'width') > 0 && getPropPxValue(el, 'height') > 0) {
    return ret(getPropPxValue(el, 'width'), getPropPxValue(el, 'height'));
  }

  return ret(0, 0);
}
