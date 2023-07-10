# scrollable

make flex element scrollable with custom scrollbar

## usage

Wrap your flex element with `<Scrollable>` component

Flex element **_must_** have these preset properties:

1、`flex-wrap: no-wrap` , this property defaults to be true,

2、`flex-direction: column` when you want to scroll vertically

Each flex items **_must_** have `flex-shrink: 0` property

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
        id={'instance1'}
        direction={'y'}
        scrollbar={{ size: 10 }}
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
          <Scrollable id={'instance2'} direction={'x'} scrollbar={{ size: 20, imgSrc }}>
            <div className="flexbox2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`box box${i + 1}`}
                  onClick={() => {
                    console.log('clk');
                  }}
                  style={
                    i === 3
                      ? {
                          marginLeft: 100,
                        }
                      : undefined
                  }
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
  margin: 8px;
}

.box2 {
  background-color: yellow;
  margin-left: 30px;
  margin-top: 20px;
}

.box3 {
  background-color: green;
  align-self: center;
}

.box4 {
  background-color: purple;
  margin: 22px 11px 42px;
}

.box5 {
  background-color: peru;
  margin-bottom: 20px;
  margin-right: 10px;
}

```
