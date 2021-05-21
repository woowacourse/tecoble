---
layout: post
title: ExceptionHandler 와 ControllerAdvice
author: [영이]
tags: ['java', 'spring']
date: "2021-05-10T12:00:00.000Z"
draft: false
image: ../teaser/exception-handler.png
---

## @ExceptionHandler

**@ExceptionHandler** 는 **@Controller** , **@RestController** 가 적용된 Bean 에서 발생하는 예외를 잡아서 하나의 메서드에서 처리해주는 기능이다. **@ExceptionHandler** 에 설정한 예외가 발생하면 handler가 실행된다. **@Controller**, **@RestController**가 아닌 **@Service** 나 **@Repository** 가 적용된 Bean에서는 사용할 수 없다. **@ExceptionHandler** 인터페이스로 들어가 보면 아래와 같다.

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ExceptionHandler {

	/**
	 * Exceptions handled by the annotated method. If empty, will default to any
	 * exceptions listed in the method argument list.
	 */
	Class<? extends Throwable>[] value() default {};

}
```

value 설정을 통하여 어떤 예외를 잡을지 설정할 수 있다. 주의할 점은 value 를 지정하지 않으면 모든 예외를 잡기 때문에 필요한 예외를 설정 해주어야한다. 필요하다면 List형태로 여러 예외들을 정할 수 있다. `@ExceptionHandler({Excpetion.class, Exception2.class})` 이런 방법으로 2개 이상도 등록 가능하다.

실제 @Controller Bean에서 사용한 예를 보자.

```java
@Controller
public class SimpleController {

    // ...

    @ExceptionHandler(value = RuntimeException.class)
    public ResponseEntity<String> handle(IOException ex) {
        // ...
    }
}
```

우선 `@ExceptionHandler(value = RuntimeException.class)` 를 통하여 어떤 예외를 처리 할 것 인지를 설정하였다. SimpleController에서의 작업 중 RuntimeException이 발생하면 **@ExceptionHandler**가 동작하게 된다. 동작 시 원하는 것을 구현해주면 된다.

**@ExceptionHandler** 는 등록된 해당 Controller 에서만 적용이 된다. 다른 컨트롤러의 예외는 잡을 수 없다. 같은 예외가 발생한 것이고 같은 처리를 해주고 싶은 경우가 있을 수 있다. 다른 컨트롤러에서의 작업이라면 해당 컨트롤러에 같은 **@ExceptionHandler** 를 적용해주어야 한다. 똑같은 기능을 하는 똑같이 생긴 코드를 반복하는 것은 번거럽고 낭비이다. 이러한 번거로움을 해결할 수 있는 방법이 있는데, 바로 **@ControllerAdvice** 이다.

## @ControllerAdvice

**@ControllerAdvice**는 **@Controller** 어노테이션이 있는 모든 곳에서의 예외를 잡을 수 있도록 해준다. **@ControllerAdvice** 안에 있는 **@ExceptionHandler**는 모든 컨트롤러에서 발생하는 예외상황을 잡을 수 있다. **@ControllerAdvice** 의 속성 설정을 통하여 원하는 컨트롤러나 패키지만 선택할 수 있다. 따로 지정을 하지 않으면 모든 패키지에 있는 컨트롤러를 담당하게 된다.

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Component
public @interface ControllerAdvice {
	//...
}
```

**@ControllerAdvice**는 새로운 클래스 파일을 만들어 사용하면 된다. 아래를 보면 **PageControllerAdvice** 라는 클래스에 **@ControllerAdvice** 어노테이션을 붙였다. 그 후 **@ExceptionHandler**로 처리하고 싶은 예외를 처리 할 수 있도록 하였다.

```java
@ControllerAdvice
public class PageControllerAdvice {

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<String> dataExceptionHandle() {
        return ResponseEntity.badRequest().build();
    }

    @ExceptionHandler(SQLException.class)
    public ResponseEntity<String> sqlExceptionHandle() {
        return ResponseEntity.status(INTERNAL_SERVER_ERROR).build();
    }

}
```

### @RestControllerAdvice

> @ControllerAdvice + @ResponseBody → @RestControllerAdvice

**@RestControllerAdvice** 도 **@ControllerAdvice**와 동일한 역할을 한다. 단지 객체를 반환할 수 있다라는 의미를 가지고 있다. **@ControllerAdvice** 와 달리 응답의 body에 객체를 넣어 반환이 가능하다. **@RestController**에서의 예외만 잡는다는 뜻이 아니다. **@RestController**에서 발생하든 **@Controller** 에서 발생하든 **@RestControllerAdvice**는 다 잡을 수 있다.

## 참고

- [https://jeong-pro.tistory.com/195](https://jeong-pro.tistory.com/195)
- [https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc)
