export type Brand<Tag extends string, Base = null> = Base & { __tag: Tag };

export function assert(x: unknown, message: string): asserts x {
  if (!x) {
    throw new Error(message);
  }
}

export function assertExhaustive(x: never): never {
  throw new Error('Must be unreachable', x);
}
