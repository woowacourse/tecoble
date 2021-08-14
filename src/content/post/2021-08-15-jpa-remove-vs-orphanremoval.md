---
layout: post  
title: JPA REMOVE vs orphanRemoval
author: [3기_다니]
tags: ['jpa', 'remove', 'orphanremoval']
date: "2021-08-15T12:00:00.000Z"
draft: false
image: ../teaser/jpa.png
---

JPA를 공부하다 보면 바로 이해하기 쉽지 않은 개념들을 몇 개 마주친다.
필자는 연관관계 매핑, 영속성 전이, 고아 객체 등이 특히 어려웠다.
이때 `CascadeType.REMOVE`와 `orphanRemoval = true`가 유독 헷갈렸는데, 직접 학습 테스트를 작성하며 이해했다.<br/>

이번 글에서는 영속성 전이(REMOVE)와 고아 객체를 학습 테스트를 통해 비교하여 살펴본다.
최종적으로 독자들이 둘의 차이를 이해하는 것을 목표로 한다.<br/>

<!-- end -->

<br/>

## 엔티티 기본 세팅

Team과 Member 엔티티를 바탕으로 두 개념의 공통점과 차이점을 알아본다.
Team은 @OneToMany, Member는 @ManyToOne으로 양방향 매핑을 했다.<br/>

```java
// Team.java
@Entity
public class Team {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
    private List<Member> members = new ArrayList<>();

    public Team() {
    }
}

// Member.java
@Entity
public class Member {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn
    private Team team;

    public Member() {
    }
}
```

<br/>

학습 테스트를 조금 더 편하게 작성하기 위해 Team에 연관관계 편의 메소드 `addMember()`를 추가했다.<br/>

```java
// Team.java
@Entity
public class Team {

    public void addMember(Member member) {
        members.add(member);
        member.setTeam(this);
    }
}
```

<br/>

## 학습 테스트 기본 세팅

학습 테스트는 `@DataJpaTest`로 진행했다.
테스트에 필요한 TeamRepository와 MemberRepository를 각각 DI했다.<br/>

```java
// JpaLearningTest.java
@DataJpaTest
public class JpaLearningTest {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private MemberRepository memberRepository;
}
```

<br/>

## CascadeType.REMOVE

`CascadeType.REMOVE`는 부모 엔티티가 삭제되면 자식 엔티티도 삭제된다. 즉, 부모가 자식의 삭제 생명 주기를 관리한다.
만약 `CascadeType.PERSIST`도 함께 사용하면, 부모가 자식의 전체 생명 주기를 관리하게 된다.<br/>

한편, 이 옵션의 경우에는 부모 엔티티가 자식 엔티티와의 관계를 제거해도 자식 엔티티는 삭제되지 않고 그대로 남아있다.<br/>

학습 테스트를 위해 Team 엔티티에 영속성 전이 옵션을 추가한다.<br/>

```java
// Team.java
@Entity
public class Team {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(
        mappedBy = "team",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL   // { CascadeType.PERSIST, CascadeType.REMOVE }와 동일하다.
    )
    private List<Member> members = new ArrayList<>();
}
```

<br/>

먼저, 부모 엔티티를 삭제하는 경우를 살펴본다.<br/>

```java
// JpaLearningTest.java
@DisplayName("CascadeType.REMOVE - 부모 엔티티(Team)을 삭제하는 경우")
@Test
void cascadeType_Remove_InCaseOfTeamRemoval() {
    // given
    Member member1 = new Member();
    Member member2 = new Member();

    Team team = new Team();

    team.addMember(member1);
    team.addMember(member2);

    teamRepository.save(team);

    // when
    teamRepository.delete(team);

    // then
    List<Team> teams = teamRepository.findAll();
    List<Member> members = memberRepository.findAll();

    assertThat(teams).hasSize(0);
    assertThat(members).hasSize(0);
}
```

<br/>

delete 쿼리가 총 3번 나가는 걸 확인할 수 있다.
즉, Team(부모)가 삭제될 때 Member(자식)도 영속성 전이 옵션으로 인해 함께 삭제된다.<br/>

```java
// DML
Hibernate: 
    insert 
    into
        team
        (id, name) 
    values
        (null, ?)
Hibernate: 
    insert 
    into
        member
        (id, name, team_id) 
    values
        (null, ?, ?)
Hibernate: 
    insert 
    into
        member
        (id, name, team_id) 
    values
        (null, ?, ?)

Hibernate: 
    delete 
    from
        member 
    where
        id=?
Hibernate: 
    delete 
    from
        member 
    where
        id=?
Hibernate: 
    delete 
    from
        team 
    where
        id=?
```

<br/>

다음으로, 부모 엔티티에서 자식 엔티티를 제거하는 경우를 알아본다.<br/>

```java
// JpaLearningTest.java
@DisplayName("CascadeType.REMOVE - 부모 엔티티(Team)에서 자식 엔티티(Member)를 제거하는 경우")
@Test
void cascadeType_Remove_InCaseOfMemberRemovalFromTeam() {
    // given
    Member member1 = new Member();
    Member member2 = new Member();

    Team team = new Team();

    team.addMember(member1);
    team.addMember(member2);

    teamRepository.save(team);

    // when
    team.getMembers().remove(0);

    // then
    List<Team> teams = teamRepository.findAll();
    List<Member> members = memberRepository.findAll();

    assertThat(teams).hasSize(1);
    assertThat(members).hasSize(2);
}
```

<br/>

delete 쿼리가 전혀 나가지 않는다. 영속성 전이 삭제 옵션은 부모와 자식의 관계가 끊어졌다 해서 자식을 삭제하지 않기 때문이다.<br/>

```java
// DML
Hibernate: 
    insert 
    into
        team
        (id, name) 
    values
        (null, ?)
Hibernate: 
    insert 
    into
        member
        (id, name, team_id) 
    values
        (null, ?, ?)
Hibernate: 
    insert 
    into
        member
        (id, name, team_id) 
    values
        (null, ?, ?)
```

<br/>

## orphanRemoval = true

`orphanRemoval = true` 또한 부모 엔티티가 삭제되면 자식 엔티티도 삭제된다.
따라서 `CascadeType.PERSIST`를 함께 사용하면, 이때도 부모가 자식의 전체 생명 주기를 관리하게 된다.<br/>

한편, 이 옵션의 경우에는 부모 엔티티가 자식 엔티티의 관계를 제거하면 자식은 고아로 취급되어 그대로 사라진다.<br/>

이번에는 학습 테스트를 위해 Team 엔티티에 고아 객체 옵션을 추가한다.<br/>

```java
// Team.java
@Entity
public class Team {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @OneToMany(
        mappedBy = "team",
        fetch = FetchType.LAZY,
        cascade = CascadeType.PERSIST,
        orphanRemoval = true
    )
    private List<Member> members = new ArrayList<>();
}
```

<br/>

이전과 동일하게 부모 엔티티를 삭제하는 경우를 살펴본다.<br/>

```java
// JpaLearningTest.java
@DisplayName("orphanRemoval = true - 부모 엔티티(Team)을 삭제하는 경우")
@Test
void orphanRemoval_True_InCaseOfTeamRemoval() {
    // given
    Member member1 = new Member();
    Member member2 = new Member();

    Team team = new Team();

    team.addMember(member1);
    team.addMember(member2);

    teamRepository.save(team);

    // when
    teamRepository.delete(team);

    // then
    List<Team> teams = teamRepository.findAll();
    List<Member> members = memberRepository.findAll();

    assertThat(teams).hasSize(0);
    assertThat(members).hasSize(0);
}
```

<br/>

이때도 delete 쿼리가 총 3번 나가는 걸 확인할 수 있다.
즉, Team(부모)가 삭제될 때 Member(자식)도 고아 객체 옵션으로 인해 같이 삭제된다.<br/>

```java
// DML
Hibernate: 
    insert 
    into
        team
        (id, name) 
    values
        (null, ?)
Hibernate: 
    insert 
    into
        member
        (id, name, team_id) 
    values
        (null, ?, ?)
Hibernate: 
    insert 
    into
        member
        (id, name, team_id) 
    values
        (null, ?, ?)

Hibernate: 
    delete 
    from
        member 
    where
        id=?
Hibernate: 
    delete 
    from
        member 
    where
        id=?
Hibernate: 
    delete 
    from
        team 
    where
        id=?
```

<br/>

학습 테스트로 부모 엔티티를 삭제할 때는 REMOVE와 orphanRemoval이 동일하게 동작하는 것을 이해했다.
그렇다면, 부모 엔티티에서 자식 엔티티를 제거할 때는 어떤 결과를 나타낼까?<br/>

```java
// JpaLearningTest.java
@DisplayName("orphanRemoval = true - 부모 엔티티(Team)에서 자식 엔티티(Member)를 제거하는 경우")
@Test
void orphanRemoval_True_InCaseOfMemberRemovalFromTeam() {
    // given
    Member member1 = new Member();
    Member member2 = new Member();

    Team team = new Team();

    team.addMember(member1);
    team.addMember(member2);

    teamRepository.save(team);

    // when
    team.getMembers().remove(0);

    // then
    List<Team> teams = teamRepository.findAll();
    List<Member> members = memberRepository.findAll();

    assertThat(teams).hasSize(1);
    assertThat(members).hasSize(1);
}
```

<br/>

이전과는 다르게 delete 쿼리가 1번 나간다. 고아 객체 옵션은 부모와 자식의 관계가 끊어지면 자식을 고아로 취급하고 자식을 삭제하기 때문이다.<br/>

```java
// DML
Hibernate: 
    insert 
    into
        team
        (id, name) 
    values
        (null, ?)
Hibernate: 
    insert 
    into
        member
        (id, name, team_id) 
    values
        (null, ?, ?)
Hibernate: 
    insert 
    into
        member
        (id, name, team_id) 
    values
        (null, ?, ?)

Hibernate: 
    select
        team0_.id as id1_1_,
        team0_.name as name2_1_ 
    from
        team team0_

Hibernate: 
    delete 
    from
        member 
    where
        id=?
```

<br/>

## 비교 결과

- 부모 엔티티 삭제
    - `CascadeType.REMOVE`와 `orphanRemoval = true`는 부모 엔티티를 삭제하면 자식 엔티티도 삭제한다.
- 부모 엔티티에서 자식 엔티티 제거
    - `CascadeType.REMOVE`는 자식 엔티티가 그대로 남아있는 반면, `orphanRemoval = true`는 자식 엔티티를 제거한다.

<br/>

## 주의점

두 케이스 모두 자식 엔티티에 딱 하나의 부모 엔티티가 연관되어 있는 경우에만 사용해야 한다.<br/>

예를 들어 Member(자식)을 Team(부모)도 알고 Parent(부모)도 알고 있다면, `CascadeType.REMOVE` 또는 `orphanRemoval = true`를 주의할 필요가 있다.
왜냐하면 자식 엔티티를 삭제할 상황이 아닌데 부모 엔티티를 삭제했다고 혹은 부모 엔티티에서 제거했다고 자식이 삭제되는 불상사가 일어날 수 있기 때문이다.<br/>

그러므로 `@OneToOne`이나 `@OneToMany`에서 활용하고 @ManyToMany에서는 활용을 지양하자.<br/>

<br/>

## References

- [자바 ORM 표준 JPA 프로그래밍 - 기본편](https://www.inflearn.com/course/ORM-JPA-Basic/dashboard)
- [JPA 학습 테스트](https://github.com/da-nyee/jpa-learning-test)