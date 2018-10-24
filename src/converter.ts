/* eslint-disable */
'use strict';

import 'reflect-metadata';
import {Constructor, ClassConstructor, ConvertOp} from './types';
import {convertToString, convertToNumber, convertToDate, convertToBoolean} from './converters';
import {ConvertOptions} from './options';
import {METADATA_KEY_CONVERTABLE} from './decorators';

export class Converter {
  private _converters = new Map<Constructor<any>, ConvertOp<any>>();

  constructor() {
    this._registerDefaultConverters();
  }

  convertArray<T>(values: any[], targetType: Constructor<T>, options?: ConvertOptions): T[] {
    return values.map(value => this.convert(value, targetType, options));
  }
  convert<T>(value: any, targetType: Constructor<T>, options?: ConvertOptions): T {
    if (value instanceof Array) {
      throw new Error('Cannot convert array. Use convertArray()');
    }
    const converter = this._converters.get(targetType);
    if (converter) {
      return converter(value);
    }
    return this._convertObject(value, <ClassConstructor<T>>targetType.prototype.constructor, options);
  }

  register<T>(targetType: Constructor<T>, converter: ConvertOp<T>): void {
    this._converters.set(targetType, converter);
  }
  private _convertObject<T>(value: any, ctor: {new(...args: any[]): T}, options?: ConvertOptions): T {
    const result: any = new ctor();
    const decoratorOpts = Reflect.getMetadata(METADATA_KEY_CONVERTABLE, result);
    const opts: ConvertOptions = Object.assign({}, decoratorOpts, options);
    for (const key of Object.keys(value)) {
      if (this._isExcludeTarget(key, opts)) {
        continue;
      }
      const type = Reflect.getMetadata('design:type', result, key);
      const propVal = value[key];
      // 変換先の型が不明な場合
      if (!type) {
        // 無視しない場合、型変換を行わずに相手先のオブジェクトに挿入
        if (!opts.ignoreMissingTypeInfo) {
          result[key] = propVal;
        }
        continue;
      }
      if (propVal instanceof Array) {
        result[key] = this.convertArray(propVal, type);
      } else {
        result[key] = this.convert(propVal, type);
      }
    }
    return result;
  }
  private _isExcludeTarget(key: string, options: ConvertOptions): boolean {
    const {excludes} = options;
    if (!excludes) {
      return false;
    }
    return excludes.some(exclude => {
      if (typeof exclude === 'string') {
        return key === exclude;
      } else if (exclude instanceof RegExp) {
        return exclude.test(key);
      } else {
        return exclude(key);
      }
    });
  }
  private _registerDefaultConverters(): void {
    this.register(String, convertToString);
    this.register(Number, convertToNumber);
    this.register(Date, convertToDate);
    this.register(Boolean, convertToBoolean);
  }
}
