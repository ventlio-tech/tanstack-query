export const buildFormData = (body: Record<string, any>) => {
  const formData = new FormData();

  const bodyKeys = Object.keys(body);

  bodyKeys.forEach((key) => {
    const inputValue = body[key];

    // if inputValue is array and the first item is array, append everything to the
    if (inputValue instanceof Array && inputValue.length > 0) {
      // append all files
      for (const file of inputValue) {
        formData.append(key, file);
      }
    }
    // else if inputValue is Object upload it as blob
    else if (inputValue instanceof Object) {
      formData.append(
        key,
        new Blob([JSON.stringify(inputValue)], {
          type: 'application/json',
        })
      );
    }

    formData.append(key, inputValue);
  });

  return formData;
};