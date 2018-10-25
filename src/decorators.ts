import {ConvertOptions, ConvertPropertyOptions} from './options';
export type PropertyDecoratorFunction =
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => any;

/**
 * refrect-metadataに登録する際に使用するシンボル
 */
export const METADATA_KEY_CONVERTABLE = Symbol();
export const METADATA_KEY_CONVERT_PROP = Symbol();

export function Convertable(options?: ConvertOptions): {
  (target: Function): void;
  (target: Object, propertyKey: string | symbol): void;
} {
  return Reflect.metadata(METADATA_KEY_CONVERTABLE, options || {});
}

export function ConvertProperty(options?: ConvertPropertyOptions): {
  (target: Function): void;
  (target: Object, propertyKey: string | symbol): void;
} {
  return Reflect.metadata(METADATA_KEY_CONVERT_PROP, options || {});
}
