export const buildFormData = (body: any) => {
  const formData = new FormData();

  const bodyKeys = Object.keys(body);
  bodyKeys.forEach((key) => {
    formData.append(key, body[key]);
  });
  body = formData;

  return { body };
};
