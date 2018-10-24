import {Converter} from './converter';
import {Convert} from './decorators';
import {assert} from 'chai';

class NestedClass {
  @Convert()
  s: string;
}

class ConvertTarget {
  @Convert()
  s: string;

  @Convert()
  n: number;

  @Convert()
  d: Date;

  @Convert()
  b: boolean;

  @Convert()
  nil: null;

  @Convert()
  nestedPlain: {};

  @Convert()
  nestedClass: NestedClass;
}

class ObjectID {
  constructor(private s: string) {
  }
  toString(): string {
    return this.s;
  }
}

describe('converter', () => {

  describe('convert()', () => {
    it ('nullやundefinedは変換されずにそのままとなる', () => {
      const converter = new Converter();
      assert.propertyVal(converter.convert({s: undefined}, ConvertTarget), 's', undefined, 'undefined is not changed');
      assert.propertyVal(converter.convert({s: null}, ConvertTarget), 's', null, 'null is not changed');
    });
    it('配列を渡すとエラーになる', () => {
      const converter = new Converter();
      assert.throw(() => converter.convert([], ConvertTarget));
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
  describe('convertArray', () => {
    it('配列全ての要素が変換される', () => {
      const converter = new Converter();
      const array = converter.convertArray([1, 2, 3], String);
      assert.sameOrderedMembers(['1', '2', '3'], array);
    });
  });
});
