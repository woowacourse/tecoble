---
layout: post
title: "null 반환보다는 Optional을 활용하자"
author: "둔덩"
comment: "true"
tags: ["OOP", "optional", "clean-code"]
toc: true
---

자바는 객체를 사용하여 모든 것을 표현한다.

그로 인해 메소드가 특정 조건에서 값을 반환할 수 없을 때,  
null을 반환하는 방식은 흔히 하는 실수이다.

---

## null 반환의 문제점

`List<Integer>`에서 어떤 정수의 배수 중 최솟값을 반환하는 메소드를 살펴보자.

```java
public static Integer findMinMultiple(List<Integer> numbers, int anyNumber) {
    Collections.sort(numbers);
    for (Integer number : numbers) {
        if (number % anyNumber == 0) {
            return number;
        }
    }
    return null; 
}
```

위 메소드는 `List<Integer> numbers`에서 `anyNumber`의 배수가 없으면 **null을 반환**하고 있다.

메소드에서 null을 반환한다면 해당 메소드를 사용하는 여러 곳에서 다음과 같은 문제점이 있다.

-   NPE(NullPointerException)를 발생시킬 위험이 있다.
-   NPE(NullPointerException) 방어를 위한 null 체크 로직이 필요하다.
-   null 체크 로직 때문에 코드 가독성이 떨어진다.

```java
Member member = findMember("tiger");
if (member != null) {
    Address address = member.getAddress();
    if (address != null) {
        String city = address.getCity();
        if (city != null) {
            return city;
        }
    }
}
```

위의 예시처럼 방어를 위한 null 체크 로직은  
코드 가독성을 떨어지게 하고, 프로그래머의 생산성을 저하한다.

---

## 해결 방법

null을 반환하는 방식 대신 **Optional**을 활용함으로써 위와 같은 문제점을 극복할 수 있다.

**Optional이란?**  
java8부터 제공하는 null을 포함하거나 null을 포함하지 않을 수도 있는 객체이다.

null 대신 Optional을 반환함으로써 얻는 효과는 다음과 같다.

-   NPE(NullPointerException)를 발생시킬 수 있는 null을 직접 다루지 않아도 된다.
-   null 체크 로직이 필요 없다.
-   **명시적으로 해당 변수가 null일 가능성을 표현할 수 있다.**

따라서 위에서 살펴본 메소드는 다음과 같은 방식으로 수정할 수 있다.

```java
public static OptionalInt findMinMultiple(List<Integer> numbers, int anyNumber) {
    Collections.sort(numbers);
    for (Integer number : numbers) {
        if (number % anyNumber == 0) {
            return OptionalInt.of(number);
        }
    }
    return OptionalInt.empty();
}
```

```java
public static OptionalInt findMinMultiple(List<Integer> numbers, int anyNumber) {
    return numbers.stream()
        .sorted()
        .filter(number -> number % anyNumber == 0)
        .findFirst()
        .map(OptionalInt::of)
        .orElseGet(OptionalInt::empty);
}

```

---

## 결론

메소드가 특정 조건에서 값을 반환할 수 없을 때 취할 수 있는 선택지는 세 가지가 있다.

1.  null을 반환한다.
2.  예외를 던진다.
3.  Optional을 반환한다.

null을 반환하는 것은 위에서 살펴봤듯이 좋지 않은 방식이다.

예외를 던지는 것은 진짜 예외적인 상황에서만 사용해야 한다.  
예외를 생성할 때 스택 추적 전체를 캡처하므로 비용도 만만치 않다.

즉, 진짜 예외적인 상황이 아니라면 Optional을 반환하는 것이 좋다.

**하지만 Optional은 신중히 사용해야 한다.**

Optional은 값을 포장하고 다시 풀고, 값이 없을 때 대체하는 값을 넣는 등의 오버헤드가 있으므로,  
무분별하게, 적절하지 않게 사용된다면 성능 저하가 뒤따르기 때문이다.

적절하지 않게 사용되는 예로 Optional의 orElse 메소드가 있다.

`orElse(...)` 에서 `...`는 Optional에 값이 있든 없든 무조건 실행된다.  
Optional에 값이 있다면 `orElse`의 인자로서 실행된 값은 무시되고 버려지는 것이다.

따라서 이미 생성되었거나 계산된 값이 아니라면 orElseGet 메소드를 쓰는 것이 적절하다.

```java
// orElse()를 사용한 부적절한 예
public static OptionalInt findMinMultiple(List<Integer> numbers, int anyNumber) {
    return numbers.stream()
        .sorted()
        .filter(number -> number % anyNumber == 0)
        .findFirst()
        .map(OptionalInt::of)
        .orElse(OptionalInt.empty());
}

// orElseGet()을 사용한 적절한 예
public static OptionalInt findMinMultiple(List<Integer> numbers, int anyNumber) {
    return numbers.stream()
        .sorted()
        .filter(number -> number % anyNumber == 0)
        .findFirst()
        .map(OptionalInt::of)
        .orElseGet(OptionalInt::empty);
}
```

위 예시뿐 아니라, Optional을 적절하지 않게 사용하는 경우는 매우 많다.

학습을 통해 Optional을 설계자의 의도에 맞게 활용하면서 **null-safety** 한 코드를 작성하자.

---

추가로 학습하면 좋은 자료

-   [Optional oracle 공식 API 문서](https://docs.oracle.com/javase/9/docs/api/java/util/Optional.html)
-   [자바 언어 설계자 BrianGoetz의 Optional을 만든 의도 - stack overflow 답변](https://stackoverflow.com/questions/26327957/should-java-8-getters-return-optional-type/26328555#26328555)
-   [Anghel Leonard의 Optional을 올바르게 사용하는 것이 선택이 아닌 26가지 이유 - DZone(Java Zone)](https://dzone.com/articles/using-optional-correctly-is-not-optional)
-   [Effective Java 3/e](http://www.yes24.com/Product/Goods/65551284) item 55 - 옵셔널 반환은 신중히 하라
