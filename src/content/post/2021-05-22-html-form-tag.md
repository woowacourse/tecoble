---
layout: post
title: HTML <form> 태그 잘 쓰는 법.
author: [보스독]
tags: []
date: '2021-05-22T12:00:00.000Z'
draft: false
image: ../teaser/sample2.png
---

이번 글에서는 "HTML `<form>` 태그 잘 쓰는 법"에 대해 공유하려고한다.

사실 제목은 거창하게 지었지만, 개인적으로 우아한테크코스에 참여하기 전에 알았으면 좋았을 것 같은 `<form>` 태그에 대한 내용을 정리해 보았다.

누군가에게는 당연한 내용일 수 있지만, 나처럼 `<form>` 태그에 대해 잘 모르는 사람에게 도움이 되었으면 한다.

## 1. `<form>` 태그

본론에 들어가기전 `<form>` 태그에 대해 간략하게 설명하자면, `<form>` 태그는 사용자로부터 값을 입력을 받는 양식을 만들기 위해서 사용한다.

입력 양식은 `<input>` 과 `<button>` 같은 11개의 자식 태그 중 필요한 태그를 조합하여 만들 수 있다.

## 2. 사용자 입력 가져오기

1. **`'submit'` 이벤트**

   앞서 말한 것처럼 `<form>` 태그는 JavaScript 코드에서 사용자 입력을 가져오기 위해 사용한다.

   사용자 입력을 가져오려면, 먼저 사용자의 제출하는 동작을 감지해야한다.

   `<form>` 태그를 사용하기 전에는 '확인' 이나 '제출' 이라는 버튼을 만들고, 클릭 이벤트를 바인드 해서 사용자의 동작을 감지했다.

   사용자의 편의성을 고려해서 엔터키를 누르는 동작에 대한 이벤트도 함께 바인드 해주었다. 하지만 해당 이벤트를 모든 입력창에 바인드 해주는 건 다소 번거로웠다.

   `<form>` 에 `'submit'` 이벤트를 바인드 해줌으로써 클릭과 엔터키에 대한 제출 동작을 감지할 수 있다

   ```JavaScript
   formElement.addEventLitener('submit', doSomething)
   ```

   (`<form>` 내부에 `<button>` 태그를 추가하면, 버튼 클릭 시 `'submit'` 이벤트가 동작한다.)

   ```HTML
   <form>
    ...
    <button>제출</button>
   <form>
   ```

2. **`<input>`의 value**

   사용자의 제출 동작을 감지했다면, 이제 사용자가 입력한 정보를 가져 올 수 있다.

   `'submit'`을 통해 이벤트가 발생하면, `event`의 `target`에서 `name` 속성을 지정한 `<input>` 에 접근할 수 있다. (form을 제출할 때, name 속성이 있는 요소만 값이 전달된다.)

   ```JavaScript
   event.target["name"].value
   ```

   이걸 몰랐을 때는 `<input>` 에 `id` 를 지정해주고, `<input>` 을 하나씩 선택한 후 `value` 를 가져왔었다.

3. **`<button>`의 type**

   `<button>`의 기본 타입은 `submit`이다. 하지만 아이디 중복 검사처럼 제출 동작에 대한 `<button>` 아닌 경우가 있다.

   이 경우에는 `<button>`의 타입을 `button`으로 지정해주면, 해당 버튼을 클릭하더라도 `'submit'` 이벤트가 발생하지 않는다.

   ```HTML
    <button type="button"></button>
   ```

## 3. 마무리

이 글은 서론에서도 말한 것처럼 실제 `<form>` 태그를 사용하면서 알게된 점을 공유하고자 작성하였다.

그래서 글을 읽으면서 `<form>` 태그에 대한 자세한 설명이 생략되어 있다고 생각했을 것 같다.

`<form>` 태그에 대한 레퍼런스와 자세한 내용은 잘 정리되어 있는 블로그 글이 있어서, 참고 자료에 남겨두었으니 한번 읽어보았으면 한다.

## 참고 자료

- [하루 기록 - `HTML <form> 태그 총정리 + <input>, <button>`](https://365kim.tistory.com/64)

- [MDN - HTML Forms](https://developer.mozilla.org/ko/docs/Web/HTML/Element/form)

- [w3schools: HTML Forms](https://www.w3schools.com/html/html_form_elements.asp)
