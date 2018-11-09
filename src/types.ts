export type ClassConstructor<T> = {new(...args: any[]): T};

export type Constructor<T> = ClassConstructor<T> | ((...args: any[]) => T) | Function;

export class ConversionError extends Error {
  constructor(message?: string) {
    super(message);
  }
}

/**
 * void (undefined)に変換したい場合に指定するコンストラクタ
 */
export class Undefined {}
