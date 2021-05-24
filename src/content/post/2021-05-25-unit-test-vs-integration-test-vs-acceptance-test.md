---
layout: post  
title: 단위 테스트 vs 통합 테스트 vs 인수 테스트
author: [다니]
tags: ['test', 'unit test', 'integration test', 'acceptance test']
date: "2021-05-25T12:00:00.000Z"
draft: false
image: ../teaser/test.jpeg
---

소프트웨어 테스트에는 여러 유형이 있다. 각 테스트는 목적, 방법 등에 따라 차이점을 가진다.
이번 글에서는 그 중 단위 테스트, 통합 테스트, 인수 테스트에 대해 개념을 정리해보려고 한다.<br/>

<br/>

## 단위 테스트(Unit Test)
단위 테스트는 응용 프로그램에서 테스트 가능한 가장 작은 소프트웨어를 실행하여 예상대로 동작하는지 확인하는 테스트이다.<br/>

테스트 대상 단위의 크기는 엄격하게 정해져 있지 않다. 하지만, 일반적으로 클래스 또는 메소드 수준으로 정해진다.
단위의 크기가 작을수록 단위의 복잡성이 낮아지기 때문에 단위 테스트를 활용하여 동작을 표현하기 더 쉬워진다.
즉, 테스트 대상 단위 크기를 작게 설정해서 단위 테스트를 최대한 간단하고 디버깅하기 쉽게 작성해야 한다.
단위 테스트는 TDD와 함께 할 때 특히 더 강력해진다.<br/>

프로그래밍 언어마다 단위 테스트 시 사용하는 프레임워크가 다르다. Java의 경우 `JUnit`으로 테스트한다.<br/>

아래 코드는 JUnit5로 작성한 단위 테스트 코드이다.
단위 테스트는 보통 `given-when-then` 형식을 가진다.<br/>

```java
@DisplayName("구간과 구간을 합친다.")
@Test
void merge() {
    // given
    Sections beforeMerge = new Sections(Arrays.asList(강남_역삼, 역삼_선릉));

    // when
    Section afterMerge = beforeMerge.merge(2L);

    // then
    assertThat(afterMerge)
            .usingRecursiveComparison()
            .isEqualTo(강남_선릉);
}
```

<br/>

## 통합 테스트(Integration Test)
통합 테스트는 단위 테스트보다 더 큰 동작을 달성하기 위해 여러 모듈을 모아 이들이 의도대로 협력하는지 확인하는 테스트이다.
즉, 통합 테스트는 단위 테스트를 기반으로 코드 단위를 결합해서 해당 조합이 올바르게 동작하는지 테스트한다.<br/>

통합 테스트는 단위 테스트와 달리 개발자가 변경할 수 없는 부분(ex. 외부 라이브러리)까지 묶어 검증할 때 사용한다.
이는 DB에 접근하거나 전체 코드와 다양한 환경이 제대로 작동하는지 확인하는데 필요한 모든 작업을 수행할 수 있다.
그렇지만, 통합 테스트가 응용 프로그램이 완전하게 작동하는 걸 반드시 증명하지는 않는다.<br/>

통합 테스트의 장점은 단위 테스트에서 확인하기 어려운 버그를 찾을 수 있다는 점이다.
예를 들면, 통합 테스트에서는 환경 버그(ex. 싱글 코어 CPU에서는 잘 실행되나 쿼드 코어 CPU에서는 잘 실행되지 않음)가 발생할 수 있다.
한편, 통합 테스트의 단점은 단위 테스트보다 더 많은 코드를 테스트하기 때문에 신뢰성이 떨어질 수 있고 테스트를 유지보수하기 힘들다는 점이다.<br/>

스프링부트의 경우 클래스 상단에 `@SpringBootTest` 어노테이션을 붙여 통합 테스트를 수행할 수 있다.<br/>

```java
@SpringBootTest
class SubwayApplicationTests {
    @Test
    void contextLoads() {
    }
}
```

<br/>

## 인수 테스트(Acceptance Test)
인수 테스트는 사용자 스토리(시나리오)에 맞춰 수행하는 테스트이다. 앞선 두 테스트와 달리 비즈니스 쪽에 초점을 둔다.
프로젝트에 참여하는 사람들(ex. 기획자, 클라이언트 대표, 개발자)이 토의해서 시나리오를 만들고, 개발자는 이에 의거해서 코드를 작성한다.
개발자가 직접 시나리오를 제작할 수도 있지만, 다른 의사소통집단으로부터 시나리오를 받아(인수) 개발한다는 의미를 가지고 있다.<br/>

인수 테스트는 애자일 개발 방법론에서 파생했다. 특히, 익스트림 프로그래밍에서 사용하는 용어이다.
이는 시나리오가 정상적으로 동작하는지를 테스트하기 때문에 통합 테스트와는 분류가 다르다.
시나리오에서 요구하는 것은 `누가, 어떤 목적으로, 무엇을 하는가`이다.
개발을 하다 보면 이런 기능은 API를 통해 드러난다. 인수 테스트는 주로 이 API를 확인하는 방식으로 이뤄진다.<br/>

결국 인수 테스트는 소프트웨어 인수를 목적으로 하는 테스트이다. 소프트웨어를 인수하기 전에 명세한 요구사항(인수 조건)대로 잘 작동하는지 검증이 필요하다.
소프트웨어를 인수할 때, 소프트웨어 내부 구조나 구현 방법을 고려하기보다는 실제 사용자 관점에서 테스트하는 경우가 많다.
따라서, 인수 테스트는 소프트웨어 내부 코드에 관심을 가지지 않는 블랙박스 테스트이다. 실제 사용자 관점에서 테스트할 때 주로 E2E(End-to-End) 형식을 이용해서 확인한다.<br/>

Java의 경우 `RestAssured`, `MockMvc`와 같은 도구를 활용하여 인수 테스트를 만들 수 있다.<br/>

아래 코드는 RestAssured로 작성한 인수 테스트 코드이다.<br/>

```java
public static ExtractableResponse<Response> 지하철역_수정_요청(StationResponse response, StationRequest params) {
    회원_등록되어_있음(EMAIL, PASSWORD, AGE);
    TokenResponse tokenResponse = 로그인되어_있음(EMAIL, PASSWORD);

    return RestAssured
            .given().log().all()
            .auth().oauth2(tokenResponse.getAccessToken())
            .contentType(MediaType.APPLICATION_JSON_VALUE)
            .body(params)
            .when().put("/api/stations/" + response.getId())
            .then().log().all()
            .extract();
}
```

<br/>

## References
- [What's the difference between unit, functional, acceptance, and integration tests? [closed]](https://stackoverflow.com/questions/4904096/whats-the-difference-between-unit-functional-acceptance-and-integration-test)
- [Testing Strategies in a Microservice Architecture](https://martinfowler.com/articles/microservice-testing/)
- [[tdd] 인수테스트, 단위테스트, 통합테스트, 전 구간 테스트](https://joont92.github.io/tdd/%EC%9D%B8%EC%88%98%ED%85%8C%EC%8A%A4%ED%8A%B8-%EB%8B%A8%EC%9C%84%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%86%B5%ED%95%A9%ED%85%8C%EC%8A%A4%ED%8A%B8-%EC%A0%84-%EA%B5%AC%EA%B0%84-%ED%85%8C%EC%8A%A4%ED%8A%B8/)
- [[3월 우아한테크세미나] 우아한ATDD](https://www.youtube.com/watch?v=ITVpmjM4mUE&t=4s)
- [Acceptance testing in extreme programming](https://en.wikipedia.org/wiki/Acceptance_testing#Acceptance_testing_in_extreme_programming)