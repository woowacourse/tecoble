---
layout: post  
title: jpa의 연관관계  
author: [3기_샐리]  
tags: ['spring']  
date: "2021-07-30T12:00:00.000Z"  
draft: false  
image: ../teaser/jpa.png
---

## JPA란?
RDBMS를 사용하던 우리는 java를 이용한 객체지향 프로그래밍을 통해 객체 간 관계가 더욱 복잡해질수록 **패러다임 불일치**의 문제를 마주하게 된다.  

상속과 참조가 쉬워 객체 간 관계를 쉽게 지정할 수 있는 것과 다르게 RDBMS의 테이블에는 객체의 상속관계가 존재하지 않는다.  
외래키 지정을 통해 테이블을 상호 참조할 수 있지만 관계가 복잡해질수록 명령어가 길어지고 실수하기 쉽다.  

복잡한 객체 관계를 가지고 있을 때 java에서는 `a->b->c`로 가진 연관관계를 `a`만 조회함으로써 `c`도 용이하게 조회할 수 있지만 RDBMS에서는 `a->b`도 쿼리문, `b->c`도 쿼리문을 통해 조회해야만 한다.  
쿼리문을 많이 사용할수록 성능은 감소하고, 그렇다고 join문을 사용하는 것도 메모리에 사용하지도 않는 데이터를 로딩해야해 부담이 될 수 있다.  

java 컬렉션에 저장하듯이 database에 저장하고 싶다면 어떻게 해야할까?  

이 때, ORM이 등장했다.  

- ORM (Object-Relational Mapping)
  ORM 프레임워크가 객체와 Database 사이에서 매핑해줌으로써 객체와 RDBMS 간에 존재하는 패러다임 불일치를 해소해주고 CRUD SQL를 직접 작성하지 않아도 되도록 한다.  
  ORM을 사용함으로써 개발자는 SQL문을 잘못 작성해 허비하던 시간을 객체의 비즈니스 로직을 구현하는데 사용할 수 있게 되었다.  
  
- JPA (Java Persistence API)  
  JPA는 java에서 Hibernate를 기반으로 만든 ORM 표준이다.  
  JPA를 통해 우리는 자유롭게 그래프를 탐색할 수 있다.  

### JPA 객체 매핑  
JPA는 특정 database에 종속적이고 각 문법이 다른 문제를 Dialect로 통일해서 JPA가 사용할 수 있도록 `hibernate.dialect`가 돕는다.  
JPA는 아래와 같은 어노테이션을 통해 객체를 매핑할 수 있다.  

```java
@Entity
public class Member {
  //..
}
``` 

`@Entity`로 선언된 객체에 지정된 컬럼에 따라 객체를 database table로 스키마를 자동 생성하기 때문에 컬럼의 자료형도 아래와 같이 지정해줄 수 있다.    

```java
@Entity
public class Member {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 50, unique = true)
  private String email;
}
```

`@Id`, `@Column` 외에도 날짜를 줄 수 있는 `@Temporal`, enum을 지정하는 `@Enumaratted`, 긴 값을 지정하는 `@Lob`이 있다. database에 저장하지 않는 필드는 `@Transient`로 지정할 수 있다.  

이렇게 지정된 객체 간에 연관관계는 어떻게 지정할 수 있을까?  

### JPA 연관관계 매핑 
객체는 참조를 통해 관계를 맺어 단방향 매핑이지만, 테이블은 외래키를 사용해 관계를 맺기 때문에 양방향 매핑이다.  
객체를 양방향으로 연관관계를 맺으려면 그 관계에 주인이 필요하다.  
주인은 그 연관관계를 정의할 수 있는 키를 소유하고 있다.   
연관관계 주인은 그 외래키를 등록/수정/삭제할 수 있는 객체이다.  

예를 들어 회사(Company) 내에 팀(Team)이 있고 팀 안에 구성원(Member)이 있다고 생각해보자.  
팀과 멤버는 일대다 관계를 갖는다. 멤버와 팀은 다대일 관계를 갖는다.  
이 경우 팀과 멤버는 양방향으로 연결된 것 같지만 **단방향으로 상호 연결**되어 있는 것이다.  

- 다대일 관계 매핑  
  구성원과 팀이 다대일 관계를 갖고 있는 상황에 아래와 같이 매핑할 수 있다.  
  보통은 다대일에서 **다**를 가지는 Member가 외래키 소유가 된다.  
  
```java
@Entity
public class Member {
  @ManyToOne  //매핑 설정
  @JoinColumn(name = "team_id", nullable = false) //외래키 이름 지정
  private Team team;
}
```  

- 일대다 관계 매핑  
  `JoincColumn` 설정하면 별도의 중간 과정 없이도 member 테이블에 team_id 컬럼이 생긴다. 따로 지정해주지 않으면 중간 테이블을 jpa에서 자동으로 만든다.  
  `mappedBy` 설정하면 **양방향 관계**를 가질 수 있게 된다. mappedBy 속성으로 연관관계의 주인을 지정하게 된다.  
  아래와 같이 지정할 경우 Member가 연관관계의 주인이 된다. 이렇게 됨으로써 Team 객체는 Member에 요청을 보내야 외래키 수정/삭제가 가능하다.  
  양방향 매핑을 한 경우 연관관계의 주인에 값을 넣지 않고 주인이 아닌 객체에만 넣지 않도록 주으해야 한다. 반드시 양족 다 값을 입력해야 함을 기억하도록 하자.  
  
```java
@Entity
public class Team {
  @OneToMany(mappedBy = "team")
  @JoinColumn(name = "team_id")
  private List<Member> members = new ArrayList<>();
}
```

- 다대다 관계 매핑  
  관계형 데이터베이스에서는 지정할 수 없어 잘 사용되지 않는다. 다대다 매핑 시에는 Set을 사용하는 것이 효율적이다.  
  아래는 각 구성원이 가진 물품들을 저장하는 예시이다.  
  
```java
@Entity
public class Member {
  @ManyToMany
  @JoinTable(
    name = "member_product",
    joinColumns = @JoinColumn(name = "member_id"),
    inverseJoinColumns = @JoinColumn(name = "product_id"))
  private Set<Product> products;
}

@Entity
public class Member {
  @ManyToMany(mappedBy = "products")
  private List<Member> members;
}
```

하지만 이렇게 단순 외래키만 존재하는 것이 아니라 데이터가 연결 테이블에 있기를 원할 수 있는데 이는 이 상황에서 해결할 수 없다.  
따라서 다대다 매핑은 보통 일대다와 다대일 연관관계를 구성해 구현하도록 하는 것이 통상적이다.  

- 일대일 관계 매핑  
  주 테이블과 대상 테이블 중 어느 곳에 외래키를 둘지 생각해야 한다.  
  주 테이블에 두는 경우는 주 테이블만 확인해도 대상 테이블과의 연관관계를 확인할 수 있다.  
  반면에 대상 테이블에 두는 경우는 일대다로의 확장이 좋다는 장점이 있지만 양방향 매핑을 무조건 해야한다는 단점이 있다.  
  
```java
@Entity
public class Company {
  @OneToOne(mappedBy = "company")
  private Member member;
}
```

### 마치며
이렇게 JPA는 다양한 연관관계 매핑을 제공하며 데이터베이스 사용을 편리하게 하고 있다.  
자신의 상황에 알맞게 어떠한 연관관계를 사용해야할지 정확한 설계를 통해 구현하도록 하자.  

### 참고
- 자바 ORM 표준 JPA 프로그래밍(김영한 저)
