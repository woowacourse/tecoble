---
layout: post
title: "다이나믹 테스트(Dynamic Test)란?"
author: "보스독"
comment: "true"
tags: ["test", "dynamic-test"]
toc: true
---

## 다이나믹 테스트(Dynamic Test)란?

다이나믹 테스트에 대해 알아보기 전에 상대되는 개념인 정적 테스트와 함께 개념을 비교해서 특징을 한번 살펴보자.

JUnit을 이용해서 테스트를 작성하게 되면 보통 `@Test`라는 어노테이션을 사용해서 테스트 케이스를 작성하게 되는데, 이와 같은 방식의 테스트를 정적 테스트라고 한다. 정적 테스트는 컴파일 시점에 코드가 지정된다는 특징을 가지고 있다. 가정은 동적인 기능에 대한 기본 테스트 형태를 제공하지만, 그 표현이 컴파일 시점에 제한된다는 한계를 가지고 있다.

이에 비해 다이나믹 테스트는 런타임 동안에 테스트가 생성되고 수행된다. 그래서 프로그램이 수행되는 도중에도 동작을 변경할 수 있는 특징이 있다. 이 다이나믹 테스트는 `@Test` 어노테이션을 사용하지 않고, `@TestFactory` 어노테이션을 통해 팩토리 메서드로 생성된다.

(정적의 반대말로 동적 테스트를 사용해야 하지만 다이나믹 테스트라는 이름으로 더 많이 불리기 때문에 이 글에서는 다이나믹 테스트라는 이름을 사용하겠다.)



## 다이나믹 테스트의 장점

지금까지 아마 JUnit의 `@Test` 어노테이션을 사용하는 정적 테스트만으로도 충분히  단위 테스트를 잘 작성해 왔을 것이다.

그렇다면 이번엔 다이나믹 테스트를 사용하면 어떤 장점이 있는지 알아보자.

### 1. 유연성

다이나믹 테스트를 작성하는 가장 큰 이유는 아마도 런타임 시점에 테스트 케이스를 생성할 수 있다는 유연성을 꼽을 수 있다. 

간단한 예시로, 숫자가 10보다 작은지 확인하는 메서드를 테스트하는 상황을 생각해보자. 이런 경우 우리는 보통 해당 메서드를 여러 데이터 셋으로 테스트해보기 위해서 `@ParameterizedTest`를 사용했다. 이는 정적 테스트에 해당하는 테스트이며, 컴파일 시점에 우리가 지정해놓은 데이터만으로 테스트 해야 하는 한계가 있다.

``` java
@ParameterizedTest
@ValueSource(ints = {1, 2, 3, 4, 5})
void isUnderTenTest(int number) {
  boolean result = isUnderTen(number);
  
  assertThat(result).isTrue();
}
```

하지만 같은 테스트를 다이나믹 테스트를 적용해보면, 데이터 셋을 런타임 시점에 동적으로 가져와서 테스트를 수행할 수 있다. 

``` java
@TestFactory
Stream<DynamicTest> isUnderTenTest() {
  List<Integer> numbers = getNumberFromDatabase() // 1, 2, 3, 4, 5, 6, 7, 8, 9

  return numbers.stream()
      .map(num -> dynamicTest(num + "가 10미만인지 검사",
          () -> {
               boolean result = isUnderTen(num);
               assertThat(result).isTrue();
          }
    ));
}
```

간단한 예시를 들어보았지만 테스트하고자 하는 메서드가 도메인 핵심 로직을 수행하는 메서드이고, 동적으로 여러 테스트 케이스를 검증이 필요하다면 다이나믹 테스트가 훨씬 유용한 방법임을 알 수 있을 것이다.

다이나믹 테스트의 강력함은 테스트 케이스가 동적으로 생성되고 수행되기 때문에, 여러  `dynamicTest`안에서 데이터 결과를 공유하고 연속성 있는 테스트를 작성할 수 있다는 것이다.



### 2. 가독성

지하철 정보관리 애플리케이션을 위한 인수테스트를 작성하던 미션 중 다음과 같은 리뷰가 있었다.

<img src="https://user-images.githubusercontent.com/42382027/89034789-9fddc600-d374-11ea-8daa-144d671dc40f.png" width="700">

테스트 코드의 가독성과 관련된 내용이었다. 

리뷰어의 표현대로 BDD 흐름에 따라 테스트를 작성하면 가독성이 좋아지는 건 사실이지만, 인수테스트에서처럼 하나의 메서드 안에서 사용자 시나리오를 작성해야 할 경우에는 코드가 길어지고 BDD 스타일을 적용하는 의미가 약해질 수 있다.

``` java
/*
Feature: 지하철 노선 관리

  Scenario: 지하철 노선을 관리한다.
    When 지하철 노선 n개 추가 요청을 한다.
    Then 지하철 노선이 추가 되었다.
    
    When 지하철 노선 목록 조회 요청을 한다.
    Then 지하철 노선 목록을 응답 받는다.
    And 지하철 노선 목록은 n개이다.
    
    When 지하철 노선 수정 요청을 한다.
    Then 지하철 노선이 수정 되었다.

    When 지하철 노선 제거 요청을 한다.
    Then 지하철 노선이 제거 되었다.
    
    When 지하철 노선 목록 조회 요청을 한다.
    Then 지하철 노선 목록을 응답 받는다.
    And 지하철 노선 목록은 n-1개이다.
 */
@DisplayName("지하철 노선을 관리한다.")
@Test
void manageLine() {
    // when
    createLine("신분당선");
    createLine("1호선");
    createLine("2호선");
    createLine("3호선");
    // then
    List<LineResponse> lines = getLines();
    assertThat(lines.size()).isEqualTo(4);
  
    // when
    LineResponse line = getLine(lines.get(0).getId());
    //then
    assertThat(line.getId()).isNotNull();
    assertThat(line.getName()).isNotNull();
    assertThat(line.getStartTime()).isNotNull();
    assertThat(line.getEndTime()).isNotNull();
    assertThat(line.getIntervalTime()).isNotNull();
  
    ...
}
```

위 코드는 나름의 가독성을 좋게 만들기 위한 노력으로 BDD 스타일을 적용했다. 하지만 인수테스트같이 하나의 메서드안에서 여러 메서드들이 연쇄적으로 호출되어야 한다면, 무엇에 대한 테스트인지 단번에 알아채기가 쉽지 않다. 

하지만 여기에 다이나믹 테스트를 적용한다면, 첫 번째 인자로 테스트 제목을 붙일 수 있으므로 어떤 테스트를 하고 있는지 명시할 수 있다는 장점을 얻을 수 있다.

``` java
@DisplayName("노선을 관리한다.")
@TestFactory
Stream<DynamicTest> dynamicTestsFromCollection() {
    return Stream.of(
        dynamicTest("노선을 만드는 요청으로 새로운 노선을 생성한다.", () -> {
            // when
            createLine("신분당선");
            createLine("1호선");
            createLine("2호선");
            createLine("3호선");

            // then
            List<LineResponse> lines = getLines();
            assertThat(lines.size()).isEqualTo(4);
        }),
    
        dynamicTest("생성된 노선 목록을 불러온다.", () -> {
            // given
            List<LineResponse> lines = getLines();
 
            // when  
            LineResponse line = lines.get(0);
 
            // then
            assertThat(line.getId()).isNotNull();
            assertThat(line.getName()).isNotNull();
            assertThat(line.getStartTime()).isNotNull();
            assertThat(line.getEndTime()).isNotNull();
            assertThat(line.getIntervalTime()).isNotNull();
        }),
      
        ...
    );
}
```

또한 다이나믹 테스트를 이용하면 각 테스트 별로 이름이 있기 때문에, 어디서 테스트가 실패했는지 알아보기가 쉽다는 장점이 있다.



## 다이나믹 테스트를 작성하는 방법

마지막으로 다이나믹 테스트를 작성하는 방법에 대해서 간단하게 소개하고 글을 마무리하도록 하겠다.

### 1. @TestFactory 어노테이션 사용

- `@TestFactory` 메소드는 테스트 케이스를 생산하는 팩토리이다. 
- `@TestFactory` 메서드는 private 또는 static 이면 안된다.

### 2. 컬렉션 반환

- @TestFactory 메서드는 Stream, Collection, Iterable 또는 Iterator 를 return 해야 한다. 그렇지 않으면, `JUnitException`을 발생시킨다.
- 테스트 수는 동적이며, ArrayList 크기에 따라 달라진다.

### 3. 첫번째 인자로 테스트 이름 작성

- `dynamicTest`는 테스트 이름과, 실행 함수 두 요소로 이루어져있다.

- 그 만큼 테스트 이름을 잘 작성해주는 것이 가독성을 높이는 측면에서도 중요하다.


위 작성법을 따라서 작성한 다이나믹 테스트의 기본 형식은 다음과 같다.

``` java
@TestFactory
Stream<DynamicTest> exampleDynamicTest() {
    return Stream.of(
        dynamicTest("First Dynamic Test", () -> {
            // test code
        }),
        dynamicTest("Second Dynamic test", () -> {
            // test code
        })
    );
}
```



## 결론

이 글에서는  다이나믹 테스트의 특징과 작성하는 방법 정도 소개했다. 기본적으로 다이나믹 테스트와 정적 테스트는 무엇이 더 좋다는 비교를 할 수가 없다. 각각의 목적이 다르기 때문인데, 목적 이외에도 두 테스트 방식의 눈에 띄는 차이 중 하나는 다이나믹 테스트는 JUnit의 생명주기 콜백함수를 지원하지 않는다는 것이다. 그러므로 `@BeforeEach`나 `@AfterEach`와 같은 테스트 생명 주기와 관련된 요소들을 사용할 수 없다. 

만약, JUnit의 생명주기를 사용해야 한다면 정적 테스트를 사용하는 것이 더 나은 선택일 것이다. 필자 역시 다이나믹 테스트를 테스트 생명주기가 필요 없는,  인수 테스트에서만 사용해 보았고, 이 글에서 언급한 장점들을 가진 테스트 코드를 작성해 볼 수 있었다는 점에서 매우 만족스러운 경험이었다.

