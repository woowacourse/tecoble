---
layout: post
title: JPA에서 Fetch Join과 Pagination을 함께 사용할때 주의하자
author: "비밥"
comment: "true"
tags: ["Spring"]
toc: true
---

**결론부터 말하면 One에서 Many를 fetch 해야하는 경우 limit과 같은 절(Pagination을 위한)을 포함하면 원하는 대로 결과나 나오지 않는다.**

예제코드(+ 테스트코드)는 [Github](https://github.com/pci2676/Spring-Data-JPA-Lab/tree/master/fetch-limit)에서 확인할 수 있다.

## LIMIT 그리고 SET_MAX_RESULT

### JPQL

Pagination을 위해서는 MySQL 기준 limit (그리고 offset) 을 사용해야 한다.

그런데 JPA은 DB에 따라서 방언을 바꾸어 Query를 생성하기 때문에 MySQL 방언에 속하는 LIMIT 절을 JPQL에서 직접 사용할 수 없다. 

따라서 아래와 같이 쿼리를 작성하면 `QuerySyntaxException`, `IllegalArgumentException` 이 발생한다.

```java
@Query("SELECT a FROM Article a INNER JOIN FETCH a.comments LIMIT 3")
List<Article> findAllLimit3Fetch();
```

```java
@Test
void jpqlTest0() {
    assertThatThrownBy(() -> entityManager.createQuery("SELECT a FROM Article a INNER JOIN FETCH a.comments c LIMIT 3", Article.class))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("unexpected token: LIMIT");
}
```

대신 아래와 같이 setFirstResult() 와 setMaxResults() 를 이용해서 pagination을 한다.

```java
TypedQuery<Article> query = entityManager.createQuery("SELECT a FROM Article a INNER JOIN FETCH a.comments c", Article.class);
query.setFirstResult(0);
query.setMaxResults(3);
```

### QueryDSL

앞으로 살펴볼 코드는 QueryDSL을 이용하여 작성한 코드이기 때문에 QueryDSL의 Pagination을 짚고 넘어가도록 하겠다.

그리고 QueryDSL을 사용하는 경우 pagination을 위해 offset 과 limit 절을 아래와 같이 추가할 수 있다.

```java
public List<Article> findArticle() {
        return queryFactory.selectFrom(article)
                .innerJoin(article.comments, comment).fetchJoin()
          			.offset(0)
                .limit(5)
                .fetch();
    }
```

QueryDSL의 offset(), limit()이 setFirstResult(), setMaxResults()와 무슨 관계가 있는가 생각할 수 있다.  
QueryDSL을 사용하는경우 `AbstractJPAQuery.java` 의 `createQuery(@Nullable QueryModifiers modifiers, boolean forCount)` 부분을 보면 offset(), limit() 을 이용해서 넣은 값은 각각 setFirstResult(), setMaxResults() 에 사용되고 있는 것을 확인 할 수 있다.

![image](https://user-images.githubusercontent.com/13347548/96618041-626b5200-133f-11eb-8003-d4962704a287.png)

## 문제 상황

이제 문제의 상황을 살펴보도록 하자.

![image](https://user-images.githubusercontent.com/13347548/96622315-c04e6880-1344-11eb-9903-108b12341389.png)

위와 같은 관계의 엔티티가 존재할 때 
**특정 Article 1개와 5개의 Comment의 정보를 조회**해야하는 요구사항이 있다고 가정하자. 

이러한 정보를 조회하기 위해 아래와 같이 Article을 기준(OneToMany)으로 fetch join과 limit을 같이 사용하면 안된다. 

```java
public List<Article> findArticleByIdLimit5Fetch(Long id) {
        return queryFactory.selectFrom(article)
                .innerJoin(article.comments, comment).fetchJoin()
                .where(article.id.eq(id))
                .limit(5)
                .fetch();
    }
```

위와 같이 코드를 작성한다면 아마 다음과 같은 SQL을 예상하고 작성했을 것이다.

```sql
SELECT *
FROM article
INNER JOIN comment ON article.id = comment.article_id
WHERE article.id = ?
LIMIT 5
```

실행후 console을 살펴보면 아래와 같은 경고 로그가 발생한것을 확인할 수 있다.  

`HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!`  

**쿼리 결과를 전부 메모리에 적재한 뒤 Pagination 작업을 어플리케이션 레벨에서** 하기 때문에 위험하다는 로그이다.
우리는 limit을 명시하여서 제한된 쿼리결과(=이미 Pagination된 결과)를 가져올 것 인데 어째서 이런 위험 경고가 발생하는 것인지 의문이 든다. 

그런데 실제 쿼리를 보면 이상한 점이 보인다.

```sql
Hibernate: 
    select
        article0_.id as id1_0_0_,
        comments1_.id as id1_1_1_,
        article0_.contents as contents2_0_0_,
        comments1_.article_id as article_3_1_1_,
        comments1_.contents as contents2_1_1_,
        comments1_.article_id as article_3_1_0__,
        comments1_.id as id1_1_0__ 
    from
        article article0_ 
    inner join
        comment comments1_ 
            on article0_.id=comments1_.article_id
```
위와 같이 **limit 절이 포함되어 있지 않은 것을 확인**할 수 있다.  

### 어째서 이런일이?

이 부분은 실제로 `QueryTranslatorImpl.java` 의 `List list(SharedSessionContractImplementor session, QueryParameters queryParameters)`부분부터 따라가보면 왜 이렇게 동작하는지 코드로 확인 할 수 있다.

<img src="https://user-images.githubusercontent.com/13347548/96605312-04377280-1331-11eb-91ef-d3dbc98b8434.png" alt="image" width="800" />

만약 Fetch Join을 사용한다면 RowSelection 객체인 selection을 복사해서 queryParametersToUse 로 사용하게 되는데 이 selection 객체는 우리가 사용하고자 하는 limit 정보를 아래와 같이 전부 null로 가지고 있다.

<img src="https://user-images.githubusercontent.com/13347548/96606122-e28abb00-1331-11eb-8c27-ddb8444691a4.png" alt="image" width="700" />

그리고 이렇게 전달된 queryParameter는 아래 보이는 Applying LIMIT clause 아래에서 적용되는데 이때 **우리가 의도한 대로 LIMIT 절이 적용되지 않는 것을 확인**할 수 있다.

<img src="https://user-images.githubusercontent.com/13347548/96608218-14048600-1334-11eb-8c96-e5b12becfd5b.png" alt="image" width="500" />

### 성능에 문제가 있어도 Pagination은 되는것인가?

답은 아니다. 

이러한 경우 limit은 **카티젼 프로덕트의 결과를 limit 하지 않는다**.  
from 절에 걸린 **entity(위 예제에서는 atricle)를 limit**한다. 그로인해 **comment는 전체 풀스캔 한 결과**가 나온다.

아래와 같이 QueryDSL을 이용해서 쿼리를 작성하고

```java
public List<Article> findArticle() {
    return queryFactory.selectFrom(article)
            .innerJoin(article.comments, comment).fetchJoin()
            .offset(0)
            .limit(5)
            .fetch();
}
```

Aticle 하나에 Comment 가 6개씩 존재하는 상황에서 다음과 같은 테스트를 작성해보면 One에 해당하는 Article은 limit 한 갯수만큼 나오지만 Comment는 6개 전부 존재하는 것을 확인 할 수 있다.

```java
@DisplayName("fetch join으로 limit 할 때 내가 원하는 만큼 comment를 limit 하지 않는다. 어플리케이션 레벨에서 article만 limit한 개수만큼 가져온다")
@Test
void fetchPaging22() {
    List<Article> findArticle = queryRepository.findArticle();

    assertThat(findArticle).hasSize(5);
    assertThat(findArticle.get(0).getComments()).hasSize(6);
}
```

이 부분은 [Hibernate Community 문서](https://docs.jboss.org/hibernate/core/3.3/reference/en/html/queryhql.html)에도 적혀있다.

> `Fetch` should be used together with `setMaxResults()` or `setFirstResult()`, as these operations are based on the result rows which usually contain duplicates for eager collection fetching, hence, the number of rows is not what you would expect.

그럼 어떻게 해결해야 할까?

## 방향을 반대로

따라서 만약 **엔티티를 조회할거라면 comment를 기준(ManyToOne)으로 조회하면 원하는 결과를 얻을 수 있다.**

```java
public List<Comment> findCommentByArticleIdLimit5(Long id) {
        return queryFactory.selectFrom(comment)
                .innerJoin(comment.article, article).fetchJoin()
                .where(article.id.eq(id))
                .limit(5)
                .fetch();
    }
```

이렇게 하면 위에서 나타났던 경고문구는 나타나지 않는다. fetch해서 가져오는게 1개이기때문에 메모리에 적재할때 위험한 경우가 발생하지 않는다.
그리고 원하는대로 Comment 5개와 Article 1개를 얻을 수 있다. 

## 조회성 객체로

그런데 **Fetch Join은 객체(엔티티) 그래프를 탐색해야하는 경우(ex.도메인 로직 수행) 사용**하기 때문에 이러한 조회성 요구사항에는 굳이 사용할 필요가 없다.

만약 단순히 **조회성 정보(Dto)를 내보내야 하는 상황**이라면 이렇게 조회를 하는게 이상한 부분이 있다.
Dto에 article 정보를 담아주어야 하는 경우 Article은 Comment를 통해서 get을 해야하는데 어떠한 Comment든 상관이 없다.

다시말해 comment.get(0).getArticle() 을 하든 comment.get(1).getArticle() 을 하든 똑같은 Article이라는 것이다.
이러한 경우에는 아래와 같이 쿼리에서 **엔티티를 반환하지 말고 Dto를 바로 만들어서 반환**해 주는 것이 좋다.

```java
public ArticleComments findArticleWithTop5Comments(Long articleId) {
        return queryFactory.from(comment)
                .innerJoin(comment.article, article)
                .where(article.id.eq(articleId))
                .limit(5)
                .transform(
                        groupBy(comment.article.id)
                                .list(new QArticleComments(article.contents, list(comment.contents)))
                ).get(0);
    }
```

이렇게 하면 불필요한 컬럼의 정보를 가져오면서 발생하는 네트워크 비용도 절감되는 이점도 얻어갈 수 있다.

## 맺으며

데모 데이때 질문을 주신 개발자님이 fetch join 과 pagination을 같이 사용하면 어떻게 되는지 아느냐고 질문해주셨는데 부끄럽게도 제대로 답변하지 못했다.  
필자는 이제서야 어떠한 문제가 발생하고 어떻게 개선해야 하는지 알게 되었지만 이 글을 읽은 독자는 필자와 같은 실수를 범하지 않길 바란다.