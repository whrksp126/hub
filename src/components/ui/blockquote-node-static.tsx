import * as React from 'react';

import { type SlateElementProps, SlateElement } from 'platejs/static';

export function BlockquoteElementStatic(props: SlateElementProps) {
  return (
    <SlateElement
      as="blockquote"
      className="my-6 border-l-[3px] border-[var(--brand)] pl-5 font-[family-name:var(--font-serif)] text-[1.3rem] font-medium leading-relaxed text-[var(--fg)]"
      {...props}
    />
  );
}
