---
layout: post  
title: SpringBoot 예외 처리에 관한 고찰 
author: [3기_완태]
tags: ['springboot', 'exception']
date: "2021-10-25T12:00:00.000Z"
draft: false 
image: ../teaser/spring-boot.png
---

SpringBoot는 다양한 예외 처리 방법을 제공한다. 편리한 만큼 궁금증도 많이 들었던 예외처리 부분을 코드를 들춰보는 게 익숙해진 지금 파헤쳐보고자 한다.
ExceptionHandler를 사용해 본 경험이 있는 독자에게 추천한다.

<!-- end -->

## 다양한 SpringBoot의 예외 처리 방법

SpringBoot에서 예외 처리를 하는 방법은 다양하다. 그중 자주 사용되는 방식의 3가지는 다음과 같다.

1. Controller에 ExceptionHandler 정의
2. ControllerAdvice에 ExceptionHandler 정의
3. Exception에 ResponseStatus 어노테이션 추가

이처럼 다양한 방식의 구현을 제공한다는 것은 장점이다. 하지만, 그만큼 궁금증도 든다. 어떤 방식이 가장 우선순위가 높은지, 각 구현 방식에는 어떤 차이가 있는지. 이번 글에서는
각각의 방법들이 어떻게 설정되고 동작하는지에 대해 알아보며 궁금증을 풀어나가고자 한다.

---

## DispatcherServlet 들여다보기

SpringBoot에서는 예외처리를 어떤 방식으로 진행할까? DispatcherServlet 클래스의 doDispatch 메소드에서 해당 부분을 확인할 수 있다. 밑에 코드로
확인해 보면, 너무나도 익숙한 try-catch 문으로 구현된 것으로 확인할 수 있다. 요청이 들어왔을 때, 해당하는 컨트롤러의 로직이 실행되고, 예외가 발생했을 때는
processDispatchResult 메소드에서 처리된다. try 문에는 컨트롤러에서 정의한 로직뿐만 아니라 다양한 핸들러가 존재하는데, 이번 글에서는 컨트롤러로 한정 지어
다루겠다.

```java
public class DispatcherServlet {
  protected void doDispatch(...) throws Exception {
    // ...
    try {
      ModelAndView mv = null;
      Exception dispatchException = null;

      try {
          // Controller 로직 실행 (핸들러를 찾고, 해당 로직을 실행)
      } catch (Exception ex) {
        dispatchException = ex;
      }
      // Dispatch 결과 처리 (예외 처리도 여기서 진행)
      processDispatchResult(...,dispatchException);
    } catch {...}
    // ...
  }
}
```

---


## 예외 처리 방법 확인하기

위에서는 DispatcherServlet에서 try-catch 문으로 예외를 잡아주는 것을 확인했다. 그렇다면 처음 언급한 예외 처리 방식 3가지는 실제로 어떻게 동작할까? 이
실습 저장소에서 디버깅 포인트를 찍어가면 직접 확인해 보는 것을 추천한다.

HandlerExceptionResolver resolveExceptionHandler 메소드에서 어떤 handlerExceptionResolver를 택하는지 결정한다. 다음의
3가지의 ExceptionResolver가 존재한다.

- ExceptionHandlerExceptionResolver
- ResponseStausExceptionResolver
- DefaultHandlerExceptionResolver

이름에서 유추할 수 있듯이, ExceptionHandler로 정의한 경우에는 ExceptionHandlerExceptionResolver, ResponseStatus로 정의한 경우
ResponseStatusExceptionResolver를 통해 처리한다.

```java
public class HandlerExceptionResolverComposite {
  public ModelAndView resolveException(
    HttpServletRequest request, HttpServletResponse response, @Nullable Object handler,
    Exception ex) {

    if (this.resolvers != null) {
      for (HandlerExceptionResolver handlerExceptionResolver : this.resolvers) {
        ModelAndView mav = handlerExceptionResolver.resolveException(request, response, handler, ex);
        if (mav != null) {
          return mav;
        }
      }
    }
    return null;
  }
}
```

### 1. Controller에 `@ExceptionHandler` 정의

ExceptionHandlerExceptionResolver내부에 exceptionHandlerCache에서 관리된다. 특이한 부분은
getExceptionHandlerMethod()를 호출했을 때 캐시를 조회해보고 없을 때만 캐시에 등록한다. 즉, Controller에 정의된 ExceptionHandler는 그
Exception이 발생할 때야 객체로 생성이 된다. 2번째부터는 exceptionHandlerCache에 저장된 HandlerMethodResolver를 바로 사용한다.

```java
// ExceptionHandlerExceptionResolver getExceptionHandlerMethod() 일부
handlerType=handlerMethod.getBeanType();
ExceptionHandlerMethodResolver resolver=this.exceptionHandlerCache.get(handlerType);
if (resolver==null) {
  resolver=new ExceptionHandlerMethodResolver(handlerType);
  this.exceptionHandlerCache.put(handlerType,resolver);
}
```

### 2. ControllerAdvice에 `@ExceptionHandler` 정의

ExceptionHandlerExceptionResolver 내부에 exceptionHandlerCache에서
관리된다. `initExceptionHandlerAdviceCache` 메소드를 통해 `ExceptionHandlerExceptionResolver` 가 초기에 생성한 시점에
캐시에 ControllerAdvice에 정의된 ExceptionHandler에 해당하는 HandlerMethodResolver가
등록된다. `getExceptionHandlerMethod` 에서 확인할 수 있듯이, Controller에서 정의한 ExceptionHandler를 먼저 조회하기 때문에 1번에
비해 우선순위에서 밀린다.

### 3. Exception에 ResponseStatus 어노테이션 추가

`ResponseStatusExceptionResolver` 에서 예외 처리한다. HandlerExceptionResolverComposite.resolveException()
에서 resolver를 순회할 때, ExceptionHandlerExceptionResolver를 먼저 순회하기 때문에 1, 2번의 예외 처리 보다 우선순위에서 밀린다.

### 번외. ExceptionHandler에 ResponseStatus 어노테이션 추가

ResponseEntity를 활용하여 응답의 상태 코드를 설정할 수 있고, ExceptionHandler에 ResponseStatus를 추가하는 방법도 가능하다. 그렇다면 다음의
경우에는 어떤 상태 코드를 보낼까?

```java
@ExceptionHandler(ResponseStatusInAdviceException.class)
@ResponseStatus(HttpStatus.BAD_REQUEST)
public ResponseEntity<ErrorResponse> handleResponseStatusInAdviceException() {
  return ResponseEntity.notFound().build();
}
```

결과는 notFound(404)의 응답 코드를 가진다. ResponseStatus어노테이션은 HandlerMethod의 상태 코드를 정하는데,
ServletInvocableHandlerMethod.invokeAndHandle() 에서 ResponseEntity의 상태 코드로 덮여 씌워진다.

---

## 정리

SpringBoot의 다양한 예외 처리 방법의 구현에 대해 알아보았다. 학습 테스트를 통해 쉽게 예외 처리의 우선순위를 확인할 수도 있지만, 직접 그 내부의 구현이 어떻게 분석해
보는 것도 추천한다.
