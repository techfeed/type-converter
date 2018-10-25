/* eslint-disable */
'use strict';

import {Converter} from './converter';
import {Constructor, ConvertOp} from './types';

export const GLOBAL_CONVERTER = new Converter();

export function convert<T>(value: any, targetType: Constructor<T>): T[];
export function convert<T>(value: any, targetType: Constructor<T>): T;
export function convert(value: any, targetType: Constructor<any>): any {
  return GLOBAL_CONVERTER.convert(value, targetType);
}
