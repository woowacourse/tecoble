---
layout: post
title: "API 문서 자동화 - Spring REST Docs 팔아보겠습니다"
author: [티거]
tags: ["spring", "docs"]
date: "2020-08-18T12:00:00.000Z"
draft: false
---

프로덕션 코드와 분리하여 문서 자동화를 하고 싶다고요?

신뢰도 높은 API 문서를 만들고 싶다고요?

테스트가 성공해야 문서를 만들 수 있다!! **Spring REST Docs**가 있습니다.

**API 문서를 자동화** 도구로는 대표적으로 **Spring REST Docs**와 **Swagger**가 있습니다. 흔히 두 가지를 두고 무엇을 사용할까 고민하실 겁니다. 그런 당신을 위해 이번 글에서는 **Spring REST Docs**를 왜 사용하고, 어떻게 사용하는지 알아볼 겁니다. ~~Swagger는 다음 글에서...~~

## 왜 사용할까요?

Spring REST Docs의 대표적인 장점은 다음과 같습니다.

- **테스트가 성공**해야 문서 작성됩니다.
  - **Spring REST Docs**는 테스트가 성공하지 않으면 문서를 만들 수 없습니다. 따라서 **Spring REST Docs**로 문서를 만든다는 것은 API의 신뢰도를 높이고 더불어 테스트 코드의 검증을 강제로 하게 만드는 좋은 문서화 도구입니다.😂😂

- 실제 코드에 **추가되는 코드가 없습니다.**
  - 프로덕션 코드와 분리되어있기 때문에 **Swagger**같이 Config 설정 코드나 어노테이션이 우리의 프로덕션 코드를 더럽힐 일이 없습니다.😊😊

~~단점으로는 적용하기 어렵습니다...~~

##  어떻게 사용할까요?

### 작업 환경

- Spring Boot - 2.3.3
- Gradle - 6.4.1
- MockMvc

### build.gradle 설정

먼저 Spring REST Docs를 사용하기 위해 build.gradle에 아래 설정을 **추가합니다.**

```
plugins { 
	id "org.asciidoctor.convert" version "1.5.9.2"
}

dependencies {
	asciidoctor 'org.springframework.restdocs:spring-restdocs-asciidoctor' 
	testImplementation 'org.springframework.restdocs:spring-restdocs-mockmvc' 
}

ext { 
	snippetsDir = file('build/generated-snippets')
}

test { 
	outputs.dir snippetsDir
}

asciidoctor { 
	inputs.dir snippetsDir 
	dependsOn test 
}

bootJar {
	dependsOn asciidoctor 
	from ("${asciidoctor.outputDir}/html5") { 
		into 'static/docs'
	}
}
```

**잠깐!!!**

```
bootJar {
	dependsOn asciidoctor 
	from ("${asciidoctor.outputDir}/html5") { 
		into 'static/docs'
	}
}
```

이 설정은 생성된 문서를 **jar파일에 패키징**하는 설정입니다. 

> You may want to package the generated documentation in your project’s jar file ... - [Spring REST Docs의 Packaging the Documentation](https://docs.spring.io/spring-restdocs/docs/2.0.4.RELEASE/reference/html5/#getting-started-build-configuration-packaging-the-documentation)

만약 `build/asciidoc/html5/`에 `html`파일을 `src/main/resources/static/doc` 복사해주고 싶으시다면 아래 설정을 추가해 주시면 됩니다.

```
task copyDocument(type: Copy) {
    dependsOn asciidoctor

    from file("build/asciidoc/html5/")
    into file("src/main/resources/static/docs")
}

build {
    dependsOn copyDocument
}
```

### 프로덕션 코드 작성

먼저 Spring REST Docs를 사용하기 위해 다음과 같이 Controller와 Entity를 작성했습니다. Controller는 기본적인 CREATE(생성), READ(전체조회, 단일조회), UPDATE(수정), DELETE(삭제)로 구성하였습니다.

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

### 테스트 코드 작성

테스트 코드의 초기 setting을 해보겠습니다.

```java
@ExtendWith(RestDocumentationExtension.class) // When using JUnit5 
@SpringBootTest
public class PostControllerTest {

    private MockMvc mockMvc;

    @BeforeEach
    public void setUp(WebApplicationContext webApplicationContext,
            RestDocumentationContextProvider restDocumentation) {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(documentationConfiguration(restDocumentation))
                .build();
    }
    
}
```

`webAppContextSetup()`만 쓴다면 여러분들이 아시는 Mock을 사용하기 위한 일반적인 `MockMvc`의 setting이지만 `apply(documentationConfiguration(restDocumentation))`를 추가함으로써 문서화를 할 수 있는 겁니다.

아!! 설정이 너무 복잡하다고요???

```java
@AutoConfigureMockMvc // -> webAppContextSetup(webApplicationContext)
@AutoConfigureRestDocs // -> apply(documentationConfiguration(restDocumentation))
@SpringBootTest
public class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;
    
}
```

이렇게 해주시면 위의 복잡한 설정을 대신 해줄 수 있습니다. 자세히 알고 싶으신 분들은 [@AutoConfigureMockMvc](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/restdocs/AutoConfigureRestDocs.html)와 [@AutoConfigureRestDocs](https://docs.spring.io/spring-boot/docs/current/api/org/springframework/boot/test/autoconfigure/web/servlet/AutoConfigureMockMvc.html)를 참고하세용.😊😊 ~~절대 다룰 게 많아져서 링크 첨부한 거 아닙니다...큽~~

setting이 끝났으니 create의 테스트 코드 작성 및 설명을 하겠습니다. 

```java
@MockBean
private PostService postService;

// ...

@Test
void create() throws Exception {
    final PostResponse postResponse = new PostResponse(1L, "title", "content");
    when(postService.create(any())).thenReturn(postResponse);
	
    this.mockMvc.perform(post("/posts") // 1
            .content("{\"title\": \"title\", \n\"content\": \"content\"}") // 2
            .contentType(MediaType.APPLICATION_JSON)) // 3
            .andExpect(status().isCreated()) // 4
            .andDo(document("post-create", // 5
                    requestFields( // 6
                            fieldWithPath("title").description("Post 제목"), // 7
                            fieldWithPath("content").description("Post 내용").optional() // 8
                    )
            ));
}
```

1 - 요청 방식(get, post 등)은 post를 선택하고  `/posts`를 호출하겠다는 의미입니다.

2 - create는 RequestBody를 받기 때문에 값을 보내줘야 합니다. content 안에 보낼 데이터를 입력해주시면 됩니다.

```json
{
    "title": "title",
    "content": "content"
}
```

3 - create는 application/json 형식으로 요청을 받는다는 의미입니다.

4 - 정상적으로 동작 시 `isCreated`상태 코드로 응답한다는 의미입니다.

5 - 이 documentation의 이름을 "post-create"로 하겠다는 의미입니다.

6 - create는 requestFields를 받기 때문에 문서에 requestFields을 명시하겠다는 의미입니다.

7 - `fieldWithPath`는 key 값을, `description`는 `fieldWithPath`에 대한 설명을 쓰시면 됩니다.

8 - Test를 할 때 만약 `content`의 값이 없다면 테스트는 실패할 겁니다. 따라서 `content`와 같이 `null`일 수 있다면 `optional()`을 붙여주면 됩니다.

다음으로 findAll과 findById 입니다. (중복되는 설명은 생략하겠습니다.😂😂)

```java
@Test
void findAll() throws Exception {
    List<PostResponse> postResponses = Lists.newArrayList(
        new PostResponse(1L, "title1", "content1"),
        new PostResponse(2L, "title2", "content2")
    );

    when(postService.findAll()).thenReturn(postResponses);

    this.mockMvc.perform(get("/posts")
            .accept(MediaType.APPLICATION_JSON)) // 1
            .andExpect(status().isOk())
            .andDo(document("post-get-all",
                    responseFields( // 2
                            fieldWithPath("[].id").description("Post Id"), // 3
                            fieldWithPath("[].title").description("Post 제목"),
                            fieldWithPath("[].content").description("Post 내용")
                    )
            ));
}

@Test
void findById() throws Exception {
    final PostResponse postResponse = new PostResponse(1L, "title", "content");
    when(postService.findById(anyLong())).thenReturn(postResponse);

    this.mockMvc.perform(get("/post/{postId}", postResponse.getId()) // 4
            .accept(MediaType.APPLICATION_JSON))
        	.andExpect(status().isOk())
        	.andDo(document("post-get-one",
                    pathParameters( // 5
                            parameterWithName("postId").description("Post Id") // 6
                    ),
                    responseFields(
                            fieldWithPath("id").description("Post Id"),
                            fieldWithPath("title").description("Post 제목"),
                            fieldWithPath("content").description("Post 내용")
                    )
            ));
}
```

1 - findAll는 application/json 형식으로 응답을 보내겠다는 의미입니다.

2 - findAll는 responseFields 보내기 때문에 responseFields를 명시하겠다는 의미입니다.

3 - 설명은 create의 7번과 같고, List형식은 `[].id`처럼 앞에 `[]`를 해야 합니다. - [참고](https://docs.spring.io/spring-restdocs/docs/2.0.4.RELEASE/reference/html5/#documenting-your-api-request-response-payloads-fields-reusing-field-descriptors)

4 - PathVariable로 받는 값(ex. `postResponse.getId()`)은 위와 같이 넣을 수 있습니다.

5 - findById는 PathVariable을 받기 때문에 PathVariable를 문서에 명시한다는 의미입니다.

6 - pathParameters는 parameterWithName를 사용하여 PathVariable의 Name(postId)을 명시할 수 있고 description은 설명을 적어주시면 됩니다.

이제 이전 설명을 바탕으로 update와 delete를 작성할 수 있습니다.

```java
@Test
void update() throws Exception {
    this.mockMvc.perform(put("/post/{postId}", 1L)
            .content("{\"title\": \"turtle\", \n\"content\": \"context\"}")
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andDo(document("post-update",
                    pathParameters(
                            parameterWithName("postId").description("Post Id")
                    ),
                    requestFields(
                            fieldWithPath("title").description("Post 제목"),
                            fieldWithPath("content").description("Post 내용")
                    )
            ));
}

@Test
void remove() throws Exception {
    this.mockMvc.perform(delete("/post/{postId}", 1L))
            .andExpect(status().isNoContent())
            .andDo(document("post-delete",
                    pathParameters(
                            parameterWithName("postId").description("Post Id")
                    )
            ));
}
```

### 문서화

build를 하면 `build/generated-snippets`에 다음과 같이 생길 겁니다.

![image](https://user-images.githubusercontent.com/45934117/90552601-0dd81900-e1ce-11ea-8e11-8e4d160c8b4f.png)

`src/docs/asciidoc`와 같이 디렉토리를 만들고 `*.adoc`파일을 작성해줍니다. ([Asciidoctor User Manual](https://asciidoctor.org/docs/user-manual/#introduction-to-asciidoctor) 참고)

>  Asciidoctor는 일반 텍스트를 처리하고 필요에 맞게 스타일 및 레이아웃 된 HTML을 생성합니다.

 ```
= Spring REST Docs
:toc: left
:toclevels: 2
:sectlinks:

[[resources-post]]
== Post

[[resources-post-create]]
=== Post 생성

==== HTTP request

include::{snippets}/post-create/http-request.adoc[]

==== HTTP response

include::{snippets}/post-create/http-response.adoc[]
 ```

IntelliJ를 사용한다면 AsciiDoc plugin을 설치하십쇼!! 미리 보기가 가능해집니다. (사용하는 것을 추천합니다.👍)

![image](https://user-images.githubusercontent.com/45934117/90552659-23e5d980-e1ce-11ea-9e5c-1eea03b10ce0.png)

코드 작성을 완료했다면 다시 한 번 build 합니다. 그러면 `build/asciidoc/html5`와 `src/main/resources/static/docs`에 `html` 파일이 생길 겁니다.

마지막으로 서버를 실행 시키고 `http://localhost:8080/docs/api-docs.html`로 이동하면 문서가 잘 나오는 것을 확인할 수 있습니다. 👏👏

![image](https://user-images.githubusercontent.com/45934117/90552724-3eb84e00-e1ce-11ea-991e-3aa80f6658d1.png)

**잠깐!!!**

만약 아래와 같이 나오신다면

![image](https://user-images.githubusercontent.com/45934117/90552813-598ac280-e1ce-11ea-8783-61abdc60dd56.png)

아래 코드를 `src/main/docs/asciidoc`있는 `*.adoc` 코드의 최상단에 넣어줍니다.

```
ifndef::snippets[]
:snippets: ../../../build/generated-snippets
endif::[]
```

아까 작성한 `*.adoc`에 적용하면 다음과 같습니다.

```
ifndef::snippets[]
:snippets: ../../../build/generated-snippets
endif::[]
= Spring REST Docs
:toc: left
:toclevels: 2
:sectlinks:

[[resources-post]]
== Post

[[resources-post-create]]
=== Post 생성

==== HTTP request

include::{snippets}/post-create/http-request.adoc[]

==== HTTP response

include::{snippets}/post-create/http-response.adoc[]
```

차~암 ~~어렵쥬~~ 쉽쥬?😂😂

사용하면 내가 테스트 코드를 작성하는지 문서를 만들고 있는지 모르게 하지만 **Swagger**보다 안전한 API 문서를 만들 수 있게 하는 문서 자동화 도구 **Spring REST Docs**...

지금 당장 사용하세요.😊😊

## 참고자료

[Spring REST Docs](https://docs.spring.io/spring-restdocs/docs/2.0.4.RELEASE/reference/html5/)

[Gradle Multi Module에서 Spring Rest Docs 사용하기](https://jojoldu.tistory.com/294)

[Asciidoctor User Manual](https://asciidoctor.org/docs/user-manual/#introduction-to-asciidoctor)
