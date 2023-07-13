import {
  useEffect,
  useRef,
  cloneElement,
  forwardRef,
  ForwardedRef,
  useImperativeHandle,
  useMemo,
  CSSProperties,
  useState,
} from 'react';
import './index.css';
import { ScrollableInstance, ScrollableProps } from './type';

import { Controller } from './controller';

const defaultScrollbarProps: ScrollableProps['scrollbar'] = {
  size: 6,
  margin: 2,
  borderRadius: 20,
  disableInteraction: false,
  backgroundColor: '#999',
};

const scrollbarId = 'J_scrollbar';

const InternalScrollable = (props: ScrollableProps, ref: ForwardedRef<ScrollableInstance>) => {
  const { scrollbar, onScroll, direction, id, children, style } = props;
  const { size, margin, disableInteraction, backgroundColor, imgSrc, borderRadius } = {
    ...defaultScrollbarProps,
    ...scrollbar,
  };

  const [_, forceUpdate] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const flexContainerRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
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
    const thumbEl = thumbRef.current!;

    const update = () => forceUpdate((c) => c + 1);

    const controller = new Controller({
      flexContainer: flexContainerEl,
      scrollbarThumb: thumbEl,
      direction,
      onScrollRef,
      forceUpdate: update,
    });

    controllerRef.current = controller;

    const handleStart = (e: any) => {
      // wheel click down
      if (e.button === 1) {
        return;
      }

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
      e.stopPropagation();
    };

    flexContainerEl.addEventListener('mousedown', handleStart);
    flexContainerEl.addEventListener('touchstart', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
    thumbEl.addEventListener('mousedown', handleScrollbarStart);
    thumbEl.addEventListener('touchstart', handleScrollbarStart);

    if (direction === 'y') {
      flexContainerEl.addEventListener('wheel', handleWheel);
    }

    let observer: MutationObserver | null = null;

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(update);
      observer.observe(flexContainerEl, {
        childList: true,
        subtree: true,
      });
    } else {
      console.warn('your env does not support MutationObserver');
    }

    const clear = (eventOnly = false) => {
      flexContainerEl.removeEventListener('mousedown', handleStart);
      flexContainerEl.removeEventListener('touchstart', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      thumbEl.removeEventListener('mousedown', handleScrollbarStart);
      thumbEl.removeEventListener('touchstart', handleScrollbarStart);
      flexContainerEl.removeEventListener('wheel', handleWheel);

      if (!eventOnly) {
        controller.unregister(id);
        observer && observer.disconnect();
      }
    };

    controller.register(id);

    if (controller.info.noScroll) {
      controller.setNoScroll();
      clear(true);
    } else {
      controller.init();
    }

    return () => clear();
  });

  useImperativeHandle(ref, () => methods);

  const getBarStyle = () => {
    let styles: CSSProperties = {};

    if (direction === 'x') {
      styles = {
        width: '100%',
        height: size,
        bottom: margin,
      };
    }

    if (direction === 'y') {
      styles = {
        width: size,
        height: '100%',
        right: margin,
        top: 0,
      };
    }

    return styles;
  };

  const getThumbStyle = () => {
    let styles: CSSProperties = {
      backgroundColor,
      borderRadius,
      cursor: disableInteraction ? undefined : 'pointer',
    };

    if (direction === 'x') {
      styles = {
        ...styles,
        height: '100%',
      };
    }

    if (direction === 'y') {
      styles = {
        ...styles,
        width: '100%',
      };
    }

    return styles;
  };

  return (
    <div
      className="scrollable-wrapper"
      ref={containerRef}
      onDragStart={(e) => e.preventDefault()}
      data-scroll-id={id}
      style={style}
    >
      {cloneElement(children, { ref: flexContainerRef })}
      <div id={scrollbarId} className="scrollable-scrollbar" ref={scrollbarRef} style={getBarStyle()}>
        <div className="scrollable-scrollbar-thumb" ref={thumbRef} style={getThumbStyle()}>
          {imgSrc ? <img className="scrollable-scrollbar-img" src={imgSrc} /> : null}
        </div>
      </div>
    </div>
  );
};

const Scrollable = forwardRef(InternalScrollable);

export default Scrollable;
