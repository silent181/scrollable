import Scrollable, { ScrollableInstance } from './scrollable';
import { useRef, useState } from 'react';

import './App.css';

const imgSrc = '/bar.jpg';

const App = () => {
  const ins1 = useRef<ScrollableInstance>(null);
  const [dispose, setDispose] = useState(false);

  const next = () => {
    ins1.current!.scroll(200);
  };

  const prev = () => {
    ins1.current!.scroll(-200);
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
        ref={ins1}
        uniqueKey={'instance1'}
        direction={'y'}
        scrollbar={{ imgSrc, size: 10 }}
        onScroll={(v) => {
          console.log(v, 'scroll');
        }}
      >
        <div className="flexbox1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`box box${i + 1}`}
              onClick={() => {
                console.log('clk');
              }}
            />
          ))}
        </div>
      </Scrollable>
      <div style={{ marginTop: 10, marginBottom: 10 }}>
        <button style={{ marginRight: 40 }} onClick={prev}>
          prev
        </button>
        <button onClick={next}>next</button>
      </div>
      {!dispose && (
        <>
          <Scrollable uniqueKey={'instance2'} direction={'x'} scrollbar={{ size: 20 }}>
            <div className="flexbox2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`box box${i + 1}`}
                  onClick={() => {
                    console.log('clk');
                  }}
                />
              ))}
            </div>
          </Scrollable>
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <button onClick={() => setDispose(true)}>
              click here to dispose this component, and window.__scrollManager should remove this instance
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
