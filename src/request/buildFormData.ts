export const buildFormData = (body: Record<string, any>) => {
  const formData = new FormData();

  const bodyKeys = Object.keys(body);

  bodyKeys.forEach((key) => {
    const inputValue = body[key];
    if (inputValue instanceof Array) {
      for (const value of inputValue) {
        formData.append(key, value);
      }
    } else {
      formData.append(key, inputValue);
    }
  });

  return formData;
};
