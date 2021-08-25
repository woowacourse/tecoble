---
layout: post
title: 'StreamAPI 나도 한 번 써보자!'
author: [3기_와일더]
tags: ['stream']
date: '2021-05-23T12:00:00.000Z'
draft: false
image: ../teaser/stream-api.png
source: https://morioh.com/p/6b859b7a83e6
---

Java 의 Stream API 사용 방법을 알아보자. 우아한테크코스 프리코스 과정에서 Stream API 를 사용해서 코드를 맛깔나게 구현하는 분들을 보면 괜스레 해야 할 것 같고, 유용해 보여서 흥미가 생긴다. 처음 보는 Stream API 를 어디에 사용할 수 있는지, 어떻게 사용할 수 있는지에 대해 살펴보자.

## Java Collection Framework

자바에서 데이터를 저장하는 기본 자료구조들을 한곳에 모아서 관리 및 사용하기 위해 JCF(Java Collection Framework)를 제공한다. JCF 는 Collection (List, Set, Queue) 과 Map 으로 구성되어있다. 용어가 쉽게 와닿지 않는다면, 지금은 자바의 List, Set, Queue 같은 기능이 컬렉션이라고 생각하고 글을 읽으면 된다. 컬렉션으로 데이터를 그룹화하고 처리할 수 있다. 거의 모든 자바 애플리케이션은 컬렉션을 만들고 처리하는 과정을 포함한다.

만약 당신에게 왜 자바에서 배열보다 컬렉션 사용을 지향하는지 묻는다면 앞으로는 이렇게 대답하면 될 것이다.

> Java Collection 자료구조(List, Set, Queue 등)를 사용하면 데이터를 조작할 때 다양한 api 를 사용할 수 있다.

그 기능 중 하나인 StreamAPI 사용법을 학습해 보자.

## 기능의 구현

SQL 질의문(DB에 답을 얻고자 하는 내용에 대해 질문을 던지는 것)에서는 우리가 원하는 것을 질문하고 찾을 수 있다. 고객 테이블에서 <b>와일더</b>라는 이름을 가진 사람을 찾는 질의문을 만들어 보자.

```sql
SELECT name FROM customer WHERE name = "와일더";
```

SQL 질의에서 알 수 있듯이 어떻게 필터링할 것인지는 구현할 필요가 없다. 하지만 자바에서 위와 같은 기능을 구현하기 위해서는 반복문이나 값을 누적시키는 누적자 등을 사용해야 한다. 즉, SQL 에서는 질의문을 만들 때 <b>구현은 자동으로 제공</b>되기 때문에 <b>질의를 선언만 하면</b> 손쉽게 구현할 수 있다. 컬렉션으로도 SQL 처럼 구현을 제공할 수 있지 않을까?

## 스트림이란?

<b>자바 8</b> API 에 새롭게 추가된 기능이다. 스트림을 사용하면 기능을 구현하지 않고 선언형으로 컬렉션 데이터를 처리할 수 있다. 다시 말해, 스트림을 사용하면 여러 줄로 작성하던 반복문과 조건문을 한 줄로 멋지게 만들 수 있다.

스트림의 구성에 대해 살펴보자. 아래 예시는 Member 리스트에서 성인인 사람을 count 파라미터 만큼 찾은 후 그들의 이름으로 매핑하여 리스트 자료구조로 만들어서 반환해주는 기능이다.

```java
public List<Member> findAdultAsName(List<Member> members, int count) {
  return members.stream()    // 멤버 리스트에서 스트림을 얻는다.
  .filter(member -> member.isAdult())    // 중간 연산
  .limit(count)    // 중간 연산
  .map(Member::getName)    // 중간 연산
  .collect(Collectors.toList());    // 최종 연산, 스트림을 원하는 컬렉션 자료구조로 변경한다.
  }
```

주석에서 알 수 있듯이 스트림은 세 단계의 구성을 한다.

1. 컬렉션으로부터 스트림 얻기
2. 중간 연산을 통해 찾고자 하는 값 얻기, 중간 연산은 여러 번 사용될 수 있음
3. 연산이 끝난 값을 원하는 컬렉션 자료구조로 만들어 획득하기

위의 세 가지 구조를 생각하며 스트림을 사용한다면 한결 쉽게 스트림을 만들 수 있다.

## 스트림 사용하기

스트림의 많은 기능에 대해 자세히 알아보려면 [공식 문서](https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html)를 참고해보면 좋겠지만, 당장 스트림을 처음 접할 때는 쉽지 않다. 그래서 이 글에서는 모든 기능을 다루는 것이 아니라 쉬운 이해와 바로 미션에서 적용할 수 있도록 하는 것이 목적이다. 예시에서는 List 컬렉션을 사용한다.

### 스트림 시작

list 에 stream() 메서드를 사용하면 스트림 객체를 반환받을 수 있다.

```java
public static void main(String[] args) {
  List<String> member = new ArrayList<>();
  Stream<String> stream = member.stream();
  }
```

이제 본격적인 중간 연산에 들어갈 준비가 된 것이다. stream() 메서드를 실행하면서 <b>일회성 반복 작업</b>이 시작된다.

### 중간 연산

스트림의 중간 연산에는 람다식이 사용된다. 람다식은 익명함수, 즉 이름이 존재하지 않는 함수(자바에서는 메서드)를 뜻한다. 람다식을 사용할 경우 객체 생성 없이 메서드를 호출하듯이 바로 사용 가능하다는 점이 있다.

중간 연산을 능숙하게 사용하면 생각보다 많은 기능을 사용할 수 있다. 우선 자주 사용하게 될 연산부터 알아보자.



<b>filter (Boolean 을 판단)</b>

숫자 야구 게임에서 볼의 개수를 세는 기능이 필요하다. 이 때, 동일한 숫자 값이 포함된 개수를 구하는 메서드를 만들어보자.

반복문으로 구현한다면 이렇게 구현할 것이다.

```java
public List<String> findBallCount(List<String> userNumbers, String targetNumber) {
        List<String> result = new ArrayList<>();
        
        for (String userNumber : userNumbers) {
            if (userNumber.equals(targetNumber)) {
                result.add(userNumber);
            }
        }
        
        return result;
}
```

하나의 기능을 위해 여러 줄의 코드 구현이 발생했다. 또한 indent depth 가 2가 되었다. 메서드 분리가 필요해 보이는 상황이다. 똑같은 기능을 스트림을 사용해서 구현해 보자.

```java
public List<String> findBallCount(List<String> userNumbers, String targetNumber) {
        return userNumbers.stream()  // 가독성을 위해서 메서드 마다 라인을 바꿔주는 것이 좋다. 
                .filter(userNumber -> userNumber.equals(targetNumber))
                .collect(Collectors.toList());
}
```

라인을 바꾼 것을 제외하면 한 줄로 해결되는 것을 볼 수 있다! collect(Collectors.toList()) 부분은 Stream 객체를 List 객체로 만들어주는 최종 연산 부분인데, 중간 연산 부분이 끝나고 나서 다루도록 한다.

람다식이 익숙하다면 이해가 쉽겠지만, 그렇지 않다고 생각하고 filter 를 해석해 보겠다.

filter 메서드를 살펴보면 화살표의 좌측은 메서드 파라미터, 우측은 메서드의 구현이라고 보면 된다. 한 줄짜리 구현에서는 return 과 세미콜론을 생략할 수 있어서 filter 부분에 구현된 람다식은 사실상 아래와 같다.

```java
.filter((userNumber) -> { 
  return userNumber.equals(targetNumber); 
})
```

1. 반복 작업의 요소를 'userNumber'라는 이름으로 칭하고 filter 메서드의 파라미터로 넣어준다.
2. userNumber 객체(String) 안에 존재하는 메서드인 equals 를 실행 시켜 통해 객체의 값을 비교한다.
3. equals 메서드는 반환 값이 Boolean 타입이므로 true 혹은 false 가 나오는데 filter() 메서드는 true 인 요소만 걸러준다.

이러한 과정을 거치고 난 뒤 Stream 에는 filter 에서 걸러진 요소만 남게 되고 이어서 최종 연산을 통해 해당 요소를 지닌 List 를 반환한다.



<b>limit (원하는 개수만큼 고르기)</b>

로또를 구현할 때, 잘 섞인 로또 번호에서 6개의 번호를 고르려고 한다. 이때 사용할 수 있는 스트림의 메서드가 limit() 이다.

```java
public List<Integer> pickLottoNumbers(List<Integer> allNumbers) {
        return allNumbers.stream()
                .distinct() // 중복된 값을 가진 요소가 있으면 제거해 주는 중간 연산 메서드
                .limit(6) // 필요한 개수만큼 입력해 주면 된다.
                .collect(Collectors.toList());
}
```

중간 연산에 사용되는 메서드들은 순서와 상관없이 최종 연산 전이라면 계속해서 사용할 수 있다.



<b>anyMatch (일치하는 값이 있는지 확인하기)</b>

로또 번호 중에 보너스 번호가 포함되어 있는지 판단하는 메서드를 구현하려고 한다. 이때 사용할 수 있는 메서드가 anyMatch() 이다.

```java
public boolean hasBonusNumber(List<Integer> lottoNumbers, int bonusNumber) {
        return lottoNumbers.stream()
                .anyMatch(lottoNumber -> lottoNumber.equals(bonusNumber)); 
                // 하나라도 일치하면 true 를 반환하고 아닐 경우에는 false 를 반환한다.
}
```



<b>map (스트림 요소의 타입을 다른 타입으로 변경)</b>

map 은 기존 타입에서 다른 타입으로 형 변환 시켜주는 유용한 기능이다.

게임에서 승리한 참가자를 찾은 후 그들의 이름으로 구성된 리스트를 반환해 보자.

```java
public List<String> findWinnerName(List<Player> players) {
        return players.stream()
                .filter(player -> player.isWinner()) // 승자인지 확인하여 필터링한다.
                .map(player -> player.getName()) // player Stream -> player.name Stream 변경
                .collect(Collectors.toList()); // names Stream -> List<String> names
}
```

map() 메서드를 통해 player 의 getName() 의 결과로 타입을 변환 시켜 주었다. 위와 같은 표현도 가능하지만 메서드 레퍼런스라는 것을 사용해서 표현할 수도 있다.

```java
.map(Player::getName)
```

특정 메서드만을 호출하는 람다의 축약 표현이라고 보면 된다. 메서드의 설명을 참조하지 않고 메서드의 이름을 직접 참조하도록 한다. 복잡한 람다식을 더 간소화할 수 있다.

IntelliJ 를 사용해서 프로그래밍하고 있다면 중간 연산 단계에서 <b>.</b> 을 입력하여 어떤 메서드를 사용할 수 있는지 확인해 보면 다양한 중간 연산을 시도해 보는 데 도움된다.

### 최종 연산

중간 연산이 끝나거나 혹은 사용하지 않을 때, 최종적으로 스트림의 결과를 지정해주는 단계다. 컬렉션으로 만들거나 스트림 요소가 숫자라면 계산을 하면서 마무리한다. 스트림 요소 중에 한 개의 값만 골라낼 때는 Optional 을 사용해서 골라낼 수 있다. 반복 작업을 위한 forEach() 메서드도 사용할 수 있지만, 이것과 관련해서는 [여기](https://tecoble.techcourse.co.kr/post/2020-05-14-foreach-vs-forloop/)를 참고해 보는 것을 추천한다.



<b>컬렉션</b>

중간 연산 예시에서는 List 컬렉션으로 만드는 최종 연산을 했다. 이외에도 Set, Queue 로도 만들 수 있다. 또한 Map 으로 만들 수도 있는데, Map 컬렉션을 만들려면 groupingBy 연산을 추가로 해줘야 하므로 이 글을 읽는 StreamAPI 초심자 입장에서는 당장 배우기에는 비추천한다. 스트림 사용에 익숙해지면 추가로 학습해 보는 것을 추천한다.

```java
public Set<Integer> justSample(List<Integer> numbers) {
        return numbers.stream()
                .collect(Collectors.toSet());
}
```



<b>사칙연산</b>

사칙 (+, -, *, /) 연산에는 reduce 연산을 사용하면 된다.

```java
public int sum(List<Integer> numbers) {
        return numbers.stream()
                .reduce(0, Integer::sum);
  // 첫 번째 파라미터는 최초 시작될 때의 값이다. 합의 시작은 0 을 기초로 하기 때문에 0 을 설정했다.
  // 두 번째 파라미터는 해당 Integer 클래스에 sum 메서드 방식으로 축적한다는 뜻
}

public double multiply(List<Double> numbers) {
        return numbers.stream()
                .reduce(1.0, (a, b) -> a * b);
}
// 첫 번째 파라미터는 최초 시작될 때의 값이다. 곱의 시작은 1을 기초로 하므로 double 타입에 맞게 1.0을 설정했다.
// 두 번째 파라미터는 해당 람다식으로 동작하게 하고 축적한다는 뜻
```



<b>한 가지의 값만 골라내기</b>

스트림에서 한 가지 값만 골라내는 방법은 두 가지가 있다. findAny 메서드와 findFirst 메서드다. 해당 메서드를 사용하면 Optional 이라는 타입의 객체에 값이 한 번 포장된다. Optional 객체에 포장된 값은 null 값도 될 수 있음을 의미한다.

```java
public int pickNumber(List<Integer> numbers) {
        return numbers.stream()
                .filter(number -> number > 5)
                .findAny()  // 최초로 5보다 큰 값이 나오면 그 요소를 반환한다.
                .orElse(0); // 조건에 부합하는 값이 없어서 반환할 값이 없을 때 기본으로 반환할 값을 넣는다.
}

public int pickNumber(List<Integer> numbers) {
        return numbers.stream()
                .filter(number -> number > 5)
                .findFirst() // 모든 요소를 탐색해서 5보다 큰 값을 구하고 그중에 첫 번째 요소를 반환한다.
                .orElseThrow(IllegalArgumentException::new); // 조건에 부합하는 값이 없으면 해당 예외를 처리한다.
}
```

위와 같이 처리할 수 있다. 만약 Optional\<Integer>로 반환한다면 마지막 작업인 orElse 구문은 필요 없다. 앞서 말한 바와 같이 Optional 은 null 값도 존재할 수 있음을 의미하기 때문에 만약 null 일 경우에 대한 처리를 해줘야 올바르게 기존의 타입으로 반환할 수 있다.

### 결론

프리코스 준비과정에서 사용할 수 있는 StreamAPI 사용법을 알아보면서 한 층 더 멋진 코드를 구사할 수 있게 되었다. 하지만 편리하다고 무차별적으로 사용하는 것은 바람직하지 않다. 오히려 반복문이 더 가독성이 좋을 때도 있고, 스트림의 생성 비용도 고려해야 할 상황이 발생한다. 생소한 만큼 어려울 수 있지만 여러 번 사용해 보면 익숙해질 것이다. StreamAPI 에는 더욱 다양한 기능이 있으니, 나중에 꼭 학습하는 것을 추천한다.

## 참고 자료

- [Java Collection Framework (JCF)](https://blog.naver.com/da91love/221006752027)
- [자바 스트림 정리: 1. API 소개와 스트림 생성 연산](https://madplay.github.io/post/introduction-to-java-streams)
- 모던 자바 인 액션
