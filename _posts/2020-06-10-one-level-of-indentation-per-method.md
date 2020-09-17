---
layout : post
title : "한 메서드에 오직 한 단계의 들여쓰기만"
author : "티거"
comment: "true"
tags: ["object-calisthenic"]
toc: true
---

> Object Calisthenics Rule 1: One level of indentation per method

객체지향 생활 체조의 규칙 1을 보면 **메서드당 들여쓰기 한 번**이라고 한다.

 🤔흠...왜...굳이?

[이곳](https://developerfarm.wordpress.com/2012/01/26/object_calisthenics_2/)의 말을 부분 인용하면 (...은 생략된 부분이다.)

> ... 거대한 메서드는 응집력이 떨어진다. ... 코드가 500줄짜리 괴물들로 어질러져 있으면 의욕이 꺾이기 쉽다. ... 한 메서드 안에 중첩된 제어구조가 있다면 다단계의 추상화를 코드로 짠 것이며, 고로 한 가지 이상의 일을 하고 있다는 뜻이다.
>
> 정확히 한 가지 일을 하는 메서드들로 작업을 하면 코드가 달라지기 시작한다. 애플리케이션의 각 단위가 더 작아짐에 따라 재사용의 수준은 기하급수적으로 상승하기 시작한다. ... 주어진 컨텍스트에서 단일 객체의 상태를 관리하는 3줄짜리 메서드라면 많은 다양한 컨텍스트에서 쓸 수 있다.

라고 한다.

🤔흠...그래서...?

**필자**도 글을 읽고 이해가 되지 않았다. 그래서 블로그와 사람들에게 물어보면서 생각을 정리했다. (도움을 주신 크루들에게 감사드립니다.)

정리하면 우리가 **메서드당 들여쓰기  한 번**으로 얻을 수 있는 이점은 **가독성**, **재사용**, **쉬운 버그 판별**이라고 생각한다.

한가지 예시를 보여주면서 설명하겠다.

들어온 물품들을 분류하여 편의점을 만들려고 하고 있다. 

```java
public class ConvenienceStoreFactory {
   
    public static ConvenienceStore create(List<Product> products) {
        List<IceCream> iceCreams = new ArrayList<>();
        List<Snack> snacks = new ArrayList<>();
        for (Product product : products) {
            if (product.isIceCream()) {
                iceCream.add(new IceCream(product));
            }
            if (product.isSnack()) {
                snacks.add(new Snack(product));
            }
        }
        return ConvenienceStore.of(iceCreams, snacks);
    }
}
```

들여쓰기를 두 번 사용하고 있다. 지금은 와닿지 않지만, 들여쓰기가 많아질수록 코드의 양이 기하급수적으로 많아질 수 있다. 그러면 보는 사람도 힘들고 사용하는 사람도 힘들다.

하지만 **들여쓰기 한 번**으로 리펙토링하면 어떨까?

다음 코드를 메서드 분리해보았다.

```java
public class ConvenienceStoreFactory {
    
    public static ConvenienceStore create(List<Product> products) {
        List<IceCream> iceCreams = new ArrayList<>();
        List<Snack> snacks = new ArrayList<>();
        for (Product product : products) {
            addIceCream(iceCreams, product);
            addSnack(snacks, product);
        }
        return ConvenienceStore.of(iceCreams, snacks);
    }
    
    public static void addIceCream(List<IceCream> iceCreams, Product product) {
        if (product.isIceCream()) {
            iceCreams.add(new IceCream(product));
        }
    }
    
    public static void addSnack(List<Snack> snacks, Product product) {
        if (product.isSnack()) {
            snacks.add(new Snack(product));
        }
    }
}
```

**가독성**이 좋아진 것을 느끼는가? 메서드를 분리함으로 각 메서드는 이름을 가지기 때문에 가독성이 좋아진다.

**재사용**하기 쉬워진 것을 느끼는가? `addIceCream`이나 `addSnack`같이 분리된 메서드를 재사용할 수 있게 되었다.

**버그 판별**이 쉬워진 것을 느끼는가?  들여쓰기가 많은 코드보다 들여쓰기 한 번으로 구현된 메서드는 간결하기 때문에 버그의 존재를 판별하기 쉽다.

~~또한, 필자는 **들여쓰기 한 번**을 적용하다 보면 가끔 **중복 코드를 제거**할 수 있게 되는 것을 경험한다.~~ (필자 생각이다.)

## 마무리

**The Thoughtworks Anthology**에 **Object Calisthenics Rule 1** 끝부분의 말을 인용하면서 글을 마친다.

> ... we should also point out that the more you practice applying the rules, the more the advantages come to fruition. ... There is a skill to the application of the rules – this is the art of the programmer raised to another level.
>
> ... 우리는 또한 규칙을 적용하는 연습을 많이 할수록 더 많은 이점이 결실을 맺는다는 것을 지적해야 한다. ... 규칙의 적용에는 기술이 있다 – 이것은 다른 수준으로 끌어올린 프로그래머의 기술이다. (파파고 번역)

---

### 참고자료

[더 나은 소프트웨어를 향한 9단계: 객체지향 생활 체조(2)](https://developerfarm.wordpress.com/2012/01/26/object_calisthenics_2/)

[The Thoughtworks Anthology](https://www.amazon.com/ThoughtWorks-Anthology-Technology-Innovation-Programmers/dp/193435614X)