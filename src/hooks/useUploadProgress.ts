import type { AxiosProgressEvent } from 'axios';
import { useState } from 'react';

export const useUploadProgress = () => {
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);

  const onUploadProgress = (progressEvent: AxiosProgressEvent) => {
    const { loaded, total } = progressEvent;
    const percentage = Math.round((loaded / (total as number)) * 100);

    setUploadProgressPercent(percentage);
  };

  return { onUploadProgress, uploadProgressPercent };
};
