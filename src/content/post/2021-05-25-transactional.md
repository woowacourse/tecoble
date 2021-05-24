## @Transactional

스프링은 ```@Transactional``` 어노테이션을 이용한 선언적 트랜잭션 처리를 지원한다. 

이번 글에서는 아래 내용에 대해 알아볼 것이다.

- 트랜잭션이 무엇인지
- 스프링에서 ```@Transactional``` 을 이용하여 트랜잭션 처리를 하는 방법
- 테스트 환경에서의 @Transactional 동작

---

### 트랜잭션(Transaction)이란?

트랜잭션은 우리말로 '거래'라는 뜻을 갖고 있으므로, 먼저 거래와 관련된 간단한 예시를 들어보겠다.

어떤 사람과 거래를 하고 있는 상황이다.

- 물건을 받기 위해 상대방에게 선입금을 했다.
- 그런데 벽돌이 도착했다.

만약 위 거래가 이 글에서 말하고자 하는 트랜잭션 개념이었다면? 

상대방에게 입금하는 작업이 성공했더라도 원하던 물건을 받지 못했다면 입금이 취소되었을 것이다.

모든 작업들이 성공적으로 완료되어야 작업 묶음의 결과를 적용하고, 어떤 작업에서 오류가 발생했을 때는 이전에 있던 모든 작업들이 성공적이었더라도 없었던 일처럼 완전히 되돌리는 것이 트랜잭션의 개념이다.

데이터베이스를 다룰 때 트랜잭션을 적용하면 데이터 추가, 갱신, 삭제 등으로 이루어진 작업을 처리하던 중 오류가 발생했을 때 **모든 작업들을 원상태로 되돌릴 수 있다 **. 모든 작업들이 성공해야만 최종적으로 데이터베이스에 반영하도록 한다.

---

### 스프링에서 ```@Transactional``` 을 이용하여 트랜잭션 처리를 하는 방법

DB와 관련된, 트랜잭션이 필요한 서비스 클래스 혹은 메서드에 @Transactional 어노테이션을 달아주면된다.

```java
//게시판의 게시글을 삭제하는 메서드
@Transactional
public void removeBoard(Long id) throws Exception {
    replyDAO.removeAll(id);  //삭제할 게시글의 답글 삭제
    boardDAO.deleteBoard(id); //게시글 삭제
}
```

```@Transactional```이 붙은 메서드는 메서드가 포함하고 있는 작업 중에 하나라도 실패할 경우 전체 작업을 취소한다.

#### 주의해야할 점 

주로 ```insert``` 작업을 할 때 id(식별자)가 자동으로 증가하도록  ```Auto Increment``` 옵션을 적용하곤 하는데, 

트랜잭션에 포함된 ```insert``` 작업으로 인해 증가한 id는 트랜잭션이 롤백되어도 다시 감소하지 않는다.

```Auto Increment``` 옵션은 트랜잭션의 범위 밖에서 동작하기 때문이다.

트랜잭션 범위 안에서 동작하면 같이 롤백되고 id도 순서대로 부여할 수 있기 때문에 편할 것 같은데 왜 그럴까? 바로 동시성 때문이다.

여러 사람이 동시에 한 사이트에 회원가입을 하는 상황을 생각해보자.

각각 ```insert``` 문이 포함된 트랜잭션이 진행되는데, 중복된 아이디 혹은 올바르지 않은 양식의 아이디 입력 등 여러 요인으로 인해 트랜잭션이 실패할 수도 있고, 성공할 수도 있다. 

각 트랜잭션이 다른 사람의 회원 가입 트랜잭션 성공 여부를 기다렸다가 id를 부여받기엔 얼마나 기다려야 될 지 모르는 일이다.

따라서 ```Auto Increment``` 는 트랜잭션과 별개로 동작한다.

---

 ## 테스트 환경에서의 @Transactional 동작

테스트 메서드에 @Transactional을 사용하면 트랜잭션으로 감싸지며, 메서드가 종료될 때 자동으로 롤백된다.

이유가 뭘까? 

```org.springframework.test.context.transaction.TestTransaction``` 클래스를 이용해 알아보자.

### TestTransaction

```TestTransaction``` 클래스는 ```@Transactional``` 이 적용된 테스트 메서드를 감싸고 있는 트랜잭션과 상호 작용할 수 있는 기능을 가지는 유틸리티 클래스이다.

테스트 환경에서 아래  코드를 실행시켜보자. 현재 동작 중인 트랜잭션이 있는지 확인할 수 있다.

```java
assertTrue(TestTransaction.isActive());
```

아래 코드도 실행시켜보자. 롤백 옵션이 적용되어 있는지 확인할 수 있는데, 디폴트로 롤백 옵션이 적용되어 있다.

```java
assertTrue(TestTransaction.isFlaggedForRollback());
```

롤백 옵션을 바꾸고 싶다면 아래 코드를 통해 변경할 수 있다.

```java
TestTransaction.flagForCommit(); 
TestTransaction.flagForRollback();
```

### 주의할 점

WebEnvironment의 RANDOM_PORT, DEFINED_PORT를 사용하면 실제 테스트 서버는 별도의 스레드에서 테스트를 수행하기 때문에 트랜잭션이 롤백되지 않는다.

---

## 결론

일련의 작업들을 묶어서 하나의 단위로 처리하고 싶다면 @Transactional을 활용하자.

프로덕션 환경과 테스트 환경 각각에서의 동작 방식을 유념하여 사용하자.

---

# Reference

https://stackoverflow.com/questions/14758625/mysql-auto-increment-columns-on-transaction-commit-and-rollback

https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/test/context/transaction/TransactionalTestExecutionListener.html

https://www.baeldung.com/spring-test-programmatic-transactions

https://goddaehee.tistory.com/211

