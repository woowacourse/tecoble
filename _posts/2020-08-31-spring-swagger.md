---
layout: post
title: "API 문서 자동화 Swagger 팔아보겠습니다."
author: "티거"
comment: "true"
tags: ["spring", "docs"]
---

Spring REST Docs 같이 테스트 코드 작성하면서 문서화하는게 지겹다고요?

문서 화면을 알록달록 이쁘게 만들고 싶다고요?

간단한 코드로 컬러풀한 문서를 만든다!! **Swagger**가 있습니다.

**Swagger**은 작성하기 어렵고 심지어 테스트까지 통과해야 문서가 만들어지는 Spring REST Docs와는 다르게 빠르고 쉬우면서 색깔까지 알록달록한 문서를 만들 수 있게 도와줍니다.

설명하기 전에 **Swagger**가 무엇인지 아십니까?

> 개발자가 REST 웹 서비스를 설계, 빌드, 문서화, 소비하는 일을 도와주는 대형 도구 생태계의 지원을 받는 오픈 소스 소프트웨어 프레임워크 - 위키백과

~~위키백과 감사합니다.~~

## 왜 사용할까요?

Swagger를 사용하는 이유는 다음과 같습니다.

- 적용하기 쉽습니다.
  - 위에서도 말했지만 테스트 코드를 작성하고 테스트를 성공시켜야 만들어지는 `Spring REST Docs`와 달리 `Swagger`는 코드 몇 줄만 추가하면 만들 수 있다.
- 테스트할 수 있는 UI를 제공합니다.
  - `Spring REST Docs`는 테스트를 돌리면서 성공하는 지 실패하는 지 확인했지만 Swagger는 문서 화면에서 API를 바로바로 테스트할 수 있습니다. 

## 어떻게 사용할까요?

사용하는 방법도 간단합니다. 일단 build.gradle에 2줄을 추가해줍니다.

```
implementation 'io.springfox:springfox-swagger2:2.9.2'
implementation 'io.springfox:springfox-swagger-ui:2.9.2'
```

왜 3.0.0이 최신버전인데 2.9.2를 사용하냐고요? 3.0.0과 2.9.2의 설정하는 방법이 달라서 3.0.0은 2.9.2 설명이 끝난 후에 설명하겠습니다.

그리고 Swagger를 사용하기 위해 다음과 같이 Controller와 Entity를 작성했습니다. 

```java
@RequestMapping("/posts")
@RestController
public class PostController {

    private final PostService postService;

    public PostController(final PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(@RequestBody final PostRequest postRequest) {
        final PostResponse postResponse = postService.create(postRequest);
        return ResponseEntity.created(URI.create("/posts/" + postResponse.getId())).build());
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> findAll() {
        return ResponseEntity.ok(postService.findAll());
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostResponse> findById(@PathVariable final Long postId) {
        return ResponseEntity.ok(postService.findById(postId));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<Void> update(@PathVariable final Long postId, @RequestBody PostRequest postRequest) {
        postService.update(postId, postRequest);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> delete(@PathVariable final Long postId) {
        postService.delete(postId);
        return ResponseEntity.noContent().build();
    }
}
```

```java
@Entity
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column
    private String content;
    
    // ...
}
```

이제 Swagger를 설정하는 부분입니다. 먼저 SwaggerConfig 클래스를 생성해줍니다.

```java
@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket apiV1(){
        return new Docket(DocumentationType.SWAGGER_2)
                .groupName("groupName1")
                .select()
                .apis(RequestHandlerSelectors.
                        basePackage("javable.controller"))
                .paths(PathSelectors.ant("/posts/**")).build();
    }
    
    @Bean
    public Docket apiV2(){
        return new Docket(DocumentationType.SWAGGER_2)
                .useDefaultResponseMessages(false)
                .groupName("groupName2")
                .select()
                .apis(RequestHandlerSelectors.
                        basePackage("javable.controller"))
                .paths(PathSelectors.ant("/posts/**")).build();
    }
}
```

똑같은 코드를 두번 작성한 것처럼 보이지만 자세히 보면 약간 차이가 있다는 것을 느낄 수 있을 겁니다. 코드작성이 끝나셨다면 서버를 실행시켜 http://localhost:8080/swagger-ui.html로 들어가봅니다.

**잠깐!**

근데 왜 swagger-ui.html냐고요?

![image](https://user-images.githubusercontent.com/45934117/91721757-3bf92800-ebd4-11ea-8bd3-b136fa064fff.png)

`springfox-swagger-ui`가 이렇게 만들어주기 때문입니다.

각설하고 http://localhost:8080/swagger-ui.html로 이동하면 컬러풀하게 만들어진 문서 화면을 보실 수 있을 겁니다.

![image](https://user-images.githubusercontent.com/45934117/91722205-e83b0e80-ebd4-11ea-9759-eada4957a0d7.png)

화면도 봤으니 이제 `SwaggerConfig`에서 사용한 코드에 대해 설명드리겠습니다.

Docket

- Swagger 설정을 할 수 있게 도와주는 클래스입니다.

- useDefaultResponseMessages()
  - false로 설정하면 불필요한 응답코드와 설명을 제거할 수 있습니다. 
  - Default 일때![image](https://user-images.githubusercontent.com/45934117/91723111-3d2b5480-ebd6-11ea-891b-d8f2a0905f4c.png)
  - false 일때![image](https://user-images.githubusercontent.com/45934117/91723335-8b405800-ebd6-11ea-88f6-69ca463b148f.png)

- groupName()

  - 만약 Bean이 하나라면 생략이 가능하지만 위의 코드와 같이 Bean이 여러 개면 명시해줘야합니다. Bean이 여러 개면 groupName이 출동하여 오류를 발생하기 때문입니다. 그렇게 groupName를 명시하게되면 화면 우측상단에서 아래 이미지와 같은 List를 볼 수 있습니다.

    ![image](https://user-images.githubusercontent.com/45934117/91724001-95af2180-ebd7-11ea-9354-5df396599afd.png)

- select()

  - ApiSelectorBuilder를 생성하여 apis()와 paths()를 사용할 수 있게 해줍니다.

- apis()

  - api가 작성되있는 패키지를 지정합니다.
  - 저는 javable > controller 안에 api controller가 있기 때문에 basePackage를 `javable.controller`로 지정했습니다.

- paths()

  - apis()로 선택된 API중 원하는 path를 지정하여 문서화할 수 있습니다. 지금은 `PathSelectors.ant("/posts/**")` 이렇게 설정했기때문에 `/posts`에 관한 API를 문서화해서 볼 수 있습니다.
  - `PathSelectors.any()`로 설정하면 패키지 안에 모든 API를 한 번에 볼 수 있지만 API가 많아지면 보기 힘들겠지요?😂😂

![image](https://user-images.githubusercontent.com/45934117/91725917-59c98b80-ebda-11ea-9263-fdb5594aa40c.png)

이 부분은 바꿀 수 없냐고요? 걱정 하덜덜 마이소.

```java
@Configuration
@EnableSwagger2
public class SwaggerConfig {

    @Bean
    public Docket apiV1(){
        return new Docket(DocumentationType.SWAGGER_2)
                .apiInfo(this.apiInfo())
                .groupName("groupName1")
                .select()
                .apis(RequestHandlerSelectors.
                        basePackage("javable.restdocs.controller"))
                .paths(PathSelectors.ant("/posts/**")).build();
    }

    private ApiInfo apiInfo() {
        return new ApiInfo(
                "title",
                "description",
                "version",
                "https://woowacourse.github.io/javable/",
                new Contact("Contact Me", "https://woowacourse.github.io/javable/", "tigger@tigger.com"),
                "tigger Licenses",
                "https://woowacourse.github.io/javable/",
                new ArrayList<>()
        );
    }
}
```

위의 `SwaggerConfig` 코드에 `ApiInfo`를 추가하면 원하는 데로 커스텀할 수 있습니다.

`ApiInfo`의 생성자 파라미터는 다음과 같습니다.

```java
public ApiInfo(
    String title,
    String description,
    String version,
    String termsOfServiceUrl,
    Contact contact,
    String license,
    String licenseUrl,
    Collection<VendorExtension> vendorExtensions)
```

만약 위의 코드처럼 `ApiInfo`를 설정하면 어떻게 바뀌어있을까요? 야무지게 바뀌어 있습니다.

![image](https://user-images.githubusercontent.com/45934117/91728870-af079c00-ebde-11ea-9b8b-503e21ef735c.png)

숫자는 여러분들이 이해하기 편하도록 제가 넣은 겁니다.😊😊 그림과 같이 코드를 설명해드리겠습니다. 

1. `ApiInfo`의 `title`부분입니다. 원하는 문자열을 넣어주시면 됩니다.
2. `ApiInfo`의 `version`부분입니다. 설명은 1번과 같습니다.
3. `ApiInfo`의 `description`부분입니다. 설명은 1번과 같습니다.
4. `ApiInfo`의 `termsOfServiceUrl`부분입니다. `Terms of service`를 클릭했을 때 보내고 싶은 URL를 적어주시면 됩니다.
5. `ApiInfo`의 `Contact`부분의 첫 번째 파라미터와 두 번째 파라미터 설정입니다. 제가 `Contact` 첫 번째 파라미터에 `"Contact Me"`를 넣었기 때문에 5번과 6번에 `Contact Me`를 보실 수 있는 것이고, 5번을 클릭하면 두 번째 파라미터에 설정한 URL로 이동할 수 있습니다.
6. `ApiInfo`의 `Contact`부분의 첫 번째 파라미터와 세 번째 파라미터 설정입니다. `Contact Me`는 5번 설명과 동일하고, 클릭하면 세 번째 파라미터에 설정한 이메일 주소로 메일을 보낼 수 있습니다.
7. `ApiInfo`의 `license`와 `licenseUrl`부분입니다. `license`로 화면에 명시할 수 있고, 7번을 클릭하면 `licenseUrl`에 설정한 URL로 이동할 수 있습니다. 

화면도 봤고, 코드도 이해했는데 테스트는 어디서 할 수 있냐고요?

http://localhost:8080/swagger-ui.html에 들어가서 API를 클릭하면 다음과 같은 화면을 볼 수 있습니다.

![image](https://user-images.githubusercontent.com/45934117/91733388-69e66880-ebe4-11ea-98b8-1ba806cc938a.png)

그리고 `Try it out`을 누르면 화면이 다음과 같이 바뀔 겁니다.

![image](https://user-images.githubusercontent.com/45934117/91733537-9c906100-ebe4-11ea-865a-cefa508c9981.png)

PathVariable를 받는다면 PathVariable를 입력할 수 있는 창이 나오고 RequestBody를 받는다면 RequestBody를 입력할 수 있는 창이 나오겠지요?😊😊 주어진 API 형식에 맞게 입력하고 `Execute`를 누르면 우리가 API를 사용하는 것(유사 Postman)과 똑같이 사용하실 수 있습니다.

그래서 3.0.0은 뭐가 다르냐고요?

```
implementation "io.springfox:springfox-boot-starter:3.0.0"
implementation "io.springfox:springfox-swagger-ui:3.0.0"
```

추가하시고

```java
// For WebMvc
public class SwaggerUiWebMvcConfigurer implements WebMvcConfigurer {
  private final String baseUrl;

  public SwaggerUiWebMvcConfigurer(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String baseUrl = StringUtils.trimTrailingCharacter(this.baseUrl, '/');
    registry.
        addResourceHandler(baseUrl + "/swagger-ui/**")
        .addResourceLocations("classpath:/META-INF/resources/webjars/springfox-swagger-ui/")
        .resourceChain(false);
  }

  @Override
  public void addViewControllers(ViewControllerRegistry registry) {
    registry.addViewController(baseUrl + "/swagger-ui/")
        .setViewName("forward:" + baseUrl + "/swagger-ui/index.html");
  }
}
```

```java
// For WebFlux
public class SwaggerUiWebFluxConfigurer implements WebFluxConfigurer {
  private final String baseUrl;

  public SwaggerUiWebFluxConfigurer(String baseUrl) {
    this.baseUrl = baseUrl;
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    String baseUrl = StringUtils.trimTrailingCharacter(this.baseUrl, '/');
    registry.
        addResourceHandler(baseUrl + "/swagger-ui/**")
        .addResourceLocations("classpath:/META-INF/resources/webjars/springfox-swagger-ui/")
        .resourceChain(false);
  }
}
```

둘 중 하나만 만들면 나머지는 2.9.2와 동일합니다.

아! 주소는 http://host/context-path/swagger-ui/index.html OR http://host/context-path/swagger-ui/로 바뀌었습니다. 이유는 2.9.2와 동일합니다.😊😊

들어가보시면 UI도 바뀐 것을 확인할 수 있습니다.

![image](https://user-images.githubusercontent.com/45934117/91732503-48d14800-ebe3-11ea-891a-6c91012ddf00.png)

차~암 쉽쥬?😆😆

사용하면 `Spring REST Docs`보다 빠르고 쉽게 문서를 만드는 것뿐만 아니라 내가 디자인하지는 않았지만 내가 디자인한 것 같이 만족감을 얻을 수 있게 하는 마력의 문서 자동화 도구 **Swagger**...

한번 사용해십쇼.😊😊

## 참고자료

[[SpringBoot] Swagger - API Docs 자동화](https://victorydntmd.tistory.com/341?category=764331)

[Springfox Reference Documentation](http://springfox.github.io/springfox/docs/current/)