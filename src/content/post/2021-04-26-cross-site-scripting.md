---
layout: post
title: 'innerHTML의 위험성, XSS에 대해 알아보자'
author: [심바]
tags: []
date: '2021-04-26T12:00:00.000Z'
draft: false
image: ../teaser/sample2.png
---

레벨 1 과정에서는 Vanilla JavaScript로 미션을 구현하였다.

이때 DOM의 요소를 다루면서, innerHTML의 사용을 지양하라는 말을 많이 들었다.

성능상의 이유도 있었지만, **XSS**공격에 취약하기 때문이라고 하였다.

이번 글에서는 XSS에 대해 알아보려고 한다.

## XSS(Cross-Site Scripting)이란?

> 사이트 간 스크립팅(또는 크로스 사이트 스크립팅, 영문 명칭 cross-site scripting, 영문 약어 XSS)은 웹 애플리케이션에서 많이 나타나는 취약점의 하나로 웹사이트 **관리자가 아닌 이가 웹 페이지에 악성 스크립트를 삽입할 수 있는 취약점**이다.

XSS에 대해 정의된 공식 문서는 찾지못했지만, wikipedia에서는 XSS에 대해 위와 같이 정의하고 있다.

정의에서 볼 수 있듯이 XSS는 **웹 페이지에 악성 스크립트를 삽입**하는 방식으로 이루어지는 공격이다.

그래서 주로 여러 사용자가 보게 되는 게시판에 악성 스크립트가 담긴 글을 올리는 형태로 이루어진다고 한다.

삽입된 스크립트를 통해 다른 웹사이트와 정보를 교환하는 식으로 작동하기 때문에, 'Cross-Site'라는 이름이 붙게 되었다고 한다.

스크립트 내용에 따라서 쿠키나 세션 토큰 등의 탈취가 가능해서, 이를 인증이나 세션관리에 사용하고 있는 사이트에 침입하거나 심각한 피해를 입힐 가능성이 있다고 한다.

다음으로 어떤 방식으로 웹 사이트에 악성 스크립트를 삽입할 수 있는지, 간단한 예시를 작성해보았다.

## XSS의 간단한 예시

레벨 1 과정에서는 사용자에게 정보를 입력받아 보여주는 기능을 많이 구현하였다.

만약 사용자가 입력 폼에 스크립트 코드를 입력한다면, 스크립트 내용이 DOM에 추가된다.

웹 브라우저는 이 스크립트 코드가 누가 작성한 것인지 알 수 없기 때문에 실행하게 된다.

```javascript
//example

// HTML
<input id='input'></input>
<button id='input-btn'>submit</button>

<div id='submitted-input'></div>

// script
document.querySelector('#input-btn').addEventListener("click", (e) => {
  const userInput = document.querySelector('#input').value

  document.querySelector('#submitted-input').innerHTML = userInput
})
```

위의 input에 `<img src="#" onerror="console.log('XSS')">` 와 같은 스크립트 코드를 입력해보자.

그러면 console 창에서 'XSS'문구가 출력되는 것을 볼 수 있다.

![example](../images/2021-04-26-cross-site-scripting-example.gif)

이처럼 원리를 조금만 이해하면 누구나 웹 사이트에 스크립트 코드를 삽입하는 것이 가능하다.

하지만 생각보다 많은 웹사이트들이 XSS에 대한 방어 조치를 해두지 않아 공격을 받는 경우가 있다고 한다.

그럼 XSS 공격을 어떻게 방어할 수 있을까?

## XSS 방지 방법

위 예시와 같은 문제는 사용자로부터 입력 받은 값을 제대로 검사하지 않고 사용할 경우 나타난다.

XSS 공격은 스크립트를 삽입하는 방식으로 발생하기 때문에 기본적으로 스크립트 태그를 사용한다.

그래서 스크립트 태그에 자주 사용되는 `<`, `>` 등 과 같은 문자를 필터링 해주는 방법으로 방어 할 수 있다.

문자 입력을 그대로 표시하지 않고, 입력 시 문자 참조(HTML entity)로 필터링하고, 서버에서 브라우저로 전송 시 문자를 인코딩하는 것이다.

HTML 문자 참조란 ASCII 문자를 동일한 의미의 HTML 문자로 변경하는 과정이며, HTML 문자는 대부분의 브라우저에서 단순한 문자로 처리된다.

예를 들어, `<script>`의 `<`는 동일한 의미의 HTML 문자 `&lt;`로, `>`는 `&gt;`로 변경한다.

이렇게 하면 사용자에게는 `<script>`로 보이지만, HTML 문서에는 `&lt;script&gt;`로 나타나고 브라우저에서 일반 문자로 인식되어 스크립트가 실행되지 않는다.

XSS 필터를 직접 만들어서 사용해도 좋지만, 라이브러리를 사용하는 것도 좋은 방법이다.

XSS는 계속 새로운 방식으로 발전하고, 이를 모두 대응하기는 어려울 수 있기 때문이다.

네이버의 오픈 소스 중에도 `lucy-xss-filter` 와 같은 라이브러리(Java)가 있으니 참고해보면 좋을 것 같다.

## 참고 링크

> [사이트 간 스크립팅 - 위키백과, 우리 모두의 백과사전](https://ko.wikipedia.org/wiki/%EC%82%AC%EC%9D%B4%ED%8A%B8_%EA%B0%84_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8C%85#cite_note-1)

> [네이버 오픈소스 lucy-xss-filter](https://github.com/naver/lucy-xss-filter)
