import { useState } from 'react';

export const useMyHook = (): [string, (newValue: string) => void] => {
  const [value, setValue] = useState('');

  const updateValue = (newValue: string) => {
    setValue(newValue);
  };

  return [value, updateValue];
};
