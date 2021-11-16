---
layout: post  
title: 동기와 비동기 with webClient
author: [3기_영이]
tags: ['asynchronous', 'synchronous', 'webclient']
date: "2021-10-20T12:00:00.000Z"
draft: false
image: ../teaser/webflux.png
---

'여기서 만나' 프로젝트를 진행하면서 초반에는 RestTemplate을 통하여 외부 API와 데이터를 주고받았다. 이후 WebClient가 비동기 방식으로 쓰여 더 좋다고 하여 WebClient로 변경했다. 그리고 이전 글에서 RestTemplate과 WebClient에 대한 비교를 했다. 아마도 "WebClient가 비동기라 동기로 진행되는 RestTemplate보다 훨씬 빠르고 더 좋아" 라는 글이였을 것이다. 하지만 프로젝트를 진행하면서 계속해서 리팩토링을 진행하고 동기, 비동기에 대한 개념을 공부해나가면서 우리 팀이 적용했던 방식은 비동기인 WebClient를 쓰면서 비동기로 동작하지 않도록 구현 하였다. 이번 글에서는 우리 팀이 중간지점을 찾는 '여기서 만나'의 핵심 로직을 구현하면서 진짜 비동기 방식으로 WebClient를 사용하는 방법에 관해 이야기 해보려한다. 이 글은 WebClient에 관한 이야기는 아니다. 비동기로 동작 하도록 하기 위해 고군분투 했던 우리 팀의 이야기이다. WebClient의 사용법이 궁금하다면 다른 글을 참고하면 좋을 것 같다.

## 동기와 비동기

동기와 비동기는 자주듣는 것 같은데 항상 헷갈린다. 동기와 비동기에 대해서는 JavaScript 미션을 하면서 처음 접했었다. 그때는 동기 비동기에 대한 이해도 없이 단순히 미션을 구현하는 데에만 집중했던 것 같다. 동기와 비동기는 호출한 결과의 완료 여부를 확인을 하는가 안 하는가에 따라 구분 할 수 있다. 동기 비동기에 대한 비유는 흔히 카페에서 주문하는 상황으로 표현이 된다.

### 동기

카페에서 커피를 주문한다고 생각해보자. 점원은 한 명 밖에 없는데 주문을 하고 나니 점원이 커피를 바로 줄 테니 기다려라고 한다. 뒤에 사람은 계속 오는데 커피가 나올 때 까지 뒤에 사람은 가만히 뒤에 서 있기만 해야 한다. 이 상황이 동기와 비슷한 상황이다. 동기란 결국 순서대로 실행된다는 것이다. 요청을 보내고 난 뒤 응답이 오기 전까지는 아무것도 할 수가 없다. 자바스크립트에서 모든 경우를 동기 방식으로 처리한다면 나는 웹 서비스를 이용 하고 싶지 않을 것 같다.

이렇게 말하면 동기 방식이 별로 좋은 점이 없는 것 같다. 하지만 동기 방식은 장점이 많다. 일단 코드를 파악하기가 엄청 쉽다. 무엇보다도 순서대로 실행이 되기 때문에 디버깅도 쉽다. 멀티 스레드로 구현하지 않는 이상 비동기로 구현하는 것은 거의 힘들다.

### 비동기

이번에도 카페에서 커피를 주문한다고 생각해보자. 이번에도 커피를 주문하는데 주문을 하고 나니 점원이 진동벨을 건네주며 진동벨이 울리면 가지러 오라고 한다. 주문만 하고 앞에 사람이 빠져 바로 뒤에 기다리던 사람이 주문을 할 수 있다. 이러한 상황이 바로 비동기다.

싱글스레드에서는 비동기에 대하여 고민하지 않아도 된다. 자바에서 다른 스레드없이 Main함수를 통하여 실행한다면 이는 항상 동기로 동작을 한다. 순수 자바로서만 구현을 한다면 멀티 스레드인 환경에서 동작할때 비동기로 동작이 되는데 이때는 동시성 문제와 동기 처리에 대해 고민해봐야한다. WebClient는 싱글 스레드와 비동기/ non-blocking 방식을 사용할 수 있다. 여기서 주의해야할 점이 "사용할 수 있다" 이다. 우리 팀이 잘못 사용했던 것처럼 비동기/ blocking방식으로 사용할 수도 있다.

## 비동기지만 비동기가 아닌(blocking)

중간지점을 찾는 로직을 구현하면서 WebClient를 사용했다. WebClient를 이용하면 외부 API로의 요청을 보내고 응답을 기다리지 않고 다음 요청을 처리한다. 우리가 진행한 프로젝트는 WebFlux 기반이 아닌 Srping MVC  기반으로 동작을 하는데 이때 WebFlux 기반인 WebClient의 반환값인 Mono나 Flux를 처리하기 위해서는 따로 처리를 해줘야 한다. 이 부분에서 비동기로 구현하였지만, 비동기 답게 쓰지 못했다.

WebClient를 사용하면 당연히 비동기 방식으로 동작을 한다 생각하였다. 비동기니까 중간지점을 찾는 로직은 당연히 빠르겠다고 생각하였다. 또한 비동기니까 요청이 많아도 시간이 얼마 걸리지 않겠지 라고 생각했었다. 하지만 중간지점을 계산하는 로직은 거의 1분이 넘는 시간이 걸렸었다. 물론 계산해야 할 부분이 많아 API 요청이 많아지게 되어 느릴 수 있지만 그렇다고 서비스를 제공하기에는 너무 시간이 걸렸다. 이후 알게 되었지만 우리는 WebClient에 block을 걸어 사용하였고 이는 비동기/ blocking 방식으로 동작하여 비동기지만 시간이 아주 오래 걸리게 되었다.

```java
private APIUtilityResponse receivedUtilityResponse(String categoryCode, 
		double x, double y, int page) {
    return webClient.get()
        .uri(uriBuilder ->
            uriBuilder.path(BASIC_URL)
                .queryParam("x", x)
                .queryParam("y", y)
                .queryParam("category_group_code", categoryCode)
                .queryParam("radius", BASIC_DISTANCE)
                .queryParam("page", page)
                .queryParam("sort", "distance")
                .build()
        )
        .accept(MediaType.APPLICATION_JSON)
        .retrieve()
        .bodyToFlux(APIUtilityResponse.class)
        .toStream()
        .findFirst()
        .orElseThrow(() -> new GoodDayException(LocationExceptionSet.KAKAO_SERVER));
}
```

위 코드를 보면 toStream()을 사용한 것을 볼 수 있다. 위 코드에는 없지만 다른 곳에서는 block()을 아주 당연하게 적용하였다. toStream()이나 block()을 사용하게 되면 결국 결과가 반환될 때 까지 기다리게 되고 결과가 완전히 도착해야 다음 단계로 넘어가게 된다. 이는 비동기지만 blocking이라 할 수 있다.

## 비동기를 비동기 답게(non-blocking)

중간지점은 우리 서비스에 핵심 기능이다. 그런데 이 핵심 기능이 1분이나 걸린다는 것은 말도 안 되는일이었다. 문제는 WebClient의 Blocking이였다. WebFlux 기반의 프로젝트라면 WebClient가 반환한 Mono 나 Flux를 통하여 reactive 하게 사용하면 된다. 하지만 이전에도 말했듯이 우리 프로젝트는 Spring MVC 기반이었다. Mono, Flux 를 어쩔 수 없이 우리가 원하는 객체의 형태로 바꿔줘야 했다.

```java
public Map<Point, APIUtilityResponse> findNearbyStations(Points points) {
    Map<Point, APIUtilityResponse> nearbyStations = new HashMap<>();
    points.getPointRegistry().forEach(point ->
        webClient.get()
            .uri(uriBuilder ->
                uriBuilder.path(BASIC_URL)
                    .queryParam("x", point.getX())
                    .queryParam("y", point.getY())
                    .queryParam("category_group_code", LocationCategory.SW8.getCode())
                    .queryParam("radius", BASIC_DISTANCE)
                    .queryParam("page", 1)
                    .queryParam("sort", "distance")
                    .build())
            .accept(MediaType.APPLICATION_JSON)
            .retrieve()
            .bodyToMono(APIUtilityResponse.class)
            .subscribe(result -> nearbyStations.put(point, result))
    );
    return nearbyStations;
}
```

위 코드를 보면 toStream()이나 block()이 없는 것을 볼 수 있다. toStream(), block() 이없다 해도 만약 subscribe() 가 없다면 webClient 요청이 전달되지 않는다. subscribe() 에서 요청이 전달되고 result에 결과 가 담겨 들어온다. nearbyStations에 담긴 value는 실제로 아직 값이 없는 시점이 있다. 정확한 시점을 알 수는 없지만 비동기로 요청을 보냈고 해당 로직을 수행하고 우리가 원하는 데이터가 반환되면 nearByStations에 value로 들어간다. 반환된 nearByStations 안에 APIUtilityResponse를 진짜 사용할 때 값이 있는지 없는지 확인하여 사용한다. 값이 들어오는 것을  기다리지 않고 요청만 보낸 후 다른일을 한다. 나중에 진짜 필요할 때 체크를 하고 사용하는 것이다.

## 결론

동기였던 중간지점을 찾는 로직을 비동기 non-blocking 구조로 바꾸면서 1분이 걸리던 로직이 7~8초대로 줄어들었다. 우리 팀의 핵심 로직이 드디어 제대로 구실을 하는 순간이였다. 비동기에 많은 시간을 투자하였다. 이제 진짜 제대로 된 비동기인줄 알았는데 비동기가 아니였다는 걸 깨닫는 과정을 계속 반복하였었다. 이제는 진짜 비동기로 작동하는 것이면 좋겠다. 7~8초대라면 진짜 비동기로 처리하고 있는 것으로 생각해본다.
