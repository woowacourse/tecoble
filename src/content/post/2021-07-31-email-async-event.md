---
layout: post  
title: Email 보내기에 비동기, 이벤트를 곁들인. 
author: [3기_완태]
tags: ['email', 'async', 'event']
date: "2021-07-31T12:00:00.000Z"
draft: false 
image: ../teaser/email-async-event.png
---

서비스를 운영하는 데 Email 전송 기능을 도입하는 경우가 많다. 이메일 기능에 비동기와 이벤트 발행 방식을 도입하게 된 이유와 방법에 관해서 설명해 보고자 한다.
행
<!-- end -->

## Email 보내기

Spring에서 제공하는 `MailSender`, `JavaMailSender` 인터페이스를 이용하면 쉽게 메일 서비스를 구현할 수 있다. 단순 텍스트로 구성되면
MailSender로 충분하지만, Html Template을 활용하여 메일을 보내는 것을 목표로 두기 때문에 JavaMailSender를 사용한다. 또한, 별도의 메일 서비스를
사용하지 않고 Gmail 개인 계정을 사용하고 진행하였다. 이 부분을 다루고 있는 블로그가 많으므로 코드를 남겨두고 별도의 설명은 생략한다.

`implementation'org.springframework.boot:spring-boot-starter-mail'` 의존성 추가

```java
@Configuration
public class MailConfiguration {
    @Bean
    public JavaMailSender getJavaMailSender(){
        JavaMailSenderImpl mailSender=new JavaMailSenderImpl();
        
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort("587");
        mailSender.setUsername("email@gmail.com");
        mailSender.setPassword("password");
        
        Properties props=mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol","smtp");
        props.put("mail.smtp.auth","true");
        props.put("mail.smtp.starttls.enable","true");
        props.put("mail.debug","true");
        return mailSender;
  }
}
```

> email, password를 github 저장소에 올리기 부담될 때에는 [__private-submodule__](https://woowacourse.github.io/tecoble/post/2021-07-31-git-submodule/)을 사용해 보기를 추천한다.

`implementation'org.springframework.boot:spring-boot-starter-thymeleaf'` 의존성 추가

```java
@Service
public class MailService {
    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    //생성자 생략

    public void sendJobCancelMail(String email, String jobName) {
      Context context = new Context();
      context.setVariable("jobName", jobName);
      String subject = "[GPU-IS-MINE] Job 예약 취소 메일";
      String body = templateEngine.process("job-cancel.html", context);
      sendMail(email, subject, body);
    }

    private void sendMail(String to, String subject, String body) {
        MimeMessagePreparator messagePreparator = 
            mimeMessage -> {
            final MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("noreply@noreply.com");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
        };
        mailSender.send(messagePreparator);
    }
}
```

비교적 친숙했던 thymeleaf template 엔진을 사용했고, SpringTemlateEngine 은 TemplateEngine에 SpringEL의 문법을 추가한 부분이라
원하는 부분을 사용하면 된다. Thymeleaf는 spring-boot에서는 별도의 설정 없이 사용할 수 있다.

---

## Async 비동기의 도입

@EnableAsync, @Async 어노테이션을 사용하여 비동기 도입하기.

### 도입 배경

```java
@Service
public class JobService {
    @Transactional
    public void cancel(Long jobId) {
        Job job=findJobById(jobId);
        Member member=job.getMember();

        job.cancel();

        mailService.send(member.getEmail(),job.getJobName());
    }
}
```

현재 비동기가 아니기 때문에, 하나의 Thread에서 일련의 작업을 진행하고 있다. Client가 Job 취소 요청을 보내면, 취소 작업이 끝난 후 취소 메일이 전송되고 나서야 client는 완료되었다는 요청을 받을 수 있다.

우리의 서비스의 경우, job을 취소가 완료되는 것이 중요한 부분이었고, 메일의 도착 여부와 관계없이 job이 취소된 경우에는 OK 요청을 보내주어야 했다. 메일 전송 완료를 기다리기 위해 클라이언트가 응답을 늦게 받는 상황을 없애고 싶었고, 그러기 위해 비동기 처리를 도입하게 되었다.

### 설정 파일

```java
@Configuration
@EnableAsync
public class AsyncConfiguration implements AsyncConfigurer {

    private static Logger logger = LoggerFactory.getLogger(AsyncConfiguration.class);

    @Override
    @Bean(name = "mailExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(10);
        executor.setThreadNamePrefix("MailExecutor-");
        executor.initialize();
        return executor;
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
          logger.error("Exception handler for async method '" + method.toGenericString()
            + "' threw unexpected exception itself", ex);
    }
}
```

Java Spring에서는 `@EnableAsync` 옵션만 주어도, 비동기 처리를 사용할 수 있다. 이를 Customizing 하기 위해서 위처럼, AsyncConfigurer를 구현한 설정 파일을 만들어 줄 수도 있다. 별도 설정을 하지 않은 경우, CorePoolSize 는 1, MaxPoolSize, QueueCapacity는 `Integer.MAX_VALUE` 로 정의되어 있고, warning 레벨의 log를 출력하도록 설정이 되어 있다.

### 기존 코드에 적용

위에서의 설정 파일로 비동기 처리를 위한 쓰레드를 별도로 생성해줄 수 있다. 이 쓰레드를 특정 메소드에 적용하여 비동기 처리를 하기 위해서는 아래의 방식으로 메소드 위에 `@Async` 어노테이션을 붙여주면 된다. 클래스에 어노테이션을 붙여줄 시에는 해당 클래스의 전체 메소드에 사용이 된다. 괄호 안에 별도로 명시해주면, 특정 쓰레드를 지정해줄 수도 있다.

```java
@Service
public class MailService {
    @Async("mailExecutor")
    public void sendJobCancelMail(String email,String jobName) {
        Context context = new Context();
        context.setVariable("jobName", jobName);
        String subject = "[GPU-IS-MINE] Job 예약 취소 메일";
        String body = templateEngine.process("job-cancel.html", context);
        sendMail(email, subject, body);
    }
}
```

> __테스트 시 주의사항__ 
> 
> 테스트 또한 하나의 쓰레드의 작업이 진행되고, 그 쓰레드의 작업이 완료되면, 테스트는 성공한 것으로 표시된다. 즉, 비동기 처리되어 별도의 쓰레드로 처리되는 부분에 대해서는 기존의 방식으로는 테스트를 진행하는 것은 불가하다. 이 부분에 대해서 저자도 공부를 진행해볼 예정이다.

---

## 이벤트를 발행하다.

`ApplicationEventPublisher`, `EventListener`을 이용하여 이벤트 발행과 처리 로직을 분리하다.

### 도입 배경

우리 서비스는 Job의 `예약`, `취소`, `시작`, `종료`의 모든 경우에 대해서 메일을 보내주는 기능이 있다. 만약, 메일뿐만 아니라 애플리케이션의 알람을 보내주는 로직이 추가된다고 가정해보자. 각각의 메소드에 일일이 추가되는 로직을 추가해줘야 하고, 도메인 로직에 집중하지 못하는 코드가 된다. 이벤트를 발행하는 방법을 통해 JobService와 MailService의 의존성을 끊어줄 수 있고 확장 가능한 구조가 될 수 있다.

```java
@Service
public class JobService {
    @Transactional
    public void cancel(Long jobId) {
        Job job = findJobById(jobId);
        Member member = job.getMember();

        job.cancel();

        mailService.send(member.getEmail(), job.getJobName());
        notificationService.send(member.getPhoneId(), job.getJobName());
        smsService.send(member.getPhoneNumber(), job.getJobName());
        //...
    }
}
```

### 구현 방법

`ApplicationEventPublisherAware`의 구현체는 publishEvent 메소드를 통해 이벤트를 발행할 수 있다.

```java
@Service
public class JobService implements ApplicationEventPublisherAware {

    private ApplicationEventPublisher eventPublisher;

    @Transactional
    public void cancel(Long jobId) {
        Job job = findJobById(jobId);
        Member member = job.getMember();

        job.cancel();
        eventPublisher.publishEvent(JobCanceledEvent(this, member, job.getName()));
    }

    @Override
    public void setApplicationEventPublisher(ApplicationEventPublisher applicationEventPublisher) {
        this.eventPublisher = applicationEventPublisher;
    }
}
```

`EventListener`는 어노테이션을 통해서 구현이 가능한데, `TransactionalEventListener`를 활용하면, `TransactionaPhase`에 따른 Event를 듣는 시점을 선택할 수 있다. 우리 서비스는 AFTER_COMMIT(DB에 반영된 후)에 Event를 듣도록 설정이 되어 있다. JobEvent의 상속구조를 통해 여러 가지 상황(예약, 취소, 시작, 종료)을 하나의 메소드로 처리할 수 있다.

```java
@Component
public class JobEventListener {
  // 생략
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, classes = JobEvent.class)
    public void handle(JobEvent event) {
        Member member = event.getMember();
        String jobName = event.getJobName();

        mailService.sendEmail(member.getEmail, jobName, event.getEventType());
        notificationService.send(member.getPhoneId(), jobName, event.getEventType());
        smsService.sendSms(member.getPhoneNumber(), jobName, event.getEventType());
    }
}
```

---

## 정리

지금까지 Email에 비동기와 이벤트 발행을 적용해 보았다. AOP를 활용하게 되면, publishEvent의 메소드 없이 어노테이션만으로도 동일한 작업을 할 수 있다고 한다.
이 부분에 대해 더 공부해보고 싶은 분은 이 [블로그](https://supawer0728.github.io/2018/03/24/spring-event)를 추천한다. AOP를 활용하면 도메인에만 더욱 더 집중할 수 있는 그런 코드가 될 수 있을 것으로 생각한다.

---

### 참고 자료
- [Java Doc - EnableAsync](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/annotation/EnableAsync.html)
- [Java Doc - Async](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/scheduling/annotation/Async.html)
- [Java Doc - ApplicationEventPublisher](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/ApplicationEventPublisher.html)
- [06. 스프링 부트 (Spring Boot) - 자바 메일 센더 (Java Mail Sender)](https://theheydaze.tistory.com/255)
- [Spring Event + Async + AOP 적용해보기](https://supawer0728.github.io/2018/03/24/spring-event)
