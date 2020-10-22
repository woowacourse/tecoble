---
layout: post
title: "요청과 응답으로 엔티티(Entity) 대신 DTO를 사용하자"
author: "보스독"
comment: "true"
tags: ["DTO", "Entity"]
toc: true
---



처음 웹 애플리케이션을 개발하다보면, 많이 하는 실수 중 하나가 바로 요청과 응답으로 엔티티를 직접 사용하는 것이다.

다음은 컨트롤러에서 요청과 응답으로 엔티티를 직접 사용했을 때의 코드이다. 

``` 	java
@GetMapping("/lines/{id}")
public ResponseEntity<Line> read(@PathVariable("id") Long id) {
  Line line = lineService.readLine(id);
  return ResponseEntity.ok(line);
}
```

여러분은 혹시 이렇게 코드를 작성하고 있지 않은가?
만약 고개를 끄덕였다면 지금 당장 이 글을 끝까지 읽기 바란다.

위와 같이 엔티티를 직접 사용하는 방식보다 더 좋은 방식이 있다.
그것은 바로 DTO를 정의하여 요청과 응답의 객체로 사용하는 것이다.

``` Java
@GetMapping("/lines/{id}")
public ResponseEntity<LineResponseDto> read(@PathVariable("id") Long id) {
  LineResponseDto line = lineService.readLine(id);
  return ResponseEntity.ok(line);
}
```

> 혹자는 DTO 대신 Map을 사용하기도 하지만 필자는 DTO를 더 권장하기 때문에 여기서는 언급을 생략하도록 하겠다.

그렇다면 왜 이처럼 귀찮게 DTO를 만들어서 코드를 작성하는 것이 더 좋은 것일까?

지금부터 그 이유를 알아보도록 하자.



### 1. 엔티티 내부 구현을 캡슐화할 수 있다.

엔티티가 getter와 setter를 가지고 있다면 충분히 데이터 전달 역할도 할 수 있지 않을까?

여기서 엔티티란 도메인의 핵심 로직과 속성을 가지고 있고, 실제 DB의 테이블과 매칭되는 클래스이다. 

그렇기 때문에 엔티티가 getter와 setter를 갖게 된다면, controller와 같은 비즈니스 로직과 크게 상관없는 곳에서 자원의 속성이 실수로라도 변경될 수 있다. 또한 엔티티를 UI계층에 노출하는 것은 테이블 설계를 화면에 공개하는 것이나 다름없기 때문에 보안상으로도 바람직하지 못한 구조가 된다. 

따라서 엔티티의 내부 구현을 캡슐화하고 UI계층에 노출시키지 않아야하는 것은 충분히 데이터 전달 역할로 DTO를 사용해야 할 이유로 볼 수 있다.



### 2. 화면에 필요한 데이터를 선별할 수 있다.

애플리케이션이 확장되면 엔티티의 크기는 점차 커지게 된다. 엔티티의 크기만 커질까?

화면도 다양해지고, API 스펙도 더 많아질 것이다. 이때 요청과 응답으로 엔티티를 사용한다면, 요청하는 화면에 필요하지 않은 속성까지도 함께 보내지게 된다.

예를 들어 단순히 사용자의 이름만 보여주면 되는 상황에서 필요 이상으로 사용자가 가지고 있는 다른 속성들까지 항상 데이터 전송에 참여하게 되는 것이다. 

이처럼 모든 API 요청과 응답에서 엔티티의 모든 속성이 함께 전송되기 때문에 당연히 속도도 느려질 수 밖에 없다.

물론 엔티티에서도 `@JsonIgnore`같은 어노테이션을 사용하면 화면으로 보내지 않을 속성을 지정할 수 있는데, 이 역시 근본적인 해결책이 될 수는 없다. 

아래 예시로 작성된 User 엔티티 코드를 보자. 

대학(College)과 나이(Age) 속성을 화면에 노출시키지 않도록 `@JsonIgnore` 어노테이션을 추가한 상황이다. 

우리는 User 엔티티를 처음 보았을 때 두 가지 문제점을 확인할 수 있다. 

1. 어떤 속성이 화면으로 보내지는 지 혹은 무시되고 있는지 한 눈에 알아보기 어렵다.
2. User가 사용되는 다양한 API에 따른 필요한 속성들을 동적으로 선택할 수 없다. 

```java
@Entity
public class User {
  @Id
  private Long id;
  
  private UserName username;
  
  private Team team;
  
  @JsonIgnore
  private College college;
  
  private Major major;
  
  @JsonIgnore
  private Age age;
}
```

하지만 만약 특정 API에 필요한 데이터를 포함한 DTO를 별도로 만들면, 화면에서 요구하는 필요한 데이터들만 선별하여 요청과 응답을 할 수 있는 장점이 있다.

``` java
@AllArgsConstructor
@Data
public class UserResponse {
  private Long id;
  private UserName username;
  private Team team;
  private Major major;
  private Age age;
}
```



### 3. 순환참조를 예방할 수 있다.

JPA로 개발할 때, 양방향 참조를 사용했다면 순환참조를 조심해야 한다는 것은 아마 많은 개발자들이 알고 있는 사실일 것이다.

이 때, 양방향 참조된 엔티티를 컨트롤러에서 응답으로 return하게 되면, 엔티티가 참조하고 있는 객체는 지연 로딩되고, 로딩된 객체는 또 다시 본인이 참조하고 있는 객체를 호출하게 된다. 이렇게 서로 참조하는 객체를 계속 호출하면서 결국 무한 루프에 빠지게 되는 문제를 낳게된다. 

물론 이 순환참조의 근본적인 원인은 양방향 매핑 자체에 있다고도 할 수 있지만, 양방향 참조가 부득이한 상황이라면 순환참조가 일어나지 않도록 응답의 return으로 DTO로 두는 것이 더 안전하다고 할 수 있다.



### 4. validation 코드와 모델링 코드를 분리할 수 있다.

엔티티 클래스는 DB의 테이블과 매칭되는 필드가 속성으로 선언되어 있고, 복잡한 비즈니스 로직이 작성되어있는 곳이다. 

그렇기 때문에, 속성에는  `@Column`, `@JoinColumn` , `@ManyToOne`, `@OneToOne` 등의 모델링을 위한 코드가 추가된다.

여기에 만약 `@NotNull`, `@NotEmpty`, `@NotBlank` 등과 같은 요청에 대한 값의 validation코드가 들어간다면 엔티티 클래스는 더 복잡해지고 그만큼 가독성이 저하된다.

이때, 각각의 요청에 필요한 validation을 DTO에서 정의한다면, 엔티티 클래스를 좀 더 모델링과, 비즈니스 로직에만 집중되도록 만들 수 있다.

``` java
@NoArgsConstructor
@Data
public class UserRequest {

  @NotBlank
  private String username;
  
  private String college;
  
  @NotBlank
  private String major;
  
  @NotBlank
  private Team team;
  
  private int age;    
}
```



## 결론

요청과 응답에서 엔티티 대신 DTO를 사용해야하는 이유는 위 네가지 외에도 많지만, 필자는 위 네가지가 주요한 이유라고 생각한다.

혹자는 DTO를 모든 API마다 구별해서 만들다보면 너무 많은 DTO가 생겨서 관리하기 어렵다고 하기도 한다. 틀린말은 아니다. 

그럼에도 불구하고 요청과 응답으로 엔티티를 사용하면, 개발의 편리함을 얻는 대신 애플리케이션의 결함을 얻게 될 수 있다.

위에서 언급한 결함들은 물론이고, API 스펙과 엔티티 사이에 의존성이 생기는 문제도 간과할 수 없다. 우리는 UI와 도메인이 서로 의존성을 갖지 않고 독립적으로 개발하는 것을 지향하기 때문에 이를 중간에서 연결시켜주는 DTO의 역할은 꽤나 중요하다.

요청과 응답으로 DTO를 사용하면 각각의 DTO 클래스가 데이터를 전송하는 클래스로서의 역할을 명확히 가질 수 있게 되고, 이는 하나의 클래스가 하나의 역할을 해야 한다는 객체지향의 정신과도 부합하는 부분이라고 생각한다.

그러므로 이제부터는 하나의 엔티티에 너무 많은 책임을 주지 말고, 각 화면에 필요한 데이터 전송 역할은 DTO에게 위임하는 것이 어떨까?



#### 참고자료

[최근에 느낀 DTO와 관련한 이야기 - 박재성](https://www.slipp.net/wiki/pages/viewpage.action?pageId=2031636)

[DTO and Entity in one object? - stackoverflow](https://stackoverflow.com/questions/31165016/dto-and-entity-in-one-object)

[JPA - API개발과 성능 최적화](https://cheolhojung.github.io/posts/record/jpa-entity-vs-dto.html)

