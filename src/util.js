export function compose(...fns) {
  return (...args) => {
    let result;
    let fnArgs = args;

    fns.reverse().forEach((fn) => {
      result = fn(...fnArgs);
      fnArgs = [result];
    });

    return result;
  };
}
