---
layout: post
title: Typescript Minimal-Start - 1.기본 문법
author: [파노]
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

물론 타입스크립트의 모든 스펙을 파악하는 일은 많은 노력과 시간을 요할 것입니다. 하지만 이는 타입스크립트를 사용하면서 익혀가면 될 일입니다. 저는 우아한테크코스 리액트 미션을 진행하면서 도입하였는데요. 리액트, 리덕스 등 새로운 기술을 학습, 도입해야하는 시기에 추가로 타입스크립트도 적용했습니다. 그렇게 현업에 계신 리뷰어님들에게 타입스크립트 코드 리뷰를 받으면서 차츰 익숙해질 수 있었습니다! 실제로 적용할 만큼만 학습을 하는 데에는 그렇게 많은 시간이 필요하지 않았습니다.

### 점진적 적용

타입스크립트 컴파일러는 자바스크립트 코드를 그대로 컴파일해도 동작합니다. 똑똑한 타입스크립트 컴파일러가 생략된 부분을 추론하기 때문입니다. 이는 본인이 배운 만큼의 스펙을 적용해도 된다는 뜻입니다. 한 번에 완벽하게 도입하기보다는 서서히 익숙해지세요.

### 편한 자바스크립트 코딩

본인이 고려하지 않는 타입에 대한 방어코드를 작성하는 일은 지루합니다. 타입스크립트는 자신이 다루고 싶은 타입에 대한 코드만을 타이핑할 수 있게 해줍니다. 또 JS였다면 인자의 타입을 추론할 수 없는 경우도(함수의 인자를 받는 등), 타입이 컴파일타임에 확정되니 IDE의 인텔리센스 기능을 이용해 편하게 사용가능한 메서드, 프로퍼티를 찾을 수 있습니다. 서드파티 라이브러리를 사용하면서 무슨 메서드가 있나 공식문서를 뒤적인적이 있나요? 저의 경우는 타입스크립트를 쓰면서는 인텔리센스로 어떤 선택지가 있는지 먼저 살펴볼 수 있어 학습에도 많은 도움이 되었습니다.

### 그 자체로 문서가 된다.

남이 작성한 코드를 보거나, 자신이 작성한 코드를 시간이 지나 다시 보는 일이 쉽지는 않은 것 같아요. 이 함수가 무슨 타입의 인자를 받는건지, 어떤 값을 반환하는지 유추(기억)하는데 노력이 꽤 듭니다. JS는 동적타입 언어이기에 네이밍에 의존해야하는 부분이 없지않아 있었어요(아니면 JSDoc을 작성해야 했죠). 하지만 타입스크립트를 도입하면서 변수, 인자, 반환 값에 대한 타입을 확실하게 정하니 시간이 지나 찾아봐도 어떤 타입의 값을 받고, 반환하는지 알 수 있었습니다. 큰 노력을 들이지 않고 문서화를 하는 셈입니다. 이는 협업할 때도 큰 장점이 될 수 있을 거에요.

---

타입스크립트를 도입하는데 필요한 최소 단위의 개념과 팁들을 소개합니다.
타입스크립트 공식문서를 읽기 전에 이 시리즈를 읽어보세요. 문서가 무슨 말을 하는 건지 이해가 훨씬 쉬울 거에요.
타입스크립트에 대한 막연한 두려움이 사라지기를 바랍니다.

## 1. 타입 넣기

![](https://images.velog.io/images/fan/post/003f81bf-6209-4195-972c-850cf11ddc7d/code3.png)

간단한 자바스크립트 변수 초기화와 함수선언입니다. 이 코드에서 어떤 요소에 타입을 정해줄 수 있을까요?

![](https://images.velog.io/images/fan/post/ac25cc54-9558-4c58-aa87-ed8e9eafceee/image.png)

변수의 타입과 함수 인자의 타입, 리턴값에 대한 타입을 정해줄 수 있을 것 같습니다.

![](https://images.velog.io/images/fan/post/f35d6863-98dc-4a9a-aaf2-9ef6c912fae6/code4.png)

타입을 정해주었습니다. 위 코드와 같이 변수 이름, 인자 이름, 함수 인자 괄호 옆에 `: [타입이름]`을 붙여주게 되면 각각 변수 타입, 인자 타입, 함수리턴 타입이 정해집니다.

![](https://images.velog.io/images/fan/post/d2afe5fa-4884-4b1f-9365-f79e1cc8d78f/image.png)

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

4. `number 리터럴`, `string 리터럴` 등등 리터럴을 직접 타입으로 줄 수도 있습니다.
   이를 리터럴 타입이라고 합니다

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

## 1부 마침

이렇게 타입스크립트의 기본적인 문법을 알아보았습니다!
2장에서는 제네릭, 타입추론, 타입강제, 유용한 유틸리티타입을,
3장에서는 프론트엔드 프레임워크인 리액트에 적용해보는 시간과 타입스크립트를 사용하면서 애매한 부분에 대한 내용을 다뤄보겠습니다.

감사합니다!

### Reference

https://www.typescriptlang.org/docs/handbook/2/basic-types.html
