declare module 'react-phone-input-2' {
  import * as React from 'react';

  export interface PhoneInputProps {
    country?: string;
    value?: string;
    onChange?: (value: string) => void;
    inputStyle?: React.CSSProperties;
    buttonStyle?: React.CSSProperties;
    containerStyle?: React.CSSProperties;
    placeholder?: string;
  }

  const PhoneInput: React.FC<PhoneInputProps>;
  export default PhoneInput;
}
