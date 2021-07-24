---
layout: post
title: DispatcherServlet - Part 1
author: [3기_다니]
tags: ['spring', 'spring-mvc', 'dispatcherservlet']
date: '2021-06-25T12:00:00.000Z'
draft: false
image: ../teaser/dispatcherservlet.png
---

DispatcherServlet에 대해 1, 2편으로 나누어 설명한다. 1편에서는 DispatcherServlet이 무엇인지 알아보고, 이것을 설정하는 방법과 동작 흐름을 살펴본다.<br/>

<br/>

## DispatcherServlet?

DispatcherServlet은 표현 계층(Presentation layer) 전면에서 HTTP 프로토콜을 통해 들어오는 모든 요청을 중앙집중식으로 처리하는 프론트 컨트롤러(Front Controller)이다.<br/>

DispatcherServlet은 Spring MVC의 핵심 요소이다. 클라이언트로부터 어떤 요청이 들어오면 서블릿 컨테이너(ex. 톰캣)이 요청을 받는다. 이때 공통 작업은 DispatcherServlet에서 처리하고, 이외 작업은 적절한 세부 컨트롤러로 위임한다.<br/>

DispatcherServlet도 <sup>\*</sup>Servlet이다. DispatcherServlet 클래스 코드를 살펴보면 `HttpServlet`을 상속하고 있다. (정확히는 DispatcherServlet -> FrameworkServlet -> HttpServletBean -> HttpServlet 상속 구조를 갖고 있다.)<br/>

```java
public class DispatcherServlet extends FrameworkServlet {
}

public abstract class FrameworkServlet extends HttpServletBean {
}

public abstract class HttpServletBean extends HttpServlet {
}
```

<br/>

<sup>\*</sup>Servlet이 무엇인지 궁금하다면, 테코블에 있는 아래 글을 참고해보자.<br/>

> [Servlet 과 ServletContainer](https://woowacourse.github.io/tecoble/post/2021-05-23-servlet-servletcontainer/)<br/>

<br/>

## 설정 방법

DispatcherServlet을 직접 구현하는 방법에는 2가지가 있다. 첫번째는 `web.xml`에 DispatcherServlet을 선언하고 URI로 요청 경로를 매핑하는 것이다. 아래는 표준 J2EE 서블릿 설정 예시이다.<br/>

```xml
<web-app>

    <servlet>
        <servlet-name>example</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>example</servlet-name>
        <url-pattern>*.form</url-pattern>
    </servlet-mapping>

</web-app>
```

<br/>

두번째는 `DispatcherServlet`을 상속하는 것이다. 이때는 `@WebServlet` 어노테이션에 urlPatterns를 지정할 수 있다. @WebServlet 어노테이션을 사용하려면 무조건 `HttpServlet`을 상속해야 한다. 앞에서 말했듯이 DispatcherServlet은 HttpServlet을 상속하기 때문에 서블릿 클래스에서 DispatcherServlet을 상속해도 문제가 없다.<br/>

```java
@WebServlet(name = "helloServlet", urlPatterns = "/hello")
public class HelloServlet extends DispatcherServlet {
}
```

<br/>

<br/>

## 동작 흐름

클라이언트에서 웹 요청을 했을 때, DispatcherServlet에서 이루어지는 간단한 동작 흐름을 아래와 같다. 해당 이미지에서 `Front Controller` 부분이 바로 DispatcherServlet을 나타낸다.<br/>

<p align="center"><img src="https://user-images.githubusercontent.com/50176238/123233756-48f55800-d515-11eb-8a94-a8bf3086780b.png"
></p>

> 이미지 출처: [15.2 The DispatcherServlet](https://docs.spring.io/spring-framework/docs/3.0.0.RC2/spring-framework-reference/html/ch15s02.html)<br/>

<br/>

좀 더 자세한 동작 흐름은 아래와 같다. 전체적으로 Spring MVC가 어떻게 흘러가는지 한눈에 보여준다.<br/>

<p align="center"><img src="https://user-images.githubusercontent.com/50176238/123378608-f3c64e80-d5c7-11eb-9c27-1a491aa74c56.png"></p>

> 이미지 출처: [Overview of Spring MVC Architecture](https://terasolunaorg.github.io/guideline/5.0.1.RELEASE/en/Overview/SpringMVCOverview.html#overview-of-spring-mvc-processing-sequence)<br/>

- ① DispatcherServlet으로 클라이언트의 `웹 요청(HttpServletRequest)`가 들어온다.
- 웹 요청을 LocaleResolver, ThemeResolver, MultipartResolver 인터페이스 구현체에서 분석한다.
- ② 웹 요청을 `HandlerMapping`에 위임하여 해당 요청을 처리할 Handler(Controller)를 탐색한다.
- ③ 찾은 Handler를 실행할 수 있는 `HandlerAdapter`를 탐색한다.
- ④, ⑤ 찾은 HandlerAdapter를 사용해서 Handler의 메소드를 실행한다. 이때, Handler의 반환값은 `Model`과 `View`이다.
- ⑥ View 이름을 `ViewResolver`에게 전달하고, ViewResolver는 해당하는 View 객체를 반환한다.
- ⑦ DispatcherServlet은 View에게 Model을 전달하고 화면 표시를 요청한다. 이때, Model이 null이면 View를 그대로 사용한다. 반면, 값이 있으면 View에 Model 데이터를 렌더링한다.
- ⑧ 최종적으로 DispatcherServlet은 `View 결과(HttpServletResponse)`를 클라이언트에게 반환한다.

해당 흐름은 @Controller를 기준으로 설명했다. @RestController의 경우 ⑥, ⑦ 과정이 생략된다. 즉, ViewResolver를 타지 않고 반환값에 알맞는 MessageConverter를 찾아 응답 본문을 작성한다.<br/>

<br/>

## 마무리

지금까지 DispatcherServlet의 정의, 설정 방법, 동작 흐름을 간단하게 짚어봤다. 이어지는 2편에서는 DispatcherServlet의 동작 원리를 코드와 함께 이해해보자.<br/>

<br/>

## References

- [[Spring]Dispatcher-Servlet이란?](https://mangkyu.tistory.com/18)
- [15.2 The DispatcherServlet](https://docs.spring.io/spring-framework/docs/3.0.0.RC2/spring-framework-reference/html/ch15s02.html)
- [Spring MVC 처리 과정](https://github.com/binghe819/TIL/blob/master/Spring/MVC/Spring%20MVC%20flow.md)
- [An Intro to the Spring DispatcherServlet](https://www.baeldung.com/spring-dispatcherservlet)
