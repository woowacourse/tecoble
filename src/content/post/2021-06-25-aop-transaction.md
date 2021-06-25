---
layout: post  
title: 'AOP 입문자를 위한 개념 이해하기'
author: [3기_케빈]
tags: ['spring', 'aop']
date: "2021-06-25T12:00:00.000Z"
draft: false
image: ../teaser/aop.png
---

> 이 글은 AOP 개념이 생소한 입문자들을 위한 포스팅입니다.

## 1. OOP의 한계

![image](https://user-images.githubusercontent.com/56240505/123369146-27997800-d5b8-11eb-9be7-dfd7a34a4f86.png)

객체지향 프로그래밍은 어플리케이션을 설계할 때 책임과 관심사에 따라 클래스를 분리합니다. 클래스가 단일 책임을 가지도록 분리함으로써 각 모듈의 응집도는 높아지고 결합도는 낮아집니다. 클래스를 변경하는 이유는 오직 한 가지이며, 어플리케이션의 한 부분에서 변경이 발생했을 때 그 파급효과가 시스템의 전체로 퍼져나가는 정도가 낮아집니다.

그러나 전통적인 객체지향 설계 방식을 충실히 따르더라도 한 가지 아쉬운 점이 존재합니다. 위 사진처럼, 여러 클래스에 로깅이나 보안 및 트랜잭션 등 공통된 기능들이 흩어져 존재한다는 점입니다. 이렇게 어플리케이션 전반에 걸쳐 흩어져있는 공통되는 부가 기능들을 **관심사**라고 합니다. 이러한 관심사를 어플리케이션의 핵심 비즈니스 로직 코드로부터 아름답게 분리하는 방법이 있을까요?

<br>

## 2. Transaction 코드

> UserService.java

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserDao userDao;
    private final PlatformTransactionManager transactionManager;

    public void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money) {
        TransactionStatus transaction = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            //로깅 관련 로직 추가
            //보안 관련 로직 추가
            Account senderAccount = userDao.findAccountById(senderId);
            Account receiverAccount = userDao.findAccountById(receiverId);
            userDao.updateMoney(senderId, senderAccount.withdraw(money));
            userDao.updateMoney(receiverId, receiverAccount.add(money));
            transactionManager.commit(transaction);
        } catch (RuntimeException runtimeException) {
            transactionManager.rollback(transaction);
            throw runtimeException;
        }
    }

    public void withdrawMoney(Long id, Long money) {
        TransactionStatus transaction = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            //로깅 관련 로직 추가
            //보안 관련 로직 추가
            Account account = userDao.findAccountById(senderId);
            userDao.updateMoney(senderId, account.withdraw(money));
            transactionManager.commit(transaction);
        } catch (RuntimeException runtimeException) {
            transactionManager.rollback(transaction);
            throw runtimeException;
        }
    }
}
```

> JPA가 아닌 JDBC 사용 환경을 가정한 코드입니다.

출금 및 입금을 처리하는 서비스 로직의 원자성 보장을 위해 내부적으로 트랜잭션을 적용한 코드입니다. 문제는 UserService의 클래스에는 **출금 및 입금**이라는 핵심 비즈니스 로직 이외에도 트랜잭션 경계 설정이라는 **부가 기능 관심사**가 산재하고 있습니다.

현재 예제 코드는 부가 기능 관심사가 트랜잭션 하나 뿐이지만, 로깅이나 보안 등의 관심사가 추가되면 어떻게 될까요? ``sendMoneyToAnotherUser()`` 메서드가 더욱 비대해질 것입니다. 또한 트랜잭션과 로깅 및 보안 등의 부가 기능이 필요한 메서드마다 비슷한 코드를 중복해서 작성해야 하며, UserService 클래스 전체가 비대해지게 됩니다.

가장 큰 문제는 트랜잭션이나 로깅 및 보안 등의 부가 기능에 관심을 가지는 클래스가 UserService에 국한되지 않다는 점입니다. UserService와 비슷하게 서비스 로직 수행 전 트랜잭션의 경계를 지정해주고 로깅이나 보안 등의 로직을 수행해야 하는 클래스가 100개가 더 있을 수 있습니다. 그 말은 곧 100개의 클래스에 UserService와 같이 중복되는 코드를 반복해서 작성해야 함을 의미합니다.

만약 트랜잭션이나 로깅 및 보안 등의 부가 기능의 정책이나 API가 변경된다면 어떻게 될까요? 이를 사용하는 100개의 클래스가 모두 함께 수정되어야 합니다. 이는 다시 말해 100개의 클래스를 변경하는 이유는 비즈니스 로직의 변경 및 부가 기능의 변경 등 총 2가지라는 의미이며, 단일 책임 원칙을 위배하게 됩니다. 결국 서비스 클래스의 응집도가 떨어지면 가독성이 나빠지며, 변경할 부분이 명확하게 드러나지 않게 되는등 유지보수 측면에서 아쉬운 점이 많아집니다.

<br>

## 3. Proxy를 활용한 리팩토링

> UserService.java

```java
public interface UserService {

    void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money);
}
```

> UserServiceImpl.java

```java
@Service
@Primary
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserDao userDao;

    public void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money) {
        Account senderAccount = userDao.findAccountById(senderId);
        Account receiverAccount = userDao.findAccountById(receiverId);
        userDao.updateMoney(senderId, senderAccount.withdraw(money));
        userDao.updateMoney(receiverId, receiverAccount.add(money));
    }
}
```

> UserServiceProxy.java

```java
@Service
@RequiredArgsConstructor
public class UserServiceProxy implements UserService {

    private final UserService target;
    private final PlatformTransactionManager transactionManager;

    @Override
    public void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money) {
        TransactionStatus transaction = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            //로깅 관련 로직 추가
            //보안 관련 로직 추가
            target.sendMoneyToAnotherUser(senderId, receiverId, money);
            transactionManager.commit(transaction);
        } catch (RuntimeException runtimeException) {
            transactionManager.rollback(transaction);
            throw runtimeException;
        }
    }
}
```

프록시는 자신이 클라이언트가 사용하려고 하는 실제 대상인 것처럼 위장해서 클라이언트의 요청을 받습니다. UserServiceProxy 클래스와 UserServiceImpl 클래스 모두 동일한 UserService 인터페이스를 확장합니다. 여기서 UserServiceProxy 클래스가 가지는 UserService 타입의 target 필드는 실제 핵심 비즈니스 로직을 구현한 UserServiceImpl 인스턴스가 됩니다.

클라이언트 요청이 발생하면 프록시 객체의 부가 기능이 먼저 실행되며, 실제 타깃 객체는 프록시로부터 요청을 위임받아 핵심 비즈니스 로직을 실행하게 됩니다. 이를 **데코레이터 패턴**이라고 합니다.

이와 같은 방법으로 핵심 비즈니스 로직과 부가 기능 관심사를 분리할 수 있었지만 여전히 한계가 분명합니다. 100개의 클래스가 이와 비슷한 기능을 요구한다면, 100개의 프록시 클래스를 생성하고 인터페이스 메서드를 일일이 구현해야 합니다.

### 3.1. Proxy를 편하게 생성하는 방법

다행히 이러한 별도의 프록시를 번거롭게 생성하는 작업을 생략하는 방법이 존재합니다. Java의 Reflection API를 이용하거나, Spring의 ProxyFactoryBean 등을 사용하는 것입니다. 해당 내용들을 전부다 다루기에는 분량이 너무 방대하여 관심있는 분들은 토비의 스프링 1권 6장을 참고하시길 바랍니다.

Spring에서 Bean을 자동으로 프록시로 만들어주는 메커니즘이 존재합니다. 바로 ``DefaultAdvisorAutoProxyCreator``라는 특별한 클래스입니다. ``BeanPostProcessor``라는 Bean 후처리기 인터페이스를 확장한 클래스이며, 동작 플로우는 다음과 같습니다.

1. Spring Container는 해당 후처리기가 Bean으로 등록되어 있으면 Bean을 생성할 때 후처리기에 보내 후처리 작업을 요청합니다.
2. 해당 Bean이 프록시 적용 대상이라면 후처리기는 실제 타깃 Bean을 프록시로 감싼 Bean 오브젝트로 바꿔치기 하고 Spring Container에게 반환합니다.

이러한 메커니즘을 활용하기 위해서는 추가적인 정보를 제공해야 합니다.

* 어떤 작업을 수행할 것인가?
* 해당 작업을 수행할 대상(즉, 적용 지점)은 누구인가?

<br>

## 4. AOP(Aspect-Oriented Programming)

관점 지향 프로그래밍이란 전통적인 OOP로는 독립적으로 모듈화하기 어려운 **부가 기능**을 모듈화하는 방식입니다. 이 글에서 트랜잭션 관리와 같은 부분이 바로 부가 기능 모듈이며, Aspect라고 합니다. 어플리케이션의 핵심 비즈니스 로직을 담고 있지는 않지만 어플리케이션에 부가됨으로써 의미를 갖는 특별한 모듈입니다. AOP는 어플리케이션의 핵심 로직과 부가 기능 Aspect를 분리하는 등 OOP를 보완하는 역할입니다.

AOP 기능을 제공하는 프레임워크나 라이브러리를 사용하면, 번거로운 프록시 클래스 작성없이 UserService 비즈니스 로직에서 트랜잭션이라는 부가 기능 관심사를 간편하게 분리할 수 있습니다. 더불어 다양한 클래스가 해당 관심사를 재활용하며 공통 사용할 수 있습니다.

### 4.1. Aspect 구성

Aspect는 부가될 기능을 정의한 Advice와, 해당 Advice를 어디에 적용할 지를 결정하는 Pointcut 정보를 가지고 있습니다.

### 4.2. 구현 방법

1. Spring AOP를 활용한다.
  * 이번 포스팅 내용처럼 프록시를 사용함으로써 부가 기능을 실행합니다.
2. AspectJ를 사용한다.
  * AspectJ는 컴파일된 타깃의 클래스 파일 자체를 수정하거나, 클래스가 JVM에 로딩되는 시점에 바이트 코드를 조작함으로써 AOP를 적용합니다.
  * 프록시 방식보다 더 다양한 지점에서 부가 기능을 부여할 수 있습니다.

### 4.3. AspectJ를 활용한 리팩토링

> TxAspect.java

```java
@Aspect
@Component
@RequiredArgsConstructor
public class TxAspect {

    private final PlatformTransactionManager transactionManager;

    @Pointcut("execution(* com.demo.user.UserService.send*(..))")
    public void getUsers() {
    }

    @Pointcut("execution(* com.demo.user.BankService.update*(..))")
    public void getBanks() {
    }

    @Around("getUsers() || getBakns()")
    public Object applyTx(ProceedingJoinPoint joinpoint) throws Throwable {
        TransactionStatus transaction = transactionManager.getTransaction(new DefaultTransactionDefinition());
        try {
            Object object = jointPoint.proceed();
            transactionManager.commit(transaction);
            return object;
        } catch (RuntimeException runtimeException) {
            transactionManager.rollback(transaction);
            throw runtimeException;
        }
    }
}
```

* @Pointcut 애너테이션에 표현식을 달아 특정 패키지의 ``send``나 ``update``로 시작하는 메서드들을 실행할 때 AOP 부가 기능을 적용하겠다고 지정합니다.
* 이러한 AOP 적용을 통해 UserSerivce의 메서드는 별도의 트랜잭션 관리 기능을 제거하고 핵심 비즈니스 로직만 남게 됩니다.

<br>

## 5. 마치며

> UserService.java

```java
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserDao userDao;

    @Transactional
    public void sendMoneyToAnotherUser(Long senderId, Long receiverId, Long money) {
        Account senderAccount = userDao.findAccountById(senderId);
        Account receiverAccount = userDao.findAccountById(receiverId);
        userDao.updateMoney(senderId, senderAccount.withdraw(money));
        userDao.updateMoney(receiverId, receiverAccount.add(money));
    }
}
```

사실 우리가 흔히 보는 @Transactional 애너테이션 또한 AOP가 적용된 대표 사례입니다. Spring은 @Transactional이라는 애너테이션을 메서드에 부착하면 예외 발생 여부에 따라 해당 트랜잭션을 커밋하거나 롤백합니다.

내부적으로 @Transactional이 붙은 오브젝트에 대해 프록시를 생성하고, @Transactional로 지정한 메서드를 호출하면 트랜잭션을 선언하겠다는 Pointcut과 Advice를 정보를 바탕으로 부가 기능 관심사를 수행합니다.

AOP는 이해하기 어렵고, 제대로 사용하기 위해서는 꾸준히 학습해야 합니다. 이번 포스팅을 통해 AOP에 어느정도 감이 잡히셨다면, AspectJ 등을 추가 학습해보시면 어떨까요? 😁😁

<br>

---

## Reference

* [SPRING - AOP(1) - ASPECT ORIENTED PROGRAMMING](https://seongmun-hong.github.io/spring/Spring-Aspect-Oriented-Programming(AOP)(1))
* [Spring AOP Introduction and Concepts of AOP](https://dev.to/anouar1611/spring-aop-introduction-and-concepts-of-aop-4oan)
* [AOP 정리 (4)](https://jojoldu.tistory.com/72)
* 토비의 스프링 3.1(이일민 저)
