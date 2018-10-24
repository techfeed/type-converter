import {ConversionError} from './types';

export function convertToString(value: any): string | undefined | null {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  return String(value);
}

export function convertToNumber(value: any): number | undefined | null  {
  if (value === undefined || value === null) {
    return value;
  }
  if (typeof value === 'number') {
    return value;
  }
  const result = parseInt(String(value), 10);
  if (isNaN(result)) {
    throw new ConversionError(`Cannot convert to number: ${value}`);
  }
  return result;
}
export function convertToDate(value: any): Date | undefined | null  {
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
  if (result.toString() === 'Invalid Date') {
    throw new ConversionError(`Cannot convert to date: ${value}`);
  }
  return result;
}

export function convertToBoolean(value: any): boolean | undefined | null {
  return Boolean(value);
}
