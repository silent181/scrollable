import React, {
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

import { ScrollableInstance, ScrollableProps, ColorByPicker } from './type';
import './index.css';
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
  const { scrollbar, onScroll, direction, id, unit = 'px', children, style } = props;
  const { size, margin, disableInteraction, backgroundColor, imgSrc, borderRadius } = {
    ...defaultScrollbarProps,
    ...scrollbar,
  };

  let scrollbarColor: any = backgroundColor;
  if (scrollbarColor.r && scrollbarColor.g && scrollbarColor.b && scrollbarColor.a) {
    const { r, g, b, a } = scrollbarColor as ColorByPicker;
    scrollbarColor = `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  const [_, forceUpdate] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const targetRef = useRef<HTMLDivElement>(null);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller>();

  const onScrollRef = useRef(onScroll);

  const methods = useMemo(() => {
    return {
      getContainer: () => containerRef.current,
      getTarget: () => targetRef.current,
      getController: () => controllerRef.current,
      getScrollbar: () => containerRef.current!.querySelector(`#${scrollbarId}`),
      scroll: (len: number) => {
        controllerRef.current?.scroll(len);
      },
      scrollToStart: (animation = true) => {
        controllerRef.current?.scrollToStart(animation);
      },
      scrollToEnd: (animation = true) => {
        controllerRef.current?.scrollToEnd(animation);
      },
    };
  }, []);

  useEffect(() => {
    const containerEl = containerRef.current!;
    const targetEl = targetRef.current!;
    const wrapperEl = wrapperRef.current!;
    const thumbEl = thumbRef.current!;
    const scrollbarWrapperEl = scrollbarRef.current!;

    const update = () => forceUpdate((c) => c + 1);

    const controller = new Controller({
      target: targetEl,
      scrollbarThumb: thumbEl,
      scrollbarWrapper: scrollbarWrapperEl,
      wrapper: wrapperEl,
      container: containerEl,
      direction,
      onScrollRef,
      forceUpdate: update,
      unit,
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

    const handleScrollbarClick = (e: any) => {
      if (disableInteraction) {
        return;
      }

      controller.handleBarClick(e);
    };

    wrapperEl.addEventListener('mousedown', handleStart);
    wrapperEl.addEventListener('touchstart', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
    thumbEl.addEventListener('mousedown', handleScrollbarStart);
    thumbEl.addEventListener('touchstart', handleScrollbarStart);
    scrollbarWrapperEl.addEventListener('click', handleScrollbarClick);

    if (direction === 'y') {
      wrapperEl.addEventListener('wheel', handleWheel);
    }

    let observer: MutationObserver | null = null;

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        const prevController = controller;
        update();

        /**
         * refresh scroll position
         */
        setTimeout(() => {
          const currrentController = controllerRef.current;
          currrentController?.scroll(-prevController.scrollValue);
        }, 200);
      });
      observer.observe(targetEl, {
        childList: true,
        subtree: true,
      });
    } else {
      console.warn('your env does not support MutationObserver');
    }

    const clear = (eventOnly = false) => {
      wrapperEl.removeEventListener('mousedown', handleStart);
      wrapperEl.removeEventListener('touchstart', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
      thumbEl.removeEventListener('mousedown', handleScrollbarStart);
      thumbEl.removeEventListener('touchstart', handleScrollbarStart);
      wrapperEl.removeEventListener('wheel', handleWheel);
      scrollbarWrapperEl.removeEventListener('click', handleScrollbarClick);

      if (!eventOnly) {
        controller.unregister(id);
        observer && observer.disconnect();
      }
    };

    controller.register(id);

    controller.init((noScroll) => {
      if (noScroll) {
        clear(true);
      }
    });

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
      backgroundColor: imgSrc ? undefined : scrollbarColor,
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

  const getImgSrc = (src: string) => {
    const reg = /^url\(.+\)$/;
    if (reg.test(src)) {
      return src;
    }

    return `url("${src}")`;
  };

  return (
    <div
      className="scrollable-viewport"
      ref={containerRef}
      onDragStart={(e) => e.preventDefault()}
      data-scroll-id={id}
      style={style}
    >
      <div className="scrollable-wrapper" ref={wrapperRef}>
        {cloneElement(children, { ref: targetRef })}
      </div>
      <div id={scrollbarId} className="scrollable-scrollbar" ref={scrollbarRef} style={getBarStyle()}>
        <div className="scrollable-scrollbar-thumb" ref={thumbRef} style={getThumbStyle()}>
          {imgSrc ? <div className="scrollable-scrollbar-img" style={{ backgroundImage: getImgSrc(imgSrc) }} /> : null}
        </div>
      </div>
    </div>
  );
};

const Scrollable = forwardRef(InternalScrollable);

export default Scrollable;
