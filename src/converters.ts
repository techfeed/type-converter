import {ConversionError} from './types';
import {ConvertOptions} from './options';
import {isPlainObject} from './isplainobject';
import {Converter} from './converter';

export function convertToString(
  value: any, options?: ConvertOptions, converter?: Converter): string | undefined | null {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

export function convertToNumber(
  value: any, options?: ConvertOptions, converter?: Converter): number | undefined | null  {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === 'number') {
    return value;
  }
  const result = parseInt(String(value), 10);
  if (options && !options.suppressConversionError && isNaN(result)) {
    throw new ConversionError(`Cannot convert to number: ${value}`);
  }
  return result;
}
export function convertToDate(value: any, options?: ConvertOptions, converter?: Converter): Date | undefined | null  {
  if (value === undefined || value === null) {
    return value;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  const result = new Date(String(value));
  if (options && !options.suppressConversionError && result.toString() === 'Invalid Date') {
    throw new ConversionError(`Cannot convert to date: ${value}`);
  }
  return result;
}

export function convertToBoolean(
  value: any, options?: ConvertOptions, converter?: Converter): boolean | undefined | null {
  return Boolean(value);
}

/**
 * 渡されたオブジェクトを「可能な限り」フラットにして返します。
 * 組み込みのオブジェクト（Date, RegExp, DOMなど）についてはそのまま扱います。
 * 
 */
export function convertToObject(value: any, options?: ConvertOptions, converter?: Converter): object {
  if (value === undefined || value === null) {
    return value;
  }
  if (isPlainObject(value)) {
    const result: any = {};
    Object.keys(value).forEach(propName => {
      result[propName] = convertToObject(value[propName], options);
    });
    return result;
  } else if (Array.isArray(value)) {
    return value.map(elem => convertToObject(elem, options));
  } else {
    return value;
  }
}
