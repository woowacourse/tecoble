---
layout: post
title: "로그 전략을 통해 메시지를 남기자"
author: "오렌지"
comment: "true"
tags: ["spring", "spring-boot", "logback", "logger"]
toc: true
---

웹이나 앱 어플리케이션을 개발하다 보면 어플리케이션의 상태를 확인하기 위해 로그를 남긴다.

그럼 로그는 왜 남길까? 
보통 로그는 개발의 원활함을 위해, 에러 등을 확인하고 해결하기 위해, 보안의 의미로, 또는 마케팅 전략을 위해 남기기도 한다.
이런 장점들을 살려보기 위해 로그를 적용했던 이야기를 해 보려 한다.

## 로거 적용기


### 로그 전략 세우기
이번 우아한 테크코스에서 진행하는 웹 프로젝트에 로거를 적용해 보았다.

우선적으로 로거를 적용하기 전에 팀의 로그 전략을 세워야 한다.

> 로그 전략은 뭐지?

로그 전략은 쉽게 말하면 어떤 로그를 어떤 방식으로 남길지, 그리고 그 로그를 어떻게 얼마동안 관리할지 등의 전략이다.

오, 그러면 어떤 부분을 로그로 남기는 게 좋을까?

팀에서 서버단에서는 api 통신에 대한 로그, db 로그, 에러 로그를 남기기로 결정했다.
어플리케이션의 모든 상황을 로그로 남기면 로그 파일은 빠른 속도로 커질 것이고 디스크 용량의 문제를 야기할 수 있다. 
데이터가 변하고 저장되는 시점에 로그를 남기는 것이 중요하다고 판단했다.
요청받은 데이터를 처리하는 과정에서 에러가 나는 경우, api 통신에 대한 로그를 통해 에러의 원인을 쉽게 찾을 수 있기 때문이다. db 로그도 마찬가지이다. 에러 로그는 당연하다. 에러가 발생한 부분에 대한 기록이 있어야 그 에러를 해결할 수 있다.

그리고 로그 파일의 보관 주기, 파일의 최고 용량 등을 결정할 롤링 정책도 정했다. 팀의 상황에 따라 적절히 정해주면 좋을 것이다.



### Logback 사용하기

로그를 남기기 위해 가장 편리한 `System.out.println()`을 사용할 수도 있다. 그러나 이는 바람직하지 않다.
몇 줄 코드 추가하는 정도라 크게 신경쓰지 않을 수도 있으나, 사용자가 많은 웹 어플리케이션인 경우에 문제가 발생한다. System.out.println()은 I/O operation이기 때문에 synchronized가 붙어 있고, 어플리케이션은 **print가 완전히 끝날 때 까지 대기**한다. 이는 상당한 성능 저하를 발생시킬 수 있다.
또한, System.out.println()를 통한 로그는 개발시에만 사용되고 실 서비스 배포 후에는 사용되지 않는다. 실 서비스 이후에는 불필요한 코드가 되어버린다. 그런 이유로 로깅 프레임워크를 사용했다.

그 중, 자바 스프링 부트로 서버를 구현했기 때문에 로거로 **logback** 라이브러리를 사용했다. (스프링 부트는 기본적으로 **logback** 모듈을 제공)

로그백의 설정 파일은 src/main/resources/ 하단에 위치시킨다. 
스프링 부트의 경우 **logback-spring.xml**을 이용한다. logback.xml을 사용하게 되면 스프링 부트 설정 전에 로그백 설정이 먼저 되어 로그 제어가 어려워질 수 있다.

> 또는 property의 logging.config = classpath:logback-${spring.profiles.active}.xml을 통해 각 프로파일별로 logback 설정파일을 관리한다.
> 덧붙여, application.yml 의 설정만으로도 logger, 로그레벨 설정이 가능하다.

로그백의 설정파일은 크게 **appender**와 **logger**, **layout** 으로 나눌 수 있다. appender를 통해 로그를 어떻게 남길지에 대한 설정을 할 수 있고 logger를 통해 해당 로거가 사용될 패키지와 로그 레벨을 설정할 수 있다.
> 로그 레벨은 TRACE - DEBUG - INFO - WARN - ERROR 순이며, DEBUG로 로그 레벨을 설정할 경우 ERROR 부터 DEBUG 레벨의 로그가 모두 기록된다.

```xml
<appender name="Error" class="ch.qos.logback.core.rolling.RollingFileAppender">
   ...  
    <!-- 로그 파일이 저장될 경로 -->
    <file>${LOG_PATH}/${ERR_LOG_FILE_NAME}.log</file>
    <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
        <!-- 로그 출력의 형식 -->
        <pattern>${LOG_PATTERN}</pattern>
    </encoder>
    <!-- 롤링 정책 설정 -->
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <fileNamePattern>${LOG_PATH}/${ERR_LOG_FILE_NAME}.%d{yyyy-MM-dd}_%i.log</fileNamePattern>
        ...
        <!-- 로그 최대 저장 주기(일), 지나면 폐기된다. -->
        <maxHistory>30</maxHistory>
    </rollingPolicy>
</appender>
```
위 코드는 에러 로그만 따로 파일로 설정하도록 하는 코드이다.
**RollingFileAppender** 설정을 함으로써 여러 파일을 돌며 로그를 남길 수 있도록 했다.

RollingFileAppender는 여러가지 어펜더중 하나이며, LogBack은 로그를 남기기 위해 다양한 Appender를 지원한다. 아래의 문서에서 다른 어펜더들도 확인할 수 있다.
(다른 사항은 주석과 [공식 문서](http://logback.qos.ch/)를 참고하면 좋을 것이다.)
db 로그를 남기는 부분도 위와 비슷하다.

```xml
<!-- root레벨 -->
<root level="WARN">
    <appender-ref ref="CONSOLE"/>
    <appender-ref ref="FILE"/>
    <appender-ref ref="Error"/>
</root>
<logger name="org.hibernate.SQL" level="DEBUG" additivity="false">
    <appender-ref ref="DB"/>
</logger>
...
```
`<logger>`를 통해 appender를 참조하고 name속성을 사용해 해당 패키지의 로그 레벨을 설정할 수 있다.
위 코드를 보면 `<appender>` name 속성이 DB인 경우, 패키지는 "org.hibernate.SQL"로, 로그 레벨은 DEBUG 로 설정했다.
`<root>`는 최상위 패키지에 기본적으로 적용되는 설정이다. `logger name=""` 과 동일하다고 생각하면 된다.

로그백은 `logback-core`, `logback-access`, `logback-class` 세 가지 모듈로 나뉜다.
logback-core가 나머지 두 모듈의 토대이며, 앞서 언급했던 기능들은 logback-class 모듈의 기본 기능이다.

logback-access 모듈을 사용하면 HTTP 접근 로그를 남길 수 있기 때문에 `logback-access.xml` 파일을 만들어 api 통신에 관한 로그 설정을 했다. 파일 설정은 비슷하지만 다른 이슈가 생겼다.
컨트롤러의 메소드가 호출될 때마다 로그를 남기려고 하니, 통신 응답이 완료되면 HttpServletRequest, HttpServletResponse 두 객체를 소멸시켜 값을 읽어오지 못한다는 문제였다.
모든 컨트롤러를 대상으로 로그를 기록해야 하므로 Filter와 LogInterceptor를 구현하고 응답과 요청값을 캐싱했다. ([spring filter와 interceptor에 관한 작은 글](https://supawer0728.github.io/2018/04/04/spring-filter-interceptor/))

```java
//LogServletWrappingFilter class
@Override
protected void doFilterInternal(...) throws ServletException, IOException {
    ContentCachingRequestWrapper wrappingRequest = new ContentCachingRequestWrapper(request);
    ContentCachingResponseWrapper wrappingResponse = new ContentCachingResponseWrapper(response);
    ...
}

//LogInterceptor class
@Override
public void afterCompletion(
    HttpServletRequest request,
    HttpServletResponse response,
    ...
    ) throws Exception {
    ContentCachingRequestWrapper cachingRequest = (ContentCachingRequestWrapper)request;
    ContentCachingResponseWrapper cachingResponse = (ContentCachingResponseWrapper)response;
    ...
    log.warn("Params : {}", params);
    log.warn("RequestBody : {} / ResponseBody : {}",
            objectMapper.readTree(cachingRequest.getContentAsByteArray()),
            objectMapper.readTree(cachingResponse.getContentAsByteArray())
    );
}
```
간단히 설명하자면 filter를 통해 요청값과 응답값을 감싸주고 interceptor에서 로그를 남겼다.



이렇게 api 통신, db, 에러 로그를 남길 수 있게 되었다.
지금은 간단한 로그 전략과 logback 사용법에 대해서만 다루었지만 logback 말고도 log4j, log4j2 등 다양한 로거 라이브러리들이 있다. 
아직 부족한 부분이 많지만 로그를 사용해 보며 이점을 직접적으로 느껴보고, 앞으로도 더 보완해 나갈 예정이다.



#### 참고 링크
---
[logback 공식문서](http://logback.qos.ch/)
