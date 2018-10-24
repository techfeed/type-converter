export type PropertyDecoratorFunction =
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => any;

/**
 * refrect-metadataに登録する際に使用するシンボル
 */
export const METADATA_KEY_CONVERT = Symbol();

export interface ConvertOptions {
}

export function Convert(options?: ConvertOptions) {
  return Reflect.metadata(METADATA_KEY_CONVERT, options);
}
