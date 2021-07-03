---
layout: post
title: Typescript Minimal-Start - 1.기본 문법
author: [3기_파노]
tags: ['typescript']
date: '2021-05-23T12:00:00.000Z'
draft: false
image: ../teaser/ts-minimal-start.png
---

## 0.Intro

> 아직 자바스크립트도 잘 못하는데..

타입스크립트를 자신의 코드에 도입하는데 주저하는 분들이 있습니다.
각자의 이유가 있겠지만 러닝커브에 대한 막연한 두려움이 가장 보편적일 것입니다. 타입스크립트는 자바스크립트를 잘하는 사람들이 사용하는게 아닌가? 저 역시 배우기를 망설였습니다.

하지만 실제 초심자 입장에서 배워본 타입스크립트는 그렇지 않았습니다.

---

### 높지 않은 러닝커브

물론 타입스크립트의 모든 스펙을 파악하는 일은 많은 노력과 시간을 요할 것입니다. 하지만 이는 타입스크립트를 사용하면서 익혀가면 될 일입니다.

실제로 적용할 만큼만 학습을 하는 데에는 많은 시간이 필요하지 않았습니다.

### 점진적 적용

타입스크립트 컴파일러는 자바스크립트 코드를 그대로 컴파일해도 동작합니다. 똑똑한 타입스크립트 컴파일러가 생략된 부분을 추론하기 때문입니다. 이는 본인이 배운 만큼의 스펙을 적용해도 된다는 뜻입니다. 한 번에 완벽하게 도입하기보다는 서서히 익숙해지세요.

### 편한 자바스크립트 코딩

본인이 고려하지 않는 타입에 대한 방어코드를 짜는 일은 지루합니다. 타입스크립트는 자신이 다루고 싶은 타입에 대한 코드만을 타이핑할 수 있게 해줍니다.

또 JS였다면 인자의 타입을 추론할 수 없는 경우도(함수의 인자를 받는 등), 타입이 컴파일타임에 확정되니 IDE의 인텔리센스 기능을 이용해 편하게 사용가능한 프로퍼티를 찾을 수 있습니다.

---

타입스크립트를 도입하는데 필요한 쉽고, 작은 개념과 팁들을 소개합니다.

이 글을 읽고 나면 타입스크립트에 대한 막연한 두려움이 사라져 있을 것 입니다.

## 1. 타입 넣기

![image](https://user-images.githubusercontent.com/44419181/121903271-199b5a00-cd63-11eb-89b4-bc8599f51986.png)

간단한 자바스크립트 변수 초기화와 함수선언입니다. 이 코드에서 어떤 요소에 타입을 정해줄 수 있을까요?

![image](https://user-images.githubusercontent.com/44419181/121903342-29b33980-cd63-11eb-9c71-b1b2866eb8ab.png)

변수의 타입과 함수 인자의 타입, 리턴값에 대한 타입을 정해줄 수 있을 것 같습니다.

![image](https://user-images.githubusercontent.com/44419181/121903378-30da4780-cd63-11eb-9eeb-8d680962374e.png)

타입을 정해주었습니다. 위 코드와 같이 변수 이름, 인자 이름, 함수 인자 괄호 옆에 `: [타입이름]`을 붙여주게 되면 각각 변수 타입, 인자 타입, 함수리턴 타입이 정해집니다.

![image](https://user-images.githubusercontent.com/44419181/121903392-38015580-cd63-11eb-975a-b3b2b81344ed.png)

만약 지정해준 타입의 공간에 잘못된 타입의 리터럴을 넣어주면 위와같은 에러메시지가 IDE 또는 콘솔창에 나타나게 됩니다.

## 2. 기본 타이핑

```ts
// 원시타입
const num: number = 123;
const str: string = 'string';
const tru: boolean = true;
// 원시값
const nul: null = null;
const undef: undefined = undefined;
```

1. 기본적으로 타입스크립트는 원시타입/원시값인 `string`, `number`, `boolean`, `null`, `undefined` 등을 제공합니다.

```ts
const numberArray: number[] = [1, 2, 3];
const stringArray: Array<string> = ['d', 'o', 'g', 'e'];
```

2. 배열은 `타입이름[]`이나 `Array<타입이름>`으로 나타냅니다.

```ts
// 원시타입
const num: any = 123;
const str: any = 'string';
const tru: any = true;
// 원시값
const nul: any = null;
const undef: any = undefined;
```

3. `any`라는 타입은 모든 값이 할당될 수 있는 타입입니다. (모든 타입을 허용하기에 타입스크립트를 쓰는 이점이 없습니다. 그러므로 지양해야 합니다.)

```ts
const onlyHi: 'hi' = 'hi';
const only123: 123 = 123;
```

4. `number` 리터럴, `string` 리터럴을 직접 타입으로 줄 수도 있습니다.

5. 이외에도 `void`, `unknown`, `never` 등 많은 타입이 있습니다. 몇몇은 이후에 소개하겠으나, 이외 타입은 생략하니 추후 공식문서를 참고하는 것을 권합니다.

## 2. 객체 타이핑 / 내가 만드는 타입

JS는 거의 대부분의 것들이 객체로 이뤄져있습니다.
객체도 타입으로 나타낼 수 있을까요? 가능합니다.

```js
const myInfo = {
  nickname: 'fano',
  age: 75,
  city: 'seoul',
};
```

위와 같은 객체가 있다면,

```ts
const myInfo: { nickname: string; age: number; city: string } = {
  nickname: 'fano',
  age: 75,
  city: 'seoul',
};
```

위와 같이 프로퍼티를 타입으로 만들어줄 수 있습니다.
그런데 좀 길지 않나요?

### interface & type

```ts
// interface
interface MyInfo {
  nickname: string;
  age: number;
}

// type
type MyInfo = {
  nickname: string;
  age: number;
};
```

interface 또는 type 키워드를 통해서 위 타입을 간단하게 이름을 지어줘 표현할 수 있습니다. 이 중에서 뭘 써야할까요? 둘의 차이점은 이후 목차에서 다루도록 하겠습니다. 결론만 내자면

> For the most part, you can choose based on personal preference, and TypeScript will tell you if it needs something to be the other kind of declaration. If you would like a heuristic, use interface until you need to use features from type.

[공식문서](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#interfaces)는 쓰고 싶은거 골라써도 상관 없는데 `type`의 기능이 필요하기 전까지는 `interface`를 사용하는게 어떻겠냐고 하네요 :)

## 3. 확장하기

```ts
const myInfo {
  nickname: 'fano',
  age: 75,
}

const myAccountInfo {
  nickname: 'fano',
  age: 75,
  id: 'fanoId',
  password: 'fanoPassword',
}
```

위 객체들의 타입을 정해주려고 하는데, 중복되는 부분이 많네요.
이때는 기존타입을 재활용할 수 있습니다.

```ts
// interface
interface MyInfo {
  nickname: string;
  age: number;
}

interface MyAccountInfo extends MyInfo {
  id: string;
  password: string;
}
```

`interface`는 `extends` 키워드로 기존 타입에서 확장합니다.

```ts
// type
type MyInfo = {
  nickname: string;
  age: number;
};

type MyAccountInfo = {
  id: string;
  password: string;
} & MyInfo;
```

`type`은 `&`연산자를 통해 기존 타입과 합성합니다

```ts
// js
function playWithDoge(type) {
  if (type === 'throw')
    console.log('도지코인을 던집니다');
  else if (type === 'buy')
    console.log('도지코인을 더 구매합니다');
}

// ts
function playWithDoge(type: 'throw' | 'buy') {
 ...
}
```

`|` 연산자를 통해서 하나의 변수, 인자가 두 가지 이상의 타입을 허용할 수도 있습니다.

## 함수 타입

함수도 타입으로 정의할 수 있습니다. JS는 함수를 1급시민(first-class citizen)으로 다루고, 또 자주 사용되기에 이 부분도 알아두셔야 합니다.

```js
// ts
const buyDoge = (krw: number) => {
  return krw / 370 + '도지 코인을 구매하셨습니다.';
};
```

위 buyDoge라는 함수가 있습니다. `number`를 전달 받아 `string`을 반환합니다.

```ts
const buyDoge: (krw: number) => string = (krw: number) => {
  return krw / 370 + '도지 코인을 구매하셨습니다.';
};
```

함수타입은 krw 식별자에 타입을 지정해주고 => 이후 리턴타입을 작성해줌으로써 정의할 수 있습니다.

```ts
// type
type BuyDogeType = (krw: number) => void;

const buyDoge: BuyDogeType = (krw: number) => {
  console.log(krw / 370 + '도지 코인을 구매하셨습니다.');
};
```

함수 타입 역시 별명을 따로 붙여줄 수도 있습니다.

그리고 이전에 타입 설명할 때 넘어갔던 `void`가 보입니다.

상단의 buyDoge함수는 console.log만 호출하고, 어떤 값을 리턴하지 않고 있습니다.

`void`는 `any`와 반대로 어떤 타입도 아님을 나타냅니다.

리턴타입에 주로 쓰이는데, 이는 함수가 어떤 리턴 값도 갖고 있지 않음을 의미합니다.

## 1부 마침

이렇게 타입스크립트의 기본적인 문법을 알아보았습니다!
[2장](https://woowacourse.github.io/tecoble/post/2021-06-20-typescript-minimal-start-2.md)에서는 제네릭, 타입추론, 타입강제, 유용한 유틸리티타입을,
3장에서는 프론트엔드 프레임워크인 리액트에 적용해보는 시간과 타입스크립트를 사용하면서 애매한 부분에 대한 내용을 다뤄보겠습니다.

감사합니다!

### Reference

https://www.typescriptlang.org/docs/handbook/2/basic-types.html
