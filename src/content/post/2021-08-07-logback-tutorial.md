---
layout: post
title: 'Logback 으로 쉽고 편리하게 로그 관리를 해볼까요? ⚙️'
author: [3기_와일더]
tags: ['log', 'logging', 'slf4j', 'logback']
date: '2021-08-07T12:00:00.000Z'
draft: false
image: ../teaser/logback-tutorial.jpg
source: https://mk0wpactivityloqwnms.kinstacdn.com/wp-content/uploads/2019/12/managing_activity_logs.jpg
---
Spring Boot 를 통해 프로젝트를 개발할 때, 로깅을 적용하려는 초심자분들을 위한 글입니다.


## 로깅을 하는 이유?

로깅이란 시스템이 동작할 때 시스템의 상태 및 동작 정보를 시간 경과에 따라 기록하는 것을 의미한다. 로깅을 통해 개발자는 개발 과정 혹은 개발 후에 발생할 수 있는 예상치 못한 애플리케이션의 문제를 진달할 수 있고, 다양한 정보를 수집할 수 있다. 사용자 로그의 경우 분석 데이터로 활용할 수 있다. 하지만 로깅을 하는 단계에서 적절한 수준의 로그 기록 기준을 잡지 못하면 방대한 양의 로그 파일이 생성되는 문제를 겪거나, 의미 있는 로그를 쌓지 못하는 경우가 발생할 수 있다. 결국 <b>효율적으로 로깅을 하는 방법을 이해하는 것</b>이 중요하다.



## 스프링에서 로깅을 하는 방법

초기의 스프링은 JCL(Jakarta Commons Logging)을 사용해서 로깅을 구현했다. 요즘에는 대표적으로 <b>Log4j</b> 와 <b>Logback</b> 으로 스프링 부트의 로그 구현체를 사용한다. Log4j는 가장 오래된 프레임워크이며 Apache 의 Java 기반 Logging Framework 다. xml, properties 파일로 로깅 환경을 구성하고, 콘솔 및 파일 출력의 형태로 로깅을 할 수 있게 도와준다. 로그 레벨의 경우는 6단계로 구성되어있다. Logback 은 log4j 이후에 출시된 Java 기반 Logging Framework 중 하나로 가장 널리 사용되고 있다. SLF4j 의 구현체이며 Spring Boot 환경이라면 별도의 dependency 추가 없이 기본적으로 포함되어 있다.



## Logging 구현체 선택하기

 JCL 을 사용하면 기본적인 인터페이스인 Log 와 Log 객체 생성을 담당하는 LogFactory 만 구현하면 언제든지 로깅 구현체 교체가 가능하니 선택은 자유롭다. 이번 시간에는 SLF4J 의 구현체 Logback 을 사용해서 로깅을 구현한다. SLF4J 는 JCL 의 가진 문제를 해결하기 위해 클래스 로더 대신에 컴파일 시점에서 구현체를 선택하도록 변경시키기 위해 도입된 것이다. Logback 은 log4j 에 비해 향상된 필터링 정책, 기능, 로그 레벨 변경 등에 대해 서버를 재시작할 필요 없이 자동 리로딩을 지원한다는 장점이 있다.



## 로그 찍어보기

우선 프로젝트를 생성하고 간단한 로그를 찍어보자.

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

@RestController
public class LogController {

    private final Logger logger = LoggerFactory.getLogger("LoggerController 의 로그");

    @GetMapping("/log")
    public void log() {
        logger.info("로깅 발생!");
    }
}
```

위의 클래스를 추가해준 뒤 SpringApplication 을 실행한다. 그리고 localhost:8080/log 에 접속한다.

그 뒤 콘솔에 찍힌 로그를 확인한다.

```java
[2021-08-07 18:03:03:7491][http-nio-8080-exec-1] INFO  LoggerController 의 로그 - 로깅 발생!
```

Info 레벨의 로그로 "LoggerController 의 로그 - 로깅 발생!" 이 콘솔에 출력되는 것을 확인할 수 있다. 그렇다면 이렇게 콘솔에 출력된 로그를 파일로 남기는 방법을 알아보자.



## 로그 레벨 관련

Logback 은 5단계의 로그 레벨을 가진다.<br> 심각도 수준은 Error > Warn > Info > Debug > Trace 이다.

- ⛔️ Error : 예상하지 못한 심각한 문제가 발생하는 경우, 즉시 조취를 취해야 할 수준의 레벨
- ⚠ ️Warn : 로직 상 유효성 확인, 예상 가능한 문제로 인한 예외 처리, 당장 서비스 운영에는 영향이 없지만 주의해야 할 부분 
- ✅ Info : 운영에 참고할만한 사항, 중요한 비즈니스 프로세스가 완료됨
- ⚙️ Debug : 개발 단계에서 사용하며, SQL 로깅을 할 수 있음
- 📝 Trace : 모든 레벨에 대한 로깅이 추적되므로 개발 단계에서 사용함

Debug 와 Trace 레벨은 많은 양의 로그가 쌓이므로 자칫 운영 단계에서 해당 레벨의 로깅을 할 경우 용량 감당이 안 될 수 있다. 그렇기 때문에 중요하지 않은 정보는 Debug 이하로 설정하고 로깅을 하지 않는 편이 좋다.

> Debug, Trace 레벨의 로깅은 개발 단계에서만 사용하고 배포 단계에서는 사용하지 말자

에러 레벨에 따라 로깅을 하게 되면 어떻게 처리되는지 살펴보자. 

```java
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LogController {

    @Autowired
    private LogService logService;

    @GetMapping("/log")
    public void log() {
        logService.log();
    }
}
```

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class LogService {

    private final Logger logger = LoggerFactory.getLogger(this.getClass().getSimpleName());

    public void log() {
        logger.trace("Trace");
        logger.debug("Debug");
        logger.info("Info");
        logger.warn("Warn");
        logger.error("Error");
    }
}
```

위에 나온 두 개의 클래스 파일을 생성하고 SpringApplication 을 실행한다. 그리고 localhost:8080/log 에 접속하고 콘솔에 출력된 내용을 살펴본다.

```java
[2021-08-07 18:19:09:17317][http-nio-8080-exec-1] INFO  LogService - Info
[2021-08-07 18:19:09:17317][http-nio-8080-exec-1] WARN  LogService - Warn
[2021-08-07 18:19:09:17317][http-nio-8080-exec-1] ERROR LogService - Error
```

이것을 통해 로그는 별다른 설정을 하지 않아도 기본 설정된 로그 레벨(INFO)에 맞춰 상위 로그로 출력되는 것을 확인할 수 있다.



## 로그 파일 작성하기

콘솔 로그의 수준을 변경하는 방법은 application.yml 과 logback-spring.xml 에서 설정하는 방법이 있다. application.yml 은 설정하는 난이도가 비교적 쉽지만, 실제 제품에 사용하기엔 한계가 있고 세부적인 설정이 불편하기 때문에 logback-spring.xml 로 관리하는 편이 더 좋다고 생각한다. 따라서 logback-spring.xml 로 로그를 기록해보자.

logback-spring.xml 은 콘솔, 파일, DB 등 로그를 출력하는 방법을 지정하는 appender 와 출력할 곳을 정하는 logger 로 나눌 수 있다. 아래 예시를 통해 간단하게 로그를 남기는 연습을 해보자.

경로는 `src/main/resources/logback-spring.xml`이다. 해당 예시문은 특정 클래스에서 발생한 특정 레벨의 예외를 기록하는 방법과 특정 라이브러리의 기능을 기록하는 방법에 대한 예시를 다룬다.

1. configuration 설정을 시작한다.

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <!-- 이 곳에 추가할 기능을 넣는다. -->
   </configuration>
   ```

   

2. `appender(어디에 출력할 지)`에서 콘솔에 출력되는 형식을 지정한다.

   ```xml
     <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
       <layout class="ch.qos.logback.classic.PatternLayout">
         <Pattern>[%d{yyyy-MM-dd HH:mm:ss}:%-3relative][%thread] %-5level %logger{36} - %msg%n</Pattern>
       </layout>
     </appender>
   ```

   `pattern` 에서 지정한 방식대로 시간과 레벨 등의 설정이 되고난 후 콘솔에 메세지를 출력한다. 해당 `append` 설정은 `STDOUT` 이라는 변수명으로 저장해뒀다고 생각하면 된다.

   

3. Info 레벨의 이름을 가진 로그를 저장할 방식을 지정한다.

   ```xml
     <appender name="INFO_LOG" class="ch.qos.logback.core.rolling.RollingFileAppender">
   
       <file>./logs/info.log</file> <!-- 파일을 저장할 경로를 정한다 -->
       <filter class="ch.qos.logback.classic.filter.LevelFilter">
         <level>INFO</level>
         <onMatch>ACCEPT</onMatch> <!-- 해당 레벨만 기록한다. -->
         <onMismatch>DENY</onMismatch> <!-- 다른 수준의 레벨은 기록하지 않는다.(상위 레벨도 기록 안함), 상위 수준의 레벨에 대한 기록을 원하면 ACCEPT 로 하면 기록된다. -->
       </filter> <!-- 레벨별 필터링이 필요없을 경우 filter class 관련된 부분을 삭제하면 됨-->
       <encoder>
         <pattern>[%d{yyyy-MM-dd HH:mm:ss}:%-3relative][%thread] %-5level %logger{35} - %msg%n</pattern> <!-- 해당 패턴 네이밍으로 현재 로그가 기록됨 -->
       </encoder>
       <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
         <fileNamePattern>./was-logs/info.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern> <!-- 해당 패턴 네이밍으로 이전 파일이 기록됨 -->
         <timeBasedFileNamingAndTriggeringPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
           <maxFileSize>100MB</maxFileSize> <!-- 한 파일의 최대 용량 -->
         </timeBasedFileNamingAndTriggeringPolicy>
         <maxHistory>180</maxHistory> <!-- 한 파일의 최대 저장 기한 -->
       </rollingPolicy>
     </appender>
   ```

   `INFO_LOG`라는 변수명에 여러 가지 설정을 한다. 우선 파일을 저장할 경로와 파일명을 지정한다. `INFO level` 의 에러만 기록한다. 기록한 로그를 `pattern` 에서 지정한 방식대로 인코딩한다. 인코딩한 로그기록을 앞서 지정한 파일명에 기록하는 것이다. 

   ```java
   // 이러한 형태로 인코딩 된다.
   [2021-08-07 20:03:12:3093][main] DEBUG org.hibernate.SQL - drop table if exists user CASCADE 
   ```

   파일의 크기가 `100MB` 혹은 `180일`이 넘을 경우 앞서 인코딩한 파일을 `fileNamePattern` 에 맞게 `.gz` 로 따로 저장한다는 설정이다.

   비슷한 방식으로 `WARN_LOG` 도 만들어준다.

   

4. Info 레벨의 로그를 콘솔에 출력한다.

   ```xml
     <root level="INFO">
       <appender-ref ref="STDOUT"/>
     </root>
   ```

   

5. 로거가 발생될 때, 설정해둔 대상을 파일에 기록한다.

   ```xml
     <logger name="LogController" additivity="false"> <!-- 콘솔에 출력된 LogController 에 대해서 아래 작업을 실행한다.-->
       <level value = "DEBUG" /> <!-- DEBUG 레벨 이상에서만 실행한다. -->
       <appender-ref ref="INFO_LOG" />
       <appender-ref ref="WARN_LOG" />
     </logger>
   ```

<b>LogController 라는 이름의 로거가 발생할 때 아래 조건을 실행</b>한다. Debug 이상의 레벨에 대해서 각각 `<appender-ref ref="INFO_LOG" />` 와 `<appender-ref ref="WARN_LOG" />` 의 변수에 할당해둔 명령이 실행된다.



6. 예외에 나온 내용 외에도 콘솔에 특정 단어를 감지해 처리할 수 있다.

   ```java
   [2021-08-07 20:03:15:5723][SpringApplicationShutdownHook] DEBUG org.hibernate.SQL - drop table if exists user CASCADE 
   ```

   다음과 같이 출력되는 콘솔 로그를 감지하려면 아래처럼 하면 로그를 쌓을 수 있게 되는 것이다.

   ```xml
     <logger name="org.hibernate.SQL" additivity="false">
       <level value = "DEBUG" />
       <appender-ref ref="DEBUG_LOG" />
     </logger>
   ```

   

7. 위에서 한 모든 작업을 한 파일로 만들면 다음과 같다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <property name="LOGS_ABSOLUTE_PATH" value="./logs"/>

  <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <layout class="ch.qos.logback.classic.PatternLayout">
      <Pattern>[%d{yyyy-MM-dd HH:mm:ss}:%-3relative][%thread] %-5level %logger{36} - %msg%n</Pattern>
    </layout>
  </appender>
  
  <appender name="INFO_LOG" class="ch.qos.logback.core.rolling.RollingFileAppender">

    <file>./logs/info.log</file>
    <filter class="ch.qos.logback.classic.filter.LevelFilter">
      <level>INFO</level>
      <onMatch>ACCEPT</onMatch>
      <onMismatch>DENY</onMismatch>
    </filter>
    <encoder>
      <pattern>[%d{yyyy-MM-dd HH:mm:ss}:%-3relative][%thread] %-5level %logger{35} - %msg%n</pattern>
    </encoder>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
      <fileNamePattern>./was-logs/info.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
      <timeBasedFileNamingAndTriggeringPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
        <maxFileSize>100MB</maxFileSize>
      </timeBasedFileNamingAndTriggeringPolicy>
      <maxHistory>180</maxHistory>
    </rollingPolicy>
  </appender>
  
 <appender name="WARN_LOG" class="ch.qos.logback.core.rolling.RollingFileAppender">

    <file>./logs/warn.log</file>
    <filter class="ch.qos.logback.classic.filter.LevelFilter">
      <level>WARN</level>
      <onMatch>ACCEPT</onMatch>
      <onMismatch>DENY</onMismatch>
    </filter>
    <encoder>
      <pattern>[%d{yyyy-MM-dd HH:mm:ss}:%-3relative][%thread] %-5level %logger{35} - %msg%n</pattern>
    </encoder>
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
      <fileNamePattern>./was-logs/warn.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
      <timeBasedFileNamingAndTriggeringPolicy class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
        <maxFileSize>100MB</maxFileSize>
      </timeBasedFileNamingAndTriggeringPolicy>
      <maxHistory>180</maxHistory>
    </rollingPolicy>
  </appender>
  
  <root level="INFO">
    <appender-ref ref="STDOUT"/>
  </root>

  <logger name="LogController" additivity="false">
    <level value = "DEBUG" />
    <appender-ref ref="INFO_LOG" />
    <appender-ref ref="WARN_LOG" />
  </logger>
  
  <logger name="org.hibernate.SQL" additivity="false">
    <level value = "DEBUG" />
    <appender-ref ref="INFO_LOG" />
  </logger>

</configuration>

```

이제 SpringApplication 을 실행 후 접속 등의 다양한 활동을 한 다음 지정해둔 경로(`./logs/`)에 생성된 로그 파일을 확인해 볼 수 있다.



## 결론

간단하게 Spring Boot 에서 logback 을 사용하여 로깅 하는 법을 알아봤다. 더 상세한 설명과 실습을 원한다면 이 [영상](https://www.youtube.com/watch?v=JqZzy7RyudI)을 보는 것을 추천한다. 실제 서비스에서는 FILE 이외에도 SockectAppender, LogStash 등도 함께 사용하기 때문에 로깅 입문이 끝났다면 나중에 더 학습해보면 도움될 것이다.

어떤 로깅 인터페이스를 사용하던 자유지만, 개발을 할 때 Logger 를 설정하고 시작하는 것은 반 필수가 아닌가? 항상 로깅을 생활화하는 습관을 지니면 좋겠다.



## 참고

- [Spring Boot - Logging, 20분 정리](https://www.sangkon.com/hands-on-springboot-logging/)
- [slf4j, log4j, logback, log4j2](https://minkwon4.tistory.com/161)
- [[10분 테코톡] ☂️ 검프의 Logging(로깅) #1](https://www.youtube.com/watch?v=1MD5xbwznlI)

