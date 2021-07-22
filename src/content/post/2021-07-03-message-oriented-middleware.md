---
layout: post  
title: 'Message Oriented Middleware'
author: [3기_완태]
tags: ['message', 'msa']
date: "2021-07-03T12:00:00.000Z"
draft: false
image: ../teaser/message-oriented-middleware.png
---

프로젝트를 진행하면서, 서버와 서버 사이에 메시지를 통해 비동기적으로 전달하는 방법이 필요했다. 관련된 개념인 Message Oriented Middleware(메시지 기반 미들웨어)에 관해 알아보고, 메시지 전달의 두 가지 방식인 메시지 큐와 Pub/Sub 모델을 비교한다.
<!-- end -->
 

---

## Message Oriented Middleware(MOM)

Message Oriented Middleware를 이해하기에 앞서 미들웨어의 개념을 먼저 알아보자. 미들웨어, Middle + (soft)ware, 소프트웨어 중간에 존재하여 상호작용을 하게 해주는 것이다. 대표적으로 Java서버를 DB와 연결해주는 JDBC를 들 수 있다.

`그렇다면 Message Oriented Middleware는 무엇일까?`

MOM(Message Oriented Middleware) 시스템은 메시지를 기반으로 한 미들웨어이며, 비동기 메시지를 통해 두 소프트웨어의 통신을 중개한다.

![image](../images/2021-07-03-message-oriented-middleware-1.png)
출처: oracle docs

전달하는 데이터를 `Message`(메시지), 메시지를 보내는 클라이언트를 `Producer`(프로듀서), 메시지를 받는 클라이언트를 `Consumer`(컨슈머), 메시지 전달 공급자의 용어 대신 `Message Broker`(메시지 중개인)로 정의하여 이 글에서는 사용하겠다.

프로듀서는 API를 호출하여 메시지 중개인에게 메시지를 라우팅하여 전달하고, 메시지를 보낸 후에는 다른 작업을 계속해서 수행한다. 중개인은 컨슈머가 메시지를 검색할 때까지 메시지를 보관한다. 컨슈머는 전달된 데이터를 수신하고 처리한다.

이런 MOM 시스템은 느슨하게 결합한 시스템을 만들어내어, 각각의 주요 로직에만 집중하여 작업을 진행할 수 있다. 또한 중개자에 인터페이스를 추가하여 성능을 모니터링할 수 있으며, 분산처리와 확장성 측면에서도 이점을 가져 MSA(Micro Service Architecture)의 주요 기술로 사용된다.

MOM이 메시지를 전달하는 방식은 크게 메시지 큐 모델, Pub-Sub 모델 두 가지로 분리된다.


---

## 메시지 큐(Queue) 모델

![image](../images/2021-07-03-message-oriented-middleware-2.png)
Queue는 First-In First-Out의 자료구조이다. 즉, 메시지 큐는 들어온 메시지 저장하고 들어온 순서대로 컨슈머에 전달되어 처리되는 구조이다.

여러 컨슈머를 사용하면 높은 속도로 일을 처리할 수가 있다. 각각의 컨슈머는 메시지를 하나씩 전달받고 병렬적으로 작업을 처리하게 된다. 메시지 큐 모델은 메시지의 단일 처리를 보장하는데, 이를 위해 메시지가 컨슈머에 전달되어 처리되면 큐에서 삭제된다.

네트워크나 컨슈머의 문제가 생겨 전송되지 못한 메시지의 경우 별도의 `Dead Letter Queue`로 저장된다. 이 큐는 재처리, 무시, 관리자가 직접 처리 등 다양한 방식으로 처리를 할 수 있다. 재처리로 메시지를 새로 메시지 큐에 넣게 되면, 메시지의 순서를 보장하지 못하게 된다.

대표적인 예시가 정산 시스템이다. 정산은 속도가 빠르면 좋고, 순서는 상관없으며, 한 번씩만 처리되는 것이 매우 중요하기 때문에 메시지 큐를 이용하기 매우 적합하다.

메시지 큐 모델을 기반으로 만들어진 기술은 Apache ActiveMQ, Amazon SQS, IBM Websphere MQ, RabbitMQ 등이 있다.

---

## Pub/Sub 모델

![image](../images/2021-07-03-message-oriented-middleware-3.png)
Pub/Sub 모델은 Publish/Subscribe의 축약형이다. 이 모델에서는 Producer, Consumer를 각각 `Publisher`, `Subscriber`라고 명명한다. 또한, Topic을 단위로 카테고리를 구분한다.

뉴스나 블로그를 구독하여 한 곳에 받아 볼 수 있는 RSS시스템이 가장 간단한 Pub/Sub 시스템이다. 글 작성자(publisher)가 블로그(topic)에 글을 올리게 되면, 이 블로그(topic)를 구독하고 있는 구독자(subscriber)에게 메시지를 던져준다.

즉 Pub/Sub 모델은 특정 토픽에 Message가 오면 이 토픽을 구독하고 있는 모든 구독자에게 메시지를 전달해주고, 구독자는 이를 처리한다. 즉, Pub/Sub 모델은 메시지 큐 모델과는 달리 단일 처리를 보장해주지 못한다.

Pub/Sub 모델을 기반으로 만들어진 기술은 Apache Kafka, Google Cloud Pub/Sub 등이 있다.

---

### 제안
위에서 설명한 개념들을 코드로 구현해보고 싶은 독자들은, [RabbitMq Tutorial](https://www.rabbitmq.com/getstarted.html)를 도전해 보기 바란다.
다양한 언어로 제공하고 있어, 각자 익숙한 언어를 사용할 수 있다.

RabbitMq를 다운 받는 방식부터 설명되어 있고, 1.Hello World 파트는 Queue 자체를 사용해 보는 부분이라 쉽게 진행할 수 있을 것이다. 

2.Work queues, 3.Publish/Subscribe 는 각각 메시지 큐 모델, Pub/Sub 모델이며 이를 실제로 구현해 보면 이해를 도울 수 있을 것이다.

---

### 정리
지금까지 Message Oriented Middleware에 대해 알아봤다. 많은 메시지 전달 기술들은 그 기반 기술이 다르더라도, 메시지 큐 모델 방식과 Pub/Sub 방식을 모두 사용할 수 있다. 메시지 큐 모델과 Pub/Sub 모델의 개념이 어떻게 적용되고 사용되는지 공부하는 데 도움이 되었으면 한다.


### 참고 자료
- [What is message queuing?](https://www.cloudamqp.com/blog/what-is-message-queuing.html)
- [Comparing Publish-Subscribe Messaging and Message Queuing](https://dzone.com/articles/comparing-publish-subscribe-messaging-and-message)
- [Everything You Need to Know About Message Queues: A Complete Guide](https://medium.com/swlh/everything-you-need-to-know-about-message-queues-a-complete-guide-dbf190d001d7)
- [메시지 지향 미들웨어(Message-Oriented Middleware(MOM))](https://docs.oracle.com/cd/E19148-01/820-0532/6nc919fai/index.html)
