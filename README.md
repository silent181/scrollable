# scrollable

A React component to make element scrollable with custom scrollbar

## usage

- Wrap your element with `<Scrollable>` component
- Total length depends on **_all child elements_** of your root element, and viewport length is your **_root element_** length
- Do not forget to set **_width_** and **_height_** explicitly to your root element so our lib can get this info more precisely, you can use html attributes or dataset to do this.
- if your element is flex container, it **_must_** have these preset properties:

  - `flex-wrap: no-wrap` , this property defaults to be true,
  - `flex-direction: column` when you want to scroll vertically
  - Each flex item **_must_** have `flex-shrink: 0` property

- If you want to wrap a custom react component, don't forget to pass **_ref_** to your **_root node_** through **_forwardRef_** method, see details in the example

## example

```bash
git clone https://github.com/silent181/scrollable

cd scrollable

npm i

npm run dev
```
