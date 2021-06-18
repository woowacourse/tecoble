---
layout: post  
title: Spring ArgumentResolver와 Interceptor
author: [샐리]
tags: ['spring']
date: "2021-05-22T12:00:00.000Z"
draft: false
image: ../teaser/spring.png
---

이번 글에서는 ArgumentResolver와 Interceptor를 사용할 때 spring이 요청을 처리하는 순서를 알아보고자 한다.  
그 전에 ArgumentResolver는 무엇인지, Interceptor는 무엇인지 알아보도록 하자.

---

## Spring ArgumentResolver
어떠한 요청이 컨트롤러에 들어왔을 때, 요청에 들어온 값으로부터 원하는 객체를 만들어내는 일을 `ArgumentResolver`이 간접적으로 해줄 수 있다.

예를 들어, 어떤 사용자가 로그인 되어 있다고 가정하자.  
사용자가 자신의 정보를 조회하거나 수정하는 것과 같은 민감한 요청을 하는 경우, 우리는 이 사용자가 올바른 사용자인지 확인을 해야 한다.  
뿐만 아니라, 사용자가 가진 토큰이 유효한 토큰인지 검증을 거친 후에 토큰에 저장된 id를 꺼내 `LoginMember`라는 객체로 만들어내는 과정이 필요하다.  
`ArgumentResolver`를 사용하지 않을 때는 다음과 같이 구현할 수 있을 것이다.  

```java
@GetMapping("/me")
public ResponseEntity<MemberResponse> getMemberOfMine(HttpServletRequest request) {
  String token = AuthorizationExtractor.extract(request);
  if(!jwtTokenProvider.isValidToken(token)) {
    throw new InvalidTokenException();
  }

  String id = jwtTokenProvider.getPayLoad(token);
  LoginMember loginMember = new LoginMember(Long.parseLong(id));

  MemberResponse memberResponse = memberService.findMember(loginMember.getId());
  return ResponseEntity.ok().body(memberResponse);
}
```  

하지만 위와 같이 검증과 관련된 코드가 Controller에 존재할 때는 사용자 검증이 필요한 모든 메서드에 같은 코드가 중복될 뿐만 아니라 Controller에서 수행하는 책임이 증가한다는 문제가 존재한다.    
뿐만 아니라 이 경우에 MemberController가 MemberService뿐만 아니라 JwtTokenProvider에도 의존해야 하기도 한다.      
이러한 문제를 ArgumentResolver의 사용을 통해 해결할 수 있다.  

---

### ArgumentResolver의 사용
ArgumentResolver는 `HandlerMethodArgumentResolver`를 구현함으로써 시작된다.    
Spring에서 설명하는 HandlerMethodArgumentResolver는 다음과 같다.  
> Strategy interface for resolving method parameters into argument values in the context of a given.

Spring에서는 ArgumentResolver를 하나의 `전략 인터페이스`로 설명하고 있다.    
인터페이스는 아래 두 메서드를 구현하도록 명시하고 있다.  

```java
boolean supportsParameter(MethodParameter parameter);

@Nullable
Object resolveArgument(MethodParameter parameter, @Nullable ModelAndViewContainer mavContainer, NativeWebRequest webRequest, @Nullable WebDataBinderFactory binderFactory) throws Exception;
```  

간단히 설명하자면 우리는 원하는 ArgumentResolver가 실행되길 원하는 Parameter의 앞에 특정 어노테이션을 생성해 붙인다.    
`supportsParameter`는 요청받은 메서드의 인자에 원하는 어노테이션이 붙어있는지 확인하고 원하는 어노테이션을 포함하고 있으면 true를 반환한다.  
`resolveArgument`는 `supportsParameter`에서 true를 받은 경우, 즉, 특정 어노테이션이 붙어있는 어느 메서드가 있는 경우 parameter가 원하는 형태로 정보를 바인딩하여 반환하는 메서드이다.  

이렇게 [ArgumentResolver](https://www.baeldung.com/spring-mvc-custom-data-binder)를 사용했을 때 Controller의 구현은 아래와 같다.  

```java
  @GetMapping("/me")
  public ResponseEntity<MemberResponse> findMemberOfMine(@AuthenticationPrincipal LoginMember loginMember) {
      MemberResponse memberResponse = memberService.findMember(loginMember.getId());
      return ResponseEntity.ok().body(memberResponse);
  }
```

이렇게 함으로써 검증의 책임을 Controller가 직접적으로 가지지 않도록 할 수 있다.    
게다가 어노테이션만 붙여주면 유효한 토큰을 사용하는 것이 검증된 사용자가 필요한 정보(id)를 가지고 필요한 객체로 나오므로 편리하고 간단한 구현을 할 수 있다.  

---

## Spring Interceptor
우리가 블로그를 운영하고 있다고 가정해보자.
블로그에 글을 작성할 수 있는 사람은 한정되어 있다.
글에 댓글을 달 수 있는 사람 또한 로그인 된 회원만 작성할 수 있다.

이 경우는 위처럼 객체를 반환할 필요가 없다.  
인가된 회원인 경우에 행위를 실행시켜주면 되고, 아니라면 하고자 하는 행위를 못하도록 하면 된다.  
Interceptor를 사용하지 않을 때의 Controller 구현은 다음과 같다.

```java
  @PostMapping("/blog")
  public ResponseEntity postBlog(HttpServletRequest request) {
      String accessToken = AuthorizationExtractor.extract(request);
      if (jwtTokenProvider.validateToken(accessToken)) {
          return ResponseEntity.noContent().build();
      }
      return ResponseEntity.badRequest().build();
  }
```

하지만 이는 ArgumentResolver 때와 같은 문제를 갖는다.  
이 또한 `Spring HandlerInterceptor`를 이용해 해결할 수 있다.  

---

### Spring Interceptor의 사용
> Intercept the execution of a handler.

Handler의 실행을 가로챈다.  
Spring 공식 문서에서 정의하고 있는 HandlerInterceptor이다.  
우리는 Interceptor를 `HandlerInterceptor` 인터페이스를 구현하여 사용할 수 있다.  
인터페이스는 `preHandle`, `postHandle`, `afterCompletion`을 구현하도록 명시되어 있다.  
preHandle은 조건에 맞는지 boolean을 반환해 true면 실행하고 false면 실행하지 않도록 한다.  
postHandle과 afterCompletion은 실행 후에 추가적으로 공통된 처리를 하고 싶을 때 사용한다.  

Interceptor는 적용하고자 하는 url를 직접 추가해줌으로써 구현된다.  

```java
  @Override
  public void addInterceptors(InterceptorRegistry registry) {
      registry.addInterceptor(new LoginInterceptor(jwtTokenProvider))
          .addPathPatterns("/blog")
          .excludePathPatterns("/login/token");
  }
```

이처럼 특정 url을 추가할 수도, 제외할 수도 있다.    
이렇게 [Interceptor](https://www.baeldung.com/spring-mvc-handlerinterceptor)를 설정해주고 나면 컨트롤러는 다음과 같이 간단해진다.  

```java
  @PostMapping("/blog")
  public ResponseEntity postBlog() {
    return ResponseEntity.noContent().build();
  }
```  

만일 사용자가 올바른 유저인지, 관리자인지, 작성자인지에 따라 요청을 실행할 수 있는지가 결정된다면, Interceptor에 메서드를 추가해 검증을 거쳐야만 요청을 실행하도록 처리할 수 있다.  
어떠한 요청을 실행한 후에 공통된 처리가 필요한 경우에도 postHandle, afterCompletion과 같은 메서드를 적용해 인터셉터를 사용할 수 있다.  
인터셉터를 사용하면 코드의 중복도 제거할 수 있고, Controller에 직접적으로 책임을 주지 않을 수도 있다.  

---

## Spring의 요청 처리 과정
그렇다면 이러한 ArgumentResolver와 Interceptor를 Spring이 어떠한 방식으로 처리하는 걸까?
간단한 그림으로 spring의 처리 방식을 표현해보았다.  
![spring_flow](src/content/images/2021-05-24-spring-flow.png)
간단한 spring의 동작 방식은 다음과 같다.
1. 요청이 들어온다.
2. filter가 작동한다. 이와 관련한 부분은 [spring-security](https://spring.io/guides/topicals/spring-security-architecture/)에서 자세히 확인할 수 있다.
3. DispatcherServlet에 전달된다. DispatcherServlet이란, Spring의 핵심 객체로, Client의 요청을 받고 응답을 주기까지의 모든 역할을 담당한다.
4. DispatcherServlet은 HandlerMapping을 통해 요청을 처리할 Controller를 찾는다.  
   *이 때, Controller를 찾고 Interceptor가 확인할 url과 일치하면 Interceptor의 preHandle이 실행된다.*
5. DispatcherServlet은 Controller를 실행해줄 HandlerAdapter를 찾는다.  
   *이 때, Adapter를 찾고 handle을 실행하기 위해 필요한 파라미터를 생성하기 위해 Resolver는 실행된다.*
6. HandlerAdapter는 Controller를 실행한다.  
   *이 때, Interceptor의 postHandle이 실행된다.*
7. DispatcherServlet은 실행한 결과를 ViewResolver에게 전달한다.
8. ViewResolver는 View에 전달한다.  
   *이 때, Interceptor의 afterCompletion 실행된다.*
9. DispatcherServletdms View로부터 받은 정보를 Client에 전달한다.
10. 응답을 반환한다.

---

## 마치며
ArgumentResolver와 Interceptor는 Spring Framework가 제공해주는 편리한 기능이다.  
Controller와 같은 객체에 과한 책임을 주기보다는 Interceptor, Resolver와 같은 제 3자의 개입으로 중복되는 로직을 처리해보는 것은 어떨까?  
