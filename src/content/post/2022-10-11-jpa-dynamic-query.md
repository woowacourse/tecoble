---
layout: post
title: "JPA의 동적 쿼리"
author: [4기_티키]
tags: ['JPA']
date : "2022-10-11T17:00:00.000Z"
draft : false
image: ../teaser/jpa-dynamic-query.png
---

F12 프로젝트를 진행하면서 검색기능을 개발하는 과정에서 고민했던 부분을 소개해드리려고 합니다.  

F12 서비스에는 회원을 검색할 수 있는 기능과 제품을 검색할 수 있는 기능이 존재합니다. 이 글에서는 좀 더 복잡한 조건이 들어가 있는 회원을 검색하는 기능을 개발했던 과정을 살펴보면서 JPA에서 동적 쿼리를 생성하고 적용하는 방법을 살펴본 다음 프로젝트에서 선택했던 방법에 대해 설명드리겠습니다.

## F12의 회원 검색 기능

![](../img/f12-profile-search-view.png)  

F12 프로젝트에서는 서비스를 이용하는 회원을 검색하는 기능이 있습니다. 검색할 수 있는 방법 중 가장 간단한 방법은 회원의 깃허브 아이디를 통해서 검색하는 것입니다. 검색하면 사용자가 검색한 아이디와 일치하는 회원을 찾아주는 방식입니다. 추가로 경력과 직군을 선택해서 검색 결과를 필터링할 수도 있습니다.

다양한 조건을 이용해서 회원을 검색하는 기능을 구현하는 방법이 여러 가지가 있었습니다. 구현 방법을 선택하기에 앞서 방법들의 장단점을 살펴보았었습니다. 저희 팀에서 고려했던 방식들을 하나씩 살펴보면서 최종적으로 F12 팀에서 선택했던 방법까지 살펴보도록 하겠습니다.

## 동적 쿼리를 사용하지 않는 경우

현재 Member의 검색 조건은 `gitHubId`, `careerLevel`, `jobType` 총 3가지입니다. 따라서 사용자가 검색을 하기 위해서 입력할 수 있는 조건의 경우의 수는 총 **8가지**입니다.  

``` java
// 1. 검색 조건 없이 모두 조회
Slice<Member> findAll(Pageable pageable);
// 2. 깃허브 아이디 선택 조회
Slice<Member> findByGitHubId(String keyword, Pageable pageable);
// 3. 깃허브 아이디와 경력 선택 조회
Slice<Member> findByGitHubIdAndCareerLevel(String keyword, CareerLevel careerLevel, Pageable pageable);
// 4. 깃허브 아이디와 직군 선택 조회
Slice<Member> findByGitHubIdAndJobType(String keyword, JobType jobType, Pageable pageable);
// 5. 깃허브 아이디, 경력, 직군 선택 조회
Slice<Member> findByGitHubIdAndCareerLevelAndJobType(String keyword, CareerLevel careerLevel, JobType jobType, Pageable pageable);
// 6. 경력 선택 조회
Slice<Member> findByCareerLevel(CareerLevel careerLevel, Pageable pageable);
// 7. 경력, 직군 선택 조회
Slice<Member> findByCareerLevelAndJobType(CareerLevel careerLevel, JobType jobType, Pageable pageable);
// 8. 직군 선택 조회
Slice<Member> findByJobType(JobType jobType, Pageable pageable);
```

다음과 같이 모든 경우의 수에 대응할 수 있도록 Repository에서 모두 구현해보았습니다. 조건의 유무에 따라 사용되는 쿼리가 다르니 사용할 수 있는 메서드를 모두 만들어줘야 하는 상황입니다.

그런데 Repository의 함수만 늘어나는 것일까요? 이를 호출하는 Service 레이어에서도 들어오는 요청에 따라서 알맞은 Repository 함수를 호출하는 분기 처리가 되어야 합니다. 극단적인 예시일 수 있으나 이를 사용하는 서비스 로직을 잠시 살펴보겠습니다. 

``` java
// 1번
if (!StringUtils.hasText(gitHubId) && careerLevel == null && jobType == null) {
    slice = memberRepository.findAll(pageable);
}
// 2번
if (StringUtils.hasText(gitHubId) && careerLevel == null && jobType == null) {
    slice = memberRepository.findByGitHubId(gitHubId, pageable);
}

...
  
// 8번
if (!StringUtils.hasText(gitHubId) && careerLevel == null && jobType != null) {
    slice = memberRepository.findByJobType(jobType, pageable);
}
```

현재는 8개의 경우의 수이기 때문에 아직은 분기 처리할 수 있고, 모두 정의하고 사용하는 것이 좋을 수도 있습니다. 하지만, 주석이 없다면 어떤 조건에서 실행되는 함수인지 판단하기 힘들 것이고 반복되는 코드가 증가하고 있는 모습을 볼 수 있습니다. 또한 서비스의 정책으로 회원의 검색조건이 추가된다면 기하급수적으로 생성해야 할 함수들이 늘어나기 때문에 관리하기 점점 어려울 것입니다.

이러한 단점을 해결하기 위해 **JPA의 동적 쿼리**를 활용하기로 했습니다. JPA에서 동적 쿼리를 생성하는 방법은 JPQL, Criteria, Specification, Querydsl 이렇게 4가지가 있습니다. 예시를 보면서 각각의 장단점을 알아보겠습니다.  

## JPQL

JPA에서는 JPQL을 통해 동적쿼리를 생성할 수 있습니다.  

``` java
public Slice<Member> findWithSearchConditions(final String gitHubId, final CareerLevel careerLevel,
                                                  final JobType jobType,
                                                  final Pageable pageable) {
    // 조건에 따라서 where문을 다르게 가지는 JPQL 생성
    String jpql = "select m from Member m";
    String whereSql = " where ";
    List<String> whereCondition = new ArrayList<>();
    if (StringUtils.hasText(gitHubId)) {
        whereCondition.add("m.gitHubId like concat('%',:gitHubId,'%')");
    }
    if (careerLevel != null) {
        whereCondition.add("m.careerLevel = :careerLevel");
    }
    if (jobType != null) {
        whereCondition.add("m.jobType = :jobType");
    }
    if (!whereCondition.isEmpty()) {
        jpql += whereSql;
        jpql += String.join(" and ", whereCondition);
    }
    jpql += whereSql;
    jpql += String.join(" and ", whereCondition);
		
    // 조건에 따라서 각각의 where문에 parameter 설정
    TypedQuery<Member> query = entityManager.createQuery(jpql, Member.class);
    if (StringUtils.hasText(gitHubId)) {
        query.setParameter("gitHubId", gitHubId);
    }
    if (careerLevel != null) {
        query.setParameter("careerLevel", careerLevel);
    }
    if (jobType != null) {
        query.setParameter("jobType", jobType);
    }
    List<Member> members = query.setFirstResult((int) pageable.getOffset())
            .setMaxResults(pageable.getPageSize() + 1)
            .getResultList();
    return toSlice(pageable, members);
}
```

``` java
Slice<Member> slice = memberRepository.findWithSearchConditions(gitHubId, careerLevel, jobType, pageable);
```

if 문이 많고 함수가 복잡해 보이지만, 동적 쿼리를 이용하지 않을 때와 비교해서 Repository의 메서드와 Service의 코드가 줄어들었습니다.

하지만 여전히 단점은 존재합니다. 각 조건에 따라서 if 문을 사용한 방식으로 쿼리를 생성하고 있지만, 문자열을 통해서 하고 있다는 것입니다. 문자열을 통해서 쿼리를 만들게 되면 작성한 문자열 쿼리 중 띄어쓰기 혹은 알파벳의 오류가 있을 경우 이를 컴파일 타임에서 잡아주지 못한다는 단점이 존재합니다. 즉, 쿼리를 동적으로 생성하다 보니 개발자가 실수할 수 있는 포인트는 더 늘어났지만 쿼리를 실행하기 전까지는 오류를 찾을 수 없다는 것이죠.

## Criteria

Criteria는 JPQL을 문자열이 아닌 자바 코드로 작성하도록 도와주는 빌더 클래스 API입니다. 문법적인 오류를 컴파일 단계에서 잡을 수 있으므로 JPQL보다 좀 더 안전하게 동적 쿼리를 생성할 수 있도록 도와줍니다.  

``` java
public Slice<Member> findWithSearchConditions(final String gitHubId, final CareerLevel careerLevel,
                                                  final JobType jobType,
                                                  final Pageable pageable) {
    CriteriaBuilder builder = entityManager.getCriteriaBuilder();
    CriteriaQuery<Member> cq = builder.createQuery(Member.class);

    Root<Member> root = cq.from(Member.class);
    List<Predicate> predicates = new ArrayList<>();

    if (StringUtils.hasText(gitHubId)) {
        predicates.add(builder.like(root.get("gitHubId"), "%" + gitHubId + "%"));
    }
    if (careerLevel != null) {
        predicates.add(builder.equal(root.get("careerLevel"), careerLevel));
    }
    if (jobType != null) {
        predicates.add(builder.equal(root.get("jobType"), jobType));
    }
    cq.where(predicates.toArray(new Predicate[0]));

    TypedQuery<Member> query = entityManager.createQuery(cq);
    List<Member> members = query.setFirstResult((int) pageable.getOffset())
            .setMaxResults(pageable.getPageSize() + 1)
            .getResultList();
    return toSlice(pageable, members);
}
```
JPQL을 이용해서 동적쿼리를 생성하는 것보다 훨씬 간단해졌습니다. 또한 문자열을 통해서 쿼리를 생성하지 않아 개발자가 실수할 수 있는 포인트도 줄었습니다. 이처럼 JPA에서 제공하는 Critera를 사용하게 되면 동적 쿼리를 더 간단하고 안전하게 생성할 수 있다는 장점이 있습니다.

하지만 쿼리를 생성하기 위한 코드가 어려워졌습니다. 그리고 생성해야 하는 `Predicate`가 많아진다면 관리하기 어려워지고 직관적으로 이해하기 힘들다는 단점이 발생합니다. 

## JPA Specification & Criteria

Spring Data JPA에서는 Criteria의 사용성을 높이기 위해서 `org.springframework.data.jpa.domain.Specification`으로 해결법을 제공하고 있습니다. Specification을 사용하기 위해서는 Repository에서 `org.springframework.data.jpa.repository.JpaSpecificationExecutor`을 상속 받아야 합니다.

Specifiation을 사용한 동적 쿼리를 방식을 살펴보겠습니다.  

``` java
public interface MemberRepository extends JpaRepository<Member, Long>, JpaSpecificationExecutor<Member> {

    Page<Member> findAll(Specification<Member> spec, Pageable pageable);
}
```
``` java
Slice<Member> slice = memberRepository.findAll(MemberSpec.searchWith(gitHubId, careerLevel, jobType), pageable);
```

기존의 Spring Data JPA와 달라진 점은 `Specification<Member> spec`을 받아서 사용하고 있다는 점입니다. Specification을 이용해서 동적 쿼리를 구현할 수 있게 되는 것입니다. 동적 쿼리를 이용했기 때문에 Service 로직도 깔끔해진 모습을 볼 수 있습니다.

파라미터로 사용되는 Specification을 생성하는 코드도 함께 보겠습니다.  

``` java
public static Specification<Member> searchWith(final String gitHubId, final CareerLevel careerLevel,
                                                   final JobType jobType) {
    return ((root, query, builder) -> {
        List<Predicate> predicates = new ArrayList<>();
        if (StringUtils.hasText(gitHubId)) {
            predicates.add(builder.like(root.get("gitHubId"), "%" + gitHubId + "%"));
        }
        if (careerLevel != null) {
            predicates.add(builder.equal(root.get("careerLevel"), careerLevel));
        }
        if (jobType != null) {
            predicates.add(builder.equal(root.get("jobType"), jobType));
        }
        return builder.and(predicates.toArray(new Predicate[0]));
    });
}
```
 
`MemberSpec` 클래스를 만들고 정적 메서드를 활용해서 다양한 검색 조건을 조합해서 생성해주는 모습을 볼 수 있습니다. Criteria만 활용하는 것보다 코드가 훨씬 간단해진 모습을 볼 수 있습니다.

``` java
CriteriaBuilder builder = entityManager.getCriteriaBuilder();
CriteriaQuery<Member> cq = builder.createQuery(Member.class);
Root<Member> root = cq.from(Member.class);
```
 
위와 같은 CriteriaQuery를 작성을 위한 준비 코드를 작성하지 않아도 되고, Spring Data JPA를 활용한 쿼리를 사용할 수 있으니 이전보다 보기 좋고 쉬운 코드가 완성되었습니다. 

하지만 여전히 Criteria를 통한 동적 쿼리 생성 방식은 복잡하고 장황해 보입니다. 무엇보다 코드의 형태가 SQL스럽지 않습니다.

## Querydsl

Querydsl은 Criteria의 복잡함을 개선할 수 있는 JPQL 빌더 역할을 하는 오픈 소스 프로젝트입니다. 문자열이 아닌 자바 코드로 쿼리를 생성하는 것임에도 불구하고, 더 쉽고 간결하며 형태도 SQL과 비슷하게 개발할 수 있다는 것이 Querydsl의 장점입니다.

Querydsl을 활용해서 동적 쿼리를 만드는 코드를 살펴보겠습니다.

``` java
public Slice<Member> findWithSearchConditions(final String gitHubId, final CareerLevel careerLevel,
                                                  final JobType jobType,
                                                  final Pageable pageable) {
    BooleanBuilder builder = new BooleanBuilder();
    if (StringUtils.hasText(gitHubId)) {
        builder.and(member.gitHubId.contains(gitHubId));
    }
    if (careerLevel != null) {
        builder.and(member.careerLevel.eq(careerLevel));
    }
    if (jobType != null) {
        builder.and(member.jobType.eq(jobType));
    }
    JPAQuery<Member> jpaQuery = jpaQueryFactory.selectFrom(member)
            .where(builder)
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize() + 1)
            .orderBy(makeOrderSpecifiers(member, pageable));

    return toSlice(pageable, jpaQuery.fetch());
}
```

Criteria와 비교했을 때 불필요한 `Predicate`를 생성하는 과정이 없어 더 간결하고 가독성이 좋아졌습니다. 그리고 더 SQL스럽게 코드가 작성된 것을 볼 수 있습니다.

하지만 여전히 `BooleanBuilder`를 통해서 조건을 생성하는 코드가 있어서 코드가 복잡해 보입니다. Querydsl에서도 Specification을 사용한 것과 마찬가지로 `BooleanBuilder`를 생성하는 과정을 분리하면 최종적으로는 다음과 같은 코드가 완성됩니다.


``` java
public Slice<Member> findWithSearchConditions(final String gitHubId, final CareerLevel careerLevel,
                                               final JobType jobType,
                                               final Pageable pageable) {
    JPAQuery<Member> jpaQuery = jpaQueryFactory.selectFrom(member)
            .where(
                    toContainsExpression(gitHubId),
                    eqCareerLevel(careerLevel),
                    eqJobType(jobType)
            )
            .offset(pageable.getOffset())
            .limit(pageable.getPageSize() + 1)
            .orderBy(makeOrderSpecifiers(member, pageable));

    return toSlice(pageable, jpaQuery.fetch());
}

private BooleanExpression toContainsExpression(final String gitHubId) {
    if (StringUtils.hasText(gitHubId)) {
        return null;
    }
    return member.gitHubId.contains(gitHubId);
}

private BooleanExpression eqCareerLevel(final CareerLevel careerLevel) {
    if (careerLevel == null) {
        return null;
    }
    return member.careerLevel.eq(careerLevel);
}

private BooleanExpression eqJobType(final JobType jobType) {
    if (jobType == null) {
        return null;
    }
    return member.jobType.eq(jobType);
}
```

Where 문에 어떤 조건들이 들어가는지 확인할 수 있어 훨씬 가독성이 좋아졌습니다. 이처럼 Querydsl을 통해서 동적 쿼리를 생성하는 방식이 Spring Data Specification에 비해서 가독성이 더 좋다는 것을 확인해 보았습니다.

하지만 Querydsl에도 단점이 없는 것은 아닙니다. Criteria보다는 쉽지만, SQL 작성을 위해서 새로운 방법에 적응하고 공부하는 시간이 필요하기 마련입니다. 
또한 `Q.Class`에 의존하여 쿼리를 생성하는 것도 단점이라고 볼 수 있습니다. `Q.Class`를 생성하는 방법이 Gradle의 플러그인을 활용하는 방법에서 `Annotation Processor`로 바뀐 것처럼 어떤 버전과 빌드 방식을 사용하는가에 따라서 신경을 쓰고 다르게 설정해주어야 하기 때문입니다.

## 정리

지금까지 검색 기능을 개발하기 위해 JPA에서 선택할 수 있는 대안들에 대해서 살펴보았습니다. 프로젝트 초반에는 Service 레이어에서 if 문을 통해서 각 쿼리를 실행하는 것이 직관적이고 코드를 작성하기 편했었습니다. 하지만 검색에 대한 조건이 점차 늘어남에 따라서 동적 쿼리의 필요성을 느꼈습니다.

최종적으로 저희 팀은 Querydsl을 활용해서 동적 쿼리를 생성하는 방법을 선택했습니다. 그 이유는 SQL 문을 생성함에 있어서 컴파일 타임에 오류를 잡아줄 수 있어야 했고, 여러 개발자가 같이 프로젝트를 진행하기 위해서는 가독성이 중요하다고 느꼈기 때문입니다. 

프로젝트의 상황에 따라 달라지겠지만, 동적 쿼리의 적용을 고민하는 개발자가 있다면 이 글이 조금이나마 도움이 되었으면 합니다. 

긴 글 끝까지 읽어주셔서 감사합니다.  

## Reference

- 김영한 지음, 자바 ORM 표준 JPA 프로그래밍
- [이동욱님 블로그 Querydsl 다이나믹 쿼리 사용하기](https://jojoldu.tistory.com/394)
- [Spring.io blog Specification and Querydsl](https://spring.io/blog/2011/04/26/advanced-spring-data-jpa-specifications-and-querydsl/)
- [Baeldung Criteria and Specification](https://www.baeldung.com/spring-data-criteria-queries)
