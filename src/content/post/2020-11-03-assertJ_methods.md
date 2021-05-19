---
layout: post
title: 'AssertJ의 다양한 메소드 활용해보기.'
author: [2기_카일]
tags: ['test']
date: '2020-11-03T12:00:00.000Z'
draft: false
image: ../teaser/assertj.png
---

Junit에서 기본으로 제공하는 assertions 보다 AssertJ는 보다 많은 기능을 제공한다. 하지만 일반적으로 테스트할 때 항상 비슷한 형태로만 테스트하기 때문에 이번 포스팅에서는 AssertJ의 다양한 기능 중 사용에 도움이 될만한 내용들을 위주로 다뤄보고자 한다.

## 기본 데이터(테스트에 사용)

```java
class AssertJTest {
    Chicken chicken;
    Chicken chicken2;
    TestChicken testChicken;
    TestChicken testChicken2;
    TestChicken testChicken3;
    TestChicken testChicken4;
    List<ChickenName> chickenNames;

    @BeforeEach
    void setUp() {
        chicken = new Chicken(1L, "HI", BigDecimal.valueOf(1000L));
        chicken2 = new Chicken(1L, "HI", BigDecimal.valueOf(1000L));

        testChicken = new TestChicken(1L, new ChickenName("HI"), BigDecimal.valueOf(1000L));
        testChicken2 = new TestChicken(1L, new ChickenName("HI"), BigDecimal.valueOf(1000L));
        testChicken3 = new TestChicken(1L, new ChickenName("HI"), BigDecimal.valueOf(1000L));
        testChicken4 = new TestChicken(1L, new ChickenName("HI"), BigDecimal.valueOf(1000L));

        chickenNames = Arrays.asList(new ChickenName("HI"), new ChickenName("HI"),
            new ChickenName("HI"), new ChickenName("HI"));
    }
}
```

## 내부값 검증.

> Enable using a recursive field by field comparison strategy when calling the chained {@link RecursiveComparisonAssert#isEqualTo(Object) isEqualTo} assertion.

동일성 비교가 아닌 동등성 비교를 하고 싶은 경우 `usingRecursiveComparison()` 이라는 키워드를 사용할 수 있다. 이는 필드값 비교를 통해 계산하며 `nested` 한 객체도 함께 필드로 비교한다. 아래와 같이 리스트도 내부 컬렉션 값의 필드를 비교한다.

추가적으로 사용할 수 있는 키워드는 아래와 같다. 기본적으로 `using` 이라는 keyword로 접근하면 사용할 수 있는 Comparator가 나오며 자신이 직접 정의하고 싶은 경우 usingComparator()를 사용하면 된다.

- **ignoring - 특정 값이나, 타입 등을 제외하고 비교하고 싶은 경우 사용**
  - ignoringFields( ) - 특정 필드값을 제외하고 비교하고 싶은 경우
  - ignoringActualNullFields() - `null` 은 제외하고 비교하고 싶은 경우
- **usingComparator() - 자신이 직접 정의한 Custom Comparator를 통해 비교하고 싶은 경우**

```java
class AssertJTest {

    @Test
    void various() {
        assertThat(chicken)
            .usingRecursiveComparison()
            .isEqualTo(chicken2);

        assertThat(testChicken)
            .usingRecursiveComparison()
            .isEqualTo(testChicken2);

        assertThat(testChickens)
            .usingRecursiveComparison()
            .isEqualTo(testChickens2);
    }
}
```

## Nested된 값을 꺼내서 검증하기.

> Uses the given {@link Function} to extract a value from the object under test, the extracted value becoming the new object under test.

검증하고자 하는 값이 특정 객체에 속해있다면 `extracting` 이라는 키워드로 접근하면 된다. 이는 특정 값을 꺼내서 사용할 수 있도록 Lambda를 인자로 받는데, 위에서 사용한 `UsingRecuriveComparison()`과 함께 사용해보자.

- 리스트의 경우 각 원소에 대해서 위와 같이 어떤 Comparator를 사용할지 결정할 수 있다.
  - usingFieldByFieldElementComparator()
  - usingComparatorForElementFieldsWithType()

```java
    @Test
    void extracting() {
        assertThat(testChicken)  // 치킨 하나의 이름을 가져와서, 다른 치킨의 이름과 비교(필드)
            .extracting(TestChicken::getName)
            .usingRecursiveComparison()
            .isEqualTo(testChicken2.getName());

        List<TestChicken> chickens = Arrays.asList(testChicken, testChicken2, testChicken3, testChicken4);

        assertThat(chickens).extracting(TestChicken::getName) // 치킨4마리의 이름을 모두
            .usingFieldByFieldElementComparator() // 이름만 담아놓은 리스트의 원소와 하나씩 필드 비교
            .isEqualTo(chickenNames);
    }
```

## Filtering 이후에 검증하기.

특정 Collection에 Filtering 이후에 값을 검증하는 방법으로 `FilteredOn` 이라는 키워드를 사용할 수 있다. 메소드 체이닝을 통해 `Stream` 을 사용하듯 다양한 필터링 조건을 추가할 수 있다.

```java
    @Test
    void filteredOn() {
        testChicken = new TestChicken(1L, new ChickenName("HI"), BigDecimal.valueOf(1000L));
        testChicken2 = new TestChicken(1L, new ChickenName("HHI"), BigDecimal.valueOf(1000L));
        testChicken3 = new TestChicken(1L, new ChickenName("HHHI"), BigDecimal.valueOf(1000L));
        testChicken4 = new TestChicken(1L, new ChickenName("HEE"), BigDecimal.valueOf(1000L));

        List<ChickenName> chickenNames = Arrays.asList(new ChickenName("HI"), new ChickenName("HHI"),
            new ChickenName("HHHI"), new ChickenName("HEE"));

        assertThat(chickenNames).filteredOn((chickenName) -> chickenName.getName().contains("HHI"))
            .usingRecursiveComparison()
            .isEqualTo(Arrays.asList(new ChickenName("HHI"), new ChickenName("HHHI")));
    }
```

## 근사치 계산하기 및 숫자 관련

숫자와 관련된 값을 `assertThat()` 안에서 사용하는 경우 다양한 비교 연산자들을 제공한다. `LocalDate` 관련해서도 다양한 메소드를 제공하니 확인해보길 바란다.

- isBetween() - From A To B
- isClose()
- isNegative()

```java
    @Test
    void percentage() {
        assertThat(BigDecimal.valueOf(10000L))
            .isCloseTo(BigDecimal.valueOf(9999L), Percentage.withPercentage(90));
    }
```

## 결론

AssertJ에서는 다양한 형태로 단언을 확인할 수 있는 방법을 제공한다. [공식문서](https://joel-costigliola.github.io/assertj/assertj-core-features-highlight.html)에서도 쉽게 확인할 수 있으며, 기본적으로 코드 문서에도 예시와 함께 잘 나타나 있다.

습관적으로 사용하는 메소드만 사용하다보면 테스트코드의 단언 부분이 너무 길어져, 가독성을 해칠 수 있다. 의도를 명확히 드러내면서도 사용하기도 편리한 메소드를 찾아보며 가독성 좋은 코드를 작성해보자.

`이런게 있지 않을까?` 라는 식으로 단어를 검색하다보면 좋은 메소드를 많이 발견할 수 있을 것이다.
