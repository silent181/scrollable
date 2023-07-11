import { CSSProperties, MutableRefObject, ReactNode } from 'react';

export type Direction = 'x' | 'y';

export type ScrollInfo = {
  x: number | undefined;
  y: number | undefined;
};

export type ScrollCallback = (info: ScrollInfo) => void;

export interface ScrollableProps {
  children: ReactNode;
  direction: Direction;
  id: string;
  onScroll?: (scrollInfo: ScrollInfo) => void;
  scrollbar?: {
    size?: number;
    margin?: number;
    disableInteraction?: boolean;
    backgroundColor?: CSSProperties['backgroundColor'];
    imgSrc?: string;
    borderRadius?: number;
  };
  style?: CSSProperties;
}

export type BaseInfo = {
  flexItems: HTMLElement[];
  totalLength: number;
  containerLength: number;
  scrollLength: number;
  thumbLength: number;
  thumbLengthPercent: string;
  thumbScrollLength: number;
  thumbScrollRatio: number;
  scrollbarProp: 'width' | 'height';
  noScroll: boolean;
};

export interface ControllerOptions {
  flexContainer: HTMLElement;
  scrollbarThumb: HTMLElement;
  direction: Direction;
  forceUpdate: () => void;
  onScrollRef?: MutableRefObject<ScrollCallback | undefined>;
  transitionTime?: number;
}

export interface ScrollableInstance {
  scroll: (length: number) => void;
}
