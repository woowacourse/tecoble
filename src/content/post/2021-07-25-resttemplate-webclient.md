---
layout: post  
title: RestTemplate과 WebClient
author: [3기_영이]  
tags: ['spring', 'resttemplate', 'webclient']  
date: "2021-07-25T12:00:00.000Z"  
draft: false  
image: ../teaser/resttemplate.png
---
이 글은 자바에서 HTTP 요청을 써봤거나 써보려고 하는 독자를 대상을 작성하였습니다.

스프링 어플리케이션에서 HTTP 요청할 때 사용하는 방법으로 RestTemplate과 WebClient가 있다. 스프링 5.0 이전까지는 클라이언트에서 HTTP 접근을 위해 사용한 것은 RestTemplate 이었다. 스프링 5.0 에서 WebClient가 나왔고 현재는 WebClient를 사용하기를 권고하고 있다. 이번 팀 프로젝트를 진행하면서 RestTemplate을 도입하였었다. 하지만 RestTemplate이 deprecated 될 가능성이 있다는 얘기를 들었고 새로 시작하는 프로젝트에서는 WebClient를 쓰는 것이 좋겠다는 의견이 있어 WebClient를 적용해보게 되었다. 그럼 RestTemplate과 WebClient는 어떤 특징이 있으며 왜 WebClient를 사용하길 권고하는지 알아보도록 하자.

## RestTemplate

### RestTemplate 이란?

스프링 3.0에서부터 지원하는 RestTemplate은 HTTP 통신에 유용하게 쓸 수 있는 템플릿이다. REST 서비스를 호출하도록 설계되어 HTTP 프로토콜의 메서드 (GET, POST, DELETE, PUT)에 맞게 여러 메서드를 제공한다. RestTemplate은 다음과 같은 특징이 있다

**RestTemplate 특징**

- 통신을 단순화하고 RESTful 원칙을 지킨다
- 멀티쓰레드 방식을 사용
- Blocking 방식을 사용

### 의존성 설정

기본 스프링 부트 의존성을 추가하면 RestTemplate 관련 의존성은 자동으로 추가된다. 따라서 스프링 부트를 사용한다면 별다른 신경을 쓰지 않아도 된다.

```java
implementation 'org.springframework.boot:spring-boot-starter-web'
```

### RestTemplate 사용

RestTemplate을 생성할 때 어떤 HttpClient를 사용할 것인지 ClientHttpRequestFactory를 전달하여 지정할 수 있다. 기본 생성자의 경우 내부적으로 ClientHttpRequestFactory 의 구현체 SimpleClientHttpRequestFactory를 사용하여 초기화한다.

**RestTemplate의 생성**

```java
@Configuration
public class RestTemplateClient {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder.build();
    }
}
```

RestTemplate을 생성할때는 builder를 통하여 생성해 줄 수 있다. builder를 통해 생성하고 스프링 빈으로 사용할 수 있도록 설정해준다.

```java
public class RestTemplateTestClass {
    @Autowired 
    RestTemplate restTemplate;

    public TestClass(RestTemplate restTemplate){
            this.restTemplate = restTemplate;
    }

    public String getSthFromServer(){
        return restTemplate.getForObject("https://example.com",String.class);
    }
}
```

RestTemplate을 사용하기 위해서는 `restTemplate.메소드명()` 을 사용하면 된다.

![image](https://user-images.githubusercontent.com/63634505/126900492-9e508e47-6872-4de1-a463-25cbbd95dc46.png)

## WebClient

### WebClient 란?

WebCleint는 스프링 5.0에서 추가된 인터페이스다. 스프링 5.0 이전에는 비동기 클라이언트로 AsyncRestTemplate을 사용했었다. 하지만 스프링 5.0 이후부터는 WebClient를 사용할 것을 권장한다. WebClient는 다음과 같은 특징이 있다.

- 싱글 스레드 방식을 사용
- Non-Blocking 방식을 사용
- JSON, XML을 쉽게 응답받는다.

### 의존성 설정

WebClient를 사용하기 위해서는 RestTemplate와 달리 의존성을 추가해야 할 부분이 있다. webflux 의존성을 추가해줘야 한다. Gradle 기준으로 아래와 같이 의존성을 추가해주면 된다.

```java
// webflux
implementation 'org.springframework.boot:spring-boot-starter-webflux'
```

### WebClient 생성

WebClient를 생성하는 데는 2가지의 방법이 있다.

- WebClient.create();
- Builder를 활용한 클래스 생성

```java
Webclient webClient = WebClient
	                    .builder()
	                    .baseUrl("http://localhost:8080")
	                    .defaultCookie("쿠키","쿠키값")
	                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
	                    .build();
```

**Request요청하기**

```java
WebClient.RequestHeaderUriSpec<?> baseSpec = Webclient.builder()
																								.baseUrl("주소")
																								.build()
																								.get();

// baseSpec에 원하는 파라미터를 추가로 붙여서 요청한다. 
baseSpec.uri(builder -> builder.path("/")
                               .queryParam("이름","값")
                               .builder()
                        )
                        .retrieve() // Response를 받아옴.
```

**Response 받아오기**

response를 받아오는 방법에는 두 가지가 있다.

- exchange() → ClientResponse를 상태값 그리고 헤더와 함께 가져온다
- retrieve() → body를 바로 가져온다.

```java
String response = req.exchange().block().bodyToMono(String.class).block();
String response2 = req2.retrieve().bodyToMono(String.class).block();
```

bodyToMono 는 가져온 body를 Reactor의 Mono 객체로 바꿔준다. Mono 객체는 0-1개의 결과를 처리하는 객체이다. Flux는 0-N개의 결과를 처리하는 객체이다.

> `block()` 을 사용하면 RestTemplate 처럼 동기식으로 사용할 수 있다.

## RestTempalte 과 WebClient의 차이

RestTemplate과 WebClient의 가장 큰 차이점은 Non-Blocking과 비동기화 가능 여부일 것이다. 결국 이러한 차이점이 스프링에서 RestTemplate을 사용하는 것 보다 WebClinet의 사용을 권장하는 이유라고 생각한다. 스프링 4.0에서 RestTemplate의 비동기 문제를 해결하기 위해 AsyncRestTemplate을 잠깐 사용하긴 했지만, 현재 deprecated 된 상태이다.

![image](https://user-images.githubusercontent.com/63634505/126900349-905377fe-27ac-4d7a-8b9a-371fb22aee74.png)

> Non-Blocking?
>
>  시스템을 호출한 직후에 프로그램으로 제어가 다시 돌아와서 시스템 호출의 종료를 기다리지 않고 다음 동작을 진행한다. 호출한 시스템의 동작을 기다리지 않고 동시에 다른 작업을 진행할 수 있어서 작업의 속도가 빨라진다는 장점이 있다.


### 성능비교

![image](https://user-images.githubusercontent.com/63634505/126900385-ffdecfe7-f5b6-4c7a-a2ed-69145cc85390.png)

출처 : https://alwayspr.tistory.com/44

Boot1 은 RestTemplate을 사용하고 Boot2 는 WebClient 를 사용한다. 동시 사용자가 1,000명까지는 처리속도가 거의 비슷하지만 그 이후에서는 RestTemplate(Boot1) 이 급격하게 느려지는 것을 볼 수 있다. 동시 사용자의 규모가 별로 없다면 RestTemplate을 사용하는 것은 별문제 없지만 어느정도의 규모가 있다면 WebClient를 선택하는 것이 바람직해 보인다.

## 정리

이전까지 RestTemplate을 사용했다면 굳이 WebClient로 변경할 필요는 없을 것 같다. 하지만 새롭게 개발을 진행한다면 WebClient의 도입을 생각해봐야 한다. WebClient는 RestTemplate이 할 수 있는 동기호출을 할 수 있고 비동기 호출도 가능하다. 하지만 RestTemplate은 WebClient가 가능한 비동기 호출을 할 수 없다. RestTemplate을 사용한다면 응답이 올 때까지 계속 기다려야 할 것이다.

## 참고

- [https://juneyr.dev/2019-02-12/resttemplate-vs-webclient](https://juneyr.dev/2019-02-12/resttemplate-vs-webclient)
- [https://www.baeldung.com/spring-webclient-resttemplate](https://www.baeldung.com/spring-webclient-resttemplate)
- [https://happycloud-lee.tistory.com/220](https://happycloud-lee.tistory.com/220)
