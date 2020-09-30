---
layout: post  
title: "제네릭을 사용하여 테스트 중복 제거하기!"  
author: "카일"
comment: "true"
tags: ["refactoring" ,"test"]
toc: true
---

## 문제 상황

>안녕하세요. 👨‍💻 **이번 포스팅에서는 반복되는 테스트를 어떻게 추상화할까?** 라는 고민에 대한 글입니다. 아래의 테스트를 모두 작성하는 과정에서 중복 코드가 발생하고 테스트 코드가 유지보수 하기 어려워졌습니다. 
- 인수테스트
- 컨트롤러 테스트
- 서비스 테스트 & 도메인 테스트
- 리파지토리 테스트(커스텀 메소드가 추가되는 경우)

>그래서 **테스트를 Generic을 사용해서 일반화 해보면 어떨까?** 라고 생각하게 되었고 이를 코드로 옮긴 부분을 공유하고자 한다.



## 문제의 코드

대표적으로 중복이 발생하는 부분은 도메인별 CRUD(Create, Read, Update, Delete)메소드이다. **인수 테스트와 컨트롤러 테스트에서 대부분 비슷한 요청을 보내고 비슷한 응답에 대해서 처리하는 것을 발견**했다. 

아래의 코드는 리팩토링 하기 전의 코드이다. 아래와 Post에 대한 코드뿐 아니라 모든 도메인의 Get, Put, Patch, Delete 요청에 대한 부분이 중복되었었다.

- Controller - POST

```java
@DisplayName("회원을 정상적으로 생성한다.")  // Controller Test
    @Test
    void create() throws Exception {
        when(bearerInterceptor.preHandle(any(), any(), any())).thenReturn(true);
        when(memberService.createMember(any())).thenReturn(MemberFixture.createResponse());

        return mockMvc.perform(post("/api/members")
            .header(HttpHeaders.AUTHORIZATION, LoginFixture.getUserTokenHeader())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsBytes(MemberFixture.createMemberRequest()))
        )
            .andExpect(status().isCreated())
            .andExpect(header().string(HttpHeaders.LOCATION, "/api/members/1");
    }

```

- Acceptance - POST

```java
protected Long createMember(MemberCreateRequest memberRequest) {
        String response = given()
            .contentType(MediaType.APPLICATION_JSON_VALUE)
            .body(memberRequest)
            .when()
            .post("/api/members")
            .then()
            .log().all()
            .statusCode(HttpStatus.CREATED.value())
            .extract().header(HttpHeaders.LOCATION);

        return Long.parseLong(response.substring("/api/members/1".length() - 1));
}
```

## 해결 - 제네릭 사용

위의 코드에서 다른 도메인을 테스트 하더라도, 달라지는 부분은 Request, Path, Header 정도를 제외하고는 거의 존재하지 않는다. 이에 `제네릭을 사용해서 다양한 타입을 커버할 수 있도록 작성하면 어떨까`라는 생각을 하게 되었고 아래의 코드로 리팩토링을 해보았다.

- Controller - POST, PUT (Get과 Delete도 동일한 방식입니다. 길이가 길어 두개만 작성하였습니다)

```java
protected <T> ResultActions doPost(String path, T request) throws Exception {
        return mockMvc.perform(post(path)
            .header(HttpHeaders.AUTHORIZATION, LoginFixture.getUserTokenHeader())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsBytes(request))
        )
            .andExpect(status().isCreated())
            .andExpect(header().string(HttpHeaders.LOCATION, path + "/1"));
}

protected <T> ResultActions doPut(String path, T request) throws Exception {
        return mockMvc.perform(put(path)
            .header(HttpHeaders.AUTHORIZATION, LoginFixture.getUserTokenHeader())
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsBytes(request))
        )
            .andExpect(status().isNoContent());
}
```

- Acceptance - GET, DELETE

```java
protected <T> T doGet(String path, Header header, Class<T> response) {
        return given()
            .header(header)
            .accept(MediaType.APPLICATION_JSON_VALUE)
            .when()
            .get(path)
            .then()
            .log().all()
            .statusCode(HttpStatus.OK.value())
            .extract().as(response);
}
protected <T> void doDelete(String path, Header header) {
        given()
            .header(header)
            .when()
            .delete(path)
            .then()
            .log().all()
            .statusCode(HttpStatus.NO_CONTENT.value());
}
```

## 사용하기 편한 코드

위와 같이 상위 타입에서 제네릭을 통해 CRUD를 일반화하고, 이를 상속받아 사용함으로써 각 도메인의 Controller와 AcceptanceTest는 많은 중복이 제거 되었다. 모든 도메인의 CRUD는 아래의 메소드에 적절한 타입만 넣어준다면 테스트가 가능해졌다!

- **doPost(String path, T request, Header header)**
- **doGet(String path, Header header Class< T > response)**
- **doPut(String path, Header header, T request)**
- **doPatch(String path, Header header, T request)**
- **doDelete(String path, Header header)**

```java
@DisplayName("회원을 정상적으로 생성한다.")
@Test
void create() throws Exception {
    when(bearerInterceptor.preHandle(any(), any(), any())).thenReturn(true);
    when(memberService.createMember(any())).thenReturn(MemberFixture.createResponse());
    doPost(BASE_PATH, MemberFixture.createMemberRequest());
}
```

## 결론

API에 따라서 그리고 비즈니스 로직에 따라서 변경되는 로직까지는 추상화하기 힘들 것 같다. 하지만 기본적인 CRUD는 대부분의 도메인에서 제공하고 있기 때문에 '이를 추상화하는 것은 범용적으로 사용할 수 있지 않을까' 라고 생각하여 위와 같이 리팩토링을 해보았다. 위와 같은 추상화를 통해 제가 얻을 수 있는 장점은 이런 것들이 있는 것 같다. 

- 중복의 제거 - 6개의 도메인인데도 행복해졌어요...
- API 스펙 및 테스트 일관성 -  HTTP Method별로 반환하는 응답 코드를 통일할 수 있다.
- 사용 편의성 - 도메인이 50개라면 동일한 CRUD를 모두 테스트하는 것이 매우 힘든 작업일 것 같다. 위와 같이 추상화한다면 조금 더 편리하게 작업할 수 있지 않을까라고 생각해본다.
