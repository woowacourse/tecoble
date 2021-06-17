---
layout: post
title: 'DOM(Document Object Model) Element를 다뤄보자.'
author: [심바]
tags: []
date: '2021-05-09T12:00:00.000Z'
draft: false
image: ../teaser/sample2.png
---

지난 글에서는 웹사이트에 악성 스크립트를 삽입할 수 있는 취약점, **XSS**에 대해 알아보았다.

그리고 innerHTML을 사용하는 것은 **XSS**에 취약하다는 이야기를 하였습니다.

그래서 이번에는 Vanilla JavaScript에서 innerHTML을 사용하지 않고,

DOM에 element를 추가하고, 다루는 방법에 대해 예시를 통해 알아보려고 한다.

![](../images/2021-05-09-handle-dom-element.png)

## 1. DOM element 생성

```javascript
const newTag = document.createElement('tagName');
```

`document.createElement` 를 사용하여 element 생성할 수 있다. 이때 인자로 태그를 넘겨주면 원하는 태그의 element 생성할 수 있다.

![](../images/2021-05-09-create-dom-element-1.png)

생성된 element 에는 `setAttribute` 를 사용하여 속성을 부여하거나, `textContent` 를 사용하여 태그 안에 텍스트를 넣을 수 있다.

![](../images/2021-05-09-create-dom-element-2.png)

또한 `newTag.id` 혹은 `newTag.classList` 처럼 element 속성 값에 직접 접근할 수 도 있다.

![](../images/2021-05-09-create-dom-element-3.png)

## 2. DOM element 조회

생성된 element 을 DOM에 추가하려면 추가하려는 위치, 즉 부모 요소를 선택해야한다.

```javascript
const targetElement = document.querySelector('Target');

const targetElements = document.querySelectorAll('Target');
```

id, className 혹은 tagName 등을 이용해 원하는 element 찾는 `getElementsBy*` 도 있지만,

CSS 선택자를 활용해서 elem를 찾을 수 있는 querySelector 더 많이 사용하고 있다.

`querySelector` 는 주어진 CSS 선택자에 대응하는 element 중 첫 번째 element 를 반환한다.

![](../images/2021-05-09-read-dom-element-1.png)

![](../images/2021-05-09-read-dom-element-2.png)

`querySelectorAll` 은 CSS 선택자에 대응하는 element 모두를 반환한다.

![](../images/2021-05-09-read-dom-element-3.png)

이때 반환된 element 들은 NodeList라는 유사배열로 반환됩니다. 유사배열이란 배열은 아니지만, 마치 배열 처럼 처리할 수 있는 객체를 의미하며, 숫자로 인덱싱 된 key와 length 프로퍼티가 특징입니다.

NodeList는 `forEach`를 사용할 수 있지만, 배열이 아니기 때문에 map이나 filter, reduce 등의 다른 배열 메서드를 쓸 수 없습니다.

만약 다른 배열 메서드를 사용해야 하는 경우, 스프레드 연산자(`[...'NodeList']`)를 사용하거나 `Array.from('NodeList')` 문법을 사용하여 배열로 변환하여 사용할 수 있습니다.

## 3. DOM element 삽입

이제 새로운 element 와 element 를 추가할 부모 요소를 찾았으니, DOM에 추가해보자.

```javascript
parentElement.appendChild(newElement);
```

가장 대표적인 방법은 `appendChild` 를 사용하는 것이다. 부모 element 의 자식 element 중 마지막 자식으로 element 를 추가한다.

![](../images/2021-05-09-update-dom-element.png)

```javascript
parentElement.insertBefore(newElement, referenceElement);

targetElement.insertAdjacentElement('where', newElement);
```

그 외에도 `insertBefore` 를 사용하면, 부모 element 의 자식 중 기준이 되는 자식의 앞에 element 를 추가 할 수 있다.

그리고 `insertAdjacentElement`를 사용하면, 타겟이 되는 element 의 `beforebegin, afterbegin, beforeend, afterend` 중 하나의 위치에 element 를 추가 할 수 있다.

```
<!-- beforebegin -->
<p>
  <!-- afterbegin -->
  foo
  <!-- beforeend -->
</p>
<!-- afterend -->
```

## 4. DOM element 삭제

그럼 이제 DOM Method 를 사용해 element 를 삭제하는 방법을 알아보자.

```javascript
parentElement.removeChild();

targetElement.remove();
```

`removeChild` 를 사용하면 자식 element 을 지정하여 삭제 할 수 있다.

![](../images/2021-05-09-delete-dom-element-1.png)

`remove` 를 사용하면 해당 element 를 직접 삭제 할 수 있다.

![](../images/2021-05-09-delete-dom-element-2.png)

## 마무리

이번 글에서는 DOM element의 생성, 추가, 삽입 그리고 삭제를 다루는 메서드에 대해서 간단하게 알아 보았다.

이외에도 다양한 메서드가 많이 있기 때문에 MDN을 찾아보는 것을 추천한다.

## 참고 링크

- DOM element 생성

  - [Document.createElement()](https://developer.mozilla.org/ko/docs/Web/API/Document/createElement)

- DOM element 조회

  - [Document.querySelector()](https://developer.mozilla.org/ko/docs/Web/API/Document/querySelector)
  - [Document.querySelectorAll()](https://developer.mozilla.org/ko/docs/Web/API/Document/querySelectorAll)

- DOM element 추가

  - [Node.appendChild()](https://developer.mozilla.org/ko/docs/Web/API/Node/appendChild)
  - [Node.insertBefore()](https://developer.mozilla.org/ko/docs/Web/API/Node/insertBefore)
  - [Element.insertAdjacentElement()](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement)

- DOM element 삭제
  - [ChildNode.remove()](https://developer.mozilla.org/en-US/docs/Web/API/ChildNode/remove)
  - [Node.removeChild()](https://developer.mozilla.org/en-US/docs/Web/API/Node/removeChild)
