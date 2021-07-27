---
layout: post
title: '사용자 경험 개선 2편 - react concurrent mode'
author: [3기_미키]
tags: ['react', 'concurrent-mode']
date: '2021-07-24T12:00:00.000Z'
draft: false
image: ../teaser/concurrent-mode.jpg
source: https://unsplash.com/@aleskrivec
---

❗ react suspense에 대한 이해가 필요한 글입니다. 사용자 경험 개선 1편을 참고해주세요.

## 👀 concurrent mode란 무엇인가

자바스크립트가 싱글 스레드 언어라는 것을 들어본 적이 있을 것이다.
이는 자바스크립트가 하나의 작업을 수행할 때 다른 작업을 동시에 수행할 수 없음을 의미한다. 리액트도 자바스크립트 기반이기에 물론 싱글 스레드이다.
하지만 리액트에서 `concurrent mode`를 사용하면 여러 작업을 동시에 처리할 수 있다.
오늘은 concurrent mode에 대해서 같이 알아보자.

우선 여러 작업을 동시에 할 수 있다면 어떤 점이 좋은 지는 잠깐 미뤄두자.
필자는 개인적으로 두 눈으로 본 것아니면 의심하는 경향이 있다.
리액트가 `정말 한번에 하나의 작업만 처리하는지`부터 확인해보자.

예를 들어 리액트는 UI 렌더링 도중에 렌더링 이외의 모든 작업을 차단한다. '렌더링 도중에 모든 작업을 차단한다고?' 현재 리액트를 버벅임 없이 사용하고 있는 개발자들은 의아할 것이다.

<iframe src="https://codesandbox.io/embed/blocking-mode-ogob4?fontsize=14&hidenavigation=1&theme=dark&view=preview"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="blocking-mode"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

위의 예제에서 아무 값이나 입력해보자. 예제에서는 사용자의 입력이 들어올 때마다 5000개의 dom element가 생성된다. 정상적으로 값을 입력하지 못할 정도로 버벅일 것이다. 실제로는 5000개의 dom element를 생성할 일은 거의 없지만, 렌더링 도중에 다른 모든 작업을 차단하는 모습을 직접 눈으로 보는 데에는 이만한 예제가 없다.

그렇다면 이런 의문이 들 것이다. 자바스크립트 자체가 싱글 스레드라면, 리액트에서 동시에 작업을 처리하는 것은 불가능한 것 아닌가?
하지만 리액트 개발자들은 방법을 찾아냈다. 바로 `동시성`이다.

동시성은 여러 작업들을 작은 단위로 나눈 뒤, 그들 간의 우선 순위를 정하고 그에 따라 작업을 번갈아 수행하는 방법이다. 서로 다른 작업들이 실제로 동시에 수행되는 것은 아니지만, 작업 간의 전환이 매우 빠르게 이루어지면서 동시에 수행되는 것처럼 보이는 것이다.

예시로 게임에 빠져 살던 시절 필자는 컴퓨터를 앞에 두고 밥을 같이 먹은 적이 종종 있었다. 게임에 중요한 상황이 있으면 마우스와 키보드를 잡았다가 게임에 신경쓰지 않아도 되는 타이밍에 빠르게 밥과 김치를 입에 넣곤 했다.
손이 2개 밖에 안되어 실제로 식사와 게임을 `동시에` 하진 못했지만 작업 간의 전환을 빠르게 하여 동시에 수행하는 듯 보였다.

이렇게 리액트는 동시성 개념을 도입해 싱글 스레드 환경에서 여러 작업을 동시에 할 수 있게 되었다.

## 🤔 여러 작업을 동시에 처리하는 것이 왜 중요한가요?

> concurrent mode가 왜 필요한 건가요? 이렇게까지 동시성을 구현할 필요가 있었나요?

이러한 의문이 드는 것은 자연스러운 일이다.
concurrent mode는 사용자 경험과 굉장히 밀접한 관계가 있다.
사용자 경험을 저해하는 어떤 상황에서 concurrent mode가 빛을 발하는지 대표적인 사례를 알아보자.

### 1. 기존 디바운스와 쓰로틀의 한계

사용자가 input을 입력할 때마다 `무거운 작업`을 수행하는 경우 버벅거림을 경험해본 적이 있을 것이다.
이 문제를 해결하기 위해서 필자는 `디바운스와 쓰로틀`을 사용해 해결한 적이 많았다.
확실히 이를 사용하면 무거운 작업의 수행 빈도수를 줄여주어 버벅거림은 줄어든다.
하지만 분명한 한계점들이 있다.

- 디바운스
  디바운스는 사용자의 마지막 입력이 끝난 뒤 일정 시간이 지나면 무거운 작업을 수행하는 방법이다.
  하지만 이 방법은 기기의 성능과는 관계 없이 무조건 `일정 시간`을 기다려야한다는 단점이 있다.
  슈퍼 컴퓨터든 10년 된 컴퓨터든 똑같이 마지막 입력 이후에 0.5초를 기다려야한다면 슈퍼 컴퓨터 입장에서는
  안타까울 수 밖에 없다. 또한 사용자 입력 중에 무거운 작업의 처리가 이뤄지지 않는다는 점도 아쉬울 수 있다.

- 쓰로틀
  디바운스에서 '입력 중에 무거운 작업의 처리가 이뤄지지 않는 점'은 쓰로틀로 개선할 수 있다.
  쓰로틀은 입력 중에 주기적으로 무거운 작업을 수행하는 방법이다.
  하지만 이 방법 또한 모든 사용자 경험을 높일 수 있는 방법은 아니다.
  쓰로틀 주기를 짧게 가져갈수록 성능이 좋은 기기에서는 사용자 경험을 높일 수 있지만
  성능이 나쁜 기기에서는 버벅거림이 심해지기 때문이다.

concurrent mode는 이러한 디바운스와 쓰로틀의 한계점들을 동시성으로 해결한다.
빠른 작업간 전환으로 사용자 입력과 무거운 작업이 버벅이지 않고 동시에 처리되는 경험을 사용자에게 줄 수 있고
작업 처리 속도는 개발자가 설정한 delay에 의존되는 것이 아니라 사용자의 기기 성능에 좌우된다.

### 2. 충분히 렌더링이 빠름에도 의미없는 로딩을 보여주는 경우

suspense로만 구현된 로딩은 이전 페이지를 유저로부터 `차단(block)`하고 다음 페이지의 전체 로딩 화면으로 대체하므로
사용자는 답답함을 느끼게 되었다.

<iframe src="https://codesandbox.io/embed/concurrent-mode-1-v5e9v?fontsize=14&hidenavigation=1&theme=dark&view=preview"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="concurrent-mode-1"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

위 예제에서 `페이지 방문하기` 버튼을 누르면 이전 페이지를 모두 차단하고 다음 페이지의 `전체 로딩 화면`을 띄운다.
특히 예제를 보면 전체 로딩 화면이 굉장히 짧게 나오는 것을 확인할 수 있는데 사용자에게 피로감을 줄 수 있는 불필요한 로딩은 최대한 줄이는 것이 좋다.

이를 concurrent mode는 일정 시간 동안 현재 페이지와 기능들을 유지하고 다음 페이지에 대한 렌더링을 동시에 진행함으로써 해결한다.
그리고 다음 페이지의 `렌더링 단계가 특정 조건에 부합하면` 해당 페이지를 렌더링한다.
그렇다면 여기서 렌더링 단계와 특정 조건은 무엇일까? 같이 알아보도록 하자.

## 🎯 Concurrent mode의 동작 원리

위에서 언급한 concurrent mode의 동작 원리를 자세하게 풀자면 다음과 같다.

> 특정 state가 변경되었을 때 `현 UI를 유지`하고 해당 변경에 따른 UI 업데이트를 동시에 준비.
> 준비중인 UI의 `렌더링 단계`가 `특정 조건`에 부합하면 실제 DOM에 반영한다.

현 UI 상태를 유지한다는 것은 크게 어렵지 않을 것이라고 생각한다.
그럼 렌더링 단계와 특정 조건은 뭘까? 같이 알아보자.

### 렌더링 단계

![image](https://user-images.githubusercontent.com/48755175/126877704-3085e031-bc14-4430-a1e3-b8d5ccc46456.png)

Transition, Loading, Done 총 3개의 렌더링 단계가 있다.
일반적으로 UI 업데이트는 state의 변경에 의해 발생하므로
각 단계는 특정 state 변경의 관점에서 보는 렌더링 단계이다.
오른쪽으로 진행할수록 더 나은 렌더링 단계이다. 각 단계에 대해서 조금 더 알아보자.

1. Transition 단계
   Transition은 state 변경 직후에 일어날 수 있는 UI 렌더링 단계이다.

   - Pending 상태
     리액트에서 제공하는 `useTransition 훅`을 사용하면 state 변경 직후에도
     UI를 업데이트하지 않고 현 UI를 잠시 유지할 수 있는데 이를 Pending 상태라고 한다.

   - Receded 상태
     useTransition 훅을 사용하지 않은 기본 상태. state 변경 직후 UI가 변경된다.
     전체 페이지에 대한 로딩 화면이라고 생각하면 이해하기 쉽다.
     Pending 상태에서도 Receded 상태로 넘어갈 수 있는데 Pending 상태의 시간이 useTransition 옵션으로 지정된 timeoutMs을
     넘으면 강제로 Receded 상태로 넘어간다.

2. Loading 단계

   - Skeleton 상태
     페이지의 일부만을 로딩하는 상태. 전체 화면을 모두 로딩으로 대체해버리는 Receded와는 다르다.

     <iframe src="https://codesandbox.io/embed/concurrent-mode-3-xmtup?fontsize=14&hidenavigation=1&theme=dark&view=preview"
       style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
       title="concurrent-mode-3"
       allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
       sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
     ></iframe>

     위 예제에서 크루들의 닉네임을 눌렀을 때 설명 부분의 로딩 UI가 Skeleton 상태라고 할 수 있다.

3. Done 단계

   - Complete 상태
     로딩 UI 없이 모든 정보가 사용자에게 보이는 상태를 의미한다.
     우리가 최종적으로 목표하는 단계라고 볼 수 있다.

### 특정 조건

이제 렌더링 조건은 알 것 같다. 그렇다면 UI 업데이트를 실제 DOM에 적용하기 위한 `특정 조건`은 무엇일까?
이 부분은 [리액트 공식 문서](https://ko.reactjs.org/docs/concurrent-mode-patterns.html)에서도 모호하게 나와있어 정확하게 알기는 어려웠다.
하지만 concurrent mode의 원리 중 하나인 `현재 UI를 유지한다`에 암시되어 있는 의미와 필자가 실험해본 결과를 조합해보았을 때,
`특정 조건`이란 다음과 같다고 볼 수 있다. (혹시 잘못된 점이 있다면 알려주세요)

> 특정 state 변경에 대한 현 화면의 UI 렌더링 단계보다 `더 나은 단계`로 진행하여야 실제 DOM에 반영한다.

이해를 돕기 위한 다음의 예제를 보자

<iframe src="https://codesandbox.io/embed/concurrent-mode-4-6wgld?fontsize=14&hidenavigation=1&theme=dark&view=preview"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="concurrent-mode-4"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

예제에서 `페이지 방문하기` 버튼을 누르면 즉시 다음 페이지로 이동하지 않고 잠깐 현 화면을 유지하다가 다음 페이지의 Skeleton 상태로 이동한다. 이 과정을 자세히 들여다보자.

먼저 버튼을 누르는 즉시 resource라는 state를 변경하고 Pending 상태에 진입한다.
이때 백그라운드에서는 state에 대한 다음 페이지를 준비하는 Receded 상태에 머물러 있을 것이다.

잠시 뒤 다음 페이지의 Receded 상태가 끝나고 Skeleton 상태에 진입하면 그때서야 실제 DOM에 적용한다.
Skeleton 상태는 현 UI 상태인 Pending 상태보다 더 나은 단계이기 때문이다.

이제 조금 헷갈릴 수 있는 상황이 등장한다.
테코블 크루의 닉네임과 설명이 모두 렌더링되어 Complete 상태로 넘어가고 다른 크루의 버튼을 눌러보자.
버튼을 눌렀을 때 UI가 멈춰있는 Pending 상태에 진입하고 잠시 뒤 Skeleton 상태로 넘어갈 것 같지만
Skeleton은 등장하지 않고 바로 다른 크루에 대한 정보가 렌더링되는 Complete 상태로 넘어간다.

여기서 간과하는 사실이 있다. 렌더링 상태는 렌더링을 유발하는 state 관점이라는 것이다.
`페이지 방문하기` 버튼을 누르던, `크루의 버튼`을 누르던 resource라는 같은 state의 변경이 일어나고 있다.
다시 한번 화면을 확인해보자. 크루의 버튼을 누르기 전에 resource state의 관점으로 봤을 때, Pending 상태가 아니라 모든 화면에 정보가 완전하게 보이는 complete 상태다.
여기서 크루의 버튼을 누르면 Pending 상태나 Skeleton 상태로 전환되지 않는다. 현 UI는 Complete 상태로, Pending이나 Skeleton 상태보다 더 나은 상태이기 때문이다.
그리고 백그라운드에서 새로운 resource state에 대한 렌더링이 Complete 상태로 넘어갔을 때, 그제서야 실제 DOM에 적용한다.
이전 state에 대한 Complete 상태보다 새로운 state에 대한 Complete 상태가 `더 나은 상태`이기 때문이다.

## 🔥 실제로 도입하기

지금까지는 concurrent mode가 동작하는 원리를 알아보았다. 이제 concurrent mode를 실제 코드에 적용하기 위해서는 어떻게 해야할까?
react는 이를 위해 `useTransition`이라는 훅을 제공한다. useTransition을 사용한 다양한 패턴이 있지만 필자가 구현해본 결과
아직은 useTransition의 가장 간단한 사용법 정도를 훑어보는 정도면 충분할 듯하다. 아직 experimental이라 언제든 실제 구현 코드가 달라질 수 있기 때문이다.

오늘 글에서 가장 먼저 예제로 등장했던 blocking mode input을 concurrent mode로 개선해보자.
먼저 개선한 결과는 다음과 같다.

<iframe src="https://codesandbox.io/embed/concurrent-mode-5-ei5z8?fontsize=14&hidenavigation=1&theme=dark&view=preview"
  style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
  title="concurrent-mode-5"
  allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
  sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
></iframe>

### 1. react experimental 버전 설치

우선 concurrent mode는 experimental 버전에서만 동작한다. experimental 버전을 설치해주자.

```
npm install react@experimental react-dom@experimental
```

### 2. concurrent 모드 활성화

```js
//index.js
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const rootElement = document.getElementById('root');
ReactDOM.createRoot(rootElement).render(<App />);
```

기존 blocking mode에서는 ReactDOM.render()를 사용했지만 concurrent mode를 사용하기 위해서는 createRoot()를 사용해야 한다.

### 3. state 반영 우선 순위를 정하기

우리는 사용자가 input을 입력할 때 버벅거림을 줄이기 위해서 input state의 우선 순위를 높게 줄 것이고
5000개의 렌더링을 위한 array state는 우선 순위를 낮게주어 UI 업데이트가 지연될 수 있도록 할 것이다.

❗ 주의 : 2021년 7월 기준 experimental 버전에서 useTransition의 리턴 형태가 [startTransition, isPending] => [isPending, startTransition] 으로 바뀌었다.
유의하도록 하자.

```js
// App.js
const [isPending, startTransition] = useTransition({
  timeoutMs: 3000,
}); // 최대 3초 동안 다음 화면의 렌더링을 백그라운드에서 준비하겠다는 의미. 3초가 지나면 강제로 렌더된다.

const handleChange = event => {
  setInput(event.target.value);
  startTransition(() => {
    // 지연할 UI와 관계된 state를 리액트에게 알려줌
    const newArray = array.map((_, index) => TECOBLE[index % TECOBLE.length] + Math.random());

    setArray(newArray);
  });
};
```

handleChange 내부의 로직을 유심히 보자. setInput은 startTransition 바깥에서 실행되고, setArray는 내부에서 실행되고 있다.  
이 차이는 state의 우선 순위를 결정한다. setArray를 startTransition으로 감싸주는 의미는 'array state 변화는 지연시켜도 돼'라고 리액트에게 알려주는 것이기 때문이다.
따라서 input state는 array state보다 높은 우선순위로 결정된다.

이렇게 해주는 이유는 사용자의 입력이 5000개의 dom element를 렌더링하는 것보다 우선시 되어야 사용자가 입력을 할 때의 버벅임을 줄일 수 있기 때문이다.
결과를 확인해보자. 이전 blocking mode로 구현했던 예제보다 훨씬 버벅임이 줄어들었을 것이다.

## ✨ 마무리

오늘은 사용자 경험 개선을 주제로 concurrent mode까지 알아보았다.
1편에서 다루었던 suspense와는 다르게 concurrent mode는 react의 렌더링 방식을 크게 변화시키는 등
앱 전반적으로 영향을 미칠 수 있는터라 아직은 production 코드에서 사용하기에는 다소 무리가 있어보인다.
또한 예제 코드를 작성하면서 개인적으로 느낀 것은 concurrent mode를 지원하는 훅이 아직 직관적으로 사용하기가 불편하다는 생각이 들었다.
(물론 내가 아직 concurrent mode의 개념에 익숙치 않아서 그럴 수는 있다 😂)
하지만 concurrent mode는 곧 나올 React 18에 적용될 기능이기도 하고, 사용자 경험 개선에 있어서 도입하였을 때 많은 이점을 누릴 수 있는 기능이기에
미리 공부하는 것이 나중에 큰 도움이 될 것이라고 생각한다.

오늘 주제에 대해 공부하면서 사용자 경험의 관점에서 많은 생각을 하게되었다. 많은 로딩이 사용자 경험에 좋지 않다는 점을 알게 되었고
디바운스와 쓰로틀에 대해서도 다시 생각해보게 되었다. 역시 무엇이든 완벽한 기술은 없다. 이를 염두에 두고 항상 불편함을 찾으며 개선하려는 자세를 가져야겠다.
