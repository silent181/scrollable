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
    return `${px / parseFloat(fontSize)}rem`;
  }

  return '0rem';
};

const rem2Px = (rem: number) => {
  const fontSize = document.documentElement.style.fontSize;

  if (fontSize) {
    return rem * parseFloat(fontSize);
  }

  return 0;
};

export class Controller {
  flexContainer: HTMLElement;
  scrollbarThumb: HTMLElement;
  scrollbarWrapper: HTMLElement;
  info: BaseInfo;
  direction: ScrollDirection;
  forceUpdate: () => void;

  onScroll?: MutableRefObject<ScrollCallback | undefined>;

  private isTransition = false;
  private containerScrolling = false;
  private scrollbarScrolling = false;
  private scrollValue = 0;
  private lastScrollValue = 0;
  private startPosition: ScrollInfo = { x: undefined, y: undefined };
  private transitionTime: number;
  private unit?: ControllerOptions['unit'];

  constructor(options: ControllerOptions) {
    this.flexContainer = options.flexContainer;
    this.scrollbarWrapper = options.flexContainer.nextElementSibling as HTMLElement;
    this.scrollbarThumb = options.scrollbarThumb;
    this.direction = options.direction;
    this.onScroll = options.onScrollRef;
    this.transitionTime = options.transitionTime || 200;
    this.forceUpdate = options.forceUpdate;
    this.unit = options.unit || 'px';

    this.info = this.getBaseInfo();
    console.log(this.info, 'info');
  }

  public init = () => {
    this.scrollbarThumb.style[this.info.scrollbarProp] = this.info.thumbLengthPercent;
    this.flexContainer?.classList?.add('__flex_container__');
    this.scrollbarWrapper.style.display = 'block';
  };

  public setNoScroll = () => {
    this.flexContainer?.classList?.remove('__flex_container__');
    this.scrollbarWrapper.style.display = 'none';
    this.info.flexItems.forEach((el) => this.removeProperty(el, 'transform'));
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
    this.removeProperty(this.scrollbarThumb, 'opacity');
  };

  public handleWheel = (e: WheelEvent) => {
    if (this.containerScrolling || this.scrollbarScrolling) {
      return;
    }

    const nextScrollValue = this.scrollValue - e.deltaY;
    this.doScroll(nextScrollValue, true);
  };

  public scroll = (relativeValue: number) => {
    if (this.isTransition || this.info.noScroll) {
      return;
    }

    const computedValue = this.scrollValue - relativeValue;

    this.startTransition();
    this.doScroll(computedValue, true);
    this.endTransition();
  };

  public register = (key: string) => {
    scrollManager.register(key, this);
  };

  public unregister = (key: string) => {
    scrollManager.unregister(key);
  };

  private getBaseInfo = () => {
    const getItemLength = (item: HTMLElement) => {
      const { width, height } = item.getBoundingClientRect();

      const calcMargin = (item: HTMLElement) => {
        const getValueByProperty = (propVal: string) => {
          const numberVal = parseFloat(propVal);

          if (propVal.includes('rem')) {
            return rem2Px(numberVal);
          }

          return numberVal;
        };

        const style = window.getComputedStyle(item);

        const top = (style.marginTop || style['margin-top' as keyof CSSStyleDeclaration]) as string;
        const right = (style.marginRight || style['margin-right' as keyof CSSStyleDeclaration]) as string;
        const bottom = (style.marginBottom || style['margin-bottom' as keyof CSSStyleDeclaration]) as string;
        const left = (style.marginLeft || style['margin-left' as keyof CSSStyleDeclaration]) as string;

        return {
          top: getValueByProperty(top),
          right: getValueByProperty(right),
          bottom: getValueByProperty(bottom),
          left: getValueByProperty(left),
        };
      };

      const margins = calcMargin(item);

      if (this.direction === 'x') {
        return width + margins.left + margins.right;
      }

      return height + margins.top + margins.bottom;
    };

    const flexItems = (this.flexContainer?.children ? Array.from(this.flexContainer.children) : []) as HTMLElement[];
    const totalLength = flexItems.reduce((sum, cur) => sum + getItemLength(cur), 0);
    const scrollbarProp = this.direction === 'x' ? 'width' : 'height';
    const containerLength = this.flexContainer.getBoundingClientRect()[scrollbarProp];
    const scrollLength = totalLength - containerLength;
    const thumbLength = containerLength * (containerLength / totalLength);
    const thumbLengthPercent = `${(100 * containerLength) / totalLength}%`;
    const thumbScrollLength = containerLength - thumbLength;
    const thumbScrollRatio = thumbScrollLength / scrollLength;
    const noScroll = totalLength <= containerLength;

    return {
      flexItems,
      scrollbarProp,
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

  private removeProperty = (el: HTMLElement, prop: string) => {
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
    const prop = this.direction === 'x' ? 'clientX' : 'clientY';

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
    this.isTransition = true;
    this.info.flexItems.forEach((el) => {
      el.style.transition = `transform ${this.transitionTime / 1000}s`;
    });
    this.scrollbarThumb.style.transition = `${this.transitionTime / 1000}s`;
  };

  private endTransition = () => {
    setTimeout(() => {
      this.removeProperty(this.scrollbarThumb, 'transition');
      this.info.flexItems.forEach((el) => {
        this.removeProperty(el, 'transition');
      });
      this.isTransition = false;
    }, this.transitionTime + 100);
  };

  private moveItems = (scrollValue: number) => {
    this.info.flexItems.forEach((el) => {
      raf(() => {
        el.style.transform = `translate${this.direction.toUpperCase()}(${this.getScrollValueStr(scrollValue)})`;
      });
    });
  };

  private moveScrollbar = (scrollValue: number) => {
    const ratio = this.info.thumbScrollRatio;

    raf(() => {
      this.scrollbarThumb.style.transform = `translate${this.direction.toUpperCase()}(${this.getScrollValueStr(
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

  private getScrollValueStr = (scrollValue: number) => {
    if (this.unit === 'rem') {
      return `${px2Rem(scrollValue)}rem`;
    }

    return `${scrollValue}px`;
  };
}
