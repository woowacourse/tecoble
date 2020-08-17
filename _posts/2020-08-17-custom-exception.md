---
layout: post
title: "custom exception을 언제 써야 할까?"
author: "우, 오렌지"
comment: "true"
tags: ["exception", "custom-exception"]
---

우아한테크코스의 두 크루인 오렌지와 우가 싸우고 있다.
왜 싸우고 있는지 알아보러 가볼까?

오렌지 : 아니 굳이 사용자 정의 예외 안 써도 됩니다!!

우 : 아닙니다!! 써야 합니다!!!

**사용자 정의 예외(Custom Exception)**에 대한 둘의 의견이 좁혀지지 않는다.
각자의 주장을 더 자세히 들어보자!

## 표준 예외를 적극적으로 사용하자!

### 1. 예외 메시지로도 충분히 의미를 전달할 수 있다.

커스텀 예외의 장점으로 예외클래스의 이름만으로 어떤 예외인지 알아보기 쉽다는 점을 꼽는다.

```java
public class UserNameEmptyException extends RuntimeException {
    public UserNameEmptyException(String message) {
    ...
    }
}
```

위 커스텀 예외의 이름만 봐도 사용자 이름의 입력값이 비어있는 경우 발생하는 예외임을 알 수 있다.
그러나, 단지 그 하나의 이유를 위해서 커스텀 예외를 만드는 것은 지나친 구현이다.
유효하지 않은 입력(인자)값에 대한 예외이므로, 자바에서 정의해 놓은 `IllegalArgumentException`을 사용하고 메시지만 예외사항에 맞게 재정의해준다면 충분히 그 의미를 파악할 수 있다.

다음은 위 코드에 대한 피드백 중 일부이다. [피드백 링크](https://github.com/woowacourse/java-blackjack/pull/4#discussion_r392656069)
![feedback](../images/2020-08-17-custom-exception-review.png)
 



### 2. 표준 예외를 사용하면 가독성이 높아진다.

인수로 부적절한 값이 들어올 때 던지는 예외인 `IllegalArgumentException`, 
일을 수행하기에 적합하지 않은 상태의 객체인 경우 던지는 예외인  `IllegalStateException`, 
요청받은 작업을 지원하지 않는 경우에 던지는 예외인 `UnsupportedOperationExceptio` 등,
우리는 이미 익숙하고, 쓰임에 대해 잘 알고있는 예외들이 많다.

이런 예외들이 아닌 처음 보는 예외들은 당연히 구체적인 쓰임을 잘 모른다.
이런 이유로 낯선 예외보다는 익숙한 예외를 마주치는 것이 당연히 가독성이 높을 수 밖에 없다.

또한, 낯선 예외를 만났을 땐, 당연하게도 그 커스텀 익셉션을 파악하는 작업이 따라온다. 이 또한 비용이 될 수 있다.

표준 예외에 대한 쓰임은 [공식문서](https://docs.oracle.com/javase/8/docs/api/?java/lang/RuntimeException.html)를 참고하면 된다.



### 3. 일일히 예외 클래스를 만들다보면 지나치게 커스텀 예외가 많아질 수 있다.

![예시 사진](../images/2020-08-17-custom-exception-exaplme.png)
위 사진처럼 domain 디렉토리 내에는 다양한 디렉토리들이 있고, 그 디렉토리 내에는 exception 디렉토리가 있다. 그리고, 수많은 custom Exception들이 있다. 
예외 클래스들을 하나하나 만들다보면 지나치게 많아질 수 있다. 이 디렉토리와 클래스를 관리하는 것 역시 일이다. 지나치게 많아진다면 메모리 문제도 발생할 수 있고, 클래스 로딩에도 시간이 더 소요될 가능성이 있다. 

이미 자바에서는 충분히 많은 표준 예외를 제공하고 있으므로 표준 예외를 재사용한다면 이를 막을 수 있다. 
