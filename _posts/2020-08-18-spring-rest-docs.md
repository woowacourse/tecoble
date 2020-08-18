---
layout: post
title: "Spring REST Docs"
author: "티거"
comment: "true"
tags: ["spring"]
---

**"API 문서를 자동화한다."**라고 하면 `Spring REST Docs`와 `Swagger`를 많이 사용할 것이다. 이번 글에서는 `Spring REST Docs`다뤄볼 것이다. 그럼 `Swagger`대신 `Spring REST Docs`를 왜 사용하고, 어떻게 사용하는 지 알아 볼 것이다.

## 왜 사용할까?

Spring Rest Docs의 대표적인 장점은 다음과 같다.

- 테스트가 성공해야 문서 작성됨
- 실제 코드에 추가되는 코드가 없음

말 그대로 테스트가 성공하지 못하면 문서를 만들 수 없고, Swagger같이 어노테이션을 붙일 필요가 없기에 실제코드에 영향을 주지 않는다.

~~단점으로는 적용하기 어렵다...~~

##  어떻게 사용할까?

작업 환경은 이러하다.

- Spring Boot - 2.3.3
- Gradle - 6.4.1
- JUnit5
- MockMvc

### build.gradle 설정

먼저 Spring Rest Docs를 사용하기 위해 build.gradle 설정을 **추가**한다.

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

여기서

```
from ("${asciidoctor.outputDir}/html5") { 
	into 'static/docs'
}
```

해당 설정은 `build/asciidoc/html5/`에 `html`파일의 문서가 만들어 지면 `src/main/resources/static/docs`로 복사를 해주겠다는 의미이다.

(위 같이 설정을 해도 복사가 되지 않았다...😭😭)

나와 같이 설정을 해도 **복사가 안되는 분**은 다음과 같이 설정하자!!

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

이제 테스트 코드를 작성해보자.

우선 CREATE부터 설명하겠다.

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

2. CREATE는 RequestBody를 받기 때문에 content에 해당 들어오는 값을 넣어 준다.

   ```json
   {
       "title": "title",
       "content": "content"
   }
   ```

3. create는  application/json 형식으로 요청을 받는다.

4. 정상적으로 동작시 `isCreated`상태 코드를 보낸다.

5. documentation의 이름

6. create의 requestFields로 무엇을 받는지 설정해준다.

7. RequestBody 정보를 보면 CREATE는 `title`과 `content`를 받는다. `fieldWithPath`는 key값을, `description`는 `fieldWithPath`에 내용에 대한 설명을 쓴다.

8. Test를 할 때 만약 `content`의 값이 없다면 테스트는 실패할 것이다. 따라서 `content`와 같이 `null`일 수 있다면 `optional()`을 붙여주면 된다.

다음으로 READ이다. (중복되는 설명은 제외하겠습니다.😂😂)

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
2. responseFields로 무엇을 보내는지 설정해준다.
3. 설명은 create의 7번과 같고, List형식은 `[].id`과 같이 앞에 `[]`를 해야한다.
4. PathVariable로 받는 값(`postResponse.getId()`)을 넣어준다.
5. findById는 PathVariable를 받는다. PathVariable로 무엇을 받는 지 설정해준다.
6. pathParameters는 parameterWithName로 PathVariable의 Name(postId)을 쓴다.

이제 이전 설명들을 토대로 UPDATE와 DELETE를 작성할 수 있다.

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

build를 하면 다음과 같이 생길 것이다.

![snippets 생성 파일](../images/2020-08-18-spring-rest-docs1.png)

`src/main/docs/asciidoc`같이 디렉토리를 만들고 `*.adoc`파일을 만들어 준다. (ex. api.adoc)

[Asciidoctor User Manual](https://asciidoctor.org/docs/user-manual/#introduction-to-asciidoctor)를 보며 작성한 간단한 코드이다.

 ```
= Spring REST Docs
:toc: left
:toclevels: 2
:sectlinks:

[[resources-post]]
== Post

[[resources-post-create]]
=== Post 생성
operation::post-create[snippets='http-request,http-response']
 ```

IntelliJ를 사용한다면 plugins에서 AsciiDoc 제공한다. (사용하는 것을 추천한다.)

![plugins의 AsciiDoc 사용](../images/2020-08-18-spring-rest-docs2.png)

build를 하면 `src/main/resources/static/docs`에 `html` 파일이 생긴다.

서버를 실행 시키고 `http://localhost:8080/docs/api-docs.html`로 이동하면 문서가 잘 나오는 것을 확인할 수 있다.

![브라우저에서 본 Rest docs](../images/2020-08-18-spring-rest-docs3.png)

## 참고자료

[Spring REST Docs](https://docs.spring.io/spring-restdocs/docs/current-SNAPSHOT/reference/html5/)

[Gradle Multi Module에서 Spring Rest Docs 사용하기](https://jojoldu.tistory.com/294)

[Getting started with Spring REST Docs](https://medium.com/@nshmura.s/getting-started-with-spring-rest-docs-7c3b70c5bb82)

[Asciidoctor User Manual](https://asciidoctor.org/docs/user-manual/#introduction-to-asciidoctor)