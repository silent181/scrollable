/* eslint-disable @typescript-eslint/no-unsafe-call */
import { useEffect, useState, forwardRef, useCallback } from 'react';

import './App.css';

const ids = [1, 2, 3, 4, 5];

const Internal = (props: any, ref: any) => {
  const [childrenNode, setChildrenNode] = useState<any>(null);
  const [renderedIds, setRenderedIds] = useState(ids);

  const manualNotify = useCallback(() => {
    const ctl = window.__scrollManager.getController(props.id);
    ctl.forceUpdate();
  }, [props.id]);

  useEffect(() => {
    setTimeout(() => {
      const node = renderedIds.map((id) => (
        <div
          key={id}
          className={`box box${id}`}
          onClick={() => {
            setRenderedIds((prevIds) => prevIds.filter((i) => i !== id));
          }}
        >
          click to remove this box in 1 seconds
        </div>
      ));

      setChildrenNode(node);

      /**
       * 在不支持 MutationObserver API的环境下
       */
      // manualNotify();
    }, 1000);
  }, [manualNotify, renderedIds]);

  const loading = <span style={{ fontSize: 30, color: '#fff' }}>loading...</span>;

  /**
   * ! pass "ref" to root flex element is important
   */
  return (
    <div className="flexbox1" ref={ref} data-width="500px" data-height="333px">
      {childrenNode ? childrenNode : loading}
    </div>
  );
};

const DynamicChildren = forwardRef(Internal);

export default DynamicChildren;
