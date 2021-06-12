---
layout: post  
title: DTO의 사용 범위에 대하여
author: [3기_케빈]
tags: ['java', 'dto', 'spring', 'mvc', 'layered architecture']
date: "2021-04-25T12:00:00.000Z"
draft: false
image: ../teaser/dto-layered.png
---

## 1. DTO란?

DTO(Data Transfer Object)란 계층간 데이터 교환을 위해 사용하는 객체(Java Beans)입니다. 간략하게 DTO의 구체적인 용례 및 필요성을 **MVC 패턴**을 통해 알아볼까요? 🚀

### 1.1. MVC 패턴

![MVC-Pattern](../images/2021-04-25-mvc-pattern.png)

MVC 패턴은 어플리케이션을 개발할 때 그 구성 요소를 Model과 View 및 Controller 등 세 가지 역할로 구분하는 디자인 패턴입니다. 비즈니스 처리 로직(Model)과 UI 영역(View)은 서로의 존재를 인지하지 못하고, Controller가 중간에서 Model과 View의 연결을 담당합니다.

Controller는 View로부터 들어온 사용자 요청을 해석하여 Model을 업데이트하거나 Model로부터 데이터를 받아 View로 전달하는 작업 등을 수행합니다. MVC 패턴의 장점은 Model과 View를 분리함으로써 서로의 의존성을 낮추고 독립적인 개발을 가능하게 합니다.

Controller는 View와 도메인 Model의 데이터를 주고 받을 때 별도의 **DTO** 를 주로 사용합니다. 도메인 객체를 View에 직접 전달할 수 있지만, 민감한 도메인 비즈니스 기능이 노출될 수 있으며 Model과 View 사이에 의존성이 생기기 때문입니다. 물론 소규모 프로젝트는 [DTO 사용이 불필요한 경우](http://guntherpopp.blogspot.com/2010/09/to-dto-or-not-to-dto.html)도 있습니다.

### 1.2. 용례

> User.java

```java
public class User {

    public Long id;
    public String name;
    public String email;
    public String password; //외부에 노출되서는 안 될 정보
    public DetailInformation detailInformation; //외부에 노출되서는 안 될 정보

    //비즈니스 로직, getter, setter 등 생략
}
```

> UserController.java

```java
@GetMapping
public ResponseEntity<User> showArticle(@PathVariable long id) {
    User user = userService.findById(id);
    return ResponseEntity.ok().body(user);
}
```

이처럼 Controller가 클라이언트의 요청에 대한 응답으로 도메인 Model인 User를 넘겨주면 어떤 문제점이 있을까요?

* 도메인 Model의 모든 속성이 외부에 노출됩니다.
  * UI 화면마다 사용하는 Model의 정보는 상이하지만, Model 객체는 UI에서 사용하지 않을 불필요한 데이터까지 보유하고 있습니다.
  * 비즈니스 로직 등 User의 민감한 정보가 외부에 노출되는 보안 문제와도 직결됩니다.
* UI 계층에서 Model의 메서드를 호출하거나 상태를 변경시킬 위험이 존재합니다.
* Model과 View가 강하게 결합되어, View의 요구사항 변화가 Model에 영향을 끼치기 쉽습니다.
  * 또한 User Entity의 속성이 변경되면, View가 전달받을 JSON 및 프론트엔드 Js 코드에도 변경을 유발하기 때문에 상호간 강하게 결합됩니다.

> UserDto.java

```java
public class UserDto {

    public final long id;
    public final String name;
    public final String email;

    //생성자 생략

    public static UserDto from(User user) {
        return new UserDto(user.getId(), user.getName(), user.getEmail());
    }
}
```

> UserController.java

```java
@GetMapping
public ResponseEntity<UserDto> showArticle(@PathVariable long id) {
    User user = userService.findById(id);
    return ResponseEntity.ok().body(UserDto.from(user));
}
```

반면 DTO를 사용하면 앞서 언급된 문제들을 쉽게 해결할 수 있습니다. 도메인 Model을 캡슐화하고, UI 화면에서 사용하는 데이터만 선택적으로 보낼 수 있습니다.

정리해보자면 DTO는 클라이언트 요청에 포함된 데이터를 담아 서버 측에 전달하고, 서버 측의 응답 데이터를 담아 클라이언트에 전달하는 계층간 전달자 역할을 합니다.

<br>

## 2. DTO를 어디까지 사용하지?

Spring Framework로 웹 어플리케이션을 제작하는 도중, DTO의 사용 범위에 대해 의문이 생겼습니다.

* Model 계층과 View 계층 사이에서의 DTO 사용은 알겠는데... 😔
* Layered Architecture 상의 계층들에서는 DTO를 어떻게 사용해야 하지? 😳

### 2.1. Layered Architecture

![Layered-Architecture](../images/2021-04-25-layered-architecture.png)

MVC 패턴에서 Controller가 도메인 Model 객체들의 조합을 통해 프로그램의 작동 순서나 방식을 제어하는데, 어플리케이션의 규모가 커진다면 Controller는 중복되는 코드가 많아지고 비대해질 것입니다.

Layered Architecture는 유사한 관심사들을 레이어로 나눠서 추상화하여 수직적으로 배열하는 아키텍처입니다. 하나의 레이어는 자신에게 주어진 고유한 역할을 수행하고, 인접한 다른 레이어와 상호작용합니다. 이렇게 시스템을 레이어로 나누면 시스템 전체를 수정하지 않고도 특정 레이어를 수정 및 개선할 수 있어 재사용성과 유지보수에 유리합니다.

이 글을 읽는 분들은 아마 Controller - Service - Repository 계층에 익숙하실겁니다. 😁

### 2.2. 의문점

> ArticleController.java

```java
@PostMapping
public ResponseEntity<ArticleResponseDto> createArticle(@RequestBody ArticleRequestDto articleRequestDto) {
    //로직 생략
    Article article = articleRequestDto.toEntity();
    Article savedArticle = articleService.createArticle(article);
    ArticleResponseDto articleResponseDto = ArticleResponseDto.from(savedArticle);
    return ResponseEntity.ok().body(articleResponseDto);
}
```

> ArticleService.java

```java
public Article createArticle(Article article) {
    //로직 생략
    return articleRepository.save(article);
}
```

위 코드는 다음과 같은 로직을 가지고 있습니다.

* View로부터 받아온 DTO를 Controller에서 Domain(Entity)으로 변환하고 Service 레이어에게 이를 전달하여 작업을 수행합니다.
* Service 레이어는 Controller에게 Domain으 반환하고, Controller는 Domain을 DTO로 변환해 View에게 응답을 보냅니다.

그런데 DTO를 학습하면서, **"꼭 DTO와 Domain간의 변환 위치가 Controller(표현 계층)여야 하는가?"** 라는 궁금증이 들었습니다.

> ArticleService.java

```java
public ArticleDto createArticle(ArticleDto articleRequestDto) {
    Article article = articleRequestDto.toEntity();
    //로직 생략
    return ArticleDto.from(articleRepository.save(article));
}
```

이처럼 Service 레이어가 요청으로 DTO를 받고 응답으로 DTO를 보내줘도 동작에 문제가 없기 때문입니다. 또한 DTO가 일반적으로 계층간 데이터 전달을 위해 사용되기 때문에, 표현 계층과 응용 계층 사이에서 Entity가 아닌 DTO를 사용하는 것이 더 자연스럽지 않을까 하는 생각이 들었습니다.

DTO를 어느 레이어까지 전달해서 사용해야 하며, DTO와 Domain(Entity) 간의 변환 작업은 어디에서 수행되어야 할까요? 즉, Domain을 어느 계층까지 노출해도 될까요?

<br>

## 3. Repository

> ”…a cohesive set of responsibilities for providing access to the roots of AGGREGATES from early life cycle through the end” - [Evans](https://www.oreilly.com/library/view/domain-driven-design-tackling/0321125215/ch06.html)

Repository 레이어는 Entity의 영속성을 관장하는 역할이라고 명시되어 있습니다. 이로 인해, 표현 계층에서 사용할 도메인 계층의 Aggregates를 DTO로 변환하는 작업을 Repository 단에서 책임지게 하는 것을 지양하자는 의견이 다수 존재했습니다.

실제로 이 글을 작성하면서 DTO와 Entity간의 변환과 관련된 여러 문서들을 참조했는데, 모두가 변환 로직을 Controller 혹은 Service 레이어에 위치시켰습니다. 그렇다면 DTO의 사용 범위 및 Entity간의 변환 위치는 Controller와 Service 중 어느 곳이 적합할까요? 🧐

<br>

## 4. Service

> A Service Layer defines an application's boundary [Cockburn PloP] and its set of available operations from the perspective of interfacing client layers. It encapsulates the application's business logic, controlling transactions and coor-dinating responses in the implementation of its operations.

마틴 파울러는 Service 레이어란 어플리케이션의 경계를 정의하고 비즈니스 로직 등 도메인을 캡슐화하는 역할이라고 정의합니다. 즉, 도메인을 보호합니다. 도메인 Model을 표현 계층에서 사용하는 경우 결합도가 증가하여, 도메인의 변경이 Controller의 변경을 촉발하는 유지보수의 문제로 이어질 수 있습니다.

이러한 관점에서 바라볼 때, 레이어간 데이터 전달 목적으로 DTO를 엄격하게 고수한다면 변환 로직이 Service 레이어에서 정의되어야 한다는 의견이 존재했습니다. 요청에 대한 응답 역시 Service 레이어의 일부분이기 때문입니다.

### 4.1. Service가 DTO를 반환하는 경우

> ArticleController.java

```java
Article savedArticle = articleService.createArticle(article);
ArticleResponseDto articleResponseDto = ArticleResponseDto.from(savedArticle);
```

Service 레이어가 도메인 Model을 Controller로 반환하고, Controller가 Entity를 DTO로 변환하는 경우를 생각해봅시다. 이 때 예상되는 문제점은 무엇이 있을까요?

* View에 반환할 필요가 없는 데이터까지 Domain 객체에 포함되어 Controller(표현 계층)까지 넘어옵니다.
* Controller가 여러 Domain 객체들의 정보를 조합해서 DTO를 생성해야 하는 경우, 결국 Service(응용 계층) 로직이 Controller에 포함되게 됩니다.
* 여러 Domain 객체들을 조회해야 하기 때문에 하나의 Controller가 의존하는 Service의 개수가 비대해집니다.

하지만 Service 레이어가 DTO를 반환한다면 이러한 단점을 쉽게 상쇄할 수 있습니다.

### 4.2. Service가 DTO를 사용하는 경우

> ArticleController.java

```java
Article article = articleRequestDto.toEntity();
articleService.deleteArticle(article);
```

Controller가 View로부터 받은 DTO를 Entity로 변환한 뒤, Service 레이어가 Entity를 전달받아 일련의 비즈니스 로직을 수행한다고 가정해봅시다.

위 예제는 Controller에서 DTO를 Entity로 간단하게 변환했지만, 복잡한 어플리케이션의 경우 Controller가 View에서 전달받은 DTO만으로 Entity를 구성하기란 어렵습니다. Repository를 통해 여러 부수적인 정보들을 조회하여 Domain 객체를 구성할 수 있는 경우도 존재하기 때문입니다.

> ArticleService.java

```java
public Article createArticle(LoginUser loginUser, ArticleDto articleDto) {
    //복잡한 로직이 존재한다고 가정...
    Tags tags = tagService.findTagsByTagColor(articleDto.getTagColor());
    List<History> history = loginUser.findFormerHistories(tags);
    Article article = new Article(articleDto.getId(), articleDto.getName(), articleDto.getContent(), tags, history);
    return articleRepository.save(article);
}
```

Controller에서 DTO를 완벽하게 Domain 객체로 구성한 뒤 Service에 넘겨주려면, 복잡한 경우 Controller가 여러 Service(혹은 Repository)에 의존하게 됩니다. 이러한 경우 DTO를 Service에게 넘겨주어 Service가 Entity로 변환시키도록 하는 것이 더 나은 방안이라 사료됩니다.

<br>

## 5. 마치며

관련 자료들을 찾아볼수록 DTO-Entity 간의 변환 위치는 Service 레이어가 타당해보이는데요. 이러한 궁금증에 대해 리뷰어님께서 짧은 피드백을 남겨주셨습니다.

![reviewer-feedback](../images/2021-04-25-dto-reviewer-feedback.png)

Entity를 어느 계층까지 노출해야 하는가는 프로젝트의 규모와 아키텍쳐의 방향 등을 종합적으로 고려해서 고민할 문제라고 생각합니다. 여러분들의 생각은 어떠신가요? Javable 독자분들의 의견을 남겨주세요!

<br>

---

## Reference

* [A Better Way to Project Domain Entities into DTOs](https://buildplease.com/pages/repositories-dto/)
* [Spring Entities should convert to Dto in service?](https://stackoverflow.com/questions/34084203/spring-entities-should-convert-to-dto-in-service)
* [DTO, Domain Object, Converter](https://github.com/HomoEfficio/dev-tips/blob/master/DTO-DomainObject-Converter.md)
* [Entity To DTO Conversion for a Spring REST API](https://www.baeldung.com/entity-to-and-from-dto-for-a-java-spring-application)
* [DTO는 어느 레이어까지 사용하는 것이 맞을까?](https://www.slipp.net/questions/93)
* [Should services always return DTOs, or can they also return domain models?](https://stackoverflow.com/questions/21554977/should-services-always-return-dtos-or-can-they-also-return-domain-models)
* [Service Layer](https://martinfowler.com/eaaCatalog/serviceLayer.html)
* [Popular 3 Layer Architecture every developer must know](https://techdora.com/3-layer-architecture-every-developer-must-know/)
* [모델-뷰-컨트롤러](https://ko.wikipedia.org/wiki/%EB%AA%A8%EB%8D%B8-%EB%B7%B0-%EC%BB%A8%ED%8A%B8%EB%A1%A4%EB%9F%AC)
* [Spring Layered Architecture](https://yoonho-devlog.tistory.com/25)
