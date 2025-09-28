declare module 'react-input-mask' {
  import * as React from 'react';
  interface Props {
    mask: string | (string | RegExp)[];
    value?: string | number;
    defaultValue?: string | number;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    maskChar?: string | null;
    alwaysShowMask?: boolean;
    beforeMaskedValueChange?: (newState: { value: string; selection: { start: number; end: number } }, oldState: any, userInput: string, options: any) => any;
    [key: string]: any;
  }
  export default class InputMask extends React.Component<Props> {}
}
