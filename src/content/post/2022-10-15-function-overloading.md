---
layout: post
title: '함수 오버로딩'
author: [4기_시지프]
tags: ['test', 'cypress']
date: '2022-10-15T12:00:00.000Z'
draft: true
image: ../images/TypeScript-FunctionOverloading.png
---

<br>

<img src="../images/TypeScript-FunctionOverloading.png" alt="메인">

<br/>

# 서언

TypeScript에는 **Function Overloading** 기능이 있습니다. 이번에 Function Overloading의 강력함을 깨닫고, 이를 공유하고자 아티클을 씁니다. 함수 오버로드가 왜 필요한지 이해하고, useRef 예시와 저희 프로젝트에 적용해본 예시를 설명드리겠습니다.

<br/>

# 타입스크립트에서 함수 오버로딩이 왜 필요한가?

자바스크립트는 인자의 개수 제한, 인자의 타입 제한이 없습니다. 코드 예시를 보겠습니다.

```ts
function add(a, b, c) {
  if (b) {
    if (c) {
      return a + b + c;
    }
    return a + b;
  }
  return a;
}

console.log(add(1, 2, 3)); // 6
console.log(add(1, 2)); // 3
console.log(add(1)); // 1

console.log(add('시', '지', '프')); // 시지프
console.log(add('시', '짚')); // 시짚
console.log(add('짚')); // 짚
```

add 함수만 보고는 숫자를 더하는 함수인지, 문자를 더하는 함수인지 역할을 파악하기 어렵습니다. 가령 저는 숫자를 더하기 위해 만들었지만, 다른 팀원은 문자를 합치기 위해 사용하고 있다면 소통이 원활히 이루어졌다고 말하기 어려울 것입니다. 이때 타입스크립트가 강력한 역할을 합니다. 타입스크립트가 즉, JSDoc과 같이 코드 명세 역할을 하여 더 나은 협업을 이끌 수 있습니다.

위 코드에 타입을 얹어봅시다.

```ts
function add(a: number | string, b?: number | string, c?: number | string): number | string {
  if (b) {
    if (c) {
      return a + b + c;
      // Operator '+' cannot be applied to types 'string | number' and 'string | number'.
    }
    return a + b;
  }
  return a;
}
```

가장 먼저 떠오르는 것은 위와 같이 타이핑하는 것인데요. 공교롭게도 이러한 타이핑은 에러를 발생시킵니다. string | number에 '+' 연산을 할 수 없다는 것입니다. 다른 방식의 해결이 필요합니다.

저는 타입스크립트에서 **무분별한 <유니온> 사용을 경계**해야 한다고 생각합니다. 무분별한 유니온은 가짓수 확장을 곱절로 늘립니다. 위 케이스를 보면, add 함수가 가질 수 있는 가지수는 최대 2^4 = 16 개 입니다. a, b, c, ReturnType의 가짓수를 크로스해주면 16개가 될 것입니다.

과연 add 함수가 16가지를 모두 커버하는 것이 좋은 타이핑일까요? 아닐 것입니다.

우리가 저 함수를 정의한 의도는 (1) 숫자 끼리 연산하여 숫자를 반환하거나, (2) 문자끼리 연산하여 문자를 반환하는, 2가지일 것입니다.

이런 **16가지 함수 타입을 2가지로 좁혀주는 방법이 바로 함수 오버로드(function overload)입니다.**

<br/>

# 함수 오버로드는 어떻게 사용하는가?

함수 오버로드는 <strong>오버로드 시그니처(overload signature)<strong>를 활용합니다.

아래와 같이 <strong>타입부(overload signature)<strong>과 <strong>구현부(implementation signature)<strong>을 정의합니다.

```ts
function add(a: string, b?: string, c?: string): string; // (1) overload signature
function add(a: number, b?: number, c?: number): number; // (2) overload signature
function add(a: any, b?: any, c?: any): any {
  // (3) implementation signature
  if (b) {
    if (c) {
      return a + b + c;
    }
    return a + b;
  }
  return a;
}
```

add 함수는 (1) 또는 (2) 함수 타입으로 실현됩니다. 이는 args, return의 타입에 따라 동적으로 정해집니다.

숫자를 넣으면 (1) 오버로드 시그니처로 실현되고,

```ts
console.log(add(1, 2));
```

<img src="../images/1_code.png" alt="코드">

<br/>
<br/>
문자를 넣으면 (2) 오버로드 시그니처로 실현됩니다.

```ts
console.log(add('시', '지', '프'));
```

<img src="../images/2_code.png" alt="코드">

이때 주의할 점은, **(3) 구현부 타입은 절대 실현되지 않습니다.** **구현부는 모든 오버로드 시그니처를 포괄하는 타입일 뿐입니다.** add 함수가 실제로 받아올 수 있는 모든 인자타입과 모든 ReturnType을 적어줍니다.

아래와 같이 string | number로 타이핑해도 되지만, 여전히 구현부에서 string | number에 대해 '+' 연산을 수행할 수 없으므로 에러가 발생합니다.

```ts
function add(a: string | number, b?: string | number, c?: string | number): string | number {
```

정리하자면, 실행 시그니처는 오버로드 시그니처의 타입을 포함하고 있어야 합니다.

<br/>

# useRef를 통해 함수 오버로드 익히기

함수 오버로드를 공부한 후, 가장 밀접하게 다가오는 장점은 아마 **.d.ts 파일을 읽어낼 수 있다는 것**입니다. 라이브러리 함수 중 다수가 함수 오버로드로 정의되어 있습니다. d.ts 파일을 보면, 하나의 타입만을 가지는 함수는 아마 드물 것입니다.

가령 React 라이브러리의 index.d.ts를 들어가보면, useRef의 타입을 확인할 수 있습니다.

```ts
function useRef<T>(initialValue: T): MutableRefObject<T>; // (1)
function useRef<T>(initialValue: T | null): RefObject<T>; // (2)
function useRef<T = undefined>(): MutableRefObject<T | undefined>; // (3)
```

useRef는 3가지 오버로드 시그니처로 정의 되어 있습니다. 뭔가 비슷한 형태이지만, 어디에 null이나 undefined이 포함되어 있습니다.

(2) 초기값에 null이 포함되는지, (3) 초기값이 비어있는지(undefined) (1) null도 undefined도 아닌 제네릭 T 타입인지에 따라 ReturntType이 달라집니다.

MutableRefObject 또는 RefObject를 반환합니다.

MutableRefObject는 말 그대로 변할 수 있는 Ref 객체이고, RefObject는 불변 Ref 객체입니다. d.ts를 읽어보면 특별한 것 없습니다.

current가 불변(readonly)이냐 아니냐를 정의하는 인터페이스일 뿐입니다.

```ts
interface MutableRefObject<T> {
  current: T;
}

interface RefObject<T> {
  readonly current: T | null;
}
```

RefObject는 DOM에 ref를 걸어줄 때 사용됩니다. 그러므로 우리가 이 RefObject를 사용하려면 null 값을 넣어줘야하는 것입니다.

```ts
const inputRef = useRef<HTMLInputElement>(null); // RefObject
```

useRef에 DOM이 아닌 일반 변수값을 지정하고 싶을 때에는 초기값을 명확히 넣어주거나, undefined으로 할당하면 됩니다.

```ts
const numberRef = useRef<number>(0); // MutableRefObject
const timerRef = useRef<NodeJS.Timeout>(); // MutableRefObject
```

이처럼 함수 오버로딩을 이해하면, 라이브러리 제작자의 의도를 파악하고, 함수를 적재적소에 잘 사용할 수 있습니다.

다음은 직접 함수 오버로딩을 활용해본 경험을 공유하겠습니다.

<br/>

# 함수 오버로드로 undefined 또는 null을 제거하기

가상의 함수를 하나 정의해보겠습니다. 쿠폰 리스트를 받아서, 보낸 쿠폰만 필터링해서 반환하는 함수입니다.

```ts
interface Coupon {
  isSent: boolean;
}

function filterSentCoupon(coupons: Coupon[] | undefined): Coupon[] | undefined {
  return coupons?.filter(coupon => coupon.isSent);
}
```

이 함수가 실현될 수 있는 케이스는 몇 가지 일까요? 인자 타입 2가지와 리턴 타입 2가지를 조합하면 4가지 경우로 실현될 수 있습니다.

하지만 실제로 이 함수는 2가지 케이스에 사용됩니다.

1.  Coupon\[\] | undefined 이 들어오면, Coupon\[\] | undefined를 반환한다.
2.  Coupon\[\] 이 들어오면 Coupon\[\] 을 반환한다.

지금은 (2)의 경우에도 undefined일 가능성도 포함하여 반환합니다. 타입 내로잉이 얼마나 까다롭고 성가신 작업인데, T를 넣었더니 undefined를 더해서 뱉어주다니, 이는 여간 나쁜 타이핑이 아닙니다.

저희는 이를 함수 오버로드로 통해 해결했습니다.

```ts
function filterSentCoupon(coupons: Coupon[]): Coupon[];
function filterSentCoupon(coupons: Coupon[] | undefined): Coupon[] | undefined;
function filterSentCoupon(coupons: Coupon[] | undefined): Coupon[] | undefined {
  return coupons?.filter(coupon => coupon.isSent);
}
```

이제 Coupon\[\] 타입만 인자로 들어갈 경우, undefined을 더해서 뱉어주는 일이 없을 것입니다.

<br/>

# 마치며

함수 오버로딩은 제네릭이나 구별된 유니온에 비해 덜 주목 받는 것 같습니다. 함수의 타입을 제대로 정의하기 위해, 제네릭, 구별된 유니온 뿐만 아니라 함수 오버로딩도 필수적으로 이해해야 합니다. 이번 아티클을 통해, 라이브러리의 .d.ts 코드를 더 수월하게 읽고, 함수 타입을 좁혀나갈 수 있길 바랍니다.
