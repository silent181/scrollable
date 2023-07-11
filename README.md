# scrollable

make flex element scrollable with custom scrollbar

## usage

- Wrap your flex element with `<Scrollable>` component

- Flex element **_must_** have these preset properties:

  - `flex-wrap: no-wrap` , this property defaults to be true,
  - `flex-direction: column` when you want to scroll vertically
- Each flex items **_must_** have `flex-shrink: 0` property
- If you want to wrap a custom react component, don't forget to pass ***ref*** to your ***root flex element*** through ***forwardRef*** method, see details in the example

## example

```bash
git clone https://github.com/silent181/scrollable

cd scrollable

npm i

npm run dev
```

