---
layout: post
title: '하나의 테스트 케이스는 단위 기능 중 하나의 시나리오만 테스트하라'
author: [영이]
tags: ['test']
date: '2021-04-26T12:00:00.000Z'
draft: false
image: ../teaser/BigInteger_BigDecimal.png
---

# BigInteger, BigDecimal?

`BigInteger` , `BigDecimal` 은 java.math 패키지 안에 있는 클래스이다. 두 클래스 모두 숫자를 다루는 클래스이다. `BigInteger` 의 경우 정수형으로 표현할 수 있는 값을 다룰때 사용하고 `BigDecimal` 은 소수점이 있는 수를 다룰때 사용한다. 정수를 다루는 `int` , `long` 소수를 다루는 `double` , `float` 이 있음에도 이 두 클래스를 사용하는 경우가 있다.

# BigInteger

`int` 타입은 4Byte로 -2,147,483,648 ~ 2,147,483,647 표현 가능하고 `long` 타입은 8Byte로 -9,223,372,036,854,775,808 ~ 9,223,372,036,854,775,807 표현 가능 하다.`long` 으로 일상생활에서 사용하는 거의 모든 값들을 표현할 수 있지만 프로그래머라면 혹시라도 모를 상황에 대비를 해야한다. 혹시 모를 상황에 대비하기 위해 사용할 수 있는 것이 `BigInteger` 이다. `BigInteger` 는 무한한 크기의 정수형을 다루기 위한 것이다. 보통 돈이나 정밀한 연산이 필요한 경우 사용하게 된다. 수를 다루는 클래스이지만 `int` , `long` 타입에서 사용하는 사칙연산(+, -, x, /)을 할 수 없다.

### 생성

`BigInteger` 생성하기 위한 방법은 여러가지가 있다.

```java
// 문자열로 생성
BigInteger bigInteger = new BigInteger("123456");

//n진수 문자열로 생성
BigInteger bigInteger = new BigInteger("FFFF", 16);

//valueOf 생성
BigInteger bigInteger = BigInteger.valueOf(1234567);
```

여러가지의 방법이 있지만 `int` `long` 으로 다룰수 없는 수를 다루는 것이기 때문에 문자열로 생성하는 것이 일반적이다.

### 연산

다른 숫자를 다루는 클래스들과 마찬가지로 `BigInteger` 클래스도 연산 기능을 제공해준다. 사칙연산을 직접적으로 할 수 없기 때문에 연산을 하려면 내장 메서드를 통하여 해야한다. 메서드에는 `add` `substract` `multiply` `divide` `compareTo` 가 있다

```java
BigInteger bigNumber1 = new BigInteger("100000");
BigInteger bigNumber2 = new BigInteger("10000");

System.out.println("덧셈(+) :" +bigNumber1.add(bigNumber2));
System.out.println("뺄셈(-) :" +bigNumber1.subtract(bigNumber2));
System.out.println("곱셈(*) :" +bigNumber1.multiply(bigNumber2));
System.out.println("나눗셈(/) :" +bigNumber1.divide(bigNumber2));
System.out.println("나머지(%) :" +bigNumber1.remainder(bigNumber2));
```

두 수를 비교하는 `compareTo` 를 활용하면 두 수를 비교할 수있다. 같으면 0 다르면 -1을 반환한다.

```java
//두 수 비교
int compare = bigNumber1.compareTo(bigNumber2);
```

### BigInteger 형 변환

원하는 타입으로도 바꿀 수 있다. `int` `long` 뿐만 아니라 `float` `double` `String` 형으로도 변환할 수 있다.

```java
BigInteger bigNumber = BigInteger.valueOf(100000); //int -> BigIntger

int int_bigNum = bigNumber.intValue(); //BigIntger -> int
long long_bigNum = bigNumber.longValue(); //BigIntger -> long
float float_bigNum = bigNumber.floatValue(); //BigIntger -> float
double double_bigNum = bigNumber.doubleValue(); //BigIntger -> double
String String_bigNum = bigNumber.toString(); //BigIntger -> String
```

# BigDecimal

`BigDecimal` 은 앞서본 `BigInteger` 와 매우 비슷한 형태를 보여주고 있다. 가장 큰 차이점으로는 실수를 다루는 것이다. `double` 이나 `float` 으로 표현하던 소수를 좀 더 정밀하게 다루기 위하여 사용한다. `double` `float` 을 사용해본 사람이라면 아주 간단한 연산에서 조차 원하는 값이 나오지 않는 경험을 해보았을 것이다. 이러한 문제점을 해결하기 위하여 사용하는 것이 `BigDecimal`이다. 미세한 값을 사용하거나 돈등 값의 오차가 발생하면 안되는 경우 `BigDecimal`을 사용하는 것이 좋다. 계산 속도는 double , float을 사용하는 경우보다 조금 느리지만 정밀한 결과를 보장한다.

### BigDecimal의 생성

`BigInteger` 와 마찬가지로 생성하기 위한 방법은 여러가지가 있다.

```java
// 문자열로 생성
BigDecimal bigDecimal = new BigDecimal("123.45678");

//double 타입으로 생성
BigDecimal bigDecimal = new BigDecimal(123.456);

//int, long 타입으로 생성
BigDecimal bigDecimal = new BigDecimal(123456);

//valueOf 생성
BigDecimal bigDecimal = BigDecimal.valueOf(123456);

```

`BigInteger` 와 다르게 double 이나 int, long 타입으로도 생성할 수 있는데 주의해야할 점이 있다. `double` 타입의 값을 매개변수로 가지는 생성자를 사용하면 오차가 발생할 수 있다. 위와 마찬가지로 `BigDecimal` 도 문자열로 표현하는 것이 일반적이다.

### BigDecimal의 연산

`BigDecimal` 도 마찬가지로 직접적인 연산을 할 수 없다. 대신 내장되어 있는 메소드를 통하여 사칙연산을 할 수 있다. 메서드에는 `add` `substract` `multiply` `divide` `compareTo` 가 있다.

```java
BigDecimal bigNumber1 = new BigDecimal("100000.12345");
BigDecimal bigNumber2 = new BigDecimal("10000");

System.out.println("덧셈(+) :" +bigNumber1.add(bigNumber2));
System.out.println("뺄셈(-) :" +bigNumber1.subtract(bigNumber2));
System.out.println("곱셈(*) :" +bigNumber1.multiply(bigNumber2));
System.out.println("나눗셈(/) :" +bigNumber1.divide(bigNumber2));
System.out.println("나머지(%) :" +bigNumber1.remainder(bigNumber2));
```

두 수를 비교하는 `compareTo` 는 마찬가지로 같으면 0 다르면 -1 을 반환한다.

```java
BigDecimal bigNumber1 = new BigDecimal("100000.12345");
BigDecimal bigNumber2 = new BigDecimal("1000000.6789");

int compare = bigNumber1.compareTo(bigNumber2); //-1
```

### BigDecimal의 형 변환

`BigDecimal` 도 원하는 타입으로 변경할 수 있다. `BigInteger` 와 마찬가지로 `int`, `long` , `float`, `double` ,`String` 으로 변환할 수 있다.

```java
BigDecimal bigDecimal = BigDecimal.valueOf(100000.12345); //double -> BigDecimal

int int_bigNum = bigDecimal.intValue(); //BigDecimal -> int
long long_bigNum = bigDecimal.longValue(); //BigDecimal -> long
float float_bigNum = bigDecimal.floatValue(); //BigDecimal -> float
double double_bigNum = bigDecimal.doubleValue(); //BigDecimal -> double
String String_bigNum = bigDecimal.toString(); //BigDecimal -> String
```

# 참고

- [https://www.baeldung.com/java-bigdecimal-biginteger](https://www.baeldung.com/java-bigdecimal-biginteger)
