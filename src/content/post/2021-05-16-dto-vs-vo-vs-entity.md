---
layout: post  
title: DTO vs VO vs Entity
author: [다니]
tags: ['spring', 'dto', 'vo', 'entity']
date: "2021-05-16T12:00:00.000Z"
draft: false
image: ../teaser/questions.png
---

DTO와 VO는 분명히 다른 개념이다. 그런데, 같은 개념으로 생각해서 사용하는 경우가 많다. 왜일까?<br/>
⌜Core J2EE Patterns: Best Practices and Design Strategies⌟ 책의 초판에서는 데이터 전송용 객체를 `VO`로 정의했다.
그 이후 2판에서는 해당 객체를 `TO`로 정정해서 작성했다. 이 때문에 DTO와 VO를 혼동하게 된 것 같다.<br/>
이번 글에서는 DTO, VO, Entity의 정의와 특징을 살펴본다. 마지막에는 세 객체를 도표로 비교하며 정리를 한다.<br/>

<br/>

## DTO(Data Transfer Object)
DTO는 데이터를 전달하기 위한 객체이다. 계층간 데이터를 주고 받을 때, 데이터를 담아서 전달하는 바구니로 생각할 수 있다.
여러 레이어 사이에서 DTO를 사용할 수 있지만, 주로 View와 Controller 사이에서 데이터를 주고 받을 때 활용한다.<br/>
DTO는 `getter/setter` 메소드를 포함한다. 또, 도메인(Entity)로의 변환 책임을 가진다. 이 외의 다른 로직은 포함하지 않는다.<br/>

아래 코드처럼 `setter`를 가지는 경우 가변 객체로 활용할 수 있다.<br/>

```java
public class MemberDto {
    private String name;
    private int age;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getAge() {
        return age;
    }

    public void setAge(int age) {
        this.age = age;
    }
}
```
<br/>

한편, setter가 아닌 `생성자`를 이용해서 초기화하는 경우 불변 객체로 활용할 수 있다.
불변 객체로 만들면 데이터를 전달하는 과정에서 데이터가 변조되지 않음을 보장할 수 있다.<br/>

```java
public class MemberDto {
    private final String name;
    private final int age;

    public MemberDto(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }
}
```

<br/>

## VO(Value Object)
VO는 값 자체를 표현하는 객체이다. VO는 객체들의 주소가 달라도 값이 같으면 동일한 것으로 여긴다.
예를 들어, 고유번호가 서로 다른 만원 2장이 있다고 생각하자. 이 둘은 고유번호(주소)는 다르지만 10000원(값)은 동일하다.<br/>
VO는 `getter` 메소드와 함께 다른 로직들도 포함할 수 있다. 단, `setter` 메소드는 가지지 않는다.
또, 값 비교를 위해 `equals()`와 `hashCode()` 메소드를 오버라이딩 해줘야 한다.<br/>

아래 코드처럼 equals()와 hashCode() 메소드를 오버라이딩 하지 않으면 테스트가 실패한다.<br/>

```java
// Money.java
public class Money {
    private final String currency;
    private final int value;

    public Money(String currency, int value) {
        this.currency = currency;
        this.value = value;
    }

    public String getCurrency() {
        return currency;
    }

    public int getValue() {
        return value;
    }
}

// MoneyTest.java
public class MoneyTest {
    @DisplayName("VO 동등비교를 한다.")
    @Test
    void isSameObjects() {
        Money money1 = new Money("원", 10000);
        Money money2 = new Money("원", 10000);

        assertThat(money1).isEqualTo(money2);
        assertThat(money1).hasSameHashCodeAs(money2);
    }
}
```
<br/>

다음은 equals()와 hashCode() 메소드를 오버라이딩 하지 않았을 때의 테스트 결과이다.<br/>

<p align="center">
    <img width="418" alt="money_test_fail" src="https://user-images.githubusercontent.com/50176238/118396188-4c313480-b689-11eb-8973-7522ea9b6586.png">
</p>
<br/>

한편, 두 메소드를 오버라이딩 하면 테스트가 통과한다. 앞서 말했듯이 VO는 주소가 아닌 값을 비교하기 때문이다.<br/>

```java
// Money.java
public class Money {
    private final String currency;
    private final int value;

    public Money(String currency, int value) {
        this.currency = currency;
        this.value = value;
    }

    public String getCurrency() {
        return currency;
    }

    public int getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Money money = (Money) o;
        return value == money.value && Objects.equals(currency, money.currency);
    }

    @Override
    public int hashCode() {
        return Objects.hash(currency, value);
    }
}

// MoneyTest.java
public class MoneyTest {
    @DisplayName("VO 동등비교를 한다.")
    @Test
    void isSameObjects() {
        Money money1 = new Money("원", 10000);
        Money money2 = new Money("원", 10000);

        assertThat(money1).isEqualTo(money2);
        assertThat(money1).hasSameHashCodeAs(money2);
    }
}
```
<br/>

다음은 두 메소드를 오버라이딩 했을 때의 테스트 결과이다.<br/>

<p align="center">
    <img width="318" alt="money_test_pass" src="https://user-images.githubusercontent.com/50176238/118396263-b4801600-b689-11eb-9f4f-749b38e75576.png">
</p>

<br/>

## Entity
Entity는 실제 DB 테이블과 1:1 매핑되는 핵심 클래스이다. 이를 기준으로 테이블이 생성되고 스키마가 변경된다.
따라서, 절대로 Entity를 요청이나 응답값을 전달하는 클래스로 사용해서는 안 된다.<br/>
Entity는 id로 구분되고, `getter/setter` 메소드와 함께 다른 로직들도 포함할 수 있다.<br/>

Entity는 VO와 다르게 가변 객체이다. 따라서, 생성 이후 상태를 변경할 수 있다.<br/>

```java
public class Member {
    private Long id;
    private String email;
    private String password;
    private Integer age;

    public Member() {
    }

    public Member(Long id, String email, String password, Integer age) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.age = age;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public Integer getAge() {
        return age;
    }
}
```

<br/>

## 세 객체 비교
|분류 |DTO |VO |Entity |
|:--:|:--:|:--:|:--:|
|정의 |레이어간 데이터 전송용 객체 |값 표현용 객체 |DB 테이블 1:1 매핑용 객체 |
|상태 변경 여부 |가변 또는 불변 객체 |불변 객체 |가변 객체 |
|로직 포함 여부 |로직을 포함할 수 없다. |로직을 포함할 수 있다. |로직을 포함할 수 있다. |

<br/>

## References
- Core J2EE Patterns: Best Practices and Design Strategies
- [[10분 테코톡] 📍인비의 DTO vs VO](https://www.youtube.com/watch?v=z5fUkck_RZM&t=1s)
- [[10분 테코톡] 🎼라흐의 DTO vs VO](https://www.youtube.com/watch?v=J_Dr6R0Ov8E&list=PLgXGHBqgT2TvpJ_p9L_yZKPifgdBOzdVH&index=66&t=2s)
- [지하철 노선도 관리 미션 (파피 PR) - 닉 리뷰](https://github.com/woowacourse/atdd-subway-map/pull/105#discussion_r628706043)