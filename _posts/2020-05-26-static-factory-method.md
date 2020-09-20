---
layout: post
title: "정적 팩토리 메서드(Static Factory Method)는 왜 사용할까?"
author: "보스독"
comment: "true"
tags: ["static-factory-method"]
toc: true
---

정적 팩토리 메서드를 들어본 적이 있는가? 프로그래밍을 시작한 지 얼마 안된 사람도 정적 팩토리 메서드라는 단어를 한번쯤은 들어봤을 것이다. 그리고 아마 프로그래밍을 조금 해본 사람들은 **정적 팩토리 메서드**라는 용어에 많이 익숙해져 있고 실제로도 자주 사용하고 있을 것이다.

이 글은 정적 팩토리 메서드 개념이 익숙하지 않은 사람들을 위한 글이다. 이런 사람들은 주변에서 정적 팩토리 메서드를 자주 사용한다는 이유만으로 그 용도와 역할을 제대로 모른 채 사용할 수도 있다. 이 글을 통해서 정적 팩토리 메서드란 무엇이고 어떤 장점이 있는지 알아보도록 하자.

## 정적 팩토리 메서드(Static Factory Method)란?

**정적(static)**. **팩토리(factory)**. **메서드(method)**

여기서 팩토리라는 용어가 조금 생소할 수 있다. GoF 디자인 패턴 중 팩토리 패턴에서 유래한 이 단어는 객체를 생성하는 역할을 분리하겠다는 취지가 담겨있다. (팩토리 패턴, 팩토리 클래스에 대해 더 알고 싶다면 [이 글](https://velog.io/@ljinsk3/팩토리-패턴이란)을 참고하길 바란다.) 

다시 말해, 정적 팩토리 메서드란 **객체 생성의 역할을 하는 클래스 메서드**라는 의미로 요약해볼 수 있다.

아직도 정적 팩토리 메서드가 무엇인지 감이 안 오는 사람들을 위해서 예시를 들어보겠다.

다음 코드는 java.time 패키지에 포함된 LocalTime 클래스의 정적 팩토리 메서드이다. 

``` java
// LocalTime.class
...
public static LocalTime of(int hour, int minute) {
  ChronoField.HOUR_OF_DAY.checkValidValue((long)hour);
  if (minute == 0) {
    return HOURS[hour];
  } else {
    ChronoField.MINUTE_OF_HOUR.checkValidValue((long)minute);
    return new LocalTime(hour, minute, 0, 0);
  }
}
...

// hour, minutes을 인자로 받아서 9시 30분을 의미하는 LocalTime 객체를 반환한다.
LocalTime openTime = LocalTime.of(9, 30); 
```

위 예시 코드에서 본 LocalTime 클래스의 `of` 메서드처럼 직접적으로 생성자를 통해 객체를 생성하는 것이 아닌 메서드를 통해서 객체를 생성하는 것을 **정적 팩토리 메서드**라고 한다.

또 다른 예시로 enum의 요소를 조회할 때 사용하는 `valueOf` 도 정적 팩토리 메서드의 일종이라고 할 수 있다. 미리 생성된 객체를 "조회"를 하는 메서드이기 때문에 팩토리의 역할을 한다고 볼 수는 없지만, 외부에서 원하는 객체를 반환해주고 있으므로 결과적으로는 정적 팩토리 메서드라고 간주해도 좋다.

``` java
public enum Color {
  RED,
  BLUE;
}
...
Color redColor = Color.valueOf("RED");
Color blueColor = Color.valueOf("BLUE");
```

정적 팩토리 메서드가 무엇이고, 어떤 역할을 하는지 감을 잡았다면 다음과 같은 의문이 들어야 정상이다.

>  객체를 생성하는 역할은 자바에서 제공하는 "생성자"가 하는데, 왜 정적 팩토리 메서드를 따로 만들어서 객체를 생성하는 것일까?

## 생성자와는 어떤 차이가 있나?

자바 프로그래머라면, 조슈아 블로크의 저서 "이펙티브 자바"라는 책을 누구나 한번 쯤은 들어봤을 것이다. 이 책에서 소개된 많은 아이템들 중에서 가장 첫 번째로 나오는 것이 바로 **"생성자 대신 정적 팩토리 메서드를 고려하라"** 이다. 

벌써부터 정적 팩토리 메서드를 사용하는 것이 더 장점이 클것이라는 느낌이 오지 않는가? 생성자와 정적 팩토리 메서드는 객체를 생성한다는 같은 역할을 하고 있지만 그 활용도는 엄연히 차이가 난다. 실제로 정적 팩토리 메서드가 어떤 면에서 생성자보다 우위를 차지하고 있는지 하나씩 알아보자. 

### 1. 이름을 가질 수 있다.

객체는 생성 목적과 과정에 따라 생성자를 구별해서 사용할 필요가 있다.  `new`라는 키워드를 통해 객체를 생성하는 생성자는  내부 구조를 잘 알고 있어야 목적에 맞게 객체를 생성할 수 있다. 하지만 정적 팩토리 메서드를 사용하면 메서드 이름에 객체의 생성 목적을 담아 낼 수 있다.

다음 주어진 자동로또와 수동로또를 생성하는 팩토리 클래스의 일부 코드를 살펴보자.

``` java
public class LottoFactory() {
  private static final int LOTTO_SIZE = 6;
  
  private static List<LottoNumber> allLottoNumbers = ...; // 1~45까지의 로또 넘버
    
  public static Lotto createAutoLotto() {
    Collections.shuffle(allLottoNumbers);
    return new Lotto(allLottoNumbers.stream()
            .limit(LOTTO_SIZE)
            .collect(Collectors.toList()));
  }

  public static Lotto createManualLotto(List<LottoNumber> lottoNumbers) {
    return new Lotto(lottoNumbers);
  }
  ...
}
```

`createAutoLotto`와 `createMenualLotto` 모두 로또 객체를 생성하고 반환하는 정적 팩토리 메서드이다. 메서드의 이름만 보아도 로또 객체를 자동으로 생성하는지, 아니면 수동으로 생성하는지 단번에 이해할 수 있을 것이다.

이처럼 정적 팩토리 메서드를 사용하면 해당 생성의 목적을 이름에 표현할 수 있어 가독성이 좋아지는 효과가 있다.



### 2. 호출할 때마다 새로운 객체를 생성할 필요가 없다.

enum과 같이 자주 사용되는 요소의 개수가 정해져있다면 해당 개수만큼 미리 생성해놓고 조회(캐싱)할 수 있는 구조로 만들수 있다. 정적 팩터리 메서드와 캐싱구조를 함께 사용하면 매번 새로운 객체를 생성할 필요가 없어진다.  

이번에도 로또 번호를 생성하는 메서드를 살펴보자. 1부터 45까지의 로또 번호를 enum으로도 만들 수 있지만 `LottoNumber` 클래스 안에서 반복문을 통해 쉽게 45개의 인스턴스를 만들 수 있으므로 후자의 방법을 사용했다.

``` java
public class LottoNumber {
  private static final int MIN_LOTTO_NUMBER = 1;
  private static final int MAX_LOTTO_NUMBER = 45;
  
  private static Map<Integer, LottoNumber> lottoNumberCache = new HashMap<>();
  
  static {
    IntStream.range(MIN_LOTTO_NUMBER, MAX_LOTTO_NUMBER)
                .forEach(i -> lottoNumberCache.put(i, new LottoNumber(i)));
  }
  
  private int number;
  
  private LottoNumber(int number) {  
    this.number = number;
  }
  
  public LottoNumber of(int number) {  // LottoNumber를 반환하는 정적 팩토리 메서드
    return lottoNumberCache.get(number);
  }
  
  ...
}
```

여기서 짚고 넘어가야할 점은 미리 생성된 로또 번호 객체의 캐싱을 통해서 새로운 객체 생성의 부담을 덜 수 있다는 장점도 있지만, 생성자의 접근 제한자를 `private`으로 설정함으로써 객체 생성을 정적 팩토리 메서드로만 가능하도록 제한할 수 있다는 것이다. 이를 통해 정해진 범위를 벗어나는 로또 번호의 생성을 막을 수 있다는 장점을 확보할 수 있다.



### 3. 하위 자료형 객체를 반환할 수 있다.

하위 자료형 객체를 반환하는 정적 팩토리 메서드의 특징은 상속을 사용할 때 확인할 수 있다. 이는 생성자의 역할을 하는 정적 팩토리 메서드가 반환값을 가지고 있기 때문에 가능한 특징이다.

`Basic`, `Intermediate`, `Advanced` 클래스가 `Level`라는 상위 타입을 상속받고 있는 구조를 생각해보자. 시험 점수에 따라 결정되는하위 등급 타입을 반환하는 정적 팩토리 메서드를 만들면, 다음과 같이 분기처리를 통해 하위 타입의 객체를 반환할 수 있다. 

``` java
public class Level {
  ... 
  public static Level of(int score) {
    if (score < 50) {
      return new Basic();
    } else if (score < 80) {
      return new Intermediate();
    } else {
      return new Advanced();
    }
  }
  ...
}
```



### 4. 객체 생성을 캡슐화할 수 있다.

정적 팩토리 메서드는 객체 생성을 캡슐화하는 방법이기도 하다.

> 캡슐화(Encapsulization)란?
>
> 데이터의 은닉을 말한다. 여기서는 생성자를 클래스의 메서드 안으로 숨기면서 내부 상태를 외부에 드러낼 필요없이 객체 생성 인터페이스 단순화 시킬 수 있다.

아래 코드를 보자. 웹 어플리케이션을 개발하다보면 계층 간에 데이터를 전송하기 위한 객체로 DTO(Data transfer object)를 정의해서 사용한다.

DTO와 Entity간에는 자유롭게 형 변환이 가능해야 하는데, 정적 팩터리 메서드를 사용하면 내부 구현을 모르더라도 쉽게 변환할 수 있다.

``` java
public class CarDto {
  private String name;
  private int position;
  
  pulbic static CarDto from(Car car) {
    return new CarDto(car.getName(), car.getPosition());
  }
}


// Car -> CatDto 로 변환
CarDto carDto = CarDto.from(car);
```

만약 정적 팩토리 메서드를 쓰지 않고 DTO로 변환한다면 외부에서 생성자의 내부 구현을 모두 드러낸 채 해야할 것이다.

``` java
Car carDto = CarDto.from(car); // 정적 팩토리 메서드를 쓴 경우
CarDto carDto = new CarDto(car.getName(), car.getPosition); // 생성자를 쓴 경우
```



이처럼 정적 팩토리 메서드는 단순히 생성자의 역할을 대신하는 것 뿐만 아니라, 우리가 좀 더 가독성 좋은 코드를 작성하고 객체지향적으로 프로그래밍할 수 있도록 도와 준다. 도메인에서 "객체 생성"의 역할 자체가 중요한 경우라면 정적 팩토리 클래스를 따로 분리하는 것도 좋은 방법이 될 것이다. 다만 팩토리 메서드만 존재하는 클래스를 생성할 경우 상속이 불가하다는 단점이 있으니 참고하여 사용하길 바란다. 

확실한 점은 정적 팩토리 메서드를 적절히 사용했을 때 얻을 수 있는 장점이 더 많다는 것이다. 객체간 형 변환이 필요하거나, 여러 번의 객체 생성이 필요한 경우라면 생성자보다는 정적 팩토리 메서드를 사용해보자.

마지막으로 정적 팩토리 메서드를 만드는데 있어서 일반적으로 많이 사용되는 네이밍 컨벤션을 살펴보고 글을 마무리하겠다. 이 글을 통해 조금이나마 정적 팩토리 메서드의 용도와 역할에 대해 이해도를 높이는데 도움이 되었길 바란다. 

## 정적 팩토리 메서드 네이밍 컨벤션

- `from` : 하나의 매개 변수를 받아서 객체를 생성
- `of` : 여러개의 매개 변수를 받아서 객체를 생성
- `getInstance` | `instance` : 인스턴스를 생성. 이전에 반환했던 것과 같을 수 있음. 
- `newInstance` | `create` : 새로운 인스턴스를 생성 
- `get[OtherType]` : 다른 타입의 인스턴스를 생성. 이전에 반환했던 것과 같을 수 있음.
- `new[OtherType]` : 다른 타입의 새로운 인스턴스를 생성.

