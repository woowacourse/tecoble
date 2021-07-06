---
layout: post  
title: ResponseEntity - Spring Boot에서 Response를 만들자
author: [3기_와이비]
tags: ['spring-boot']
date: "2021-05-10T12:00:00.000Z"
draft: false
image: ../teaser/spring-response-entity.png
---

웹 서비스에서는 많은 정보를 송수신하게 됩니다.
각각의 다른 웹 서비스들이 대화하려면, 서로 정해진 약속에 맞게 데이터를 가공해서 보내야합니다.
보내는 요청 및 데이터의 형식을 우리는 _HTTP(HyperText Transport Protocol)_ 이라고 합니다.
_Spring_ 에서도 마찬가지로 _HTTP_ 에 맞게 데이터를 송수신해야합니다. 
요청에 대한 응답을 _HTTP_ 형식으로 코드로 직접 작성하는 것은 쉬운 일이 아닙니다.
이를 만들어주는 _ResponseEntity_ 를 통해서, 빠르게 쉽게 규격에 맞는 _HTTP_ 응답을 생성해봅시다.


## Spring에서 데이터를 송수신하는 방법
우아한테크코스에서 _Java_ 의 웹 프레임 워크인 _Spark_ 와 _Spring_ 을 통해서 웹 서비스를 처음으로 작동시켰을 때에는 이때까지와는 다른 고민을 만났습니다.
로직 구현과 별개로, 사용자에게 어떻게 정보를 전달해야할지에 대한 고민이었습니다.
페이지를 전달할 때에는 _Template Engine_ 의 포멧에 맞게 전달하면 렌더링이 되었습니다.
하지만 페이지가 아닌 데이터를 전달을 해주어야 할 때에는 다른 포맷으로 전달을 해주어야했습니다.  
_Template Engine_ 을 사용할 때처럼 눈에 보이는 포멧이 없었기 때문에 어떻게 정보를 전달해야할지 고민을 하게 되었습니다.
단순하게 데이터만 클라이언트에 보내기에는 서버에 전달해줄 데이터 뿐만이 아니라 상태 및 정보들이 많았습니다.
서버의 응답을 어떻게 종합적으로 보내면 될지에 대해서 고민을 하다가, _HTTP_ 에 대해서 다시 공부하게 되었습니다.

## HTTP란?
_HTTP_ 는 _HyperText Transfer Protocol_ 의 약자로, _Client_ 와 _Server_ 사이에 요청과 응답을 처리하기 위한 규약입니다.
해당 규약을 지키게 된다면 살펴보는 것만으로도 어떤 요청을 하는지에 대해서 간략하게 알 수가 있습니다.
_HTTP_ 는 요청과 응답 모두 크게 세 가지 요소로 구성됩니다.  
먼저, _HTTP_ 요청은 크게 세 가지 요소로 구성이 됩니다.  
_Start Line_, _Headers_ 그리고 _Body_ 입니다.  
1. _Start Line_ 은 _method_, _URL_, 그리고 _version_ 으로 이루어져있으며, 서버에서 요청을 받아들이는 첫 줄입니다. 
2. _Headers_ 는 요청에 대한 접속 운영체제, 브라우저, 인증 정보와 같은 부가적인 정보를 담고 있습니다.  
3. _Body_ 는 요청에 관련된 _json_, _html_ 과 같은 구체적인 내용을 포함합니다.  

_HTTP_ 응답은 다른 요소인 _Status Line_ 과 요청도 가지고 있는 _Headers_, _Body_ 으로 구성됩니다.
- _Status Line_ 은 _HTTP_ 버전과 함께 헤딩 요청에 대한 처리의 상태를 나타납니다. 
  _200_ , _404_ 와 같은 숫자 코드로 동시에 나타냅니다. 

_Spring_ 에서는 _HTTP Response_ 를 만드는 것이 주요한 관심사입니다.
_200_, _404_ 등 각각의 응답의 상태 코드뿐만이 아니라, _Body_ 에 들어갈 내용도 넣어주어야 합니다.
세 가지 요소를 채운 객체를 만드는 것은 까다로울 것입니다.
데이터를 받아서 자동으로 구성해주는 것이 바로 _@ResponseBody_ 와 _ResponseEntity_ 입니다.

## @ResponseBody
_@ResponseBody_ 는 _HTTP_ 규격에 맞는 응답을 만들어주기 위한 _Annotation_ 입니다.
_HTTP_ 요청을 객체로 변환하거나, 객체를 응답으로 변환하는 _HttpMessageConverter_ 를 사용합니다.
_HTTPMessageConverter_ 는 해당 _Annotation_ 이 붙은 대상을 _response body_ 에 직렬화를 하는 방식으로 작동됩니다.
따라서 _Controller_ 에서 반환할 객체나 _Method_ 에 _@ResponseBody_ 를 붙히는 것만으로 _HTTP_ 규격에 맞는 값을 반환할 수 있습니다.

``` java
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseBody
@ResponseStatus(HttpStatus.OK)
public MoveResponseDto move(@PathVariable String name, @RequestBody MoveDto moveDto) {
  String command = makeMoveCmd(moveDto.getSource(), moveDto.getTarget());
    springChessService.move(name, command, new Commands(command));
    
  MoveResponseDto moveResponseDto = new MoveResponseDto(springChessService
      .continuedGameInfo(name), name);
      
  return moveResponseDto;
}
```
_Annotation_ 을 추가하는 것으로 간단하게 처리를 할 수 있다는 점이 _@ResponseBody_ 의 장점입니다.
또한, 만약 해당 메서드를 가진 _Controller_ 에 _@RestController_ 가 붙으면 _@ResponseBody_ 를 생략하여 더 간결하게 코드를 작성할 수 있습니다.
이미 해당 _Annotation_ 에 명시가 되어있 때문에 생략해도 됩니다.

```java
//ResponseBody 구현 부분
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Controller
@ResponseBody //@ResponseBody 명시
public @interface RestController {
	@AliasFor(annotation = Controller.class)
	String value() default "";
}
```

하지만 단점으로는 _HTTP_ 규격 구성 요소 중 하나인 _Header_ 에 대해서 유연하게 설정을 할 수 없다는 점입니다.
또한 _Status_ 도 메서드 밖에서 _Annotation_ 을 사용하여 따로 설정을 해주어야한다는 점이 있습니다.
이는 _@ResponseBody_ 만 사용시에 별도의 뷰를 제공하지 않고, 데이터만 전송하는 형식이기 때문입니다.
이와 같은 점들을 해결해 줄 수 있는 것이 _ResponseEntity_ 라는 객체입니다.

## ResponseEntity
_ResponseEntity_ 도 마찬가지로 _HTTP_ 응답을 빠르게 만들어주기 위한 객체입니다. 
_@ResponseBody_ 와 달리 _Annotation_ 이 아닌 객체로 사용이 됩니다.
즉, 응답으로 변환될 정보를 모두 담은 요소들을 객체로 만들어서 반환해줍니다.
객체의 구성요소에서 _HttpMessageConverter_ 는 응답이 되는 본문을 처리해준 뒤에, 
_RESTTemplate_ 에 나머지 구성 요소인 _Status_ 를 넘겨주게 됩니다.
이를 통하여 앞서 언급한 문제점들을 해결할 수가 있는데, 선언된 구조부터 살펴보도록 하겠습니다.

```java

//ResponseEntity 선언 구조
public class ResponseEntity extends HttpEntity {

  private final Object status;
}

```

먼저, _ResponseEntity_ 의 구조를 보게 되면, 다음과 같이 _Status_ 만 필드 값으로 가지고 있습니다.
_ResponseEntity_ 에서 직접적으로 _Status Code_ 를 지정할 수 있다는 것을 의미합니다.
나머지 부분은 _HttpEntity_ 에 구현이 되어있는데, 이는 _RequestEntity_ 와 여러 설정들을 공유하기 때문입니다.
다음은 _HttpEntity_ 의 구현 부분을 보도록 하겠습니다.

```java
//HttpEntity 선언 구조
public class HttpEntity<T> {
    public static final HttpEntity<?> EMPTY = new HttpEntity<>();
  
  
    private final HttpHeaders headers;
  
    @Nullable
    private final T body;
}
```

이와 같이 _ResponseEntity_ 는 _HttpEntity_ 를 상속하여 구현이 됩니다.
_HttpEntity_ 에서는 _Generic_ 타입으로 _Body_ 가 될 필드 값을 가질 수가 있습니다. 
_Generic_ 타입으로 인하여 바깥에서 _Wrapping_ 될 타입을 지정할 수가 있습니다.
_Wrapping_ 된 객체들은 자동으로 _HTTP_ 규격에서 _Body_ 에 들어갈 수 있도록 변환이 됩니다.
또한, 필드 타입으로 _HttpHeaders_ 를 가지고 있는데, 이는 _ResponseBody_ 와 다르게 객체 안에서 _Header_ 를  설정해 줄 수 있음을 암시합니다.  
_Constructor_ 를 활용하여 _ResponseEntity_ 를 사용한 예시는 다음과 같습니다.

```java
public ResponseEntity<MoveResponseDto> move(@PathVariable String name,
    @RequestBody MoveDto moveDto) {
    HttpHeaders headers = new HttpHeaders();
    headers.set("Game", "Chess");
    
    String command = makeMoveCmd(moveDto.getSource(), moveDto.getTarget());
    springChessService.move(name, command, new Commands(command));
    
    MoveResponseDto moveResponseDto = new MoveResponseDto(springChessService
        .continuedGameInfo(name), name);

    return new ResponseEntity<MoveResponseDto>(moveResponseDto, headers, HttpStatus.valueOf(200)); // ResponseEntity를 활용한 응답 생성
}
```

_Spring_ 에서 다음과 같이 _HTTP_ 응답으로 반환할 메서드를 만들게 되었습니다.
이 때, 타입은 _ResponseEntity<반환할 타입>_ 으로 지정합니다.
_Constructor_ 를 사용시에 _Body_ 부분, _Header_ 그리고 상태로 지정될 _Status_ 를 차례로 입력하여 생성하시면 됩니다.
예시 코드에서는 moveResponseDto라는 객체가 _Body_ 부분에 들어가서 응답으로 전송이 됩니다. 
우리는 _HTTP_ 응답에 필요한 요소들 중 대표적인 _Status_, _Header_ , _Body_ 를 지정하여 응답을 만들 수가 있습니다.

## Constructor보다는 Builder
이렇게 _ResponseEntity_ 를 사용할 때, _Constructor_ 를 사용하기보다는 _Builder_ 를 활용하는 것을 권장하고 있습니다.
그 이유는 숫자로 된 상태 코드를 넣을 때, 잘못된 숫자를 넣을 수 있는 실수 때문입니다.
따라서, _Builder Pattern_ 를 활용하면 다음과 같이 코드를 변경할 수가 있습니다.

```java
  return new ResponseEntity<MoveResponseDto>(moveResponseDto, headers, HttpStatus.valueOf(200));

  return ResponseEntity.ok()
        .headers(headers)
        .body(moveResponseDto);
```

이렇게 _Builder Pattern_ 을 활용하면 각 상태에 매칭되는 숫자 코드를 외울 필요 없이 _Builder_ 메소드를 선택하면 됩니다.

## 마치며
_Spring_ 또한 _HTTP_ 에 맞는 응답을 클라이언트에게 제공을 해주어야 합니다.
_Header_ 설정에서의 유연성을 가진 _ResponseEntity_ 를 사용하여, 빠르면서도 실수를 줄이는 _HTTP_ 응답을 구현할 수 있습니다.

## 참고 자료
- [모질라 재단 HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP)
- [Oracle Spring ResponseEntity 문서](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/http/ResponseEntity.html)
- [Spring ResponseBody 문서](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc-ann-responsebody)
- [ResponseEntity는 왜 사용하는 것이며 @RestControllerAdvice는 무엇일까.](https://woodcock.tistory.com/19)

