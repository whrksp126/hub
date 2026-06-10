'use client';

import { type PlateElementProps, PlateElement } from 'platejs/react';

export function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="blockquote"
      className="my-6 border-l-[3px] border-[var(--brand)] pl-5 font-[family-name:var(--font-serif)] text-[1.3rem] font-medium leading-relaxed text-[var(--fg)]"
      {...props}
    />
  );
}
