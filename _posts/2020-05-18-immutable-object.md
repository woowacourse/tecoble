---
layout: post  
title: "불변객체를 만드는 방법"  
author: "카일"
comment: "true"
tags: ["immutable", "refactoring"]
toc: true
---

이번 글에서는 불변 객체로 만들어야 할 때 어떠한 방법으로 만들 수 있는지에 대해 이야기해보고자 합니다. 주로 클래스를 불변 클래스로 만드는 방법에 관해서 이야기 할 예정입니다.

## Immutable Object(불변 객체)란?

위키피디아에 의하면 `불변 객체는 생성 후 그 상태를 바꿀 수 없는 객체`를 의미합니다. 여기서 상태를 바꿀 수 없다는 것은 어떤 의미일까요? 이는 힙영역에서 그 객체가 가리키고 있는 데이터 자체의 변화가 불가능하다는 것을 의미합니다.

<img width="609" alt="스크린샷 2020-05-29 오전 8 31 17" src="https://user-images.githubusercontent.com/49060374/83204436-c7eb5600-a186-11ea-919b-29b2e9ac94b6.png">
 

힙 영역이라는 말이 생소한 분들을 위해 간단하게 설명하자면, 위의 그림처럼 `Reference`를 가지고 있는 타입(`object, array`) 은 실제 데이터는 `힙` 영역에 저장하고 그 힙 영역을 가리키는 주솟값을 `Stack` 영역에서 가지고 있는데, 아래의 코드를 보며 조금 더 설명하겠습니다.

```java

public class JavaApplication {
    public static void main(String[] args){
        String example = new String("Hello World");
        String example2 = new String("Hello World");
        System.out.println("두 변수가 가지고 있는 주소 값이 같니?");
        System.out.println(example == example2);
        System.out.println(example);
    }
}

//두 변수가 가지고 있는 주소 값이 같니?
//false
//Hello World
```

- 위의 코드에서 example이라는 데이터는 `Hello World` 라는 문자 자체의 데이터를 담고 있는 것 같지만 Hello World 라는 데이터를 가지고 있는 힙 영역의 주소를 가지고 있는 것이다. (같은 데이터를 가지고 있지만 다른 주솟값을 가지고 있기 때문에 `false` 가 반환된 것이다.)
- 불변 객체는 가리키고 있는 주솟값 그리고 힙 영역에 있는 데이터 `**그 자체**` 가 변경되지 않는 것을 의미한다. 이 부분에 대해 이해가 되지 않는다면 불변 객체를 검색하면 String 과 Stringbuilder를 사용하여 불변 객체를 설명하고 있는 블로그들이 많이 존재한다. 이를 참고하면 좋을 것 같다.

## 원시 타입에서의 불변

- 원시 타입은 참조 값이 존재하지 않기 때문에 값을 그대로 외부로 내보내는 경우에도 내부 객체는 불변입니다. 따라서 **Setter 를 생성하지 않는 것**만으로 원시 타입으로 이루어진 객체는 불변으로 만들 수 있습니다.

## 참조 타입에서의 불변

- 원시 타입이 아닌 참조 타입에서 불변은 조금 더 까다로운 형태로 불변 객체를 만들어야 합니다. 아래의 예들을 보며 구체적으로 부연 설명 하겠습니다.

```java

import java.util.List;

public class Cars {     
    private final List<Car> cars;
    
    public Cars(List<Car> cars) {
    	this.cars = cars; 
    }
}

public class Car { 
    private final String name;
    
    public Car(String name) {
    	this.name = name;  
    }
}
```

- 위의 예제에서 `Cars` 는 이름을 가지고 있는 자동차를 `List` 의 형태로 가지고 있습니다. 이 경우 Cars는 **Setter와 Getter가 존재하지 않기 때문에 외부에서 값을 제어 할 수 없다고 생각하기 쉽습니다. 하지만 Cars 는 불변 객체가 아닙니다.** 아래의 예를 통해 확인해 보겠습니다.

```java
public static void main(String[] args) {
    List<Car> carNames = new ArrayList<>();
    carNames.add(new Car("hodol"));
    Cars cars = new Cars(carNames);  // hodol만 들어간 리스트를 통해 생성

    for(Car car : cars.getCars()) { 
        System.out.println(car.toString()); // 결과 : 호돌 
    }
    System.out.println(cars);  // 주소 kail.study.java.study.immutable.Cars@4b1210ee
	
    carNames.add(new Car("pobi")); //다른 값을 추가로 넣어줌.	
    System.out.println(cars) // 주소 kail.study.java.study.immutable.Cars@4b1210ee

    for(Car car : cars.getCars()) { 
        System.out.println(car.toString()); //결과 : 호돌 포비 
    }
}
```

- Cars가 생성될 때 인자로 넘어온 리스트를 외부에서 변경하면 Cars가 참조하고 있는 내부 인스턴스 또한 변한다는 것을 확인 할 수 있습니다. 위의 예에서 Cars의 인스턴스 변수인 `private final List<Car> cars` 가 불변이길 원하지만 다른 값을 넣더라도 같은 주소값을 가지면서 `pobi` 라는 값을 추가적으로 갖게 되었습니다.  **`불변 객체란 외부에서 불변 객체의 값을 수정 할 수 없는 객체`**를 의미합니다. 위의 예에서는 `외부(Main method)` 에서 Cars가 가지고 있는 cars라는 인스턴스 변수의 요소를 변경할 수 있었기 때문에 불변객체라고 할 수 없는 것입니다. 그렇다면 위의 예제에서 Cars를 어떻게 불변 객체로 만들 수 있을까요?

```java
public class Cars { 
    private final List<Car> cars;
    
    public Cars(List<Car> cars) {
	    this.cars = new ArrayList<>(cars); 
    }
    
    public List<Car> getCars() {
    	return cars; 
    }
}

// 위와 같은 Main method 실행 결과

//[kail.study.java.study.immutable.Car@4b1210ee]  -- 서로 다른 주소값
//hodol 
//kail.study.java.study.immutable.Cars@4d7e1886
//hodol -- pobi가 추가되지 않음.
```

- 생성자를 통해 값을 전달받을 때 `new ArrayList<>(cars)` 를 통해 새로운 값을 참조하도록 복사하였습니다. `이렇게 되면 외부에서 넘겨주는 List와 내부적으로 사용하는 인스턴스 변수가 참조하는 값이 다르기 때문에 외부에서 제어가 불가능` 합니다. 그럼 이젠 완벽한 불변 객체라고 할 수 있을까요? 추가로 변경해야 하는 부분이 있습니다. 일반적으로 Dto를 만들거나 혹은 View에서 사용하기 위해 Getter는 자주 사용이 됩니다. 그렇다면 Getter를 통해 위의 값을 제어하면 어떻게 될까요? 아래의 예제에서 확인하겠습니다.

```java
public static void main(String[] args) {
    List<Car> carNames = new ArrayList<>();
    carNames.add(new Car("hodol"));
    Cars cars = new Cars(carNames);
    
    for(Car car : cars.getCars()) {
        System.out.println(car.getName());
    }
    
    cars.getCars().add(new Car("pobi"));
    
    for(Car car : cars.getCars()) {
        System.out.println(car.getName());
    }
}

// 실행 결과
// hodol

// hodol
// pobi
```

- 실행 결과 Cars의 인스턴스 변수가 가리키고 있는 실제 데이터에 pobi가 추가된 것을 볼 수 있습니다. 이를 방지하기 위해선 `Collections` 가 제공해주는 api를 활용하여 이런 부작용을 방지 할 수 있습니다.

```java
public class Cars { 
    private final List<Car> cars;
    
    public Cars(List<Car> cars) {
    	this.cars = new ArrayList<>(cars); 
    }

    public List<Car> getCars() { 
        return Collections.unmodifiableList(cars); 
    }
}
```

- 이제는 정말 외부에서 자동차들의 리스트를 담고 있는 변수 cars에 대해서 어떠한 제어도 할 수 없는 상태가 되었습니다. 외부에서 값을 재할당하여 사용할 순 있지만, Cars의 인스턴스 변수가 가리키고 있는 값에 대해서는 불변이라고 말할 수 있기 때문에 완벽한 불변 객체라고 할 수 있습니다. 말이 조금 헷갈리시죠? 외부에서 값을 재할당해서 사용할 수 있다고? 라고 제가 생각했었습니다. 다들 아시는 부분이겠지만 조금 TMI를 해보자면

```java
public static void main(String[] args) {
    List<Car> carNames = new ArrayList<>();
    carNames.add(new Car("hodol"));
    Cars cars = new Cars(carNames);

    List<Car> modifiableCars = new ArrayList<>(cars.getCars());
    List<Car> unmodifiableCars = cars.getCars();
  
    modifiableCars.add(new Car("pobi"));
    unmodifiableCars.add(new Car("pobi"));	} // 실행에서 에러 발생
```

- 위와 같은 작업이 가능하다는 것을 의미합니다. 인스턴스 변수인 cars의 값은 불변이 보장되지만, 외부에서 그 값을 새롭게 선언하여 사용하는 경우는 문제가 없습니다. 서로 다른 주솟값을 가리키고 있기 때문입니다. 따라서 위의 코드에서 anotherCars.add는 아무 문제 없이 실행되지만 cars1은 인스턴스 변수가 가리키고 있는 값이 같고 `Collections.unmodifiedList` 로 반환하기 때문에 `런타임 에러`를 발생시킵니다.

## 추가적인 정보

- **위의 예제를 통해 불변 객체란 객체가 참조하고 있는 값이 외부에 의해 변형되지 않는 객체를 의미한다는 것을 학습하였습니다.**
- 추가적으로 객체가 다른 객체를 참조하는 경우는 어떻게 될까요? 이 경우도 위의 예제와 마찬가지로 참조하고 있는 객체에 대해서도 불변이 성립해야 불변이 성립됩니다.
- final 키워드는 참조 타입에서 변수의 재할당만을 금지하는 키워드입니다. 하지만 변수 선언 앞부분에 final을 사용하는 것은 뒤에서 할당하는 부분이 불변 객체라고 인식하는 경우도 많기 때문에 상황에 맞게 사용하시는 것이 좋을 듯합니다.

## 요약

- 불변 객체란 참조하고 있는 데이터를 변경할 수 없는 객체를 의미합니다. 불변 객체를 사용하였을 때 장점은 외부에서 임의로 내부의 값을 제어할 수 없기 때문에
- 객체의 자율성이 보장되고
- 프로그램 내에서 변하지 않는 즉 고정된 부분이 많아짐으로써 프로그램 안정도를 높일 수 있습니다.
- 모든 객체를 불변으로 만들 필요는 없지만 변하지 않기를 바라는 객체를 불변객체로 만드는 데에 이 포스팅이 도움이 되셨기를 바랍니다.