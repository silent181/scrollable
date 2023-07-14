# scrollable

make flex element scrollable with custom scrollbar

## usage

- Wrap your element with `<Scrollable>` component
- Total length depends on ***all child elements*** of your root element, and viewport length is your ***root element*** length
- Do not forget to set ***width*** and ***height*** explicitly to your root element so our lib can get this info more precisely, you can use html attributes or dataset to do this.
- if your element is flex container, it **_must_** have these preset properties:

  - `flex-wrap: no-wrap` , this property defaults to be true,
  - `flex-direction: column` when you want to scroll vertically
  - Each flex item **_must_** have `flex-shrink: 0` property
- If you want to wrap a custom react component, don't forget to pass ***ref*** to your ***root node*** through ***forwardRef*** method, see details in the example

## example

```bash
git clone https://github.com/silent181/scrollable

cd scrollable

npm i

npm run dev
```

