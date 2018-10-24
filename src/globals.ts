/* eslint-disable */
'use strict';

import {Converter} from './converter';
import {Constructor, ConvertOp} from './types';

const GLOBAL_CONVERTER = new Converter();

export function convertObject<T>(value: any, ctor: {new(...args: any[]): T}): T {
  return GLOBAL_CONVERTER.convertObject(value, ctor);
}

export function convertArray<T>(values: any[], targetType: Constructor<T>): T[] {
  return GLOBAL_CONVERTER.convertArray(values, targetType);
}
export function convert<T>(value: any, targetType: Constructor<T>): T {
  return GLOBAL_CONVERTER.convert(value, targetType);
}

export function register<T>(targetType: Constructor<T>, converter: ConvertOp<T>): void {
  GLOBAL_CONVERTER.register(targetType, converter);
}
