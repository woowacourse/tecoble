---
layout: post
title: "Stream의 foreach 와 for-loop 는 다르다."
author: "오렌지"
---



처음 자바를 공부했을 때, 필자에게 Stream은 매우 어렵고 낯선 존재였다. (java8 에서는 Stream과 Lambda를 제공한다.)
우선, 자바에서 Stream은 컬렉션, 배열 등의 요소를 하나씩 참조해 함수형 인터페이스(람다식)를 통해 반복적인 작업의 처리를 가능하게 해준다.
Stream이 반복적인 처리가 가능하므로, 반복문(for-loop 등)을 대신해 Stream을 사용하는 경우가 많다.

**요즘 함수형 프로그래밍이 대세니 무조건 반복문 대신 Stream을 써야지!**
라는 생각을 하는 당신,
모든 for문을 Stream의 foreach로 구현하려고 했다면... 그 손 키보드에서 떼길 바란다!



## 왜?

아니, 함수형 프로그래밍 하는 게 어때서 왜 막는 것인가!

------

#### 참고 링크

+ [3 Reasons why You Shouldn’t Replace Your for-loops by Stream.forEach()](https://blog.jooq.org/2015/12/08/3-reasons-why-you-shouldnt-replace-your-for-loops-by-stream-foreach/)

