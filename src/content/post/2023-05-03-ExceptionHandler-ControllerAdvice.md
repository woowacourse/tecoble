---
layout: post
title: 'ExceptionHandler와 ControllerAdvice를 알아보자'
author: [5기_포이]
tags: ['spring']
date: '2023-05-02T12:00:00.000Z'
draft: false
image: ../teaser/cycle.png
---

콘솔 애플리케이션을 구현할 때, 우리는 예외를 핸들링하기 위해 try / catch문을 사용했습니다.

그러나 웹 애플리케이션에서는 예외 처리 방법이 조금 다릅니다.

이번 글에서는 스프링을 사용한 웹 애플리케이션 적용할 수 있는 예외 처리 방법인 `@ExceptionHandler`와 `@ControllerAdvice`에 대해 알아보겠습니다.

<!-- end -->

## 스프링부트의 기본적인 예외 처리

```java
@RestController
public class SimpleController {

    @GetMapping(path = "/errorExample")
    public String invokeError() {
        throw new IllegalArgumentException();
    }
}
```

라는 예시에서 예외를 던지는 메서드를 호출하는 URL `/errorExample`에 요청을 보내봅시다.

웹으로 요청을 보낸다면 스프링부트가 제공하는 기본 에러 페이지가 표시됩니다.

`BasicErrorController` 는 요청의 Accept 헤더 값이 text/html일 때, 예외가 발생하면 `/error` 라는 경로로 재요청을 보내줍니다.

해당 페이지는 `/error` 경로에 등록된 기본 에러 페이지입니다.

만약 기본 에러 페이지가 아닌 스스로 작성한 커스텀 페이지를 보여주고 싶다면 뷰 템플릿 경로에 커스텀 페이지 파일을 만들어서 넣어두면 됩니다.

오류 페이지 파일명에 따라 표시되는 웹페이지를 다르게 설정할 수 있습니다.

-   4xx.html: 400대 오류 페이지
-   5xx.html: 500대 오류 페이지
-   404.html: 404 오류 페이지

만약 페이지 변경뿐 아니라 더 상세하게 예외의 내용을 응답에 담고 싶다면, `BasicErrorController`를 상속한 `@Controller` 클래스를 만들어 `errorHtml()` 메서드와 `error()` 메서드를 재정의해주면 됩니다.

다만 이 방법은 url만 알면 누구나 마음대로 error 페이지에 접근할 수 있다는 단점이 있습니다.

이러한 단점을 `@ExceptionHandler`를 사용해 해결할 수 있습니다.

## @ExceptionHandler

`@ExceptionHandler` 어노테이션을 사용하면 value로 원하는 예외를 지정하고 이를 핸들링 할 수 있습니다.

예외에 대한 세부적인 정보 또한 응답으로 전달해 줄 수 있습니다.

```java
@RestController
public class SimpleController {

    // ...

    @ExceptionHandler(value = IllegalArgumentException.class)
    public ResponseEntity<String> invokeError(IllegalArgumentException e) {
         ...
				return new ResponseEntity<>("error Message", HttpStatus.BAD_REQUEST);
    }
}
```

위 처럼 컨트롤러별로 반환하고자 하는 body와 메시지를 예외별로 적절하게 선택하여 세밀한 정보를 제공할 수 있습니다.

`@ExceptionHandler`는 value 속성으로 지정한 예외뿐 아니라 예외의 자식 클래스도 전부 캐치해 지정된 응답을 반환하게 됩니다. (value 속성을 지정하지 않는다면 메서드의 파라미터에 있는 예외가 자동으로 지정됩니다.)

만약 자식 클래스는 다른 예외 처리를 적용하고 싶다면 다음과 코드를 같이 작성하여 처리할 수 있습니다.

```java
@RestController
public class SimpleController {

    // ...

    @ExceptionHandler(value = IllegalArgumentException.class)
    public ResponseEntity<String> invokeError(IllegalArgumentException e) {
         ...
				return new ResponseEntity<>("부모 클래스", HttpStatus.BAD_REQUEST);
    }

		@ExceptionHandler(value = IllegalArgumentExtendsException.class)
    public ResponseEntity<String> invokeError(IllegalArgumentException e) {
         ...
				return new ResponseEntity<>("자식 클래스", HttpStatus.BAD_REQUEST);
    }
}
```

`@ExceptionHandler`는 코드를 작성한 컨트롤러에서만 발생하는 예외만 처리됩니다.

만약 같은 예외에 대해 여러 컨트롤러에서 같은 처리를 하고 싶다면 컨트롤러마다 같은 메서드를 작성해 주어야만 합니다.

즉, 코드의 중복이 발생할 수밖에 없습니다.

## ControllerAdvice

`@ControllerAdvice`는 `@Component` 어노테이션의 특수한 케이스로, 스프링 부트 애플리케이션에서 전역적으로 예외를 핸들링할 수 있게 해주는 어노테이션입니다.

이를 통해 코드의 중복을 해결할 수 있습니다.

또한, 하나의 클래스 내에서 정상 동작 시 호출되는 코드와 예외를 처리하는 코드를 분리할 수 있습니다.

다음은 `@ControllerAdvice` 와 `@RestConrollerAdvice` 의 구현의 일부입니다.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ControllerAdvice
@ResponseBody
public @interface RestControllerAdvice {
    ...
}

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface ControllerAdvice {
    ...
}
```

`@Component`어노테이션을 붙이면 Component Scan 과정을 거쳐 Bean으로 등록됩니다.

즉, 이 어노테이션을 사용하는 `ControllerAdvice` 또한 Bean으로 관리된다는 것을 알 수 있습니다.

또한, `@RestControllerAdvice`는 `@ResponseBody` 어노테이션이 붙어있으므로 응답을 Json으로 처리한다는 것을 알 수 있습니다.

`@ControllerAdvice` 어노테이션을 통해 예외를 핸들링하는 클래스를 구현해 보았습니다.

```java
@ControllerAdvice
public class SimpleControllerAdvice {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> IllegalArgumentException() {
        return ResponseEntity.badRequest().build();
    }
}
```

위 처럼 코드를 작성하게 되면 애플리케이션 내의 모든 컨트롤러에서 발생하는 `IllegalArgumentException`을 해당 메서드가 처리하게 됩니다.

**주의점**

여러 `ControllerAdvice`가 있을 때 `@Order`어노테이션으로 순서를 지정하지 않는다면 Spring은 `ControllerAdvice`를 임의의 순서로 호출합니다. 즉, 사용자가 예상하지 못한 예외 처리가 발생할 수 있습니다.

### basePackages

만약 여러 `ControllerAdvice`를 세분화하고 싶다면 `basePackages` 속성을 이용할 수 있습니다.

작성된 패키지와 하위 패키지에서 발생하는 예외는 해당 `ControllerAdvice`에서 처리하도록 지정할 수 있습니다.

```java
@ControllerAdvice(basePackages = {"org.woowa.tmp.pkg"}
public class SimpleControllerAdvice {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> IllegalArgumentException() {
        return ResponseEntity.badRequest().build();
    }
}
```

`basePackages` 속성을 통해 뷰와 모델을 이용해 직접 페이지를 반환하는 Controller는 예외가 발생하면 직접 예외 페이지를 응답하게 하고, JSON 형식으로 데이터를 주고받는 Controller는 예외가 발생하면 예외에 대한 정보를 JSON 형식으로 응답하게 할 수도 있습니다.

### assignableTypes

`assignableTypes` 속성을 이용하면 클래스 단위로도 `ControllerAdvice`를 적용할 수 있습니다.

클래스 단위로 사용되는 만큼 `basePackages` 속성보다 조금 더 세밀하게 처리를 분리해 주고 싶을 때 사용하면 유용합니다.

```java
@ControllerAdvice(assignableTypes = {SimpleController.class}
public class SimpleControllerAdvice {

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> IllegalArgumentException() {
        return ResponseEntity.badRequest().build();
    }
}
```

### ResponseEntityExceptionHandler

Spring은 스프링 예외를 미리 처리해 둔 `ResponseEntityExceptionHandler`를 추상 클래스로 제공하고 있습니다.

`ResponseEntityExceptionHandler`에는 스프링 예외에 대한 `ExceptionHandler`가 모두 구현되어 있습니다.

하지만 에러 메시지는 반환하지 않으므로 스프링 예외에 대한 에러 응답을 보내려면 이 클래스를 상속하여 아래 메서드를 오버라이딩 해야 합니다.

```java
public abstract class ResponseEntityExceptionHandler {
    ...

    protected ResponseEntity<Object> handleExceptionInternal(
			Exception ex, @Nullable Object body, HttpHeaders headers, HttpStatus status, WebRequest request) {

		if (HttpStatus.INTERNAL_SERVER_ERROR.equals(status)) {
			request.setAttribute(WebUtils.ERROR_EXCEPTION_ATTRIBUTE, ex, WebRequest.SCOPE_REQUEST);
		}
		return new ResponseEntity<>(body, headers, status);
	}
}
```

## 마무리

스프링에서는 `@ExceptionHandler` `@ControllerAdvice`를 통해 편리한 예외 처리 기능들을 제공합니다.

또한 여러 가지 속성을 통해 직접 메서드를 오버라이딩하는 것처럼 상세하게 세부 사항들을 지정해 줄 수도 있습니다.

코드가 더 간결해지고, 에러 처리 코드의 위치를 사용자가 유연하게 관리할 수 있다는 장점도 있습니다.


## 참고
- https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc 
- https://tecoble.techcourse.co.kr/post/2021-05-10-controller_advice_exception_handler/
- https://www.baeldung.com/spring-controllers
