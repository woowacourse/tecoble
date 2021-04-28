---
layout: post  
title: 의존관계 주입(Dependency Injection) 쉽게 이해하기
author: [완태]
tags: ['java']
date: "2021-04-27T12:00:00.000Z"
draft: false
image: ../teaser/dependency-injection.jpg
---

 이번 글에서는 DI(의존성 주입, 의존관계 주입)의 개념을 설명한다. DI란 용어가 주는 위압감과 부담감 때문에 이해를 미뤄뒀거나, 처음 접하는 분들이 쉽게 이해할 수 있도록 쉽게 설명하고자 한다.

---


## DI 란 무엇인가
**DI**는 **Dependency Injection**의 줄임말로, 다양한 우리 말 번역이 있지만, 이 글에서는 **의존관계 주입**이라는 말로 사용하고자 한다. 

먼저 Dependency, 의존관계에 대해 알아보자.

---

### Dependency 의존관계란 무엇인가?

"A가 B를 의존한다."는 표현은 어떤 의미일까? 추상적인 표현이지만, 토비의 스프링에서는 다음과 같이 정의한다.

`의존대상 B가 변하면, 그것이 A에 영향을 미친다.`

즉, B의 기능이 추가 또는 변경되거나 형식이 바뀌면 그 영향이 A에 미친다. 

다음의 햄버거 가게 요리사 예시를 보며 설명을 계속하겠다.


`햄버거 가게 요리사는 햄버거 레시피에 의존한다.` 햄버거 레시피가 변화하게 되었을 때, 변화된 레시피에 따라서 요리사는 햄버거 만드는 방법을 수정해야 한다. 레시피의 변화가 요리사의 행위에 영향을 미쳤기 때문에, **"요리사는 레시피에 의존한다"**고 말할 수 있다. 코드로 표현해보면 다음과 같다.

```java
class BurgerChef {
    private HamBurgerRecipe hamBurgerRecipe;

    public BurgerChef() {
        hamBurgerRecipe = new HamBurgerRecipe();        
    }
}
```
---

### 의존관계를 인터페이스로 추상화하기

위 BurgerChef 예시를 보자. 지금의 구현에서는 HamBurgerRecipe만을 의존할 수 있는 구조로 되어있다. 더 다양한 BurgerRecipe를 의존 받을 수 있게 구현하려면 `인터페이스로 추상화`해야 한다. 

다음의 코드에서 볼 수 있듯이, 다양한 버거들의 레시피에 의존할 수 있는 BurgerChef가 된다.

```java
class BurgerChef {
    private BurgerRecipe burgerRecipe;

    public BurgerChef() {
        burgerRecipe = new HamBurgerRecipe();
        //burgerRecipe = new CheeseBurgerRecipe();
        //burgerRecipe = new ChickenBurgerRecipe();
    }
    //인터페이스 BurgerRecipe를 구현한 Ham Cheese Chicken 버거 레시피
}
```

의존관계를 인터페이스로 추상화하게 되면, 더 다양한 의존 관계를 맺을 수가 있고, 실제 구현 클래스와의 관계가 느슨해지고, 결합도가 낮아진다.

---

### 그렇다면 Dependency Injection은?
 의존관계가 무엇인지에 대해, 그리고 다양한 의존관계를 위해 인터페이스로 추상화함을 알아봤다. 그렇다면, **Dependency Injection**은 무엇인가?

지금까지의 구현에서는 BurgerChef 내부적으로 의존관계인 BurgerRecipe가 어떤 값을 가질지 직접 정하고 있다. 만약 어떤 BurgerRecipe를 만들지를 버거 가게 사장님이 정하는 상황을 상상해보자. 즉, BurgerChef가 의존하고 있는 BurgerRecipe를 외부(사장님)에서 결정하고 주입하는 것이다.

이처럼 그 의존관계를 외부에서 결정하고 주입하는 것이 **DI(의존관계 주입)**이다.

토비의 스프링에서는 다음의 세 가지 조건을 충족하는 작업을 의존관계 주입이라 말한다.

> - 클래스 모델이나 코드에는 런타임 시점의 의존관계가 드러나지 않는다. 그러기 위해서는 인터페이스만 의존하고 있어야 한다.
> - 런타임 시점의 의존관계는 컨테이너나 팩토리 같은 제3의 존재가 결정한다.
> - 의존관계는 사용할 오브젝트에 대한 레퍼런스를 외부에서 제공(주입)해줌으로써 만들어진다.
>
>   *- 이일민, 토비의 스프링 3.1, 에이콘(2012), p114*


#### 구현 방법
DI는 의존관계를 외부에서 결정하는 것이기 때문에, 클래스 변수를 결정하는 방법들이 곧 DI를 구현하는 방법이다.
- 생성자를 이용

```java
class BurgerChef {
    private BurgerRecipe burgerRecipe;

    public BurgerChef(BurgerRecipe burgerRecipe) {
        this.burgerRecipe = burgerRecipe;
    }
}
```

- 메소드를 이용 (대표적으로 Setter 메소드)

```java
class BurgerChef {
    private BurgerRecipe burgerRecipe = null;

    public void setBurgerRecipe(BurgerRecipe burgerRecipe) {
        this.burgerRecipe = burgerRecipe;
    }
}
```

---

## 정리
DI(의존관계 주입)는 객체가 의존하는 또 다른 객체를 외부에서 선언하고 이를 주입받아 사용하는 것이다.
자바와 관련된 서적이나, 스프링에 처음 입문하게 될 때, 자주 맞닥뜨리는 단어 DI. 용어의 늪에 빠지지 말고, 이 글을 통해 정리되었으면 한다. 


### 참고 자료
-   토비의 스프링 3.1, Vol.1
-   [DI는 IoC를 사용하지 않아도 된다](https://jwchung.github.io/DI%EB%8A%94-IoC%EB%A5%BC-%EC%82%AC%EC%9A%A9%ED%95%98%EC%A7%80-%EC%95%8A%EC%95%84%EB%8F%84-%EB%90%9C%EB%8B%A4)
-   [Ioc(DI, Service Locator...)](https://ahea.wordpress.com/2018/09/09/1754/)