---
layout: post  
title: DispatcherServlet - Part 2
author: [3기_다니]
tags: ['spring', 'spring mvc', 'dispatcherservlet']
date: "2021-07-15T12:00:00.000Z"
draft: false
image: ../teaser/dispatcherservlet.png
---

지난 1편에서는 DispatcherServlet 정의, 설정 방법, 동작 흐름에 대해 알아봤다.
이번 2편에서는 DispatcherServlet의 동작 원리를 코드와 함께 살펴보자.<br/>

아직 1편을 읽지 않았다면, 아래 글을 먼저 읽고 오자.<br/>

> [DispatcherServlet - Part 1](https://woowacourse.github.io/tecoble/post/2021-06-25-dispatcherservlet-part-1/)

<br/>

## 동작 원리 with 코드

WAS에서 `HttpServletRequest`, `HttpServletResponse` 객체를 생성하여 DispatcherServlet에게 전달한다.
DispatcherServlet은 해당 객체들을 파라미터로 전달받고, 웹 요청에 따른 응답을 생성하기 위해 맨 처음으로 `doService()` 메소드를 호출한다.
그리고 해당 메소드 내부에서 이어 `doDispatch()` 메소드를 호출한다.<br/>

```java
@Override
protected void doService(HttpServletRequest request, HttpServletResponse response) throws Exception {
    logRequest(request);

    ...

    try {
        doDispatch(request, response);
    }

    ...
}
```

<br/>

doDispatch() 메소드에는 DispatcherServlet이 호출하는 모든 메소드가 담겨 있다. 이제부터 본격적으로 확인해보자.
먼저 웹 요청을 처리할 수 있는 Handler(Controller)를 찾기 위해 `getHandler()` 메소드를 호출한다.
이때, 해당 메소드의 반환 타입은 `HandlerExecutionChain`이다.<br/>

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    ...

    try {
        try {
                mappedHandler = getHandler(processedRequest);
        }
    }

    ...
}

@Nullable
protected HandlerExecutionChain getHandler(HttpServletRequest request) throws Exception {
    if (this.handlerMappings != null) {
        for (HandlerMapping mapping : this.handlerMappings) {
            HandlerExecutionChain handler = mapping.getHandler(request);
            if (handler != null) {
                return handler;
            }
        }
    }
    return null;
}
```

<br/>

찾은 Handler(Controller)를 실행하기 위해 해당 Handler 맞는 HandlerAdapter를 탐색해야 한다.
이를 위해 `getHandlerAdatper()` 메소드를 호출한다. 해당 메소드의 반환 타입은 `HandlerAdapter`이다.<br/>

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    ...

    try {
        try {  
            HandlerAdapter ha = getHandlerAdapter(mappedHandler.getHandler());
        }
    }

    ...
}

protected HandlerAdapter getHandlerAdapter(Object handler) throws ServletException {
    if (this.handlerAdapters != null) {
        for (HandlerAdapter adapter : this.handlerAdapters) {
            if (adapter.supports(handler)) {
                return adapter;
            }
        }
    }
    ...
}
```

<br/>

찾은 HandlerAdapter로 Handler의 메소드를 실행하기 앞서 Interceptor의 `applyPreHandle()` 메소드를 호출한다.
해당 메소드의 반환 타입은 boolean이다.
만약, 반환값이 `true`면 Interceptor를 통과하여 다음 단계로 진행된다.
반면, 반환값이 `false`면 Interceptor를 통과하지 못해 로직을 더이상 수행하지 않고 종료한다.<br/>

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    ...

    try {
        try {  
            if (!mappedHandler.applyPreHandle(processedRequest, response)) {
                return;
            }
        }
    }

    ...
}

boolean applyPreHandle(HttpServletRequest request, HttpServletResponse response) throws Exception {
    for (int i = 0; i < this.interceptorList.size(); i++) {
        HandlerInterceptor interceptor = this.interceptorList.get(i);
        if (!interceptor.preHandle(request, response, this.handler)) {
            triggerAfterCompletion(request, response, null);
            return false;
        }
        this.interceptorIndex = i;
    }
    return true;
}
```

<br/>

Interceptor를 통과하면, 앞서 찾은 HandlerAdapter를 이용하여 `handle()` 메소드로 Handler(Controller)의 메소드를 실행한다.
handle() 메소드의 반환 타입은 `ModelAndView`이다.
HandlerAdapter는 인터페이스로 정의되어 있어, 다양한 종류의 HandlerAdapter 구현체에서 해당 메소드를 구현한다.<br/>

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    ...

    try {
        try {
            mv = ha.handle(processedRequest, response, mappedHandler.getHandler());
    }

    ...
}

public interface HandlerAdapter {
    @Nullable
    ModelAndView handle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception;
}
```

<br/>

예를 들어, `HandlerFunctionAdapter, HttpRequestHandlerAdapter, SimpleServletHandlerAdapter`와 같은 구현체들이 존재한다.<br/>

<p align="center">
    <img width="1212" alt="handlerAdapterImplementationClasses" src="https://user-images.githubusercontent.com/50176238/125674059-85a8a308-2588-4b61-b5bf-386575c3652e.png">
</p>

<br/>

handle() 메소드를 수행하고 나면, Interceptor에서 `applyPostHandle()` 메소드를 호출한다.
이는 비즈니스 로직을 전부 수행하고 실행하는 메소드로, 반환 타입은 void이다.<br/>

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    ...

    try {
        try {  
            mappedHandler.applyPostHandle(processedRequest, response, mv);
        }
    }

    ...
}

void applyPostHandle(HttpServletRequest request, HttpServletResponse response, @Nullable ModelAndView mv)
        throws Exception {

    for (int i = this.interceptorList.size() - 1; i >= 0; i--) {
        HandlerInterceptor interceptor = this.interceptorList.get(i);
        interceptor.postHandle(request, response, this.handler, mv);
    }
}
```

<br/>

handle() 메소드를 실행하면, DispatcherServlet 뒤에 있는 비즈니스 로직을 수행하고 결과로 ModelAndView를 반환한다.
그리고 applyPostHandle() 메소드로 ModelAndView에 대해 후처리를 진행한다.<br/>

이때, 1편에도 언급했듯이 @Controller면 ModelAndView를 반환하고 @RestController면 객체를 반환한다.
따라서, @RestController의 경우 이후 View에 Model이 렌더링되는 과정은 생략하고 바로 그 다음 단계를 진행한다.<br/>

다음으로, `processDispatchResult()` 메소드에서 `render()` 메소드를 호출한다. 해당 메소드의 반환 타입은 void이다.
이 메소드 내부에서 `resolveViewName()` 메소드를 호출하여 View의 논리 이름을 물리 이름으로 변환한다.
마지막으로, View 객체의 `render()` 메소드를 호출하여 View에 Model 데이터를 렌더링한다.<br/>

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    ...

    try {
        processDispatchResult(processedRequest, response, mappedHandler, mv, dispatchException);
    }

    ...
}

private void processDispatchResult(
    HttpServletRequest request,
    HttpServletResponse response,
    @Nullable HandlerExecutionChain mappedHandler,
    @Nullable ModelAndView mv,
    @Nullable Exception exception) throws Exception {
    ...

    if (mv != null && !mv.wasCleared()) {
        render(mv, request, response);
        if (errorView) {
            WebUtils.clearErrorRequestAttributes(request);
        }
    }

    ...
}

protected void render(
    ModelAndView mv,
    HttpServletRequest request,
    HttpServletResponse response) throws Exception {
    ...

    View view;
    String viewName = mv.getViewName();
    if (viewName != null) {
        view = resolveViewName(viewName, mv.getModelInternal(), locale, request);
        ...
    }

    ...

    try {
        if (mv.getStatus() != null) {
            response.setStatus(mv.getStatus().value());
        }
        view.render(mv.getModelInternal(), request, response);
    }

    ...
}

@Nullable
protected View resolveViewName(String viewName, @Nullable Map<String, Object> model,
        Locale locale, HttpServletRequest request) throws Exception {

    if (this.viewResolvers != null) {
        for (ViewResolver viewResolver : this.viewResolvers) {
            View view = viewResolver.resolveViewName(viewName, locale);
            if (view != null) {
                return view;
            }
        }
    }
    return null;
}

public interface View {
    void render(
        @Nullable Map<String, ?> model,
        HttpServletRequest request,
        HttpServletResponse response) throws Exception;
}
```

<br/>

맨 마지막으로 Interceptor를 한번 더 실행한다. 이때, `triggerAfterCompletion()` 메소드를 호출하고 응답값이 반환되기 전에 마지막 후처리를 진행한다.
해당 메소드는 View에 Model를 렌더링한 이후, 즉 가장 마지막에 실행된다.<br/>

```java
protected void doDispatch(HttpServletRequest request, HttpServletResponse response) throws Exception {
    if (mappedHandler != null) {
        mappedHandler.triggerAfterCompletion(request, response, null);
    }
}

void triggerAfterCompletion(HttpServletRequest request, HttpServletResponse response, @Nullable Exception ex) {
    for (int i = this.interceptorIndex; i >= 0; i--) {
        HandlerInterceptor interceptor = this.interceptorList.get(i);
        try {
            interceptor.afterCompletion(request, response, this.handler, ex);
        }
        ...
    }
}
```

<br/>

## 정리

이렇게 doService()부터 triggerAfterCompletion() 메소드까지 진행되면 DispatcherServlet의 한 흐름이 끝난다.
물론, 매 웹 요청마다 모든 메소드를 수행하는 건 아니다. 상황에 따라 어떤 메소드가 호출돼도 실행되지 않을 수 있다.<br/>

전체적인 DispatcherServlet의 동작 원리를 그림으로 나타내면 아래와 같다.<br/>

<p align="center">
    <img src="https://user-images.githubusercontent.com/50176238/125677429-6cf0f780-3e75-4f05-a525-ffec0e190569.png">
</p>

> 이미지 출처: 직접 키노트로 만듦<br/>

<br/>

## Reference

- DispatcherServlet 내부 코드