import { MutableRefObject } from 'react';

import { BaseInfo, ScrollDirection, ScrollCallback, ScrollInfo, ControllerOptions } from './type';

import { scrollManager } from './manager';

const raf = (cb: () => void) => {
  if (typeof window.requestAnimationFrame === 'function') {
    requestAnimationFrame(() => cb());
  } else {
    cb();
  }
};

const px2Rem = (px: number) => {
  const fontSize = document.documentElement.style.fontSize;

  if (fontSize) {
    return px / parseFloat(fontSize);
  }

  return px;
};

const rem2Px = (rem: number) => {
  const fontSize = document.documentElement.style.fontSize;

  if (fontSize) {
    return rem * parseFloat(fontSize);
  }

  return rem;
};

export class Controller {
  target: HTMLElement;
  scrollbarThumb: HTMLElement;
  scrollbarWrapper: HTMLElement;
  wrapper: HTMLElement;
  container: HTMLElement;
  info: BaseInfo;
  direction: ScrollDirection;
  forceUpdate: () => void;
  scrollValue = 0;

  onScroll?: MutableRefObject<ScrollCallback | undefined>;

  private isTransitioning = false;
  private containerScrolling = false;
  private scrollbarScrolling = false;
  private lastScrollValue = 0;
  private startPosition: ScrollInfo = { x: undefined, y: undefined };
  private transitionTime: number;
  private unit?: ControllerOptions['unit'];

  constructor(options: ControllerOptions) {
    this.target = options.target;
    this.scrollbarWrapper = options.scrollbarWrapper;
    this.scrollbarThumb = options.scrollbarThumb;
    this.wrapper = options.wrapper;
    this.container = options.container;
    this.direction = options.direction;
    this.onScroll = options.onScrollRef;
    this.transitionTime = options.transitionTime || 200;
    this.forceUpdate = options.forceUpdate;
    this.unit = options.unit || 'px';

    this.info = this.getBaseInfo();
    console.log(this.info, 'info');
  }

  get viewportProp() {
    return this.direction === 'x' ? 'width' : 'height';
  }

  get viewportCounterProp() {
    return this.direction === 'x' ? 'height' : 'width';
  }

  get eventProp() {
    return this.direction === 'x' ? 'clientX' : 'clientY';
  }

  public init = (cb?: (noScroll: boolean) => void) => {
    if (this.info.noScroll) {
      this.scrollbarWrapper.style.display = 'none';
      this.removeStyleProp(this.wrapper, 'transform');
    } else {
      this.scrollbarThumb.style[this.viewportProp] = this.info.thumbLengthPercent;
      this.scrollbarWrapper.style.display = 'block';
      this.wrapper.style[this.viewportProp] = this.getValueStr(this.info.totalLength);
      this.wrapper.style[this.viewportCounterProp] = '100%';
      this.wrapper.style.backgroundColor = getComputedStyle(this.target).backgroundColor;
    }

    this.container.style.width = this.getValueStr(this.getPropPxValue(this.target, 'width'));
    this.container.style.height = this.getValueStr(this.getPropPxValue(this.target, 'height'));

    cb?.(this.info.noScroll);
  };

  public handleContainerStart = (e: any) => {
    this.startScroll(e, 'container');
  };

  public handleScrollbarStart = (e: any) => {
    this.startScroll(e, 'scrollbarThumb');
    this.scrollbarThumb.style.opacity = '1';
  };

  public handleMove = (e: any) => {
    if (!this.containerScrolling) {
      return;
    }

    const diff = this.getEventPosition(e) - this.getStartPosition();

    const value = this.lastScrollValue + diff;

    this.doScroll(value);
  };

  public handleScrollbarMove = (e: any) => {
    if (!this.scrollbarScrolling) {
      return;
    }

    const diff = this.getEventPosition(e) - this.getStartPosition();

    this.doScrollbarScroll(diff);
  };

  public handleEnd = () => {
    this.scrollbarScrolling = false;
    this.containerScrolling = false;
    this.removeStyleProp(this.scrollbarThumb, 'opacity');
  };

  public handleWheel = (e: WheelEvent) => {
    if (this.containerScrolling || this.scrollbarScrolling) {
      return;
    }

    const nextScrollValue = this.scrollValue - e.deltaY;
    this.doScroll(nextScrollValue, true);
  };

  public scroll = (relativeValue: number, animation = true) => {
    if (this.isTransitioning || this.info.noScroll) {
      return;
    }

    const computedValue = this.scrollValue - relativeValue;

    animation && this.startTransition();
    this.doScroll(computedValue, true);
    animation && this.endTransition();
  };

  public register = (key: string) => {
    scrollManager.register(key, this);
  };

  public unregister = (key: string) => {
    scrollManager.unregister(key);
  };

  /**
   * containerLength should always be constant
   */
  private getContainerLength = () => {
    return this.getPropPxValue(this.target, this.viewportProp);
  };

  private getPropPxValue = (el: HTMLElement, prop: string) => {
    const propStr =
      el.getAttribute(prop) ||
      el.dataset[prop] ||
      `${el.getBoundingClientRect?.()?.[prop as 'width' | 'height']}` ||
      '0';

    return this.getDerivedPx(propStr);
  };

  private getBaseInfo = () => {
    const getItemLength = (item: HTMLElement) => {
      const { width, height } = item.getBoundingClientRect();

      const calcMargin = (item: HTMLElement) => {
        const style = window.getComputedStyle(item);

        const top = (style.marginTop || style['margin-top' as keyof CSSStyleDeclaration]) as string;
        const right = (style.marginRight || style['margin-right' as keyof CSSStyleDeclaration]) as string;
        const bottom = (style.marginBottom || style['margin-bottom' as keyof CSSStyleDeclaration]) as string;
        const left = (style.marginLeft || style['margin-left' as keyof CSSStyleDeclaration]) as string;

        return {
          top: this.getDerivedPx(top),
          right: this.getDerivedPx(right),
          bottom: this.getDerivedPx(bottom),
          left: this.getDerivedPx(left),
        };
      };

      const margins = calcMargin(item);

      if (this.direction === 'x') {
        return width + margins.left + margins.right;
      }

      return height + margins.top + margins.bottom;
    };

    const targetItems = (this.target?.children ? Array.from(this.target.children) : []) as HTMLElement[];
    const totalLength = targetItems.reduce((sum, cur) => sum + getItemLength(cur), 0);

    const containerLength = this.getContainerLength();

    const scrollLength = totalLength - containerLength;
    const thumbLength = containerLength * (containerLength / totalLength);
    const thumbLengthPercent = `${(100 * containerLength) / totalLength}%`;
    const thumbScrollLength = containerLength - thumbLength;
    const thumbScrollRatio = thumbScrollLength / scrollLength;
    const noScroll = totalLength <= containerLength;

    return {
      targetItems,
      totalLength,
      containerLength,
      scrollLength,
      thumbLength,
      thumbScrollLength,
      thumbScrollRatio,
      thumbLengthPercent,
      noScroll,
    } as BaseInfo;
  };

  private getStartPosition = () => {
    const p = this.startPosition;

    if (this.direction === 'x') {
      return p.x!;
    }

    return p.y!;
  };

  private removeStyleProp = (el: HTMLElement, prop: string) => {
    if (typeof el.style.removeProperty === 'function') {
      el.style.removeProperty(prop);
    } else {
      el.style[prop as any] = '';
    }
  };

  private setStartPosition = (value: number) => {
    if (this.direction === 'x') {
      this.startPosition.x = value;
    } else {
      this.startPosition.y = value;
    }
  };

  private getEventPosition = (e: MouseEvent | TouchEvent) => {
    const prop = this.eventProp;

    if ((e as MouseEvent)[prop]) {
      return (e as MouseEvent)[prop];
    }

    return (e as TouchEvent).touches[0][prop];
  };

  private startScroll = (e: any, type: 'container' | 'scrollbarThumb') => {
    if (type === 'container') {
      this.containerScrolling = true;
    } else {
      this.scrollbarScrolling = true;
    }

    this.setStartPosition(this.getEventPosition(e));
    this.lastScrollValue = this.scrollValue;
  };

  private startTransition = () => {
    this.isTransitioning = true;
    this.wrapper.style.transition = `transform ${this.transitionTime / 1000}s`;
    this.scrollbarThumb.style.transition = `${this.transitionTime / 1000}s`;
  };

  private endTransition = () => {
    setTimeout(() => {
      this.removeStyleProp(this.scrollbarThumb, 'transition');
      this.removeStyleProp(this.wrapper, 'transition');
      this.isTransitioning = false;
    }, this.transitionTime + 100);
  };

  private moveItems = (scrollValue: number) => {
    raf(() => {
      this.wrapper.style.transform = `translate${this.direction.toUpperCase()}(${this.getValueStr(scrollValue)})`;
    });
  };

  private moveScrollbar = (scrollValue: number) => {
    const ratio = this.info.thumbScrollRatio;

    raf(() => {
      this.scrollbarThumb.style.transform = `translate${this.direction.toUpperCase()}(${this.getValueStr(
        -scrollValue * ratio
      )})`;
    });
  };

  private doScroll = (value: number, once = false) => {
    if (value > 0 || Math.abs(value) > this.info.scrollLength) {
      if (once) {
        value = value > 0 ? 0 : -this.info.scrollLength;
      } else {
        return;
      }
    }

    this.scrollValue = value;

    this.moveItems(value);
    this.moveScrollbar(value);

    this.onScroll?.current?.({
      x: this.direction === 'x' ? value : undefined,
      y: this.direction === 'y' ? value : undefined,
    });
  };

  private doScrollbarScroll = (diff: number) => {
    if ((diff > 0 && this.scrollValue === this.info.scrollLength) || (diff < 0 && this.scrollValue === 0)) {
      return;
    }

    const computedValue = this.lastScrollValue + -diff / this.info.thumbScrollRatio;

    this.doScroll(computedValue);
  };

  private getValueStr = (value: number) => {
    if (this.unit === 'rem') {
      return `${px2Rem(value)}rem`;
    }

    return `${value}px`;
  };

  private getDerivedPx = (stringVal: string) => {
    const numberVal = parseFloat(stringVal);

    if (stringVal.includes('rem')) {
      return rem2Px(numberVal);
    }

    return numberVal;
  };
}
