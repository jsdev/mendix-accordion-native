import React, {
  ReactElement,
  createElement,
  useState,
  SyntheticEvent,
  ReactNode,
} from 'react';
import { NativeAccordionContainerProps } from "../typings/NativeAccordionProps";

import './NativeAccordion.css';

interface GroupType {
    header: string;
    content?: ReactNode;
}

export function NativeAccordion(
  props: NativeAccordionContainerProps
): ReactElement {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const handleToggle = (index: number, isNowOpen: boolean) => {
    if (isNowOpen) {
      if (props.singleOpen) {
        setOpenItems([index]);
      } else {
        setOpenItems(prev => (prev.includes(index) ? prev : [...prev, index]));
      }
    } else {
      setOpenItems(prev => prev.filter(i => i !== index));
    }
  };

  return (
    <div
      className={`native-accordion-container ${props.class}`}
      style={props.style}
      tabIndex={props.tabIndex}
    >
      {(props.groups as GroupType[]).map((group, index) => {
        const isOpen = openItems.includes(index);
        return (
          <details
            key={index}
            className="native-accordion-item"
            open={isOpen}
            onToggle={(e: SyntheticEvent<HTMLDetailsElement>) => {
              const target = e.currentTarget;
              if (target.open !== isOpen) {
                handleToggle(index, target.open);
              }
            }}
          >
            <summary>{group.header}</summary>
            <div className="content">{group.content}</div>
          </details>
        );
      })}
    </div>
  );
}
