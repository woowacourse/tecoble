---
layout : post
title : "Functional Interface란"
author : "티거"
comment: "true"
tags: ["interface"]
---

Java8부터 함수형 프로그래밍을 지원한다.

함수를 [일급객체]([https://medium.com/@lazysoul/functional-programming-%EC%97%90%EC%84%9C-1%EA%B8%89-%EA%B0%9D%EC%B2%B4%EB%9E%80-ba1aeb048059](https://medium.com/@lazysoul/functional-programming-에서-1급-객체란-ba1aeb048059))처럼 다룰 수 있게 제공되는 **Functional Interface**에 대해 알아볼 것이다.

## Functional Interface란?

> 단 하나의 추상 메서드를 가지는 인터페이스. - [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-9.8)

무슨 말인지 코드로 보여주겠다.

```java
@FunctionalInterface
public interface Operator {
    public int operate(int x, int y);
}
```

이렇게 **메서드를 하나만 가지는 인터페이스**를 **Functional interface**라고 한다.(단, default 메서드 제외)

`@FunctionalInterface`는 무엇일까?

> Functional Interface라는 것을 명시하기 위해 사용한다. @Functional Interface를 사용하면 부적절한 메서드를 추가하거나 다른 인터페이스를 상속받으면 컴파일 에러가 발생한다. - [Java Language Specification](https://docs.oracle.com/javase/specs/jls/se8/html/jls-9.html#jls-9.6.4.9)

## Functional Interface를 왜 사용할까?

> 함수형 개발 방식은 행위에 해당하는 부분도 값으로 취급이 가능해 졌다는 것인데 자바에서 의미하는 기본형의 데이터(Integer 나 String)만 값이 아니라 행위(로직)도 값으로 취급할 수 있게 되었다는 이야기입니다. 이것은 자바가 코드의 재활용 단위가 클래스였던 것이 함수 단위로 재사용이 가능해 지면서 조금 더 개발을 유연하게 할 수 있게 된 점이라고 할 수 있습니다. - [자바로 함수형 인터페이스 사용하기](https://jogeum.net/18)

김필자(가명)는 계산기를 만들려고 한다.

계산기는 "+", "-", "*", "/"에 따라 행위가 다르다.

"Functional Interface", "Stream", "람다" 등 이런 것을 알지도 못했던 시절, 자바 공부를 막 시작한 김필자는 그런 생각을 했었다. "행위를 가지고 있는 값이 있으면 좋겠다. 그러면 Map를 써서 들어본 값에 대한 함수를 실행할 수 있을 텐데..."

결국 김필자는 Functional Interface를 사용하지 않고 극단적으로 구현한다. (x와 y는 항상 0보다 크다고 합시다.😊)

```java
public class Main {

    public static void main(String[] args) {
        int result = calculate("+", 1, 2);
    }

    public static int calculate(String operator, int x, int y) {
        if ("+".equals(operator)){
            x += y;
        }
        if ("-".equals(operator)){
            x -= y;
        }
        if ("*".equals(operator)){
            x *= y;
        }
        if ("/".equals(operator)){
            x /= y;
        }
        return x;
    }
}
```

후에 김필자는 Functional interface를 공부하여 원하는 Map으로 구현하였다.

Functional interface를 만들어 보자.

```java
@FunctionalInterface
public interface Operator {
    int operate(int x, int y);
}
```

그러면 Main class는 이렇게 구현할 수 있다.

```java
import java.util.HashMap;
import java.util.Map;

public class Main {

    public static void main(String[] args) {
        Map<String, Operator> operators = new HashMap<>();
        operators.put("+", (x, y) -> x + y);
        operators.put("-", (x, y) -> x - y);
        operators.put("*", (x, y) -> x * y);
        operators.put("/", (x, y) -> x / y);
        int result2 = operators.get("+").operate(1, 2);
    }
}
```

김필자는 원하던 Map으로 계산기를 구현할 수 있었다.

Functional Interface는 이렇게 변수가 행위를 할 수 있게 해준다.

```java
Operator operator = (x, y) -> 2 * (x + y)
```

필자가 생각하는 **Functional interface를 사용할 때 가장 큰 장점**은 함수형 프로그래밍처럼 **변수를 함수처럼 사용할 수 있는 것**이라고 생각한다.

## 패키지의 Functional Interface

필자가 코딩을 하면서 많이 사용했던 자바 패키지에서 제공하는 Functional Interface의 종류 및 사용방법을 알려주려 한다.

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

필자는 앞서 말한 것 이외에도 Functional Interface를 사용하면 코드가 간결해지고, 가독성이 높아진다. 

또한, 함수형 프로그래밍으로 코딩하면 Side Effect(부수효과)를 제거하여 동작을 이해하고 예측하는 것이 쉬워진다. - [함수형 프로그래밍](https://junsday.tistory.com/37)

따라서 필자는 지향하여 사용하고 있다. 

## 참고자료

[Java 8 - Function Interface](https://beomseok95.tistory.com/277)

[자바로 함수형 인터페이스 사용하기](https://jogeum.net/18)