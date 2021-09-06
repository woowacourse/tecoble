---
layout: post  
title: 웹 소켓에 대해 알아보자! - 실전 편 
author: [3기_파피]
tags: ['websocket']
date: "2021-09-05T12:00:00.000Z"
draft: false 
image: ../teaser/socket.png
---

<p style="font-family: sans-serif; text-align: center; color: #aaa; margin-bottom: 3em; font-size: 85%">image origin: <a href="https://unsplash.com/photos/vT9zeLCOpps">unsplash.com</a></p>

## 웹 소켓에 대해 알아보자! - 실전 편

이번 글에서는 저번에 작성했던 [웹 소켓 이론 편](https://tecoble.techcourse.co.kr/post/2021-08-14-web-socket/)에 이어서, 스프링 환경에서 웹 소켓을 사용하는 법에 대해 다루려고 한다.

### STOMP

구현하기에 앞서, 우리는 새로운 프로토콜을 도입할 것이다. 바로 STOMP이다.

STOMP는 Simple Text Oriented Messaging Protocol의 약자이다. WebSocket 프로토콜은 Text 또는 Binary 두 가지 유형의 메시지 타입은 정의하지만 메시지의 내용에 대해서는 정의하지 않는다. 
즉, WebSocket만 사용해서 구현하게 되면 해당 메시지가 어떤 요청인지, 어떤 포맷으로 오는지, 메시지 통신 과정을 어떻게 처리해야 하는지 정해져 있지 않아 일일이 구현해야 한다.
따라서 STOMP라는 프로토콜을 서브 프로토콜로 사용한다. STOMP는 클라이언트와 서버가 서로 통신하는 데 있어 메시지의 형식, 유형, 내용 등을 정의해주는 프로토콜이라고 할 수 있다. 
STOMP를 사용하게 되면 단순한 Binary, Text가 아닌 규격을 갖춘 메시지를 보낼 수 있다.
스프링은 spring-websocket 모듈을 통해서 STOMP를 제공하고 있다.

STOMP의 형식은 HTTP와 닮았다.

```java
COMMAND
  header1:value1
  header2:value2

  Body^@
```

클라이언트는 메시지를 전송하기 위해 COMMAND로 SEND 또는 SUBSCRIBE 명령을 사용하며, header와 value로 메시지의 수신 대상과 메시지에 대한 정보를 설명할 수 있다. 기존의 WebSocket만으로는 표현할 수 없는 형식이다.
이를 통해 STOMP 프로토콜은 Publisher(송신자)-Subscriber(수신자)를 지정하고, 메시지 브로커를 통해 특정 사용자에게만 메시지를 전송하는 기능 등을 가능하게 한다.
메시지 브로커는 Publisher로부터 전달받은 메시지를 Subscriber로 전달해주는 중간 역할을 수행한다고 생각하면 된다.
메시지 브로커의 동작 방식은 다음과 같다.

1. 각각 A, B, C 라는 유저가 차례로 5번방에 입장한다.
2. A가 5번방에서 채팅을 전송한다.
3. 5번방 메시지 브로커(중재자)가 메세지를 받는다.
4. 5번방 메시지 브로커가 5번방 구독자들(A, B, C)에게 메세지를 전송한다.

지금부터 5번방에 유저들이 참가하여 메시지를 주고받는 상황을 단계별로 살펴보자.

유저들은 채팅방에 입장함과 동시에 다음과 같이 5번 채팅방에 대해 구독(SUBSCRIBE)을 하게 되고, 메시지 브로커는 클라이언트의 SUBSCRIBE 정보를 자체적으로 메모리에 유지한다.

```java
SUBSCRIBE
  destination:/subscribe/chat/room/5
```

다음과 같이 어떤 유저가 메시지를 보내면, 메시지 브로커는 SUBSCRIBE 중인 다른 유저들에게 메시지를 전달한다.

```java
SEND
  content-type:application/json
  destination:/publish/chat

  {"chatRoomId":5,"type":"MESSAGE","writer":"clientB"}
```

### STOMP 기반 구현

위에서 말한 시나리오대로 구현해보자. 먼저, WebSocket 관련 설정 클래스를 추가해야 한다.
간단하게 요약하면 WebSocket 연결을 요청할 주소와 SUBSCRIBE, PUBLISH를 요청할 주소를 설정해주는 것이다.

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
  
송신자와 수신자, 채팅방 번호 그리고 메시지 내용을 담고 있는 ChatRequest DTO는 다음과 같다.

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

Controller는 다음과 같다.

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
  클라이언트에서 `/publish/messages` url로 메시지를 보내면, ChatRequest의 채팅방 id를 이용하여 해당 방을 구독 중인 사용자들에게 메시지를 전달하도록 하는 메서드이다.

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
  
### 결론

WebSocket에 STOMP를 활용한 스프링 환경의 채팅 기능 구현에 대해 알아보았다.

메모리 기반의 STOMP 메시지 브로커 대신 Kafka, RabbitMQ, ActiveMQ 등의 메시징 시스템을 이용할 수도 있으니 추가로 학습하고 적용하는 것도 좋을 것이다.

### Reference

https://github.com/spring-guides/gs-messaging-stomp-websocket

https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#websocket

https://supawer0728.github.io/2018/03/30/spring-websocket/

https://sup2is.github.io/2019/06/05/websocket-1.html
