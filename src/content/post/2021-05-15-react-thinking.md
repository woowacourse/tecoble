---
layout: post
title: '리액트로 생각하기'
author: [3기_카일]
tags: ['react']
date: '2021-05-15T12:00:00.000Z'
draft: false
image: ../teaser/react-thinking.webp
---

## 리액트로 생각하기

제목이 약간은 어색해 보인다. '리액트에 대해서 생각하기'가 더 자연스러울 것 같은데 리액트로 생각하자는 말은 어떤 의미일까? 리액트를 공부하며 그 방대한 생태계에서 끊임없이 헤매는 중이지만, 최근에 그나마 알게 된 사실이 있다면 이것은 그저 자바스크립트 앱의 구조화를 돕기 위한 '도구'라는 점이다.

도구를 잘 사용하기 위해서는 그 철학을 이해하는 것 못지않게 시의적절하게 사용할 수 있는 방법에도 초점을 맞추어야 한다고 생각한다. 그래서 좀 더 리액트의 관점으로 프로그래밍 방법론을 바라보고자 위와 같은 워딩을 제목으로 선정하게 되었다.

## 리액트를 이해하기

> A JavaScript library for building user interfaces

리액트 공식문서 초기 화면에서 확인할 수 있는 문구다. 여기서 눈에 띄는 표현은 <mark>라이브러리</mark>와 <mark>UI를 설계</mark>하는 부분이다. 대개 UI는 기존의 MVC 따위의 디자인 패턴에서 V(View) 레이어를 처리하는 마크업, 로직을 담당하고 있다. 즉 리액트는 이 View를 설계하는 방식에 어떠한 문제의식을 느낀 개발자들의 새로운 대안으로 출현하게 된 셈이다. 여기서 강조하는 장점을 나열해보면 다음과 같다.

1. 데이터 변경이 발생하면 리액트가 변경 지점을 어떻게 그릴 것인지 알아서 처리해주기 때문에, 선언적인 UI를 작성할 수 있다.
2. 컴포넌트 기반으로 애플리케이션을 운용할 수 있어 재사용성이 높아진다.

표면적인 이해에서 그치지 않도록 각 문장에서 중요한 표현을 좀 더 풀어보고자 한다.

### 명령형 vs 선언형

- 명령형 프로그래밍: 무엇을 **어떻게** 할 것인가
- 선언형 프로그래밍: **무엇을** 할 것인가

```html
<div id="value">0</div>
<button id="plus-button">+</button>
<button id="minus-button">-</button>
<script>
  const value = document.querySelector('#value');
  const plusButton = document.querySelector('#plus-button');
  const minusButton = document.querySelector('#minus-button');

  plusButton.addEventListener('click', () => {
    value.innerText = Number(value.innerText) + 1;
  });
  minusButton.addEventListener('click', () => {
    value.innerText = Number(value.innerText) - 1;
  });
</script>
```

기존의 View를 다루는 방식은 DOM 요소를 불러오는 것부터 데이터를 수정하고 적용하는 것까지 일일이 신경 써야 한다. 즉 원하는 목적을 이루기 위해 컴퓨터에 모든 과정에 대한 명령을 내려야 하기 때문에 이는 명령형 프로그래밍에 가깝다고 할 수 있다.

그에 반해 선언형 프로그래밍의 핵심은 내가 원하는 관심사만 선언하면 되도록 상세한 로직은 추상화되어 감추어져 있다는 특징에 있다. 이 관점으로 리액트를 사용하는 코드를 살펴보자.

```jsx
class Counter extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: 0,
    };

    this.handleIncrement = this.handleIncrement.bind(this);
    this.handleDecrement = this.handleDecrement.bind(this);
  }

  handleIncrement() {
    this.setState({ value: this.state.value + 1 });
  }

  handleDecrement() {
    this.setState({ value: this.state.value - 1 });
  }

  render() {
    return (
      <>
        <div>{this.state.value}</div>
        <button onClick={this.handleIncrement}>+</button>
        <button onClick={this.handleDecrement}>-</button>
      </>
    );
  }
}
```

DOM을 바인딩하거나 데이터를 변경하는 방법은 오롯이 리액트에 맡기면 되기 때문에 개발자는 코드를 짤 때 UI가 어떤 식으로 화면에 그려질지만 설계하면 된다. 결과적으로 이는 개발자가 고민 해야 하는 양을 확연히 덜어줄 수 있다.

### 컴포넌트

하나의 독립적인 요소이다. 단순하게 보자면 자바스크립트의 함수나 클래스라고 볼 수 있다. 다만 리액트 내부에서 컴포넌트는 외부의 프로퍼티(props)를 인자로 받아 리액트 엘리먼트를 반환하는 구조로 이루어져 있으며 반환된 엘리먼트는 어떤 식으로 UI를 구성할지에 대한 정보를 가지고 있다. 컴포넌트는 그 자체로 완결성을 가지고 있기 때문에 재사용이 쉽다.

## 리액트를 사용하기

어떤 앱을 개발할 때 리액트를 사용하기로 했다면, 우선은 상태와 컴포넌트를 정의하는 것부터 출발 해볼 수 있다. 반드시 이러한 규칙을 따라야 하는 건 아니지만, 리액트를 이용하여 개발을 시도해보는 입장에서는 한번 쯤 참고해보는 것도 괜찮다고 생각한다. 자세한 사항은 [리액트의 공식문서](https://ko.reactjs.org/docs/thinking-in-react.html)를 확인하자.

**1. UI를 컴포넌트 계층 구조로 나누기**

컴포넌트를 어디까지 분리해야 하는지에 대해서는 다양한 견해가 생길 수 있다. 하지만 자바스크립트에서 함수가 하나의 역할만 가지는 걸 지향했던 것처럼 컴포넌트를 작성할 때에도 **[단일 책임 원칙](https://ko.wikipedia.org/wiki/%EB%8B%A8%EC%9D%BC_%EC%B1%85%EC%9E%84_%EC%9B%90%EC%B9%99#:~:text=%EA%B0%9D%EC%B2%B4%20%EC%A7%80%ED%96%A5%20%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%EC%97%90%EC%84%9C%20%EB%8B%A8%EC%9D%BC,%EC%A3%BC%EC%9D%98%20%EA%B9%8A%EA%B2%8C%20%EB%B6%80%ED%95%A9%ED%95%B4%EC%95%BC%20%ED%95%9C%EB%8B%A4.)**을 매 순간 염두에 둘 수 있어야 한다.

**2. 상태를 정의하기**

상태는 앱에서 동적으로 변경되는 값이다. 상태는 가급적 최소한으로 정말 필요한 정도로만 가지고 있는 것이 좋다. 무언가를 상태로 만들기 전에 다음과 같은 항목을 고려해 볼 수 있으며 아래의 경우에 하나라도 해당한다면 그것은 상태가 아니다.

- 다른 상태로 충분히 계산 가능한 값인지
- 시간이 지나도 변하지 않는 값인지
- 부모로부터 props로 전달될 수 있는 값인지

이와 같은 검증 단계를 거쳐 완전한 상태를 정의했다면, 해당 상태를 공유하는 컴포넌트를 찾는다. 이 컴포넌트들의 위치에서 가장 가까운 부모 컴포넌트가 상태를 위치시켜야 하는 계층일 확률이 높다.

**3. 단방향의 데이터 흐름을 추가하기**

간단히 말해 자식 컴포넌트가 상태를 변경하는 경우를 설정해주는 것이다. 부모 컴포넌트에서 `setState()`를 자식 컴포넌트에 props로 내려 주어 자식 컴포넌트의 태그에 이벤트를 설정해주는 식으로 처리할 수 있겠다. 여기서 리액트의 단방향 데이터 바인딩은, 양방향 데이터 바인딩 방식보다 코드 작성량이 더 많아 보일 수 있다. 하지만 이러한 방식은 앱 내에서의 데이터 흐름을 더 명시적으로 확인할 수 있고 앱이 어떻게 동작하는지 쉽게 파악할 수 있게 해준다.

### 정리

리액트는 선언적인 UI 설계 방식을 취하며, 변경된 데이터를 View로 쉽게 적용할 수 있도록 도와주는 라이브러리이다. 또한 컴포넌트라는 패러다임을 도입하여 프로젝트의 확장성과 유지보수성을 크게 높였다. 어떠한 도구를 사용하기로 했다면 도구가 추구하는 방식을 이해하고 도구의 관점으로 프로그래밍을 시도해보자.

### Reference

[React Tutorial for Beginners](https://morioh.com/p/ecb8fb16c63d)
