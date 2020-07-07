---
layout: post
title: "정적 메소드, 너 써도 될까?"
author: "오렌지"
comment: "true"
tags: ["static", "static-factory-method", "static-method", "OOP"]
---

`static variable, static method, static class...` static이 붙은 녀석들은 JVM이 시작될 때  Method(static) 영역에 저장된다. 그리고 프로그램이 끝날 때 까지 사라지지 않고 메모리에 남아있다. (자바 기준)

이번 글에서는 그 중에서도 정적 메소드(static method)에 대해 이야기 해 보려고 한다.
우선, 정적 메소드에 대해 학습이 필요한 경우에는 [정적 메소드와 인스턴스 메소드](https://www.geeksforgeeks.org/static-methods-vs-instance-methods-java/)를 참고하길 바란다.




### `static method`, 속도가 빨라지고 공유(반복적인 사용)에 효율적이다.

다음은 로또 미션 코드 중, 무작위로 6개의 로또 번호를 생성하는 클래스이다.
```java
public class LottoNumberFactory {
    private static final int MIN_LOTTO_NUMBER = 1;
    private static final int MAX_LOTTO_NUMBER = 45;
    private static final int LOTTO_LENGTH = 6;

    private static List<LottoNumber> lottoNumbers = new ArrayList<>();

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



### `static method`, 메모리 효율이 떨어질 수 있고, 객체지향에서 멀어진다.

이 글을 읽고 있는 사람이라면 아마 자바를 사용하는 사람일 것이고, 객체지향적인 설계를 할 것이다.
`static` 은 객체지향보다는 절차지향에 가까운 키워드다.
static 키워드는 C의 전역 변수/함수와 성격이 비슷하다. 정적 메소드는 객체의 생성, 제거와 관계 없이 프로그램 시작부터 끝날 때 까지 메모리에 남아있기 때문이다.



앞에서 말했다시피 정적 메소드는 객체의 생성주기와 관계가 없다. 이런 점에서 정적메소드는 객체지향의 **메시지 전달(message passing)**[^1]을 위반한다. 
객체지향에서는, 객체들은 서로 관계를 맺고 메시지를 통해 정보를 교환하고 결과를 반환한다. 정적 메소드를 실행하는 것은 객체에게 행위를 시키는 게 아니다. 다른 객체와 관계를 맺고 있지도 않다. 
즉, 메시지 전달이 아니라 (절차지향의) 함수 호출에 불과하다.

또한, 정적 메소드는 객체지향의 특징인 다형성을 위반한다.
재사용성이 떨어진다. 정적 메소드는 오버라이딩이 불가능하여 인터페이스를 구현하는 데 사용할 수 없기 때문이다.



1. static method 가 oop를 해치는 이유에 대해 설명
2. gc의 대상이 아니다.



그럼 아예 쓰지 말라는건가? 장점도 있을 거 아닌가?
static method의 올바른 사용,
정적 팩터리 메서드에 관한 보스독의 링크 첨부





결론적으로, 필자는 정적 메소드를 쓰라고 하지도 않을거고, 사용하지 말라고 하지도 않을 것이다.
판단은 **당신**에게 맡기겠다!



[^1]: 한 객체에서 다른 객체로 데이터를 전달하거나, 다른 객체의 메소드를 실행시키는 것.
[^2]: 객체의 속성(data fields)과 행위(메서드, methods)를 하나로 묶고, 실제 구현 내용 일부를 외부에 감추어 은닉하는 것이다.



[Why are static variables considered evil?](https://stackoverflow.com/questions/7026507/why-are-static-variables-considered-evil%22)