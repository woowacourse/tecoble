---

layout: post  
title: "상속보다는 조합(Composition)을 사용하자."  
author: "둔덩"

---

우리는 다양한 이유로 상속을 사용한다.

1.  코드를 재사용함으로써 중복을 줄일 수 있다.
2.  변화에 대한 유연성 및 확장성이 증가한다.
3.  개발 시간이 단축된다.

하지만, 상속의 장점들은 상속을 적절히 사용했을 경우에만 해당한다.  
상속을 잘못 사용하면 변화에 유연하지 않고, 오류를 내기 쉬운 소프트웨어가 된다.

---

## 상속의 단점 : 캡슐화를 깨뜨린다.

> 캡슐화: 만일의 상황(타인이 외부에서 조작)에 대비해 외부에서 특정 속성이나 메서드를 사용할 수 없도록 숨겨놓는 것.

상위 클래스의 구현이 하위 클래스에게 노출되는 상속은 캡슐화를 깨뜨린다.  
캡슐화가 깨짐으로써 하위 클래스가 상위 클래스에 강하게 결합, 의존하게 되고  
강한 결합, 의존은 변화에 유연하게 대처하기 어려워진다.

예제를 통해 살펴보자.

생산을 담당하는 `Production` 클래스가 있다.

```java
public abstract class Production {
    protected int count;

    protected Production() {
        this.count = 0;
    }

    abstract protected void produce(int productionNumber);
}
```

`Production` 클래스에서는, 현재 생산량을 나타내는 인스턴스 변수 count를 가지고 있고  
추상 메서드인 `produce`를 가지고 있다.

다음으로 `Production` 클래스를 상속하는 `CarProduction` 클래스를 보자.

```java
public class CarProduction extends Production {

    public CarProduction() {
        super();
    }

    @Override
    protected void produce(int productionNumber) {
        super.count += productionNumber;
    }
}
```

`CarProduction` 클래스에서는, 상위 클래스의 추상 메서드인 `produce`메서드를 재정의하고 있다.  
`produce` 메서드가 호출되면 인자로 받은 `productionNumber`만큼 count를 증가시킨다.

이런 구조에서 `Production` 클래스의 인스턴스 변수인 count를 `int`가 아닌 `Count`라는 객체로 포장하면 어떻게 될까?

```java
public abstract class Production {
    // protected int count;
    protected Count count;
    ...
}    
```

당연히 `CarProduction` 클래스에서 재정의한 `produce` 메서드가 깨지게 된다.

```java
// 오류가 발생한다.
@Override
protected void produce(int productionNumber) {
    super.count += productionNumber;
}
```

즉, `Production` 클래스를 상속한 하위 클래스가 몇 개가 있든 전부 깨지게 되는 것이다.  
그리고 해결법은 모든 하위 클래스에서 일일이 수정을 해주는 방법뿐이다.

이처럼 상속은 하위 클래스가 상위 클래스에 강하게 의존, 결합하기 때문에 변화에 유연하게 대처하기 어려워진다.  
상속구조가 깊으면 깊을수록 그 문제점은 더욱 심화한다.

## 조합(Composition)을 사용하자.

> 조합(Composition): 기존 클래스가 새로운 클래스의 구성요소로 쓰인다.  
> 새로운 클래스를 만들고 private 필드로 기존 클래스의 인스턴스를 참조한다.

로또 번호를 가지고 있는 `Lotto` 클래스와  
당첨된 로또 번호와 보너스 번호를 가지고 있는 `WinningLotto` 클래스가 있다.

```java
public class Lotto {
    protected List<Integer> lottoNumbers;
    ...
}
```

```java
public class WinningLotto extends Lotto{
    private BonusBall bonusBall;
    ...
}
```

이 두 클래스를 상속 구조로 설계하는게 옳은 방향일까?

만약 `Lotto` 클래스의 요구사항이 변경돼서 인스턴스 변수인 `protected List<Integer> lottoNumbers`가  
`protected int[] lottoNumbers`로 바뀐다고 가정해보자.
당연히 하위 클래스인 `WinningLotto`에서 상위 클래스인 `Lotto`의 `lottoNumbers`를 사용한 부분은 전부 깨질 것이다.

상위 클래스의 변화에 하위 클래스가 영향을 받는 것이다.

다음은 조합(Composition)을 사용한 방식을 살펴보자.

```java
public class WinningLotto {
    private Lotto lotto;
    private BonusBall bonusBall;
}
```

`WinningLotto` 클래스에서 인스턴스 변수로 `Lotto` 클래스를 가지는 것이 조합(Composition)이다.  
`WinningLotto` 클래스는 `Lotto` 클래스의 메서드를 호출하는 방식으로 동작하게 된다.

**조합(Composition)을 사용하면?**

1.  메서드를 호출하는 방식으로 동작하기 때문에 캡슐화를 깨뜨리지 않는다.
2.  Lotto 클래스 같은 기존 클래스의 변화에 영향이 적어지며, 안전하다.

만약 `Lotto` 클래스의 인스턴스 변수인 `protected List<Integer> lottoNumbers`가  
`protected int[] lottoNumbers`로 바뀌어도 영향을 받지 않는다.

즉, 상속의 문제점들에서 벗어날 방법이다.

---

## 결론

캡슐화를 깨뜨리고, 상위 클래스에 의존하게 돼서 변화에 유연하지 못한 상속을 사용하기보다는 조합(Composition)을 사용하자.

하지만 조합(Composition)이 상속보다 무조건 좋다는 것은 아니다.  
상속이 적절하게 사용되면 조합보다 강력하고, 개발하기도 편리하다.

단, 상속이 적절하게 사용되려면 최소 다음과 같은 조건을 만족해야 한다.

1.  확장을 고려하고 설계한 확실한 is - a 관계일 때
2.  API에 아무런 결함이 없는 경우, 결함이 있다면 하위 클래스까지 전파돼도 괜찮은 경우

![상속 예제 이미지](../images/inheritance-example.png)

위와 같은 경우가 확실한 is - a 관계라고 생각한다.

```java
public class 포유류 extends 동물 {

    protected void 숨을쉬다() {
        ...
    }

    protected void 새끼를낳다() {
        ...
    }
}
```

포유류가 동물이라는 사실은 변할 가능성이 거의 없고,  
포유류가 숨을쉬고 새끼를 낳는다는 행동이 변할 가능성은 거의 없다.

이처럼 확실한 is - a 관계의 상위 클래스는 변할 일이 거의 없다.

확실한 is - a 관계인지 곰곰이 고민해보고  
상위 클래스가 변화에 의해서 결함이 생기는 등 어떤 결함이 생겼을 경우,  
하위 클래스까지 전파돼도 괜찮은지 철저하게 확인했다면  
상속을 사용해도 좋다고 생각한다.

사실 이런 조건을 만족한 경우에도 상속은 조합과 달리 캡슐화를 깨뜨리기 때문에 100% 정답은 없다.

확실한 건 상속을 코드 재사용만을 위한 수단으로 사용하면 안 된다.  
상속은 반드시 확장이라는 관점에서 사용해야 한다.

상황에 맞는 최선의 방법을 선택하면 된다. 다만, 애매할 때는 조합(Composition)을 사용하는 것이 좋다.

---

### 참고자료

-   [Effective Java 3/e](http://www.yes24.com/Product/Goods/65551284) item 18 - 상속보다는 컴포지션을 사용하라.