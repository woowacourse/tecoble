---
layout: post
title: Typescript Minimal-Start - 2. 좀 더 나아가기
author: [3기_파노]
tags: ['typescript']
date: '2021-06-21T12:00:00.000Z'
draft: false
image: ../teaser/ts-minimal-start.png
---

## 0.Intro

1편에서 타입스크립트의 기본적인 문법에 대해 알아보았습니다.
이번 포스팅에서는 타입스크립트에서 조금 더 심화된 내용을 다뤄봅니다.
시리즈의 컨셉을 따라 개념적 맥락을 파악할 수 있는 수준에서 최소한의 개념을 다룹니다.

## Table of Contents

1. 타입 추론
2. 타입 강제
3. 제네릭
4. 유용한 유틸리티 타입

## 1. 타입추론

1편에서 봤던 변수와 함수에 대한 타입선언 기억나시나요?

![image](https://user-images.githubusercontent.com/44419181/121903378-30da4780-cd63-11eb-9eeb-8d680962374e.png)

타입스크립트 컴파일러는 위처럼 개발자가 명시적으로 지정하지 않은 부분에 대해서 어떤 타입인지 추론을 합니다.

이를 테면

![image](https://user-images.githubusercontent.com/44419181/123501263-993bf980-d67e-11eb-8519-0eea344e3ed1.png)

변수선언에 타입을 따로 지정해주지 않았음에도 변수에 1000이라는 숫자 리터럴이 할당되었기에 타입스크립트 컴파일러는 해당 변수의 타입이 `number`라고 추론하는 것이죠.
이는 변수선언 뿐만이 아닌 타입이 명시적으로 선언될 수 있는 함수의 인자, 리턴 타입 등에 적용됩니다.

타입스크립트의 타입추론은 생각보다 똑똑하게 동작합니다.

![image](https://user-images.githubusercontent.com/44419181/123501506-64c93d00-d680-11eb-9555-1db3f36c1368.png)

forEach메서드에 전달하는 콜백함수에 대한 인자를 추론하기도 하구요.

![image](https://user-images.githubusercontent.com/44419181/123501557-c2f62000-d680-11eb-80cb-4bbb9277d0d7.png)

addEventListener메서드에 전달하는 콜백함수의 인자를 event타입이라고 추론하기도 합니다.
이를 코드의 위치에 따라 타입을 추론한다하여, Contextual Typing이라고 합니다.

### noImplicitAny

일반적인 함수의 인자 타입과 같이 타입을 직접 명시해주지 않으면, 어떤 타입을 받을 것인지 추론할 수 없는 경우가 있습니다.

![image](https://user-images.githubusercontent.com/44419181/123502037-33527080-d684-11eb-85a7-1f490ad1dc3b.png)

이때 타입스크립트 컴파일러는 해당 요소의 타입을 `any`로 추론합니다.
따라서 해당 요소는 모든 타입을 수용할 수 있게 됩니다.
이는 암시적으로 타이핑이 이뤄지는 것이기에 장기적으로 봤을 때 버그가 될 수 있는 지점입니다. 다른 사용자 (혹은 미래의 나)가 함수의 의도를 오인하고 잘못된 타입의 인자를 전달해줄 수 있기 때문입니다. 그러므로 지양해야 합니다.

이때 `noImplicitAny`라는 [`tsconfig.json`](https://typescript-kr.github.io/pages/tsconfig.json.html) 파일의 옵션을 `true`로 지정해주는 것이 좋습니다.

`noImplicitAny`옵션은 명시되지 않은 타입을 컴파일러가 추론할 때 `any`로 추론하게 되면 컴파일 에러로 나타내는 기능입니다.

### noImplicitReturn

`noImplicitAny`와 같은 맥락의 `tsconfig.json` 파일의 옵션으로, 함수가 조건에 따라 명시적으로 `return`을 하지 않았을 때 에러를 발생시켜주는 기능입니다.

함수 내에 `return`문이 존재하지 않는다면 컴파일러는 해당 함수의 리턴타입을 `void`로 추론합니다. 따라서 문제가 발생하지 않습니다.

![image](https://user-images.githubusercontent.com/44419181/123502439-66e2ca00-d687-11eb-8c68-f5992ed0ee15.png)

하지만 위와 같이 분기에 따라 반환이 될 수도 있고, 되지 않을 수도 있는 경우에 `noImplicitReturn`옵션이 `true`라면 컴파일 에러가 발생합니다. 반환값이 `undefined`가 되기에 추후에 발생할 수 있는 버그를 미연에 방지할 수 있습니다.

## 2. 타입 강제

이렇게 똑똑한 타입스크립트 컴파일러지만 모든 경우에 컴파일러의 타입추론이 제대로 동작하는 것은 아닙니다.

![image](https://user-images.githubusercontent.com/44419181/123502923-b2e33e00-d68a-11eb-8ecc-e99cee8fd060.png)

임의의 버튼을 가져와 click 이벤트를 발생시키는 코드입니다.
타입이 `Element`여서 타입추론이 온전하게 진행되지 않은 것이죠. 사실 컴파일러 입장에서는 어떤 요소를 가져올지 알 수 없기 때문에 (가져오는 요소는 런타임에서 알 수 있기 때문에) 자연스러운 결과입니다.

![image](https://user-images.githubusercontent.com/44419181/123502984-09e91300-d68b-11eb-9f6f-609f7edc673f.png)

`as` 라는 키워드를 통해 타입을 강제로 지정했습니다.
그러니 `click` 메서드를 호출하는 부분에서도 에러가 발생하지 않습니다.

![image](https://user-images.githubusercontent.com/44419181/123503031-4d438180-d68b-11eb-8055-c70c84b8e648.png)

위와 같이 강제를 할 수도 있습니다. 하지만 최근에는 전자의 문법이 더 흔하게 쓰이는 것으로 보입니다.

타입 강제는 사용자가 임의로 타입을 정하는 부분이므로 사용에 주의가 필요합니다.
최대한 사용을 자제하되 불가피하게 사용되어야 하는 부분에 정확한 타입을 강제하여 주세요.

## 3. 제네릭

제네릭은 타입스크립트만의 특별한 문법이 아닙니다. 그러므로 다른 언어(대표적으로 C++이나 JAVA)에서 제네릭에 대해 배운 적이 있다면 빠르게 넘어가실 수 있을 겁니다.

처음 접했다면 쫄지 마세요. 대부분의 제네릭은 그렇게 어렵지 않습니다.

함수를 선언할 때 매개변수(어떤 값이 전달될지 모르는 상태)를 정의해서 임의로 사용합니다.

```js
const sayHi = target => {
  console.log(target, '아, 안녕!'); // target이라는 어떤 값이 들어올지 모르는 매개변수를 정해서 임의로 사용했습니다.
};
```

제네릭은 어떤 타입을 전달받을지 미리 알 수 없는 상황에서, 임의의 타입변수를 정해서 사용하는 문법입니다.

```ts
// 표현식
const genericFunc = <T>(t: T): T => t;

// 선언식
function genericFunc<T>(t: T): T {
  return t;
}

genericFunc<number>(1);
genericFunc<string>('2');

genericFunc<number>('숫자'); // Argument of type 'string' is not assignable to parameter of type 'number'.
```

꺽쇠(<>)를 사용해서 `T`라는 **_타입변수_**를 지정합니다.

![image](https://user-images.githubusercontent.com/44419181/123505396-d497f180-d699-11eb-8b22-e39b4d8b5cf7.png)

타입변수를 전달하지 않았다면 컴파일러가 전달된 함수 인자를 바탕으로 타입추론을 합니다.

```ts
const genericFunc2 = <T1, T2>(a: T1, b: T2): [T1, T2] => [a, b];

genericFunc2<number, string>(123, '헬로'); // [123, '헬로']
```

위와 같이 쉼표(,)를 이용해서 여러 개의 타입변수를 전달할 수도 있습니다.

그런데 지금의 제네릭은 모든 타입을 허용하는 듯합니다. 함수의 인자도 타입을 명시해서 전달할 수 있는 타입을 제한하는데 제네릭은 타입변수를 어떻게 제한할까요?

```ts
const genericFunc3 = <T extends string | number>(a: T): T[] => [a];

genericFunc3<string>('hi'); // ['hi']

genericFunc3<boolean>(false); // Type 'boolean' does not satisfy the constraint 'string | number'
```

`extends`라는 키워드를 통해 타입을 제한할 수 있습니다. `boolean` 타입을 타입변수로 전달했더니 컴파일러가 에러를 나타냈습니다.

## 4. 유용한 유틸리티 타입

타입스크립트는 사용자가 만든 타입의 활용도를 더 끌어올리기 위해 유틸리티 타입을 제공합니다. 유틸리티 타입은 기존의 타입을 활용해
새로운 타입을 만들어주는 타입이라고 정의할 수 있습니다.

### Pick<Type, Keys>

객체타입 `Type`에서 해당 객체타입이 가진 프로퍼티 key가 조합된 `Keys`를 전달해 `Keys` 프로퍼티만으로 구성된 객체타입을 새롭게 구성합니다.

새롭게 만들려는 타입이 기존 객체타입에 의존성을 갖고 있고, 필요없는 프로퍼티를 소거해 가져오는 것보다 필요한 것만 명시해서 가져오는게 이득이 클 경우 사용합니다.

```ts
interface UserInfo {
  // 유저의 정보를 담는 타입
  id: string;
  password: string;
  name: string;
  address: string;
}

type UserLogin = Pick<UserInfo, 'id' | 'password'>; // 로그인에 필요한 ID와 password 프로퍼티만 가져온다.
```

![image](https://user-images.githubusercontent.com/44419181/123508107-4b3beb80-d6a8-11eb-9ca9-2135bc073c38.png)

의도한대로 id와 password 프로퍼티만으로 구성된 객체타입이 만들어졌습니다.

### Omit<Type, keys>

`Omit`은 `Pick`과 대척점에 서있는 유틸리티 타입입니다. omit, 단어의 뜻 그대로 해당 객체타입 `Type`에서 프로퍼티를 소거해 새로운 객체타입을 만드는데 사용합니다.

```ts
interface SignUpForm {
  // 회원가입시에 사용하는 객체 타입
  id: string;
  password: string;
  passwordForCheck: string;
  name: string;
  address: string;
}

type SignUpSubmit = Omit<SignUpForm, 'passwordForCheck'>; // 서버에 전달할 때는 password 하나만 전달함으로 passwordForCheck를 생략한다.
```

![image](https://user-images.githubusercontent.com/44419181/123508274-4e83a700-d6a9-11eb-98c3-c25c800d2ccc.png)

`passwordForCheck` 프로퍼티가 생략된 객체 타입이 만들어졌습니다.

### Exclude<Type, ExcludedUnion>

`Exclude` 타입은 `Omit`과 역할이 유사하나, union타입에서 멤버타입을 소거한 타입을 생성하고자 할 때 사용합니다. Omit은 객체타입, Exclude는 union 타입. 기억해두면 편리합니다.

```ts
type Color = 'red' | 'blue' | 'pink' | 'orange';

type RedishColor = Exclude<Color, 'blue'>; // 색상 중 blue를 제외한 붉은 컬러만 union 타입으로 구성한다.
```

### Partial<Type>

`Partial`은 전달한 객체타입의 모든 프로퍼티를 optional로 만듭니다.
`Partial`을 통해 생성된 타입은 원 객체타입 중 프로퍼티를 전달하지 않거나, 일부만 전달해도 적합한 타입으로 인정받지만, 원 객체타입에 없는 프로퍼티를 전달하면 에러를 발산합니다.

개인적으로 기존 객체를 업데이트하는 함수를 만들때 인자로 Partial 타입을 사용하니 굉장히 코드가 깔끔해졌습니다.

```ts
interface UserInfo {
  id: string;
  password: string;
  name: string;
  address: string;
}

type UserInfoUpdate = Partial<UserInfo>;
```

![image](https://user-images.githubusercontent.com/44419181/123509052-5134cb00-d6ae-11eb-9874-9dd983bef2b1.png)

`UserInfo`의 모든 프로퍼티가 optional로 바뀐 객체타입이 만들어졌습니다.

## 2부 마침

이렇게 1~2부에 걸쳐 타입스크립트의 문법을 다뤄보았습니다.
3부에서는 프론트엔드 프레임워크 React에 실제로 적용해보는 시간과 타입스크립트를 사용하면서 애매한 부분에 대한 내용을 다뤄보겠습니다.

이해가 되지 않는 부분이 있다면 댓글로 남겨주세요.

감사합니다!

### Reference

- https://www.typescriptlang.org/docs/handbook/type-inference.html
- https://www.typescriptlang.org/docs/handbook/utility-types.html
- https://www.typescriptlang.org/docs/handbook/2/generics.html
- https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
