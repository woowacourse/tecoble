---
layout: post  
title: 트랜잭션 내의 외부 리소스 요청 분리하기
author: [4기_매트]
tags: ['transactional']
date: "2022-09-20T00:00:00.000Z"
draft: false
image: ../teaser/sample3.png
---

우리는 트랜잭션을 활용하여 다수의 쿼리를 논리적인 작업 셋으로 묶어 `완벽하게 처리`하거나, 처리하지 못할 경우 `원래 상태로 복구`하여 작업의 일부만 적용되는 현상을 막아준다.

우리는 이러한 트랜잭션 처리를 위해 데이터베이스와 통신하기 위해 데이터베이스 커넥션이 필요하다. 보통의 서블릿 컨테이너는 커넥션 풀을 통해 커넥션 객체를 미리 생성한 뒤 재사용함으로써 서버의 자원을 절약하고 있다.

만약 이렇게 한정된 개수를 가진 커넥션 풀이 트랜잭션 요청에 할당된 상황에서 추가 요청이 들어오면 어떻게 처리될까? 커넥션을 획득하지 못한 요청 스레드는 다른 커넥션이 반납될 때 까지 기다리게 될 것이다. 

트랜잭션 내에 우리가 제어할 수 없는 외부 리소스 요청 로직이 들어있다고 가정한다. 만약 외부 리소스에게 응답을 받기 위한 시간이 길어지면 어떻게 될까? 간단한 예시를 통해 알아보려 한다.

## 요청 별 스레드 할당

보통의 서블릿 컨테이너는 HTTP Request 별로 스레드 풀에서 스레드를 할당 받아 로직을 처리한다. 

<img width="676" alt="Untitled (13)" src="https://user-images.githubusercontent.com/59357153/191054783-b399441a-20b4-441d-a8b0-fbc0e27ae29d.png">

해당 요청이 마무리 되어 정상적으로 반환되어야 사용한 스레드가 `스레드 풀로 반납`되게 된다.

이때 서블릿에서 실행하는 로직 중 `트랜잭션이 필요한 로직`이 들어 있는 경우는 어떻게 처리 될까?

## 트랜잭션

트랜잭션이란 논리적인 작업 셋을 모두 `완벽하게 처리`하거나, 처리하지 못할 경우 `원래 상태로 복구`하여 작업의 일부만 적용되는 현상을 막아준다.

스프링에서 트랜잭션에 대한 처리를 진행하기 위해서는 보통 `@Transactional` 애노테이션을 활용한 선언적 트랜잭션 방식을 사용한다.

클래스 혹은 메서드 위에 `@Transactional` 애노테이션이 추가되면 메서드가 호출 될 경우 트랜잭션을 시작하고, 반환되는 시점에 트랜잭션 처리 여부에 따라 `COMMIT` 혹은 `ROLLBACK` 된다.

> 트랜잭션에 대한 자세한 내용은 [https://www.youtube.com/watch?v=cc4M-GS9DoY](https://www.youtube.com/watch?v=cc4M-GS9DoY), [https://www.youtube.com/watch?v=taAp_u83MwA](https://www.youtube.com/watch?v=taAp_u83MwA) 에서 확인할 수 있다.
>

## 커넥션 풀

데이터베이스와 애플리케이션 간 통신을 위해서는 데이터베이스 커넥션이 필요하다. 자바에서는 이러한 데이터베이스 커넥션 관리를 위해 대표적으로 `JDBC`를 사용한다. 

```java
Connection connection = DriverManager.getConnection(URL, USER, PASSWORD);
```

자바에서 기본적으로 데이터베이스와 통신하기 위해 위와 같은 과정을 반복하여 커넥션을 받아와야 한다. 매 요청 마다 커넥션 객체를 생성하는 것은 매우 비효율적이다. 이러한 비용을 줄이기 위해 일정 개수의 커넥션을 미리 생성해두는 `커넥션 풀(DBCP)`을 사용한다.

보통 서블릿 컨테이너를 구동할 때 일정 수의 커넥션 객체를 생성하고 사용자의 요청으로 데이터베이스에 대한 작업이 필요할 때 커넥션 풀을 통해 커넥션 객체를 받아온다. 이후 모든 작업이 마무리 되면 다시 커넥션 풀로 반납하게 된다.

데이터베이스 작업이 필요한 예시로는 `@Transactional` 애노테이션이 선언되는 메서드 혹은 선언한 클래스에 속한 메서드를 실행하는 시점이 될 수 있다.

간단한 예시로 우리가 사용하는 `JpaRepository`의 구현체인 `SimpleJpaRepository`도 클래스 위에 `@Transactional` 애노테이션이 작성된 것을 확인할 수 있다.

```java
@Repository
@Transactional(readOnly = true)
public class SimpleJpaRepository<T, ID> implements JpaRepositoryImplementation<T, ID> {
    ...
}
```

커넥션 풀의 개수는 `제한`되어 있다. 만약 우리가 동시에 데이터베이스 처리가 담긴 요청을 커넥션 풀의 개수 이상으로 받았다고 가정한다. 커넥션을 획득하지 못한 요청 스레드는 다른 커넥션이 반납될 때 까지 기다리게 될 것이다. 결국 이러한 상황이 길어지면 `병목 현상`이 발생하게 된다.

즉 우리는 테이터베이스의 커넥션을 유지하는 시간을 최소한으로 가져가야 이러한 병목 현상을 줄일 수 있다.

## 불필요한 로직이 섞인 트랜잭션

먼저 간단한 예시를 위해 아래와 같은 요구사항이 주어졌다고 가정한다.

 - 회원가입을 진행한다.
 - 회원가입은 외부 `OAuth`를 통해 진행된다.
 - 우리는 전달 받은 `인가 코드`를 기반으로 `회원 정보를 조회`한다.
 - 전달 받은 회원 정보로 `회원가입을 진행`한다.
 - 회원가입이 완료 되면 `NEWBIE`라는 칭호를 획득할 수 있다. (회원은 여러 개의 칭호를 가질 수 있다고 가정한다. 회원 : 칭호 = 1 : N)
 - 회원가입이 완료되면 가입한 email을 통해 가입 완료 메일을 전송한다.

위 과정을 코드로 표현하면 아래와 같다.

```java
@RequiredArgsConstructor
@Service
public class MemberService {

    private static final String NEWBIE = "뉴비";
    private static final String CONGRATULATIONS_MESSAGE = "가입을 축하드립니다!";

    private final MemberRepository memberRepository;
    private final HonorRepository honorRepository;
    private final OAuthClient oAuthClient;
    private final EmailSender emailSender;

    @Transactional
    public Member register(final String code) {
        Member member = oAuthClient.getMember(code); // 1

        Member savedMember = memberRepository.save(member); // 2
        honorRepository.save(new Honor(savedMember, NEWBIE)); // 3

        emailSender.send(savedMember.getEmail(), CONGRATULATIONS_MESSAGE); // 4

        return savedMember;
    }
}
```

- `1`: 외부 서비스에게 인가 코드를 전달하여 회원 정보를 조회한다.
- `2`: 조회한 회원 정보를 기반으로 저장한다.
- `3`: 가입과 동시에 `NEWBIE` 칭호를 획득한다.
- `4`: 가입 축하 메일을 전송한다.

이 모든 과정은 하나의 논리적인 작업 셋이기 때문에 하나의 트랜잭션으로 묶여 진행된다. 

위 로직 중 트랜잭션이 실질적으로 사용되는 부분은 어디일까? 바로 `3`, `4`이다. 두 repository는 member와 honor를 적절히 `영속` 시키기 위해 `데이터베이스 커넥션`을 통해 쿼리를 전송한다. 외부 서비스를 통해 회원 정보를 조회하는 `1`과 메일을 전송하기 위한 `4`는 데이터베이스와 관련된 처리가 아니므로 트랜잭션과는 거리가 멀다.

또한 외부 서비스는 우리가 제어할 수 없는 영역에 가깝다. 데이터베이스의 커넥션과 요청 처리를 위한 스레드는 외부 서비스에서 적절한 응답이 올 때 까지 계속 `대기`해야 한다. 특히 데이터베이스의 커넥션은 앞서 언급한 것 처럼 `한정된 개수`를 가지고 있다. 이러한 대기 시간이 길어질수록 `병목 현상`을 지속될 것이다.

위 코드를 그림으로 표현하면 아래와 같다.

<img width="760" alt="Untitled (12)" src="https://user-images.githubusercontent.com/59357153/191054376-ed031a94-04c9-4fde-86e7-b6e3a75fc7cd.png">

실질적으로 트랜잭션이 필요한 부분은 파란 화살표 지만, 빨간 화살표의 처리 시간까지 불필요하게 낭비되고 있는 것을 확인할 수 있다.

# 외부 리소스 요청 로직 분리하기

앞서 언급한 것처럼 트랜잭션은 최대한 빠르게 처리되어야 하며, 제어할 수 없는 외부 요청 로직을 분리해야 한다. 먼저 작성된 코드에서 트랜잭션이 필요한 로직만 남겨둔다.

```java
@RequiredArgsConstructor
@Service
public class MemberService {

    private static final String NEWBIE = "뉴비";
    private static final String CONGRATULATIONS_MESSAGE = "가입을 축하드립니다!";

    private final MemberRepository memberRepository;
    private final HonorRepository honorRepository;
    private final OAuthClient oAuthClient;
    private final EmailSender emailSender;

    @Transactional
    public Member save(final Member member) {
        Member savedMember = memberRepository.save(member);
        honorRepository.save(new Honor(savedMember, NEWBIE));
        return savedMember;
    }
}
```

트랜잭션이 불필요한 로직을 상위 클래스로 분리하여 작성한다. 

```java
@RequiredArgsConstructor
@Component
public class MemberRegister {

    private static final String CONGRATULATIONS_MESSAGE = "가입을 축하드립니다!";

    private final MemberService memberService;
    private final OAuthClient oAuthClient;
    private final EmailSender emailSender;

    public Member register(final String code) {
        Member member = oAuthClient.getMember(code);
        Member savedMember = memberService.save(member);
        emailSender.send(savedMember.getEmail(), CONGRATULATIONS_MESSAGE);
        return savedMember;
    }
}
```

기존에 `memberService`를 호출하던 부분을 `memberRegister`를 의존하도록 변경한다.

```java
@RequiredArgsConstructor
@RequestMapping("/members")
@RestController
public class MemberController {

    private final MemberRegister memberRegister;

    @PostMapping
    public ResponseEntity<MemberResponse> register(@RequestBody MemberRegisterRequest request) {
        Member savedMember = memberRegister.register(request.getCode());
        MemberResponse response = new MemberResponse(savedMember);
        return ResponseEntity.ok(response);
    }
}
```

## 정리

지금 까지 트랜잭션 내의 외부 리소스 요청에 대한 로직을 분리해야 하는 이유와 방법에 대해 간단히 알아보았다. 트랜잭션 사용을 위해서는 데이터베이스 커넥션 풀을 통해 커넥션을 획득해야 한다. 

외부 리소스에 대한 요청을 우리가 제어할 수 없는 영역이다. 또한 응답이 올 때까지 요청 스레드는 대기하게 된다. 이때 데이터베이스 커넥션을 획득한 상태라면 함께 대기하게 된다. 이것은 결국 한정된 개수를 가진 커넥션을 빠르게 반납할 수 없다는 것을 의미한다.

우리는 트랜잭션이 활성화된 범위를 최소화 해야 한다. 이러한 개선 작업을 통해 불필요하게 낭비되는 서버 자원을 적절히 아낄 수 있다. 

## Referernces.

 - [https://www.youtube.com/watch?v=Xx9BXrzNHn8](https://www.youtube.com/watch?v=Xx9BXrzNHn8)
 - 백은빈, 이성욱 지음, 『Real MySQL 8.0』 (위키북스, 2021), 158-160.
