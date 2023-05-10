export const buildFormData = (body: Record<string, any>) => {
  const formData = new FormData();

  const handleArrayValue = (key: string, value: any) => {
    for (const item of value) {
      if (item instanceof File) {
        formData.append(key, item);
      } else if (item instanceof Object) {
        formData.append(
          key,
          new Blob([JSON.stringify(item)], {
            type: 'application/json',
          })
        );
      } else {
        formData.append(key, item);
      }
    }
  };

  const handleObjectValue = (key: string, value: any) => {
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(
        key,
        new Blob([JSON.stringify(value)], {
          type: 'application/json',
        })
      );
    }
  };

  const handlePrimitiveValue = (key: string, value: any) => {
    formData.append(key, value);
  };

  const bodyKeys = Object.keys(body);

  bodyKeys.forEach((key) => {
    const inputValue = body[key];

    if (Array.isArray(inputValue) && inputValue.length > 0) {
      handleArrayValue(key, inputValue);
    } else if (inputValue instanceof Object) {
      handleObjectValue(key, inputValue);
    } else {
      handlePrimitiveValue(key, inputValue);
    }
  });

  return formData;
};
