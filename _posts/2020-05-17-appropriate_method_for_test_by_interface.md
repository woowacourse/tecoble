---
layout: post
title: "인터페이스를 분리하여 테스트하기 좋은 메서드로 만들기"
author: "스티치"
comment: "true"
tags: ["interface", "refactoring", "test"]
toc: true
---

## 이전 글에서

[메서드 시그니처를 수정하여 테스트하기 좋은 메서드로 만들기](./2020-05-07-appropriate_method_for_test_by_parameter.md)에서는 테스트하기 어려운 메서드의 시그니처를 수정하여 테스트하기 쉽게 바꾸는 방법을 알아보았다. 해당 방법은 테스트하기 어려운 의존을 매개변수를 통해서 전달받도록 수정하여 메서드가 직접적인 의존을 가지지 않도록 하는 방법이었다.

그러나 이러한 방법은 테스트를 어렵게 만드는 대상과의 의존 관계를 상위로 이동시키는 것에 불과하다. 만약 의존 관계를 가지는 코드가 계속 상위로 올라가게 된다면 실제로 사용되는 위치와 너무 멀어지게 되고, 그로 인해 코드의 **응집도**가 떨어지는 현상이 발생할 수도 있다.

이번 글에서는 이러한 현상을 개선해 줄 수 있는 방법 중 하나인 **인터페이스 분리**를 소개한다. 이 방법은 디자인 패턴 중 하나인 [**전략 패턴**](https://ko.wikipedia.org/wiki/%EC%A0%84%EB%9E%B5_%ED%8C%A8%ED%84%B4)을 활용한 것이므로, 전략 패턴에 대해 간단하게 공부를 하고 이 글을 본다면 훨씬 이해하기가 쉬울 것이다.

<br />

## 테스트 하기 어려운 메서드

이번 글에서도 [자동차 경주 게임](https://github.com/woowacourse/java-racingcar) 미션을 예시로 살펴보도록 하자.

```java
public class Car {

    private static final int MOVABLE_LOWER_BOUND = 4;
    private static final int RANDOM_NUMBER_UPPER_BOUND = 10;

    private final String name;
    private int position;

    public Car(String name, int position) {
        this.name = name;
        this.position = position;
    }

    public void move() {
        final int number = random.nextInt(RANDOM_NUMBER_UPPER_BOUND);

        if (number >= MOVABLE_LOWER_BOUND) {
            position++;
        }
    }

}
```

이전 글의 **메서드 시그니처를 수정하여 테스트하기 좋은 메서드로 만드는 방법**은 `move` 메서드에서 매개변수로 `number` 를 받도록 수정하여 테스트하기 좋은 메서드로 만들었다.

이 방식을 통해 수정된 코드는 아래와 같다.

```java
public void move(int number) {
    if (number >= MOVABLE_LOWER_BOUND) {
        position++;
    }
}
```

그러나 앞서 말했듯이 이렇게 시그니처를 수정하는 방법은 의존 관계를 상위로 이동시킨 것에 불과하다. 테스트 코드에 영향을 미치지 않는 곳까지 계속 의존 관계를 이동시킨다면 어떻게 될까? 아마 해당 코드(여기서는 랜덤 한 값을 생성해 주는 객체)가 어디서 사용되는지 찾기조차 어려울 것이다.

기존 코드(여기서는 `Car` 객체)의 응집도는 그대로 유지하되, 테스트하기 좋은 형태로 수정하는 좋은 방법이 없을까?

수정한 `move` 메서드를 자세히 살펴보면 (랜덤하게 생성된) 숫자를 매개변수로 받는다. 그리고 해당 숫자가 특정한 값(여기서는 4)보다 크거나 같으면 위치를 1 증가시키고 작으면 위치를 그대로 유지한다.

그렇다면 우리는 `move` 메서드가 **특정한 값**에 대해서 정상적으로 동작하는 지만 확인한다면, 특정한 값이 우리가 의도한 값이든, 랜덤 한 값이든 신경 쓰지 않아도 된다! 

즉, 프로덕션 코드가 동작하는 곳에서는 `move` 메서드가 랜덤 한 값을 받도록 하고 테스트 코드가 동작하는 곳에서는 `move` 메서드가 의도한 값을 받도록 하면 된다.

위에서 말한 방법이 가능하도록 하는 것이 바로 **인터페이스 분리**이다. 영화를 보면 전투 로봇은 총을 쓸 때는 무기로 총을 장착하고 대포를 쏠 때는 무기로 대포를 장착한다. 우리의 코드도 영화속의 로봇처럼 실제로 동작할 때와 테스트를 할 때 서로 다른 무기(코드)를 장착한다면 상황에 맞게 원하는 대로 사용할 수 있을 것이다.

<br />

## 전략 패턴을 사용한 인터페이스 분리

그렇다면 우리가 만들어야 하는 무기는 어떻게 동작해야 할까?

`move` 메서드를 보면 `number`를 매개변수로 받는다. `move` 메서드에 장착시킬 수 있는 무기는 `number`, 즉 `int` 타입을 반환할 수 있어야 한다. 

`int` 를 반환할 수 있는 인터페이스인 `NumberGenerator` 를 간단하게 구현해보자. 해당 인터페이스는 `int` 타입의 값을 반환하는 메서드도 함께 가지고 있어야 할 것이다.

```java
public interface NumberGenerator {

    int generate();

}
```

위의 `NumberGenerator` 인터페이스는 `generate` 메서드를 통해 `int` 타입의 값을 생성할 수 있다. 그렇다면 생성된 값을 어떻게 move 메서드에서 사용할 수 있을까?

```java


public void move(NumberGenerator numberGenerator) {
    final int number = numberGenerator.generate();

    if (number >= MOVABLE_LOWER_BOUND) {
        position++;
    }

}

```

위의 코드처럼 사용하면 어떨까? 우선 `int` 타입의 숫자를 생성할 수 있는 `NumberGenerator` 를 매개변수로 받는다. 그리고 해당 인터페이스에서 `int` 타입의 숫자를 생성하는 `generate` 메서드를 호출하여 숫자를 생성한다. 해당 숫자를 정수 4에 해당하는 `MOVABLE_LOWER_BOUND` 변수와 비교하여 크거나 같으면 `position` 을 1 증가, 작다면 그대로 유지시키면 된다.

이제는 `move` 메서드에서 숫자를 생성하는 역할을 담당하는 `NumberGenerator` 인터페이스를 랜덤 한 값 또는 의도하는 값을 생성할 수 있도록 구현체를 정의하면 된다.

프로덕션 코드에서 사용될 랜덤 한 값을 생성하는 인터페이스를 `RandomNumberGenerator` 로 이름 짓고 구현해보자.

```java
public class RandomNumberGenerator implements NumberGenerator {

    private static final int RANDOM_NUMBER_UPPER_BOUND = 10;

    @Override
    public int generate() {
        return random.nextInt(RANDOM_NUMBER_UPPER_BOUND);
    }

}
```

위에서 구현한 `RandomNumberGenerator` 클래스의 `generate` 메서드는 0부터 9까지의 숫자 중 랜덤 한 값을 반환한다.

프로덕션 코드에서 `Car` 객체의 `move` 메서드를 어떻게 활용할 수 있는지 간단하게 살펴보면 

```java
public void moveCarByRandomNumber() {
    // name: 스티치, position: 1 인 Car 객체 생성
    final Car car = new Car("스티치", 1);
    // 랜덤한 숫자를 생성하는 RandomNumberGenerator 객체 생성
    final NumberGenerator numberGenerator = new RandomNumberGenerator(); 

    car.move(numberGenerator); // 해당 코드가 진행되고 car의 위치는?
}
```

위와 같이 사용될 수 있다. 위의 코드에서 `car.move(numberGenerator)` 가 실행되고 난 뒤의 `car` 의 `position` 값은 얼마일까?

`RandomNumberGenerator` 가 랜덤 한 숫자를 생성하기 때문에 우리는 `position` 이 1인지, 2인지 알 수없다. 그러나 랜덤 한 숫자가 4보다 크거나 같았다면 `position` 이 2가 됐을 것이란 건 알 수 있다.

그렇다면 이제는 4보다 큰 값이 `move` 메서드에서 생성될 경우 `position` 이 정상적으로 1이 증가하는지 확인만 한다면 `move` 메서드의 동작에 대한 검증을 완료할 수 있다.

`move` 메서드가 정상적으로 동작하는지 테스트하기 위해 `NumberGenerator` 인터페이스를 구현하고 `generate` 메서드가 4보다 크거나 같은 값을 만들어 주는 `MovableNumberGenerator` 구현체를 만들어 보자.

```java
public class MovableNumberGenerator implements NumberGenerator {

    @Override
    public int generate() {
        return 4;
    }

}
```

`MovableNumberGenerator` 클래스의 경우 `generate` 메서드가 4라는 값을 반환한다. 이 클래스를 사용하여 테스트 코드를 한 번 작성해보자.

```java
public class CarTest {

    @DisplayName("숫자가 4보다 크거나 같으면 위치를 1 증가")
    @Test
    public void move_NumberIsEqualOrGreaterThanFour_IncreasePositionByOne() {
        // Given
        final Car car = new Car("스티치", 1);
        final NumberGenerator numberGenerator = new MovableNumberGenerator();

        // When
        car.move(numberGenerator);

        // Then
        assertThat(car).extracting("position").isEqualTo(2);
    }

}
```

위의 테스트 코드를 보면 `car` 객체의 `move` 메서드 매개변수로 `MovableNumberGenerator` 객체를 넘겨준다. `MovableNumberGenerator` 객체의 `generate` 메서드는 4를 반환하므로 `car` 객체의 `position` 은 1이 증가하여 2가 될 것이다.

반대의 경우도 `NumberGenerator` 구현체를 하나 더 만들고 `generate` 메서드가 4보다 작은 값을 반환하도록 만들면 쉽게 테스트할 수 있다.

```java
public class NonMovableNumberGenerator implements NumberGenerator {

    @Override
    public int generate() {
        return 3;
    }

}
```

```java
public class CarTest {

    ...

    @DisplayName("숫자가 4보다 작으면 위치를 그대로 유지")
    @Test
    public void move_NumberIsLessThanFour_KeepPosition() {
        // Given
        final Car car = new Car("스티치", 1);
        final NumberGenerator numberGenerator = new NonMovableNumberGenerator();

        // When
        car.move(numberGenerator);

        // Then
        assertThat(car).extracting("position").isEqualTo(1);
    }

```

위와 같이 `generate` 메서드가 4보다 작은 값인 3을 반환하는 `NonMovableNumberGenerator` 클래스를 구현하고, 테스트 코드에서 해당 클래스에 대한 객체를 생성하여 `car` 객체의 `move` 메서드에 넘겨준다면 4보다 작은 숫자에 대한 `move` 메서드의 동작을 테스트할 수 있다.

지금까지 전략 패턴을 활용한 인터페이스 분리를 통해 테스트하기 쉬운 메서드로 만들어 보았다.

<br />

## 정리하면

이전에 알아본 메서드 시그니처를 수정하여 테스트하기 좋은 메서드로 만드는 방법에 비해 코드의 응집도가 더 높고 의존 관계를 더 이상 이동시킬 필요가 없다는 장점이 있다.

하지만 인터페이스를 분리하는 방법 역시 `move` 메서드의 시그니처를 수정하는 것이 불가피하다. 만약, 기존에 `move` 메서드를 수백, 수천 군데에서 사용하고 있다면 지금의 방법을 사용하기엔 큰 부담이 존재한다. 메서드 시그니처를 수정한다면 메서드를 사용하는 모든 코드를 추가적으로 수정해야 하기 때문이다.

다음번에는 테스트하기 좋은 메서드로 만드는 방법의 마지막으로 **리팩토링의 관점**에서 메서드의 시그니처를 수정하지 않고 상속을 통해 테스트가 가능한 구조로 변경할 수 있는 방법에 대해 알아보도록 하겠다.