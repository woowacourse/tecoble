---
layout : post
title : "VO(Value Ojbect)란 무엇일까?"
author : "보스독"
comment: "true"
tags: ["value-object", "immutable"]
toc: true
---



프로그래밍을 하다 보면 VO라는 이야기를 종종 듣게 된다. 

VO와 함께 언급되는 개념으로는 Entity, DTO등이 있다. 그리고 더 나아가서는 도메인 주도 설계까지도 함께 언급된다. 이 글에서는 우선 다른 개념들을 뒤로하고, VO의 정의와 생성 조건 그리고 VO를 사용했을 때 어떤 장점이 있는지 간단하게 알아보도록 하겠다.

## VO(Value Object)

마틴 파울러가 본인의 블로그에서 언급한 VO의 개요를 보면 다음과 같다.

``` markdown
When programming, I often find it's useful to represent things as a compound. 
👉 프로그래밍할 때, 사물을 복합물로 표현하는 것이 유용한 경우가 종종 있다.

A 2D coordinate consists of an x value and y value. An amount of money consists of a number and a currency. A date range consists of start and end dates, which themselves can be compounds of year, month, and day.
👉 예를 들면 x, y로 이루어진 2차원 좌표를 표현하거나, 숫자와 통화로 이루어진 금액, 시작 날짜와 끝 날짜로 이루어진 날짜 기간 등이 있다.
```

즉, VO란 이렇게 도메인에서 한 개 또는 그 이상의 속성들을 묶어서 **특정 값을 나타내는** 객체를 의미한다. 

VO는 도메인 객체의 일종이고 보통 기본 키로 식별 값을 갖는 Entity와 구별해서 사용한다. 그렇다면 VO는 어떤 조건들에 의해 엔티티와 구별되는지 알아보자.



### 1. equals & hash code 메서드를 재정의해야 한다

타입도 같고, 내부의 속성값도 같은 두 객체가 있다면, 실제로도 같은 객체로 취급하고 싶을 것이다. 

> 아니 오히려 다르다고 하는 게 더 이상하게 느껴질 것이다. 마치 빨간색과 빨간색이 다르다고 하는 거니까 말이다.

 하지만 실제로 값이 같은 두 객체를 생성하고 동일성 비교를 해보면 둘은 서로 다른 객체로 구별된다. 

``` java
public class Point {
  private int x;
  private int y;
  
  public Point(int x, int y) {
    this.x = x;
    this.y = y;
  }
}

@Test
void equals() {
  Point point = new Point(2, 3);
  Point point2 = new Point(2, 3);
  
  // point != point2
  assertThat(point == point2).isFalse();  // 동일성 비교
}
```

분명 같은 위치를 가리키고 있는데 다른 위치라고 판단한다. 이는 우리가 현실 세계와 비슷하게 도메인을 설계하고 객체를 사용하는 데 있어서 우리의 머리를 아프게 만든다.

이 문제를 해결하기 위해서 우선은 동일성 비교와 동등성 비교의 차이를 알아야 한다. 동일성(==) 비교는 객체가 참조하고 있는 주솟값을 확인한다. 하지만 point와 point2가 참조하고 있는 이 메모리 주솟값은 서로 다르고, 임의로 같게 만들 수 없다.

따라서 객체가 포함하고 있는 속성값들을 기준으로 객체를 비교하는 동등성 비교를 통해 객체를 비교해야 한다. 동등성 비교는  equals 메서드를 재정의함으로써 가능해진다. 하지만 어떤 속성값들을 기준으로 동등성 비교를 할 것인지는 다음과 같이 직접 equal 메서드의 재정의를 통해 정해야 한다. 

``` java
// equals & hashcode 재정의
...
    @Override
    public boolean equals(final Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        final Point point = (Point) o;
        return x == point.x &&
                y == point.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }
...
```

> hashCode 도 함께 재정의를 해주었다. hashCode는 객체를 식별할 하나의 정숫값을 가리키고 재정의하지 않으면 메모리 주솟값을 사용해서 해시값을 만든다. 하지만 해시 코드를 재정의해주면 특정 값을 기준으로 같은 해시 코드를 얻을 수 있고, 이는 해시값을 사용하는 컬렉션 등에서 객체를 비교하는 용도로 사용된다. 

이렇게 equals와 hashCode를 재정의하면, VO를 사용할 때 속성값이 같은 객체는 같은 객체임을 보장하면서 VO를 사용할 수 있다.

### 2. 수정자(setter)가 없는 불변 객체여야 한다

Entity 같은 경우 따로 식별 값을 갖고 있기 때문에 내부 속성값들이 변경된다 하더라도 같은 객체로 계속 인식하고 추적할 수 있다. 하지만 속성값 자체가 식별 값인 VO는 값이 바뀌면 다른 값이 되어 추적이 불가하고, 복사될 때는 의도치 않은 객체들이 함께 변경되는 문제를 유발한다. 따라서 VO는 반드시 값을 변경할 수 없는 불변 객체로 만들어야 한다.

그 이유를 다음 예시를 통해 좀 더 자세히 알아보자.

``` java
// Order.java
public class Order {
  private String restaurant;
  private String food;
  private int quantity;
  
  // Getter, Setter ...
  // equals & hashcode
}

// Main.java
public static void main(String[] args) {

  Order 첫번째주문 = new Order();
  첫번째주문.setRestaurant("황제떡볶이");
  첫번째주문.setFood("매운떡볶이");
  첫번째주문.setQuantity(2);
  // 첫번째주문 = {restaurant='황제떡볶이', food='매운떡볶이', quantity=2}

  Order 두번째주문 = 첫번째주문;
  // 두번째주문 = {restaurant='황제떡볶이', food='매운떡볶이', quantity=2}

  두번째주문.setFood("안매운떡볶이");  //** 주문 변경
  두번째주문.setQuantity(3);       //** 주문 변경
  // 첫번째주문 = {restaurant='황제떡볶이', food='안매운떡볶이', quantity=3}
  // 두번째주문 = {restaurant='황제떡볶이', food='안매운떡볶이', quantity=3}
  
}
```

음식점 이름, 음식 이름, 수량을 값으로 갖는 Order라는 VO를 만들었다.

이 때 "황제 떡볶이" 음식점에 주문이 2건 들어왔다고 해보자. **매운 떡볶이 2인분**! 첫 번째 주문과 두 번째 주문의 내용이 같아서 객체를 복사했다. 어차피 주문 내용이 같고 값 자체가 중요하다면 문제될 것 없지 않을까?

그런데 이 때, 만약 두 번째 손님이 주문을 변경했다고 해보자. **안 매운 떡볶이 3인분**으로 말이다.

분명 두 번째 주문의 내용만 변경했을 뿐인데, 출력된 결과를 살펴보면, 첫 번째 주문까지 안 매운 떡볶이 3인분으로 주문 내용이 변경되었다. 문제의 시작은 사용할 값이 같다고 해서 첫 번째 주문 값을 두번째 주문에 그대로 복사한 곳이다. 현재 두 번째 주문은 첫 번째 주문 값을 복사한 것이 아닌 참조하고 있는 메모리 주소를 복사했기 때문에 주문 내용이 바뀌면 메모리 안에 저장된 실제 값이 변경된다. 당연히 같은 메모리를 참조하고 있는 첫 번째 주문의 내용도 변경된 값을 가리키게 되는 것이다.

이러한 치명적인 오류를 방지하기 위해서 VO는 중간에 그 값이 변하지 않도록 만들어야 한다.

즉, 값을 변경할 수 있는 수정자(setter)가 없어야 한다.

그럼 수정자 없이 VO의 값을 어떻게 설정하면 좋을까? 

생성자를 통해서 객체가 생성될 때, 값이 한 번만 할당되고 이후로는 변경되지 않도록 만들 수 있다. 생성자를 통해 Order 객체를 불변으로 만들면 다음과 같이 두 객체 값이 동시에 변하는 문제를 해결할 수 있다.

``` java
public class Order {
  private String restaurant;
  private String food;
  private int quantity;
  
  public Order(String restaurant, String food, int quantity) {
    this.restaurant = restaurant;
    this.food = food;
    this.quantity = quantity;
  }
  
  // only getter..
}

public static void main(String[] args) {

  Order 첫번째주문 = new Order("황제떡볶이", "매운떡볶이", 2);
  // 첫번째주문 = {restaurant='황제떡볶이', food='매운떡볶이', quantity=2}

  Order 두번째주문 = new Order("황제떡볶이", "매운떡볶이", 2)
  // 두번째주문 = {restaurant='황제떡볶이', food='매운떡볶이', quantity=2}

  두번째주문 = new Order("황제떡볶이", "안매운떡볶이", 3)  //** 주문 변경
  // 첫번째주문 = {restaurant='황제떡볶이', food='매운떡볶이', quantity=2}
  // 두번째주문 = {restaurant='황제떡볶이', food='안매운떡볶이', quantity=3}
  
}
```

이번에도 만약 주문에 변경이 생긴다면 이제는 setter가 없으므로 생성자를 통해 객체를 새로 생성하고 재할당해 주어야 한다. 

이렇게 하면 속성 값 자체가 식별자 역할을 하는 VO의 정체성을 지키면서, 무엇보다도 의도치 않은 변경을 막을 수 있기 때문에 유지 보수에도 효과적이다.



### VO를 사용하면 얻을 수 있는 이점

우리는 VO라는 개념을 굳이 사용하지 않고도 충분히 원시 타입 값만 가지고 프로그래밍을 할 수 있다. 

하지만 VO를 통해 도메인을 설계한다면, 객체가 생성될 때 해당 객체안에 제약사항을 추가할 수 있다. 또한 생성될 인스턴스가 정해져 있는 경우에는 미리 인스턴스를 생성해놓고 캐싱하여 성능을 높이는 방법도 고려해볼 수 있다. 

그뿐만 아니라, Entity의 원시 값들을 VO로 포장하면 Entity가 지나치게 거대해지는 것을 막을 수 있어서, 테이블 관점이 아닌 객체 지향적인 관점으로 프로그래밍할 수 있다.

> 컬렉션도 VO의 역할을 한다면, 일급 컬렉션과 같은 불변객체로 만들어서 사용할 수 있다. Javable의 [불변객체를 만드는 방법](https://woowacourse.github.io/javable/2020-05-18/immutable-object)이나 [일급 컬렉션을 사용하는 이유](https://woowacourse.github.io/javable/2020-05-08/First-Class-Collection)에 불변하는 컬렉션을 만드는 방법이 소개되어 있으니 참고하길 바란다.

이 글을 통해 VO란 무엇이고, 어떤 특징이 있는지 감을 잡았기를 바란다. VO와 Entity의 역할을 잘 나누고 더 객체 지향적으로 설계하는 방법을 알고 싶다면, 도메인 주도 설계를 공부해보는 것도 도움이 될 것이다.