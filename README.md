# type-converter

__type-converter__ は、TypeScript用の型変換ライブラリです。

任意のオブジェクトを指定された型へと変換します。[class-transformer](https://github.com/typestack/class-transformer)と目的は同一ですが、よりシンプルで使いやすいAPIを提供します。
以下のような特徴があります。

- シンプル…`type-converter`は、どんなオブジェクトでも目的の型に変換します。変換元のオブジェクトがどんな型であるかを気にする必要がありません。
- TypeScriptに特化…デコレータを用いて、型変換を行うプロパティを指定することができます。
- 拡張可能…`type-converter`はプラグインアーキテクチャを採用しており、自前の型変換処理を簡単に追加することができます。

## インストール

npmコマンドを利用してインストールしてください。

```shell
npm install type-converter
```

また、`type-converter`はデコレーターを使用するため、TypeScriptのコンパイラオプションに以下の指定が必要です。

```json
{
  "compilerOptions": {
    // デコレータを有効にする
    "experimentalDecorators": true,
    // デコレータのメタデータを出力する
    "emitDecoratorMetadata": true
  }
}

```


## 利用方法

`type-converter`の利用方法はとてもシンプルです。まず、変換先の型（変換「元」ではありません）が持つプロパティに対して、デコレータを付与していきます。

```typescript
import {Convertable, ConvertProperty} from 'type-converter';

@Convertable()
class ConvertTarget {
  @ConvertProperty({type: String})
  s: string;

  @ConvertProperty({type: Number})
  n: number;

  // デコレータが付与されていないので型変換の対象とならない
  noConvert: number;
}
```

こうすることで、任意のオブジェクトを上記の型（`ConvertTarget`クラス）に変換することができるようになりました。
実際の変換処理は以下のように行います。

```typescript
import {Converter} from 'type-converter';

const converter = new Converter();

// target.sが文字列、target.nは数値に変換されます。
const target = converter.convert({
  s: 123,
  n: '123',
}, ConvertTarget);
```

## `@ConvertProperty`デコレーター

上の例では、`@ConvertProperty`デコレーターを変換対象のプロパティに付与する際、`type`オプションを使用してプロパティの型を明示していました。しかし上の例では、プロパティ`s`や`n`の型は宣言と同時に明示しているため、省略することができます。

具体的には、`@ConvertProperty`は以下のような条件を満たすときに、記述を省略することができます。

### プロパティの型がジェネリクスでない場合、`type`を省略可能

上の例のように、ジェネリクスを使用していないプレーンな型の場合は、`type`を省略することができます。

```typescript
@Convertable()
class ConvertTarget {
  // {type: String}を省略
  @ConvertProperty()
  s: string;
  // {type: Number}を省略
  @ConvertProperty()
  n: number;
}
```

逆に、配列や`Promise`、`Observable`など、ジェネリクスを使用した型の場合は`type`の指定が必須になります。
この制限は、TypeScriptコンパイラが型情報を埋め込む際、ジェネリクスの型情報を削ってしまうことによるものです。

```typescript
@Convertable()
class ConvertTarget {
  // typeは省略不能
  @ConvertProperty({type: String})
  s: string[];
}
```

### 他のデコレーターが付与されている場合、`@ConvertProperty()`自体を省略可能

他のフレームワークが提供しているデコレーターを使用している場合など、`@ConvertProperty`自体を省略することができます。

```typescript
import {Entity, @Column} from 'typeorm';

@Convertable()
@Entity()
class ConvertTarget {
  // このプロパティは@Columnが付与されているため、@ConvertPropertyを省略できる
  // @ConvertProperty()
  @Column()
  s: string;
}
```

省略できる理由は、TypeScriptコンパイラの挙動によるものです。TypeScriptコンパイラは、デコレーターの種類に関わらず、デコレーターが指定されているプロパティの型情報を実行時に利用できるよう書き出すという挙動をします。そのため、`@ConvertProperty`以外のデコレーターが指定されていても、実行時に型情報を利用して変換を行うことができるのです。

ただし前述したように、ジェネリクスを用いた型については、型パラメーターに指定された型の情報を利用できません。そのため、`@ConvertProperty`の指定を省略することはできません。

```typescript
import {Entity, @Column} from 'typeorm';

@Convertable()
@Entity()
class ConvertTarget {
  // Array<string>に正しく変換するためデコレーターが必須
  @ConvertProperty({type: String})
  @Column()
  s: string[];
}
```

## 入れ子のオブジェクトに関する注意

`type-converter`を使用する上で、入れ子のオブジェクトについては注意が必要です。
例えば、TypeScriptでは以下のような宣言を行うことができます。

```typescript
@Convertable()
class ConvertTarget {
  @ConvertProperty()
  nested: {
    s: string;
    n: number;
  };
}
```

`type-converter`を用いて、上の`nested`プロパティに沿うよう型変換しようとすると、うまくいきません。

```typescript
const target = converter.convert({
  // このプロパティは型変換が行われない
  nested: {
    s: 123,
    n: '123'
  }
}, ConvertTarget);
```

これを正しく型変換できるようにするには、プロパティの型をクラスとして別途宣言する必要があります。

```typescript
@Convertable()
class NestedProperty {
  @ConvertProperty() s: string;
  @ConvertProperty() n: number;
}
@Convertable()
class ConvertTarget {
  @ConvertProperty()
  nested: NestedProperty;
}
```

これはTypeScriptコンパイラが、明示的な型を持たない入れ子のプロパティに対しては、型情報を`Object`として扱うという挙動を行うためです。
つまり、最初の例の`nested`プロパティは、型がプレーンな`Object`型になってしまい、型変換のための情報を`type-converter`が利用することができません。

二番目の例のように、プロパティの型を明示的なクラスとして宣言してやれば、そのクラスがTypeScriptコンパイラによってプロパティの型として扱われ、`type-converter`はその情報を元に型変換を行えます。

こうした制限があるせいでコードの記述量も増え、少し面倒ではありますが、プロパティの型を明示的に宣言するというのは、型の再利用性を意識することにもつながるので悪いことばかりでもありません。少し我慢してお付き合いください。

## 型変換処理の拡張

`type-converter`は簡単に拡張することができます。
`(value: any, options?: ConvertOptions) => any`というシグネチャの関数を作り、`Converter.register()`というメソッドで登録するだけです。

以下の例は、MongoDBのObjectIDに変換する処理を`type-converter`に追加するものです。

```typescript
import {Converter, ConvertOptions} from 'type-converter'
import {ObjectID} from 'mongodb';

export function convertToObjectId(value: any, options?: ConvertOptions): ObjectID {
  return new ObjectID(String(value));
}

const converter = new Converter();
// 新たな変換処理を登録
converter.register(ObjectID, convertToObjectId);
```

これで、`ObjectID`型を自動的に変換するコンバーターを利用できるようになりました。

```typescript
@Convertable()
class ConvertTarget {
  @ConvertProperty()
  id: ObjectID;
}
// idプロパティがObjectID型に変換される
converter.convert({id: '5bac84b9f7f823bc119c7452'}, ConvertTarget);
```

## オプション

型変換処理をカスタマイズするためのオプションがいくつか用意されています。
[ConvertOptions](./src/options.ts)インターフェースのコメントを参照してください。

オプションは、以下の箇所で指定可能です。（下のものほど優先されます）

- `Converter`クラスのコンストラクタ
- `@Convertable()`デコレーターのオプション
- `Converter.convert()`メソッドを呼び出す際にオプションとして指定
