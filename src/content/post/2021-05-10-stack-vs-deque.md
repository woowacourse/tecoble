---
layout: post
title: 'Java 의 Stack 대신 Deque'
author: [와일더]
tags: ['stack-vs-deque', 'stack', 'deque']
date: '2021-05-10T12:00:00.000Z'
draft: false
image: ../teaser/stack_vs_deque.jpg
---

# (Java) Stack 대신 Deque 🤹‍♀️

자바에서 자료구조 Stack 을 대신해서 사용하는 Deque 에 대해서 알아보자. 이 글은 기능을 사용하는 방식이 아닌 '왜 Stack 대신 Deque 를 사용해야 하는가?'에 대해서 설명한다.

## Stack

후입선출(LIFO) 자료구조를 구현한 자바의 클래스다. 자바의 Stack 은 List Collection 의 Vector 를 상속받은 스택 메모리 구조의 클래스를 제공한다. 배열 기반 데이터 구조로 인덱스로 요소에 액세스 할 수 있다.

## Queue

선입선출(FIFO) 자료구조를 구현한 자바의 인터페이스다.

## Deque

Queue 인터페이스를 확장한 인터페이스다. 자료의 입출력을 양 끝에서 할 수 있다. 인덱스로 요소에 액세스, 삽입, 제거를 허용하지 않는다.

## Stack vs Deque

공식 문서는 이렇게 말하고 있다.

> 더욱 완전하고 일관된 LIFO 스택 작업은 Deque 인터페이스 및 해당 구현을 사용하여 구현하는 것이다.

즉, Stack 대신 Deque 의 구현체인 ArrayDeque 사용을 제안하고 있다. Java 에서 Stack 은 Thread Safe 하기 위해서 만들어졌지만 단순한 Iterator 의 탐색 작업에서도 get() 메서드 실행 시 계속해서 한 번만 걸어주면 될 lock 을 매번 걸고 닫음으로 쓸데없는 오버헤드가 발생한다. 따라서 Vector 를 상속받은 Stack 은 특정 상황에서 효율적이지 않기 때문에 Thread Safe 않다고 할 수 있다. 그리고 다음과 같은 단점이 존재한다.

- 초기 용량 설정을 지원하지 않는다.
- 모든 작업에 Lock 이 사용된다.
  - 단일 스레드 실행 성능이 저하 될 수 있다.
  - 매번 Lock 이 발생하게 되므로 오버헤드가 커진다.
- Stack 은 Vector 상속 받았기 때문에 다중 상속을 지원하지 않는다.

Deque 인터페이스를 사용하면 필요한 모든 스택 작업을 제공하기 때문에 편리하다. 또한, 작업에 Lock 을 사용하지 않기 때문에 단일 스레드에서도 문제가 발생하지 않는다. 다만, 다중 스레드 실행의 경우 문제가 될 수 있지만 ArrayDeque 에 대한 동기화 데코레이터를 구현할 수 있다. 이는 JCF 의 Stack 클래스와 유사하게 수행되지만, Stack 클래스의 초기 용량 설정 부족 문제를 해결했다.

## 스레드 안정성

데이터 구조가 Thread Safe 하지 않은 경우 동시에 액세스하면 경쟁 조건이 발생할 수 있다. 아래 예시를 통해 살펴보자.

- 첫 번째 쓰레드가 코드 A 를 실행한다.
- 두 번째 쓰레드가 코드 A 를 실행한다. 두 스레드 모두 같은 object 가 담긴다.
- 첫 번째 쓰레드가 코드 B 를 실행한다.
- 두 번째 쓰레드가 코드 B 를 실행한다. 실제 적용되는 것은 인덱스가 총 2 번 바뀐다.
- 첫 번째 쓰레드가 코드 C 를 실행한다.
- 첫 번째 쓰레드가 코드 C 를 실행한다. 두 스레드 모두 같은 object 가 반환된다.

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

각각 메서드를 실행할 때마다 다른 값이 반환되어야 하지만 위와 같이 동일한 객체가 반환되는 문제가 발생하는 것을 알 수 있다. 이러한 경합 상태를 피해기 위해서 코드 B에서 인덱스 재설정을 완료할 때까지 코드 A 를 실행하지 않아야 한다.

## 결론

멀티스레드 환경과 상관없이 자바에서의 Stack 은 대부분의 조건에서 성능 저하를 일으키기 때문에 사용을 지양한다. 대신에 Deque 의 구현체를 사용한다. 메모리 소모량이 적을 때는 iterate 효율이 좋은 ArrayDeque 를 사용하고 스택의 사이즈가 커질 때는 LinkedList 를 사용한다. 또한, 멀티스레드 환경에서는 각각 LinkedBlockingDeque 와 ConcurrentLinkedDeque 를 사용하면 된다.

## 참고

- [Java 7 Stack 오라클 문서](https://docs.oracle.com/javase/7/docs/api/java/util/Stack.html)

- [Java 7 Deque 오라클 문서](https://docs.oracle.com/javase/7/docs/api/java/util/Deque.html)

- [[Java] 자료구조 & 입력 API](https://machine-geon.tistory.com/71)

- [Thread Safe LIFO Data](https://www.baeldung.com/java-lifo-thread-safe)

- [자바 Deque 대 스택](https://recordsoflife.tistory.com/222)

- [자바에서 Vector 와 Stack 컬렉션이 사용되지 않는 이유](https://aahc.tistory.com/8)

- 자바의 정석 3rd Edition
