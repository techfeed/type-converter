/* eslint-disable */
'use strict';

import {Constructor} from './types';

export interface ConvertOptions {

  /**
   * 型変換を行わないプロパティ
   */
  excludes?: (string | RegExp | {(propName: string): boolean})[];

  /**
   * 元のオブジェクトから、どのプロパティを対象とするかを指定します。
   *
   * - 'all': 元のオブジェクトが持つ全てのプロパティを対象とします。
   * - 'typed': 型情報を持つ全てのプロパティを対象とします（デフォルト）。型情報は、`@ConvertProperty` に限らず、サードパーティ製のプロパティデコレータが付与されていた場合も保持されます。
   * - 'decorated': 変換先のクラスで、`@ConvertProperty`デコレータが付与されているプロパティのみを対象とします。
   */
  target?: 'all' | 'typed' | 'decorated';

  /**
   * ConversionErrorを発生させない
   */
  suppressConversionError?: boolean;
}

export interface ConvertPropertyOptions {
  type?: Constructor<any>;
}
