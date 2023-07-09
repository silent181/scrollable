# scrollable

make flex element scrollable with custom scrollbar

## usage

wrap your flex element with `<Scrollable>` component



flex element ***must*** has these preset properties:

1、`flex-wrap: no-wrap` , this  property defaults to be true, 

2、`flex-direction: column` when you want to scroll vertially



flex items ***must*** has `flex-shrink: 0` property



## example

```react
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

```

```css
.flexbox1 {
  display: flex;
  flex-direction: column;

  width: 500px;
  height: 333px;

  background-color: rgb(58, 70, 138);
}

.flexbox2 {
  display: flex;

  width: 500px;
  height: 333px;

  background-color: #fff;
}

.box {
  width: 200px;
  height: 200px;

  flex-shrink: 0;
}

.box1 {
  background-color: red;
}

.box2 {
  background-color: yellow;
}

.box3 {
  background-color: green;
  align-self: center;
}

.box4 {
  background-color: purple;
}

.box5 {
  background-color: peru;
}

```

