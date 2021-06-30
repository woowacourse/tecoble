---
layout: post  
title: '@RequestMapping'
author: [샐리]
tags: ['spring']
date: "2021-06-18T12:00:00.000Z"
draft: false
image: ../teaser/spring.png
---

우리는 client에서 오는 요청을 처리하기 위한 api url을 매핑할 때 Spring의 `@RequestMapping`이라는 어노테이션을 사용한다. Spring은 사용자의 편리를 위해 RequestMapping을 http에서 지원하는 4가지 method인 `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`과 추가적으로 `@PatchMapping`까지 여러가지 방법의 매핑 방식으로 확대하여 제공하기도 한다.

`@RequestMapping`을 붙이는 이유에 대해서 간략히 설명하고자 아래 코드를 구현해보았다.  
```java
@RestController
public class ExampleController {
    @GetMapping("/example")
    public ResponseEntity<Example> getExample() {
        Example example = new Example("example");
        return ResponseEntity.ok(example);
    }
}
```  

로컬로 프로그램을 실행시킨다는 가정 하에 우리는 `http://localhost:8080/example` 로 **GET** 요청을 보냈을 때 아래와 같은 결과를 얻을 수 있다.  
![get 요청 테스트](https://user-images.githubusercontent.com/43775108/123607948-4ce8e900-d839-11eb-87d2-f748fe6fcb86.png)  

여기서 알 수 있다싶이 RequestMapping은 요청이 들어왔을 시에 컨트롤러와 매핑해주고, 그 컨트롤러를 실행시켜 응답을 받는 것을 알 수 있다.  

그렇다면 이 `@RequestMapping` 어노테이션은 어떻게 위와 같은 일을 수행하는 것일까?

## @RequestMapping의 동작 방식  
SpringBoot 어플리케이션이 실행되면 어플리케이션에서 사용할 bean들을 담을 ApplicationContext를 생성하고 초기화한다.  

requestMapping 어노테이션을 붙인 메서드들이 handler에 등록되는 것은 ApplicationContext가 refresh되는 과정에서 일어난다.  

ApplicationContext의 refresh SpringApplication이 실행될 때 일어난다.  
```java
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
```  
메인 메서드인 어플리케이션 실행 메서드에 들어가면 아래와 같이 ApplicationContext.refresh() 메서드가 존재하는 것을 알 수 있다.
![ApplicationContext refresh](https://user-images.githubusercontent.com/43775108/123607480-e6fc6180-d838-11eb-8862-d3e17b7e0271.png)

이 때 생성되는 Spring Application 구동을 위한 수많은 Bean들이 존재한다. 이들에 대해서 알고 싶다면 [이 글](https://pplenty.tistory.com/6)을 보면 자세히 알 수 있다. 이렇게 등록되는 Bean 중 하나가 `RequestMappingHandlerMapping`이고, 이 빈이 우리가 `@RequestMapping`으로 등록한 메서드들을 가지고 있다가 요청이 들어오면 매핑해주는 역할을 수행한다.  

그렇다면 이 `RequestMappingHandlerMapping`은 어떻게 우리가 등록한 Controller들을 찾아 매핑해주는 것일까? 

우선, `WebMvcAutoConfiguration`이라는 기본 설정을 해주는 클래스에 아래와 같이 RequestMappingHandlerMapping을 생성하고 빈으로 등록하는 메서드가 존재한다.  
![create requestMappingHandlerMapping](https://user-images.githubusercontent.com/43775108/123607585-ff6c7c00-d838-11eb-947a-49ff672e8163.png)  

RequestMapping을 찾아 등록하는 과정은 다음과 같다. 아래 함수들은 차례로 상속 관계를 가진 `AbstractHandlerMethodMapping <- RequestMappingInfoHandlerMapping <- RequestMappingHandlerMapping` 클래스들의 메서드이다.  

afterPropertiesSet() -> initHandlerMethods -> processCandidateBean(beanName) -> isHandler(beanType) -> detectHandlerMethods(beanName) -> registerHandlerMethod(handler, invocableMethod, mapping)  
모든 과정을 거쳐 MappingRegistry라는 클래스의 아래 필드 변수들에 저장되는 것이다.    
![mappingRegistry-fields](https://user-images.githubusercontent.com/43775108/123607734-1c08b400-d839-11eb-8b40-da290f0a8ad3.png)  
요청이 들어오면 빈으로 등록된 HandlerMapping이 변수들을 찾아서 Adapter를 거쳐 실행하는 것이다.    

어떠한 함수들을 거치는지 더욱 자세히 알고 싶다면 [이 글](https://pplenty.tistory.com/7)을 참고할 수 있다.  

## @RequestMapping이 받는 옵션
이제는 @RequestMapping이 받을 수 있는 옵션에 대해서 알아보도록 하자.  
RequestMapping은 기본적으로 같은 url과 모든 옵션이 같을 수 없다.  
이렇게 지정하는 옵션은 handler에서 매핑하는 기준이 된다.  
value, method, params, headers, consumes, produces 중에서 하나라도 달라야지 올바르게 handler가 매핑해줄 수 있다.  

### value  
value는 연결할 url을 말한다. 보통 호스트 주소와 포트 번호를 제외하고 api 설계 규약에 따라 이름을 짓는다.
다음과 같이 설정할 수 있다. 
```java
    @RequestMapping(value = "/example")
```
value를 제외하고 다른 옵션이 주어지지 않을 경우에는 `value =`을 생략할 수도 있다.  
```java
    @RequestMapping("/example")
```
[Ant pattern](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/util/AntPathMatcher.html)을 적용한 url mapping도 가능하다.  
예를 들어, 아래와 같이 매핑하면 `/example/1`, `/example/2`, `/example/123` 전부 다 연결할 수 있다.
```java
    @RequestMapping("/example/**")
```  
{}사이에 변수를 넣어서 url을 매핑하는 것도 가능하다. 이렇게 매핑한 경우 메서드 인자로 `@PathVariable`을 id로 받아야만 한다.     
```java
    @RequestMapping("/example/{id}")
```  

### method
RequestMethod로 명명되어 있는 아래 8가지 중 하나를 사용하는 것이 일반적이다.    
```java
public enum RequestMethod {
	GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS, TRACE
}
```  
적용 예시는 다음과 같다. 
```java
    @RequestMapping(method = RequestMethod.GET, value = "/example")
```
GET, POST, PUT, PATCH, DELETE 메서드에 대해서는 각각에 맞는 메서드 옵션이 적용된 어노테이션이 존재해서 다음과 같이 사용할 수 있다.
```java
    @GetMapping("/example")
```  
이렇게 하면 코드가 간결해지고 가독성이 좋아져 많이 사용되는 기법이다.  

### params
params는 api url을 `/example?id=1&password=2`와 같이 전달하고 싶을 때 사용하는 것으로 params에 전달한 것과 일치하는 param이 붙으면 이 메서드로 매핑해준다.
```java
    @RequestMapping(method = RequestMethod.GET, value = "/example", params = {"id", "password"})
    public ResponseEntity<Example> getExample(@RequestParam("id") int paramId, @RequestParam("password") String password) {
      Example example = new Example("example" + paramId + password);
      return ResponseEntity.ok(example);
    }
```  

### headers
header의 정보를 전달해주는 옵션이다. 예를 들어 아래와 같이 content-type을 지정해준 경우  
```java
    @PostMapping(value = "/example/{text}", headers = "content-type=text/plain")
    public ResponseEntity<Example> getExample3(@PathVariable("text") String text) {
      Example example = new Example("example" + text);
      return ResponseEntity.ok(example);
    }
```
들어오는 헤더는 다음과 같다.  
![header](https://user-images.githubusercontent.com/43775108/123607821-2fb41a80-d839-11eb-822d-0176b79e9b2b.png)

전달할 수 있는 헤더의 종류는 content-type 외에도 다양한데 [여기](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers)서 알 수 있다.

### produces
response의 accept-request header가 특정 옵션으로 반환될 것을 지정하는 옵션이다.  
응답이 무엇인지 미리 예측하는 것이 불가능하기 때문에 같은 url로 요청이 들어왔을 때 produces 옵션으로 구분해서 실행하는 것은 불가능하다.  
그리고 `@RestController`에서 ResponseEntity를 반환하는 경우에는 기본으로 `application/json`으로 값이 지정되어 있기 때문에 특정 옵션을 설정할 수 없다.   
produces는 필수 옵션이 아니므로 따로 지정해주지 않아도 `application/json`으로 기본 값이 전달되거나 와일드카드로 값이 전달된다.  
```java
    @GetMapping(value = "/test", produces = MediaType.TEXT_PLAIN_VALUE)
    public String getExample() {
        return "example";
    }
``` 
위와 같이 사용할 수 있다.  

### consumes
request의 content-type request header가 일치하는 것을 찾는 옵션이다.  
요청에 들어오는 인자 값이 무엇인지에 따라서 같은 url, method임에도 구분이 가능하다.  
하지만 `@RequestBody`와 `@ModelAttribute`의 경우 HttpMessageConverter에서 객체로 변환하는 과정을 지나며 기본 값으로 `application/json`이 지정되어 있기 때문에 특정 옵션을 줄 수 없다.  
consumes는 필수 옵션이 아니므로 지정해주지 않아도 된다.  
이 경우 `@RequestBody`, `@ModelAttribute`는 `application/json`이 기본 값, `@RequestParam`, `@PathVariable`은 `text/plan`이 기본 값으로 전달된다.    
```java
    @PostMapping(value = "/produce{example}", consumes = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<Example> getExample5(@PathVariable String example) {
        Example example1 = new Example(example);
        return ResponseEntity.ok(example1);
    }
``` 

### 참고
- [RequestMapping](https://www.baeldung.com/spring-requestmapping)  
- [@RequestMapping의 produces,Content-Type,Consumes란?](https://2ham-s.tistory.com/292)  
