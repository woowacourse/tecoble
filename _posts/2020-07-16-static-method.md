---
layout: post
title: "정적 메소드, 너 써도 될까?"
author: "오렌지"
comment: "true"
tags: ["static", "static-factory-method", "static-method", "OOP"]
toc: true
---

`static variable, static method, static class...` static이 붙은 녀석들은 JVM이 시작될 때  Method(static) 영역에 저장된다. 그리고 프로그램이 끝날 때까지 사라지지 않고 메모리에 남아있다. (자바 기준)

이번 글에서는 그중에서도 정적 메소드(static method)에 대해 이야기해 보려고 한다.
우선, 정적 메소드에 대해 학습이 필요한 경우에는 [정적 메소드와 인스턴스 메소드](https://www.geeksforgeeks.org/static-methods-vs-instance-methods-java/)를 참고하길 바란다.




## `static method`, 속도가 빨라지고 공유(반복적인 사용)에 효율적이다.

다음은 로또 미션 코드 중, 무작위로 6개의 로또 번호를 생성하는 클래스이다.
```java
public class LottoNumberFactory {
    private static final int MIN_LOTTO_NUMBER = 1;
    private static final int MAX_LOTTO_NUMBER = 45;
    private static final int LOTTO_LENGTH = 6;

    private static List<LottoNumber> lottoNumbers = new ArrayList<>();

    //45개의 로또 숫자 초기화
    static {
        for (int i = MIN_LOTTO_NUMBER; i <= MAX_LOTTO_NUMBER; i++) {
            lottoNumbers.add(new LottoNumber(i));
        }
    }

    public static List<LottoNumber> createLottoNumbers() {
        List<LottoNumber> lotto = new ArrayList<>();
        Collections.shuffle(lottoNumbers);
        for (int i = 0; i < LOTTO_LENGTH; i++) {
            lotto.add(lottoNumbers.get(i));
        }
        return lotto;
    }
}
```
`createLottoNumbers()` 메소드는 6개의 당첨번호를 추첨할 때, 그리고 자동으로 로또를 구입할 때 호출된다.
static으로 선언되어 있으므로 메소드를 사용할 때 마다 반복적으로 LottoNumberFactory객체를 생성해 줄 필요 없다. 생성자를 호출할 필요가 없으니 당연히 속도도 빨라질 수밖에 없다. 
위 메소드를 호출하기 위해 필요한 것은 단지 클래스 이름과 메소드 이름뿐이다.

*오, 그러면 객체의 멤버변수에 접근할 필요가 없는 메소드는 static을 붙이는 게 당연히 효율적이겠네?*





## `static method`, 객체 지향에서 멀어지고, 메모리 효율이 떨어질 수 있다.

### 1. 객체 지향에서 멀어진다.
이 글을 읽고 있는 사람이라면 아마 자바를 사용하는 사람일 것이고, 객체 지향적인 설계를 할 것이다.
`static` 은 객체 지향보다는 절차 지향에 가까운 키워드다.
static 키워드는 C의 전역 변수/함수와 성격이 비슷하다. 정적 메소드는 객체의 생성, 제거와 관계없이 프로그램 시작부터 끝날 때까지 메모리에 남아있기 때문이다.





### Polymorphism


#### Message passing
앞에서 말했다시피 정적 메소드는 객체의 생성주기와 관계가 없다. 이런 점에서 정적메소드는 객체 지향의 **메시지 전달(message passing)**[1]을 위반한다. 
객체 지향에서는, 객체들은 서로 관계를 맺고 메시지를 통해 정보를 교환하고 결과를 반환한다. 정적 메소드를 실행하는 것은 객체에게 행위를 지시하는 것이 아니다. 다른 객체와 관계를 맺고 있지도 않다. 
즉, 메시지 전달이 아니라 (절차 지향의) 함수 호출에 불과하다고 할 수 있다.



#### Overriding과 Dynamic Binding

다음은 객체지향의 큰 특징 중 하나인 다형성을 활용한 간단한 예시이다. 

```java
public abstract class WoowaTechCrew {
    public void hello() {
        System.out.println("안녕하세요.");
    }
}

public class Orange extends WoowaTechCrew {
    @Override
    public void hello() {
        System.out.println("하이요!");
    }
}

public class Kafka extends WoowaTechCrew {
    @Override
    public void hello() {
        System.out.println("안녕하쎄요~");
    }
}

// main
public static void main(String[] args) {
    WoowaTechCrew orange = new Orange();
    WoowaTechCrew kafka = new Kafka();
    orange.hello();
    kafka.hello();
}
```
메인 실행 결과는 예상하다시피 `안녕하세요.` 가 아닌
```
하이요!
안녕하쎄요~
```
가 된다.
간단히 말해 다형성은 *같은 타입으로 묶을 수 있는 여러 객체에게 동일한 명령을 내리면 각 객체에 맞는 다른 일을 수행*하는 것이다.

정적 메소드는 불가능하다. 즉, 객체 지향의 특징인 **다형성**을 위반한다.
**Overriding(메소드 재정의)**과 **Dynamic Binding(동적 바인딩)**[2]이 불가능하기 때문이다. 그러나 정적 메소드는 오버라이딩이 불가능하다. 그래서 인터페이스를 구현하는 데 사용할 수도 없다.
이는, 정적 메소드는 런타임 이전 컴파일 시에 정적 바인딩이 이루어지기 때문이다.


설명한 사항들 외에도 static 키워드는 객체 지향의 캡슐화 등도 위반한다.
즉, 객체 지향의 관점에서는 정적메소드를 환영하지 않을 수밖에 없다.



### 2. 메모리 효율이 떨어질 수 있다.

정적 메소드는 객체를 생성하지 않고 사용한다. 
반복적으로 객체를 생성하지 않아도 되니 메모리 효율에 좋을 것 같다는 생각이 들 수도 있다.

그러나, 런타임 중 동적으로 생성된 것들은 **GC(Garbage Collection)**[3]의 대상이 되는 반면, static 키워드가 붙은 메소드 등은 GC의 대상이 아니다.
GC는 동적으로 할당된 메모리만을 대상으로 한다. 정적으로 할당된 static 영역은 GC의 대상이 아니다.
static으로 할당된 영역이 크다면 GC의 효율이 떨어지기 마련이며, 프로그램이 끝날 때까지 그 영역은 메모리에서 내릴 수 없다. 
즉, static 영역이 지나치게 많은 메모리를 차지하고 있다면 메모리가 부족한 현상이 발생할 수 있다.





## 쓰라는 거야 말라는 거야?
static을 아예 쓰지 말라는 말처럼 들릴 수 있다.
그러나 앞서 밝혔던 장점도 있을뿐더러,
[정적 팩터리 메서드](https://woowacourse.github.io/javable/2020-05-26/static-factory-method)를 활용하면 정적 메소드를 효율적으로 사용할 수도 있다.


결론적으로, 필자는 정적 메소드를 쓰라고 하지도 않을 거고, 사용하지 말라고 하지도 않을 것이다.
당연한 이야기이지만 속한 집단에서 사용하는 방식을 따르는 게 가장 바람직하다.
판단은 **당신**에게 맡기겠다!


 


[1]: 한 객체에서 다른 객체로 데이터를 전달하거나, 다른 객체의 메소드를 실행시키는 것.

[2]: 후기 바인딩, 동적 바인딩 또는 동적 연결은 객체에 대해 호출되는 메소드 또는 인수와 함께 호출되는 함수를 런타임에 이름별로 찾는 컴퓨터 프로그래밍 메커니즘.

[3]:  프로그래머가 동적으로 할당한 메모리 영역 중 더 이상 쓰이지 않는 영역을 자동으로 찾아내어 해제하는 기능



## 참고 링크

[Why are static variables considered evil?](https://stackoverflow.com/questions/7026507/why-are-static-variables-considered-evil%22)
[객체지향에 대한 설명](https://vandbt.tistory.com/10)