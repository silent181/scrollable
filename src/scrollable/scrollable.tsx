import {
  useEffect,
  useRef,
  cloneElement,
  forwardRef,
  ForwardedRef,
  useImperativeHandle,
  useMemo,
  ReactElement,
  CSSProperties,
} from 'react';

import './index.css';
import { ScrollableInstance, ScrollableProps } from './type';
import { Controller } from './controller';

const defaultScrollbarProps: ScrollableProps['scrollbar'] = {
  size: 6,
  margin: 2,
  disableInteraction: false,
  backgroundColor: '#999',
};

const scrollbarId = 'J_scrollbar';

const InternalScrollable = (props: ScrollableProps, ref: ForwardedRef<ScrollableInstance>) => {
  const { scrollbar, onScroll, direction, id, children } = props;
  const { size, margin, disableInteraction, backgroundColor, imgSrc, borderRadius } = {
    ...defaultScrollbarProps,
    ...scrollbar,
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const flexContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller>();

  const onScrollRef = useRef(onScroll);

  const methods = useMemo(() => {
    return {
      getContainer: () => containerRef.current,
      getFlexContainer: () => flexContainerRef.current,
      getController: () => controllerRef.current,
      getScrollbar: () => containerRef.current!.querySelector(`#${scrollbarId}`),
      scroll: (len: number) => {
        controllerRef.current?.scroll(len);
      },
    };
  }, []);

  useEffect(() => {
    const flexContainerEl = flexContainerRef.current!;
    const scrollbarEl = scrollbarRef.current!;

    const controller = new Controller({
      flexContainer: flexContainerEl,
      scrollbar: scrollbarEl,
      direction,
      onScrollRef,
    });

    controllerRef.current = controller;
    controller.register(id);

    const handleStart = (e: any) => {
      controller.handleContainerStart(e);
    };

    const handleScrollbarStart = (e: any) => {
      if (disableInteraction) {
        return;
      }

      controller.handleScrollbarStart(e);
    };

    const handleMove = (e: any) => {
      controller.handleMove(e);
      controller.handleScrollbarMove(e);
    };

    const handleEnd = () => {
      controller.handleEnd();
    };

    const handleWheel = (e: any) => {
      controller.handleWheel(e);
    };

    flexContainerEl.addEventListener('mousedown', handleStart);
    flexContainerEl.addEventListener('touchstart', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
    scrollbarEl.addEventListener('mousedown', handleScrollbarStart);
    scrollbarEl.addEventListener('touchstart', handleScrollbarStart);

    if (direction === 'y') {
      flexContainerEl.addEventListener('wheel', handleWheel);
    }

    return () => {
      flexContainerEl.removeEventListener('mousedown', handleStart);
      flexContainerEl.removeEventListener('touchstart', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      scrollbarEl.removeEventListener('mousedown', handleScrollbarStart);
      scrollbarEl.removeEventListener('touchstart', handleScrollbarStart);
      flexContainerEl.removeEventListener('wheel', handleWheel);

      controller.unregister(id);
    };
  }, [direction, disableInteraction, methods, id]);

  useImperativeHandle(ref, () => methods);

  const getBarStyle = () => {
    let styles: CSSProperties = {
      backgroundColor,
      borderRadius,
      cursor: disableInteraction ? undefined : 'pointer',
    };

    if (direction === 'x') {
      styles = {
        ...styles,
        height: size,
        bottom: margin,
      };
    }

    if (direction === 'y') {
      styles = {
        ...styles,
        width: size,
        right: margin,
        top: 0,
      };
    }

    return styles;
  };

  return (
    <div className="scrollable-wrapper" ref={containerRef} onDragStart={(e) => e.preventDefault()} data-scroll-id={id}>
      {cloneElement(children as ReactElement, { ref: flexContainerRef })}
      <div
        id={scrollbarId}
        className="scrollable-scrollbar"
        data-sb-methods={methods}
        ref={scrollbarRef}
        style={getBarStyle()}
      >
        {imgSrc ? <img className="scrollable-scrollbar-img" src={imgSrc} /> : null}
      </div>
    </div>
  );
};

const Scrollable = forwardRef(InternalScrollable);

export default Scrollable;
