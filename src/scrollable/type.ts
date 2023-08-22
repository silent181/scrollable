import { CSSProperties, MutableRefObject, ReactElement } from 'react';

export type ScrollDirection = 'x' | 'y';

export type ScrollInfo = {
  x: number | undefined;
  y: number | undefined;
};

export type ScrollCallback = (info: ScrollInfo) => void;

export type ColorByPicker = { r: string; g: string; b: string; a: string };

export interface ScrollableProps {
  children: ReactElement;
  direction: ScrollDirection;
  id: string;
  onScroll?: (scrollInfo: ScrollInfo) => void;
  scrollbar?: {
    size?: number | string;
    margin?: number | string;
    disableInteraction?: boolean;
    backgroundColor?: CSSProperties['backgroundColor'] | ColorByPicker;
    imgSrc?: string;
    borderRadius?: number | string;
    mouseWheelType?: 'auto' | 'always' | 'never';
    alwaysShow?: boolean;
  };
  style?: CSSProperties;
  unit?: 'px' | 'rem';
}

export type BaseInfo = {
  targetItems: HTMLElement[];
  totalLength: number;
  containerLength: number;
  scrollLength: number;
  thumbLength: number;
  thumbLengthPercent: string;
  thumbScrollLength: number;
  thumbScrollRatio: number;
  noScroll: boolean;
};

export interface ControllerOptions {
  target: HTMLElement;
  scrollbarThumb: HTMLElement;
  scrollbarWrapper: HTMLElement;
  wrapper: HTMLElement;
  container: HTMLElement;
  direction: ScrollDirection;
  onScrollRef?: MutableRefObject<ScrollCallback | undefined>;
  transitionTime?: number;
  unit?: ScrollableProps['unit'];
  alwaysShowScrollbar?: boolean;
}

export interface ScrollableInstance {
  scroll: (length: number) => void;
  scrollToStart: (animation?: boolean) => void;
  scrollToEnd: (animation?: boolean) => void;
}
