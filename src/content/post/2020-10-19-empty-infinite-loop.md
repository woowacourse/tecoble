---
layout: post  
title: 몸체가 비어있는 무한 루프
author: [둔덩]
tags: ['loop']
date: "2020-10-19T12:00:00.000Z"
draft: false
image: ../teaser/loop.png
---

2018년 자바 입문서 한 권을 다 읽고 고수가 된 마음으로 소켓 프로그래밍 퀴즈 게임을 만든 적이 있었다. 최근에 그때의 난 어떤 코드를 작성했을까.. 하고 코드를 살펴보다가 그 당시 나를 며칠 동안 괴롭혔던 문제에 관한 기억이 떠올랐다. 이번 글은 그 당시 겪었던 문제에 관한 경험을 공유하고자 한다.

로직 자체를 왜 저렇게 짰는지보단 문제 자체를 봐주시고 가벼운 마음으로 읽어주셨으면 좋겠다..😅

---

## 상황

소켓을 연결하기 위해서는 사용자 IP가 필요했는데 UI에 입력받은 IP로 소켓을 연결하고 싶었다.

UI는 자바 swing을 사용했고 사용자가 UI에 IP를 입력하면 등록된 이벤트 메서드가 호출되면서 User 객체의 인스턴스 변수 IP를 초기화했다. 간단하게 재연한 코드를 살펴보자.

```java
public class IntroFrame extends JFrame {

    public IntroFrame(User user) {
        JTextField ipField = new JTextField();
        JButton okButton = new JButton();
        okButton.addActionListener((actionEvent) -> { 
            String inputIp = ipField.getText()
            user.setIp(inputIp);
            ...
        });
        ...
    }
}
```

그리고 Client 역할인 main 메서드에서는 UI를 그리고서 사용자가 IP를 입력할 때까지 기다리기 위한 목적으로 while 문을 돌았다. 코드를 살펴보자.

```java
public static void main(String[] args) {
    User user = new User();
    IntroFrame introFrame = new IntroFrame(user);

    while (user.isIpEmpty()) {    // 사용자의 IP 입력을 기다림
    }

    log.info("User IP 입력 완료, 소켓 연결을 시작합니다.");
    // 서버 소켓과 연결 작업
}
```

그 당시 예상했던 흐름을 다시 정리하면 UI에 사용자가 IP를 입력하면 돌고있던 while 문의 조건이 false가 되고 while 문에서 빠져나와 입력받은 IP로 소켓 연결을 하는 흐름이었다.

---

## 문제

아무리 IP를 UI에 입력해도 소켓이 연결되지 않았다. 어떠한 에러를 반환하지도 않고 소켓 연결을 시도하지도 않았다. 그냥 프로그램이 멈춘 듯한 증상이었다. 코드를 보자마자 눈치챈 사람도 있겠지만 위에서 보여줬던 코드에는 문제가 있었다. 바로 몸체가 비어있는 while 문이다.

```java
while (user.isIpEmpty()) {
}
```

IP를 입력하면 while 문의 조건이 false가 되면서 빠져나오지만, 초기엔 while 문의 조건이 true인 무한 루프이다. 계속해서 돌지만 몸체가 비어있어서 아무것도 하지 않기에 JVM의 최적화 컴파일러 및 JIT 컴파일러에 의해 제거당한 것이다.

이 문제가 발생했을 당시 디버깅할 때는 문제 없이 잘 실행이 돼서 원인을 파악하는 것도 오래 걸렸었다. 자세히는 모르지만 JIT 컴파일러는 런타임 중에 자주 사용되는 로직을 최적화를 하므로 디버깅할 때는 원인을 파악할 수 없는 것으로 생각했다.

결론적으로 중요한 것은 몸체가 비어있는 무한 루프를 만든다면 JVM의 최적화 컴파일러 및 JIT 컴파일러에 의해 루프가 제거당할 수 있다는 것이다.

---

## 해결 방법

해결 방법 자체는 간단하다. 몸체가 비어있는 무한 루프에 의미있는 작업을 넣어주면 된다. 프로그램에 영향은 주지 않으면서 의 미있는 작업의 대표적인 예로 Thread.sleep과 Thread.yield가 있다.

```java
while (user.isIpEmpty()) {
    Thread.sleep(1000L);    // 1초 동안 현재 쓰레드를 일시 중단
}

// 또는 

while (user.isIpEmpty()) {
    Thread.yield();    // 실행 중인 쓰레드가 동일 또는 높은 우선순위 쓰레드에게 우선순위를 양보
}
```

이렇게 의미 있는 작업을 넣어두면 최적화돼서 프로그램에 예상치 못한 영향을 주는 일은 없을 것이다.

참고로 Thread.sleep은 지정된 시간 동안 현재 쓰레드를 일시 중단하는 메서드이고 Thread.yield는 실행 중인 쓰레드가 동일 또는 높은 우선순위 쓰레드에게 우선순위를 양보하는 메서드이다. 상황에 맞게 적절한 메서드를 사용하면 된다. 저 당시에는 다른 동작하는 쓰레드가 없었기에 Thread.sleep 메서드로 문제를 해결했었다.

---

## 결론

무한 루프가 될 가능성이 있는 루프 자체를 작성하지 않는 것이 베스트이다. 하지만 상황에 따라 필요한 경우가 있을 수도 있는데 그때 루프의 몸체를 비워두어서 필자처럼 고생하는 일은 없었으면 좋겠다.

---

### 참고 자료

-   [Do not use an empty infinite loop](https://wiki.sei.cmu.edu/confluence/display/java/MSC01-J.+Do+not+use+an+empty+infinite+loop)