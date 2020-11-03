---
layout : post
title : OSIV와 Custom Interceptor를 같이 사용하기!
author : "카일"
comment: "true"
tags: ["JPA"]
toc: true
---

이번 포스팅은 OSIV(Open Session In View)와 관련해서 개발 중 발생한 예외에 관해서 이야기 하고자 한다. 제목에서 있듯 OSIV와 HandlerInterceptor에 대한 내용이므로 간단하게 두 개념에 관해 설명하고, 발생한 예외에 대해서 공유하고자 한다.

> OSIV(Open Session In View) -  말 그대로 View 레이어에서도 Session을 Open 하겠다는 의미이다. 영속성 컨텍스트와 트랜잭션은 일반적으로 같은 생명주기를 갖는데, OSIV를 키는 경우 트랜잭션이 닫히더라도 View 레이어까지 영속성 컨텍스트가 살아있는데 이를 OSIV라고 한다. (참고로 Hibernate에서 영속성 컨텍스트를 부르는 이름이 Session이다.)

> HandlerInterceptor - 특정한 요청을 가로채 요청 처리 전, 후에 추가적인 처리를 할 수 있는 하나의 방법이다. Filter와의 차이는 Spring Container 내에서 동작하기 때문에 Component를 활용한 인증처리 등을 할 수 있다. 해당 포스팅에서는 인증을 관리하는 용도로 사용된다.

## 문제 상황

`치킨에 대한 정보를 수정하라`라는 요청에 대해서, 해당 치킨을 찾아오고 이를 수정하는 로직을 수행하고자 한다. OSIV가 켜져 있는 상황에서 Interceptor에서 열린 영속성 컨텍스트를 활용해, Service에서 트랜잭션을 열고 변경 감지 기능을 사용하고자 하였다.

- 관련 코드

```java
@Component
@RequiredArgsConstructor
public class ChickenInterceptor implements HandlerInterceptor {
    private final ChickenRepository chickenRepository;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Long id = Long.parseLong(request.getHeader("id"));

        Chicken chicken = chickenRepository.findById(id)
            .orElseThrow(IllegalArgumentException::new);

        request.setAttribute("loginChicken", chicken);

        return true;
    }
}

@RequiredArgsConstructor
@RestController
public class ChickenController {
    private final ChickenService chickenService;

    @PutMapping("/chicken")
    public ResponseEntity<ChickenDto> update(@LoginChicken Chicken chicken) {
        return ResponseEntity.ok(ChickenDto.from(chickenService.update(chicken)));
    }

  	@GetMapping("/chicken")
    public ResponseEntity<ChickenDto> get() {
        return ResponseEntity.ok(ChickenDto.from(chickenService.get()));
    }
}

@RequiredArgsConstructor
@Transactional
@Service
public class ChickenService {
    private final ChickenRepository chickenRepository;

    @PostConstruct
    public void create() {
        Chicken chicken = new Chicken(null, "not changed", BigDecimal.valueOf(1000));

        chickenRepository.save(chicken);
    }

    public Chicken update(Chicken chicken) {
        return chicken.update();
    }
		public Chicken get() {
        return chickenRepository.findById(1L)
            .orElseThrow(IllegalArgumentException::new);
    }
}

@AllArgsConstructor
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Chicken {
    private static final BigDecimal CHANGED_PRICE = BigDecimal.valueOf(100000L);

    @Id
    @GeneratedValue
    private Long id;

    private String name;

    private BigDecimal price;

    public Chicken update() {
        this.name = "CHANGED-NAME";
        this.price = CHANGED_PRICE;

        return this;
    }
}
```

## 원인

위의 로직에서 치킨의 정보를 수정하는 요청은 아래와 같이 변경된 치킨으로 잘 응답이 오는 것처럼 보인다. 하지만 DB에는 치킨의 정보가 수정되지 않았는데, 왜 이러한 현상이 나타날까?

- 응답 - OK (자바 객체를 수정하여 반환하기 때문에)

```
Body = {"id":1,"name":"CHANGED-NAME","price":100000}

```

- DB - 변경되지 않음.

```
Body = {"id":1,"name":"not changed","price":1000.00}

```

**잘못된 생각**

Spring Boot에서 OSIV가 켜져 있는 경우 OpenSessionInViewIntercepto 라는 클래스가 자동으로 등록된다. 필자는 인터셉터가 자동으로 등록되기 때문에 HandlerInterceptor에서 열린 영속성 컨텍스트를 요청 내에서 쭉 공유할 것이라 생각했다.

**올바른 생각**

하지만 아래의 그림과 같이 HandlerInterceptor와 OpenSessionInViewIntercepto 실행순서는 전자가 우선된다. 즉 HandlerInterceptor 로직이 실행될 때 열린 영속성 컨텍스트를 공유하는 것이 아니라, 그 뒤인 OpenSessionInViewIntercepto 실행된 이후 영속성 컨텍스트를 공유하게 된다. 따라서 Custom하게 작성한 Interceptor의 영속성 컨텍스트가 쭉 유지되지 않는 것이다.

**실행된 CallStack**

![스크린샷 2020-11-03 오전 11 14 22](https://user-images.githubusercontent.com/49060374/97947096-9af33d00-1dcf-11eb-8fb5-b2ea533ba0bb.png)

## 해결

사실 해결방법은 간단하다. OpenSessionInViewFilter 라는 객체를 빈 등록해주는 경우 HandlerInterceptor 앞단에서 열린 영속성 컨텍스트를 공유하게 되고, 그렇다면 예상대로(Custom 한 인터셉터 이후에 동일한 영속성 컨텍스트를 사용하게 된다.)

필자는 개인적으로 OSIV를 끄는 것을 선호하지만, 만약 키고 사용한다면(Spring Boot에서 기본 설정은 true이다.) Custom Interceptor를 등록할 때 주의해서 사용하길 바란다.
