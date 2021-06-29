---
layout: post  
title: bean wiring
author: [영이]
tags: ['spring', 'bean']
date: "2021-06-25T12:00:00.000Z"
draft: false
image: ../teaser/wiring.png
---
스프링을 처음 공부하는 사람을 대상으로 작성한 글입니다.

## 빈 와이어링(wiring) 이란?
스프링을 사용하는 애플리케이션에서 각 객체가 필요한 다른 객체를 직접 찾거나 생성할 필요가 없다. 컨테이너가 협업할 객체에 대한 정보를 주기 때문이다.
애플리케이션 객체 간의 이러한 연관 관계 형성 작업이 바로 의존성 주입(Dependency Injection)의 핵심이며, 이를 보통 와이어링(wiring)이라 한다.

## 스프링 설정 옵션
스프링 컨테이너는 애플리케이션 내에서 빈 생성 및 DI를 통해 객체 사이의 관계를 조정해 준다. 하지만 어떤 빈을 생성할지 어떻게 엮을지는 개발자의 책임이다. 이를 하는 방법에는 세 가지 방법이 있다.

- XML에서 명시적 설정
- 자바에서의 명시적 설정
- 내재되어 있는 빈을 찾아 자동으로 와이어링

어떤 것을 선택할지에는 정답이 없다. 프로젝트에 맞게 적절히 사용하면 된다. 다만 할 수 있다면 자동 설정을 하는 것이 좋다. 명시적인 설정이 적을수록 좋다.

## 빈을 XML로 와이어링하기

스프링 초반부터 XML은 설정을 나타내는 주요 방법이었다. 스프링이 XML과 오랜 기간 연관됐지만 유일한 옵션은 아니다. 스프링은 자바 기반 설정과 자동 설정을 강력하게 지원한다. XML이 첫 번째 선택은 아니다. 그렇지만 수많은 XML 기반의 스프링 설정이 사용되므로 XML을 어떻게 사용하는지 아는 것이 중요하다. 새로 작성하는 스프링이라면 자동설정과 JavaConfig를 사용하자.

**스프링 XML 설정 파일 포맷**

**빈(Bean) 설정**

`<bean>` 태그를 이용해 빈을 정의한다. 필수 속성은 class 속성 하나뿐이다. id는 빈의 id를 통해 참조할 때도 있는 경우에만 설정하면 된다. (getBean() 이나 ref 속성으로 빈을 참조하는 경우)

```java
<bean id="userDao" class="chap1.dao.UserDao">
```

**DI(Dependency Injection) 설정**

생성자 주입

- `<constructor-arg>` 요소
- `c:`c-네임스페이스 (스프링 3.0 에서 도입) `<constructor-args>` 를 좀 더 간결하게 표현

```java
<bean id="registerService" class="ems.member.service.StudentRegisterService">
    <constructor-arg ref="studentDao" />
</bean>
```

프로퍼티 주입

- `<property>`
- `p:` p-네임스페이스

```java
<bean id="dataBaseConnectionInfoDev" class="ems.member.DataBaseConnectionInfo">
	<property name="jdbcUrl" value="jdbc:oracle:thin:@localhost:1521:xe" />
	<property name="userId" value="scott" />
	<property name="userPw" value="tiger" />
</bean>
```

## Java로 빈 와이어링하기
대부분 컴포넌트 스캐닝과 오토 와이어링을 사용한 자동 설정을 선호하지만, 자동 설정은 옵션이 아니며 스프링을 명시적으로 설정해야 한다. 타사 라이브러리의 컴포넌트를 애플리케이션으로 와이어하려면 그 라이브러리의 소스 코드를 가지고 있지 않아 `@Component` 와 `@Autowired` 를 사용할 수 없다. 
이 경우 두 가지의 선택방법이 있다.
- Java
- XML

JavaConfig는 매우 강력하고, 타입 세이프 하며, 리팩토링이 친화적이므로 명시적인 설정을 위해 선호하는 옵션이다. JavaConfig는 설정용 코드이다. 어떠한 비즈니스 로직도 포함하지 않고 비즈니스 로직에 영향을 주지 않는다.

**설정 클래스 만들기**

JavaConfig 클래스 핵심은 `@Configuration` 애노테이션을 다는 것이다. 이 애노테이션은 이를 설정 클래스로 식별하고, 스프링 애플리케이션 컨텍스트에서 만들어진 빈의 자세한 내용이 포함될 수 있다는 것을 나타낸다.

```java
@Configuration
public class AppConfig {
}
```

**빈 선언하기**

JavaConfig 에서 빈을 선언하기 위해서 원하는 타입의 인스턴스를 만드는 메소드를 만들고, `@Bean` 애노테이션을 단다. `@Bean` 은 이 메소드가 스프링 애플리케이션 컨텍스트에서 빈으로 등록된 객체를 반환해야 함을 나타낸다. 메소드의 몸체는 궁극적으로 빈 인스턴스를 만드는 로직이다.

```java
@Bean
public UserDao userDao() {
    return new UserDao();
}
```

**JavaConfig 주입하기**

스프링의 모든 빈은 싱글톤으로 생성된다. 따라서 서로 다른 빈에서 같은 인스턴스를 참조할 수 있다.
```java
@Bean
public CDPlayer cdPlayer(CompactDisc compactDisc) {
    return new CDPlayer(compactDisc);
}
```

```java
@Bean
public CDPlayer cdPlayer(CompactDisc compactDisc) {
    CDPlayer cdPlayer = new CDPlayer();
    cdPlayer.setCompactDisc(compactDisc);
    return cdPlayer;
}
```

## 자동으로 빈 와이어링

사용하기 편리한 것은 스프링 자동 설정보다 나은 것은 없다. 스프링이 자동으로 설정된다면 명시적인 와이어링 빈을 건드릴 필요가 없다.
스프링은 두 가지 방법으로 오토와이어링을 수행한다.

- 컴포넌트 스캐닝 - 애플리케이션 컨텍스트에서 생성되는 빈을 자동으로 발견한다.
- 오토와이어링 - 자동으로 빈 의존성을 충족시킨다.

컴포넌트 스캐닝, 오토와이어링을 모두 사용하면 명시적 설정을 최소한으로 유지 할 수 있다.

**발견 가능한 빈 만들기**

`@Component` 애노테이션을 달면 컴포넌트 클래스임을 나타내고, 클래스가 빈으로 만들어야 함을 스프링에 단서로 제공한다.

```java
@Component
public class SgtPeppers implements CompactDisc {

}
```
이 클래스는 `@Component` 가 있으므로 스프링이 빈으로 만든다. 하지만 컴포넌트 스캐닝은 기본적으로 켜져 있지 않다. `@Component`가 있는 클래스를 찾기 위해 명시적인 설정을 작성할 필요가 있다.

- @ComponentScan
  - `@ComponentScan` 은 더이상의 설정 없이 설정 클래스로서 동일한 클래스를 기본 스캐닝한다. 스프링은 그 패키지와 하위 패키지를 스캔하고, `@Componet` 애너테이트된 클래스를 찾는다. 그리고 자동으로 스프링으로 빈을 만든다.
  ```java
  @Configuration
  @ComponentScan
  public class WebMvcConfig {
      
  }
  ```

- XML 설정을 통한 컴포넌트 스캐닝 활성화
  - 설정한 패키지 이하에서 componentScan 이 동작한다.
  ```xml
  <context:component-scan base-package="com.example.controller"/>
  ```

**컴포넌트 스캔된 빈 명명하기**

스프링 애플리케이션 컨텍스트에서 모든 빈은 ID가 주어진다. 빈에 ID를 명시적으로 설정해주지 않는다면 클래스 명으로부터 유추되어 할당된다.
빈은 클래스 명의 첫 글자를 소문자로 바꾼 ID를 가진다.
원하는 ID를 가지고 싶다면 `@Component` 에 원하는 ID를 값으로 넣어주면 된다. 또 `@Named` 를 사용하는 방법도 있지만 잘 사용하지 않는 방법이다.

**컴포넌트 스캐닝을 위한 베이스 패키지 세팅**

애트리뷰트 없이 `@ComponetScan`을 사용하면 베이스 패키지로서 설정 클래스 패키지가 기본이라는 의미이다. 
스프링 부트를 사용하면 `@SpringBootApplication`내의 `@ComponetScan`이 있다. 따라서 `@SpringBootApplication`이 있는 클래스가 기본이 된다.

애플리케이션 코드와 분리하여 설정 코드를 패키지안에 보관할 경우 명시적으로 베이스 패키지를 설정해야한다. 
이때 사용할 수 있는 방법은 `@ComponetScan`의 값 속성에 기술하는 것 뿐이다. 이때 사용하는 애트리뷰트에는 basePackages, basePackageClasses가 있다.
이름에 나타나듯이 기본이 되는 패키지를 설정하거나 클래스를 설정할 수 있다. 클래스를 사용하면 클래스가 어떤 패키지 안에 있는 컴포넌트 스캐닝을 위한 베이스 패키지로써 사용한다.

```java
@Configuration
@ComponetScan("com.example")
public class CustomConfig() {
    
}
```

**오토와이어링 되는 빈의 애노테이션**

오토와이어링은 스프링이 빈의 요구사항과 매칭되는 애플리케이션 컨텍스트상에서 다른 빈을 찾아 빈 간의 의존성을 자동으로 만족하게 하도록 하는 수단이다. 
 오토와이어링을 수행 하도록 지정하기 위해 `@Autowired` 를 사용한다. 

@Autowired 의 사용

- 생성자 주입
- setter 주입
- 필드 주입

생성자를 사용하면 @Autowired 를 생략해줄 수 있다. 가급적이면 생성자를 통한 주입을 사용하는 것이 좋다. [왜 Constructor Injection을 사용해야 하는가](https://woowacourse.github.io/javable/post/2020-07-18-di-constuctor-injection/) 를 읽어보면 좋을 것 같다.


생성자나 세터 메소드를 포함한 어떤 메소드이든 스프링은 메소드 파라미터에 의존성을 가진다. 한 개의 빈이 일치하면 그 빈은 와이어링 된다. 매칭되는 빈이 없다면 스프링은 애플리케이션 컨텍스트가 생성될 때 예외를 발생시킨다.
예외를 피하기 위해 `@Autowired` 에서 required 애트리뷰트를 false로 설정하면 된다. 

## 요약
스프링에 빈을 와이어링하는 세 가지 기본 방법에는 자동설정, 명시적인 Java 기반 설정, 명시적인 XML 기반 설정이 있다. 이러한 기술들은 스프링 애플리케이션의 구성요소와 컴포넌트 간의 관계를 설명한다.
명시적인 설정과 관련된 유지보수 비용을 가능한 한 피하기 위해 자동 설정을 쓰는 것이 좋다. 명시적으로 설정하더라도 XML 설정보다는 Java 기반의 설정을 쓰는 것이 좋다. 
Java 기반의 설정이 더 강력하고 타입세이프하며 리팩토링 할 수 있기 때문이다.
