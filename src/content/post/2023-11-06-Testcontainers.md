---
layout: post
title: '로컬에서도 프로덕션과 유사한 환경에서 테스트할 수 없을까? : Testcontainers 도입기'
author: [5기_리오]
tags: ['Test', 'Testcontainers']
date: '2023-11-06T12:00:00.000Z'
draft: false
image: ../teaser/testcontainers.png
---
우아한테크코스 레벨3과 레벨4 동안 프로젝트를 진행하면서, 로컬 테스트 환경과 실제 운영 환경이 다른 기술적 어려움을 겪었습니다.  
해당 어려움으로 비롯된 문제 상황과 단계적 해결 방안, 그리고 최종 해결 방안으로 도입한 `Testcontainers`에 대한 소개와 사용법을 공유하려 합니다.

<br>

### 문제 상황 : 로컬에서는 H2, 프로덕션에서는 MySQL  

Spring Boot를 사용하여 프로젝트를 진행했습니다. 로컬 테스트 시에는 Spring Boot에 embedded 되어있는 H2를 사용했습니다. 개발 서버와 운영 서버에서는 MySQL을 사용했습니다. 그리고, Flyway를 통해 DB Schema 관리를 했습니다.

개발을 진행하며, 사용자분들의 니즈에 맞춰 프로젝트의 요구사항들이 추가되었습니다. 또, 리팩터링을 하며 패키지를 컨텍스트별로 분리했습니다.  
이러한 과정 중에 외래키와 unique 제약조건을 해제하거나 칼럼을 변경해야 하는 상황이 있었습니다.    
 이 때 H2와 MySQL의 문법이 달라서, MySQL 문법으로 작성되어있는 Flyway용 migration File 내의 sql문을 H2에서 사용하지 못했습니다. 그래서 **H2를 사용하는 로컬 profile로는 빌드가 불가능**한 문제가 있었습니다.

>⚠️ Wix에서 만든 embedded MySQL 오픈소스를 사용하면 간단하게 의존성을 추가함으로써 테스트 시에 경량화된 MySQL을 사용할 수 있지만,
>
>1. 벤더가 변경될 시 해당 데이터베이스의 embedded 라이브러리가 없다면 같은 문제가 발생
>2. embedded MySQL을 사용하기 위해 추가적인 소스코드 생성 필요
>3. Window 환경에서 MySQL 8.0 이상을 지원하지 않음
>4. 추후에 이야기 할, 다른 리소스(AWS S3)에 대한 의존성도 해결하고 싶었음
>
>위와 같은 문제로 해당 방법으로는 문제를 해결하지 않았습니다.

<br>

### 1차 해결 방안 : 로컬에서 Flyway를 사용하지 않는 방법  

우선 팀에서 도출한 해결방안은 '**Flyway를 로컬에서 사용하지 말자!**'였습니다.
처음에 저는 아래와 같은 이유로 반대했습니다.
1. Flyway의 migration File이 제대로 작동하는지 로컬에서 확인할 수 없다.
2. 도메인에 변경이 있을 때마다 테스트를 위한 스키마를 다시모 수정해야한다. 

그러나 다른 할 일들이 많이 남았는데도 서비스 배포까지 시간이 얼마 남지 않았고(~~하루 전이었던 건 안 비밀...~~), 해당 방법이 가장 간단하므로 적용하자는 의견에 동의하였습니다.  
무사히 배포를 했지만, 추후 개발을 진행하며 우려했던 상황이 발생했습니다.
매번 테이블의 변경 사항이 있을 때마다 Flyway의 migration file에 ddl도 작성하고, 로컬 테스트 용 스키마도 매번 수정하는 공수가 추가로 들어서 더욱더 개발 리소스가 많이 들었습니다. 그리고 가장 큰 문제는 배포하기 전까지 Flyway가 제대로 작동하는지 알 수 없다는 점이었습니다.

<br>

### 2차 해결 방안 : 벤더 별로 Flyway Migration File 각각 작성  

Flyway를 H2와 MySQL에 동시에 사용할 수 있는 방법을 구글링하고 공식 문서를 읽어본 결과, **각 벤더사 별로 패키지를 따로 두면** 각각에 맞는 패키지에서 migration file을 읽는다는 것을 알게 됐습니다. 그래서 H2용과 MySQL용 패키지를 따로 두는 방법으로 해결했습니다.  
이제 배포를 하기 전에 Flyway가 제대로 작동하는지를 H2 한정으로는 확인할 수 있게 됐습니다. 다만 아직도 H2가 아닌 MySQL 환경에서 Flyway가 제대로 작동하는지는 확신할 수 없다는 점, 그리고 ddl을 두 가지 버전으로 짜기 때문에 공수가 든다는 점이 문제로 남아있었습니다.

<br>

### 3차 해결 방안 : Docker를 띄워볼까?  

~~ddl을 매번 두 개씩 짜다가 지친~~ 팀에서 더 좋은 방법을 협의하게 되었고, docker등을 사용하여 **컨테이너로 MySQL 환경을 로컬에 구축**하자고 의견을 냈습니다. 해당 방법은 실제 운영환경과 유사한 환경에서 테스트를 진행할 수 있게 되는 장점이 있습니다. 그러나 저를 비롯한 팀원들이 docker를 거의 사용해보지 않아서, 데모데이가 얼마 남지 않은 상황에서 학습 비용을 고려해야 한다는 의견이 있었습니다.

<br>

### 최종 해결 방안 : Testcontainers를 사용하자  

팀원들의 학습 비용도 줄이고(혹은 아예 없애고), 운영환경과 유사한 환경에서 테스트를 진행할 수 있는 방법을 찾기 위해 3~4일여간 구글링을 열심히 했습니다. 또, 다른 팀들의 코드와 블로그도 많이 찾아봤습니다. 그 결과, **Testcontainers**라는 새로운 기술을 찾아냈습니다.

공식문서와 StackOverFlow를 열심히 뒤지며 사용법을 알아냈습니다. 설정 파일에서 단 두 줄, 혹은 테스트에서 클래스 하나 정도만 추가하면 (docker가 실행되고 있다는 가정하에) **자동으로 컨테이너를 띄워주면서** 테스트를 실행할 수 있었습니다. 해당 기술을 사용해서 팀원들의 학습 비용도 줄이고 더욱 실제 운영환경과 유사한 환경에서 테스트를 진행할 수 있게 되었습니다.   
이제 그 혁신적인 라이브러리인 `Testcontainers`를 소개하겠습니다.

<br>

---
<br>

# Testcontainers

![](https://i.imgur.com/TawF6JD.png)

Testcontainers의 공식 사이트에서는 다음과 같이 소개하고 있습니다.

> Testcontainers is a library that provides easy and lightweight APIs for bootstrapping local development and test dependencies with real services wrapped in Docker containers. Using Testcontainers, you can write tests that depend on the same services you use in production without mocks or in-memory services.

즉, 도커 컨테이너로 래핑된 실제 서비스를 제공해서, 로컬 테스트 시에도 mocking이나 in-memory 서비스들을 사용하지 않고 운영환경에서 사용하는 실제 서비스에 종속되는 테스트를 작성할 수 있게 해주는 오픈 소스 라이브러리입니다.

<br>

## Testcontainers의 장점

~~프로젝트의 아키텍쳐는 매우 간단해서~~, Testcontainers의 사용 효과를 극적으로 설명하기 위해 공식 사이트에서 소개하는 예시를 가져와봤습니다.

![](https://i.imgur.com/JdtwWLL.png)

위의 도식에서 볼 수 있듯이, 현재 `My Service`는 데이터베이스, 다른 서비스, 이벤트/메세지 브로커, AWS S3 같은 다른 클라우드 서비스에 의존성을 가지고 있습니다. 여기서 **다음과 같은 문제**들이 발생합니다.

1. 테스트를 실행하기 전에 인프라가 가동 중이고, 원하는 상태로 미리 구성되어 있는지 확인해야합니다.
2. 데이터베이스, 이벤트/메세지 브로커 등 여러 사용자 또는 CI 파이프라인에 걸쳐 공유되는 리소스의 경우, 데이터와 구성의 변경 가능성으로 인해 테스트 시 멱등성을 보장할 수 없습니다.

>⚠️ 멱등성이란?  
> 연산을 여러 번 적용하더라도 결과가 바뀌지 않는 성질을 말합니다.

<br>

그래서 그동안 프로젝트에서도 아래와 같이 해당 리소스들을 mocking하는 방법으로 테스트를 작성했었습니다.

```java
class FileUploaderTest {  
  
    @Mock  
    private FilePath filePath;  
      
    @Mock  
    private FileUrlMaker fileUrlMaker;  
      
    @InjectMocks  
    private FileUploader fileUploader;  
      
    @Test  
    void 파일의_URL을_반환한다() {  
        // given  
        UUID randomUUID = UUID.randomUUID();  
        String baseUrl = "https://example.com/files/";  
        String expectedFileUrl = baseUrl + randomUUID + ".jpg";  
        MultipartFile multipartFile = mock(MultipartFile.class);  
        given(multipartFile.getContentType()).willReturn(IMAGE.contentType());  
        given(fileUrlMaker.make(any())).willReturn(expectedFileUrl);  
          
        // when  
        String url = fileUploader.upload(multipartFile);  
          
        // then  
        assertThat(url).isEqualTo(expectedFileUrl);  
    }
}
```

프로젝트 내에서 생성된 파일이 저장소에 업로드 된 후 그 주소를 반환하는 기능에 대한 테스트입니다. 기존에는 서버에 저장을 하다가 AWS S3로 변경이 되었는데, 이 경우 모두 로컬에서 테스트할 적절한 방법이 없어서 위와 같이 관련 클래스들을 전부 mocking할 수 밖에 없었습니다.

<br>

![](https://i.imgur.com/6gN7hWR.png)

그러나 위처럼 Testcontainers를 사용하면, 서비스가 의존하는 리소스들을 컨테이너로 래핑하여 제공해줍니다. 이렇게 되면 위에서 이야기했던 실제 리소스에 의존하여 테스트시 정확성이 보장되지 않는 문제들을 해결할 수 있고, 반복적인 테스트가 가능해집니다.

<br>

여기까지 읽다보면 한 가지 의문이 들 수도 있습니다.   
>그냥 Docker나 Docker Compose 쓰면 안 되나?

물론 Docker와 Testcontainers 모두 컨테이너를 사용하여 리소스를 래핑하는 것은 동일합니다. 그러나 Testcontainers를 사용하면 컨테이너의 설정과 사용이 혁신적으로 편리해집니다.

이를 설명하기 위해 위에서 언급한 장점들을 포함하여, **Testcontainers를 사용하여 얻는 장점들**을 아래에 정리해보겠습니다.

#### 1. 격리된 인프라 제공  
   통합 테스트 시에 사용될 인프라 리소스들을 미리 준비하지 않아도 됩니다. Testcontainers를 사용하면 테스트를 실행하기 전에 자동으로 해당 리소스들을 제공합니다. 각 파이프라인이 격리된 서비스 집합으로 실행되므로 여러 빌드 파이프라인이 병렬로 실행되는 경우에도 테스트 데이터 오염이 발생하지 않습니다.
#### 2. 로컬 및 CI 환경 모두에서 일관된 테스트  
   IDE에서 바로 통합 테스트를 실행할 수 있어서, 변경 사항을 push하고 CI 파이프라인이 완료될 때까지 기다릴 필요가 없습니다.
#### 3. 대기 전략을 사용한 안정적인 테스트 설정  
   테스트를 실행하기 전에 컨테이너를 초기화해야합니다. Testcontainers를 사용하면 컨테이너와 그 안에 있는 어플리케이션이 완전히 초기화되었는지 확인하는 몇 가지 대기 전략을 제공합니다. 또, 모듈을 사용하여 해당 전략들을 직접 구현하거나 복합 전략을 생성할 수도 있습니다.
#### 4. 고급 네트워킹 기능  
   Testcontainers를 사용하면 컨테이너의 포트를 사용 가능한 임의의 포트에 매핑하여 테스트가 해당 서비스에 안정적으로 연결되도록 해줍니다. 심지어 네트워크를 생성하고 여러 컨테이너를 함께 연결하여 각 컨테이너가 서로 통신하도록 할 수도 있습니다.
#### 5. 자동 초기화  
   테스트 실행이 완료된 후, 생성된 모든 리소스(컨테이너, 볼륨, 네트워크 등)를 `Ryuk Sidecar 컨테이너`를 사용하여 자동으로 제거합니다. 필요한 컨테이너를 시작하는 동안 생성된 리소스에 일련의 라벨을 붙이고, Ryuk은 해당 라벨을 매칭하여 자동으로 리소스 정리를 수행해줍니다. 그래서 테스트가 비정상적으로 종료되더라도 안정적으로 작동합니다.

즉, Docker와 Docker Compose를 사용하여 직접 명령어를 사용하거나 서비스 종속성을 초기화하는 등의 행위를 하려면 Docker에 대한 내부 지식과 컨테이너에서 특정 기술을 실행하는 방법에 대한 지식이 필요합니다. 이러한 부분에 대한 지식이 없다면, 포트가 충돌하거나 테스트 시작 시에 컨테이너가 초기화되지 않는 문제, 또는 상호작용할 준비가 되지 않는 등의 문제가 발생할 수 있습니다.   
Testcontainers를 사용하면 **내부에서 이러한 설정을 전부 지원**해주므로 개발자는 API를 통해 이러한 지식 없이도 컨테이너 기반의 테스트를 사용할 수 있게 됩니다.

![](https://i.imgur.com/Atw4AD9.jpg)
Testcontainers가 지원하는 DB 및 인프라 리소스들 목록입니다. 웬만한 건 다 있네요!

Docker나 Docker Compose에 대한 학습 비용을 절감하면서도 컨테이너 기반 테스트를 사용할 수 있는 점이 저희 팀의 문제를 깔끔하게 해결하기 때문에 Testcontainers를 사용하기로 했습니다.   
또, 프로젝트가 커져가면서 인프라 리소스가 추가될 가능성이 매우 높았기 때문에 해당 리소스에 대한 테스트를 위해서도 Testcontainers를 사용하기로 했습니다.

---

## Testcontainers 사용법

MySQL 컨테이너를 띄우는 방법을 예시로 사용법을 설명하겠습니다.
다른 리소스(Kafka 등)에 대한 사용법은 참고 자료에 잇는 공식 문서에 자세하게 설명이 되어있습니다. MySQL 컨테이너를 띄우는 방법과 매우 유사하므로, 어렵지 않게 사용하실 수 있습니다.

우선, 의존성을 추가해줍니다.

```
testImplementation "org.testcontainers:testcontainers:1.19.1"  
testImplementation 'org.testcontainers:junit-jupiter:1.19.1'  
testImplementation 'org.testcontainers:mysql'
```
JUnit과 MySQL에 대한 모듈 의존성도 추가해줍니다. (이유는 to be continue...)

<br>

### 기본적인 사용 방법  

기존에 존재하는 테스트에 대해서 MySQL 컨테이너를 띄워서 실행해보겠습니다.
우선, 기존의 테스트 코드입니다.

```java
@ServiceTest  
class MenuGroupServiceTest {  
  
    @Autowired  
    private MenuGroupRepository menuGroupRepository;  
      
    @Autowired  
    private MenuGroupService menuGroupService;  
      
    @Test  
    void 메뉴_그룹을_등록한다() {  
        // ...
    }  
      
    @Test  
    void 메뉴_그룹들을_조회한다() {  
        // ...  
    }  
}

@SuppressWarnings("NonAsciiCharacters")  
@DisplayNameGeneration(DisplayNameGenerator.ReplaceUnderscores.class)  
@Target(ElementType.TYPE)  
@Retention(RetentionPolicy.RUNTIME)  
@SpringBootTest  
@Transactional  
public @interface ServiceTest {  
}
```
테스트를 실행하면, H2에서 해당 테스트를 진행하고 있음을 확인할 수 있습니다.

![](https://i.imgur.com/k4qtysf.png)

이제, MySQL 컨테이너를 띄우고 해당 컨테이너에서 테스트가 진행되도록 하겠습니다.  
세 가지 방법이 존재하고, 세 방법 모두 "아주".repeat(Integer.MAX_VALUE) 간단합니다.

<br>

#### 첫 번째 방법 : 컨테이너에 대한 인스턴스 생성  
<br>
테스트 클래스 내에서 `Testcontainers` 모듈이 제공하는 MySQLContainer 인스턴스를 생성합니다.  
그 후, @BeforeEach, @AfterEach 등을 활용해서 해당 컨테이너에 대한 조작을 합니다.

```java
@ServiceTest  
class MenuGroupServiceTest {  

    @Autowired  
    private MenuGroupRepository menuGroupRepository;  
      
    @Autowired  
    private MenuGroupService menuGroupService;  
  
    private MySQLContainer mySQLContainer = new MySQLContainer("mysql:8");  
    
    @BeforeEach  
    void setUp() {  
        mySQLContainer.start();  
    }  
      
    @AfterEach  
    void tearDown() {  
        mySQLContainer.stop();  
    }
      
    @Test  
    void 메뉴_그룹을_등록한다() {  
        // ...
    }  
      
    @Test  
    void 메뉴_그룹들을_조회한다() {  
        // ...  
    }  
}
```
원래 Testcontainers 모듈에는 Container라는 인터페이스와 구현체인 GenericContainer가 존재합니다. MySQL에 대한 의존성을 위에서 추가해줬기 때문에 (~~복선 ㄷㄷ~~) GenericContainer를 상속받은 MySQLContainer를 사용할 수 있게 되었고, 이를 통해 추가적인 설정없이 바로 MySQL 컨테이너를 띄울 수 있게 되었습니다.

![](https://i.imgur.com/vHO4z6H.png)

![](https://i.imgur.com/KxxHqFc.png)
![](https://i.imgur.com/JkbeWaZ.png)
![](https://i.imgur.com/DYZ4N2J.png)

이제 테스트를 실행해보면, MySQL 컨테이너가 띄워지는 것을 확인할 수 있습니다.
(만약 Driver를 찾지 못하는 예외가 발생한다면 MySQL에 대한 의존성을 추가해주세요!)
```
implementation 'com.mysql:mysql-connector-j'
```

![](https://i.imgur.com/BrRsAzK.gif)
gif 파일입니다! 컨테이너가 올라가고 내려가는 시간이 오래 걸려서 편집을 했습니다.

![](https://i.imgur.com/CijiL8B.png)
![](https://i.imgur.com/XSfP5MZ.png)
![](https://i.imgur.com/miuibAl.png)
글자가 너무 작아서, 아래에 설명을 적었습니다!  

보시듯이, `RYUK Sidecar 컨테이너`가 먼저 띄워지고, 첫번째 테스트에 대한 컨테이너가 띄워집니다. (Testcontainers의 장점에서 설명했습니다!)  
첫번째 테스트가 종료된 후, `RYUK Sidecar 컨테이너`는 그대로 있고 그 다음 테스트에 대한 컨테이너가 띄워지는 것을 볼 수 있습니다. (눈썰미가 좋으시다면, 위의 이미지의 스크롤 크기를 통해 첫번째 테스트 시에만 Ryuk 컨테이너가 실행됐음을 확인하실 수 있습니다. 저는 몰랐습니다.)

<br>

#### 두 번째 방법 : JUnit5의 @ExtendWith 사용  
<br>
JUnit5의 @ExtendWith을 통해서, 테스트 인스턴스의 생명주기를 Intercept하는 Extension을 사용하는 방법도 있습니다. 설명은 거창하지만, 어노테이션 두 개만 추가하면 됩니다.

```java
@Testcontainers
@ServiceTest  
class MenuGroupServiceTest {  

    @Autowired  
    private MenuGroupRepository menuGroupRepository;  
      
    @Autowired  
    private MenuGroupService menuGroupService;  
  
    @Container
    private MySQLContainer mySQLContainer = new MySQLContainer("mysql:8");    
    
    @Test  
    void 메뉴_그룹을_등록한다() {  
        // ...
    }  
      
    @Test  
    void 메뉴_그룹들을_조회한다() {  
        // ...  
    }  
}
```
@Testcontainers와 @Container 모두 위에서 추가해준 Testcontainers JUnit 모듈에서 제공하는 기능입니다. (~~복선222 ㄷㄷ~~)

어떻게 어노테이션 두 개만 달면 자동으로 컨테이너가 올라갈까요?  
이제, @Testcontainers에 대해 살펴보겠습니다.
```java
@Target(ElementType.TYPE)  
@Retention(RetentionPolicy.RUNTIME)  
@ExtendWith(TestcontainersExtension.class)  
@Inherited  
public @interface Testcontainers {  
    /**  
    * Whether tests should be disabled (rather than failing) when Docker is not available. Defaults to  
    * {@code false}.  
    * @return if the tests should be disabled when Docker is not available  
    */  
    boolean disabledWithoutDocker() default false;  
      
    /**  
    * Whether containers should start in parallel. Defaults to {@code false}.  
    * @return if the containers should start in parallel  
    */  
    boolean parallel() default false;  
}

```

@ExtendWith(TestcontainersExtension.class)가 있는 것을 보니, `TestcontainersExtension`이라는 Extension이 테스트 인스턴스의 Life-Cycle을 intercept하는 것을 짐작할 수 있습니다.

```java
public class TestcontainersExtension  
implements BeforeEachCallback, BeforeAllCallback, AfterEachCallback, AfterAllCallback, ExecutionCondition {  

	// ...
	
    @Override  
    public void beforeAll(ExtensionContext context) {  
      
        // ...  
        
        List<StoreAdapter> sharedContainersStoreAdapters = findSharedContainers(testClass);  
          
        // ...
    }  
      
    @Override  
    public void afterAll(ExtensionContext context) {  
        // ...
    }  
      
    @Override  
    public void beforeEach(final ExtensionContext context) {  
    
        // ... 
      
        List<StoreAdapter> restartContainers = collectParentTestInstances(context)  
            .parallelStream()  
            .flatMap(this::findRestartContainers)  
            .collect(Collectors.toList());  
  
        // ...
    
    }  
      
    @Override  
    public void afterEach(ExtensionContext context) {  
        // ...
    }  
      
    private List<StoreAdapter> findSharedContainers(Class<?> testClass) {  
        return ReflectionSupport  
            .findFields(testClass, isSharedContainer(), HierarchyTraversalMode.TOP_DOWN)  
            .stream()  
            .map(f -> getContainerInstance(null, f))  
            .collect(Collectors.toList());  
    }  
      
    private Predicate<Field> isSharedContainer() {  
        return isContainer().and(ModifierSupport::isStatic);  
    }  
      
    private Stream<StoreAdapter> findRestartContainers(Object testInstance) {  
        return ReflectionSupport  
            .findFields(testInstance.getClass(), isRestartContainer(), HierarchyTraversalMode.TOP_DOWN)  
            .stream()  
            .map(f -> getContainerInstance(testInstance, f));  
    }  
      
    private Predicate<Field> isRestartContainer() {  
        return isContainer().and(ModifierSupport::isNotStatic);  
    }  
      
    private static Predicate<Field> isContainer() {  
        return field -> {  
            boolean isAnnotatedWithContainer = AnnotationSupport.isAnnotated(field, Container.class);  
        
            // ...
        
      };  
    }  
}
```

예상대로, beforeAll과 beforeEach를 오버라이딩하면서 @Container가 붙은 정적/클래스 인스턴스로 컨테이너를 띄우고 있습니다. 그래서 @BeforeEach, @AfterEach가 붙은 setUp(), tearDown() 메서드 없이도 컨테이너가 자동으로 띄워지고, 내려집니다.

<br>

#### 두 가지 방법의 공통된 장점
<br>
우선 장점으로는, 두 방법 모두 인스턴스를 직접 생성하여 사용하므로 조금 더 정교한 customizing이 가능합니다.

```java
private MySQLContainer mySQLContainer = new MySQLContainer("mysql:8");  
  
{  
	  mySQLContainer.withUsername("리오")  
        .withPassword("짱짱")  
        .withDatabaseName("멋쟁이")  
        .withConfigurationOverride("귀요미");  
}
```

MySQLContainer의 Super Class인 JdbcDatabaseContainer와 GenericContainer는 훨씬 더 많은 메서드를 가지고 있습니다. 이러한 메서드들을 사용해서 컨테이너를 customizing하거나 원하는 정보를 얻을 수 있습니다.

<br>

#### 두 가지 방법의 공통된 단점 및 해결방법
<br>
두 가지 방법 모두 테스트 메서드마다 컨테이너를 새로 띄웁니다. 각 컨테이너가 올라가고 내려가는 시간이 꽤 길기 때문에, 테스트의 수가 많아진다면 전체 테스트의 수행 시간이 굉장히 오래 걸리게 됩니다.

이를 해결하기 위해서는 **하나의 컨테이너 인스턴스만 사용하도록** 하면 됩니다.
```java
class WithContainerTest {

	  protected static MySQLContainer mySQLContainer = new MySQLContainer("mysql:8");

    static {
        mySQLContainer.start();
    }
}
```

```java 
@Testcontainers
class WithContainerTest {

	  @Container  
	  protected static MySQLContainer mySQLContainer = new MySQLContainer("mysql:8");
}
```
```java
@SpringBootTest
class SomeTest extends WithContainerTest {
	// ...
}
```
이렇게 클래스를 하나 생성한 후 MySQLContainer의 인스턴스를 static 메모리에 올리면(싱글턴 패턴이죠!), 이후 해당 클래스를 상속하는 테스트들은 하나의 MySQLContainer 인스턴스만 사용할 수 있게 되...**지 않습니다!!! (주의!!!)**

정확히 말하면, **두 번째 방법인 @Testcontainers를 사용하는 경우에 해당 방법이 작동하지 않습니다.** JUnit의 Life-Cycle 관리는 클래스 단위로 이루어지기 때문입니다. 그래서, 다른 테스트 클래스가 실행되면 또 다른 Life-Cycle이 돌기 때문에 해당 static 컨테이너를 공유하지 못하고 새로 띄우게 됩니다.   
다만, 한 클래스 내의 메서드들은 하나의 컨테이너를 공유할 수 있습니다. 위의 TextcontainersExtension의 코드에서 beforeAll() 메서드 내부에서도 findSharedContainer()로 static 인스턴스를 찾는 로직이 보이네요.  
[공식 문서](https://testcontainers.com/guides/testcontainers-container-lifecycle/)에서도 'common misconfiguration'이라고 설명하며, Extension을 이용한 방법으로는 클래스 간 컨테이너 공유가 불가능하다고 합니다.

그래서, 전체 테스트에서 하나의 컨테이너만 사용하고 싶다면 처음 소개드린 대로 싱글턴 패턴을 사용해야 합니다! (**~~그런데 과연 이 방법만 있을까요? 후훗...~~**)

![](https://i.imgur.com/qZsgssD.gif)
보시듯이 하나의 컨테이너만 띄워지고 이 컨테이너에서 모든 테스트가 실행되는 것을 확인할 수 있습니다.

추가적으로, 하나의 컨테이너를 사용하게 되면서 테스트 격리를 해야하는 상황이 있을 수 있습니다. 기존에 했던 방식대로 테이블들을 truncate 해주시면 됩니다. 저는 개인적으로 [이 블로그](https://kong-dev.tistory.com/248)에서 추천하는 방식이 가장 좋았습니다.

<br>

#### 세 번째 방법 : Datasource URL 설정  
<br>

프로젝트의 상황을 조금 더 고민해본 결과, 위의 두 방법보다도 훨씬 간단한 방법을 직접 찾아낼 수 있었습니다. 간단하기도 하고, Testcontainers의 라이브러리 사용을 위해 기존 테스트 코드가 오염되는 것이 싫으신 분들 (~~혹은 코드 몇 줄 더 치기 귀찮은 분들~~)을 위한 방법일 수 있습니다.
  

> ⚠️ 이 방법은 사용하시는 상황에 따라 적절하지 않은 방법일 수 있습니다.
> 이후에 설명하는 상황과 부합하는 경우에만 사용하세요.

현재 저희 프로젝트는 테스트 시 MySQL 컨테이너 하나만 띄우면 되는 상황입니다. 그래서 **프로파일 설정 파일의 Datasource만 띄워지는 컨테이너로 설정하면 되지 않을까?** 라는 생각을 했습니다.  
Spring에서는 (스코프를 재설정하지 않는 이상) **DataSource를 빈으로 등록**하고, 여러 곳에서 참조할 때 재사용하는 것을 알고 있었기 때문에, 가능할 것으로 생각했습니다.

찾아보니 Datasource를 다음과 같이 Testcontainers가 띄워주는 MySQL 컨테이너로 설정하는 방법이 있었습니다.

```
spring:  
	datasource:  
		driver-class-name: org.testcontainers.jdbc.ContainerDatabaseDriver  
		url: jdbc:tc:mysql:8://test  
		username: root  
		password: test
```
(데이터베이스 이름과 username, password는 원하는대로 설정해도 됩니다!)

**결과는...!**

![](https://i.imgur.com/ymMrd9F.gif)
(**성공적이었습니다!** 315(+ɑ)에 달하는 커버리지 93%(Line 기준)의 테스트도 1분 안에 끝납니다!)  
  
물론 위의 두 방법처럼 테스트 격리를 위해 truncate가 필요하긴 하지만, 코드로 인스턴스를 생성할 필요없이 간단하게 Testcontainers를 사용할 수 있었습니다.

올바른 방법인지 확인해보려고 공식문서를 열심히 뒤져서 [JDBC 모듈 관련 문서](https://java.testcontainers.org/modules/databases/jdbc/)를 찾아냈습니다. Testcontainers에서 지원하는 기능이 맞았고, 적절한 driver만 가지고 있다면 다른 벤더에도 적용할 수 있었습니다. (설명드린 첫번쨰 방법과 세번째 방법을 동시에 해야한다고 알려주는 다른 블로그 글들이 많으니 주의해주세요!)

---
### 마치며
Testcontainers를 사용하여 로컬에서도 실제 운영 환경과 유사한 환경에서 테스트를 수행하는 방법에 대해서 알아봤습니다. 
개인적으로는 팀의 문제를 단계별로 해결해나가며 최선의 방법을 찾아냈고, 잘못 알려져있는 사용법들을 올바른 방법으로 소개해드릴 수 있었던 뜻깊은 경험이었습니다.
긴 글 읽어주셔서 감사합니다!

<br>

#### 참고 자료

- [Testcontainers 공식 사이트](https://testcontainers.com/)
- [Testcontainers for Java 공식 문서](https://java.testcontainers.org/)
- [Testcontainers로 MariaDB 통합 테스트하기 - 최범균 님](https://www.youtube.com/watch?v=eZbLAD2yUfE)
- [TestContainer로 멱등성있는 integration test 환경 구축하기](https://medium.com/riiid-teamblog-kr/testcontainer-%EB%A1%9C-%EB%A9%B1%EB%93%B1%EC%84%B1%EC%9E%88%EB%8A%94-integration-test-%ED%99%98%EA%B2%BD-%EA%B5%AC%EC%B6%95%ED%95%98%EA%B8%B0-4a6287551a31)
