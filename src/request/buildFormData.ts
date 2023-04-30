export const buildFormData = (body: Record<string, any>) => {
  const formData = new FormData();

  const bodyKeys = Object.keys(body);

  bodyKeys.forEach((key) => {
    formData.append(key, body[key]);
  });

  return formData;
};
