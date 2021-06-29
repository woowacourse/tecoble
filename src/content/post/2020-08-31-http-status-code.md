---
layout: post
title: "상태 코드, 뭘 줘야할까?"
author: [우]
tags: ["http", "status-code"]
date: "2020-08-31T12:00:00.000Z"
draft: false
image: ../teaser/status-code.png
---

## 상태 코드란?

어떤 상태 코드를 전달할지 고민하기 전에, 간단하게 상태 코드란 무엇인지 간단하게 짚고 넘어가자.

상태 코드는 말 그대로 클라이언트와 서버 간의 통신**상태**를 나타내는 약속된 **코드**다.  
클라이언트는 이 상태 코드를 통해서 서버에게 보낸 요청이 어떻게 처리되었는지 일차적으로 알 수 있다.  
적절한 상태 코드는 클라이언트가 서버의 응답 결과에 대한 후처리를 방식을 정하는 좋은 지표가 될 것이다.

50여 개의 3 자릿수 코드가 존재하고 백의 자리의 수에 따라 그룹을 구분한다.  
1xx는 정보 응답, 2xx는 성공 응답, 3xx는 리다이렉트, 4xx는 요청오류, 5xx는 서버오류다.  
x00번이 해당 그룹의 대표로 쓰이며 뒤의 숫자마다 각기 다른 세부 정보를 포함한다.  

대표적으로 사용되는 코드들은 다음과 같다.

```
200 OK - 요청 성공
201 Created - 요청에 따른 새로운 리소스 생성 성공
204 No Content - 요청은 성공했지만 딱히 보내줄 내용이 없음
400 Bad Request - 잘못된 요청
401 Unauthorized - 비인증 요청
403 Forbidden - 비승인 요청
404 Not Found - 존재하지 않는 리소스에 대한 요청
500 Internal Server Error - 서버 에러
503 Service Unavailable - 서비스가 이용 불가능함
```

상태 코드에 대한 더 자세한 정보는 [MDN web docs](https://developer.mozilla.org/ko/docs/Web/HTTP/Status)에서 확인할 수 있다.

```java
    // in PostConroller.java
    @PostMapping("posts")
    public ResponseEntity<Void> createPost(@RequestBody @Valid PostCreateRequest request,
        @LoginMember Member member) {
        PostCreateResponse response = postService.createPost(request, member);
        return ResponseEntity.created(URI.create("/posts/" + response.getId())).build();
    }

    @GetMapping("posts/{postId}")
    public ResponseEntity<PostResponse> showPost(@PathVariable Long postId) {
        PostResponse response = postService.showPost(postId);
        return ResponseEntity.ok(response);
    }

    // in CommonAdvice.java
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(RuntimeException e) {
        return ResponseEntity.badRequest()
            .body(new ErrorResponse(e));
    }
```

이제 상태 코드에 대해 알았으니, 위처럼 응답으로 적절한 코드를 전달해주기만 하면 될 것이다.  
그렇다면 여기서 말하는 **적절한 코드**는 과연 무엇인가?

## 어떤 상태 코드를 줄까?
### 4xx vs 5xx

두 종류의 상태 코드는 서버 입장에서 **요청**이 잘못된 경우와 요청의 **처리 과정** 중 잘못된 경우로 나뉜다. 

4xx 에러는 서버 측에서 **예상할 수 있는 에러**다.  
`GET posts/{id}`에 id 값이 아닌 해괴한 문자열을 넣은 요청이나 인증되지 않은 사용자의 요청 등이 있다.  
대부분 클라이언트의 잘못된 요청이 해당 에러를 발생시킨다.

5xx 에러는 **예상하지 못한 에러**다.  
프로그래머의 실수로 잘못된 문법의 코드가 진행되거나 외부 API에 대한 이해 없이 사용한 경우가 될 수 있다.  
서버 측의 잘못이라는 이야기다.

Spring에서는 아래처럼 [ControllerAdvice](https://woowacourse.github.io/tecoble/2020-07-28-global-exception-handler)과 커스텀 예외를 통해 이 두 가지를 구분할 수 있다.
```java
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleUnexpectedException(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse(e, "서버 오류 발생"));
    }

    @ExceptionHandler(ExpectedException.class)
    public ResponseEntity<ErrorResponse> handleExpectedException(ExpectedException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(e));
    }
```

일반적으로 5xx 에러는 클라이언트에게 보여주면 안 된다.  
5xx 에러는 명백히 서버의 잘못이기 때문에 해당 에러의 처리는 클라이언트의 몫이 아니다.  
되도록 모든 예외는 서버 측에서 처리하거나 의미 있는 4xx 에러로 변환해 전달해줄 수 있도록 하자.

### 401 vs 403

각 상태 코드의 이름 때문에 혼동이 올 수 있다.  
직역하자면 401 Unauthorized는 **권한이 없는**이고 403의 Forbidden은 **금지된**을 의미한다.

401은 권한(Authorization)보다는 **인증**(Authentication)의 개념으로 가져가는 것이 좋다.  
인증이 되지 않아 자원을 이용할 수 없는 상태를 뜻한다.  

403은 인증된 사용자가 **권한 밖의 요청**을 했을 때 전달된다.

### 200 vs 204 vs 404

`GET posts/{id}`요청의 결괏값이 없을 때는 어떤 코드를 전달해야 할까?  
존재하지 않는 리소스에 대한 요청이니 얼핏 404를 전달하는 게 맞아 보인다.

그렇다면 `GET posts/user?name={name}`요청의 결괏값이 없을 때는?  
`GET posts`의 결괏값이 비어있는 상황에도 404를 전달해야 할까?

먼저, [RFC 7231](https://tools.ietf.org/html/rfc7231)에서 각 상태 코드의 의미에 대해 다시 한번 살펴보자.

> The 200 (OK) status code indicates that the request has succeeded.  
The payload sent in a 200 response depends on the request method.  
...<br>
GET  a representation of the target resource;

200은 요청의 성공을 나타내며 대상 리소스를 반환한다.

> The 204 (No Content) status code indicates that the server has successfully fulfilled the request and that there is no additional content to send in the response payload body.

204는 요청에 성공했지만 반환할 리소스가 없는 경우다.

> The 404 (Not Found) status code indicates that the origin server did not find a current representation for the target resource or is not willing to disclose that one exists.

404는 리소스를 찾지 못했거나 없는 경우를 나타낸다.

이렇게 보면 404가 합당해 보인다.  
200과 204는 URI가 가리키는 리소스가 존재하지 않는다는 상태를 나타내기 어렵다.

실제로 `SpringFramework`의 `ResponseEntity`에서는 200을 전달하려 할 때, `body`에 `null`값을 넣으면 404를 전달하도록 지정되어있다.

```java
	public static <T> ResponseEntity<T> of(Optional<T> body) {
		Assert.notNull(body, "Body must not be null");
		return body.map(ResponseEntity::ok).orElseGet(() -> notFound().build());
	}
```

하지만 4xx 에러가 기본적으로 잘못된 요청에 대해 전달되는 코드임을 생각했을 때, 404는 좋지 못한 선택일 수 있다.  
또한 데이터가 없어야 하는 상황과, 데이터가 있을 수도 없을 수도 있는 상황이 같은 에러를 전달한다면 클라이언트에게 혼란을 야기할 수도 있다.

HTTP에서 이야기하는 리소스와 서버 데이터의 개념을 분리해서 생각해보자.  
리소스를 온전한 URI로 보는 것이다.

`GET posts/{id}`의 형식을 지켰을 때라면 요청 자체는 문제가 없다.  
리소스가 없는 것은 서버 자체의 문제도 아니기 때문에 5xx 에러를 전달하는 것은 더더욱 말이 안 된다.  
클라이언트는 요청에 성공했지만, 데이터는 존재하지 않는다.  
이때쯤이면 204가 적당해 보인다.

하지만 [MDN의 200 OK](https://developer.mozilla.org/ko/docs/Web/HTTP/Status/200)에 대한 설명에서는 PUT과 DELETE 상황에서 204를 고려하고 있다.  
또한 [RFC 7231](https://tools.ietf.org/html/rfc7231#section-6.3.5)에서는 204가 현재 페이지에서 이동할 필요가 없다는 상황까지 내포한다고 한다.  
어떤가, 이제는 200이 적당해 보이는가?

---

여러 의견이 있더라도, 결국 상태 코드는 그저 **약속된 코드**다.  
다른 말로는 팀 컨벤션이라고 할 수 있겠다.  

실제로 `GET posts/{id}`요청의 리소스가 없을 때, 백준에서는 [404](https://www.acmicpc.net/problem/9999999999999999999999999999)를 전달한다.  
하지만 같은 상황에 대해 쿠팡에서는 [200](https://www.coupang.com/vp/products/9999999999999999999999999999)을 전달한다.

혼자서 개발하는 것이 아니라면, 팀원들과 상황에 따른 상태 코드를 정하고 시작하면 될 뿐이다.

마지막으로 글을 작성하며 발견한 꽤 좋은 결정 트리를 추천하려 한다.  
아직 별달리 정해진 컨벤션이 없다면 아랫글의 답변을 따라가 보는 건 어떨까?  
https://stackoverflow.com/questions/39636795/http-status-code-4xx-vs-5xx

---

참고 문서  

[404 vs 204 vs 200](https://ko.mort-sure.com/blog/http-get-rest-api-no-content-404-vs-204-vs-200-83ab9c/)

[200 vs 404](https://brainbackdoor.tistory.com/137)
