---
layout: post
title: Spring Boot에서 properties 값 주입받기
author: "비밥"
comment: "true"
tags: ["spring"]
toc: true
---

## 개요

Spring Boot를 이용해서 어플리케이션을 만들다 보면 외부에서 특정 값들을 주입받아야 하는 경우가 있다. 예를 들면 AWS의 특정 컴포넌트를 사용하기 위한 secret key가 될 수도 있고 외부 API를 사용하기 위한 API key가 될 수도 있다. 이러한 값들을 소스 코드에 하드 코딩한다면 악의적인 의도를 가진 사람이 값을 탈취하여 사용하면서 큰일로 이어질 수 있다.

따라서 이렇게 중요한 값들을 `application.properties` 혹은 `application.yml` 과 같은 외부 설정값을 관리하는 파일에 적어두고 사용하기도 하고 .jar 파일을 실행하기 위한 커맨드에서 직접 값을 넘겨주기도 한다.

이번 글은 **Spring Boot에서 외부 파일(ex.`application.properties`, `application.yml`)에 있는 값들을 소스 코드에 주입해서 사용하는 방법**에 대해 살펴보고자 한다.

예제로 사용된 코드는 [Github](https://github.com/pci2676/post-for-blog/tree/master/javable/ymlpropertiesbinding)에서 확인 할 수 있다.

## .properties vs .yml

**글에서는 `application.yml`을 사용**할 것이기에 `application.properties`와 `application.yml`의 차이를 가볍게 짚고 넘어가고자 한다.

Spring Boot 어플리케이션을 생성하면 기본적으로 resources 디렉토리에 `application.properties` 파일이 생성되어있는 것을 확인할 수 있다. 이 파일을 그대로 이용해도 문제는 없지만 .yml을 이용하는 것보다 불편한 점이 있다.

만약 .properties 로 설정을 다음과 같이 작성한다면

```properties
spring.datasource.hikari.driver-class-name=org.mariadb.jdbc.Driver
spring.datasource.hikari.jdbc-url=jdbc:mariadb://localhost:3306/testdb
spring.datasource.hikari.username=root
spring.datasource.hikari.password=root

spring.datasource.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL5InnoDBDialect
spring.datasource.jpa.properties.hibernate.format_sql=true

spring.datasource.jpa.show-sql=true
spring.datasource.jpa.generate-ddl=true
```

.yml은 다음과 같이 표현이 가능해진다.

```yml
spring:
  datasource:
    hikari:
      driver-class-name: org.mariadb.jdbc.Driver
      jdbc-url: jdbc:mariadb://localhost:3306/testdb
      username: root
      password: root
    jpa:
      properties:
        hibernate:
          dialect: org.hibernate.dialect.MySQL5InnoDBDialect
          format_sql: true
      show-sql: true
      generate-ddl: true
```

.yml을 이용함으로써 **계층 구조**로 설정값을 표현할 수 있고 **prefix의 중복 제거**가 가능해진다.

*참고로 .yml 을 이용하기 위해서는 SnakeYAML 라이브러리가 classpath에 존재해야 한다. spring-boot-starter 의존성은 이 라이브러리를 기본적으로 제공해준다.*

## @Value

가장 간단하게 값을 주입하는 방식이다. 사용 방법은 `@Value` 어노테이션에 값을 가리키고 있는 placeholder를 명시해주거나 SpEL을 명시해주면 된다.

아래와 같은 `application.yml`이 정의된 상태에서 진행하자.

```yml
external:
  record-year: 2020
  api:
    name: kakao
    key: 123123
```

### placeholder 방식

`${app.name}`와 같이 `${}` 내부에 값의 위치를 적어서 `@Value`에 값을 주입하는 방식이다.

```java
@Service
public class ExternalService {
    @Value("${external.record-year}")
    private String recordYear;
  
    @Value("${external.api.name}")
    private String apiName;
  
    @Value("${external.api.key}")
    private Integer apiKey;
}
```

위와 같이 `external`아래에 `record-year`로 설정된 값을 사용하기 위해 `${external.record-year}`로 `@Value`에 명시한 것을 확인할 수 있다. 이러한 방식을 이용해서 String, Integer 등의 타입 값을 주입하여 사용할 수 있다.

아래는 테스트 코드이다.

```java
@SpringBootTest
class ExternalServiceTest {
    @Autowired
    private ExternalService externalService;

    @DisplayName("@Value 를 이용한 properties bind")
    @Test
    void valueBindTest() {
        assertThat(externalService.getRecordYear()).isEqualTo("2020");
        assertThat(externalService.getApiKey()).isEqualTo(123123);
        assertThat(externalService.getApiName()).isEqualTo("kakao");
    }
}
```

### SpEL 방식

SpEL 은 Spring Expression Language의 약자이다. Spring에서 제공하는 특수한 표현 식으로 이러한 표현 식을 이용해 `@Value`에 값을 주입할 수 있다.

```java
@SpringBootTest
public class SpELTest {

    @Value("#{1 eq 1}")
    private boolean spelBoolean;

    @Value("#{externalService.apiName eq 'kakao'}")
    private String spelNameString;

    @Test
    void spelTest() {
        assertThat(spelBoolean).isTrue();
        assertThat(spelNameString).isEqualTo("true");
    }
}
```

`#{}` 내부에 표현 식을 작성하여 사용한다. placeholder 방식과 다르게 다른 Spring Bean을 참조해서 값을 주입할 수 있다. (ex. `@Value("#{externalService eq 'chan'}")`)

*여기서 SpEL 에 대해 자세히 다루면 내용이 너무 많아 글의 목적이 흐려지기 때문에 자세히 알아보고 싶다면 [링크](https://docs.spring.io/spring-framework/docs/3.2.x/spring-framework-reference/html/expressions.html)를 참고하도록 하자.*

### 문제점

`@Value` 방식에는 안타깝게도 문제점이 있다.

위 예제에서 true 값이 String으로도 Boolean으로도 사용되는 것을 확인 할 수 있다.  
다시한번 코드로 살펴보도록 하자.

#### 타입 안정성

아래와 같은 `application.yml`이 있고 개발자는 이 값을 boolean으로 사용하길 바랬다고 가정하자.

```yml
external:
  value: true
```

그리고 아래 테스트 코드는 성공을 한다.

```java
@SpringBootTest
public class ValueProblemTest {
    @Value("${external.value}")
    private String stringValue;

    @Value("${external.value}")
    private boolean booelanValue;

    @Test
    void problemTest() {
        assertThat(stringValue).isEqualTo("true");
        assertThat(booelanValue).isEqualTo(true);
    }
}
```

보이는 것과 같이 똑같은 값을 String으로도 boolean으로도 사용할 수 있다. 이게 어떤 문제가 되는 것일까?

**.yml에 설정해둔 값을 서로 다른 클래스에서 `@Value`를 이용해서 산발적으로 사용한다고 생각**해보자. 설정값을 boolean으로 가져다 쓴다면 다행이지만 모든 개발자가 String으로 불러다 쓰는 **실수하지 않을 거라는 확신을 할 수 없다**. 지금은 단순히 true이지만 숫자가 연속된 형태의 값(ex.342462351)이라면 이 값을 숫자로 인지할지 문자열로 인지할지 모르게 된다. 결국 타입에 대한 안정성을 가지기가 힘들다는 것을 의미한다. 

## @ConfigurationProperties

이번에는 타입 안정성을 가지는 방법을 사용해 보도록 하자.

이 방법은 클래스를 정의해 놓고 값을 주입해서 사용한다. 

예제 코드로 알아보자.

```yml
external:
  record-year: 2020
  api:
    name: kakao
    key: 123123
```

위와 같은 `application.yml`이 있을 때

```java
@Getter
@Setter
@Configuration
@ConfigurationProperties("external")
public class TypeSafeProperties {
    private String recordYear;
    private Api api;

    @Getter
    @Setter
    public static class Api {
        private String name;
        private Integer key;
    }
}
```

위와 같이 Properties 클래스를 정의해서 사용한다.

**`@ConfigurationProperties` 의 `value`로 prefix를 적어줘야 한다**. 중첩 클래스(ex. Api)를 사용하게 되는 경우 이름을 똑같이 일치시켜줘야 하는 것을 주의해야 한다.

한가지 더 주의해야 할 점은 **setter를 반드시 정의**해주어야 한다. setter가 없다면 `Caused by: java.lang.IllegalStateException: No setter found for property` 이 발생하게 된다.

### `@Value` 도 똑같이 할수 있지 않나?

똑같이 할 수 있다. 그러나 불편한 점이 있다. 

완성된 코드를 보도록 하자. 위에서 사용했던 `application.yml` 의 external 값들을 사용했다.

```java
@Getter
@RequiredArgsConstructor
@Configuration
public class ExternalProperties {
    @Value("${external.record-year}")
    private String recordYear;
    private final Api api;

    @Getter
    @Configuration
    public static class Api {
        @Value("${external.api.name}")
        private String apiName;
        @Value("${external.api.key}")
        private Integer apiKey;
    }
}
```

`@Value`에 계속에서 중복된 값(external.api)을 적어줘야 하는 불편함이 있고 중첩 클래스를 Bean으로 생성해서 의존성 주입을 해줘야 한다.

그리고 `@Value`에서는 Snake case로 작성된 값들을 토씨 하나 틀리지 않고 적어줘야 했지만 `@ConfigurationProperites`를 사용하면 Camel case로 작성한 변수를 찾아 주입해준다.

### 문제점

#### 불변성

`@Value`와 `@ConfigurationProperties` 두 방식 모두 공통으로 **불변이 아니라는 문제점**이 있다.

문제는 final 한 필드로 인스턴스 변수를 생성할 수 없기 때문에 불변성을 유지할 수가 없다. 심지어  `@ConfigurationProperties`은 개발자 입장에서 불필요한 setter가 공개되어 있어 중간에 값이 변경될 위험성이 크게 남아있다.

## @ConstructorBinding

이전에는 불변성을 지킬 수 없는 문제가 있었기 때문에 Spring Boot 2.3 버전 이후 생성자 주입방식으로 불변성을 가지고 Properties 파일을 만들 수 있는 방식이 추가되었다.

**`@ConstructorBinding` 어노테이션을 이용하면 final 필드에 대해 값을 주입**해준다. 그리고 중첩 클래스가 있다면 자동으로 중첩 클래스의 final 필드 또한 자동으로 값을 주입하는 대상이 된다.

*final 키워드를 명시하지 않는다면 setter를 이용해서 값을 binding 하려하기 때문에 setter가 없다는 exception이 발생한다.*

```java
@Getter
@RequiredArgsConstructor
@ConstructorBinding
@ConfigurationProperties("external")
public final class ConstructorProperties {
    private final String recordYear;
    private final Api api;

    @Getter
    @RequiredArgsConstructor
    public static final class Api {
        private final String name;
        private final Integer key;
    }
}
```

다만 이 방식을 사용하면 Properties 클래스에 직접적으로 `@Configuration`을 이용해서 직접적으로 Spring Bean으로 만들어 주지 않는다.

대신 아래와 같이 PropertiesConfiguration 클래스에 **`@EnableConfigurationProperties`을 이용해서 생성할 Properties 클래스의 클래스 타입을 명시**해주면 Spring Bean으로 등록된다.

```java
@Configuration
@EnableConfigurationProperties(value = {ConstructorProperties.class})
public class PropertiesConfiguration {
}
```

이렇게 `@ConstructorBinding` 어노테이션을 이용함으로써 불필요한 setter를 사용하지 않게 되면서 불변성을 유지할 수 있게 됐다.

## 정리

`@Value`를 사용하여 값을 주입하는 방식과 `@ConfigurationProperties`를 이용해서 외부 설정 파일에 존재하는 값을 주입하는 방법을 알아봤다.

`@Value`와 `@ConfigurationProperties`를 이용하는 방식에 대한 차이는 [Spring Boot 공식 문서](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-external-config-vs-value)에서 잘 설명이 되어 있다. 해당 부분을 전부 다루기에는 글이 너무 길어지기 때문에 가장 눈에 띄는 차이에 대해서 몇가지 알아봤다.

가급적이면 불변성을 유지할 수 있는 `@ConfigurationProperties`과 `@ConstructorBinding` 을 같이 사용하는 것이 좋아 보이지만 Spring Batch를 사용하면 Late Binding을 위해 `@Value`를 사용해야 하는 경우도 발생한다. 따라서 언제나 그렇듯 **상황에 따라 알맞게 적절한 어노테이션을 선택해서 사용**해야 한다.

## 참고

https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-external-config

https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-external-config-yaml

https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-features.html#boot-features-external-config-typesafe-configuration-properties

https://docs.spring.io/spring-framework/docs/3.2.x/spring-framework-reference/html/expressions.html
