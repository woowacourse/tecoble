---
layout: post
title: 'presentational and container 패턴이란 무엇인가'
author: [미키]
tags: ['refactoring', 'design-pattern']
date: '2020-04-26T12:00:00.000Z'
draft: false
image: ../teaser/presentational.png
---

@ 본 글은 리액트를 기준으로 쓰여진 글입니다.

리액트에서 자주 활용되는 패턴 중

Presentational and Container Components 라는 패턴이 있다.

Presentational? Container? 그게 뭐길래 리액트에서 자주 활용되는 것일까?

함께 알아보도록하자.

### 👀 왜 이런 패턴을 사용하는가

리액트의 컴포넌트는 상태, DOM, 이벤트 등을 모두 관리할 수 있다.

이는 리액트의 생태계에서 자유롭게 컴포넌트를 활용할 수 있다는 의미이지만

컴포넌트 간의 의존도가 높아지는 것을 경계하지 않는다면 추후 어플리케이션이 비대해졌을 때

**코드의 재사용**이 불가능해진다.

그래서 컴포넌트 내에서도 추가적으로 레이어를 적절히 나눠 의존도를 낮춰주어야 할 필요를 느꼈고

이를 해결하기 위한 패턴 중 하나로 등장한 것이 Presentational and Container 패턴이다.

### ✔ presentational 컴포넌트

- 어떻게 화면에 보이는지에 대해서 책임진다.
- presentational과 container 모두를 내부적으로 가질 수 있다.
- 상태를 가질 수 있지만 UI에 관련된 상태만 가질 수 있다.
- ex. navbar, page, list

### ✔ container 컴포넌트

- 어떠한 동작을 할 것인가에 대해 책임진다.
- DOM 마크업 구조나 스타일을 가져서는 안된다.
- presentational과 container 모두를 내부적으로 가질 수 있다.
- 주로 상태를 가지고 있다.
- 데이터를 처리하여 다른 컴포넌트에 전달한다.

### 🙋‍♂️ 해당 패턴을 도입하여 얻을 수 있는 이점은?

1. 재사용성을 높일 수 있다.
   로직이 포함되어 있지 않은 presentational 컴포넌트는
   그저 받아온 정보를 화면에 표현할 뿐이므로
   의존도가 매우 낮아 다양한 container 컴포넌트와 조합하여
   재사용할 수 있다는 장점이 있다.

2. 구조에 대한 이해가 쉬워진다.
   기능과 UI가 명확히 분리되므로
   개발자 입장에서 코드 구조에 대한 이해가 쉬워진다.
3. 마크업 작업이 편하다.
   presentational 컴포넌트는 layout 컴포넌트로 활용하여
   반복되는 마크업 작업을 줄여줄 수 있다.
   예를 들어 contextMenu라는 layout 컴포넌트에 props.children으로
   넘겨주는 방식으로 코드 중복을 막을 수 있다.

### 📦 presentational과 container를 나누는 기준

어떤 기능을 하는지 보다는
어떤 목적을 가지고 있는지에 따라 분리하는 것이 좋다.

### 😵 오해

가끔 레이어를 칼 같이 분리하여야 할 것 같은 생각이 들 수 있다.

하지만 모든 상황이 그렇게 칼 같이 분리되는 것은 아니다.

그래서 문제를 presentational과 container로 나누기 힘들다면 우선은 그대로 두자.

아직 분리하기에 이른 것일 수 있기 때문이다.

presentational and container 패턴도

코드의 재사용성을 높히기 위한 방법론 중 하나일 뿐이지 정답은 아니다.

항상 맹목적으로 따르는 습관을 버리고

좀 더 좋은 방법이 있다면 변형시켜 사용하는 습관을 가지자.
