---
layout: post 
title: 함수형 인터페이스와 람다를 이용한 코드 중복 제거
author: [3기_파피]
tags: ['functional-interface', 'lambda']
date: "2021-11-21T12:00:00.000Z"
draft: false
image: ../teaser/lambda.png
---

<p style="font-family: sans-serif; text-align: center; color: #aaa; margin-bottom: 3em; font-size: 85%">image origin: <a href="https://keefcode.wordpress.com/2013/12/05/lambda-expressions-in-java-8/">keefcode</a></p>

코드를 작성하다 보면 비슷한 로직의 중복 코드가 생길 수 있고, 그로 하여금 관리 지점이 늘어나기 때문에 대부분 리팩터링의 대상으로 취급한다.

이번 글에서는 함수형 인터페이스와 람다에 대해 알아보고, 이를 이용해 코드의 중복을 제거하는 방법을 다룰 것이다.

## 함수형 인터페이스(Functional Interface)

```java
public interface Comparator<T> {
    int compare(T o1, T o2);
}
```

위 코드는 Java API의 함수형 인터페이스인 `Comparator`이다. 이처럼 추상 메서드를 단 하나만 가지고 있는 인터페이스를 함수형 인터페이스라고 한다. 또한 인터페이스에서 모든 메서드는 암시적으로 추상 메서드이기 때문에 `abstract` 키워드를 쓰지 않는다.

Java 8 부터 인터페이스는 `default method` 를 포함할 수 있는데, 여러 개의 디폴트 메서드가 있더라도 추상 메서드가 오직 하나면 함수형 인터페이스이다. 즉, `default method` 또는 `static method`는 여러 개가 존재해도 함수형 인터페이스일 수 있다.

그리고 `@FunctionalInterface` 어노테이션을 사용할 수 있는데, 이 어노테이션은 해당 인터페이스가 함수형 인터페이스 조건에 맞는지 컴파일 시점에 검사할 수 있게 한다. `@FunctionalInterface` 어노테이션이 없어도 함수형 인터페이스로 동작하고 사용하는 데 문제는 없지만, 인터페이스 검증과 유지보수를 위해 붙여주는 게 좋다.

## 람다(Lambda)

람다는 쉽게 말해서 메서드에 전달할 수 있는 '동작'이라고 이해하면 된다.

메서드와 비슷하지만 특정 클래스에 종속되지 않으며 이름을 갖지 않는다.

쉽게 말해 메서드를 하나의 식으로 표현한 것이다.

```java
int min(int x, int y) {
    return x < y ? x : y;
}
```

위 메서드를 람다로 표현하면 아래와 같다.

```java
(x, y) -> x < y ? x : y;
```

핵심은 간결하고, 유연하다는 것이다. 메서드를 람다 표현식으로 표현하면 클래스 작성 및 객체 생성을 하지 않아도 메서드처럼 사용할 수 있다.

람다 표현식은 위와 같이 람다 파라미터, 화살표, 람다 바디로 이루어져있다.

화살표는 람다 파라미터와 람다 바디를 구분하며 람다 바디는 람다의 반환값에 해당하는 표현식이다.

람다 표현식에는 `return`이 함축되어 있으므로 `return`문과 세미 콜론을 명시적으로 사용하지 않아도 된다.

## 함수형 인터페이스와 람다를 이용한 코드 중복 제거

함수형 인터페이스에 람다 표현식을 접목할 수 있다.

함수형 인터페이스가 가지고 있는 추상 메서드의 구현을 람다 표현식으로 직접 전달할 수 있다.

함수형 인터페이스는 어떤 식으로든 구현될 수 있는 추상 메서드를 가지고 있고, 람다는 그 추상 메서드를 구현함과 동시에 전달할 수 있는 것이다.

실제로 사이드 프로젝트를 하면서 활용한 부분을 얘기해보려고 한다.

### 기존의 중복 코드

다음 코드는 여러 축구 경기의 `총 헤딩 시도 횟수`와 , `총 중거리 슛 시도 횟수`를 계산하는 로직이다.

이때, 지표의 종류만 다를 뿐 각 지표의 횟수를 가져오는 로직에서 거의 동일하다고 볼 수 있을 정도의 중복을 볼 수 있다.

```java
public int getTotalHeaderAttempt() {
    int sumOfHeaderAttempt = 0;
    for (Match match : matches) {
        sumOfHeaderAttempt += match.getHeaderAttempt();
    }
    return sumOfHeaderAttempt;
}

public int getTotalMiddleShootAttempt() {
    int sumOfMiddleShootAttempt = 0;
    for (Match match : matches) {
        sumOfMiddleShootAttempt += match.getMiddleShootAttempt();
    }
    return sumOfMiddleShootAttempt;
}
```

### 개선된 코드

```java
@FunctionalInterface
public interface Counter { 
    int getCountOfStat(Match match);
}
```

먼저, 함수형 인터페이스 `Counter`를 만들었다. 각 지표의 횟수를 셀 수 있도록 구현될 수 있는 추상 메서드인 `getCountOfStat`를 가지도록 하였다.

`총 헤딩 시도 횟수`를 가져오도록 하고 싶을 땐 추상 메서드의 구현으로써 `Match.getHeaderAttempt()`를 전달하고, `총 중거리 슛 시도 횟수`를 가져오도록 하고 싶을 땐 `Match.getMiddleShootAttempt()`를 전달하면 될 것이다.

실제로 함수형 인터페이스에 추상 메서드의 구현을 전달하는 부분을 살펴보자.

```java
private int calculateTotalCount(List<Match> matches, Counter counter) {
    int count = 0;
    for (Match match : matches) {
        count += counter.getCountOfStat(match);
    }
    return count;
}

public double getTotalHeaderAttempt() {
    return calculateTotalCount(matches, match -> getHeaderAttemptCount());
}

public double getTotalMiddleShootAttempt() {
    return calculateTotalCount(matches, match -> getMiddleShootAttemptCount());
}
```

`calcualteTotalCount` 메서드에서 함수형 인터페이스를 파라미터로 받아 그 구현을 실행하는 것을 볼 수 있다.

`getTotalHeaderAttempt`와 `getTotalMiddleShootAttempt` 메서드는 `calcualteTotalCount` 메서드로 함수형 인터페이스의 추상 메서드 구현체를 람다를 이용하여 전달하고 있음을 볼 수 있다. 참고로 람다식은 메서드 참조를 이용하여 불필요한 매개 변수를 제거할 수도 있다.

## 마무리

함수형 인터페이스와 람다를 이용하여 중복 코드를 제거하는 방법에 대해 알아보았다.

다만, Java는 기본적으로 많이 사용되는 함수형 인터페이스를 제공하기 때문에 매번 함수형 인터페이스를 직접 만들어서 사용하는 건 불필요한 작업일 수 있다.

이 글에서는 연습 삼아 별도의 함수형 인터페이스를 만들었지만, Java에서 제공하는 `ToIntFunction`을 사용해도 무리가 없었다.

기본적으로 제공되는 것만 사용해도 웬만한 람다식은 다 만들 수 있기 때문에, 어떤 게 있는지 잘 파악해서 활용하자.

## Reference

http://www.yes24.com/Product/Goods/77125987
