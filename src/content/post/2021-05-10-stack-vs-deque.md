---
layout: post
title: 'Java 의 Stack 대신 Deque'
author: [3기_와일더]
tags: ['java', 'stack', 'deque']
date: '2021-05-10T12:00:00.000Z'
draft: false
image: ../teaser/stack_vs_deque.jpg
source: https://www.campingdelaplagebenodet.com/237-actualites/3019-fred-magic-spectacle-magie-loctudy.html
---

## 🤹‍♀️

자바에서 자료구조 Stack 을 대신해서 사용하는 Deque 에 대해서 알아보자. 이 글은 기능을 사용하는 방식이 아닌 '왜 Stack 대신 Deque 를 사용해야 하는가?'에 대해서 설명한다.

## Stack

후입선출(Last In First Out, 나중에 들어간 값이 먼저 나온다) 자료구조를 구현한 자바의 클래스다. 자바의 Stack 은 List Collection 의 Vector 를 상속받은 스택 메모리 구조의 클래스를 제공한다. 배열 기반 데이터 구조로 인덱스로 요소에 액세스 할 수 있다.

```java
public class Application {
    public static void main(String[] args) {
        Stack<String> stack = new Stack<>();
        stack.push("첫 번째 요소");
        stack.push("두 번째 요소");
        System.out.println(stack.pop());
    }
}   
// 실행 결과
// > Task :Application.main()
// 두 번째 요소
```

## Queue

선입선출(First In First Out, 먼저 들어간 값이 먼저 나온다) 자료구조를 구현한 자바의 인터페이스다. 인덱스로 요소에 접근이 불가능하다.

## Deque

Queue 인터페이스를 확장한 인터페이스다. 자료의 입출력을 양 끝에서 할 수 있다. 인덱스로 요소에 액세스, 삽입, 제거를 허용하지 않는다.

```java
public class Application {
    public static void main(String[] args) {
        Deque<String> deque = new ArrayDeque<>();
        deque.addFirst("첫 번째 요소"); // "첫 번째 요소"
        deque.add("두 번째 요소"); // "첫 번째 요소", "두 번째 요소"
        deque.push("세 번째 요소"); // "세 번째 요소", "첫 번째 요소", "두 번째 요소"
        System.out.println(deque.pop());
        System.out.println(deque.pop());
    }
}
// 실행 결과
// > Task :Application.main()
// 세 번째 요소
// 첫 번째 요소
```

## Stack vs Deque

공식 문서는 이렇게 말하고 있다.

> 더욱 완전하고 일관된 LIFO 스택 작업은 Deque 인터페이스 및 해당 구현을 사용하여 구현하는 것이다.

즉, Stack 대신 Deque 의 구현체인 ArrayDeque 사용을 제안하고 있다. Java 에서 Vector 는 특정 상황에서 효율적이지 않기 때문에 Thread Safe 않다고 할 수 있다. 그렇기 때문에 Vector 를 상속받은 Stack 은 다음과 같은 단점이 존재한다.

- 초기 용량 설정을 지원하지 않는다.
- 모든 작업에 Lock 이 사용된다.
  - 단일 스레드 실행 성능이 저하 될 수 있다.
  - 단순한 Iterator 의 탐색 작업에서도 get() 메서드 실행 시 매번 Lock 이 발생하게 되므로 오버헤드가 커진다.
- Stack 은 Vector 상속받았기 때문에 다중 상속을 지원하지 않는다.

Deque 인터페이스를 사용하면 필요한 모든 스택 작업을 제공하기 때문에 편리하다. 또한, 작업에 Lock 을 사용하지 않기 때문에 단일 스레드에서도 문제가 발생하지 않는다. 다만, 다중 스레드 실행의 경우 문제가 될 수 있지만 ArrayDeque 에 대한 동기화 데코레이터를 구현할 수 있다. 데코레이터는 메서드가 실행되기 전에 먼저 실행되는 메서드를 말하는데 이에 대한 예시를 다루기에는 내용이 방대해지므로 궁금하다면 [여기](https://effectiveprogramming.tistory.com/entry/Decorator-%ED%8C%A8%ED%84%B4synchronizedList%EC%9D%98-%EA%B5%AC%ED%98%84-%ED%8C%A8%ED%84%B4)에서 확인해보면 된다. 이는 JCF 의 Stack 클래스와 유사하게 수행되지만, Stack 클래스의 초기 용량 설정 부족 문제를 해결했다. Stack 은 초기 용량을 설정할 수 있는 생성자가 없기 때문에 데이터의 삽입이 많아지면 배열을 복사하는 상황이 빈번하게 발생한다. ArrayDeque 은 생성자로 배열의 초기 크기를 지정할 수 있고 용량이 초과하면 기존 용량의 2배로 늘려주거나 줄여주는 로직이 존재한다.

## 스레드 안정성

데이터 구조가 Thread Safe 하지 않은 경우 동시에 액세스하면 경쟁 조건이 발생할 수 있다. 아래 예시를 통해 살펴보자.

- 첫 번째 스레드가 코드 A 를 실행한다.
- 두 번째 스레드가 코드 A 를 실행한다. 두 스레드 모두 같은 object 가 담긴다.
- 첫 번째 스레드가 코드 B 를 실행한다.
- 두 번째 스레드가 코드 B 를 실행한다. 실제 적용되는 것은 인덱스가 총 2 번 바뀐다.
- 첫 번째 스레드가 코드 C 를 실행한다.
- 첫 번째 스레드가 코드 C 를 실행한다. 두 스레드 모두 같은 object 가 반환된다.

```java
public class MyDeque {
    transient Object[] elements;
    transient int head;
    transient int length;

    public Object pollFirst() {
        Object object = elements[head]; // 코드 A
        if (object != null) {
            elements[head] = null;
            head = head + 1; // 코드 B
            length = length - 1;
        }
        return object; // 코드 C
    }
}

```

각각 메서드를 실행할 때마다 다른 값이 반환되어야 하지만 위와 같이 동일한 객체가 반환되는 문제가 발생하는 것을 알 수 있다. 이러한 경합 상태를 피하기 위해서 코드 B에서 인덱스 재설정을 완료할 때까지 코드 A 를 실행하지 않아야 한다.

## 어떤 구현체를 사용할까?

멀티스레드 환경과 상관없이 자바에서의 Stack 은 대부분의 조건에서 성능 저하를 일으키기 때문에 사용을 지양한다. 대신에 Deque 의 구현체를 사용한다. 일반적으로 사용하는 Deque 의 구현체는 <b>ArrayDeque</b> 과 <b>LinkedList</b> 가 있다. 둘의 차이점을 살펴보자.

- ArrayDeque 은 Deque 인터페이스의 구현체이며 크기가 재설정을 할 수 있다.
- LinkedList 는 List 의 구현체다.
- LinkedList 는 null 요소를 추가할 수 있지만 ArrayDeque 은 불가능하다.
- LinkedList 는 반복중에 현재 요소를 제거하는 것이 효율적이고, ArrayDeque 은 양쪽 끝에서 추가, 제거가 효율적이다.
- LinkedList 는 ArrayDeque 보다 더 많은 메모리를 소모한다.
- 메모리 소모량이 적을 때는 iterate 효율이 좋은 ArrayDeque 를 사용하고 스택의 사이즈가 커지거나 심한 변동이 예상될 때는 즉각적인 메모리 공간 확보를 위해 LinkedList 를 사용한다. 

## 멀티스레드 환경

멀티스레드 환경에서는 스레드로부터 안전한 Deque 을 사용해야 한다. 이 경우에는 각각 <b>LinkedBlockingDeque</b> 와 <b>ConcurrentLinkedDeque</b> 를 사용하면 된다. 둘은 Thread-Safe 하다는 공통점이 있지만, 동시 잠금 동작 측면에서 차이점이 있다. <b>LinkedBlockingDeque</b>는 잠금 메커니즘을 사용하여 한 번에 단일 스레드에서만 데이터를 작동할 수 있도록 할 때 사용한다. <b>ConcurrentLinkedDeque</b>는 각각의 스레드가 공유 데이터에 액세스 할 수 있도록 할 때 사용한다. 또한 데이터를 작동할 때 성능에 영향을 미칠 수 있다는 차이점이 있다. 

## 결론

대부분의 상황에서는 Deque 을 사용할 때 LinkedList 보다는 ArrayDeque 을 사용하면 된다. 또한 멀티스레드 환경에서 단일스레드를 사용할 계획이라면 <b>LinkedBlockingDeque</b>를 사용하고 멀티스레드를 사용할 계획이라면 <b>ConcurrentLinkedDeque</b>를 사용하면 된다.

## 참고

- [Java 7 Stack 오라클 문서](https://docs.oracle.com/javase/7/docs/api/java/util/Stack.html)
- [Java 7 Deque 오라클 문서](https://docs.oracle.com/javase/7/docs/api/java/util/Deque.html)
- [[Java] 자료구조 & 입력 API](https://machine-geon.tistory.com/71)
- [Thread Safe LIFO Data](https://www.baeldung.com/java-lifo-thread-safe)
- [자바 Deque 대 스택](https://recordsoflife.tistory.com/222)
- [자바에서 Vector 와 Stack 컬렉션이 사용되지 않는 이유](https://aahc.tistory.com/8)
- [ConcurrentLinkedDeque vs LinkedBlockingDeque](https://stackoverflow.com/questions/19179046/concurrentlinkeddeque-vs-linkedblockingdeque)
- [Decorator 패턴(synchronizedList의 구현 패턴)](https://effectiveprogramming.tistory.com/entry/Decorator-%ED%8C%A8%ED%84%B4synchronizedList%EC%9D%98-%EA%B5%AC%ED%98%84-%ED%8C%A8%ED%84%B4)
- [ArrayDeque 의 초기 용량 설정](https://junghyungil.tistory.com/116)
- 자바의 정석 3rd Edition
