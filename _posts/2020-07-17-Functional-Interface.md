---
layout : post
title : "Functional Interface란"
author : "티거"
comment: "true"
tags: ["interface"]
toc: true
---

Java8부터 함수형 프로그래밍을 지원한다.

함수를 [일급객체]([https://medium.com/@lazysoul/functional-programming-%EC%97%90%EC%84%9C-1%EA%B8%89-%EA%B0%9D%EC%B2%B4%EB%9E%80-ba1aeb048059](https://medium.com/@lazysoul/functional-programming-에서-1급-객체란-ba1aeb048059))처럼 다룰 수 있게 제공하는 **Functional Interface**에 대해 알아볼 것이다.

## Functional Interface란?

> 단 하나의 추상 메서드를 가지는 인터페이스. - [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-9.8)

무슨 말인지 코드로 보여주겠다.

```java
@FunctionalInterface
public interface Operator {
    public int operate(int x, int y);
}
```

이렇게 **메서드를 하나만 가지는 인터페이스**를 **Functional interface**라고 한다. (단, default 메서드 제외)

`@FunctionalInterface`는 무엇일까?

> Functional Interface라는 것을 명시하기 위해 사용한다. @FunctionalInterface를 사용하면 부적절한 메서드를 추가하거나 다른 인터페이스를 상속받으면 컴파일 에러가 발생한다. - [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-9.6.4.9)

## Functional Interface를 왜 사용할까?

> 함수형 개발 방식은 행위에 해당하는 부분도 값으로 취급이 가능해 졌다는 것인데 자바에서 의미하는 기본형의 데이터(Integer 나 String)만 값이 아니라 행위(로직)도 값으로 취급할 수 있게 되었다는 이야기입니다. 이것은 자바가 코드의 재활용 단위가 클래스였던 것이 함수 단위로 재사용이 가능해 지면서 조금 더 개발을 유연하게 할 수 있게 된 점이라고 할 수 있습니다. - [자바로 함수형 인터페이스 사용하기](https://jogeum.net/18)

**행위도 값으로 취급?** **함수 단위로 재사용?** 이게 무슨말일까?

알아보자!!!

다음과 같은 Functional interface가 있다고 하자.

```java
@FunctionalInterface
public interface Validator {
    boolean test();
}
```

일단 우리는 `test` 메서드가 boolean를 리턴하는 것을 알 수 있다. Main.class를 보자.

```java
public class Main {

    public static void main(String[] args) {
        Random random = new Random();
        int user1 = random.nextInt(10);
        int user2 = random.nextInt(10);
        boolean check = is(() -> user1 < user2);
    }

    public static boolean is(Validator validator) {
        return validator.test();
    }
}
```

앞에서 말한 **"행위도 값으로 취급? 함수 단위로 재사용?"**가 무슨 말이었을까?

`is`라는 메서드는 Functional interface인 `Validator`를 파라미터 타입을 받고. 파라미터인 `validator`는 `() -> user1 < user2`를 파라미터로 받는다. 여기서 **행위도 값으로 취급**할 수 있다는 말을 이해할 수 있다. 

또한, 사용된 `is(() -> user1 < user2)`는 `is(() -> user1 == user2)`이렇게도 할 수 있고, `is(() -> user1 + user2 > 10)`이렇게도 할 수 있다. 이 부분에서 우리는 **함수를 재사용할 수 있다**는 것을 알 수 있다.

Functional interface는 위에서처럼 파라미터로 전달하여 사용할 수도 있지만

```java
Validator validator = () -> user1 < user2;
validator.test();
```

이렇게 변수에 직접 넣어서도 사용할 수 있다.

만약 `Stream`를 사용한다면 Functional interface를 자연스럽게 접할 수 있다.

```java
// users 라는 List가 있다고 하자
users.stream()
    .filter(user -> "티거".equals(user))
    // ...
```

`Stream`를 사용할 때 자주 사용하던 `filter`도 Functional interface이다.  `filter`를 사용할 때마다 필요한 조건문을 만들었을 것이다.

## 패키지의 Functional Interface

자바 패키지에서 제공하는 Functional Interface 중에 몇 가지만 알려주려 한다.

### Supplier\<T\>

매개변수 없음, 리턴 타입 T

```java
Supplier<Integer> randomNumber = () -> (int) (Math.random() * 100);
randomNumber.get() // Supplier<T>는 T get() 메서드가 선언되어 있는 인터페이스이다.
```

### Consumer\<T\>

매개변수 T, 리턴 타입 없음,

```java
Consumer<String> print = (name) -> System.out.println(name + "안녕?");
print.accept("필자"); // Consumer<T>는 void accept(T) 메서드가 선언되어 있는 인터페이스이다.
```

### Predicate\<T\>

매개변수 T, 리턴타입 boolean

```java
Predicate<Integer> isEven = (number) -> number % 2 == 0;
isEven.test(10) // Predicate<T>는 boolean test(T) 메서드가 선언되어 있는 인터페이스이다.
    
// Predicate<T>는 and(), or(), negate() 메서드가 있다.
Predicate<Integer> isMultipleOfTwo = (number) -> number % 2 == 0;
Predicate<Integer> isMultipleOfThree = (number) -> number % 3 == 0;

// and()
isMultipleOfTwo.and(isMultipleOfThree).test(12); // (1)Predicate<T>와 (2)Predicate<T>의 and 연산

// or()
isMultipleOfTwo.or(isMultipleOfThree).test(12); // (1)Predicate<T>와 (2)Predicate<T>의 or 연산

// negate()
isMultipleOfTwo.negate().test(12) // Predicate<T>의 !연산
```

### Function<T, R>

매개변수 T, 리턴타입 R

```java
Function<Integer, String> ageToString = (age) -> age + "살 입니다."
ageToString.apply(10); // Function<T, R>는 R apply(T) 메서드가 선언되어 있는 인터페이스이다.

// Function<T, R>는 compose(), andThen() 메서드가 있다.
Function<String, String> hi = (str) -> str + " hi";
Function<String, String> bye = (str) -> str + " bye";

// compose()
hi.compose(bye).apply("tigger") // A.compose(B)일 때 실행 순서는 B -> A이다.
// 결과: "tigger bye hi" 
    
// andthen()
hi.andThen(bye).apply("tigger") // A.andThen(B)일 때 실행 순서는 A -> B이다.
// 결과: "tigger hi bye" 
```

## 마무리

앞서 말한 것 이외에도 Functional Interface를 사용하면 코드가 간결해지고, 가독성이 높아진다. 또한, 함수형 프로그래밍으로 코딩하면 Side Effect(부수효과)를 제거하여 동작을 이해하고 예측하는 것이 쉬워진다. - [함수형 프로그래밍](https://junsday.tistory.com/37)

따라서 Functional Interface를 사용하려고 노력해보지!!

## 참고자료

[Java 8 - Function Interface](https://beomseok95.tistory.com/277)

[자바로 함수형 인터페이스 사용하기](https://jogeum.net/18)