---
layout: post  
title: Spring Boot 슬라이스 테스트
author: [파피]
tags: ['test']
date: "2021-05-18T12:00:00.000Z"
draft: false
image: ../teaser/slice-test.png
---

<p style="font-family: sans-serif; text-align: center; color: #aaa; margin-bottom: 3em; font-size: 85%">image origin: <a href="https://apkfab.com/slice-it-all/com.tummygames.sliceit">APKFab</a></p>

## Spring Boot 슬라이스 테스트

### 슬라이스 테스트란?

레이어를 독립적으로 테스트하기 위해 `Mockito` 라이브러리를 활용했는데, 코드 리뷰를 받으면서 슬라이스 테스트라는 용어를 알게 되었다.

말 그대로 레이어별로 잘라서, 레이어를 하나의 단위로 보는 단위 테스트를 한다는 것이다.

[spring.io](https://spring.io/blog/2016/08/30/custom-test-slice-with-spring-boot-1-4) 에서는 다음과 같이 말한다.

> Test slicing is about segmenting the ApplicationContext that is created for your test. 
> Typically, if you want to test a controller using MockMvc, surely you don’t want to bother with the data layer. 
> Instead you’d probably want to mock the service that your controller uses and validate that all the web-related interaction works as expected.

예를 들어 아래와 같이 `MockMvc`를 이용하여 `Controller`만을 테스트하고자 할 때, 아래와 같이 `Controller`가 사용할 `Service`를 `Mock`함으로써 데이터 레이어와는 상관없이 컨트롤러의 동작이나 유효성을 검사할 수 있다는 것이다.

```java
@WebMvcTest(UserVehicleController.class)
public class UserVehicleControllerTests {
    @Autowired
    private MockMvc mvc;

    @MockBean
    private UserVehicleService userVehicleService;

    @Test
    public void testExample() throws Exception {
        given(this.userVehicleService.getVehicleDetails("sboot"))
                .willReturn(new VehicleDetails("Honda", "Civic"));
        
        this.mvc.perform(get("/sboot/vehicle").accept(MediaType.TEXT_PLAIN))
                .andExpect(status().isOk()).andExpect(content().string("Honda Civic"));
    }
}
```

---

### 슬라이스 테스트를 하는 이유는?

`@SpringBootTest` 어노테이션을 이용하면 모든 테스트를 할 수 있는데 왜 레이어별로 잘라서 테스트할까?

`@SpringBootTest` 어노테이션의 단점은 아래와 같다.

- 실제 구동되는 애플리케이션의 설정, 모든 `Bean`을 로드하기 때문에 시간이 오래걸리고 무겁다.
- 테스트 단위가 크기 때문에 디버깅이 어려운 편이다.
- 결과적으로 웹을 실행시키지 않고 테스트 코드를 통해 빠른 피드백을 받을 수 있다는 장점이 희석된다. 

따라서 `@SpringBootTest` 어노테이션은 어플리케이션 컨텍스트 전체를 사용하는 통합 테스트에 사용돼야 한다.

---

### 슬라이스 테스트 어노테이션 종류

스프링 부트는 자동 설정의 일부만을 테스트 슬라이스로 가져와서 테스트에 활용할 수 있도록 다양한 테스트 어노테이션을 제공한다.

아래는 대표적인 슬라이스 테스트 어노테이션이다.

- `@WebMvcTest`
- `@WebFluxTest`
- `@DataJpaTest`
- `@JsonTest`
- `@RestClientTest`

이 글에서는 `Controller`를 테스트할 수 있도록 관련 설정을 제공하는 `@WebMvcTest`를 통해 슬라이스 테스트 개념을 알아볼 것이다.

---

## @WebMvcTest

### @WebMvcTest를 사용했을 때 등록되는 Bean들

@WebMvcTest 어노테이션을 사용하면 웹 레이어 테스트를 하는 데 필요한 **`@Controller`, `@ControllerAdvice`, `@JsonComponent`, `Converter`, `GenericConverter`, `Filter`, `WebMvcConfigurer`, `HandlerMethodArgumentResolver`** 등만 `Bean`으로 등록한다. 

이 밖에 테스트를 하는 데 필요하지 않은 컴포넌트들(ex. `@Service`, `@Repository`)은 `Bean`으로 등록하지 않는다.

---

### `@WebMvcTest` 사용 예시

```java
@WebMvcTest(UserVehicleController.class) // 테스트할 특정 컨트롤러 클래스를 명시
public class UserVehicleControllerTests {
    @AutoWired 
    private MockMvc mvc; // 클라이언트의 요청을 테스트할 컨트롤러로 전달하는 역할을 한다.
  
  	@MockBean // 컨트롤러에서 사용하는 서비스가 등록되지 않았기 때문에 @MockBean을 이용하여 의존성 대체
    private UserVehicleService userVehicleService;
  	
    @Test
    public void testExample() throws Exception {
  	    given(this.userVehicleService.getVehicleDetails("sboot")) // getVehicleDetails 메서드를 호출하면
            .willReturn(new VehicleDetails("Honda", "Civic")); // 지정된 객체를 반환하도록 했다.
  	    
        this.mvc.perform(get("/sboot/vehicle").accept(MediaType.TEXT_PLAIN))
            .andExpect(status().isOk()).andExpect(content().string("Honda Civic"));
      }
}
```

---

### `@MockBean`

`@WebMvcTest`를 사용함으로써 `@Service Bean`이 등록되지 않았기 때문에, `Controller`의 `Service`에 대한 의존성이 깨져서 테스트를 진행할 수 없다.

따라서 위의 예시와 같이 `@MockBean`을 이용해야 한다.

`Mock Bean`은 **기존 `Bean`의 껍데기만 가져오고 내부 구현은 사용자에게 위임**한 형태이다.

즉, 해당 `Bean`의 어떤 메서드에 어떤 값이 입력되면 어떤 값이 리턴 되어야 한다는 내용 모두 `testExample` 메서드와 같이 **개발자 필요에 의해서 조작이 가능**하다.

어떤 로직에 대해 `Bean`이 예상대로 동작하도록 하고 싶을 때, `Mock Bean`을 사용하는 것이다.

예를 들면 아임포트 등 **외부의 결제 대행 서비스**를 사용하여 결제 기능을 개발한다고 가정하자.

결제 대행 서비스에서는 테스트 코드에서 보낸 요청을 올바르지 않은 요청으로 간주할 것이다.

올바른 요청으로 간주했을 때의 로직을 테스트하고 싶은 경우, `Mock Bean` 을 사용한다.

원하는 결과를 지정한 후, 이후 로직을 진행하면 된다.

```java
@WebMvcTest(PaymentController.class)
public class PaymentControllerTests {
    @AutoWired 
    private MockMvc mvc;
  
  	@MockBean
    private PaymentService paymentService; // PaymentService 내부에서 외부의 결제 대행 서비스를 사용하고 있는 상태라고 가정
  	
    @Test
    public void testPayment() throws Exception {
  	    given(this.payMentService.chargePoint(50000L)) // 5만원 금액 충전: 테스트 환경에서는 실패하는 행위이지만
            .willReturn(new Point(50000L)); // 올바른 요청으로 간주하고 그에 따른 객체를 반환하도록 행위 지정
      }
}
```

---

### `Mock` 사용 시 주의할 점 및 적절한 사용 방법

슬라이스 테스트 시, 하위 레이어는 `Mock` 기반으로 만들기 때문에 주의할 점들이 있다.

- 실제 환경에서는 제대로 동작하지 않을 수 있다.
- `Mock`을 사용한다면 내부 구현도 알아야 하고, 테스트 코드를 작성하며 테스트의 성공을 의도할 수 있기 때문에 완벽한 테스트라 보기 힘들다.
- 내부 구현이 변경 됐을 때 테스트가 실패하지 않고 통과하게 되면서 혼란이 발생할 수도 있다.

그렇다면 언제 `Mock` 기반의 테스트를 사용해야 할까?

- 랜덤의 성격을 띄고 있는 함수
- `LocalDate.now()` 처럼 계속 흘러가는 시간의 순간
- 외부에 존재하여 내가 제어할 수 없는 외부 서버, 외부 저장소 등 제어할 수 없는 영역
- 대규모 어플리케이션(깊은 depth의 레이어)에서 하위 계층들의 테스트 셋업이 방대할 경우


---

## 결론

- 모든 `Bean`들을 사용해야 하는 통합 테스트가 아니라면, 슬라이스 테스트를 시도해보자.
- `Mock` 기반의 슬라이스 테스트라면 주의하여 엄격하게 사용해야 한다.

---

## Reference

https://jojoldu.tistory.com/226

https://goddaehee.tistory.com/212?category=367461

https://hojak99.tistory.com/588?category=760416

https://github.com/woowacourse/jwp-chess/pull/314#discussion_r625533041

https://github.com/woowacourse/jwp-refactoring/pull/2#discussion_r491075672

https://goddaehee.tistory.com/212
