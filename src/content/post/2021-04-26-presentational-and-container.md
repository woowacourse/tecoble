---
layout: post
title: 'presentational and container 패턴이란 무엇인가'
author: [3기_미키]
tags: ['refactoring']
date: '2021-04-25T12:00:00.000Z'
draft: false
image: ../teaser/presentational.png
---

❗ 본 글은 Hook 개념이 없는 과거 리액트를 기준으로 쓰여진 글입니다.

리액트에서 **과거에** 자주 언급되고 활용되었던 패턴 중
`Presentational and Container Components` 라는 패턴이 있다.

처음 이 패턴을 소개한 Dan Abramov는 2019년 기준으로 현재는 **이 패턴을 사용하지 말라**고 언급하고 있다. [(출처)](https://medium.com/dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)

> 2019년 업데이트 : 이 아티클을 예전에 썼었고 이제는 내 관점이 달라졌다.
> 특히 나는 더 이상 이런 방식으로 component를 나누는 것을 추천하지 않는다.  
> 만약 자연스럽게 이 패턴의 필요성을 찾는다면 이 패턴은 유용할 것이다.
> 하지만 **어떤 필요성 없이, 독단적으로 이 패턴이 강제**되고 있음을 여러번 보았다.
> 내가 이 패턴을 유용하게 보았던 주된 이유는 이 패턴이 다른 관점의 컴포넌트로부터
> **복잡하고 stateful한 로직을 분리**하게 해주었기 때문이다.
> 임의의 분리없이 **Hook**은 똑같은 일을 할 수 있다.
> 이 글은 역사적인 이유로 보길 바라며 **심각하게 받아들이지 마라.**

비록 Dan Abramov가 추천하고 있지는 않지만 이전에는 어떤 필요성에 의해
이런 패턴이 고안되었는지 생각해볼 필요가 있다고 느껴 글을 작성하게 되었다.

Dan Abramov와 같이 우리도 **역사적인 자료**로써 presentational and container 패턴을 알아보도록 하자.

## 👀 왜 이런 패턴을 사용했는가

리액트의 컴포넌트는 상태, DOM, 이벤트 등을 모두 관리할 수 있다.
이는 리액트의 생태계에서 자유롭게 컴포넌트를 활용할 수 있다는 의미이지만
컴포넌트 간의 의존도가 높아지는 것을 경계하지 않는다면 추후 어플리케이션이 비대해졌을 때

**코드의 재사용**이 불가능해진다.

그래서 컴포넌트 내에서도 추가적으로 레이어를 적절히 나눠 의존도를 낮춰주어야 할 필요를 느꼈고
Hook의 개념이 존재하지 않았던 이전에, 로직과 view를 분리하기 위한 방법으로 등장한 것이 `Presentational and Container 패턴`이다.

## 🔥 Presentational, Container 개념 잡기

### ✔ presentational 컴포넌트

1. html, css, presentational component만 사용 가능하다.

2. app에 대해 완전히 몰라야한다.
   => 다른 app에서도 이 component를 사용할 수 있을지 스스로에게 물어보자

3. presentational과 container 모두를 내부적으로 가질 수 있다.

4. 작은 레고 블럭처럼 가능한 작게 만들어야 한다.

5. 상태를 가질 수 있지만 UI에 관련된 상태만 가질 수 있다.

6. 필요 시 visual을 바꾸는 props를 받을 수 있어야 한다.

7. 가끔 완전히 다른 스타일을 불러오는 props를 받기도 한다.
   ```
   export enum ButtonTypes {
     default = 'default',
     primary = 'primary',
     secondary = 'secondary',
   }
   ```

### ✔ container 컴포넌트

1. 어떠한 동작을 할 것인가에 대해 책임진다.

2. 절대로 DOM 마크업 구조나 스타일을 가져서는 안된다.

3. presentational과 container 모두를 내부적으로 가질 수 있다.

4. 주로 상태를 가지고 있다.

5. side effects를 만들 수 있다.
   ex) db에 CRUD를 요청

6. props를 자유롭게 받을 수 있다.

## 🙋‍♂️ 해당 패턴을 도입하여 얻을 수 있는 이점은?

1. 재사용성을 높일 수 있다.

   로직이 포함되어 있지 않은 presentational 컴포넌트는

   그저 받아온 정보를 화면에 표현할 뿐이므로

   presentational 컴포넌트가 다른 컴포넌트를 알 필요가 없다는 점에서

   의존도가 낮아 다양한 container 컴포넌트와 조합하여

   재사용할 수 있다는 장점이 있다.

2. 구조에 대한 이해가 쉬워진다.

   기능과 UI가 명확히 분리되므로

   개발자 입장에서 코드 구조에 대한 이해가 쉬워진다.

3. 마크업 작업이 편하다.

   presentational 컴포넌트는 layout 컴포넌트로 활용하여

   반복되는 마크업 작업을 줄여줄 수 있다.

## 📦 presentational과 container를 나누는 기준

대체적으로 presentational 컴포넌트는 `stateless`한 경향이 있고
container 컴포넌트는 `stateful`한 경향이 있다.

하지만 이것은 presentational과 container를 나누는 절대적인 기준이 아니므로
컴포넌트를 나눌 때는 state를 가지고 있냐 없냐 같은 기능적인 부분에 집중하지 말고 해당 컴포넌트가 **어떤 목적을 가지고 있는지에 집중**하는 것이 좋다.

🔍 예시 )

ContextMenu 컴포넌트는 어떤 `'동작'`을 수행하는 것이 목적이라기 보다는

`'화면에 어떻게 보여지는가'`가 목적이기 때문에 presentational로 분류된다.

## ✨ 정리

이 글을 작성하며 느낀 Presentational and Container 패턴이 **과거에 존재했던 이유는 2가지 정도**라고 생각한다.

1. 로직과 순수한 view를 나눠 view를 좀 더 재사용이 가능한 형태로 강제했다.
2. 표현(마크업)과 로직을 분리해 복잡도를 낮추었다.
   마크업 작업이 필요하면 presentational을 보고
   로직 수정이 필요하면 container를 보는 등 유지보수하는데 이점이 있었음

현재의 시점에서 2가지의 장점들을 바라본다면
1번은 component를 bottom-up 방식으로 정적인 페이지부터 만들면 어느정도 해결될 수 있다고 생각한다.
2번은 리액트 Hook이 탄생하며 로직과 표현의 분리가 가능해졌기에 해결가능하다.

따라서 **현재는 이 장점들이 빛이 바래** 해당 패턴을 적용하기에는 애매한 부분이 있다.
하지만 필자는 **과거의 패턴에서 얻을 수 있는 충분한 인사이트**가 있다고 생각한다.

Hook이 단지 함수형 컴포넌트에서 state를 사용하기 위함만이 아님을 알 수 있었고,
view와 로직은 재사용성을 위해 최대한 분리하는 것이 좋다는 것을 알 수 있었다.

또한 과거의 패턴을 돌아보며 가장 크게 느꼈던 것은
**현재의 패턴들도 분명히 더 나은 패턴으로 나아갈 여지가 있다**는 것이다.

`Dan Abramov`와 같은 구루 개발자도 과거의 자신이 언급했던 **패턴이 현재에는 맞지 않음**을 이야기하며 심지어 트위터에서는 패턴 소개글을 작성한 것이 후회된다고 까지 이야기했다.

항상 정답은 없으니 패턴을 **맹목적으로 따르는 것을 경계**하고
좀 더 나은 방법이 있다면 **변형시켜 사용하는 자세**를 가지도록 하자.

### 참고

[dan abramov의 presentational and container 소개 글](https://medium.com/dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)

[Why presentational/container components pattern is still important in 2021](https://medium.com/silex-technologies/why-presentational-container-components-pattern-is-still-important-in-2021-44b4f54d6493)
