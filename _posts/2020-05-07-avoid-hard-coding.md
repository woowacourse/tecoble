---
layout: post
title: "하드코딩을 피해라."
author: "둔덩"
comment: "true"
tags: ["hard-coding", "clean-code"]
toc: true
---

안 좋은 코딩 습관을 얘기할 때면 꼭 언급되는 것이 하드코딩이다.

선배 개발자들은 하드코딩을 피하며 코딩하는 것이 당연하지만,  
초보 개발자들은 하드코딩이 뭔지, 왜 하면 안 되는 것인지 모르는 경우가 대부분이다.

---

## 하드코딩이란?

> 프로그램의 소스 코드에 데이터를 직접 입력해서 저장하는 것  
> 주로 파일 경로, URL 또는 IP 주소, 비밀번호, 화면에 출력될 문자열 등이 대상이 된다.

```java
File file = new File("D:/Eclipse/Java/Output.txt");
```

위와 같이 파일의 경로를 직접 넣어준 경우 하드코딩에 해당한다.

```java
public void move(int randomNumber) {
    if (randomNumber > 4) {
        this.position++;
    }
}
```

매직 넘버(소스 코드에 직접 입력이 된 특정한 숫자)를 사용한 4의 경우도 하드코딩에 해당한다.

이러한 경우들 외에도 어떤 프로젝트 코드 내에 하드코딩 되어있는 숫자 혹은 문자열을 쉽게 발견할 수 있다.

---

## 하드코딩의 문제점 및 상수 활용

이 글에서 다룰 하드코딩의 문제점은 다음과 같다.

1.  의미를 파악하기 어렵다.
2.  유지 보수하기 어렵다.

### 의미를 파악하기 어렵다.

다음과 같이 `Car` 클래스가 있다.

```java
public class Car {
    private final String name;
    private int position;

    public Car(int position) {
        this("orange", position);
    }

    public Car(String name) {
        this(name, 0);
    }

    public Car(String name, int position) {
        this.name = name;
        this.position = position;
    }
}
```

해당 클래스에서 선언된 두 개의 생성자를 살펴보자.

```java
public Car(int position) {
    this("orange", position);
}

public Car(String name) {
    this(name, 0);
}
```

두 개의 생성자가 무엇을 의미하는지 바로 알 수 있는가?

이처럼 하드코딩을 한 코드는 가독성이 안좋은 코드가 될 확률이 높다.

```java
public class Car {
    private static final String DEFAULT_NAME = "orange";
    private static final int DEFAULT_POSITION = 0;

    private final String name;
    private int position;

    public Car(int position) {
        this(DEFAULT_NAME, position);
    }

    public Car(String name) {
        this(name, DEFAULT_POSITION);
    }

    public Car(String name, int position) {
        this.name = name;
        this.position = position;
    }
}
```

위와 같이 상수를 활용한다면 `Car` 클래스의 "orange"와 0이 default name, default position이라는 의미를 명확히 전달할 수 있다.  
자연스럽게 가독성 좋은 코드가 된다.

### 유지 보수하기 어렵다.

**12**개월 할부밖에 안 되는 신용카드의 할부 계산 프로그램을 만든다고 가정하고  
코드를 아래와 같이 작성했다.

```java
/* 월 원금을 구하는 메서드 */
public static double calculateMonthlyPrincipal(int principal) {
    return principal / 12;
}

/* 월 이자를 구하는 메서드 */
public static double calculateMonthlyInterest(int principal) {
    return principal * 0.1 / 12;
}
...
```

예시로 보여준 메서드들 외에도 총 이자를 구하는 메서드 등  
할부 개월 수인 **12**를 사용하는 코드들이 매우 많을 것이다.

만약 할부가 10개월밖에 안되는 걸로 요구사항이 변경됐다면 어떻게 될까?

위의 예제처럼 매직 넘버로 하드코딩을 했다면,

12를 사용하는 모든 곳을 일일이 10으로 수정하는 번거로운 작업을 해야하고  
만약 한 군데라도 수정하지 않았다면 잘못된 값이 계산될 것이다.

이처럼 하드코딩을 하게되면 변화에 대응하기 어려운 코드  
즉, 유지 보수하기 어려운 코드가 된다.

```java
private static final int INSTALLMENT_MONTHS = 12;
private static final double INTEREST_RATE = 0.1;

/* 월 원금을 구하는 메서드 */
public double calculateMonthlyPrincipal() {
    return this.principal / INSTALLMENT_MONTHS;
}

/* 월 이자를 구하는 메서드 */
public double calculateMonthlyInterest() {
    return this.principal * INTEREST_RATE / INSTALLMENT_MONTHS;
}
```

위와 같이 상수를 활용하여 코딩했다면,  
할부 개월을 의미하는 상수인 `INSTALLMENT_MONTHS` 값을 10으로 변경하는 것만으로 변화에 대응할 수 있다.

---

## 결론

의미가 명확한 코드, 가독성 좋은 코드, 유지 보수하기 좋은 코드를 작성하기 위해  
하드코딩을 하기보다는 상수를 활용하자.

하지만, 이 글에서 다룬 하드코딩의 문제점 외에도 보안에 취약한 문제점 등  
여러 가지 해석에 의한 다양한 문제점들이 존재한다.

또, 상수를 활용하는 방법 외에도 연관된 상수를 ENUM으로 관리하거나 외부에 데이터를 저장하는 등  
하드코딩을 피하는 여러 가지 방법이 존재한다.

**하드코딩이 무조건 안좋다는 것은 아니다.**  
하나의 예시로 원주율인 3.141592...는 값이 변경될 일이 없고 매직 넘버로 사용해도 의미가 명확하다.

하드코딩의 정확한 기준, 하드코딩의 문제점, 하드코딩을 피해야 하는지에 대한 100% 정답은 없다.

현재 소스 코드에서 어느 방법이 최선의 방법인지 항상 고민하는 습관을 지니자.

---

#### 참고 자료

[What is magic number, and why is it bad? - stack overflow](https://stackoverflow.com/questions/47882/what-is-a-magic-number-and-why-is-it-bad)  
[magic number 사용을 최대한 자제하자 - SLIPP(자바지기)](https://www.slipp.net/questions/356)
