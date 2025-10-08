/**
 * Gets the value at path of object. If the resolved value is a function,
 * it's invoked with the this binding of its parent object and its result is returned.
 * Similar to lodash.result functionality.
 *
 * @param object - The object to query
 * @param path - The path of the property to get (supports dot notation)
 * @param defaultValue - The value returned if the resolved value is undefined
 * @returns The resolved value
 *
 * @example
 * const obj = { a: { b: { c: 'value' } } };
 * result(obj, 'a.b.c'); // => 'value'
 *
 * @example
 * const obj = { a: { b: () => 'computed' } };
 * result(obj, 'a.b'); // => 'computed'
 *
 * @example
 * result({}, 'a.b.c', 'default'); // => 'default'
 */
export function result<T = any>(object: any, path: string | string[], defaultValue?: T): T | undefined {
  if (object == null) {
    return defaultValue;
  }

  // Convert path to array if it's a string
  const pathArray = Array.isArray(path)
    ? path
    : path
        .split('.')
        .flatMap((part) => part.split('[').flatMap((p) => p.split(']')))
        .filter(Boolean);

  let current = object;
  let parent = object;

  // Traverse the path
  for (let i = 0; i < pathArray.length; i++) {
    if (current == null) {
      return defaultValue;
    }

    parent = current;
    const key = pathArray[i];
    if (key === undefined) {
      return defaultValue;
    }
    current = current[key];
  }

  // If the final value is undefined, return the default value
  if (current === undefined) {
    return defaultValue;
  }

  // If the value is a function, invoke it with the parent object as context
  if (typeof current === 'function') {
    return current.call(parent) as T;
  }

  return current as T;
}

export default result;
