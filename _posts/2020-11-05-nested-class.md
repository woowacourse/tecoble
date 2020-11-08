---
layout: post
title: 정적, 비정적 내부 클래스 알고 사용하기
author: "비밥"
comment: "true"
tags: ["java"]
toc: true

---

자바의 중첩 클래스(Nested Class)에는 여러 가지 종류가 있는데 그중 정적 내부 클래스와 비정적 내부 클래스에 대해 다뤄보고자 한다.

글에서 사용된 코드는 [Github](https://github.com/pci2676/post-for-blog/tree/master/javable/nested-class)에서 확인할 수 있다.

## 중첩 클래스란

정적, 비정적 내부 클래스에 대해 다루기 전에 중첩 클래스가 생소할 수 있기 때문에 먼저 중첩 클래스에 대해 설명을 하고자 한다.

중첩 클래스는 말 그대로 다른 클래스의 내부에 존재하는 클래스를 의미한다.

중첩 클래스는 특정 클래스가 한 곳(다른 클래스)에서만 사용될 때 논리적으로 군집화하기 위해 사용한다. 이로 인해 불필요한 노출을 줄이면서 캡슐화를 할 수 있고 조금 더 읽기 쉽고 유지 보수하기 좋은 코드를 작성하게 된다.

## 정적, 비정적

### 선언

정적 내부 클래스와 비정적 내부 클래스를 나누는 기준은 이름에서도 알 수 있듯 `static` 예약어가 클래스에 같이 작성되어 있는지로 판단할 수 있다.

```java
class A{
    private int a;
  
    static class B{
    	    private int b;  
    }
}
```

위와 같은 형태의 클래스에서 `B`는 정적 내부 클래스이고

```java
class A{
    private int a;
  
    class B{
  	      private int b;  
    }
}
```

 위와 같은 형태의 클래스에서 `B`는 비정적 내부 클래스이다.

### 생성

`static` 의 존재 여부에 따라 해당 내부 클래스를 생성하는 방식이 달라진다.

먼저 정적 내부 클래스의 경우 다음과 같이 객체를 생성할 수 있다.

```java
void foo(){
    A.B b = new B();
}
```

`static` 예약어가 있음으로 인해 독립적으로 생성할 수 있다. 하지만 비정적 내부 클래스인 경우에는 다음과 같이 생성해야 한다.

```java
void foo(){
    A a = new A();
    A.B b = a.new B();
}
//or
void foo(){
    A.B b = new A().new B();
}
```

비정적 내부 클래스를 생성하는 경우에는 반드시 `A`객체를 생성한 뒤 객체를 이용해서 생성해야 한다. 즉, 비정적 내부 클래스는 바깥 클래스(이 경우 `A`)에 대한 참조가 필요하다는 것이다.

### 참조

실제로 `javap -p` 명령어를 이용해서 비정적 내부 클래스를 Disassemble 해서 확인해보면 비정적 내부 클래스가 바깥 클래스에 대한 참조 값을 가지고 있는 것을 확인할 수 있다.

글로만 보면 잘 와닿지 않을 독자를 위해 코드로 확인해보자.

바깥 클래스에 정적, 비정적 내부 클래스를 작성하였다.

```java
package com.javabom.nested;

public class Outer {
    private int out;

    public static class StaticInner {
        private int in;
    }

    public class NonStaticInner {
        private int in;
    }
}
```

먼저 정적 내부 클래스인 `StaticInner` 를 확인해 보자.

위 클래스를 컴파일해서 class 파일로 변환한 뒤 다음 명령어를 입력해서 Disassembler 결과를 보도록 하자. 

```
javap -p build/classes/java/main/com/javabom/nested/Outer\$StaticInner.class
```

![image](https://user-images.githubusercontent.com/13347548/98099124-88156100-1ed2-11eb-81ca-9732944c7b76.png)

멤버변수인 `in`과 기본생성자에 대한 참조를 가지고 있는 것을 확인 할 수 있다.

이번에는 비정적 내부 클래스인 `NonStaticInner` 를 확인해 보자.

```
javap -p build/classes/java/main/com/javabom/nested/Outer\$NonStaticInner.class
```

![image](https://user-images.githubusercontent.com/13347548/98099436-e9d5cb00-1ed2-11eb-9a9b-605139fdcc72.png)

비정적 내부 클래스의 경우 멤버변수, 기본 생성자를 비롯한 바깥 클래스인 `Outer`를 참조하고 있는 것을 확인 할 수 있다.

### 메모리 누수 가능성

비정적 내부 클래스의 경우 바깥 클래스에 대한 참조를 가지고 있기 때문에 메모리 누수가 발생할 여지가 있다. 바깥 클래스는 더 이상 사용되지 않지만 **내부 클래스의 참조로 인해 GC가 수거하지 못해서 바깥 클래스의 메모리 해제를 하지 못하는 경우가 발생**할 수 있다.

메모리 누수가 발생하는 것은 VisualVm을 이용해서 확인해 보도록 하겠다.

#### 정적 내부 클래스

정적 내부 클래스의 경우 바깥 클래스에 대한 참조 값을 가지고 있지 않기 때문에 메모리 누수가 발생하지 않는다. 아래와 같은 코드를 작성하고 실행을 하겠다.

```java
public class StaticInnerMain {
    public static void main(String[] args) throws IOException {
        Outer.StaticInner staticInner = getStaticInner();

        System.gc();
        System.out.println("GC 동작 완료");

        System.in.read(); // VisualVm HeapDump 시점

        System.out.println(staticInner);
    }

    private static Outer.StaticInner getStaticInner() {
        return new Outer.StaticInner();
    }
}
```

`System.in.read()` 에서 멈춰있는 동안 VisualVm을 이용해서 Heap Dump를 떠서 메모리 할당 상태를 확인해 보면 다음과 같다.

![image](https://user-images.githubusercontent.com/13347548/98103994-30c6bf00-1ed9-11eb-9dc3-2b579dde4059.png)

`getStaticInner()` 메서드에서 `new Outer()`를 이용해서 `Outer` 객체를 생성했지만 메서드를 벗어난 뒤 `System.gc()` 를 실행할 때 더 이상 `Outer`를 참조하는 객체가 없기 때문에 GC에 의해 정상적으로 수거되어 메모리가 할당 해제된 것을 확인할 수 있다.

#### 비정적 내부 클래스

비정적 내부 클래스도 동일한 코드로 실행하도록 하겠다. 달라진 부분은 `getNonStaticInner()`로 비정적 내부 클래스를 반환한다.

```java
public class NonStaticInnerMain {
    public static void main(String[] args) throws IOException {
        Outer.NonStaticInner nonStaticInner = getNonStaticInner();

        System.gc();
        System.out.println("GC 동작 완료");

        System.in.read();

        System.out.println(nonStaticInner); // VisualVm HeapDump 시점
    }

    private static Outer.NonStaticInner getNonStaticInner() {
        return new Outer().new NonStaticInner();
    }
}
```

동일한 시점에 Heap Dump를 떠서 메모리 할당 상태를 확인해 보면 다음과 같다.

![image](https://user-images.githubusercontent.com/13347548/98104466-d5490100-1ed9-11eb-9cbb-4ae29d5a1b39.png)

바깥 클래스인 `Outer` 객체의 메모리가 GC를 했음에도 해제되지 않음을 확인할 수 있다. 따라서 Outer 객체를 더 이상 사용하지도 않는 상황임에도 메모리가 남아있는 메모리 누수가 발생한다는 것을 확인 할 수 있다.

### 사용시기

메모리 누수가 발생할 수 있는 문제점이 있기 때문에 만약 **내부 클래스가 독립적으로 사용된다면 정적 클래스로 선언**하여 사용하는 것이 좋다. 바깥 클래스에 대한 참조를 가지지 않아 메모리 누수가 발생하지 않기 때문이다.

**비정적 클래스를 어댑터 패턴을 이용하여 바깥 클래스를 다른 클래스로 제공**할 때 사용하면 좋다. 이러한 케이스로 `HashMap`의 `keySet()` 이 있다. `keySet()` 을 사용하면 `Map`의 key에 해당하는 값들을 `Set`으로 반환해 주는 데 어댑터 패턴을 이용해서 `Map`을 `Set`으로 제공한다.

![image](https://user-images.githubusercontent.com/13347548/98108999-370c6980-1ee0-11eb-8478-ed6a87ee7c34.png)

#### 비정적 내부 클래스를 일반 클래스로 생성하면 안되는가?

위의 경우에 필자는 그럴 필요가 없다고 본다.

어댑터 패턴을 이용하는 경우 비정적 내부 클래스는 내부 클래스가 바깥 클래스 밖에서 사용되지 않는다. 내부에서는 `KeySet`이라는 객체로 생성되었지만 반환될 때는 `Set`으로 반환되기 때문에 `KeySet`이 직접적으로 노출이 되지 않는다. 따라서 일반 클래스 만들어서 사용하게 된다면 이는 논리적으로 군집화를 하지 않는 것이고 캡슐화를 해치게 된다고 볼 수 있다.

그리고 `keySet()`으로 반환된 `Set`은 `Map`에 새로운 `Entry`가 추가될 때 동기화된다. 하지만 일반 클래스로 이를 만든다면 그러한 의도를 가지고 구현을 해야 하고 사용하는 사람은 동기화가 된다고 파악하기도 힘들어진다.

## 정리

1. 내부 클래스가 독립적으로 사용된다면 `static` 을 이용해서 정적으로 만들자.
2. 비정적 내부 클래스는 메모리 누수를 고려해야한다.