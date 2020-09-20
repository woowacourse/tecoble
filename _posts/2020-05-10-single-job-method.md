---
layout: post
title: "하나의 메서드는 하나의 기능을 수행하자"
author: "보스독"
comment: "true"
tags: ["clean-code", "refactoring"]
toc: true
---



우리는 프로그래밍을 하면서 수많은 메서드들을 작성한다. 

그렇다면 우리가 작성하는 프로그래밍에서의 메서드란 무엇일까? 

> ```
> 객체 지향 프로그래밍(OOP)에서 메서드는 객체와 관련된 프로시저이다. 
> 객체는 데이터와 동작으로 구성되고 데이터 및 행동은 인터페이스를 포함한다. 
> 따라서 메서드는 클래스 안에서 정의되며, 인터페이스는 서로 협력하는 객체간의 메시지를 보낼 수 있도록 지정한다.
> 
> - From wikipedia - 
> ```

객체 지향 프로그래밍에서 메서드는 객체간의 협력하는 구조를 설계하고 구현하기 위해서 반드시 필요한 객체의 행동에 해당한다. 하지만 구현해야하는 요구사항이 많아지고 객체들의 관계가 복잡해질 경우 이를 표현하는 메서드의 길이가 길어질 뿐만 아니라 하나의 메서드가 여러 기능을 하는 일이 발생한다.

여기서 우리는 주의해야 할 필요가 있다. 전체 메서드의 개수를 줄이고 한 메서드 안에 여러 기능을 구현하는 것이 과연 좋은 프로그래밍 방법일까?

**나는 NO라고 답하겠다.**

우테코 크루의 자동차 경주 미션 코드 중 일부를 발췌한 예시를 통해 그 이유를 알아보자. 

```java
// Cars.java in racingcar
...

public void moveAllCarOneTime() {
    for (Car car : raceCars) {
        car.increasePositionOrNot(Util.getRandomNumber());
        if (car.checkGreaterThanMaxPos(maxPosition)) {
            ++this.maxPosition;
        }
    }
}
...
```

 `moveAllCarOneTime` 메소드를 들여다보자. 요구사항이 단순하다보니, 메서드 길이 자체는 양호해 보인다. 그렇다면 무슨 기능을 하는 메서드인지 단번에 알아 보겠는가?

무슨기능을 하는 지 알기 위해서 가장 먼저 메서드 명에 눈이 갈 것이다. 메서드 명만 보면 **모든 자동차에 대해 move를 수행**하는 것으로 이해할 수 있다. 과연 정말 그럴까?

내부코드를 보면 반복문을 돌며 실제로 `increasePositionOrNot` 메서드를 실행하고 있지만, `checkGreaterThanMaxPos`라는 메서드를 추가적으로 실행하여 Max Position을 확인하고, 그 값을 업데이트까지 해주고 있다.

Max Position은 우승자를 구하는 로직에 쓰이는 중요한 값이지만, `moveAllCarOneTime` 메서드가 값을 변경할 책임도 명분도 없다.

이 코드를 작성한 크루는 아마 우승자를 구하기 위해 필요한 Max Position을  어차피 반복문을 돌며 구해야 하기 때문에 한번에 처리하고 싶은 의도가 있었을 것이다. 하지만 그러한 작업내용이 메서드 명에 드러나있지 않기 때문에 코드를 처음 보는 사람은 메서드 명만 보고 충분히 오해를 할 수 있다. 따라서 우승자를 구하는데 필요한 로직은 별도의 함수를 통해 작성되어야 한다.

위 예시 코드를 통해 찾은 문제점은 다음과 같다.

> 1. 메서드 명이 메서드의 기능을 포괄하지 못하고 있다.
> 2. 우승자 관련된 요구사항 변경 시  `moveAllCarOneTime`  메서드를 수정해야 한다.
> 3. 반환 값이 없고 두 가지 기능을 수행하고 있기 때문에 테스트하기 어렵다. 

아직은 기능의 규모가 작기 때문에 위 문제점들이 마음에 크게 와닿지 않을 수 있다. 하지만 규모가 확장되고 구현해야 하는 로직이 복잡해진다면 위 문제들도 점점 더 커지게 될 것이다.

따라서 우리는 유지 보수를 쉽게 하고 의사소통 비용을 줄이기 위해 매우 상습적으로 클린 코드를 지향해야 할 필요가 있다. 이는 궁극적으로 객체지향 프로그래밍을 더 효과적으로 활용할 수 있는 발판이 되기 때문이다.

그렇다면 바로 우리가 해야할 일은 의식적으로 하나의 기능만을 수행하는 작은 단위의 메서드를 만드는 것이다. **하나의 메서드가 하나의 기능만 구현하도록 코드를 명료하게 작성**하면 어떤 점이 좋은지 알아보자.



### 1. 메서드 명만 보더라도 어떤 기능을 수행하는 메서드인지 명확하게 알 수 있다.

기능의 단위가 짧고 명확할수록 기능을 대변하는 이름 짓기도 수월하지 않겠는가?

잘 지은 메서드 명은 코드의 가독성이 증가시키고 유지 보수를 수월하게 해준다. 이름의 길이는 중요하지 않다. 축약된 단어를 쓰지 말고, 메서드가 수행하는 기능을 잘 대변할 수 있는 이름을 짓는 것이 중요하다.

메서드 네이밍 컨벤션도 지키며 코드를 작성하면 많은 도움이 될 것이다. 메서드 네이밍 컨벤션에 대한 자세한 내용은 [메서드 네이밍 컨벤션](https://woowacourse.github.io/javable/2020-04-26/Method-Naming) 글을 참고하자.



### 2. 코드의 재사용이 증가하여 유지보수가 용이해진다.

메서드를 작은 단위로 쪼갤수록 여러 곳에서 쉽게 가져다 재사용할 수 있다. 레고 블럭을 생각하면 이해가 쉽다. 단일 블럭은 어느 곳이든 사용될 수 있지만, 여러 블럭이 붙어 단위가 커진 블럭은 본래의 기능과 개성 때문에 쉽게 재사용하지 못한다. 

앞서 살펴본 예시 코드에서 만약 우승자를 구하는게 아닌 꼴찌를 구하는 요구사항으로 변경되었다면 어떨지 생각해보자. 아마도 이름만 보면 결과를 구하는 것과 전혀 관련이 없어보이는  `moveAllCarOneTime` 메서드에서 코드의 변경이 일어나야 할 것이다.

하지만 Max Position을 `findMaxPosition`이라는 이름의 메서드로 따로 분리하여 작은 단위로 사용한다면 우승자와 관련된 요구사항이 변경될 때마다 해당 메서드에서만 코드 변경이 일어나고 이는 곧 코드의 재사용을 돕는다. 아래 예시를 보자. maxPosition을 구하는 메서드를 분리하고 나니 WinnerCar 클래스의 `findWinnerCar`메서드에서도, `showWinnerPosition`에서도 재사용이 가능해진 것을 확인할 수 있을 것이다. 메서드를 작은 단위로 분리할수록 메서드의 응집도를 높일 수 있고 결과적으로 유지 보수를 용이하도록 만들어준다는 것을 다시 한 번 명심하자.

``` java
// Cars.java
...
public int findMaxPosition() {
    return cars.stream()
          .mapToInt(Car::getPosition)
          .max()
          .getAsInt();
}
...

// WinnerCar.java
...
public Car findWinnerCar(Cars cars) {
    int maxPosition = cars.findMaxPosition();  // 재사용
    return cars.getCars().stream()
            .filter(car -> car.isPosition(maxPosition))
            .findFirst()
            .orElseThrow(IllegalArgumentException::new);
}

public void showWinnerPosition(Cars cars) {
    System.out.println("max position : " + cars.findMaxPosition());  // 재사용
}
...
```


### 3. 단위 테스트가 수월해진다.

테스트 주도 개발(TDD)를 할 때 도메인 객체들의 기능을 테스트하기 위해서 단위 테스트를 작성한다. 그렇다면 위에서 본 예시에서  `moveAllCarOneTime` 메서드의 테스트 코드는 어떻게 작성되었을까? 어떤 값을 확인해야 할까?

아니. 그전에 검증을 제대로 할 수 있을지 생각해봐야 한다. 현재 이 메서드는 car에게 메시지를 보내 내부 로직을 수행함과 동시에 `maxPosition`이라는 전역변수의 값을 변경하고 있다. 테스트를 수행하는 동안 전역변수의 값이 변하지 않는다고 보장할 수 있을까? 

또한 메서드가 반환 값이 없는 타입이기 때문에 `maxPosition`을 확인하는 테스트를 작성하는 것이 쉽지 않을 것이다. 

하지만 위에서 본 코드와 같이`maxPosition`을 구하는 `findMaxPosition`이라는 메서드를 분리한다면 다음과 같은 테스트를 추가적으로 작성할 수 있다.

``` java
// CarsTest.java
@DisplayName("Max Position 확인")
@Test
public void maxPosition() {
    Car car1 = new Car("c1");
  
    car1.increasePositionOrNot(4);
    car1.increasePositionOrNot(5);
  
    Cars cars = new Cars(Arrays.asList(car1));
  
    assertThat(cars.findMaxPosition()).isEqualTo(2);
}
```



### 결론 

하나의 기능을 하도록 메서드를 구현하면 위에서 살펴본 장점들을 확보할 수 있을 뿐만 아니라 전체적인 가독성도 높아진다. 우리는 글을 읽을 때도 짧은 단락으로 구성된 글이 긴 장문의 글보다 더 읽기 쉽고 이해하기도 쉽다는 것은 누구나 알고 있는 사실이다.

메서드를 작성할 때 가장 좋은 라인 수는 5~10줄이라고 한다. 가능한 10줄 이내의 길이로 하나의 기능을 가진 메서드를 작성하는 연습을 통해 우리 모두 클린 코더가 되어보자.

---

#### 읽어볼 만한 문서

[Long Method](https://refactoring.guru/smells/long-method)

[Clean Coding in Java](https://www.baeldung.com/java-clean-code)

[Composing Method](https://refactoring.guru/extract-method)

