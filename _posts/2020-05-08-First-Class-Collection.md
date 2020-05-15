---
layout : post
title : "일급 컬렉션을 사용하는 이유"
author : "티거"
---

## 일급 컬렉션이란?

> 본 글은 [일급 컬렉션 (First Class Collection)의 소개와 써야할 이유](<https://jojoldu.tistory.com/412>)를 참고 했다.
>
> 일급 컬렉션이란 단어는 소트웍스 앤솔로지의 [객체지향 생활체조 규칙 8. 일급 콜렉션 사용](<https://developerfarm.wordpress.com/2012/02/01/object_calisthenics_/>)에서 언급되었다.

**Collection을 Wrapping**하면서, **Wrapping한 Collection(*밑에서 설명*) 외 다른 멤버 변수가 없는 상태**를 일급 컬렉션이라 한다.

이게 무슨 말일까?

먼저 **Collection을 Wrapping한다**의 의미는 아래 코드를

```java
public class Person {
    private String name;
    private int age;
    private List<Car> cars;
    // ...
}

public class Car {
    private String name;
    private String oil;
    // ...
}
```

다음과 같이 바꾸는 것을 말한다.

```java
public class Person {
    private String name;
    private int age;
    private Cars cars;
    // ...
}

// 일급 컬렉션
public class Cars {
    // 멥버변수가 하나 밖에 없습니다!!
    private List<Car> Car;
    // ...
}

public class Car {
    private String name;
    private String oil;
    // ...
}
```

위의 코드를 보면 눈치챘겠지만 일급 컬렉션은 **그(*List\<LottoNumber\> lotto*) 외 다른 멤버 변수가 없다.**

이것이 **일급 컬렉션!!**

## 왜 사용하지?

> 일급 컬렉션을 사용함으로서 갖는 이점 4가지를 설명하겠다.

### 1. 비지니스에 종속적인 자료구조

다음과 같은 조건으로 List\<Car\>를 만든다고 가정하자.

1. Car는 name과 oil의 값을 가지고 있어야함
2. Car는 중복될 수 없음

일급 컬렉션을 쓰지 않는다면 일반적으로 이렇게 쓸 것이다.

```java
public class Person {
    private String name;
    private int age;
    private List<Car> cars;

    public Person(List<Car> cars) {
        validateHasNameAndOil(cars);
        validateDuplicate(cars);
        this.cars = cars;
    }
    // ...
}

public class Car {
    private String name;
    private String oil;
    // ...
}
```

그럼 이런 생각을 할 것이다.

Car의 name과 oil 그리고 중복에 대한 검증이 Person class 생성자에서 일어나야 하는 일인 것인가?

다른 클래스에서 **List\<Car\> cars**가 쓰인다면, Person에서 했던 cars에 대한 검증을 또 해야하는가?

아마 **List\<Car\> cars**필요한 모든 클래스에 검증로직이 필요할 것이다.

하지만 일급 컬렉션을 쓰면 문제를 해결할 수 있다.

```java
public class Person {
    private String name;
    private int age;
    private Cars cars;
    // ...
}

// 일급 컬렉션
public class Cars {
    // 멥버변수가 하나 밖에 없습니다!!
    private List<Car> Car;
    
    public Lotto(List<Car> cars) {
        validateSize(cars);
        validateDuplicate(cars);
        this.cars = cars;
    }
    // ...
}

public class Car {
    private String name;
    private String oil;
    // ...
}
```

**List\<Car\> cars**는 **Cars**에 종속되어 상태와 행위를 한 곳에서 관리함으로 Person class 이외에 다른 class에서 **List\<Car\> cars**를 사용하더라도 **Cars**에서 관리해주기 때문에 검증에 대한 중복 코드도 제거할 수 있게 되었다.

### 2. 상태와 행위를 한 곳에서 관리

> **값과 로직이 함께 존재**하기 때문에 응집도가 높아진다.
>
> 풀어서 이야기하면 컬렉션을 사용하면 똑같은 기능을 중복 생성하지 않고, 히스토리를 한곳에서 관리할 수 있다.

이메일 중에서 회사이메일을 얻고 싶다고 한다.

```java
public class Naver {
  private List<Email> emails;
    
  private List<Email> getCompanyEmail() {
    return emails.stream().filter(Email::isCompanyEmail).findFirst();
  }
}
```

코드만 보면 무엇이 문제인지 모를 수도 있다.

만약 Naver뿐만아니라 Daum class도 만든다면 Daum class에도 getCompanyEmail() 메서드를 생성해 줄 것인가?

일급 컬렉션을 사용하면 값과 로직을 한 곳에서 관리할 수 있다.

```java
public class Naver {
  private Emails emails;
}

public class Emails {
  private List<Email> emails;

  private List<Email> getCompanyEmail() {
    return emails.stream().filter(Email::isCompanyEmail).findFirst();
  }
}
```

### 3. 이름이 있는 컬렉션

> 컬렉션에 이름을 붙일 수 있다.

이건 또 무슨말인가?

예시로 보여주도록 하겠다.

```java
List<Car> cars = createCars();
List<Bus> buses = createBuses();
```

문제점이 무엇일까?

1. 검색이 어렵다.
   1. 자동차들이 어떻게 사용되는지 검색을 하려면 변수명을 검색해야한다.
   2. 개발자마다 이름은 다르게 지을 수 있다.
2. 명확한 표현 X
   1. 변수명에 불과하기 때문에 의미 부여하기 어렵다.
   2. 개발팀/운영팀 간에 의사소통 시 보편적인 언어로 사용하기가 어렵다.

이 또한 일급 컬렉션이 해결한다.

```java
Cars cars = new Cars(createCars());
Buses buses = new Buses(createBuses());
```

......아직 마음에 와닿지 않는가?

이렇게 코드를 만들면 **컬렉션 기반으로 용어 사용과 검색**을 할 수 있다.

**개발팀/운영팀 간에 의사소통**은 일급 컬렉션으로 할 수 있다.

### 4. ~~컬렉션의 불변성을 보장~~

> 일급 컬렉션을 검색할 때 제일 많이 보는 글은 [일급 컬렉션 (First Class Collection)의 소개와 써야 할 이유](https://jojoldu.tistory.com/412) 일 것이다.
>
> 또한 일급컬렉션의 이점 중 하나인 **컬렉션의 값을 변경할 수 있는 메소드가 없어 불변성을 보장** 해준다는 글을 볼 수 있다. 
>
> 하지만 필자는 **컬렉션의 불변성을 보장**에서 불변이라고 **확신하지 말라**는 메시지를 전하고 싶다.

```java
public class Lotto {
    private List<LottoNumber> lotto;
    // ...
    public List<LottoNumber> getLotto() {
        return lotto;
    }
}
```

위와 같이 setter를 구현하지 않으면 불변 컬렉션이 된다. *(라는 글을 많이 보았을 것이다.)*

**하.지.만!**

setter를 사용하지 않았어도 Lotto안에 있는 lotto 변수에 변화를 줄 수 있다.

```java
public class Lotto {
    private final List<LottoNumber> lotto;

    public Lotto(List<LottoNumber> lotto) {
        this.lotto = lotto;
    }

    public List<LottoNumber> getLotto() {
        return lotto;
    }
}

public class LottoNumber {
    private final int lottoNumber;

    public LottoNumber(int lottoNumber) {
        this.lottoNumber = lottoNumber;
    }
    
    // toString()은 로그를 찍기 위함이다.
    @Override
    public String toString() {
        return "LottoNumber{" +
                "lottoNumber=" + lottoNumber +
                '}';
    }
}
```

위와 같은 코드가 있다고 가정하자.

```java
@Test
public void lotto_변화_테스트() {
    List<LottoNumber> lottoNumbers = new ArrayList<>();
    lottoNumbers.add(new LottoNumber(1));
    Lotto lotto = new Lotto(lottoNumbers);
    lottoNumbers.add(new LottoNumber(2));
}
```

이런 상황이면 lotto를 get했을때 어떤 값을 가지고 있을까?

정답은 `[LottoNumber{lottoNumber=1}, LottoNumber{lottoNumber=2}]`이다.

**lottoNumbers**와 **lotto class의 멤버변수**와 주소값이 같기 때문에 영향을 받는다.

이럴 때는 다음과 같이 코드를 수정하면 된다.

```java
public class Lotto {
    private final List<LottoNumber> lotto;

    public Lotto(List<LottoNumber> lotto) {
        this.lotto = new ArrayList<>(lotto);
    }

    public List<LottoNumber> getLotto() {
        return lotto;
    }
}
```

이렇게 수정하면 멤버변수에 저장되는 주소값을 재할당하기 때문에 영향을 받지 않는다.

**하.지.만!** *(...또 있어...)*

```java
@Test
public void lotto_변화_테스트() {
    List<LottoNumber> lottoNumbers = new ArrayList<>();
    lottoNumbers.add(new LottoNumber(1));
    Lotto lotto = new Lotto(lottoNumbers);
    lotto.getLotto().add(new LottoNumber(2));
}

```

이러한 상황에도 `[LottoNumber{lottoNumber=1}, LottoNumber{lottoNumber=2}]`가 나온다.

이를 또 해결하는 방법으로

```java
public class Lotto {
    private final List<LottoNumber> lotto;

    public Lotto(List<LottoNumber> lotto) {
        this.lotto = new ArrayList<>(lotto);
    }

    public List<LottoNumber> getLotto() {
        return Collections.unmodifiableList(lotto);
    }
}
```

getter가 return될 때 **unmodifiableList**로 감싸주면 된다.

필자가 이렇게 긴 설명을 한 이유는 앞서 말했듯이 **불변성을 보장**한다고 했지만 시행착오 없이 확신하지 말하는 메시지를 전하기 위함이었다.

## 참고 링크

[일급 컬렉션 (First Class Collection)의 소개와 써야할 이유](<https://jojoldu.tistory.com/412>)

[First Class Collection](<https://wickso.me/java/first-class-collection/>)