---
layout: post  
title: 웹 소켓에 대해 알아보자! - 이론 편
author: [3기_파피]
tags: ['websocket']
date: "2021-08-14T12:00:00.000Z"
draft: false
---

## 웹 소켓에 대해 알아보자! - 이론 편

실시간 알림, 실시간 채팅 등 실시간이라는 키워드가 들어가는 기능들을 위해서는 대부분 웹 소켓 기술이 필요하다.

이 글에서는 다음과 같은 주제를 다룬다.

- 웹 소켓이 무엇인지
- 웹 소켓의 탄생 배경
- 웹 소켓의 동작 방식
- 웹 소켓과 HTTP의 차이점

---

### 웹 소켓이란?

HTML5 표준 기술로, HTTP 환경에서 클라이언트와 서버 사이에 하나의 TCP 연결을 통해 실시간으로 **전이중 통신**을 가능하게 하는 **프로토콜**이다.
여기서 전이중 통신이란, 일방적인 송신 또는 수신만이 가능한 단방향 통신과 달리 가정에서의 전화와 같이 양방향으로 송신과 수신이 가능한 것을 말한다.
양방향 통신이 아닌 단방향 통신의 예로는 텔레비전 방송, 라디오를 들 수 있는데, 데이터를 수신만 할 수 있고, TV나 라디오를 통해 데이터를 보낼 수 없다.

---

웹 소켓 기술이 없을 때는 `Polling`이나 `Long polling` 등의 방식으로 실시간은 아니지만 그에 준하게끔 구현하여 해결했다.

지금은 웹 소켓의 등장으로 클라이언트와 서버간의 실시간 통신이 가능하게 되었다.

따라서 SNS, 멀티 플레이어 게임, 구글 공유 문서 등 실시간 웹 어플리케이션 구현을 위해 웹 소켓을 사용하고 있다.

---

### 웹 소켓의 탄생 배경

초기 웹의 탄생 목적은 문서 전달과 하이퍼링크를 통한 문서 연결이었다.

웹을 위한 HTTP 프로토콜은 이러한 목적에 매우 부합하는 모델이다.

그러나 시대가 변하고 환경이 발전할 수록 웹에게 동적인 표현과 뛰어난 상호작용이 요구되었고 이로 인해 여러 새로운 기술이 탄생되었다.

그 중 실시간 양방향 통신을 위한 스펙이 바로 웹 소켓인 것이다.

---

### 웹 소켓의 동작 방식

웹 소켓은 전이중 통신이므로, 연속적인 데이터 전송의 신뢰성을 보장하기 위해 Handshake 과정을 진행한다.

기존의 다른 TCP 기반의 프로토콜은 TCP layer에서의 Handshake를 통해 연결을 수립하는 반면, 웹 소켓은 HTTP 요청 기반으로 Handshake 과정을 거쳐 연결을 수립한다.

웹 소켓은 연결을 수립하기 위해 `Upgrade 헤더`와 `Connection 헤더`를 포함하는 HTTP 요청을 보낸다.

![image](https://user-images.githubusercontent.com/50273712/129447412-30e32809-b1fe-4e95-9d7a-85553f3ab92b.png)

통상적인 상태 코드 200 대신, 웹 소켓 서버의 응답은 다음과 같다.

![image](https://user-images.githubusercontent.com/50273712/129448362-0ada9130-1181-4d3b-ac4b-33bd4130b00d.png)

- `101 Switching Protocols`: Handshake 요청 내용을 기반으로 다음부터 WebSocket으로 통신할 수 있다.
- `Sec-WebSocket-Accept`: 보안을 위한 응답 키

Handshake 과정을 통해 연결이 수립되면 응용 프로그램 계층 프로토콜이 HTTP에서 웹 소켓으로 업그레이드가 된다.

업그레이드가 되면 HTTP는 사용되지 않고, 웹 소켓 연결이 닫힐 때까지 두 끝 점에서 웹 소켓 프로토콜을 사용하여 데이터를 주고 받게 된다.

웹 소켓 연결은 주로 새로고침이나 창 닫기 등의 이벤트 발생 시 닫힌다.

---

### 웹 소켓 vs HTTP

웹 소켓이 HTTP 요청으로 시작되며 HTTP에서 동작하지만, 두 프로토콜은 분명히 다르게 동작한다.

웹 소켓과 HTTP의 차이점은 다음과 같다.

- **HTTP**는 클라이언트와 서버간 접속을 유지하지 않으며 요청과 응답 형태로 단방향 통신만 가능하다. 
  따라서 서버에서 클라이언트로의 요청은 불가능하다. 
  또한 요청-응답이 완료되면 수립했던 연결이 닫힌다.
  **웹 소켓**은 클라이언트와 서버간 접속이 유지되며 요청과 응답 개념이 아닌 서로 데이터를 주고 받는 형식이다.
  

- REST한 방식의 **HTTP** 통신에서는 많은 URI와 Http Method를 통해 웹 어플리케이션과 상호작용하지만, 
  **웹 소켓**은 초기 연결 수립을 위한 오직 하나의 URL만 존재하며, 모든 메시지는 초기에 연결된 TCP 연결로만 통신한다.

---

### 간단한 예제

웹 소켓 서버를 만드는 것은 `WebSocketHandler`를 구현하는 것으로부터 출발한다. 대개 `TextWebsocketHandler`나 `BinaryWebSocketHandler`를 상속받아 구현한다.
예제에서는 `TextWebSocketHandler`를 상속받아 구현한다. 추후 콘솔에서 메시지를 확인해보기 위해 메시지를 출력하기로 한다.

```java
public class MyHandler extends TextWebSocketHandler {
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        System.out.println(message);
        System.out.println(message.getPayload());
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        System.out.println("afterConnectionEstablished:" + session.toString());
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        super.afterConnectionClosed(session, status);
    }
}
```

`handleTextMessage` 메서드는 웹 소켓 연결이 수립된 후, 해당 연결을 이용하는 세션과 메시지에 대해 다룬다.
`afterConnectionEstablished` 메서드는 연결이 수립된 직후의 행위를 지정한다.
`afterConnectionClosed` 메서드는 연결이 닫힌 직후의 행위를 지정한다.

---

이후, 구현한 웹 소켓 핸들러를 등록해주는 Config 클래스를 만들자.

```java
@Configuration
@EnableWebSocket
public class PureWebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(myHandler(), "/myHandler");
    }

    @Bean
    public WebSocketHandler myHandler() {
        return new MyHandler();
    }
}
```

`WebSocketHandlerRegistry`에 `WebSocketHandler`의 구현체를 등록했다.
등록된 `Handler`는 `"/myHandler"` 엔드 포인트로 Handshake를 완료한 후 맺어진 연결을 관리한다.

---

2021년 5월부터 Postman은 웹 소켓 요청을 지원한다. Postman으로 웹 소켓을 연결해 메세지를 보내고, IntelliJ 콘솔에서도 확인해보자.

첫 화면에서 new 버튼을 클릭한다.

![image](https://user-images.githubusercontent.com/50273712/129508126-e1c034d4-5858-45bf-8081-c0f81d83b959.png)

WebSocket Request를 클릭한다.

![image](https://user-images.githubusercontent.com/50273712/129508281-445ccbed-8396-4165-80e9-1078c5d48c99.png)

웹 소켓 연결을 맺기 위해 위에서 등록했던 핸들러의 경로를 입력한다.

![image](https://user-images.githubusercontent.com/50273712/129508612-5400af8a-9d86-4063-8b8a-f740df7ad2f4.png)

연결 성공 후 메시지를 보내면 다음과 같다.

![image](https://user-images.githubusercontent.com/50273712/129508714-7ae100a1-17df-4b47-880d-4dea746a4143.png)

IntelliJ 콘솔에서는 다음과 같이 확인할 수 있다.

![image](https://user-images.githubusercontent.com/50273712/129508834-a7152d85-0125-44af-a35e-051a0340803d.png)

### 결론

실시간 웹 어플리케이션을 만들기 위해 필요한 기술인 웹 소켓의 개념에 대해 알아보았다.

다음 글에서는 Spring Boot 환경에서 채팅 기능을 구현해볼 것이다.

---

### Reference

https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#websocket

https://asfirstalways.tistory.com/85

https://m.mkexdev.net/98
