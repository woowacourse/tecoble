---
layout: post
title: "Spring REST Docs"
author: "티거"
comment: "true"
tags: ["spring"]
---

**API 문서를 자동화한다**라고 하면 `Spring REST Docs`와 `Swagger`를 많이 사용할 것이다. 이번 글에서는 `Spring REST Docs`를 다뤄볼 것이다. `Swagger`대신 `Spring REST Docs`를 왜 사용하고, 어떻게 사용하는지 알아보자.

## 왜 사용할까?

Spring REST Docs의 대표적인 장점은 다음과 같다.

- **테스트가 성공**해야 문서 작성됨
- 실제 코드에 **추가되는 코드가 없음**

말 그대로 테스트가 성공하지 못하면 문서를 만들 수 없고, Swagger처럼 어노테이션을 붙일 필요가 없기에 실제 코드에 영향을 주지 않는다.

~~단점으로는 적용하기 어렵다...~~

##  어떻게 사용할까?

### 작업 환경

- Spring Boot - 2.3.3
- Gradle - 6.4.1
- JUnit5
- MockMvc

### build.gradle 설정

먼저 Spring REST Docs를 사용하기 위해 build.gradle에 아래 설정을 **추가한다.**

```
plugins { 
	id "org.asciidoctor.convert" version "1.5.3"
}

dependencies {
	asciidoctor 'org.springframework.restdocs:spring-restdocs-asciidoctor:1.2.6.RELEASE' 
	testImplementation 'org.springframework.restdocs:spring-restdocs-mockmvc:1.2.6.RELEASE' 
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

bootJar 안에 있는 

```
from ("${asciidoctor.outputDir}/html5") { 
	into 'static/docs'
}
```

해당 설정은 `build/asciidoc/html5/`에 `html`파일의 문서가 만들어 지면 `src/main/resources/static/docs`로 복사한다는 의미이다.

**잠깐!!!**

(위 같이 설정을 해도 복사가 되지 않았다...😭😭)

나와 같이 설정을 해도 **복사가 안 되는 분**은 다음과 같이 설정하자!!

```
bootJar {
    dependsOn asciidoctor
    copy {
        from "${asciidoctor.outputDir}/html5"
        into 'src/main/resources/static/docs'
    }
}
```

### 테스트 코드 작성

Controller를 간단하게 작성했다.

```java
@RequestMapping("/post")
@RestController
public class PostController {

    private final PostService postService;

    public PostController(final PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(@RequestBody final PostRequest postRequest) {
        final PostResponse postResponse = postService.create(postRequest);
        return ResponseEntity.created(URI.create("/post/" + postResponse.getId())).build());
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

기본적인 CREATE(생성), READ(전체조회, 단일조회), UPDATE(수정), DELETE(삭제)를 작성했다.

Entity는 이러하다.

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

다음으로 테스트 코드의 초기 setting이다.

```java
@ExtendWith(RestDocumentationExtension.class)
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

setting이 끝나면 create 테스트 코드를 작성한다. 

```java
@Test
void create() throws Exception {
    final PostResponse postResponse = new PostResponse(1L, "title", "content");
    when(postService.create(any())).thenReturn(postResponse);
	
    this.mockMvc.perform(post("/post") // 1
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

1. 요청 방식(get, post 등)은 post를 선택하고  `/post`를 호출한다.

2. create는 RequestBody를 받기 때문에 실제 값과 동일한 형식으로 content에 값을 넣는다.

   ```json
   {
       "title": "title",
       "content": "content"
   }
   ```

3. create는  application/json 형식으로 요청을 받는다.

4. 정상적으로 동작시 `isCreated`상태 코드를 보낸다.

5. documentation의 이름을 적어준다.

6. create의 requestFields을 받는다.

7. RequestBody 정보를 보면 CREATE는 `title`과 `content`를 받는다. `fieldWithPath`는 key값을, `description`는 `fieldWithPath`에 대한 설명을 쓴다.

8. Test를 할 때 만약 `content`의 값이 없다면 테스트는 실패할 것이다. 따라서 `content`와 같이 `null`일 수 있다면 `optional()`을 붙여주면 된다.

다음으로 findAll과 findById이다. (중복되는 설명은 생략하겠습니다.😂😂)

```java
@Test
void findAll() throws Exception {
    List<PostResponse> postResponses = Lists.newArrayList(
        new PostResponse(1L, "title1", "content1"),
        new PostResponse(2L, "title2", "content2")
    );

    when(postService.findAll()).thenReturn(postResponses);

    this.mockMvc.perform(get("/post")
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

1. findAll는 application/json 형식으로 응답을 보낸다.
2. findAll는 responseFields를 준다.
3. 설명은 create의 7번과 같고, List형식은 `[].id`처럼 앞에 `[]`를 해야한다.
4. PathVariable로 받는 값(ex. `postResponse.getId()`)을 넣어준다.
5. findById는 PathVariable를 받는다.
6. pathParameters는 parameterWithName로 PathVariable의 Name(postId)을 쓴다.

이제 이전 설명을 바탕으로 update와 delete를 작성할 수 있다.

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

build를 하면 `build/generated-snippets`에 다음과 같이 생길 것이다.

![image](https://user-images.githubusercontent.com/45934117/90552601-0dd81900-e1ce-11ea-8e11-8e4d160c8b4f.png)

`src/main/docs/asciidoc`와 같이 디렉토리를 만들고 `*.adoc`파일을 만들어 준다. (ex. api-docs.adoc)

`*.adoc`를 작성한다. ([Asciidoctor User Manual](https://asciidoctor.org/docs/user-manual/#introduction-to-asciidoctor) 참고)

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

IntelliJ를 사용한다면 plugins에서 AsciiDoc를 설치하면 미리보기를 지원받는다. (사용하는 것을 추천한다.👍👍)

![image](https://user-images.githubusercontent.com/45934117/90552659-23e5d980-e1ce-11ea-9e5c-1eea03b10ce0.png)

코드를 작성하면 다시 한번 build한다. 그러면 `build/asciidoc/html5`와 `src/main/resources/static/docs`에 `html` 파일이 생길 것이다.

마지막으로 서버를 실행 시키고 `http://localhost:8080/docs/api-docs.html`로 이동하면 문서가 잘 나오는 것을 확인할 수 있다.

![image](https://user-images.githubusercontent.com/45934117/90552724-3eb84e00-e1ce-11ea-991e-3aa80f6658d1.png)

**잠깐!!!**

만약 아래와 같이 나온다면

![image](https://user-images.githubusercontent.com/45934117/90552813-598ac280-e1ce-11ea-8783-61abdc60dd56.png)

`src/main/docs/asciidoc`있는 `*.adoc` 파일에 아래 코드를 최상단에 넣어주자.

```
ifndef::snippets[]
:snippets: ../../../build/generated-snippets
endif::[]
```

적용하면 다음과 같다.

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

## 참고자료

[Spring REST Docs](https://docs.spring.io/spring-restdocs/docs/2.0.4.RELEASE/reference/html5/)

[Gradle Multi Module에서 Spring Rest Docs 사용하기](https://jojoldu.tistory.com/294)

[Getting started with Spring REST Docs](https://medium.com/@nshmura.s/getting-started-with-spring-rest-docs-7c3b70c5bb82)

[Asciidoctor User Manual](https://asciidoctor.org/docs/user-manual/#introduction-to-asciidoctor)