import {Converter} from './converter';
import {ConvertProperty, Convertable} from './decorators';
import {assert} from 'chai';
import {ConversionError} from './types';

class NestedClass {
  @ConvertProperty()
  s: string;
}

class ConvertTarget {
  @ConvertProperty()
  s: string;

  @ConvertProperty()
  n: number;

  @ConvertProperty()
  d: Date;

  @ConvertProperty()
  b: boolean;

  @ConvertProperty()
  nil: null;

  @ConvertProperty()
  nestedPlain: {};

  @ConvertProperty()
  nestedClass: NestedClass;

  // design:type メタデータが出力されないため、型変換が発生しない
  noConvert: number;
}

class ObjectID {
  constructor(private s: string) {
  }
  toString(): string {
    return this.s;
  }
}

function ThirdPartyDecorator(): any {
  return function (): any {};
}

@Convertable({
  target: 'all',
  suppressConversionError: false,
  excludes: ['n'],
})
class OptionSpecified {
  @ConvertProperty()
  s: string;

  @ConvertProperty()
  n: number;

  @ThirdPartyDecorator()
  decoratedByThirdParty: string;

  notDecorated: string;
}

describe('converter', () => {

  describe('convert()', () => {
    it ('nullやundefinedは変換されずにそのままとなる', () => {
      const converter = new Converter();
      assert.propertyVal(converter.convert({s: undefined}, ConvertTarget), 's', undefined, 'undefined is not changed');
      assert.propertyVal(converter.convert({s: null}, ConvertTarget), 's', null, 'null is not changed');
    });
    it('様々な型からstringへの変換をデフォルトで行える', () => {
      const converter = new Converter();
      const date = new Date();
      assert.propertyVal(converter.convert({s: '123'}, ConvertTarget), 's', '123', 'string to string');
      assert.propertyVal(converter.convert({s: 123}, ConvertTarget), 's', '123', 'number to string');
      assert.equal(converter.convert({s: date}, ConvertTarget).s, date.toISOString(), 'date to string');
      assert.propertyVal(converter.convert({s: true}, ConvertTarget), 's', 'true', 'boolean to string');
      assert.propertyVal(converter.convert({s: {}}, ConvertTarget), 's', '[object Object]', 'object to string');
    });
    it('様々な型からnumberへの変換をデフォルトで行える', () => {
      const converter = new Converter();
      const date = new Date();
      assert.propertyVal(converter.convert({n: '123'}, ConvertTarget), 'n', 123, 'string to number');
      assert.propertyVal(converter.convert({n: 123}, ConvertTarget), 'n', 123, 'number to number');
      assert.isNaN(converter.convert({n: NaN}, ConvertTarget).n, 'NaN to NaN');
      assert.throw(() => converter.convert({n: date}, ConvertTarget));
      assert.throw(() => converter.convert({n: true}, ConvertTarget));
      assert.throw(() => converter.convert({n: false}, ConvertTarget));
      assert.throw(() => converter.convert({n: {}}, ConvertTarget));
    });
    it('様々な型からDateへの変換をデフォルトで行える', () => {
      const converter = new Converter();
      const date = new Date();
      assert.equal(converter.convert({d: date}, ConvertTarget).d.getTime(), date.getTime(), 'date to date');
      assert.equal(
        converter.convert({d: date.toISOString()}, ConvertTarget).d.getTime(), date.getTime(), 'ISO string to date');

      assert.equal(
        converter.convert({d: date.toDateString()}, ConvertTarget).d.getTime(),
        new Date(date.toDateString()).getTime(), 'Date string to date');
      assert.equal(converter.convert({d: 123}, ConvertTarget).d.getTime(), 123, 'number to date');
      assert.throw(() => converter.convert({d: true}, ConvertTarget));
      assert.throw(() => converter.convert({d: false}, ConvertTarget));
      assert.throw(() => converter.convert({d: {}}, ConvertTarget));
    });
    it('様々な型からbooleanへの変換をデフォルトで行える', () => {
      const converter = new Converter();
      const date = new Date();
      assert.propertyVal(converter.convert({b: '123'}, ConvertTarget), 'b', true, 'string to boolean');
      assert.propertyVal(converter.convert({b: 123}, ConvertTarget), 'b', true, 'number to boolean');
      assert.equal(converter.convert({b: date}, ConvertTarget).b, true, 'date to boolean');
      assert.propertyVal(converter.convert({b: true}, ConvertTarget), 'b', true, 'boolean to boolean');
      assert.propertyVal(converter.convert({b: {}}, ConvertTarget), 'b', true, 'object to boolean');

      assert.propertyVal(converter.convert({b: 0}, ConvertTarget), 'b', false);
      assert.propertyVal(converter.convert({b: -0}, ConvertTarget), 'b', false);
      assert.propertyVal(converter.convert({b: null}, ConvertTarget), 'b', false);
      assert.propertyVal(converter.convert({b: false}, ConvertTarget), 'b', false);
      assert.propertyVal(converter.convert({b: NaN}, ConvertTarget), 'b', false);
      assert.propertyVal(converter.convert({b: undefined}, ConvertTarget), 'b', false);
    });
    it('プレーンなオブジェクトからクラスインスタンスへの変換をデフォルトで行える', () => {
      const converter = new Converter();
      const date = new Date();
      const result = converter.convert({nestedClass: {s: 123}}, ConvertTarget);
      assert.instanceOf(result.nestedClass, NestedClass);
      assert.equal(result.nestedClass.s, '123');
    });
    it('配列全ての要素が変換される', () => {
      const converter = new Converter();
      const array = converter.convert([1, 2, 3], String);
      assert.sameOrderedMembers(['1', '2', '3'], array);
    });
  });
  describe('ConvertOptions', () => {
    it('オプションはメソッド引数、デコレータ、Converterの順に優先される', () => {
      // Converterのオプションに指定してみるが、デコレータの指定（'n'のみ除外）が優先される。
      const converter = new Converter({excludes: ['s', 'n'], target: 'decorated'});
      let result = converter.convert({
          s: 'abc',
          n: 123
      }, OptionSpecified);
      assert.equal(result.s, 'abc');
      assert.isUndefined(result.n);

      // メソッド引数で、excludesを空にする
      result = converter.convert({
        s: 'abc',
        n: 123
      }, OptionSpecified, {excludes: []});
      assert.equal(result.s, 'abc');
      assert.equal(result.n, 123);
    });
    it('suppressConversionErrorにtrueを指定されていると、ConversionErrorの発生が抑制される', () => {
      const converter = new Converter();
      // まずConversionErrorの発生を確認
      assert.throws(() => converter.convert({n: 'abc'}, ConvertTarget), ConversionError);
      // 抑制
      assert.doesNotThrow(() => converter.convert({n: 'abc'}, ConvertTarget, {suppressConversionError: true}));

      // Date型でも確認
      assert.throws(() => converter.convert({d: 'abc'}, ConvertTarget), ConversionError);
      assert.doesNotThrow(() => converter.convert({d: 'abc'}, ConvertTarget, {suppressConversionError: true}));
    });
    it('includes: "all"が指定されていて変換先の型が不明な場合も値がセットされる', () => {
      const converter = new Converter();
      const result = converter.convert({notDecorated: 'abc'}, OptionSpecified, {target: 'all'});
      assert.equal(result.notDecorated, 'abc');
    });
    it('includes: "typed"が指定されていると、変換先の型情報が取得できるプロパティにのみ値がセットされる', () => {
      const converter = new Converter();
      const result = converter.convert({
        s: 'abc',
        decoratedByThirdParty: 'abc',
        notDecorated: 'abc'
      }, OptionSpecified, {target: 'typed'});
      assert.equal(result.s, 'abc');
      assert.equal(result.decoratedByThirdParty, 'abc');
      assert.isUndefined(result.notDecorated);
    });
    it('includes: "decorated"が指定されていると、@ConvertPropertyが付与されたプロパティにのみ値がセットされる', () => {
      const converter = new Converter();
      const result = converter.convert({
        s: 'abc',
        decoratedByThirdParty: 'def',
        notDecorated: 'ghi'
      }, OptionSpecified, {target: 'decorated'});
      assert.equal(result.s, 'abc');
      assert.isUndefined(result.decoratedByThirdParty);
      assert.isUndefined(result.notDecorated);
    });
    it('excludesが指定されているプロパティには値がセットされない', () => {
      const converter = new Converter();
      // s以外のプロパティをすべて除外する
      const result = converter.convert({
        s: 'abc',
        b: true,
        n: 123,
        noConvert: 'abc',
      }, ConvertTarget, {
          excludes: [
            'b',
            (key) => key === 'n',
            /no/
          ]
        });
      assert.deepEqual(result, {s: 'abc'});
    });
    it('suppressConversionError', () => {

    });
  });
  describe('register()', () => {
    it('新しいコンバータ関数を登録できる', () => {
      const converter = new Converter();
      converter.register(ObjectID, (value) => new ObjectID(String(value)));
      const objectId = converter.convert('abc', ObjectID);
      assert.instanceOf(objectId, ObjectID);
      assert.equal(objectId.toString(), 'abc');
    });
  });
});
