---
layout: post  
title: 웹 소켓에 대해 알아보자! - 실전 편 author: [3기_파피]
tags: ['websocket']
date: "2021-09-05T12:00:00.000Z"
draft: false image: ../teaser/socket.png
---

<p style="font-family: sans-serif; text-align: center; color: #aaa; margin-bottom: 3em; font-size: 85%">image origin: <a href="https://unsplash.com/photos/vT9zeLCOpps">unsplash.com</a></p>

## 웹 소켓에 대해 알아보자! - 실전 편

이번 글에서는 저번에 작성했던 웹 소켓 이론 편에 이어서, 스프링 환경에서 웹 소켓을 사용하는 법에 대해 다루려고 한다.

### STOMP

구현하기에 앞서, 우리는 새로운 프로토콜을 도입할 것이다. 바로 STOMP이다.

STOMP는 Simple Text Oriented Messaging Protocol의 약자이다. WebSocket Protocol은 Text 또는 Binary 두 가지 유형의 메세지 타입은 정의하지만 메시지의 내용에
대해서는 정의하지 않는다. 따라서 STOMP라는 프로토콜을 서브 프로토콜로 사용한다. STOMP를 사용하게 되면 단순한 Binary, Text가 아닌 규격을 갖춘(format) message를 보낼 수 있다.
스프링은 spring-websocket모듈을 통해서 STOMP를 제공하고 있다.

STOMP의 형식은 HTTP와 닮아 있다.

```java
COMMAND
  header1:value1
  header2:value2

  Body^@
```

COMMAND로 SEND 또는 SUBSCRIBE 명령을 사용하며, header와 value로 메시지의 수신 대상과 메시지에 대한 정보를 설명할 수 있다. 기존의 WebSocket만으로는 표현이 불가능한 형식이다.
이를 통해 STOMP 프로토콜은 Publisher-Subscriber를 지정하고, 중간에서 메시지 브로커 역할을 함으로써 특정 사용자에게만 메시지를 전송하는 기능 등을 가능하게 한다.

Publisher-Subscriber 패턴의 예시는 다음과 같다.

Client A는 다음과 같이 5번 채팅방에 대해 구독(SUBSCRIBE)을 걸어놓을 수 있다.

```java
SUBSCRIBE
  destination:/subscribe/chat/room/5
```

그리고 나서 Client B가 아래와 같이 채팅 메시지를 보낼 수 있다.

```java
SEND
  content-type:application/json
  destination:/publish/chat

  {"chatRoomId":5,"type":"MESSAGE","writer":"clientB"}
```

### STOMP 기반 구현

```java

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
      registry.enableSimpleBroker("/subscribe");
      registry.setApplicationDestinationPrefixes("/publish");
    }
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
      registry.addEndpoint("/ws-connection")
              .setAllowedOrigins("chrome-extension://ggnhohnkfcpcanfekomdkjffnfcjnjam")
              .withSockJS();
    }
}
```

- `@EnableWebSocketMessageBroker`
  메시지 브로커가 지원하는 'WebSocket 메시지 처리'를 활성화한다. 
  
- `configureMessageBroker()`
  메모리 기반의 Simple Message Broker를 활성화한다. 메시지 브로커는 `"/subscribe"`으로 시작하는 주소의 Subscriber들에게 메시지를 전달하는 역할을 한다.
  이때, 클라이언트가 서버로 메시지 보낼 때 붙여야 하는 prefix를 지정한다. 예제에서는 `"/publish"`로 지정하였다.
  
- `registerStompEndpoints()`
  기존의 WebSocket 설정과 마찬가지로 HandShake와 통신을 담당할 EndPoint를 지정한다.
  클라이언트에서 서버로 WebSocket 연결을 하고 싶을 때, `"/ws-connection"`으로 요청을 보내도록 하였다.
  
클라이언트에서는 다음과 같이 연결하면 된다.

```javascript
function connect() {
    var socket = new WebSocket('/ws-connection');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function () {
        setConnected(true);
        stompClient.subscribe('/subscribe/rooms/4', function (greeting) {
            console.log(greeting.body);
        });
    });
}
```

메시지 전송 예시는 다음과 같다.

```javascript
function sendMessage() {
    stompClient.send("/publish/messages", {}, JSON.stringify({
        'message': $("#name").val(),
        'senderId': 7,
        'receiverId': 14,
        'roomId': 4
    }));
}
```
  
다시 서버로 돌아와서, ChatRequest DTO와 ChattingController를 살펴보자.

```java
@Getter
@NoArgsConstructor
public class ChatRequest {
    /**
     * 송신자 id
     */
    @NotNull
    private Long senderId;

    /**
     * 수신자 id
     */
    @NotNull
    private Long receiverId;

    /**
     * 채팅방 id
     */
    @NotNull
    private Long roomId;

    /**
     * 메시지 내용
     */
    @NotBlank
    private String message;

    public ChatRequest(Long senderId, Long receiverId, Long roomId, String message) {
        this.senderId = senderId;
        this.receiverId = receiverId;
        this.roomId = roomId;
        this.message = message;
    }
}

```

```java

@RestController
public class ChattingController {
    private final ChattingService chattingService;
    private final SimpMessagingTemplate simpMessagingTemplate;
  
    public ChattingController(ChattingService chattingService, SimpMessagingTemplate simpMessagingTemplate) {
      this.chattingService = chattingService;
      this.simpMessagingTemplate = simpMessagingTemplate;
    }
    
    @MessageMapping("/messages")
    public void chat(@Valid ChatRequest chatRequest) {
      chattingService.save(chatRequest);
      simpMessagingTemplate.convertAndSend("/subscribe/rooms/" + chatRequest.getRoomId(), chatRequest.getMessage());
    }
}
```
- SimpleMessagingTemplate
  `@EnableWebSocketMessageBroker`를 통해서 등록되는 `Bean`이다. Broker로 메시지를 전달한다.
  
- @MessageMapping
  Client가 SEND를 할 수 있는 경로이다. `WebSocketConfig`에서 등록한 `applicationDestinationPrfixes`와 `@MessageMapping`의 경로가 합쳐진다.(`/publish/messages`)

- chat()
  클라이언트에서 `/publish/messages` url로 메시지를 보내면, ChatRequest의 채팅 방 id를 이용하여 해당 방을 구독 중인 사용자들에게 메시지를 전달하도록 하는 메서드이다.
  
### 결론

STOMP를 활용한 스프링 환경의 채팅 기능 구현에 대해 알아보았다.

STOMP의 pub/sub 방식으로 아래와 같은 메시지 처리 관련 로직을 추상화하여 비즈니스 로직에 집중할 수 있었다.

- 해당 메시지가 어떤 요청인지
- 어떻게 처리해야하는지 
- 어떤 사용자에게 메시지를 전달해야하는지(웹 소켓 세션 관리)

메모리 기반의 Simple Message Broker 대신 Kafka, RabbitMQ, ActiveMQ 등의 메시징 시스템을 이용할 수도 있으니 추가로 학습하고 적용하는 것도 좋을 것이다.

### Reference
https://github.com/spring-guides/gs-messaging-stomp-websocket

https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#websocket

https://supawer0728.github.io/2018/03/30/spring-websocket/

https://sup2is.github.io/2019/06/05/websocket-1.html






