---
layout : post
title : "일급 컬렉션을 사용하는 이유"
author : "티거"
comment: "true"
tags: ["object-calisthenic"]
toc: true
---

## 일급 컬렉션이란?

> 본 글은 [일급 컬렉션 (First Class Collection)의 소개와 써야할 이유](<https://jojoldu.tistory.com/412>)를 참고 했다.
>
> 일급 컬렉션이란 단어는 소트웍스 앤솔로지의 [객체지향 생활체조 규칙 8. 일급 콜렉션 사용](<https://developerfarm.wordpress.com/2012/02/01/object_calisthenics_/>)에서 언급되었다.

**Collection을 Wrapping**하면서, **Wrapping한 Collection 외 다른 멤버 변수가 없는 상태**를 일급 컬렉션이라 한다.

이게 무슨 말일까?

먼저 **Collection을 Wrapping한다**의 의미는 아래 코드를

```java
public class Person {
    private String name;
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
    private Cars cars;
    // ...
}

// List<Car> cars를 Wrapping
// 일급 컬렉션
public class Cars {
    // 멤버변수가 하나 밖에 없다!!
    private List<Car> cars;
    // ...
}

public class Car {
    private String name;
    private String oil;
    // ...
}
```

위의 코드를 보면 눈치챘겠지만 일급 컬렉션은 **그(*List\<Car\> cars*) 외 다른 멤버 변수가 없다.**

이것이 **일급 컬렉션!!**

## 왜 사용하지?

> 필자가 느낀 일급 컬렉션의 이점을 말해보겠다.

GS편의점에 아이스크림을 팔고 있다.

```java
// GSConvenienceStore.class
public class GSConvenienceStore {
    // 편의점에는 여러 개의 아이스크림을 팔고 있을 것이다.
    private List<IceCream> iceCreams;
    
    public GSConvenienceStore(List<IceCream> iceCreams) {
        this.iceCreams = iceCreams;
    }
    ...
}

// IceCream.class
public class IceCream {
    private String name;
    ...
}
```

특이하게도 해당 편의점은 아이스크림의 종류를 10가지 이상 팔지 못한다고 한다.

그러면 우리는 `List<IceCream> iceCreams`의 size가 10이 넘으면 안되는 검증이 필요할 것이다.

```java
// GSConvenienceStore.class
public class GSConvenienceStore {
    private List<IceCream> iceCreams;
    
    public GSConvenienceStore(List<IceCream> iceCreams) {
        validateSize(iceCreams)
        this.iceCreams = iceCreams;
    }
    
    private void validateSize(List<IceCream> iceCreams) {
    	if (iceCreams.size() >= 10) {
            new throw IllegalArgumentException("아이스크림은 10개 이상의 종류를 팔지 않습니다.")
        }
    }
    // ...
}
```

흠...그래서..? 뭐가 문제지?

**말해주겠다!!**

1. 만약 아이스크림뿐만 아니라 과자, 라면 등 여러 가지가 있다고 가정해보자. 

   - 모든 검증을 **GSConvenienceStore class**에서 할 것인가?

     ```java
     validate아이스크림(아이스크림);
     validate과자(과자);
     validate라면(라면);
     // ...
     ```

   - 만약 **CUConvenienceStore class**에서도 동일한 것을 판다면 **GSConvenienceStore class**에서 했던 검증을 또 사용할 것인가?

     ```java
     // GSConvenienceStore.class
     public class GSConvenienceStore {
         private List<IceCream> iceCreams;
         private List<Snack> snacks;
         private List<Noodle> Noobles;
         
         public GSConvenienceStore(List<IceCream> iceCreams ...) {
             validate아이스크림(아이스크림);
             validate과자(과자);
             validate라면(라면);
             // ...
         }
         // ...
     }
     
     // CUConvenienceStore.class
     public class CUConvenienceStore {
         private List<IceCream> iceCreams;
         private List<Snack> snacks;
         private List<Noodle> Noobles;
         
         public CUConvenienceStore(List<IceCream> iceCreams ...) {
             validate아이스크림(아이스크림);
             validate과자(과자);
             validate라면(라면);
             // ...
         }
         // ...
     }
     ```

2. `List<IceCream> iceCreams`의 원소 중에서 하나를 **find**하는 메서드를 만든다고 가정해보자.

   - **GSConvenienceStore class**와 **CUConvenienceStore class** 같은 메서드(*find*)를 두번 구현할 것인가?

     ```java
     // GSConvenienceStore.class
     public class GSConvenienceStore {
         private List<IceCream> iceCreams;
         // ...
         public IceCream find(String name) {
             return iceCreams.stream()
                 .filter(iceCream::isSameName)
                 .findFirst()
                 .orElseThrow(RuntimeException::new)
         }
         // ...
     }
     
     // CUConvenienceStore.class
     public class CUConvenienceStore {
         private List<IceCream> iceCreams;
         // ...
         public IceCream find(String name) {
             return iceCreams.stream()
                 .filter(iceCream::isSameName)
                 .findFirst()
                 .orElseThrow(RuntimeException::new)
         }
         // ...
     }
     ```

이럴 경우 편의점 **class의 역할**이 무거워 지고, **중복코드**가 많아진다.

이것을 해결해주는 것이 **일.급.컬.렉.션**이다.

**상태와 행위**을 각각 관리할 수 있다.

아이스크림을 일급 컬렉션으로 만들어 보자.

```java
// IceCream.class
public class IceCreams {
    private List<IceCream> iceCreams;
    
    public IceCreams(List<IceCream> iceCreams) {
        validateSize(iceCreams)
        this.iceCreams = iceCreams
    }
    
    private void validateSize(List<IceCream> iceCreams) {
    	if (iceCreams.size() >= 10) {
            new throw IllegalArgumentException("아이스크림은 10개 이상의 종류를 팔지않습니다.")
        }
    }
    
    public IceCream find(String name) {
        return iceCreams.stream()
            .filter(iceCream::isSameName)
            .findFirst()
            .orElseThrow(RuntimeException::new)
    }
    // ...
}
```

그럼 편의점 class는 어떻게 달라질까?

```java
// GSConvenienceStore.class
public class GSConvenienceStore {
    private IceCreams iceCreams;
    
    public GSConvenienceStore(IceCreams iceCreams) {
        this.iceCreams = iceCreams;
    }
    
    public IceCream find(String name) {
        return iceCreams.find(name);
    }
    // ...
}

// CUConvenienceStore.class
public class CUConvenienceStore {
    private IceCreams iceCreams;
    
    public CUConvenienceStore(IceCreams iceCreams) {
        this.iceCreams = iceCreams;
    }
    
    public IceCream find(String name) {
        return iceCreams.find(name);
    }
    // ...
}

// 만약 find메서드 중복되는 것이 신경쓰인다면 부모 클래스를 만들어 상속을 사용하세용:)
```

어떠한가!

느낌이 오는가?

과자랑 라면 등이 생겨도 **검증**은 **과자의 일급 컬렉션**과 **라면의 일급 컬렉션**이 해줄 것이다.

그리고 편의점 class가 했던 역할을 아이스크림, 과자, 라면 등 각각에게 **위임**하여 **상태와 로직을 관리**할 것이다.

**정리한다!!**

**일급 컬렉션**을 사용하면 **상태과 로직을 따로 관리**할 수 있기 때문에 로직이 사용되는 **클래스의 부담**을 줄일 수 있고, **중복코드**를 줄일 수 있다. 

---

## ~~컬렉션의 불변성을 보장~~

일급 컬렉션을 검색할 때 제일 많이 보는 글은 [일급 컬렉션 (First Class Collection)의 소개와 써야 할 이유](https://jojoldu.tistory.com/412) 일 것이다. 이점 중 하나인 **컬렉션의 값을 변경할 수 있는 메소드가 없어 불변성을 보장** 해준다는 글을 볼 수 있다. 

하지만 필자는 **일급컬렉션**은 **불변성을 보장하지 않으며, 보장하도록 구현해야 할 필요는 없다**는 메시지를 전하고 싶다. 아랫글에서 **왜 불변성을 보장할 필요가 없는지**, **왜 불변이 아닌지**, **만약 불변으로 만들고 싶다면 어떻게 해야하는지** 설명하겠다.

**왜 불변성을 보장할 필요가 없는지**를 **Object Calisthenics**의 내용의 일부를 가져와 설명하겠다.

> The ThoughtWorks Anthology의 Chapter 6 - Object Calisthenics by Jeff Bay, Technology Principal
>
> Rule 8: Use First-Class Collections
>
> The application of this rule is simple: any class that contains a collection should contain no other member variables. Each collection gets wrapped in its own class, so now behaviors related to the collection have a home. You may ﬁnd that ﬁlters become part of this new class. Filters may also become function objects in their own right. Also, your new class can handle activities such as joining two groups together or applying a rule to each element of the group. This is an obvious extension of the rule about instance variables but is important for its own sake as well. A collection is really a type of very useful primitive. It has many behaviors but little semantic intent or clues for either the next programmer or the maintainer

일급 컬렉션 사용의 Rule을 보면 [여기](#일급-컬렉션이란)에서 설명한 내용과 동일하다. 또한, [위](#왜-사용하지)에서 설명한 이점을 위해 사용하는 것이지 "일급컬렉션은 불변으로 만들어야 한다.", "일급컬렉션의 이점은 불변이다."라는 내용을 언급하고 있지 않다. 다시 말해 **일급 컬렉션이 주는 기능의 핵심은 불변이 아니다.**

이번에는 일급컬렉션이 **왜 불변이 아닌지**와 **만약 불변으로 만들고 싶다면 어떻게 해야하는지**를 알아보자.

```java
public class Lotto {
    private final List<LottoNumber> lotto;
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

Lotto class의 맴버변수인 **lotto**가 파라미터로 받은 **lottoNumbers**의 영향을 받지 않기 위해서는 다음과 같이 수정하면 된다.

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

이를 해결하는 방법으로 **unmodifiableList** 사용한다.

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

**unmodifiableList**를 사용하면 lotto는 불변이 되고, getter로 return해서 사용될 때 변경이 불가능하다.

---

## 참고

[일급 컬렉션 (First Class Collection)의 소개와 써야할 이유](<https://jojoldu.tistory.com/412>)

[The Thoughtworks Anthology](https://www.amazon.com/ThoughtWorks-Anthology-Technology-Innovation-Programmers/dp/193435614X)