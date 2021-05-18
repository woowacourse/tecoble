## Spring Boot 슬라이스 테스트

### 슬라이스 테스트란?

레이어를 독립적으로 테스트하기 위해 Mockito 라이브러리를 활용했는데, 코드 리뷰를 받으면서 슬라이스 테스트라는 용어를 알게 되었다.

말 그대로 레이어별로 잘라서 테스트를 한다는 것이다.

---

### 슬라이스 테스트를 하는 이유는?

@SpringBootTest 어노테이션을 이용하면 모든 테스트를 할 수 있는데 왜 레이어별로 잘라서 테스트할까?

@SpringBootTest 어노테이션의 단점은 아래와 같다.

- 실제 구동되는 애플리케이션의 설정, 모든 Bean을 로드하기 때문에 시간이 오래걸리고 무겁다.
- 테스트 단위가 크기 때문에 디버깅이 어려운 편이다.
- 결과적으로 웹을 실행시키지 않고 테스트 코드를 통해 빠른 피드백을 받을 수 있다는 장점이 희석된다. 

따라서 @SpringBootTest 어노테이션은 어플리케이션 컨텍스트를 전체를 사용해야 하는 통합 테스트에 사용되어야한다.

---

### 슬라이스 테스트 어노테이션 종류

스프링 부트는 자동 설정의 일부만을 테스트 슬라이스로 가져와서 테스트에 활용할 수 있도록 다양한 테스트 어노테이션을 제공한다.

아래는 대표적인 슬라이스 테스트 어노테이션이다.

- @WebMvcTest
- @WebFluxTest
- @DataJpaTest
- @JsonTest
- @RestClientTest

이 글에서는 Controller를 테스트할 수 있도록 관련 설정을 제공하는 @WebMvcTest를 통해 슬라이스 테스트 개념을 알아볼 것이다.

---

---

## @WebMvcTest

### @WebMvcTest를 사용했을 때 등록되는 Bean들

@WebMvcTest 어노테이션을 사용하면 웹 레이어 테스트를 하는 데 필요한 **@Controller, @ControllerAdvice, @JsonComponent, Converter, GenericConverter, Filter, WebMvcConfigurer, HandlerMethodArgumentResolver** 등만 Bean으로 등록하고, 이 밖에 테스트를 하는 데 필요하지 않은 컴포넌트들은 등록되지 않는다. @Service, @Repository 같은 Bean들은 등록하지 않는다.

---

### @WebMvcTest

@WebMvcTest를 사용하기 위해서는 테스트할 특정 컨트롤러 클래스를 명시해야 한다.

```java
@WebMvcTest(SomeThingController.class) // 테스트할 특정 컨트롤러 클래스를 명시
public class SomeThingTest {
    @AutoWired
		private MockMvc mvc; // 클라이언트의 요청을 테스트할 컨트롤러로 전달하는 역할을 한다.
  
  	@MockBean // 컨트롤러에서 사용하는 서비스가 등록되지 않았기 때문에 @MockBean을 이용하여 의존성 대체
  	private SomethingService somethingService;
  
  	@Test
  	void someThingTest() {
      	given(someThingService.getSomeThing()) // someThingService의 getSomeThing 메서드를 호출하면
          	.willReturn("SomeThing"); // "SomeThing"을 반환하도록 지정했다.
    }
}
```

### @MockBean

@WebMvcTest를 사용함으로써 @Service Bean이 등록되지 않았기 때문에, Controller의 Service에 대한 의존성이 깨져서 테스트를 진행할 수 없다.

따라서 위와 같이 ***@MockBean***을 이용해야 한다.

Mock Bean은 **기존 Bean의 껍데기만 가져오고 내부 구현은 사용자에게 위임**한 형태이다.

즉, 해당 Bean의 어떤 메서드에 어떤 값이 입력되면 어떤 값이 리턴 되어야 한다는 내용 모두 ```someThingTest``` 메서드와 같이 **개발자 필요에 의해서 조작이 가능**하다.

어떤 로직에 대해 Bean이 예상대로 동작하도록 하고 싶을 때, Mock Bean을 사용하는 것이다.

예를 들면 결제 기능 개발 시에, 결제 대행 서비스로 요청을 보낸다고 가정하자.

결제 대행 서비스에서는 테스트 코드에서 보낸 요청에 대해 항상 올바르지 않은 요청으로 간주할 것이다.

그렇기 때문에 내가 원하는 결과를 던지도록 지정한 이후, 로직이 예상대로 동작하는지에 대해 확인할 수 있도록 하는 것이다.

---

### 주의할 점

요청부터 응답까지 모든 테스트를 Mock 기반으로 테스트하기 떄문에 실제 환경에서는 제대로 동작하지 않을 수 있다.

Mock을 사용한다면 내부 구현도 알아야하고, 테스트 코드를 작성하며 테스트의 성공을 의도할 수 있기 때문에 완벽한 테스트라 보기 힘들다.

또한 내부 구현이 변경 됐을 때 테스트가 실패하지 않고 통과하게 되면서 혼란이 발생할 수도 있다.

---

## 결론

- 모든 Bean들을 사용해야 하는 통합 테스트가 아니라면, 슬라이스 테스트를 시도해보자.
- Mock 기반의 슬라이스 테스트라면 주의하여 [엄격하게 사용](https://github.com/woowacourse/jwp-refactoring/pull/2#discussion_r491075672)해야 한다.

---

## Reference

https://jojoldu.tistory.com/226

https://goddaehee.tistory.com/212?category=367461

https://hojak99.tistory.com/588?category=760416

https://github.com/woowacourse/jwp-chess/pull/314#discussion_r625533041

https://github.com/woowacourse/jwp-refactoring/pull/2#discussion_r491075672

https://goddaehee.tistory.com/212



