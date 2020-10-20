---
layout: post
title: JPA에서 Fetch Join과 Pagination을 함께 사용할때 주의하자
author: "비밥"
comment: "true"
tags: ["Spring"]
toc: true
---

# FETCH JOIN 과 LIMIT
예제코드(+ 테스트코드)는 [Github](https://github.com/pci2676/Spring-Data-JPA-Lab/tree/master/fetch-limit)에서 확인할 수 있습니다.

**결론부터 말하면 One에서 Many를 fetch 해야하는 경우 limit과 같은 쿼리를 포함하면 원하는 대로 결과나 나오지 않습니다.**

Article 1<->N Comment 관계의 엔티티 상황에서  
특정 Article 1개와 5개의 Comment를 보여줘야하는 요구사항이 있을 때
아래와 같이 Article을 기준(OneToMany)으로 fetch join과 limit을 같이 사용하면 안됩니다. 

```java
public List<Article> findArticleByIdLimit5Fetch(Long id) {
        return queryFactory.selectFrom(article)
                .innerJoin(article.comments, comment).fetchJoin()
                .where(article.id.eq(id))
                .limit(5)
                .fetch();
    }
```

`HHH000104: firstResult/maxResults specified with collection fetch; applying in memory!`  

과 같은 경고 문구가 발생합니다.  
쿼 결과가 메모리에 적재되어서 문제가 발생할 수 있다는 경고 문구입니다.
이게 왜 문제가 되는지 실제로 쿼리를 확인해 보면

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
위와 같이 limit 절이 포함되어 있지 않은 것을 확인할 수 있습니다.  
limit 키워드가 있어도 풀 스캔을 통해 가져온 엔티티를 어플리케이션 레벨에서 걸러내려는 것이기 때문에 그렇습니다.

실제로 `@Query` 어노테이션을 이용해서 아래와 같이 쿼리를 작성해보면
```java
@Query("SELECT a FROM Article a INNER JOIN FETCH a.comments LIMIT 1")
```
LIMIT 절을 적어준 것 때문에 `QuerySyntaxException`이 발생하게 되는 것을 확인 할 수 있습니다. JPQL Fetch 쿼리는 LIMIT을 지원하지 않습니다.

이러한 경우 limit은 어플리케이션이 카티젼 프로덕트의 결과를 limit하는 것이 아닙니다.  
from 절에 걸린 entity를 limit하기 때문에 comment는 전체 풀스캔 한 결과가 나옵니다.

만약 엔티티를 조회할거라면 comment를 기준(ManyToOne)으로 조회하면 원하는 결과를 얻을 수 있을 것입니다.

```java
public List<Comment> findCommentByArticleIdLimit5(Long id) {
        return queryFactory.selectFrom(comment)
                .innerJoin(comment.article, article).fetchJoin()
                .where(article.id.eq(id))
                .limit(5)
                .fetch();
    }
```

이렇게 하면 위에서 나타났던 경고문구는 나타나지 않습니다. fetch해서 가져오는게 1개이기때문에 메모리에 적재할때 위험한 경우가 발생하지 않습니다.
그리고 원하는대로 Comment 5개와 Article 1개를 얻을 수 있습니다. 

그런데 만약 단순히 조회성 정보(Dto)를 내보내야 하는 상황이라면 이렇게 조회를 하는게 열받는 포인트가 있습니다.
Dto에 article 정보를 담아주어야 하는 경우 Article운 Comment를 통해서 get을 해야하는데 어떠한 Comment든 상관이 없습니다.

즉, comment.get(0).getArticle() 을 하든 comment.get(1).getArticle() 을 하든 똑같습니다.
결국 이러한 경우에는 아래와 같이 쿼리에서 엔티티를 반환하지 말고 Dto를 바로 만들어서 반환해 주는 것이 좋습니다.

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

이렇게 하면 불필요한 컬럼의 정보를 가져오면서 발생하는 네트워크 비용도 절감되고 명령은 엔티티로 조회는 DTO로 나누면서 CQRS 개념을 지키는 코드의 작성도 가능해질 것 입니다.

## 맺으며
프로젝트를 진행하면서 동욱님이 fetch join 과 limit을 같이 사용하면 어떻게 되는지 아느냐고 질문해주셨는데 부끄럽게도 제대로 답변하지 못했습니다.  
다행히 이제 어떠한 문제가 발생하고 어떻게 해결해야 하는지 알아낸 것 같아서 마음이 놓입니다.