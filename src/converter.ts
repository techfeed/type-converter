/* eslint-disable */
'use strict';

import 'reflect-metadata';
import {Constructor, ClassConstructor, ConvertOp} from './types';
import {convertToString, convertToNumber, convertToDate, convertToBoolean} from './converters';
import {ConvertOptions, ConvertPropertyOptions} from './options';
import {METADATA_KEY_CONVERTABLE, METADATA_KEY_CONVERT_PROP} from './decorators';

export class Converter {
  private _converters = new Map<Constructor<any>, ConvertOp<any>>();

  constructor(
    public options?: ConvertOptions
  ) {
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
      return converter(value, options);
    }
    return this._convertObject(value, <ClassConstructor<T>>targetType.prototype.constructor, options);
  }

  register<T>(targetType: Constructor<T>, converter: ConvertOp<T>): void {
    this._converters.set(targetType, converter);
  }
  private _convertObject<T>(value: any, ctor: {new(...args: any[]): T}, options?: ConvertOptions): T {
    const result: any = new ctor();
    const mergedOpts = this._mergeConvertOptions(result, options);
    for (const key of Object.keys(value)) {
      if (this._isExcludeTarget(key, mergedOpts)) {
        continue;
      }
      // @ConvertPropertyが付与されたプロパティの場合、propOptsが取得できる
      const propOpts: ConvertPropertyOptions | undefined =
        Reflect.getMetadata(METADATA_KEY_CONVERT_PROP, result, key);
      // @ConvertPropertyが指定されていないとき、オプションに応じて処理をスキップ
      if (!propOpts && mergedOpts.target === 'decorated') {
        continue;
      }
      // プロパティの型情報を @ConvertProperty()のオプション、もしくはデコレータ（サードパーティ製含む）が付与された
      // プロパティのdesign:typeメタデータから取得
      const type = (propOpts && propOpts.type) || Reflect.getMetadata('design:type', result, key);
      const propVal = value[key];
      // 変換先の型が不明
      if (!type) {
        // 型変換を行わずに相手先のオブジェクトに挿入するオプション
        if (mergedOpts.target === 'all') {
          result[key] = propVal;
        }
        continue;
      }
      if (propVal instanceof Array) {
        result[key] = this.convertArray(propVal, type, mergedOpts);
      } else {
        result[key] = this.convert(propVal, type, mergedOpts);
      }
    }
    return result;
  }
  private _mergeConvertOptions(target: any, options?: ConvertOptions): ConvertOptions {
    const decoratorOpts = Reflect.getMetadata(METADATA_KEY_CONVERTABLE, target);
    const opts: ConvertOptions = Object.assign({}, this.options, decoratorOpts, options);
    opts.target = opts.target || 'typed';
    return opts;
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
