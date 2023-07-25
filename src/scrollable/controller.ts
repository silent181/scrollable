import { MutableRefObject } from 'react';

import { BaseInfo, ScrollDirection, ScrollCallback, ScrollInfo, ControllerOptions } from './type';

import { scrollManager } from './manager';
import { getDerivedPx, getValueStr, raf, removeStyle, getItemRect } from './utils';

export class Controller {
  target: HTMLElement;
  scrollbarThumb: HTMLElement;
  scrollbarWrapper: HTMLElement;
  wrapper: HTMLElement;
  container: HTMLElement;
  info: BaseInfo;
  direction: ScrollDirection;
  forceUpdate: () => void;

  onScroll?: MutableRefObject<ScrollCallback | undefined>;

  private _scrollValue = 0;
  private isTransitioning = false;
  private containerScrolling = false;
  private scrollbarScrolling = false;
  private lastScrollValue = 0;
  private startPosition: ScrollInfo = { x: undefined, y: undefined };
  private getValueStr: (value: number) => string;
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
    this._scrollValue = 0;
    this.unit = options.unit || 'px';
    this.getValueStr = getValueStr.bind(this, this.unit);

    this.info = this.getBaseInfo();
  }

  get scrollValue() {
    return this._scrollValue;
  }

  set scrollValue(value: number) {
    this._scrollValue = value;
    this.moveWrapper();
    this.moveScrollbar();
    this.onScroll?.current?.({
      x: this.direction === 'x' ? value : undefined,
      y: this.direction === 'y' ? value : undefined,
    });
  }

  private get viewportProp() {
    return this.mutuallyExclusive('width', 'height');
  }

  private get viewportCounterProp() {
    return this.mutuallyExclusive('height', 'width');
  }

  private get eventProp() {
    return this.mutuallyExclusive('clientX', 'clientY');
  }

  private get extraPaddingProp() {
    return this.mutuallyExclusive('paddingLeft', 'paddingTop');
  }

  private get scrollbarOffsetProp() {
    return this.mutuallyExclusive('left', 'top');
  }

  private get scrollbarBoundary() {
    return this.mutuallyExclusive(['left', 'right'] as const, ['top', 'bottom'] as const);
  }

  init = (cb?: (noScroll: boolean) => void) => {
    if (this.info.noScroll) {
      this.scrollbarWrapper.style.display = 'none';
      removeStyle(this.wrapper, 'transform');
    } else {
      this.scrollbarThumb.style[this.viewportProp] = this.info.thumbLengthPercent;
      this.scrollbarWrapper.style.display = 'block';
      this.wrapper.style[this.viewportProp] = this.getValueStr(this.info.totalLength);
      this.wrapper.style[this.viewportCounterProp] = '100%';
      this.wrapper.style.backgroundColor = getComputedStyle(this.target).backgroundColor;
    }

    this.container.style.width = this.getValueStr(this.getContainerRect().width);
    this.container.style.height = this.getValueStr(this.getContainerRect().height);

    cb?.(this.info.noScroll);
  };

  handleContainerStart = (e: any) => {
    this.startScroll(e, 'container');
  };

  handleScrollbarStart = (e: any) => {
    this.startScroll(e, 'scrollbarThumb');
    this.scrollbarThumb.style.opacity = '1';
  };

  handleMove = (e: any) => {
    if (!this.containerScrolling) {
      return;
    }

    const diff = this.getEventPosition(e) - this.getStartPosition();

    const value = this.lastScrollValue + diff;

    this.doScroll(value);
  };

  handleScrollbarMove = (e: any) => {
    if (!this.scrollbarScrolling) {
      return;
    }

    const diff = this.getEventPosition(e) - this.getStartPosition();

    this.doScrollbarScroll(diff);
  };

  handleEnd = () => {
    this.scrollbarScrolling = false;
    this.containerScrolling = false;
    removeStyle(this.scrollbarThumb, 'opacity');
  };

  handleWheel = (e: WheelEvent) => {
    if (this.containerScrolling || this.scrollbarScrolling) {
      return;
    }

    const nextScrollValue = this.scrollValue - e.deltaY;
    this.doScroll(nextScrollValue, true);
  };

  handleBarClick = (e: any) => {
    if (e.target === this.scrollbarThumb || this.scrollbarThumb.contains(e.target)) {
      return;
    }

    const position = this.getEventPosition(e);

    this.scrollTo(position);
  };

  scroll = (relativeValue: number, animation = true) => {
    if (this.isTransitioning || this.info.noScroll) {
      return;
    }

    const computedValue = this.scrollValue - relativeValue;

    this.withAmination(animation)(() => this.doScroll(computedValue, true));
  };

  scrollToStart = (animation = true) => {
    this.withAmination(animation)(() => {
      this.doScroll(0);
    });
  };

  scrollToEnd = (animation = true) => {
    this.withAmination(animation)(() => {
      this.doScroll(-this.info.scrollLength);
    });
  };

  register = (key: string) => {
    scrollManager.register(key, this);
  };

  unregister = (key: string) => {
    scrollManager.unregister(key);
  };

  private mutuallyExclusive = <X, Y>(xVal: X, yVal: Y) => {
    if (typeof xVal === 'function' && typeof yVal === 'function') {
      if (this.direction === 'x') {
        xVal();
      } else {
        yVal();
      }
    }

    return this.direction === 'x' ? xVal : yVal;
  };

  private withAmination = (animation = true) => {
    return (action: () => void) => {
      if (animation) {
        this.startTransition();
      }

      action();

      if (animation) {
        this.endTransition();
      }
    };
  };

  /**
   * container rect should be constant
   */
  private getContainerRect = () => {
    return getItemRect(this.target, false);
  };

  /**
   * calc "paddingLeft" in direction x or "paddingTop" in direction y
   */
  private getExtraPadding = () => {
    const paddingStr = getComputedStyle(this.target)[this.extraPaddingProp];
    if (parseFloat(paddingStr) > 0) {
      return getDerivedPx(paddingStr);
    }

    return 0;
  };

  private getBaseInfo = () => {
    const getItemLength = (item: HTMLElement) => {
      const { width, height } = getItemRect(item);

      const calcMargin = (item: HTMLElement) => {
        const style = getComputedStyle(item);

        const top = (style.marginTop || style['margin-top' as keyof CSSStyleDeclaration]) as string;
        const right = (style.marginRight || style['margin-right' as keyof CSSStyleDeclaration]) as string;
        const bottom = (style.marginBottom || style['margin-bottom' as keyof CSSStyleDeclaration]) as string;
        const left = (style.marginLeft || style['margin-left' as keyof CSSStyleDeclaration]) as string;

        return {
          top: getDerivedPx(top),
          right: getDerivedPx(right),
          bottom: getDerivedPx(bottom),
          left: getDerivedPx(left),
        };
      };

      const margins = calcMargin(item);

      return this.mutuallyExclusive(width + margins.left + margins.right, height + margins.top + margins.bottom);
    };

    const targetItems = (this.target?.children ? Array.from(this.target.children) : []) as HTMLElement[];
    const totalLength = targetItems.reduce((sum, cur) => sum + getItemLength(cur), 0) + this.getExtraPadding();
    const containerLength = this.getContainerRect()[this.viewportProp];
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

    return this.mutuallyExclusive(p.x!, p.y!);
  };

  private setStartPosition = (value: number) => {
    this.mutuallyExclusive(
      () => {
        this.startPosition.x = value;
      },
      () => {
        this.startPosition.y = value;
      }
    );
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
    this.scrollbarThumb.style.transition = `transform ${this.transitionTime / 1000}s`;
  };

  private endTransition = () => {
    setTimeout(() => {
      removeStyle(this.scrollbarThumb, 'transition');
      removeStyle(this.wrapper, 'transition');
      this.isTransitioning = false;
    }, this.transitionTime + 100);
  };

  private moveWrapper = () => {
    raf(() => {
      this.wrapper.style.transform = `translate${this.direction.toUpperCase()}(${this.getValueStr(this.scrollValue)})`;
    });
  };

  private moveScrollbar = () => {
    const ratio = this.info.thumbScrollRatio;

    raf(() => {
      this.scrollbarThumb.style.transform = `translate${this.direction.toUpperCase()}(${this.getValueStr(
        -this.scrollValue * ratio
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
  };

  private doScrollbarScroll = (diff: number) => {
    if ((diff > 0 && this.scrollValue === this.info.scrollLength) || (diff < 0 && this.scrollValue === 0)) {
      return;
    }

    const computedValue = this.lastScrollValue + -diff / this.info.thumbScrollRatio;

    this.doScroll(computedValue);
  };

  private scrollTo = (targetPosition: number) => {
    const thumbLen = this.info.thumbLength;
    const scrollbarRect = this.scrollbarWrapper.getBoundingClientRect();
    const [boundaryStartProp, boundaryEndProp] = this.scrollbarBoundary;
    const minPosition = scrollbarRect[boundaryStartProp] + thumbLen / 2;
    const maxPosition = scrollbarRect[boundaryEndProp] - thumbLen / 2;

    if (targetPosition <= minPosition) {
      this.scrollToStart();
    } else if (targetPosition >= maxPosition) {
      this.scrollToEnd();
    } else {
      const thumbRect = this.scrollbarThumb.getBoundingClientRect();
      const thumbOffset = thumbRect[this.scrollbarOffsetProp];
      const targetThumbOffset = targetPosition - thumbLen / 2;
      const diff = targetThumbOffset - thumbOffset;
      const computedValue = -Math.abs(this.scrollValue - diff / this.info.thumbScrollRatio);

      this.withAmination()(() => this.doScroll(computedValue, true));
    }
  };
}
