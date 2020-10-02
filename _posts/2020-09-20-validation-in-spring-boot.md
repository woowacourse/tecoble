---
layout: post
title: "How to validate DTO objects in Spring Boot"
author: "티거"
comment: "true"
tags: ["spring", "validation"]
toc: true
---

검증이 왜 필요할까?

나이를 입력해야 하는 데 이름을 입력한다면? 전화번호를 입력해야 하는 데 이메일을 입력한다면? 데이터를 저장할 때 당신은 아무 값이나 저장할 것인가? 

아니다. 입력 값이 유효한 값인지 확인을 하고 저장할 것이다. 그래서 제목에서 알 수 있듯이 객체의 유효성 검사를 어떻게 하는지, 그리고 Test 코드는 어떻게 작성하는지 알아볼 것이다.

일단 의존성부터 추가해보자.

```java
implementation 'org.springframework.boot:spring-boot-starter-validation'
```

다음으로 `DTO`를 작성할 건데, "title은 빈 값이 될 수 없다."라고 가정해보자.

```java
public class PostRequest {

    @NotEmpty
    private String title;
    private String content;
    
    // ...
}
```

Validation를 제공하는 어노테이션은 많다. (@Email, @URL 등... [참조](https://www.baeldung.com/javax-validation)) 그중 @NotEmpty는 title이 빈 값("")인지 검증해 주는 어노테이션이다.

다음으로 `Controller`를 작성해보자.

```java
@RequestMapping("/posts")
@RestController
public class PostController {

    private final PostService postService;

    public PostController(final PostService postService) {
        this.postService = postService;
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(@RequestBody @Valid final PostRequest postRequest) {
        final PostResponse postResponse = postService.create(postRequest);
        return ResponseEntity.created(URI.create("/posts/" + postResponse.getId())).build();
    }
    
    // ...
}
```

`create`메서드에 @Valid가 보이는가? DTO 맴버변수에 @NotEmpty를 했다고 해서 Spring이 알아서 검증해주는 것이 아니다. 위의 `create`와 같이 검증할 파라미터 앞에 @Valid를 추가해야 검증을 할 수 있다.

유효성 검사를 한다는 것은 잘못된 입력이 들어올 수 있다는 이야기이다. 따라서 유효성 검사 오류에 대한 처리도 해야 할 것이다. 

```java
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<Map<String, String>> handleValidationExceptions(
    MethodArgumentNotValidException exception) {
    Map<String, String> errors = new HashMap<>();
    exception.getBindingResult().getAllErrors().forEach((error) -> {
        String fieldName = ((FieldError) error).getField();
        String errorMessage = error.getDefaultMessage();
        errors.put(fieldName, errorMessage);
    });
    return ResponseEntity.badRequest().body(errors);
}
```

오류에 대한 `ExceptionHandler`를 작성하였다. 유효성 검사에 대한 예외는 `MethodArgumentNotValidException`를 발생한다. 또한, 잘못된 요청에 대한 응답이기 때문에 상대 코드는 400(Bad Request)이다. 상황에 따라 어떤 상태코드를 넘겨줘야 할지 모르시는 분들은 이 글(우의 글이 올라가면 링크로 달 예정)을 참고하길 바란다.

이것으로 여러분은 `Controller`에서 인자를 받을 때 검증을 할 수 있게되었다. 그러면 당연히 Test 해봐야하지 않겠나.

```java
@AutoConfigureMockMvc
@SpringBootTest
public class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void create_success() throws Exception {
        this.mockMvc.perform(post("/posts")
                .content("{\"title\": \"title\", \n\"content\": \"content\"}")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isCreated());
    }

    @Test
    void create_fail() throws Exception {
        this.mockMvc.perform(post("/posts")
                .content("{\"title\": \"\", \n\"content\": \"content\"}")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", Is.is("must not be empty")));
    }
}
```

비교를 위해 정상적인 요청과 비정상적인 요청 둘 다 작성하였다. `create_fail`은 입력 `title`에 빈값이기 때문에 검증이 실패할 것이고, `ExceptionHandler`에서 상태 코드로 400(Bad Request)을 보내기 때문에 `status().isBadRequest()`이렇게 설정한 것이다. 마지막 `jsonPath`는`ExceptionHandler`의 반환 값 `errors`를 생각하시면 되고, 우리는 `title`이 검증에 실패하기 때문에 `errors`에는 `title`이 있을 것이다. `Is.is("must not be empty")`이 부분은 검증 실패 시 보여주는 메시지를 검증하는 것이다.

 "must not be empty"는 default message이다. 만약 바꾸고 싶다면,

```java
@NotEmpty(message = "Post's title must not be empty")
```

이런식으로 바꿀 수 있다.

`Controller`말고 `DTO`에서 테스트할 순 없을까?

```java
public class PostRequestTest {

    @Test
    void notEmpty_validation() {
        PostRequest postRequest = new PostRequest("", "content");
		// ...
    }
}
```

이렇게 작성해도 `Controller`처럼 검증이 실패되지 않을 것이다. 이 `DTO`가 검증이 실패했는지 판단하려면 추가되는 로직이 있다.

```java
public class PostRequestTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    public static void init() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void notEmpty_validation() {
        PostRequest postRequest = new PostRequest("", "content");
        Set<ConstraintViolation<PostRequest>> violations = validator.validate(postRequest);
    }
}
```

`validator.validate(postRequest)`이 `postRequest`가 유효한지 판단해 준다. 만약 유효하다면 `violations`는 빈 값일 것이고, 유효하지 않다면 값을 가지고 있을 것이다.

`violations`가 가지고있는 에러 메시지를 확인하고 싶다면 다음과 같이 하면된다.

```java
for (ConstraintViolation<PostRequest> violation : violations) {
    System.err.println(violation.getMessage());
}
```

## 마무리

검증 관련 어노테이션을 많이 사용했지만, 테스트까지 한 적은 없었다. 이번 프로젝트를 통해 검증에 대해 테스트를 하는 방법을 알게 되었고 적용하였다. 또 그것을 나누기 위해 글을 작성해보았다. 꼼꼼하게 Test Code를 작성하며 우리 모두 안전하고 신뢰성 있는 코드를 작성하기 위해 노력하자. 

## 참고자료

[Validation in Spring Boot](https://www.baeldung.com/spring-boot-bean-validation)

[Java Bean Validation Basics](https://www.baeldung.com/javax-validation)