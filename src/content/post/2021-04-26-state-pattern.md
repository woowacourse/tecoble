---
layout: post
title: '상태 패턴(State Pattern)을 사용해보자'
author: [와일더]
tags: ['design-pattern']
date: '2021-04-26T12:00:00.000Z'
draft: false
image: ../teaser/emotion.png
---

## 🥰 😁 😐 😩 🤬 😴

상태(현재 진행중인 행위)를 나타내기 위해 어떤 방식을 사용해 왔는가?

## Enum

<b>열거형(Enum)</b> 이란 <b>서로 연관된 상수들의 집합</b>이다. 상태를 나타내기에는 정말 편리한 방식이라고 생각한다. 하지만 Enum 은 객체 지향적인 프로그래밍이라고 하기 애매한 부분이 있다. 그 부분에 대해서는 조금 있다가 알아보자.

## 상태 패턴

><b>"특정 기능을 수행한 후 다음 상태를 반환하는 것"</b>

상태 패턴은 상태가 많아지더라도 코드의 복잡도가 증가하지 않지만 enum 에서 조건문을 이용한 방식은 코드를 복잡하게 만들어 유지 보수를 어렵게 한다.

## 상태 패턴 적용

동일한 메서드가 상태에 따라 다르게 동작할 때 사용할 수 있는 패턴이 상태 패턴(State Pattern)이다. 상태 패턴에서는 상태를 별도의 타입으로 분리하고 상태별로 알맞은 하위 타입을 구현한다. 상태 패턴에 대해 알게 되었으니 실제로 상태 패턴을 사용해보자.

### 백견이 불여일행(百見而 不如一行)

상태패턴을 사용해보기 위한 간단한 예제 프로그램을 만들어 본다. 예시에 사용될 프로그램은 사람의 감정 상태를 변경하는 간단한 예시 프로그램이다.

구현할 수 있는 기능에 대한 예시를 주석으로 적었다. 상태 패턴은 추상화된 동일한 메서드에 상태마다 다른 <b>특정 기능을 수행한 후 다음 상태를 반환하는 것</b>이 상태 패턴의 핵심이라고 볼 수 있다.

```java
@Override
public State 어떤_행위() {
	현재 상태에 대해서 어떤 행위가 발생했을 때의 상황을 처리한다.
	처리가 끝난 후 변화된 상태를 반환한다.
}
```



### State Interface

구현할 상태에 변화를 줄 기능을 추상화한다. 해당 기능은 단순하게 로또 당첨이 되었을 때, 돈을 벌었을 때, 돈을 잃었을 때, 당첨된 로또를 잃어버렸을 때를 추상화해두고 상태에 맞게 구현하도록 되어 있다.

```java
public interface State {
    State winLottery();

    State earnMoney();

    State loseMoney();

    State loseWinLottery();

    void printCurrentEmotion();
}
```



### Emotion

로또가 당첨되거나 당첨된 로또를 잃어버린 경우는 어떠한 상태에서도 최상의 기분과 최악의 기분의 상태로 변경시킨다고 생각하고, 중복되는 기능이므로 추상 클래스로 구현한다. 이렇게 만들어진 추상 클래스를 상속받아 각각의 상태를 구현한다. 이후에 소유한 돈에 따라 기분이 달라지는 기능처럼 상태가 필요한 경우 해당 추상 클래스에 상태를 추가하여 구현할 수 있겠다.

```java
public abstract class Emotion implements State {
    @Override // 로또 당첨은 기분이 최상이 됩니다.
    public State winLottery() {
        return new Perfect();
    }

    @Override // 당첨된 로또를 잃어버리면 기분이 최악이 됩니다.
    public State loseWinLottery() {
        return new Terrible();
    }
}
```



### Perfect

최상의 기분 상태를 표현하는 클래스를 만든다.

```java
public class Perfect extends Emotion {
    @Override // 기분이 변경되지 않습니다.
    public State earnMoney() {
        // 기분이 더 좋아질 수 없기 때문에 예외를 발생시키는 방식을 사용할 수도 있다.
        return this;
    }

    @Override // 돈을 잃어서 한 단계 기분이 나빠집니다.
    public State loseMoney() {
        return new Happy();
    }

    @Override
    public void printCurrentEmotion() {
        System.out.println("최고입니다.");
    }
}
```



### Happy

기분이 좋은 상태를 표현하는 클래스를 만든다.

```java
public class Happy extends Emotion {
    @Override // 돈을 벌어서 한 단계 기분이 좋아집니다.
    public State earnMoney() {
      	// 예) 기분이 너무 좋아서 주변 지인들과 파티를 하는 기능 처리
        return new Perfect();
    }

    @Override // 돈을 잃어서 한 단계 기분이 나빠집니다.
    public State loseMoney() {
        return new SoSo();
    }

    @Override
    public void printCurrentEmotion() {
        System.out.println("행복합니다.");
    }
}
```



### SoSo

보통 기분 상태를 표현하는 클래스를 만든다.

```java
public class SoSo extends Emotion {
    @Override // 돈을 벌어서 한 단계 기분이 좋아집니다.
    public State earnMoney() {
        return new Happy();
    }

    @Override // 돈을 잃어서 한 단계 기분이 나빠집니다.
    public State loseMoney() {
        return new Bad();
    }

    @Override
    public void printCurrentEmotion() {
        System.out.println("그저그래요.");
    }
}
```



### Bad

나쁜 기분 상태를 표현하는 클래스를 만든다.

```java
public class Bad extends Emotion {
    @Override // 돈을 벌어서 한 단계 기분이 좋아집니다.
    public State earnMoney() {
        return new SoSo();
    }

    @Override // 돈을 잃어서 한 단계 기분이 나빠집니다.
    public State loseMoney() {
      	// 예) 기분이 너무 나빠지며 친한 친구와 술을 먹는 기능 처리
        return new Terrible();
    }

    @Override
    public void printCurrentEmotion() {
        System.out.println("별로입니다.");
    }
}
```



### Terrible

최악의 기분 상태를 표현하는 클래스를 만든다.

```java
public class Terrible extends Emotion {
    @Override // 돈을 벌어서 한 단계 기분이 좋아집니다.
    public State earnMoney() {
        return new Bad();
    }

    @Override // 기분이 변경되지 않습니다.
    public State loseMoney() {
        // 기분이 더 나빠질 수 없기 때문에 예외를 발생시키는 방식을 사용할 수도 있다.
        return this;
    }

    @Override
    public void printCurrentEmotion() {
        System.out.println("최악입니다.");
    }
}
```



## 기능 적용

### Person

위에서 테스트가 정상적으로 통과되었다면 실제로 애플리케이션에서 실행해 보도록 하자. 만들어둔 감정 상태를 가지고 있는 Person 을 만든다. Person 에서 구현한 기능들은 호출이 되면 상태가 변경되고 변경된 상태를 출력해주는 간단한 기능이 구현되어있다.

```java
public class Person {
    private State state;

    public Person(State state) {
        this.state = state;
    }

    public void winLottery() {
        state = state.winLottery();
        state.printCurrentEmotion();
    }

    public void earnMoney() {
        state = state.earnMoney();
        state.printCurrentEmotion();
    }

    public void loseMoney() {
        state = state.loseMoney();
        state.printCurrentEmotion();
    }

    public void printCurrentEmotion() {
        state.printCurrentEmotion();
    }
}

```



### Application

Person 인스턴스를 생성한다. 메서드 호출에 따라서 상태가 변경되는 모습을 확인할 수 있다. 이렇게 상태를 객체로 관리하게 되면 각각의 상태마다 세부적인 기능 구현을 할 수 있다.

```java
public class Application {
    public static void main(String[] args) {
        Person person = new Person(new SoSo());
        person.printCurrentEmotion();
        person.earnMoney();
        person.winLottery();
        person.loseMoney();
        person.loseMoney();
        person.loseMoney();
        person.loseMoney();
    }
}

/* 실행 결과
> Task :Application.main()
그저 그래요.
행복 합니다.
최고 입니다.
행복 합니다.
그저 그래요.
별로 입니다.
최악 입니다. */
```



## 새로운 감정 상태가 추가된다면?

작은 변화에는 크게 감정 변화가 생기지 않는 상태인 Sleepy 라는 감정 상태가 추가된다고 한다.

### Sleepy

```java
public class Sleepy extends Emotion {
    @Override // 졸린 상태에서는 돈을 조금 얻는다고 해서 기분이 달라지지 않는다.
    public State earnMoney() {
        return this;
    }

    @Override // 졸린 상태에서는 돈을 조금 잃는다고 해서 기분이 달라지지 않는다.
    public State loseMoney() {
        return this;
    }

    @Override
    public void printCurrentEmotion() {
        System.out.println("졸립니다.");
    }
}
```



위와 같은 새로운 상태가 추가되더라도 콘텍스트 코드가 받는 영향은 최소화된다.

```java
public class Application {
    public static void main(String[] args) {
        Person person = new Person(new Sleepy());
        person.printCurrentEmotion(); // state = Sleepy.class
        person.earnMoney(); // state = Sleepy.class
        person.winLottery(); // state = Perfect.class
    }
}
```



## 경험해 보았는가?

어떤가? 간단한 예시를 들어서 상태패턴에 대해서 설명을 했다.

상태패턴이란 객체 지향 방식으로 <b>상태 기계(한 번에 오로지 하나의 상태만을 가지게 되며, 현재 상태(Current State)란 임의의 주어진 시간의 상태를 칭함)</b>를 구현하는 행위 소프트웨어 디자인 패턴이다. 상태 패턴을 이용하면 상태 패턴 인터페이스의 파생 클래스로서 각각의 상태를 구현함으로써, 또 패턴의 부모클래스에 의해 정의되는 메서드를 호출하여 상태 변화를 구현함으로써 상태 기계를 구현한다. 상태 패턴의 장점은 새로운 상태가 추가되더라도 콘텍스트 코드가 받는 영향은 최소화된다. 클래스를 추가하더라도 기존의 메서드의 코드는 그대로 유지된다. 또한 상태에 따른 동작을 구현한 코드가 상태별로 구분되기 때문에 상태별 동작을 수정하기 쉽다.

더욱 복잡한 로직이 추가 된다면 상태 패턴은 더 큰 빛을 볼 것이다. 그리고 궁금해 할 수 있기 때문에 같은 기능을 하는 enum 상태를 구현해 보았다.

## Enum

```java
public enum State {
    PERFECT("최고 입니다."),
    HAPPY("행복 합니다"),
    SO_SO("그저 그래요."),
    BAD("별로 입니다."),
    TERRIBLE("최악 입니다.");

    private String message;

    State(String message) {
        this.message = message;
    }

    public State winLottery() {
        return PERFECT;
    }

    // if (else if) 조건 분기로 상태를 처리한다.
    public State earnMoney() {
        if (this == TERRIBLE) {
            return BAD;
        }
        if (this == BAD) {
            return SO_SO;
        }
        if (this == SO_SO) {
            return HAPPY;
        }
        return PERFECT;
    }

    // 위와 마찬가지로 switch 조건 분기로 상태를 처리한다.
    public State loseMoney() {
        switch (this) {
            case PERFECT:
                return HAPPY;
            case HAPPY:
                return SO_SO;
            case SO_SO:
                return BAD;
            default:
                return TERRIBLE;
        }
    }

    public State loseLottery() {
        return TERRIBLE;
    }

    public void printCurrentEmotion() {
        System.out.println(message);
    }
}
```



위의 예시처럼 Sleep 이라는 상태를 추가 한다면 enum 의 earnMoney() 와 loseMoney() 를 수정해야 한다.

```java
SLEEP("졸립니다.");

 public State earnMoney() {
        if (this == TERRIBLE) {
            return BAD;
        }
        if (this == BAD) {
            return SO_SO;
        }
        if (this == SO_SO) {
            return HAPPY;
        }
        if (this == HAPPY) {
          	return PERFECT;
        }
        default:
            return SLEEP;
    }
}

public State loseMoney() {
        switch (this) {
            case PERFECT:
                return HAPPY;
            case HAPPY:
                return SO_SO;
            case SO_SO:
                return BAD;
            case BAD:
                return TERRIBLE;
            default:
                return SLEEP;
        }
}
```



enum 하나에서 모든 상태를 관리하는 것은 좋아 보일 수 있다. 하지만 메서드를 실행하기 위해 생긴 많은 분기를 보아라. 상태가 계속해서 생겨날 경우, 기능의 수정이 발생하는 경우, Enum 값을 [if 혹은 switch 문으로 판단하는 경우](https://woowacourse.github.io/tecoble/post/2020-07-29-dont-use-else/)에는 [OCP(개방폐쇄원칙)](https://woowacourse.github.io/tecoble/post/2020-07-31-solid-1/)를 준수하지 못한다.  상태가 많아질수록 복잡해지는 조건문이 여러 코드에서 중복해서 출현하고 그만큼 코드 변경을 어렵게 만든다.

상태 패턴에 대해 이해가 바로 되지는 않을 것이다. 프로그램을 구상할 때 상태가 필요한 곳에서 상태 패턴을 사용하여 프로그램을 설계 해보다 보면 상태 패턴에 대한 이해가 자연스럽게 될 것이다. <b>디자인 패턴부터 학습하는 방식보다는 경험을 토대로 구현을 해본 후 디자인 패턴과 비교해보며 학습하는 방식을 추천한다.</b>



## 참고

- [열거형 enum](https://opentutorials.org/course/2517/14151)
- [상태패턴 wikipedia](https://ko.wikipedia.org/wiki/%EC%83%81%ED%83%9C_%ED%8C%A8%ED%84%B4)
- 개발자가 반드시 정복해야할 객체지향과 디자인패턴
