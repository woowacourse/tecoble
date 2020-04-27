---
layout: post
title: "getter를 사용하는 대신 객체에 메시지를 보내자"
author: "오렌지"
---

# getter를 사용하는 대신 객체에 메시지를 보내자

객체 지향 프로그램에서는 데이터를 외부에서 변경하는 것을 막고 메소드만 노출시킨다.
이때, 필드(데이터)는 접근 제한자를 private으로 설정해 접근을 막고, getter와 setter를 이용해서만 필드에 접근이 가능하도록 한다.

## getter를 사용했을 때 캡슐화가 깨지는 점
설명 추가 필요

## getter를 통해 가져온 값으로 로직을 수행하기보단 메시지를 보내 로직을 수행하기
예시코드 작성 및 설명 필요

## getter를 무조건 사용하지 말라는 말은 아니다.
필요한 경우에는 Collections.unmodifiableList, 방어적 복사본 리턴해주기






------

#### 참고 링크

+ [객체를 객체스럽게 사용하도록 리팩토링해라.](https://www.slipp.net/questions/559)
+ [getter 메소드를 사용하지 않도록 리팩토링한다.](https://www.slipp.net/questions/565)
+ [객체지향 생활체조 규칙 9: 게터/세터/프로퍼티를 쓰지 않는다.](https://developerfarm.wordpress.com/2012/02/01/object_calisthenics_10/)