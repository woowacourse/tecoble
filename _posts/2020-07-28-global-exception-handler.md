---
layout: post
title: "Spring에서 전역 예외 처리하기"
author: "티거"
comment: "true"
tags: ["exception"]
toc: true
---

Spring에서 예외 처리하는 방법은 여러 가지가 있다. 메서드에서 try/catch를 써서 처리할 수도 있고, `@ExceptionHandler`를 사용하여 컨트롤러 내에서 발생하는 예외를 처리할 수도 있다. 하지만 지금 알아볼 것은 전역에서 발생하는 예외를 처리하는 방법을 알아보려고 한다.

## 전역에서 예외 처리하기

우선 **전역에서 예외 처리를 하는 이유**는 무엇일까? 

`@ExceptionHandler`를 사용하여 해당 컨트롤러에 대한 예외 처리를 한다고 하자. 

```java
@RestController
public class LineController {

    // ...

    @GetMapping("/lines")
    public ResponseEntity<List<LineResponse>> getLines() {
        // ...
    }
    
    @PostMapping("/lines")
    public ResponseEntity<LineResponse> createLine(@RequestBody LineRequest lineRequest) {
        // ...
    }
    
    @ExceptionHandler(LineException.class)
    public ResponseEntity<ErrorResponse> handleLineException(final LineException error) {
        // ...
    }
    
}
```

해당 컨트롤러에서 발생하는 예외는 `handleLineException` 메서드에서 처리할 수 있다. 하지만 컨트롤러가 늘어난다면 어떨까? 컨트롤러가 늘어나면서 예외 처리에 대한 중복 코드도 늘어날 것이고 많은 양의 코드를 다룰 것이다. 그러면 유지보수 또한 어려워질 것이다.

**but!!**

전역에서 예외 처리를 하면 위와 같은 문제를 해결할 수 있다.

그래서 **전역에서 예외를 어떻게 처리**하느냐?

전역에서 예외 처리를 하기 위해 `@ControllerAdvice` 또는 `@RestControllerAdvice`를 쓴다.

- `@RestControllerAdvice`는 `@ControllerAdvice` + `@ResponseBody`이다. (`@Controller`와 `@RestController` 같은 느낌)

이 어노테이션은 [AOP(Aspect Oriented Programming)](https://heeyeah.github.io/spring/2019/03/24/spring-controller-advice.html)의 방식이고, Application 전역에 발생하는 모든 컨트롤러의 예외를 한 곳에서 관리할 수 있게 해준다.

**어떻게 사용할까?**

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LineException.class)
    public ResponseEntity<ErrorResponse> handleLineException(final LineException error) {
        // ...
    }
    
    // ...
}
```

컨트롤러에서 발생하는 모든 예외는 `@RestControllerAdvice`가 잡고, `@ExceptionHandler`가 개별적으로 예외를 잡아 처리하는 방식이다. 

## 전역 예외 처리를 하면서 궁금했던 점

**그럼 `@Controller`에서의 예외는 `@ControllerAdvice`, `@RestController`에서의 예외는 `@RestControllerAdvice`에서 잡아주는 것일까?**

아니다. `@Controller`에서 예외가 발생해도 `@RestControllerAdvice`에서 잡을 수 있고, `@RestController`에서의 예외가 발생해도  `@ControllerAdvice`가 잡아줄 수 있다.

Controller에 `RestController`를 붙였지만 GlobalExceptionHandler에는 실수로 `@ControllerAdvice`를 붙인 적이 있다. 하지만 GlobalExceptionHandler에서 Controller에 대한 예외를 잡았다.

이유가 무엇일까?

`@RestController`와 `@RestControllerAdvice`가 무엇인지 생각해보자.

- `@RestController` = `@Controller` + `@ResponseBody`
- `@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`

단순하게 생각하면 `@RestController`와 `@RestControllerAdvice`는 `@Controller`와 `@ControllerAdvice`에 `@ResponseBody`를 추가한 것뿐이다. 

```java
// @RestController
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Controller
@ResponseBody
public @interface RestController {
    // ...
}

// @RestControllerAdvice
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ControllerAdvice
@ResponseBody
public @interface RestControllerAdvice {
    // ...
}
```

따라서 서로 예외를 잡아 줄 수는 있다. 하지만 `@RestControllerAdvice`는 `@RestController`와 마찬가지로 `@ResponseBody`가 있어서 자바 객체를 Json/Xml 형태로 반환하여 HTTP Response Body에 담을 수 있다.

**그러면 `@RestControllerAdvice`를 사용해서 `@RestController`에서 발생한 예외만 받을 수는 없을까?**

당연히 있다.

`@RestControllerAdvice`를 사용할 때 `@RestControllerAdvice(annotations = RestController.class)` 이렇게 셋팅하면 `@RestController`에서 발생하는 예외만 가져올 수 있다. `@ControllerAdvice`도 마찬가지다.

## 참고자료

[(Spring Boot)오류 처리에 대해](https://supawer0728.github.io/2019/04/04/spring-error-handling/)