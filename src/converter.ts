/* eslint-disable */
'use strict';

import 'reflect-metadata';
import {Constructor, ClassConstructor, ConvertOp, Undefined} from './types';
import {convertToString, convertToNumber, convertToDate, convertToBoolean, convertToObject} from './converters';
import {ConvertOptions, ConvertPropertyOptions} from './options';
import {METADATA_KEY_CONVERTABLE, METADATA_KEY_CONVERT_PROP} from './decorators';

/**
 * 型変換を行うクラス。
 * デフォルトでは、以下の型に関する変換メソッドが登録されており、それぞれ`convertToXXX()`メソッドが割り当てられています。
 * - number
 * - boolean
 * - string
 * - Date
 */
export class Converter {
  private _converters = new Map<Constructor<any>, ConvertOp<any>>();

  constructor(
    public options?: ConvertOptions
  ) {
    this._registerDefaultConverters();
  }

  /**
   * 型の変換を行います。
   */
  convert<T>(src: any[], dstType: Constructor<T>, options?: ConvertOptions): T[];
  convert<T>(src: any, dstType: Constructor<T>, options?: ConvertOptions): T;
  convert(src: any, dstType: Constructor<any>, options?: ConvertOptions): any {
    if (src instanceof Array) {
      return src.map(elem => this.convert(elem, dstType, options));
    }
    const converter = this._converters.get(dstType);
    if (converter) {
      return converter(src, options);
    }
    return this._convertObject(src, <ClassConstructor<any>>dstType, options);
  }

  /**
   * 型変換を行う関数を登録します。
   */
  register<T>(targetType: Constructor<T>, converter: ConvertOp<T>): void {
    this._converters.set(targetType, converter);
  }

  /**
   * srcからdstへのプロパティコピーを行います。
   * その際に、dstTypeの型情報に基づいて型変換を行います。
   */
  populate<T>(src: any, dst: any, dstType: Constructor<T>, options?: ConvertOptions): void {
    const mergedOpts = this._mergeConvertOptions(dstType, options);
    for (const key of Object.keys(src)) {
      if (this._isExcludeTarget(key, mergedOpts)) {
        continue;
      }
      // @ConvertPropertyが付与されたプロパティの場合、propOptsが取得できる
      const propOpts: ConvertPropertyOptions | undefined =
        Reflect.getMetadata(METADATA_KEY_CONVERT_PROP, dst, key);
      // @ConvertPropertyが指定されていないとき、オプションに応じて処理をスキップ
      if (!propOpts && mergedOpts.target === 'decorated') {
        continue;
      }
      // プロパティの型情報を @ConvertProperty()のオプション、もしくはデコレータ（サードパーティ製含む）が付与された
      // プロパティのdesign:typeメタデータから取得
      const type = (propOpts && propOpts.type) || Reflect.getMetadata('design:type', dst, key);
      const propVal = src[key];
      // 変換先の型が不明
      if (!type) {
        // 型変換を行わずに相手先のオブジェクトに挿入するオプション
        if (mergedOpts.target === 'all') {
          dst[key] = propVal;
        }
        continue;
      }
      dst[key] = this.convert(propVal, type, mergedOpts);
    }
    return dst;
  }

  private _convertObject<T>(src: any, dstType: {new(...args: any[]): T}, options?: ConvertOptions): T {
    if (src === null || src === undefined) {
      return src;
    }
    const dst: any = new dstType();
    this.populate(src, dst, dstType, options);
    return dst;
  }
  private _mergeConvertOptions(type: Constructor<any>, options?: ConvertOptions): ConvertOptions {
    const decoratorOpts = Reflect.getMetadata(METADATA_KEY_CONVERTABLE, type);
    const defaultOpts: ConvertOptions = {
      target: 'typed',
      excludes: [],
      suppressConversionError: false,
    };
    return Object.assign(defaultOpts, this.options, decoratorOpts, options);
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
    this.register(Object, convertToObject);
    this.register(Undefined, () => undefined);
  }
}
