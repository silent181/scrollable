import Scrollable from './scrollable';
import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';

import './App.css';

const imgSrc = '/bar.jpg';

const Demo = () => {
  const ins = useRef();

  const next = () => {
    console.log(ins.current);
    ins.current!.scroll(200);
  };

  const prev = () => {
    console.log(ins.current);
    ins.current!.scroll(-200);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '90vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
    >
      <Scrollable
        ref={ins}
        uniqueKey={'sb11'}
        direction={'x'}
        scrollbar={{ imgSrc: undefined }}
        onScroll={(v) => {
          console.log(v, 'scroll');
        }}
      >
        <div className="flexbox">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`box box${i + 1}`}
              onClick={() => {
                console.log('clk');
              }}
            ></div>
          ))}
        </div>
      </Scrollable>
      <div style={{ marginTop: 10 }}>
        <button style={{ marginRight: 40 }} onClick={prev}>
          prev
        </button>
        <button onClick={next}>next</button>
      </div>
    </div>
  );
};

export default Demo;
