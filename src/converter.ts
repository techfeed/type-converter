/* eslint-disable */
'use strict';

import 'reflect-metadata';
import {Constructor, ClassConstructor, ConvertOp} from './types';
import {convertToString, convertToNumber, convertToDate, convertToBoolean} from './converters';

export class Converter {
  private _converters = new Map<Constructor<any>, ConvertOp<any>>();

  constructor() {
    this._registerDefaultConverters();
  }

  convertArray<T>(values: any[], targetType: Constructor<T>): T[] {
    return values.map(value => this.convert(value, targetType));
  }
  convert<T>(value: any, targetType: Constructor<T>): T {
    if (value instanceof Array) {
      throw new Error('Cannot convert array. Use convertArray()');
    }
    const converter = this._converters.get(targetType);
    if (converter) {
      return converter(value);
    }
    return this._convertObject(value, <ClassConstructor<T>>targetType.prototype.constructor);
  }

  register<T>(targetType: Constructor<T>, converter: ConvertOp<T>): void {
    this._converters.set(targetType, converter);
  }
  private _convertObject<T>(value: any, ctor: {new(...args: any[]): T}): T {
    const result: any = new ctor();
    for (const key of Object.keys(value)) {
      const type = Reflect.getMetadata('design:type', result, key);
      const propVal = value[key];
      if (propVal instanceof Array) {
        result[key] = this.convertArray(propVal, type);
      } else {
        result[key] = this.convert(propVal, type);
      }
    }
    return result;
  }
  private _registerDefaultConverters(): void {
    this.register(String, convertToString);
    this.register(Number, convertToNumber);
    this.register(Date, convertToDate);
    this.register(Boolean, convertToBoolean);
  }
}
