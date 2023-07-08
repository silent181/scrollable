import { MutableRefObject } from 'react';
import { BaseInfo, Direction, ScrollCallback, ScrollInfo } from './type';

interface ControllerOptions {
  flexContainer: HTMLElement;
  scrollbar: HTMLElement;
  direction: Direction;
  onScrollRef?: MutableRefObject<ScrollCallback | undefined>;
  transitionTime?: number;
}

export class Controller {
  flexContainer: HTMLElement;
  scrollbar: HTMLElement;
  info: BaseInfo;
  direction: Direction;

  onScroll?: MutableRefObject<ScrollCallback | undefined>;

  private isTransition = false;
  private containerScrolling = false;
  private scrollbarScrolling = false;
  private scrollValue = 0;
  private lastScrollValue = 0;
  private startPosition: ScrollInfo = { x: undefined, y: undefined };
  private transitionTime: number;

  constructor(options: ControllerOptions) {
    this.flexContainer = options.flexContainer;
    this.scrollbar = options.scrollbar;
    this.direction = options.direction;
    this.onScroll = options.onScrollRef;
    this.transitionTime = options.transitionTime || 200;

    this.info = this.getBaseInfo();

    this.init();
  }

  getBaseInfo = () => {
    const flexItems = Array.from(this.flexContainer.children) as HTMLElement[];
    const scrollbarProp = this.direction === 'x' ? 'width' : 'height';
    const totalLength = flexItems.reduce((sum, cur) => sum + cur.getBoundingClientRect()[scrollbarProp], 0);
    const containerLength = this.flexContainer.getBoundingClientRect()[scrollbarProp];
    const scrollLength = totalLength - containerLength;
    const thumbLength = containerLength * (containerLength / totalLength);
    const thumbScrollLength = containerLength - thumbLength;
    const thumbScrollRatio = thumbScrollLength / scrollLength;

    return {
      flexItems,
      scrollbarProp,
      totalLength,
      containerLength,
      scrollLength,
      thumbLength,
      thumbScrollLength,
      thumbScrollRatio,
    } as BaseInfo;
  };

  init = () => {
    this.scrollbar.style[this.info.scrollbarProp] = `${this.info.thumbLength}px`;
    this.flexContainer?.classList?.add('__flex_container__', `__flex_container_${this.direction}__`);
    this.info.flexItems.forEach((el) => {
      el.classList.add('__flex_item__');
    });
  };

  getStartPosition = () => {
    const p = this.startPosition;

    if (this.direction === 'x') {
      return p.x!;
    }

    return p.y!;
  };

  setStartPosition = (value: number) => {
    if (this.direction === 'x') {
      this.startPosition.x = value;
    } else {
      this.startPosition.y = value;
    }
  };

  getEventPosition = (e: MouseEvent | TouchEvent) => {
    const prop = this.direction === 'x' ? 'clientX' : 'clientY';

    if ((e as MouseEvent)[prop]) {
      return (e as MouseEvent)[prop];
    }

    return (e as TouchEvent).touches[0][prop];
  };

  startScroll = (e: any, type: 'container' | 'scrollbar') => {
    if (type === 'container') {
      this.containerScrolling = true;
    } else {
      this.scrollbarScrolling = true;
    }

    this.setStartPosition(this.getEventPosition(e));
    this.lastScrollValue = this.scrollValue;
  };

  startTransition = () => {
    this.isTransition = true;
    this.info.flexItems.forEach((el) => {
      el.style.transition = `${this.transitionTime / 1000}s`;
    });
    this.scrollbar.style.transition = `${this.transitionTime / 1000}s`;
  };

  endTransition = () => {
    setTimeout(() => {
      this.scrollbar.style.removeProperty('transition');
      this.info.flexItems.forEach((el) => {
        el.style.removeProperty('transition');
      });
      this.isTransition = false;
    }, this.transitionTime + 100);
  };

  customScroll = (relativeValue: number) => {
    if (this.isTransition) {
      return;
    }

    const computedValue = this.scrollValue - relativeValue;

    this.startTransition();
    this.doScroll(computedValue, true);
    this.endTransition();
  };

  moveItems = (scrollValue: number) => {
    this.info.flexItems.forEach((el) => {
      el.style.transform = `translate${this.direction.toUpperCase()}(${scrollValue}px)`;
    });
  };

  moveScrollbar = (scrollValue: number) => {
    const ratio = this.info.thumbScrollRatio;

    this.scrollbar.style.transform = `translate${this.direction.toUpperCase()}(${-scrollValue * ratio}px)`;
  };

  doScroll = (value: number, force = false) => {
    if (value > 0 || Math.abs(value) > this.info.scrollLength) {
      if (force) {
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

  doScrollbarScroll = (diff: number) => {
    if ((diff > 0 && this.scrollValue === this.info.scrollLength) || (diff < 0 && this.scrollValue === 0)) {
      return;
    }

    const computedValue = this.lastScrollValue + -diff / this.info.thumbScrollRatio;

    this.doScroll(computedValue);
  };

  handleContainerStart = (e: any) => {
    this.startScroll(e, 'container');
  };

  handleScrollbarStart = (e: any) => {
    this.startScroll(e, 'scrollbar');
    this.scrollbar.style.opacity = '1';
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
    this.scrollbar.style.removeProperty('opacity');
  };

  handleWheel = (e: WheelEvent) => {
    if (this.containerScrolling || this.scrollbarScrolling) {
      return;
    }

    const nextScrollValue = this.scrollValue - e.deltaY;
    this.doScroll(nextScrollValue);
  };
}
