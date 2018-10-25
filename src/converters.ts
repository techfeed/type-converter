import {ConversionError} from './types';
import {ConvertOptions} from './options';

export function convertToString(value: any, options?: ConvertOptions): string | undefined | null {
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

export function convertToNumber(value: any, options?: ConvertOptions): number | undefined | null  {
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
export function convertToDate(value: any, options?: ConvertOptions): Date | undefined | null  {
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

export function convertToBoolean(value: any, options?: ConvertOptions): boolean | undefined | null {
  return Boolean(value);
}

export function convertToObject(value: any, options?: ConvertOptions): object {
  if (value === undefined || value === null) {
    return value;
  }
  return {...value};
}
