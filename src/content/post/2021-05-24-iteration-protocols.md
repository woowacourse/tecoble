---
layout: post
title: 'Iteration Protocols'
author: [카일]
tags: ['iteration protocols', 'iterable', 'iterator']
date: '2021-05-24T12:00:00.000Z'
draft: false
image: ../teaser/iteration.jpeg
---

## Iteration Protocols

ES6 시기에는 문법 뿐만 아니라 여러 protocols(규칙, 규약, 표현법)도 출현하게 되었는데 그 중 하나가 Iteration Protocols이다. 이것은 JS 자체의 독자적인 규칙이라기보다는 여러 언어에서 반복 동작을 수행하기 위해 정의하는 방법에 가깝다. 때문에 일정한 규칙만 충족한다면 JS 내의 모든 객체에서 Iteration Protocols에 명시된 동작을 구현 할 수 있다. Iteration Protocols를 이루는 하위 규칙은 Iterable Protocol과 Iterator Protocol로 나뉜다. 각 특징을 자세히 파악해보자.

### Iterable Protocol

Iterable Protocol은 **객체의 반복적인 동작에 대한 정의**이다. 어떤 객체에 아래의 2가지 사항이 구현되어 있다면 그 객체는 iterable이다.

1. 객체는 `Symbol.iterator`라는 key를 가지고 있어야 한다.
2. `Symbol.iterator`의 value는 iterator를 반환하는 함수여야 한다.

JS 내에서 확인할 수 있는 Built-in iterable은 다음과 같다.

- `String`
- `Array`
- `Typed Array`
- `Map`
- `Set`

떄문에 `String` 타입인 문자열도 배열처럼 순회가 가능하다.

```jsx
const str = 'str';

for (const i of str) {
  console.log(i); // s t r
}
```

하지만 도입부에서도 언급했다시피, 이 규칙은 사용자 정의가 가능하기 때문에 Built-in iterable이 아니더라도 어느 객체에서든 충분히 구현할 수 있다.

```jsx
// custom iterable 만들기.
const iterable = {
  from: 1,
  to: 5,
};

iterable[Symbol.iterator] = function () {
  return {
    current: this.from,
    last: this.to,

    next() {
      if (this.current <= this.last) {
        return { done: false, value: this.current++ };
      } else {
        return { done: true };
      }
    },
  };
};

for (const i of iterable) {
  console.log(i); // 1 2 3 4 5
}
```

### Iterator Protocol

Iterator Protocol은 **값의 순서를 제공하는 방법에 대한 정의**이다. iterable과 마찬가지로 어떤 객체에 아래의 2가지 사항이 구현되어 있다면 그 객체는 iterator이다.

1. 객체는 `.next()` 메서드를 가지고 있어야 한다.
2. `.next()` 실행의 반환 값은 다음과 같아야 한다.
   - `value` - 반복문 안의 단일 값이며 어떠한 타입이든 상관 없다.
   - `done` - 반복문 종결 여부에 대한 판단 값이며 `Boolean` 타입이다.

위에서 다룬 custom iterable의 예시 코드를 보면 `Symbol.iterator`에 할당된 함수에서 반환하는 객체가 바로 iterator의 모양인 것을 확인할 수 있다.

### Why?

프로그래밍을 하다 보면, 어떤 구조/객체의 내부에서 반복 동작을 수행하고 싶을 때가 있다. 이때 자주 사용하는 방법이 `for..of`문과 `spread operator`인데, 이 문법을 사용하기 위한 전제가 바로 Iteration Protocols이다. 현재까지 확인된 바로는, [yield\*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*)와 [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) 또한 해당 규칙에 의존하는 구문, 표현식이라고 한다.

- `for..of`

```jsx
let numbers = [1, 2, 3, 4];

for (let number of numbers) {
  console.log(number);
}
```

- `spread operator`

```jsx
let numbers = [1, 2, 3, 4];

console.log(...numbers);
```

이와 같이 어떠한 데이터를 기준으로 데이터를 공급하는 쪽(`Array`, `String` etc. - Provider)과 데이터를 소비하는 쪽(`for..of`, `spread operator` etc. - Consumer)으로 나눌 수 있는데, 만약 데이터 소스가 각기 다른 순회 방식을 가질 경우 데이터 소비자는 그 방식에 일일이 대응하여 지원해야 한다. 이는 효율적인 방식이 아니기에 하나의 통일된 규칙을 만들어 해당 규칙에만 의거하여 지원할 수 있는 매개체의 필요성이 대두되었다. 결국 이 과정에서 나오게 된 것이 Iteration Protocols이며, 이것은 데이터 공급자와 소비자 사이를 이어주는 인터페이스인 셈이다.
