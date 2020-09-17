---
layout : post
title : "new ArrayList<>() vs Arrays.asList()"
author : "티거"
comment: "true"
tags: ["collection"]
toc: true
---

**List**를 만들때 대부분은 `new ArrayList<>()`와 `Arrays.asList()`를 사용하여 만든다.

그럼 `new ArrayList<>()`와 `Arrays.asList()`의 차이를 알고 사용하고 있는가?

이번 글에서는 두개의 차이점을 알아볼 것이다.

### 1. return type

`new ArrayList<>()`와 `Arrays.asList()`는 다른 클래스다.

```java
import java.util.ArrayList; // new ArrayList<>()
import java.util.Arrays; // Arrays.asList()
```

`new ArrayList<>()`는 **ArrayList**를

`Arrays.asList()`는 **Arrays**의 정적 클래스인 **ArrayList**를 리턴한다.

```java
// Arrays.class
@SafeVarargs
public static <T> List<T> asList(T... a) {
    return new Arrays.ArrayList(a);
}
```

### 2. 원소를 추가/삭제 할 수 있나?

결론부터 말하면 `new ArrayList<>()`는 할 수 있고, `Arrays.asList()` 할 수 없다.

`Arrays.asList()`는 [javadoc](https://docs.oracle.com/javase/7/docs/api/java/util/Arrays.html#asList(T...))에

> Returns a fixed-size list backed by the specified array.
>
> 특정한 배열에 의해 백업된 고정 크기 List로 반환. *(번역 )*

라고 쓰여져 있다.

말 그대로 `Arrays.asList()`는 고정된 List다. List 원소를 **추가** 할 수도, **삭제**할 수도 없다.

만약 add를 시도한다면

```java
List<String> list = Arrays.asList("a", "b", "c");
list.add("d");

Exception in thread "..." java.lang.UnsupportedOperationException
    at ...
    at ...
    ...
```

이런 오류를 확인할 수 있을 것이다.

**하지만!!** 다음과 같은 경우 값을 변경할 수 있다. 아래와 같이 List를 만들었다고 해보자.

```java
String[] str = {"a", "b", "c"};
List<String> list = Arrays.asList(str);
```

1. `set()`를 사용한다.

```java
list.set(1, "d"); // ["a", "d", "c"]
```

2. **String[] str**배열을 변경시킨다.

   > `Arrays.asList()`는 **String[] str**(특정한 배열)를 백업할 때 주소값을 가져온다.
   >
   > 따라서 **String[] str**가 변경되면 **list**도 변경된다. *(new ArrayList<>()를 사용하면 새로운 주소값를 할당)*

```java
str[1] = "d"; // ["a", "d", "c"]
```

만약 원소를 추가/삭제를 하고 싶다면 다음과 같이 변환해주면 된다.

```java
List<String> arrayList = new ArrayList<>(Arrays.asList(list));
```

**ArrayList** 생성자는 **java.util.Arrays.ArrayList**의 상위(super) 클래스인 Collection type도 받아들일 수 있다.

```java
// ArrayList.class 생성자
public ArrayList(Collection<? extends E> c) {
    ...
}
```

### 마무리

필자는 **주로(보통)** `new ArrayList<>()`와 `Arrays.asList()`를 이렇게 사용하고 있다.

1. `new ArrayList<>()` - 컬렉션 생성 시, 새로운 주소값으로 할당하기 위한 용도

   ```java
   public class Lotto {
       private List<LottoNumber> lotto;
       // 설명을 위해 파라미터 List는 inputLotto 라고 하겠다.
       public Lotto(List<LottoNumber> inputLotto) {
           this.lotto = new ArrayList<>(inputLotto);
       }
   }
   ```

   이렇게 `List`를 받을 때 `new ArrayList<>()` 사용한다.

   왜?? `this.lotto = inputLotto;`로 값을 할당하면 무엇이 문제냐???

   파라미터로 들어온 **inputLotto**의 배열이 변경된다면 **Lotto**의 `List<LottoNumber> lotto`도 변경되기 때문이다.

   `this.lotto = new ArrayList<>(inputLotto);`로 할당한다면 주소값이 다르기 때문에 위와 같은 문제가 발생하지 않는다.

2. `Arrays.asList()` - 테스트 케이스 처럼, 요소의 개수가 제한되어 사용되는 경우

   ```java
   @Test
   void Test() {
       List<Car> cars = Arrays.asList(new Car("K2"), new Car("Sonata")); 
       ...
   }
   ```

   `List<Car> cars`를 통해 테스트하려고 한다.

   위와 같은 상황은 한번 배열이 만들어지면 추가나 삭제될 일이 없다.

   이때 `Arrays.asList()`를 사용한다.

   필자는 배열의 **size**가 변하면 안 되거나 변할 필요가 없을 때 `Arrays.asList()`를 사용한다.

글을 읽으면서 `new ArrayList<>()`와 `Arrays.asList()`에 대한 느낌이 생겼을 거라 생각한다.

 이제 `new ArrayList<>()`와 `Arrays.asList()`를 사용할 때 각각의 특징을 생각하며 사용하길 바란다.

---

### 참고

[자바 프로그래머가 자주 실수 하는 10가지 - 1](https://bestalign.github.io/2015/08/31/top-10-mistakes-java-developers-make-1/)