---
layout: post
title: "Stream의 foreach 와 for-loop 는 다르다."
author: "오렌지"
comment: "true"
tags: ["stream", "functional-programming"]
toc: true
---



Stream에 대한 기본적인 학습을 위해 찾아왔다면,  [공식 오라클 문서](https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html)를 참고하면 좋을 것 같다.
(java8 부터는 Stream과 Lambda를 제공한다.)
자바에서 Stream은 컬렉션 등의 요소를 하나씩 참조해 함수형 인터페이스(람다식)를 통해 반복적인 작업의 처리를 가능하게 해준다.
Stream이 반복적인 일의 처리가 가능하므로, 반복문(for-loop 등)을 대신해 Stream을 사용하는 경우가 많다.

*요즘 함수형 프로그래밍이 대세니 **무조건** 반복문 대신 Stream을 써야지!*
라는 생각을 하는 당신,
모든 for문을 Stream의 foreach로 구현하려고 했다면... 그 손 키보드에서 떼기 바란다!



## Stream 좋은데?

아니, 함수형 프로그래밍 하는 게 어때서 왜 막는 거지!
Stream을 쓰면 가독성도 올라가고 좋은 것 아닌가??
Stream을 쓰면 중첩된 for문/if문 여러 개를 보는 것보다 훨씬 읽기 쉽고 이해하기도 편해진다.

간단한 리스트 순회 예시를 보아도 알 수 있다. 3줄짜리 코드를 바로 한 줄로 줄일 수 있다.
```java
//기존의 for-loop
for (int i = 0; i < list.size(); i++) {
  System.out.println(list.get(i));
}

//향상된 for-Each
for (String item : list) {
  System.out.println(item);
}

//stream.forEach()
list.stream().forEach(System.out::println);
```


특히, 모든 요소를 순회하는 **stream.forEach()** 사용에 대해선 생각해 볼 필요가 있다.



## 언제 생각해 봐야 할까?
 >Stream의 forEach는 요소를 돌면서 실행되는 stream 연산의 최종 작업이다. 보통 System.out.println 메소드를 넘겨서 결과를 출력할 때 사용한다.


Stream.forEach()를 사용할 때, **로직이 들어가 있는 경우** 자신이 Stream을 잘 활용하고 있는 건지 생각해 보자.



##### 종료 조건이 있는 로직을 구현할 때 주의해야 한다.
Stream 자체를 강제적으로 종료시키는 방법은 없다.
무언가 강제적인 종료 조건에 대한 로직이 있는 for-loop를 stream.forEach()로 구현한다면, 기존 for-loop에 비해 비효율이 발생한다.


```java
//for-loop로 짠 경우
for (int i = 0; i < 100; i++) {
    if (i > 50) {
      break;
      //50번 돌고 반복을 종료한다.
    }
    System.out.println(i);
}

IntStream.range(1, 100).forEach(i -> {
    if (i > 50) {
      return;
      //각 수행에 대해 다음 수행을 막을 뿐, 100번 모두 조건을 확인한 후에야 종료한다.
    }
    System.out.println(i);
});
```
위 예시처럼 반복문이라고 무작정 stream.forEach()를 사용하게 되면 동작은 정상적으로 할지 몰라도 for문에 비해 비효율이 발생할 수 있다.

```java
IntStream.range(1, 100)
        .filter(i -> i <= 50)
        .forEach(System.out::println);
```
물론, Stream은 지연 연산을 하기 때문에 100번 모두 검사를 하긴 하지만
Stream.forEach()의 올바른 사용은 위처럼 forEach()를 **최종 연산**으로만 사용하는 것이다.
굳이 stream.forEach() 내에 로직이 들어가지 않더라도, 중간연산인 filter, map, sort 등을 통해 충분히 로직을 수행할 수 있다. 



*이펙티브 자바 아이템 46*에 따르면,
**forEach 연산은 최종 연산 중 기능이 가장 적고 가장 '덜' 스트림답기 때문에,
forEach 연산은 스트림 계산 결과를 보고할 때(주로 print 기능)만 사용하고 계산하는 데는 쓰지 말자** 라며, 
stream.forEach()의 사용에 주의를 준다.




```java
public void validateInput() {
    List<String> names = splitInputByComma();
        if (CollectionUtils.isEmpty(names)) {
            throw new IllegalArgumentException(LENGTH_ERROR_MESSAGE);
        }
    names.stream()
         .forEach(Input::validateNameLength);
}
```
```java
pieces.keySet()
      .forEach(
           positionKey -> model.addAttribute(
               positionKey,pieces.get(positionKey)));
```

위의 두 예시를 살펴보자.
짧고 간단한 로직이라서 가독성 측면에서는 크게 문제가 생기진 않는다. 



[스트림 병렬화에 대한 공식 문서](https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html#StreamOps)의 Side-effects 항목을 참고하면,
forEach 내부에 로직이 하나라도 더 추가된다면 **동시성 보장이 어려워지고 가독성이 떨어질** 위험이 있다. 


또한 **Stream의 의도**를 벗어나게 된다. 본래 forEach는 스트림의 종료를 위한 연산이다. 로직을 수행하는 역할은 Stream을 반환하는 중간연산이 해야하는 일이다.

```java
public void validateInput() {
    List<String> names = splitInputByComma();
    if (CollectionUtils.isEmpty(names)) {
        throw new IllegalArgumentException(LENGTH_ERROR_MESSAGE);
    }
    for (String name : names) {
        validateNameLength(name);
    }
}
```
```java
for (String positionKey: pieces.keySet()) {
    model.addAttribute(positionKey, pieces.get(positionKey));
}
```

Stream.forEach() 대신 **향상된 for문**을 사용해도 충분히 가독성 좋은 코드가 될 수 있다.


즉, 조건 혹은 로직이 추가된다면 forEach 내부를 손봐야 하는 것이 아니라, 
stream의 다양한 연산 도구(filter, map 등)를 활용하거나 반복문 혹은 forEach가 아닌 다른 최종연산을 사용하는 것이 올바른 방향이다.




필자도 stream 연산을 좋아하고 반복문 대신 자주 사용한다.
단지, 말하고자 하는 것은 stream의 본래 목적과 장점을 해치는 잘못된 사용은 지양하자는 것이다.
편리하자고 stream을 사용하는데 가독성을 해치고 성능도 저하시키면서까지 사용할 필요는 없기 때문이다!

------

#### 참고 링크

+ [3 Reasons why You Shouldn’t Replace Your for-loops by Stream.forEach()](https://blog.jooq.org/2015/12/08/3-reasons-why-you-shouldnt-replace-your-for-loops-by-stream-foreach/)
+ [Java8 Stream은 loop가 아니다.](https://www.popit.kr/java8-stream%EC%9D%80-loop%EA%B0%80-%EC%95%84%EB%8B%88%EB%8B%A4/)
+ [자바8 Streams API 를 다룰때 실수하기 쉬운것 10가지](https://hamait.tistory.com/547)


