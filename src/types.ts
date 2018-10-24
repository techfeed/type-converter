
export type ClassConstructor<T> = {new(...args: any[]): T};

export type Constructor<T> = ClassConstructor<T> | ((...args: any[]) => T) | Function;;

export type ConvertOp<T> = (v: any) => T;

export class ConversionError extends Error {
  constructor(message?: string) {
    super(message);
  }
}
