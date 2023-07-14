import { CSSProperties, MutableRefObject, ReactElement } from 'react';

export type ScrollDirection = 'x' | 'y';

export type ScrollInfo = {
  x: number | undefined;
  y: number | undefined;
};

export type ScrollCallback = (info: ScrollInfo) => void;

export interface ScrollableProps {
  children: ReactElement;
  direction: ScrollDirection;
  id: string;
  onScroll?: (scrollInfo: ScrollInfo) => void;
  scrollbar?: {
    size?: number | string;
    margin?: number | string;
    disableInteraction?: boolean;
    backgroundColor?: CSSProperties['backgroundColor'];
    imgSrc?: string;
    borderRadius?: number | string;
  };
  style?: CSSProperties;
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
  forceUpdate: () => void;
  onScrollRef?: MutableRefObject<ScrollCallback | undefined>;
  transitionTime?: number;
  unit?: 'px' | 'rem';
}

export interface ScrollableInstance {
  scroll: (length: number) => void;
}
