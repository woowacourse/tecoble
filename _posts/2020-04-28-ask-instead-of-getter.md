---
layout: post
title: "getter를 사용하는 대신 객체에 메시지를 보내자"
author: "오렌지"
comment: "true"
tags: ["object-calisthenic", "OOP"]
toc: true
---

 > getter는 멤버변수의 값을 호출하는 메소드이고, setter는 멤버변수의 값을 변경시키는 메소드이다.


 > **자바 빈  설계 규약**에 따르면 자바 빈 클래스 설계 시,
 > 클래스의 멤버변수의 접근제어자는 private이며, 모든 멤버변수에 대해 get메소드와 set메소드가 존재해야 한다.
 > get메소드는 매개변수가 없어야 하며 set메소드는 하나 이상의 매개변수가 있어야 한다.
 > [좋은 코드를 위한 자바 메서드 네이밍](https://woowacourse.github.io/javable/2020-04-26/Method-Naming) 에도 간단히 설명되어 있다.

상태값을 갖는 객체에서는 상태값을 외부에서 직접 접근해 변경하지 못하도록 메소드만 노출시킨다.
이때, 멤버변수(상태값)는 접근 제한자를 private으로 설정해 직접적인 접근을 막고, getter와 setter를 이용해서만 변수에 접근이 가능하도록 한다.


```java
private String name;

//setter name의 값을 변경시킨다.
public void setName(String name){
    this.name = name;
}

//getter name의 값을 호출한다.
public String getName(){
    return this.name;
}
```

**상태를 갖는** 객체는 getter를 통해 가져온 상태값을 통해 로직을 수행하는 경우가 있다.
그러나 무조건적으로 모든 멤버변수를 호출하는  getter메소드를 생성하는 것이 맞을까?
이 글에서는 getter에 관한 이야기를 해보려고 한다.




## 무분별한 getter? 객체에 메시지를 보내 객체가 로직을 수행하도록 하자

객체는 캡슐화된 상태와 외부에 노출되어 있는 행동을 갖고 있으며, 다른 객체와 메시지를 주고 받으면서 협력한다.
객체는 메시지를 받으면 객체 그에 따른 로직(행동)을 수행하게 되고, 필요하다면 객체 스스로 내부의 상태값도 변경한다.
간단히 말해서 객체지향 프로그래밍은 객체가 스스로 일을 하도록 하는 프로그래밍이다.

모든 멤버변수에 getter를 생성해 놓고 상태값을 꺼내 그 값으로 객체 외부에서 로직을 수행한다면, 객체가 로직(행동)을 갖고 있는 형태가 아니고 메시지를 주고 받는 형태도 아니게 된다. 
또한, 객체 스스로 상태값을 변경하는 것이 아니고, 외부에서 상태값을 변경할 수 있는 위험성도 생길 수 있다.

따라서 이는 객체가 객체스럽지 못한 것이다.



*또한,
getter를 남용하게 되면, 디미터의 법칙을 위반할 가능성도 생기고, 가독성이 떨어지는 문제도 생길 수 있다.
[getter 남용으로 인한 디미터 법칙을 위반한 예](https://johngrib.github.io/wiki/law-of-demeter/#%EB%94%94%EB%AF%B8%ED%84%B0-%EB%B2%95%EC%B9%99%EC%9D%84-%EC%9C%84%EB%B0%98%ED%95%9C-%EC%BD%94%EB%93%9C---%EA%B8%B0%EC%B0%A8-%EC%B6%A9%EB%8F%8C)를 참고하면 좋을 것이다.*



자동차 경주 게임의 예시 코드를 보자.
Cars 클래스는 여러 자동차의 역할을 한다.

```java
public class Cars {
     public static final String DELIMITER = ",";
     public static final int MINIMUM_TEAM = 2;
     private List<Car> cars;

     public Cars(String inputNames) {
         String[] names = inputNames.split(DELIMITER, -1);
         cars = Arrays.stream(names)
                 .map(name -> new Car(name.trim()))
                 .collect(Collectors.toList());
         validateCarNames();
     }
         ...

    public List<String> findWinners() {
        final int maximum = cars.stream()
                  .map(car -> car.getPosition())	
                  .max(Integer::compareTo)
                  .get();
           
        return cars.stream()
                .filter(car -> car.getPosition() == maximum)
                .map(Car::getName)
                .collect(Collectors.toList());
    } 
         ...
}
```

여러 자동차들 중 position값이 제일 큰 우승 자동차(들)를 구하는 `findWinners()` 메소드를 살펴보자. 

```java
public List<String> findWinners() {
    final int maximum = cars.stream()
              .map(car -> car.getPosition())		// Car객체의 position = 자동차가 움직인 거리
              .max(Integer::compareTo)
              .get();
           
    return cars.stream()
            .filter(car -> car.getPosition() == maximum)
            .map(Car::getName)
            .collect(Collectors.toList());
} 
```

Car 객체에서 `getPosition()` 을 사용해 **position 상태값**을 직접 꺼내 비교한다.
그러나, Cars에서 position 값을 비교하는 로직을 수행하는 게 맞을까?

Car의 접근 제한자가 private인 멤버변수 position 값 끼리 비교하는 로직이다.
따라서 Car 객체에게 position 값을 비교할 또 다른 Car 객체를 넘겨주고 Car끼리 position을 비교해야 한다.
Cars가 아니라 Car에서 해야 하는 일인 것이다.

Car 객체 내에서 같은 자동차끼리 position 값을 비교하고, 
Car 객체 내에서 maximum 과 일치하는지 비교하도록 Cars의 로직을 Car 안으로 옮기도록 하자.

즉, Car 객체에게 position 값을 비교할 수 있도록 메시지를 보내고,
Car 객체에게 maximum 값과 자신의 position 값이 같은지 물어보는 메시지를 보내 `getPosition()` 을 사용하지 않도록 리팩토링 해 보자.

```java
public class Car implements Comparable<Car> {
         ...
    public boolean isSamePosition(Car other) {
        return other.position == this.position;
 	}
 	
    @Override
    public int compareTo(Car other) {
        return this.position - other.position;
    }
         ...
}

public class Cars {
         ...
    public List<String> findWinners() {
        final Car maxPositionCar = findMaxPositionCar();
        return findSamePositionCars(maxPositionCar);
    }
    
    private Car findMaxPositionCar() {
        Car maxPositionCar = cars.stream()
            .max(Car::compareTo)
            .orElseThrow(() -> new IllegalArgumentException("차량 리스트가 비었습니다."));
    }

    private List<String> findSamePositionCar(Car maxPositionCar) {
        return cars.stream()
            .filter(maxPositionCar::isSamePosition)
            .map(Car::getName)
            .collect(Collectors.toList());
    }
}
```
`getPosition()` 을 없애는 방향으로 리팩토링 한 코드이다.
Car에서 Comparable을 상속받아 `compareTo()` 를 구현해 Car내에서 자동차끼리 비교를 해준다.
max를 통해 cars 중, 최대 길이의 position을 가진 Car를 찾을 수 있다.
또, `isSamePosition()` 을 구현해 Car 내에서 직접 position 값을 비교할 수 있게 된다.




이에 관해 포비 캡틴(박재성님)은 이런 말을 하셨다.
```
상태를 가지는 객체를 추가했다면 객체가 제대로 된 역할을 하도록 구현해야 한다.
객체가 로직을 구현하도록 해야한다.
상태 데이터를 꺼내 로직을 처리하도록 구현하지 말고 객체에 메시지를 보내 일을 하도록 리팩토링한다.
```



## getter를 무조건 사용하지 말라는 말은 아니다.

당연히 getter를 무조건 사용하지 않고는 기능을 구현하기 힘들것이다.
출력을 위한 값 등 순수 값 프로퍼티를 가져오기 위해서라면 어느정도 getter는 허용된다.
그러나, Collection 인터페이스를 사용하는 경우 외부에서 getter메서드로 얻은 값을 통해 상태값을 변경할 수 있다.

```java
public List<Car> getCars() {
		return cars;
	} (x)

public List<Car> getCars() {
		return Collections.unmodifiableList(cars);
	} (o)
```
이처럼 `Collections.unmodifiableList()` 와 같은 `Unmodifiable Collecion` 을 사용해 외부에서 변경하지 못하도록 하는 게 좋다.



------

#### 참고 링크

+ [객체를 객체스럽게 사용하도록 리팩토링해라.](https://www.slipp.net/questions/559)
+ [getter 메소드를 사용하지 않도록 리팩토링한다.](https://www.slipp.net/questions/565)
+ [객체지향 생활체조 규칙 9: 게터/세터/프로퍼티를 쓰지 않는다.](https://developerfarm.wordpress.com/2012/02/01/object_calisthenics_10/)