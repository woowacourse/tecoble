---
layout: post
title: '웹 소켓에 대해 알아보자! - 테스트 편'
author: [3기_와일더]
tags: ['websocket', 'web-socket', 'spring']
date: '2021-11-10T12:00:00.000Z'
draft: false
image: ../teaser/socket.png
source: https://unsplash.com/photos/vT9zeLCOpps
---

이 글은 웹 소켓으로 만든 채팅방을 어떻게 테스트할지 고민하는 독자를 위해 작성되었다. 

## 웹 소켓은 어떻게 테스트하면 좋을까?

Babble 팀의 데모데이 날 부스에서 질문을 받았다. "웹 소켓은 테스트를 어떻게 해야 할 지 감이 안 잡히는데 어떻게 구현하셨나요?" 테스트 코드에 정해진 정답은 없지만, 우리 팀도 웹 소켓 테스트 작성에 꽤 많이 고민했던 적이 있다. 고생해준 포츈🍀덕에 블로킹 큐를 이용하여 메시지를 저장하고 테스트를 해보는 방식으로 웹 소켓 테스트를 구현했다. 이 방법을 한번 알아보자.

사전에 웹 소켓 구현에 필요한 코드량이 많기 때문에 코드만 언급하고 테스트 코드 구현으로 넘어간다. 웹 소켓 실습에 대해 연습하고 싶다면 [여기](https://tecoble.techcourse.co.kr/post/2021-09-05-web-socket-practice/)를 먼저 참고하는 것을 추천한다.

## 프로젝트 설명

이 코드는 Babble 팀에서 사용하는 도메인 모델과는 차이가 있다. 순전히 테스트를 실습해보기 위해 만든 코드다. 

단순히 채팅하는 프로그램이 아니라 채팅방이 있고 사용자가 채팅방에 들어오거나 나가면서 1:N 의 채팅을 하는 프로그램이다. 채팅방을 위한 도메인부터 컨트롤러까지 모든 코드가 있기 때문에 자세한 구현은 [예제 저장소](https://github.com/lns13301/jwp-web-socket/tree/feature/practice)에서 확인한다.



## 테스트 코드 만들기

웹 소켓 테스트 코드에 대해 살펴본다. rest-assured 를 사용한 api 테스를 진행한다. rest-assured 는 given, when, then 패턴으로 테스트 코드를 작성하며 Json Data 를 쉽게 검증할 수 있다.



## 웹 소켓 연결을 테스트

웹 소켓을 연결하는 테스트는 별로 어렵지 않게 구현할 수 있다.

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
public class WebSocketConnectTest {

    @LocalServerPort
    private int port;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
    }

    @DisplayName("웹 소켓 연결을 시도한다.")
    @Test
    void webSocketConnectTest() {
        ExtractableResponse<Response> response = given().log().all()
            .when()
            .get("/ws-connection")
            .then().log().all()
            .extract();

        // then
        assertThat(response.statusCode()).isEqualTo(HttpStatus.OK.value());
    }
}
```

`WebSocketConfig` 클래스에서 EndPoint 를 `/ws-connection` 으로 설정해두었다. 따라서 `/ws-connection` 으로 요청하면 연결되는지 확인하는 테스트다. 연결 테스트는 간단하게 구현할 수 있다.

핵심 기능이라고 할 수 있는 채팅방 입장, 채팅방에서 주고받는 메시지가 올바르게 송수신 되는지, 채팅 방 퇴장을 확인하는 테스트는 어떻게 구현할 수 있을까?



## 채팅방 관련 기능 테스트

메시지를 큐에 저장하고 채팅 송수신이 끝난 후 실제로 받은 메시지가 큐에 올바르게 들어있는지 확인하는 방식으로 테스트를 만들었다.

```java
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
public class WebSocketChattingTest {

    @LocalServerPort
    private int port;
    private BlockingQueue<SessionResponse> users;
    private BlockingQueue<MessageResponse> messages;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoomRepository roomRepository;

    @BeforeEach
    public void setUp() {
        RestAssured.port = port;
        users = new LinkedBlockingDeque<>();
        messages = new LinkedBlockingDeque<>();
        유저_삽입();
        방_생성();
    }

    private void 유저_삽입() {
        userRepository.save(new User("와일더"));
        userRepository.save(new User("마이클"));
        userRepository.save(new User("제이슨"));
        userRepository.save(new User("오스카"));
    }

    private void 방_생성() {
        roomRepository.save(new Room(2));
        roomRepository.save(new Room(4));
        roomRepository.save(new Room(5));
    }

    @DisplayName("유저가 입장하고 메시지를 보내면 해당 방에 메시지가 브로드 캐스팅된다.")
    @Test
    void enterUserAndBroadCastMessage() throws InterruptedException, ExecutionException, TimeoutException {
        Room room = roomRepository.findAll().get(0);
        User user = userRepository.findAll().get(0);
     	  UserResponse expectedUser = UserResponse.from(user);
        MessageResponse expected = new MessageResponse(user.getId(), "채팅을 보내 봅니다.");

        // Settings
        WebSocketStompClient webSocketStompClient = 웹_소켓_STOMP_CLIENT();
        webSocketStompClient.setMessageConverter(new MappingJackson2MessageConverter());

        // Connection
        ListenableFuture<StompSession> connect = webSocketStompClient
            .connect("ws://localhost:" + port + "/ws-connection", new StompSessionHandlerAdapter() {
            });
        StompSession stompSession = connect.get(60, TimeUnit.SECONDS);

        stompSession.subscribe(String.format("/sub/rooms/%s", room.getId()), new StompFrameHandlerImpl(new SessionResponse(), users));
        stompSession.send(String.format("/pub/rooms/%s", room.getId()), new SessionRequest(user.getId(), "1A2B3C4D"));

        stompSession.subscribe(String.format("/sub/rooms/%s/chat", room.getId()), new StompFrameHandlerImpl(new MessageResponse(), messages));
        stompSession.send(String.format("/sub/rooms/%s/chat", room.getId()), new MessageRequest(user.getId(), "채팅을 보내 봅니다."));

        MessageResponse response = messages.poll(5, TimeUnit.SECONDS);

        // Then
        assertThat(response).usingRecursiveComparison().isEqualTo(expected);
    }

    private WebSocketStompClient 웹_소켓_STOMP_CLIENT() {
        StandardWebSocketClient standardWebSocketClient = new StandardWebSocketClient();
        WebSocketTransport webSocketTransport = new WebSocketTransport(standardWebSocketClient);
        List<Transport> transports = Collections.singletonList(webSocketTransport);
        SockJsClient sockJsClient = new SockJsClient(transports);

        return new WebSocketStompClient(sockJsClient);
    }
}
```

벌써 머리가 아프기 시작한다. 안 그래도 낯선 Web Socket 이란 기술을 테스트해 보려고 하다가 머리가 새하얗게 될 것만 같다. 이쯤 되면 그냥 Postman 으로 테스트를 하고 싶어진다. 그래도 참고 테스트 코드를 구현해볼 의지가 있는 독자는 참고하길 바란다. 핵심이 되는 부분을 살펴보자.

웹 소켓은 스레드에서 동작하기 때문에 `BlockingQueue` 에 담아둔다. `BlockingQueue`를 사용하지 않으면 메시지를 주고 받고 나서 데이터가 남아있지 않다.

테스트 코드에서 사용할 `WebSocketStompClient` 를 만든다.

```java
    private WebSocketStompClient 웹_소켓_STOMP_CLIENT() {
        StandardWebSocketClient standardWebSocketClient = new StandardWebSocketClient();
        WebSocketTransport webSocketTransport = new WebSocketTransport(standardWebSocketClient);
        List<Transport> transports = Collections.singletonList(webSocketTransport);
        SockJsClient sockJsClient = new SockJsClient(transports);

        return new WebSocketStompClient(sockJsClient);
    }
```

위에서 만든 Client 에 MessageConverter 를 적용한다. StringMessageConverter, SimpleMessageConverter 등 여러 MessageConverter 구현체가 있다. 여기서는 JSON 을 지원하는 `MappingJackson2MessageConverter` 클래스를 사용했다.

```java
// Settings
WebSocketStompClient webSocketStompClient = 웹_소켓_STOMP_CLIENT();
webSocketStompClient.setMessageConverter(new MappingJackson2MessageConverter()); 
```

다음은 연결 요청 부분이다.

```java
// Connection
ListenableFuture<StompSession> connect = webSocketStompClient
            .connect("ws://localhost:" + port + "/ws-connection", new StompSessionHandlerAdapter() {
            });
        StompSession stompSession = connect.get(60, TimeUnit.SECONDS);
```

방 입장 및 채팅을 보내는 부분이다. 컨트롤러에서 설정해둔 `@MessageMapping` 의 URI 로 접근한다. 여기서 `StompFrameHandlerImpl` 클래스는 직접 구현한 것이니 뒤에서 다루도록 한다. TimeOut 시간은 너무 짧게 설정하면 데이터가 남아있지 않기 때문에 적당하게 시간을 설정한다.

```java
stompSession.subscribe(String.format("/sub/rooms/%s", room.getId()), new StompFrameHandlerImpl(new SessionResponse(), users));
        stompSession.send(String.format("/pub/rooms/%s", room.getId()), new SessionRequest(user.getId(), "1A2B3C4D"));

        stompSession.subscribe(String.format("/sub/rooms/%s/chat", room.getId()), new StompFrameHandlerImpl(new MessageResponse(), messages));
        stompSession.send(String.format("/sub/rooms/%s/chat", room.getId()), new MessageRequest(user.getId(), "채팅을 보내 봅니다."));

```

`BlockingQueue` 에 저장되어 있던 메시지를 꺼낸다. 미리 만들어둔 값과 비교한다.

```java
MessageResponse response = messages.poll(5, TimeUnit.SECONDS);

// Then
        assertThat(sessionResponse.getUserResponses().get(0)).usingRecursiveComparison().isEqualTo(expectedUser);
assertThat(messageResponse).usingRecursiveComparison().isEqualTo(expectedMessage);
```

`StompFrameHandlerImpl` 클래스는 직접만든 StompFrameHandler 구현체다. 

```java
public class StompFrameHandlerImpl<T> implements StompFrameHandler {

    private final T response;
    private final BlockingQueue<T> responses;

    public StompFrameHandlerImpl(final T response, final BlockingQueue<T> responses) {
        this.response = response;
        this.responses = responses;
    }

    @Override
    public Type getPayloadType(final StompHeaders headers) {
        return response.getClass();
    }

    @Override
    public void handleFrame(final StompHeaders headers, final Object payload) {
        System.out.println(payload);
        responses.offer((T) payload);
    }
}
```

위의 객체를 생성할 때 payload 를 받을 클래스의 타입을 지정하고, payload 가 담길 BlockingQueue 를 넣어준다. 테스트를 실행하면 테스트가 성공적으로 동작하는 것을 확인할 수 있다.



## 결론

`Blocking Queue` 에 담긴 메시지를 통해 테스트하는 방식을 알아봤다. 오늘 알아본 테스트 코드 하나면 방 입장, 채팅, 퇴장 등 웬만한 테스트를 응용할 수 있으리라 생각한다. 웹 소켓은 양방향 통신이라는 매력적인 기술이지만 참고할 레퍼런스가 상당히 적다는 점이 아쉽다. 프로젝트에 웹 소켓을 적용하려는 모든 분을 응원한다.



## 참고

- [Testing WebSockets for beginners](https://blog.scottlogic.com/2019/07/23/Testing-WebSockets-for-beginners.html)
