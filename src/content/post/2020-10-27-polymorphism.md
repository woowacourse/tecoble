---
layout: post
title: 다형성(Polymorphism)이란?
author: [보스독]
tags: ['java', 'OOP']
date: "2020-10-27T12:00:00.000Z"
draft: false
image: ../teaser/polymorphism.jpg
---



객체 지향 패러다임의 4가지 주요 특성인 "캡슐화", "추상화", "다형성", "상속". 
개발자라면 이미 각각에 대해 완벽히 알고 있는 사람도 많을 것이고, 객체 지향을 공부해 본 사람이라면 한번 쯤은 들어보았을 내용이다.

이번 글에서는 그 중 "다형성"에 대해 다뤄보려고 한다.
객체 지향에서 의미하는 다형성의 의미는 무엇인지 그리고 다형성을 구현하는 방법은 어떤 매커니즘들이 있는지 예시를 통해 알아보겠다.
독자의 예상대로 특별한 내용을 서술하진 않을 것이니 가벼운 마음으로 읽어주길 바란다.



## 객체 지향에서의 다형성
먼저 위키피디아에서 "다형성"의 의미를 검색해보자.

> 다형성이란 프로그램 언어 각 요소들(상수, 변수, 식, 객체, 메소드 등)이 다양한 자료형(type)에 속하는 것이 허가되는 성질을 가리킨다.     - 위키피디아 중 - 

또는 여러 형태를 받아들일 수 있는 성질, 상황에 따라 의미를 다르게 부여할 수 있는 특성 등으로 정의를 하기도 한다. 정리하면 다형성이란 하나의 타입에 여러 객체를 대입할 수 있는 성질로 이해하면 될 것이다.

다형성을 활용하면 기능을 확장하거나, 객체를 변경해야할 때 타입 변경 없이 객체 주입만으로 수정이 일어나게 할 수 있다. 또한 상속을 사용한다면 중복되는 코드까지 제거할 수 있으므로 더욱 객체 지향 설계와 가까워질 수 있다. 

몇 가지 구현 사례를 통해 어떻게 사용할 수 있는지 알아보자.



## 다형성을 구현하는 방법

다형성을 구현하는 방법에는 여러 가지가 있을 수 있지만,  필자는 그 중 대표적으로 알려져있는 "오버로딩", "오버라이딩", "함수형 인터페이스" 이 세가지에 대해서만 설명하겠다.

### 오버로딩(Overloading)
메소드 오버로딩을 예시로 들어보자.
자바의 PrintStream.class에 정의되어 있는 println이라는 함수는 다음과 같이 매개변수만 다른 여러 개의 메소드가 정의되어 있다.  매개변수로 배열을 넣을 때, 문자열을 넣을 때, 그리고 객체를 넣을 때 모두 `println`이라는 메소드 시그니처를 호출하여 원하는 내용을 출력하는 기능을 수행한다. 
``` java
public class PrintStream {
	...
	public void println() {
		this.newLine();
	}

	public void println(boolean x) {
  		synchronized(this) {
      	this.print(x);
      	this.newLine();
  		}
	}

	public void println(char x) {
    	synchronized(this) {
        	this.print(x);
        	this.newLine();
    	}
	}

	public void println(int x) {
    	synchronized(this) {
        	this.print(x);
        	this.newLine();
    	}
	}
	...
}
```
오버로딩은 여러 종류의 타입을 받아들여 결국엔 같은 기능을 하도록 만들기 위한 작업이다. 이 역시 메소드를 동적으로 호출할 수 있으니 다형성이라고 할 수 있다. 하지만 메소드를 오버로딩하는 경우 요구사항이 변경되었을 때 모든 메소드에서 수정이 수반되므로 필요한 경우에만 적절히 고려하여 사용하는 것이 좋을 듯 하다. 필자는 보통 생성자 오버로딩을 많이 사용한다.

### 오버라이딩(Overriding)
오버로딩과 이름이 비슷해 헷갈려하는 개발자들도 있을 것이다. 오버라이딩은 상위 클래스의 메서드를 하위 클래스에서 재정의하는 것을 말한다. 따라서 여기서는 상속의 개념이 추가된다.
아래 예시로 보인 추상 클래스 Figure에는 하위 클래스에서 오버라이드 해야 할 메소드가 정의되어 있다.
``` java
public abstract class Figure {
    protected int dot;
    protected int area;

    public Figure(final int dot, final int area) {
        this.dot = dot;
        this.area = area;
    }

    public abstract void display();

	  // getter
}
```

Figure을 상속받은 하위 클래스인 Triangle 객체는 해당 객체에 맞는 기능을 구현한다.
``` java
public class Triangle extends Figure {
    public Triangle(final int dot, final int area) {
        super(dot, area);
    }

    @Override
    public void display() {
        System.out.printf("넓이가 %d인 삼각형입니다.", area);
    }
}
```

만약 사각형 객체를 추가하고 싶다면, 같은 방식으로 Figure을 상속받되 메소드 부분에서 사각형에 맞는 display 메소드를 구현해주면 된다. 이렇게 하면 추후 도형 객체가 추가되더라도 도형 객체가 실제로 사용되는 비즈니스 로직의 변경을 최소화할 수 있다.

``` java
public static void main(String[] args) {
    Figure figure = new Triangle(3, 10); // 도형 객체 추가 또는 변경 시 이 부분만 수정

    for (int i = 0; i < figure.getDot(); i++) {
        figure.display();
    }
}
```

만약 여기서 다형성을 사용하지 않고 도형 객체를 추가하는 로직을 생각해 본다면 아마 다음과 같이 if-else분기가 늘어나게 될 것이다.
도형이 2개 밖에 없는데도 벌써 코드양 차이가 보이는가?
``` java
public static void main1(String[] args) {
    int dot = SCANNER.nextInt();

    if (dot == 3) {
        Triangle triangle = new Triangle(3, 10);
        for (int i = 0; i < triangle.getDot(); i++) {
            triangle.display();
        }
    } else if(dot == 4) {
        Rectangle rectangle = new Rectangle(4, 20);
        for (int i = 0; i < rectangle.getDot(); i++) {
            rectangle.display();
        }
    }
	  ....

}
```

여기까지 오버라이드 방식으로 다형성을 구현하는 방법을 살펴보았다. 예시에서는 추상클래스를 사용했지만, 인터페이스도 구현의 정도만 차이가 있을 뿐 같은 사용 방식은 같다.  오버라이드 다형성 방식을 잘 활용하면, 기능의 확장과 객체의 수정에 유연한 구조를 가져갈 수 있다.

### 함수형 인터페이스(Funtional Interface)
마지막으로는 함수형 인터페이스 방식을 살펴보자. 함수형 인터페이스(Functional Interface)란, 람다식을 사용하기 위한 API로 자바에서 제공하는 인터페이스에 구현할 메소드가 하나 뿐인 인터페이스를 의미한다. 함수형 인터페이스는 enum과 함께 사용한다면 다형성의 장점을 경험할 수 있다.

가장 간단한 예시로 문자열 계산기를 예시로 들어보겠다.

``` java
public enum Operator {
    PLUS("+", (a, b) -> a + b),
    MINUS("-", (a, b) -> a - b),
    MULTIPLY("*", (a, b) -> a * b),
    DIVIDE("/", (a, b) -> a / b);

    private final String sign;
    private final BiFunction<Long, Long, Long> bi;

    Operator(String sign, BiFunction<Long, Long, Long> bi) {
        this.sign = sign;
        this.bi = bi;
    }

	  public static long calculate(long a, long b, String sign) {
    	  Operator operator = Arrays.stream(values())
            	.filter(v -> v.sign.equals(sign))
            	.findFirst()
            	.orElseThrow(IllegalArgumentException::new);

    	  return operator.bi.apply(a, b);
	  }
}
```

사칙연산을 할 수 있는 각각의 연산자를 enum으로 미리 정의하고 연산 방식을 BiFuntion을 사용한 람다식으로 정의할 수 있다. 이때 연산자를 추가해야할 경우 enum에 추가하기만 하면, 실질적인 연산을 수행하는 calculate 메소드는 아무런 수정없이도 기능을 확장할 수 있다.

``` java
public static void main(String[] args) {
    String question = "4*7";
    String[] values = question.split("");

    long a = Long.parseLong(values[0]);
    long b = Long.parseLong(values[2]);

    long result = Operator.calculate(a, b, values[1]);
    System.out.println(result); //28
}
```



## 결론

필자는 개인적으로 다형성이 객체 지향 패러다임의 주요 특성 중 가장 핵심이라고 생각한다. 변화에 유연한 소프트웨어를 만들기 위해서 객체 지향 패러다임을 사용하는 것이라면, 그러한 목적 달성에 중추적인 역할을 "다형성"이 해내기 때문이다. 

우리는 객체 지향으로 설계를 잘하기 위한 원칙인 SOLID원칙을 알고 있다. SOLID 중에서도 가장 어려운 OCP(Open-Closed Principle)와 DIP(Dependency Inversion Principle)는 다형성을 기본으로 하고 있다. 물론 다형성을 사용하기 위해서는 추상화, 상속 개념이 필요하긴 하지만 본질적인 목적을 본다면 결국은 다형성을 잘 활용하는 것이 코드의 중복을 줄이면서 변경과 확장에 유연한 객체 지향적인 코드를 작성하는데 유용하다는 것을 알 수 있을 것이다. 

정리하면 다형성은 하나의 타입에 여러 객체를 대입할 수 있는 성질이고, 이것을 구현하기 위해서는 여러 객체들 중 공통 특성으로 타입을 추상화하고 그것을 상속(인터페이스라면 구현)해야한다. 이 특성들을 유기적으로 잘 활용했을 때, 비로소 객체 지향에 가까운 코드를 작성할 수 있을 것이라 생각한다.

