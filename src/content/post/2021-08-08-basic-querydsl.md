---
layout: post  
title: 'Spring Boot에 QueryDSL을 사용해보자'
author: [3기_케빈]
tags: ['jpa', 'querydsl']
date: "2021-08-08T12:00:00.000Z"
draft: false
image: ../teaser/querydsl.jpeg
---

## 1. QueryDSL

> PostRepository.java

```java
@Query("select p from Post p join fetch p.user u "
    + "where u in "
    + "(select t from Follow f inner join f.target t on f.source = :user) "
    + "or u = :user "
    + "order by p .createdAt desc")
List<Post> findAllAssociatedPostsByUser(@Param("user") User user, Pageable pageable);
```

Spring Data JPA가 기본적으로 제공해주는 CRUD 메서드 및 쿼리 메서드 기능을 사용하더라도, 원하는 조건의 데이터를 수집하기 위해서는 필연적으로 JPQL을 작성하게 됩니다. 간단한 로직을 작성하는데 큰 문제는 없으나, 복잡한 로직의 경우 개행이 포함된 쿼리 문자열이 상당히 길어집니다. JPQL 문자열에 오타 혹은 문법적인 오류가 존재하는 경우, 정적 쿼리라면 어플리케이션 로딩 시점에 이를 발견할 수 있으나 그 외는 런타임 시점에서 에러가 발생합니다.

이러한 문제를 어느 정도 해소하는데 기여하는 프레임워크가 바로 QueryDSL입니다. QueryDSL은 정적 타입을 이용해서 SQL 등의 쿼리를 생성해주는 프레임워크입니다. QueryDSL의 장점은 다음과 같습니다.

1. 문자가 아닌 코드로 쿼리를 작성함으로써, 컴파일 시점에 문법 오류를 쉽게 확인할 수 있다.
2. 자동 완성 등 IDE의 도움을 받을 수 있다.
3. 동적인 쿼리 작성이 편리하다.
4. 쿼리 작성 시 제약 조건 등을 메서드 추출을 통해 재사용할 수 있다.

물론 QueryDSL을 사용하기 위해서는 다소 번거로운 Gradle 설정 및 사용법 등을 익혀야한다는 단점이 존재합니다. 하지만 JPQL이 익숙한 독자님들은 QueryDSL을 이해하는데 큰 어려움이 없을 것으로 예상됩니다.

<br>

## 2. 설정

사실 QueryDSL을 적용하면서 가장 까다로운 부분이 설정이었습니다. 공식 문서에는 Gradle에 대한 내용이 누락되어 있으며, 실제로 QueryDSL 설정 방법은 Gradle 및 IntelliJ 버전에 따라 상이하기 때문입니다. 따라서 제가 사용하는 방법이 다른 환경에서는 잘 동작하지 않을 수 있습니다. 😭 Groovy 문법이 익숙하지 않다면 설정 파일을 완벽하게 이해할 필요는 없어보입니다.

> build.gradle

```gradle
buildscript {
    ext {
        queryDslVersion = "4.4.0"
    }
}

plugins {
    id 'org.springframework.boot' version '2.5.3'
    id 'io.spring.dependency-management' version '1.0.11.RELEASE'
    id 'java'
}

group = 'com.learning'
version = '0.0.1-SNAPSHOT'
sourceCompatibility = '1.8'

repositories {
    mavenCentral()
}

dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    runtimeOnly 'com.h2database:h2'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'

    // QueryDSL
    implementation "com.querydsl:querydsl-jpa:${queryDslVersion}"
    annotationProcessor(
            "javax.persistence:javax.persistence-api",
            "javax.annotation:javax.annotation-api",
            "com.querydsl:querydsl-apt:${queryDslVersion}:jpa")
}

// QueryDSL
sourceSets {
    main {
        java {
            srcDirs = ["$projectDir/src/main/java", "$projectDir/build/generated"]
        }
    }
}

test {
    useJUnitPlatform()
}
```

* 기본적으로 QueryDSL은 프로젝트 내의 @Entity 어노테이션을 선언한 클래스를 탐색하고, ``JPAAnnotationProcessor``를 사용해 Q 클래스를 생성합니다.
  * Q 클래스는 후술합니다.
* ``querydsl-apt``가 @Entity 및 @Id 등의 애너테이션을 알 수 있도록, ``javax.persistence``과 ``javax.annotation``을 annotationProcessor에 함께 추가합니다.
  * ``annotationProcessor``는 Java 컴파일러 플러그인으로서, 컴파일 단계에서 어노테이션을 분석 및 처리함으로써 추가적인 파일을 생성할 수 있습니다.
* 개발 환경에서 생성된 Q 클래스를 사용할 수 있도록 generated 디렉토리를 sourceSet에 추가합니다.
  * IDE의 개발 코드에서 생성된 Q 클래스 파일에 접근할 수 있습니다.

### 2.1. Q 클래스

![image](https://user-images.githubusercontent.com/56240505/128705967-f62b8478-4255-4caf-8f72-4b379f410277.png)

* 설정 및 빌드를 마친 이후, 다음과 같이 Java 파일을 컴파일합니다.

![image](https://user-images.githubusercontent.com/56240505/128706176-45990a1e-15a4-4936-bb8a-7571a8fb320f.png)

* ``$projectDir/build/generated`` 디렉토리 하위에 Entity로 등록한 클래스들이 Q라는 접두사가 붙은 형태로 생성되었습니다.
* 이러한 클래스들을 Q 클래스 혹은 Q(쿼리) 타입이라고 합니다.
  * QueryDSL로 쿼리를 작성할 때, Q 클래스를 사용함으로써 쿼리를 Type-Safe하게 작성할 수 있습니다.
* Gradle 설정을 통해 ``$projectDir/src/main/java``의 프로덕션 코드에서 Q 클래스를 import해 사용할 수 있습니다.

<br>

## 3. QueryDSL 간단 예제

hi라는 내용을 포함하며 댓글이 1개 이상인 Post를 ID 내림차순으로 조회하는 로직이 존재한다고 가정해봅시다. 정적 쿼리가 아닌 EntityManager를 통해 JPQL을 작성하는 경우 코드는 다음과 같습니다.

> PostRepositoryTest.java

```java
@DisplayName("hi 내용을 포함하며 댓글이 1개 이상인 Post를 조회한다.")
@Test
void jpa_findPostsByMyCriteria_Three() {
    EntityManager entityManager = testEntityManager.getEntityManager();

    List<Post> posts = entityManager.createQuery("select p from Post p where p.content like '%hi%' and p.comments.size > 0 order by p.id desc", Post.class)
        .getResultList();

    assertThat(posts).hasSize(3);
}
```

* 정적 쿼리가 아닌 관계로 문법 오류가 발생하면 어플리케이션 로딩 시점에서 감지하지 못하고, 런타임 에러가 발생합니다.
* ``Post.class`` 지네릭 타입을 메서드 파라미터로 제공하지 않으면, 로 타입의 리스트가 반환됩니다.

> PostRepositoryTest.java

```java
@DisplayName("hi 내용을 포함하며 댓글이 1개 이상인 Post를 ID 내림차순으로 조회한다.")
@Test
void queryDsl_findPostsByMyCriteria_Three() {
    EntityManager entityManager = testEntityManager.getEntityManager();

    JPAQuery<Post> query = new JPAQuery<>(entityManager);
    QPost qPost = new QPost("p");

    List<Post> posts = query.from(qPost)
        .where(qPost.content.contains("hi")
            .and(qPost.comments.size().gt(0))
        ).orderBy(qPost.id.desc())
        .fetch();

    assertThat(posts).hasSize(3);
}
```

* 반면 QueryDSL은 각종 풍부한 체이닝 메서드와 유틸리티 메서드 및 정적 타입(Q 클래스)을 기반으로 직관적으로 쿼리를 작성합니다.
* JPQL을 사용해본 독자님이라면 코드가 상당히 직관적임을 느끼실 겁니다.

> PostRepositoryTest.java

```java
@DisplayName("QueryDsl을 통해 Post 조회시 Comment를 Fetch Join한다.")
@Test
void queryDsl_FetchJoinComments_Success() {
    EntityManager entityManager = testEntityManager.getEntityManager();

    JPAQuery<Post> query = new JPAQuery<>(entityManager);
    QPost qPost = new QPost("p");
    QComment qComment = new QComment("c");

    List<Post> posts = query.distinct()
        .from(qPost)
        .leftJoin(qPost.comments, qComment).fetchJoin()
        .fetch();

    assertThat(posts).hasSize(3);
}
```

* 또한 ``fetchJoin()`` 등 직관적인 체이닝 메서드를 통해 간단하게 Fetch Join을 적용할 수 있습니다.

<br>

## 4. Repository에서 QueryDSL 사용하기

> PostRepository.java

```java
public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("select p from Post p join fetch p.comments")
    List<Post> findAllInnerFetchJoin();

    @Query("select distinct p from Post p join fetch p.comments")
    List<Post> findAllInnerFetchJoinWithDistinct();

    //...
}
```

현재 PostRepository가 사용 중인 정적 쿼리(JPQL)들을 QueryDSL로 교체해봅시다. Spring Data JPA는 JpaRepository를 상속한 Repository 클래스(예, PostRepository)에서 Custom Repository 기능을 사용할 수 있도록 하는 기능을 제공합니다.

> QueryDslConfig.java

```java
@Configuration
public class QueryDslConfig {

    @PersistenceContext
    private EntityManager entityManager;

    @Bean
    public JPAQueryFactory jpaQueryFactory() {
        return new JPAQueryFactory(entityManager);
    }
}
```

* 먼저, JPAQueryFactory를 Bean으로 등록하여 프로젝트 전역에서 QueryDSL을 작성할 수 있도록 합니다.

> PostCustomRepository.java

```java
public interface PostCustomRepository {

    List<Post> findAllInnerFetchJoin();

    List<Post> findAllInnerFetchJoinWithDistinct();
}
```

* 기존의 PostRepository 인터페이스의 ``findAllInnerFetchJoin()`` 및 ``findAllInnerFetchJoinWithDistinct()`` 메서드를 삭제하고, 동일한 메서드 시그니처를 새로운 커스텀 인터페이스에 정의합니다.

> PostCustomRepositoryImpl.java

```java
import static com.learning.jpa.domain.post.QPost.post;

@Repository
public class PostCustomRepositoryImpl implements PostCustomRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public PostCustomRepositoryImpl(JPAQueryFactory jpaQueryFactory) {
        this.jpaQueryFactory = jpaQueryFactory;
    }

    @Override
    public List<Post> findAllInnerFetchJoin() {
        return jpaQueryFactory.selectFrom(post)
            .innerJoin(post.comments)
            .fetchJoin()
            .fetch();
    }

    @Override
    public List<Post> findAllInnerFetchJoinWithDistinct() {
        return jpaQueryFactory.selectFrom(post)
            .distinct()
            .innerJoin(post.comments)
            .fetchJoin()
            .fetch();    
    }
}
```

* 커스텀 인터페이스를 구현하는 클래스에 QueryDSL 쿼리를 작성합니다.
  * 이 때, 해당 구현 클래스 이름은 반드시 ``Impl``로 끝나야 합니다.
* 이전 테스트 코드에서는 QPost와 같은 Q 타입 인스턴스를 직접 생성해서 사용했습니다.
  * 이번에는 QPost를 static import함으로써, QPost에 미리 정의된 Q 타입 인스턴스 상수를 사용합니다.

![image](https://user-images.githubusercontent.com/56240505/128717061-49ecb966-e075-4ae4-9e6e-38922e9d4228.png)

* 실제 QPost 클래스 내부에는 Q 타입의 인스턴스 상수가 미리 정의되어 있음을 확인할 수 있습니다.

> PostRepository.java

```java
public interface PostRepository extends JpaRepository<Post, Long>, PostCustomRepository {

    /*
    삭제된 JPQL 정적 쿼리 메서드
    @Query("select p from Post p join fetch p.comments")
    List<Post> findAllInnerFetchJoin();

    @Query("select distinct p from Post p join fetch p.comments")
    List<Post> findAllInnerFetchJoinWithDistinct();    
     */

    //...
}
```

* JpaRepository를 상속하는 PostRepository가 PostCustomRepository 인터페이스를 상속하도록 합니다.
  * PostCustomRepositoryImpl에 작성된 QueryDSL 코드를 PostRepository가 자동으로 사용할 수 있게 됩니다.

<br>

## 5. 기타

> QueryRepository.java

```java
@Repository
public class QueryRepository {

    private final JPAQueryFactory jpaQueryFactory;

    public QueryRepository(JPAQueryFactory jpaQueryFactory) {
        this.jpaQueryFactory = jpaQueryFactory;
    }

    public List<Post> findAllPostsInnerFetchJoin() {
        return jpaQueryFactory.selectFrom(post)
            .innerJoin(post.comments)
            .fetchJoin()
            .fetch();
    }

    public List<Orphan> findALlOrphans() {
        return jpaQueryFactory.selectFrom(orphan)
            .distinct()
            .leftJoin(orphan.parent).fetchJoin()
            .where(orphan.name.contains("abc"))
            .fetch();
    }
}
```

* 원한다면 특정 엔티티 타입에 구애받지 않는 자신만의 QueryDSL 관련 Repository를 정의해 사용할 수도 있습니다.

<br>

---

## Reference

* [Intro to Querydsl](https://www.baeldung.com/intro-to-querydsl)
* [SpringBoot + queryDsl Setting 총정리](https://n1tjrgns.tistory.com/275)
* [Incremental Compilation, the Java Library Plugin, and other performance features in Gradle 3.4](https://blog.gradle.org/incremental-compiler-avoidance#about-annotation-processors)
* [간단한 QueryDSL 초기 설정 in Gradle 6](https://javachoi.tistory.com/397)
* [[gradle] 그레이들 Annotation processor 와 Querydsl](http://honeymon.io/tech/2020/07/09/gradle-annotation-processor-with-querydsl.html)
* [Spring Boot Data Jpa 프로젝트에 Querydsl 적용하기](https://jojoldu.tistory.com/372)
* [이미지 출처](https://medium.com/tech2flew/spring-data-jpa-querydsl-integration-part-1-1aaebe6208c8)
