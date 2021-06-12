---
layout: post  
title: 'Servlet 과 ServletContainer'
author: [영이]
tags: ['http']
date: "2021-05-23T12:00:00.000Z"
draft: false
image: ../teaser/servlet
---

## Servlet

서블릿(Servlet)은 클라이언트 요청을 처리하고, 그 결과를 반환하는 웹 프로그래밍 기술이다. 클라이언트가 요청을 하면 그에 대한 결과를 다시 전송해주는 역할을 자바 프로그램이 하는 것이다. 이전의 웹 프로그램들은 클라이언트의 요청에 대한 응답으로 만들어진 페이지를 넘겨주었다.  웹 프로그래밍이 점점 발전하면서 응답을 가공하여 동적인 페이지를 작성할 수 있게 되었다. 동적인 페이지를 제공하기 위해서는 웹서버가 다른 곳에 도움을 요청하여 동적인 페이지를 작성하게된다.

서블릿을 사용하면 어떠한 이익들이 있는지 보자. 아래는 실제 http 요청(request)과 응답(response)이다.

<img width="525" alt="스크린샷 2021-05-29 오후 10 36 53" src="https://user-images.githubusercontent.com/63634505/120072398-ae008e00-c0ce-11eb-9526-4874c2ee75d8.png">

이것들을 개발자가 직접 해석하고 처리한다면 개발자들은 해야 할 일이 엄청나게 많을 것이다. 서블릿을 통하여 요청 메세지를 읽고 응답을 만들어주는 역할을 하며 개발자는 비즈니스 로직에만 집중하면 되도록 해준다.


## Servlet 예시

![image](https://user-images.githubusercontent.com/63634505/119252110-5d2bf980-bbe5-11eb-9347-4355ab23d59e.png)


- `urlPatterns("/hello")` 의 URL이 호출되면 서블릿 코드가 실행된다
- HTTP 요청 정보를 사용할 수 있는 HttpServletRequest
- HTTP 응답 정보를 사용할 수 있는 HttpServletResponse

![image](https://user-images.githubusercontent.com/63634505/119252128-76cd4100-bbe5-11eb-8ed5-3589ed62a43d.png)

## Servlet 동작 방식

- 사용자가 URL(ex. `localhost:8080/hello`)입력하면 HTTP Request가 Servlet Container로 전송
- 요청을 전송받은 Servlet Container 는 HttpRequest, HttpResponse 객체를 생성
- 사용자가 요청한 URL이 어느 서블릿에 대한 요청인지 찾는다. 여기서는 helloServlet을 찾게 된다.
- service 메서드를 호출한 후 클라이언트의 GET, POST 여부에 따라 doGet(), doPost()를 호출
- 동적페이지를 생성한 후 HttpServletResponse 객체에 응답을 보낸다.
- 응답 후 HttpServletRequest, HttpServletResponse 객체를 소멸한다.

## Servlet 생명주기

![image](https://user-images.githubusercontent.com/63634505/119252189-ce6bac80-bbe5-11eb-8dc8-c045bac89d90.png)


- 클라이언트 요청이 들어오면 컨테이너는 서블릿이 메모리에 있는지 확인한다. 메모리에 없다면 init() 메서드를 호출하여 적재
- 클라이언트 요청에 따라서  service() 메소드를 통해 요청에 대한 응답이 doGet(), doPost()로 분기. 이때 HttpServletRequest, HttpServletResponse 에 의해 request, response 객체가 제공된다.
- 컨테이너가 서블릿에 종료 요청을 하면 destroy() 메서드가 호출된다. 종료시 처리해야하는 작업은 destroy() 메서드를 오버라이딩하여 구현하면 된다.

## Servlet Container

서블릿 컨테이너는 스스로 동작하지 않는 서블릿을 관리해주는 컨테이너이다. 서블릿 컨테이너는 클라이언트의 요청을 받고 응답 할 수 있도록 웹 서버와 소켓으로 통신한다. 톰캣이 서블릿 컨테이너의 대표적인 예이다.

## Servlet Container 특징

- 톰캣처럼 서블릿을 지원하는 WAS를 서블릿 컨테이너라 한다.
- 서블릿 객체를 생성, 초기화, 호출, 종료하는 생명주기 관리
- 서블릿 객체는 싱글톤으로 관리
- 동시 요청을 위한 멀티 쓰레드 처리 지원

## Servlet Container의 역할

- **웹 서버와의 통신 지원**

  서블릿 컨테이너는 서블릿과 웹 서버가 통신할 수 있도록 해준다. 서블릿 컨테이너가 웹 서버와 통신하는 과정을 생략할 수 있도록 해주기 때문에 개발자는 비즈니스 로직에만 집중하면 된다.

- **서블릿 생명주기 관리**

  서블릿의 생성과 소멸을 관리한다. 서블릿을 로딩하여 인스턴스화하고 초기화 메서드를 호출한다. 요청이 들어오면 적절한 메서드를 호출한다. 서블릿의 역할이 끝난후 GC(Garbage Collection) 를 진행하여 소멸시킨다.

- **멀티쓰레드 지원 및 관리**

  서블릿 컨테이너는 요청마다 자바 쓰레드를 새롭게 생성한다. HTTP 서비스 메서드를 실행하고 나면 쓰레드는 죽게된다. 서버가 다중 쓰레드를 생성 및 운영해주니 쓰레드 안정성은 고려하지 않아도 된다.
