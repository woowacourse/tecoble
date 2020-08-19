---
layout: post  
title: "MockMvc VS RestAssured"  
author: "둔덩"
comment: "true"
tags: ["spring" ,"test"]
---
MockMvc와 RestAssured는 우리가 애플리케이션을 개발할 때 테스트를 편리하게 할 수 있게 해주는 유용한 테스트 도구이다. 이 두 가지 도구는 비슷하면서도 다르다. 상황에 맞게 적절한 테스트 도구를 활용할 수 있도록 눈에 띄는 몇 가지 차이점을 정리하고자 한다.

어느 것이 더 좋다는 정답은 없다.

---

## 의존성

MockMvc는 Spring Framework Test 클래스 중 하나다. 별도의 의존성 추가를 하지 않아도 사용할 수 있다. 반면에 RestAssured는 직접 의존성을 추가해줘야 한다.

RestAssured 의존성은 아래와 같이 추가할 수 있다.

```gradle
dependencies {
    testImplementation 'io.rest-assured:rest-assured:3.3.0'
}
```

의존성을 추가하는 코드 한 줄 작성하는 게 뭐 어렵냐고 말할 수 있다. 하지만 의존성이 추가될수록 프로젝트는 점점 무거워진다. 필요하지 않은 의존성은 피할 수 있으면 피하는 게 당연히 좋다.

RestAssured를 사용하기 위해 의존성을 추가하는 순간이 온다면 현재 상황에서 RestAssured를 왜 사용하려는 지 한 번쯤 고민해보면 좋을 것 같다.

---

## 속도

RestAssured는 [별도의 구성](https://github.com/rest-assured/rest-assured/wiki/GettingStarted#spring-mock-mvc)없이는 @WebMvcTest를 사용하지 못하고 아래와 같이 @SpringBootTest로 수행해야 한다.

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class Test {
    @LocalServerPort
    public int port;

    @BeforeEach
    void setUp() {
        RestAssured.port = port;
    }
    ...
```

@SpringBootTest로 테스트를 수행하면 등록된 Spring Bean을 전부 로드하기 때문에 테스트 수행 시간이 오래 걸린다. 반면에 @WebMvcTest로 테스트하면 Presentation Layer의 Bean들만 로드하기 때문에 테스트를 수행하는 시간이 상대적으로 빠르다.

MockMvc는 별도의 구성없이도 @WebMvcTest로 테스트를 수행할 수 있다. 물론 @SpringBootTest로도 수행할 수 있다. MockMvc를 @WebMvcTest로 수행하는 방법은 아래와 같다.

```java
@WebMvcTest
@AutoConfigureMockMvc
public class ApiTest {
    @Autowired
    private MockMvc mockMvc;
    ...
```

속도가 빠른 @WebMvcTest와 별도의 구성이 필요 없는 MockMvc를 사용하는 게 무조건 좋은 것은 아니다. 상황에 따라 별도의 구성을 추가하는 비용을 지불하고 RestAssured를 사용할 수도 있고 Presentation Layer 외의 Bean을 여러 개 사용해야 한다면, 전부 Mock 객체로 처리해주는 비용과 빠른 테스트 시간 중 어느 것을 택할지도 고민해봐야 한다.

---

## 가독성

```java
@Test
public void getMember() {
    given().
            accept(MediaType.APPLICATION_JSON_VALUE).
    when().
            get("/members/1").
    then().
            log().all().
            statusCode(HttpStatus.OK).
            assertThat().body("id", equalTo(1)); 
}
```

RestAssured는 [BDD](https://beomseok95.tistory.com/293) 스타일로 작성할 수 있고 가독성이 좋다. MockMvc와 비교해보자.

```java
@Test
public void getMember() throws Exception {
    mockMvc.perform(get("/members/1")
            .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id", Matchers.is(1)))
}
```

BDD 스타일로 작성한 RestAssured가 더 쉽게 읽히는 것을 알 수 있다.

BDD로 작성한 테스트는 시나리오를 기반으로 하고 비개발자가 봐도 이해할 수 있을 정도를 권장하는 것을 생각해봤을 때 사용자 관점의 테스트인 인수 테스트에선 RestAssured를 사용하는 게 적절할 수 있다.

또한 두 개의 예제 코드 마지막 줄에서 확인할 수 있듯이 RestAssured는 MockMvc보다 json data를 검증하기 쉽고 편하다는 장점이 있다. RestAssured는 json data 검증을 위한 다양한 메서드들을 제공한다.

---

## 결론

RestAssured와 MockMvc를 제외하고도 TestRestTemplate, WebTestClient 등등 더 다양한 테스트 도구들이 존재한다. 또한 이 글에 있는 내용이 두 가지 테스트 도구의 차이점 전부는 아니다. MockMvc의 Presentation Layer 테스트 시 세밀한 설정이 가능한 장점 등등 이 글에서 다루지 못한 차이점들이 있다.

테스트 할 때 RestAssured와 MockMvc 또 다른 테스트 도구 들 중 어떤 것을 써야 한다는 정답은 없다. 중요한 것은 정답을 정해두지 말고 상황에 따라 어떤 것이 더 좋을 지 항상 고민해보고 판단해야 한다는 것 아닐까?

---

#### 참고자료

-   [What's the difference between MockMvc, RestAssured, and TestRestTemplate? - stack overflow](https://stackoverflow.com/questions/52051570/whats-the-difference-between-mockmvc-restassured-and-testresttemplate)
-   [A Guide to REST-assured](https://www.baeldung.com/rest-assured-tutorial)
-   [Spring Rest Docs 적용](https://woowabros.github.io/experience/2018/12/28/spring-rest-docs.html)
-   브라운의 강의 자료