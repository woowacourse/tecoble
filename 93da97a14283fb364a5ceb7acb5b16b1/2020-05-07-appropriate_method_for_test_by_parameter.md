---
layout: post
title: "메서드 시그니처를 수정하여 테스트하기 좋은 메서드로 만들기"
author: [2기_스티치]
tags: ["refactoring", "test"]
date: "2020-05-07T12:00:00.000Z"
draft: false
image: ../teaser/signature.jpg
---

## 테스트 코드의 중요성

테스트 코드를 작성하면 어떤 점이 좋을까? 우리는 왜 시간을 들어가며 테스트 코드를 작성해야 할까?

테스트 코드를 작성함으로 얻을 수 있는 장점은 여러 가지가 존재한다.

- 제품의 안정성을 높여준다.

- 기능의 추가 및 수정으로 인한 부작용(_Side-Effect_)를 줄일 수 있다.

- 불안감 없이 코드 작성을 할 수 있도록 도와준다.

- 디버깅을 쉽게 해준다.

- 개발 과정에서 반복적인 작업들을 하지 않도록 도와준다.

- 더 깔끔하고 재사용성이 좋은 코드 작성을 가능하게 해준다.

이 외로도 더 많은 장점들을 **단지 테스트 코드를 작성함**으로 얻을 수 있다.

> 그러면 그냥 테스트 코드 작성하면 되지, 뭐가 문제야?

라는 생각을 할 수도 있다.

하지만, 우리는 테스트 코드를 작성하기 어려운 상황을 생각보다 자주 마주하게 된다. 어떤 코드가 테스트하기 어려운 코드인지, 그리고 어떻게 그러한 코드를 테스트하기 좋은 코드로 만들 수 있는지 알아보자.

<br />

## 테스트 하기 어려운 메서드

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

해당 코드는 [자동차 경주 게임](https://github.com/woowacourse/java-racingcar) 미션을 진행하면서 작성된 코드이다.

해당 코드에서 `move` 메서드는 0에서 9까지의 범위 내에서 랜덤하게 생성된 값을 `number` 변수에 저장한다. 그리고 `number`가 4보다 크거나 같으면 `position++` 를 실행한다.

그냥 보기에는 전혀 문제가 되지 않는다. 그렇다면 `move` 메서드에 대한 테스트 코드를 어떻게 작성할지 생각해보자.

우리는 먼저 `Car` 객체를 생성하고, 생성한 객체에 대해 `move` 메서드를 실행할 것이다. `move` 메서드에서 테스트해야 하는 시나리오는 2가지가 존재한다.

1. `number` 가 4보다 작다면 `position` 은 그대로 유지된다.

2. `number` 가 4보다 크거나 같다면 `position` 은 1 증가한다.

위의 2가지 시나리오를 테스트하기 위해서는 `move` 메서드 내의 `number` 를 우리가 원하는 대로 설정할 수 있어야 한다. 하지만 `number` 에 저장되는 랜덤 값은 `move` 메서드 내부에서 생성되기 때문에 우리가 의도하는 대로 설정할 수 없다.

그렇다면 `move` 메서드를 어떻게 수정해야 테스트하기 좋은 메서드로 바꿀 수 있을까?

<br />

## 메서드 시그니처를 수정하여 테스트하기 좋은 메서드로 만들기

우리가 `move` 메서드를 테스트하기 좋은 메서드로 만들기 위해서는 먼저 `number` 변수를 밖으로 빼야 한다. 그렇다면 `number` 에 의도하는 값을 넣을 수 있고, `move` 메서드가 `number` 값에 따라 의도하는 대로 실행하는지 확인할 수 있다.

```java
public void move(int number) {
    if (number >= MOVABLE_LOWER_BOUND) {
        position++;
    }
}
```

위의 코드는 기존의 `move` 메서드에서 매개변수로 `number` 를 받도록 수정한 코드이다. 

이전에는 `number` 변수가 `move` 메서드 내부에서 랜덤 한 값으로 초기화되었기 때문에 `move` 가 의도하는 대로 움직이는지 확인할 수 없었다. 그러나 변경된 구조는 `number` 를 외부에서 주입받기 때문에 어떤 `number` 값에 따라 `move` 가 동작하는지 쉽게 테스트할 수 있다.

`move` 메서드를 위와 같이 고친다면, 우리는 2가지 시나리오에 대한 테스트 코드를 아래와 같이 작성할 수 있을 것이다.

```java
public class CarTest {

    @DisplayName("숫자가 4보다 작으면 위치를 그대로 유지")
    @Test
    public void move_NumberIsLessThanFour_KeepPosition() {
        // Given
        final Car car = new Car("test", 1);

        // When
        car.move(3);

        // Then
        assertThat(car).extracting("position").isEqualTo(1);
    }

    @DisplayName("숫자가 4보다 크거나 같으면 위치를 1 증가")
    @Test
    public void move_NumberIsEqualOrGreaterThanFour_IncreasePositionByOne() {
        // Given
        final Car car = new Car("test", 1);

        // When
        car.move(4);

        // Then
        assertThat(car).extracting("position").isEqualTo(2);
    }

}
```

이제 `move` 메서드에 대한 모든 시나리오는 테스트가 가능하게 되었다!

<br />

## 정리하면

우리는 메서드의 시그니처를 수정하는 것만으로 테스트하기 좋은 메서드로 만들 수 있다는 것을 알게 되었다. 

물론, 이렇게 수정했다고 모든 문제가 해결된 것은 아니다. 단지 랜덤 한 값에 의존하는 클래스의 위치가 변경된 것이기 때문이다. 실제로 `move` 메서드를 사용하는 다른 클래스에서 랜덤 한 값을 주입해 주어야 하기 때문에, 해당 클래스에서는 다시 랜덤 한 값에 의존하게 된다.

우리는 이러한 의존을 어디에 두고, 어떻게 관리해야 할 것인지 고민을 해야 할 것이고, 그렇게 고민한 시간만큼 더 테스트하기 좋은 구조로 코드를 작성할 수 있을 것이다.

다음에는 이러한 의존을 조금 더 줄일 수 있는 방법 중 하나로, 인터페이스를 분리하여 테스트하기 좋은 메서드로 만드는 방법에 대해 소개하도록 하겠다.

<br />

## 참고 링크

> [설마 아직도 테스트 코드를 작성 안 하시나요?](https://medium.com/@ssowonny/%EC%84%A4%EB%A7%88-%EC%95%84%EC%A7%81%EB%8F%84-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EC%BD%94%EB%93%9C%EB%A5%BC-%EC%9E%91%EC%84%B1-%EC%95%88-%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94-b54ec61ef91a)
>
> [TDD 잘알못을 위한 돌직구 세미나 참석 후기](https://jojoldu.tistory.com/306)
