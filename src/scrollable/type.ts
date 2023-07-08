import { CSSProperties, ReactNode } from 'react';

export type Direction = 'x' | 'y';

export type ScrollInfo = {
  x: number | undefined;
  y: number | undefined;
};

export type ScrollCallback = (info: ScrollInfo) => void;

export interface ScrollableProps {
  children: ReactNode;
  direction: Direction;
  uniqueKey: string | number;
  onScroll?: (scrollInfo: ScrollInfo) => void;
  scrollbar?: {
    size?: number;
    margin?: number;
    disableInteraction?: boolean;
    backgroundColor?: CSSProperties['backgroundColor'];
    imgSrc?: string;
    borderRadius?: number;
  };
}

export type BaseInfo = {
  flexItems: HTMLElement[];
  totalLength: number;
  containerLength: number;
  scrollLength: number;
  thumbLength: number;
  thumbScrollLength: number;
  thumbScrollRatio: number;
  scrollbarProp: 'width' | 'height';
};
