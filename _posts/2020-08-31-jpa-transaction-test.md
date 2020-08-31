---
layout: post
title: "JPA 사용시 테스트 코드에서 @Transactional 주의하기"
author: "비밥"
comment: "true"
tags: ["jpa", "transaction", "test"]
---

# JPA 사용시 테스트 코드에서 @Transactional 주의하기

Service 계층에 대한 테스트를 한다면 보통 DB와 관련된 테스트 코드를 작성하게 된다. 이러한 경우 테스트 메서드 내부에서 사용했던 데이터들이 그대로 남아있게 된다면 실제 서비스에 영향을 미칠 수 있기 때문에 테스트가 끝나면 지워야 할 필요가 있다. 이러한 문제를 해결하기 위해 `@Sql` 애너테이션을 이용해서 직접 DB를 Truncate하는 Query를 직접 작성하는 방법도 있고, 테스트 메서드에 `@Transactional` 애너테이션을 이용해서 테스트 메서드가 종료될 때 테스트 메서드 내부에서 생성했던 데이터를 rollback하는 방법도 있다.

`@Sql` 작성은 관련된 DB의 Truncate Query를 직접 작성해야하고 관련된 Table이 증가할때마다 Query도 같이 수정해야하는 번거로움이 있다. 반면 `@Transactional` 을 이용하여 손쉽게 관련된 Table을 rollback 할 수 있기 때문에 사용하고 싶은 마음이 생길 수 있다.

- [@Transactional에 rollback이 가능하다는 것을 사진으로 첨부](https://docs.spring.io/spring/docs/current/spring-framework-reference/testing.html#testcontext-tx-rollback-and-commit-behavior)

위와 같이 테스트를 `@Transactional`을 이용한다면 쉽게 rollback이 되서 테스트 코드를 관리하기 쉽다.

하지만 JPA를 사용하는 환경에서 단순히 rollback을 위해서 테스트 코드를 작성한다면 주의해야할 점이 있다.

## 예제

예시를 위한 코드를 먼저 살펴보도록 하자.  
아래는 1:N, N:1 관계를 가진 Entity 이다.

```java
도메인코드
```

그리고 서비스 코드이다.

```java
서비스코드
```

마지막으로 테스트 코드이다.

```java
테스트코드
```

테스트 코드에는 rollback을 위해 `@Transactional` 애너테이션이 사용되고 있다.

- 테스트 코드 통과하는 장면

그리고 위 테스트 코드는 정상적으로 통과한다. 또한 테스트에서 생성되었던 데이터들도 성공적으로 rollback이 될 것이다.

하지만 개발자의 서비스 코드의 메서드에서 `@Transactional` 을 깜빡하고 사용하지 않고 테스트 코드에서만 `@Transactional`을 사용한다면 어떻게 될까?

- 테스트 통과하는 장면

테스트는 통과하지만

- 런타임 Exception 발생하는 장면

실제로 프로덕션이 서비스 될 때는 런타임에 Exception이 발생하는 것을 볼 수 있다.

`LazyInitailizationException`이 발생하는 이유는 실제 서비스 코드에서는 `@Transactional` 이 없어서 Entity가 영속성 컨텍스트의 관리를 받고있지 않아서 Lazy Loading이 불가능하지만, 테스트 코드는 `@Transactional` 이 존재하기 때문에 영속성 컨텍스트가 존재하고 Entity의 Lazy Loading이 가능했기 때문이다.

따라서 서비스 레이어의 테스트 코드에 `@Transactional`을 이용하는 것은 개발자의 실수로 인해 런타임에서만 발생할 수 있는 문제를 만들수 있다.

그렇다면 서비스 코드에만 `@Transactional` 을 이용하고 테스트에서는 어떻게 하는게 좋을까?

필자는 테스트 코드에 `@AfterEach` 메서드를 만들고 직접 연관된 `JpaRepository`를 이용해서 `deleteAll()` 하는 것을 추천한다.

- DELETE 사진

## 그렇다면 테스트 코드에서는 `@Transactional` 은 사용하지 말아야 하는가?

결론부터 말하자면 **'그렇지 않다.'**이다.

실제로 `@DataJpaTest` 와 같은 테스트 의존성 주입 메서드를 보면 `@Transactional` 가 이미 같이 붙어있는 것을 확인할 수 있다.

- jpatest 사진

지금까지 서비스 레이어에 대한 테스트 코드에서 `@Transactional` 을 사용하지 말라는 식으로 이야기를 했는데 스프링에서 제공하는 애너테이션은 `@Transactional` 을 제공하고 있는 모습을 보인다.

`@DataJpaTest` 애너테이션은 서비스 레이어를 위한 테스트 애너테이션이 아니다. 단순히 JPA 구성요소들을 위한 테스트이다.  

- JPATEST 명세 사진

단순히 `JpaRepository` 의 기능을 테스트 하기 위해서라면 `@DataJpaTest` 를 이용하여 `@Transactional` 의 rollback 기능을 사용하는 것은 큰 문제가 없다.

## 결론

테스트 코드를 작성하면서 일일히 생성되었던 데이터를 지우는 것은 여간 귀찮은 작업이 아니다. 하지만 그러한 귀찮음 해결하기 위해 `@Transactional` 을 사용했다가 더 큰 문제를 발생하게 되는 경우가 생길 수 있으니 언제나 상황에 맞게 올바르게 사용하는 것이 중요하다.

