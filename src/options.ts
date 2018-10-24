export interface ConvertOptions {

  /**
   * 型変換を行わないプロパティ
   */
  excludes?: (string | RegExp | {(propName: string): boolean})[];

  /**
   * 型情報がないプロパティを無視するかどうか（デフォルトはfalse）
   */
  ignoreMissingTypeInfo?: boolean;
}

export interface ConvertPropertyOptions {
}
