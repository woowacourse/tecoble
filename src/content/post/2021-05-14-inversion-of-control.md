---
layout: post
title: '프론트엔드에서의 Inversion of Control'
author: [3기_미키]
tags: ['refactoring', 'design-pattern']
date: '2020-05-15T12:00:00.000Z'
draft: false
image: ../teaser/inversion-of-control.png
---

## 🎁 Inversion of Control 이란?

> Don't call us. we'll call you
>
> (연락하지 마세요. 우리가 연락할게요.)

처음 `inversion of Control(이하 IoC)`의 개념이 등장했을 무렵에는 `Hollywood principle`로 불리었다.
그 시절 할리우드에서는 배우들이 오디션에 탈락하였을 때, 이를 돌려말하기 위해

`Don't call us. we'll call you` 라고 말하곤 했는데

이 구절이 오늘 소개할 개념의 핵심과 일맥상통하기 때문에 `Hollywood principle`로 불리게 되었다고 한다.

현재에는 `IoC(Inversion of Control)`라고 많이 불리는데
말 그대로 일반적인 제어 흐름이 아니라 흐름이 역전된 것을 의미한다.

IoC를 처음 듣게 되면 `일반적인 제어 흐름`은 무엇인지,
그리고 그 흐름이 어떻게 역전되는 것인지 감이 오지 않을 것이다.
택시를 타는 상황을 예시로 한번 알아보자.

![image](https://user-images.githubusercontent.com/48755175/118286801-cf2d8000-b50d-11eb-806e-95a5e85bd01c.png)

만약 택시를 탔는데 택시 기사에게 자동차 속도를 몇 km로 유지할 지,
목적지까지 어떤 길로 갈지, 사소한 것 하나하나 모두 지시해야한다면 어떨까?

굉장히 번거롭고 **'이런 것까지 우리가 알아야하나?'** 라는 생각이 들 것이다. 우리는 그저 가고 싶은 목적지만 알고 있고, 그곳으로 가고 싶을 뿐인데 말이다.

바로 이 상황이 `일반적인 제어 흐름` 이다.
`상위 모듈`이 손님이고 `하위 모듈`이 택시 기사라고 가정한다면
모든 행동을 상위 모듈이 하위 모듈에게 지시해야하므로 `명령적 프로그래밍`이라고 할 수 있다.

그렇다면 이 제어 흐름을 역전 시킨다면 어떤 형태가 될 수 있을까?
손님은 그저 목적지만 알고 있을 뿐이고 택시 기사는 목적지까지 손님을 안내한다.
그리고 택시가 목적지에 도착하면 택시 기사는 손님에게 알릴 것이다.

손님이 택시 기사에게 명령하던 것이 택시 기사가 손님에게 도착함을 알리는 방식으로 제어가 역전된 것이다.

## 🙋‍♂️ 그럼 IoC를 적용하는 이유가 무엇인가요?

### 1. 유지보수 비용을 줄일 수 있다.

일반적인 제어 흐름으로 구현했을 경우 유지보수 비용이 높은 경우가 있다.
상세한 코드를 하단에서 예시로 제시할 것이지만 지금은 간단히 우리가 재사용 가능한 함수를 하나 만들어
다른 개발자도 이 함수를 사용하는 상황을 가정해보자.

함수는 처음엔 한가지 일을 잘하는 함수로 만들어지겠지만 점점 예외적인 상황이 생길 것이다.
다른 개발자들은 이 상황을 다루기 위한 방법을 우리에게 요구할 것이고
우리는 함수의 인자로 추가적인 옵션을 받도록 해야할 것이다.

이런 방식은 함수의 변경을 잦게 만들고 해당 변경에 대해 다른 개발자들을 위한 documentation을 추가적으로 만들어야한다는 점에서
유지보수 비용을 높이는 원인이 된다.
이 경우 IoC를 적용하면 하위 모듈에서 필요한 상황을 직접 정의하므로 훨씬 유연하고 유지보수 비용을 줄일 수 있다.

### 2. 구현이 좀 더 단순해진다.

IoC를 적용하지 않고 상위 모듈에서 모든 상황에 대한 처리를 구현한다면 로직이 복잡해질 수 있다.
예를 들어 상위 모듈에서 arguments,options,props와 같은 옵션의 조합을 대부분의 개발자가 사용하지 않더라도 구현해놓아야하는 경우가 많이 발생한다.
구현하지 않는다면 해당 옵션을 사용하고 있는 앱의 로직이 깨질 수 있기 때문이다. 이는 모든 옵션에 대한 구현을 상위 모듈에 강제하므로 점점 로직이 복잡해지는 문제로 이어진다.

그대신 IoC를 활용한 추상화를 적용한다면 로직을 하위 모듈에서 구현하므로 상위 모듈의 구현이 좀 더 단순해진다는 장점이 있다.

## 🔍 프론트엔드에서의 IoC - 간단한 예시

간단한 예시로 `Array.prototype.filter()` 내장 함수가 없다고 생각하고 우리가 직접 만들어보자.

### 👎 전형적인 추상화

```js
function filter(array, { filterNull = true, filterUndefined = true, filterNumber = false } = {}) {
  let newArray = [];

  array.forEach(element => {
    if (filterNull && element === null) return;
    if (filterUndefined && element === undefined) return;
    if (filterNumber && typeof element === 'number') return;

    newArray.push(element);
  });

  return newArray;
}

filter([0, 1, undefined, 2, null, 3, 'four', '']);
// [0, 1, 2, 3, 'four', '']

filter([0, 1, undefined, 2, null, 3, 'four', ''], { filterNumber: true });
// [ 'four', '' ]
```

위와 같이 구현하는 것이 간단한 추상화의 방식이다.
여기서 더 필요한 use case가 있다면 여러 옵션이 추가될 수도 있다.

그리고 시간이 흘렀을 때 우리는 다음과 같이 생각할 수 있다.

`옵션 몇 개 정도는 잘 사용하지도 않는데 삭제해도 되겠는데?`

하지만 이를 깨닫게 되더라도 우리가 실제로 옵션을 삭제하게 되는 데에는 많은 시간이 걸릴 것이다.
왜냐하면 우리가 만든 filter 함수를 사용하는 사람들의 앱이 깨질 수도 있기 때문이다.

문제점은 여기서 끝나지 않는다. 이렇게 설계하였을 때, 우리는 대부분 사용하지 않거나 추후에 사용될 수도 있는
모든 옵션에 대해 정상 작동하는지 테스트도 진행해야한다.
유지보수 비용이 크게 증가하는 원인이 될 수 있는 것이다.

### 👍 IoC를 적용한 추상화

```js
function filter(array, filterFunction) {
  let newArray = [];

  array.forEach(element => {
    if (filterFunction(element)) {
      newArray.push(element);
    }
  });

  return newArray;
}

// 더 특별한 case에 대한 처리가 가능함
filter(
  [
    { name: '독서하기', duration: 120 },
    { name: '밥먹기', duration: 60 },
    { name: '공부하기', duration: 100 },
  ],
  task => task.duration >= 100,
);
// [ { name: '독서하기', duration: 120 }, { name: '공부하기', duration: 100 } ]
```

IoC를 적용해 다시 filter 함수를 만들어 본다면 위와 같은 형태가 될 것이다.
filter는 배열에 포함될 요소를 판단하는 filterFunction 함수를 인자로 받아 호출만 하고 있다.
그리고 세부적인 filterFunction 함수의 로직은 하위 모듈에서 구현하고 있다.

항상 IoC가 적용된 추상화가 좋은 것은 아니다.
하지만 filter 예시의 경우에서는 use case가 굉장히 다양하고
IoC는 다양한 use case에 대한 대응이 가능하기 때문에 훨씬 좋은 방법이라고 할 수 있다.

## 🔍 프론트엔드에서의 IoC - 라이브러리

### ✅ Redux

일반적인 제어의 흐름에서 화면의 구성을 담당하는 component는 상태의 변화가 언제 일어나는지 알고 있어야 한다. 그래야 getState() 와 같은 함수로 업데이트 된 상태를 가져와 화면과 동기화 시킬 수 있기 때문이다.

하지만 리덕스를 사용하면 언제 상태가 업데이트 되는지 신경을 쓸 필요가 없다. 불변성을 이용해 언제 상태 변화가 일어나는지 리덕스가 감지할 수 있고, 어떻게 화면을 업데이트 해야하는지만 선언해주면 상태 변화가 일어났을 때 알아서 화면이 업데이트된다. (pub/sub 패턴과 유사)

이는 제어의 일부분이 리덕스로 역전되었기에 가능한 일이다.
IoC가 리덕스에 적용된 예시 중 하나라고 할 수 있다.

컴포넌트가 집중해야할 `화면을 어떻게 표시하는가` 에 더 집중할 수 있고 그 외의 부분은 신경쓰지 않아도 되므로 선언적 프로그래밍에 가깝다.

### ✅ React

React는 `reactive view update` 라는 의미를 가진 라이브러리다.
상태의 변화가 일어나면 자동으로 view를 업데이트하기 때문이다.

React는 자동으로 view를 업데이트 하기 위해 다음과 같은 부분에서 IoC를 적용하였다.

1. 어떤 방식으로 view를 업데이트 할 것인가
2. 언제 view를 업데이트 할 것인가

우리는 React 환경에서
view가 무엇을 하는지 정의하지 않고 (명령형)
view가 어떻게 보일지를 선언한다.(선언형)
어떻게 보일지만 선언하면 언제, 어떻게 render하는지는 신경쓰지 않아도 되는 것이다.

## ✨ 마무리

React로 프로젝트를 하면서 IoC라는 용어를 처음 알게되었고
이번 글을 작성하며 React나 Redux라는 도구를 사용하는 이유에 대해 고민해볼 수 있었다.

내가 개발에 사용하는 도구를 이해하려는 노력은
도구를 사용할 때 실수하는 부분을 어느정도 줄여줄 수도 있고
다른 도구와 비교하여 어느 것이 내 프로젝트에 더 적합한지 판단함에 있어
유용하게 쓰일 것이라고 생각한다.

앞으로 종종 디자인 패턴에 대해서 고민해 볼 수 있는 시간을 가져
도구를 사용하는 이유에 대한 내재화가 될 수 있도록 노력해야겠다. 🔥

## 📜 참고 자료

[React 이름의 유래](https://www.freecodecamp.org/news/yes-react-is-taking-over-front-end-development-the-question-is-why-40837af8ab76/)

[The many meanings of Inversion of Control (IoC) in JavaScript](https://www.youtube.com/watch?v=grF-BVK1vzM)

[inversion of control - Kent C. Dodds](https://kentcdodds.com/blog/inversion-of-control)
