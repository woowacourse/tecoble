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

### 1. 중복 코드를 줄일 수 있다.

구체적 제어는 하위 모듈이 상위 모듈을 확장해서 구현할 수 있도록 하여 코드를 선언적으로 작성할 수 있고
상위 모듈에서는 공통적이고 반복적인 제어를 담당하도록 하여 **코드의 중복을 줄일 수 있다.**

### 2. 모듈 간의 결합도를 줄일 수 있다.

IoC를 활용하여 상위 모듈과 하위 모듈 간의 결합도를 줄일 수 있다.
IoC의 구현 방법 중 하나인 Dependency Injection으로 런타임에서 의존성을 지정해줄 수 있어 모듈 간의 결합을 좀 더 느슨하게 만들 수 있다.

## 😵 Dependency Injection

IoC의 개념을 이야기할 때 자주 언급되는 개념이 있다.
바로 Dependency Injection(이하 DI)이다.
그래서 간혹 DI와 IoC가 같은 개념이라고 오해하는 경우가 있다.
하지만 DI는 제어의 역전을 구현하기 위한 한 가지 방법일 뿐이다.
코드로 확인해보자.

### 👎 DI가 적용되지 않은 경우

```js
class TaxiDriverJun extends TaxiDriver {}

class Customer {
	constructor() {
        this.taxiDriver = new TaxiDriverJun();
	}
    ...
}

const mickey = new Customer();
```

이 경우 `Customer`이라는 클래스가 TaxiDriverJun 이라는 인스턴스를 언제 만들지, 그리고 어떻게 만들지를 모두 알고 있어야한다.

이 모든 과정이 컴파일 타임에서 정해지기 때문에 다른 TaxiDriver 인스턴스로 변경이 불가능하다. TaxiDriverJun 인스턴스와 강한 결합을 이루고 있는 상황이다.

### 👍 DI가 적용된 경우

```js
class TaxiDriverJun extends TaxiDriver {}

class Customer {
	constructor(taxiDriver) {
        this.taxiDriver = taxiDriver;
	}
    ...
}

const jun = new TaxiDriverJun();
const mickey = new Customer(jun);
```

이 경우 TaxiDriverJun 인스턴스는 Customer 내부에서 생성되는 것이 아닌, 상위에서 생성되어 주입되고 있으므로 런타임에서 taxiDriver가 결정되고 다른 taxiDriver로 바꾸고 싶을 때도 얼마든지 가능하다.

인스턴스 생성에 대한 책임을 역전시키므로써 Customer와 TaxiDriver 간의 결합을 느슨하게 만들 수 있다.

## 🔍 프론트엔드에서의 IoC

### ✔ IoC of Redux

일반적인 제어의 흐름에서 화면의 구성을 담당하는 component는 상태의 변화가 언제 일어나는지 알고 있어야 한다. 그래야 getState() 와 같은 함수로 업데이트 된 상태를 가져와 화면과 동기화 시킬 수 있기 때문이다.

하지만 리덕스를 사용하면 언제 상태가 업데이트 되는지 신경을 쓸 필요가 없다. 불변성을 이용해 언제 상태 변화가 일어나는지 리덕스가 감지할 수 있고, 어떻게 화면을 업데이트 해야하는지만 선언해주면 상태 변화가 일어났을 때 알아서 화면이 업데이트된다. (pub/sub 패턴과 유사)

이는 제어의 일부분이 리덕스로 역전되었기에 가능한 일이다.
IoC가 리덕스에 적용된 예시 중 하나라고 할 수 있다.

컴포넌트가 집중해야할 `화면을 어떻게 표시하는가` 에 더 집중할 수 있고 그 외의 부분은 신경쓰지 않아도 되므로 선언적 프로그래밍에 가깝다.

### ✔ IoC of React

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
