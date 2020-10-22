---
layout: post
title: "생성자 인자가 많을 땐? Builder!"
author: "유안, 카일"
comment: "true"
tags: ["design-pattern", "class"]
toc: true
---

## 생성자 인자가 많을 때 문제점

클래스를 설계하다 보면 필드 개수가 많아지는 경우가 생긴다. 이 때 다음과 같은 문제점들이 발생한다.

### 1. 선택적으로 생성자를 제공하고 싶은 경우 생성자가 너무 많아진다

아래와 같은 코드를 점층적 생성자 패턴이라 하며 인자를 선택적으로 받을 때 자주 사용한다. 아래 예시에서는 일부만 보여줬지만 실제로는 더 많아질 것이다. 이는 유사한 코드를 반복함으로써 코드의 가독성을 낮출 뿐만 아니라 나중에 필드에 변화가 있을 때 코드 수정을 번거롭게 만든다.

```java
public class Hamburger {
    private String name;
    private String calories;
    private boolean tomato;
    private String beef;
    private boolean wantToEat;

    public Hamburger(final String name, final String calories) {
        this.name = name;
        this.calories = calories;
    }

    public Hamburger(final String name, final String calories, final boolean tomato) {
        this.name = name;
        this.calories = calories;
        this.tomato = tomato;
    }

    public Hamburger(final String name, final String calories, final boolean tomato, final String beef) {
        this.name = name;
        this.calories = calories;
        this.tomato = tomato;
        this.beef = beef;
    }
}
```

### 2. 생성자에서 인자의 타입이 동일할 경우 순서를 잘못 기입할 수 있다

햄버거 객체는 첫 번째 인자와 두 번째 인자가 모두 `String` 타입이다. 따라서 아래의 코드는 햄버거의 이름과 칼로리를 반대로 적었지만 컴파일 및 런타임 시점에서 아무런 예외도 발생하지 않는다.

```java
public static void main(String[] args) {
        final Hamburger hamburger = new Hamburger(
            "300칼로리", // 햄버거 이름의 위치에 칼로리를 작성
            "수제 햄버거", // 칼로리 위치에 햄버거 이름 작성
            true,
            "고기 맛 좋아요",
            true
        );
    }
}
```

## 빌더 패턴을 이용한 문제 해결

이러한 문제를 해결하기 위한 방법으로 `Builder` 라는 패턴이 존재한다. 위와 같이 `Method Chaining` 형태로 객체를 리턴하는 방식을 통해 각 필드의 이름과 인자를 매핑할 수 있다. 이는 앞에서 소개한 문제점들을 해결할 수 있다.

우선 생성자를 여러개 만들지 않고도 선택적으로 인자를 입력할 수 있다. 이는 유사한 코드의 중복을 줄여 코드의 가독성을 높이고 코드가 변화에 유연하게 해준다. 입력되지 않은 필드는 `null`로 자동으로 채워지며 이 점은 주의할 필요가 있다.

또한, 필드명과 인자를 확인하며 값을 채울 수 있다. 일반적인 생성자를 사용할 때와 다르게 순서를 잘못 기입해서 잘못된 값이 들어가는 경우를 막아준다.

```java
public static void main(String[] args) {
        final Hamburger hamburger = new Hamburger().builder()
            .name("햄버거")
            .calories("300 칼로리")
            .tomato(true)
            .beef("맛좋은 고기")
            .wantToEat(true)
            .build();
    }
}

```

# 빌더 패턴 주의점

빌더 패턴은 위와 같은 장점이 있기에 유연하게 사용할 수 있으며 읽기 좋은 코드를 작성하도록 도와준다. 그렇다면 빌더 패턴에는 장점만 있을까?

아래와 같이 모든 필드가 `private final` 인 경우에 이 클래스를 처음 설계한 사람의 의도는 객체로 초기화시킬 때 모든 값을 채워서 초기화하길 원했을 것이다. 하지만 빌더를 사용하는 경우 아래와 같이 초기화되지 않은 채로 객체를 생성할 수 있고, 초기화되지 않은 필드에는 `null` 이 할당된다. 
```java
@Getter
@Builder  // 해당 어노테이션을 통해서, 쉽게 빌더를 생성할 수 있다.
public class Immutable {
    private final String name;
    private final Integer age;
    private final String address;

}
```

아래의 코드에서 확인 할 수 있듯이 값을 채우지 않고도 생성할 수 있으며 이 때 값은 `null` 로 할당된다. 이처럼 다른 개발자가 의도하지 않은 형태로 객체를 사용할 수 있다는 위험성을 내포한다.

```java
class ImmutableTest {
    @Test
    void builder() {
        final Immutable immutable = Immutable.builder().build();

        assertAll(
            () -> assertThat(immutable.getAddress()).isNull(),
            () -> assertThat(immutable.getAge()).isNull(),
            () -> assertThat(immutable.getName()).isNull()
        );
    }
}
```

# 결론

`Builder` 를 사용하면 생성자가 많은 경우에 코드의 길이는 줄이면서 가독성은 높일 수 있다. 하지만 모든 기술이 그러하듯 무분별한 사용은 의도하지 않은 결과를 낳을 수 있다. 따라서 위의 주의점을 유의하며 사용하는 것이 바람직하다.
