---
layout: post  
title: '관계형 DB에서 계층적인 데이터 관리하기'
author: [3기_케빈]
tags: ['database']
date: "2021-09-04T12:00:00.000Z"
draft: false
image: ../teaser/rdb-hierarchy.png
---

## 1. 계층형 댓글 구현

![image](https://user-images.githubusercontent.com/56240505/132088157-28e0f111-2036-4fa0-9c19-39e8c3543570.png)

우아한테크코스 레벨 3 팀 프로젝트에서 SNS 성격의 웹 어플리케이션을 개발하게 되었습니다. SNS 기능 요구사항 중 **특정 댓글에 대한 대댓글 작성**이라는 다소 까다로운 요구사항이 존재했는데요. 관계형 DB에서 계층적인 데이터를 관리하는 방법에 대해 호기심이 생겨 토이 프로젝트를 진행하게 되었습니다.

최대 99 Depth까지를 허용하는 계층형 댓글 게시판을 구현하는데, 관계형 DB의 스키마 설계가 가장 큰 난관이었습니다. 처음에는 DB 스키마를 고려하지 않고 객체지향적인 JPA 코드를 먼저 작성해보았습니다.

<br>

## 2. JPA 스켈레톤 코드

![image](https://user-images.githubusercontent.com/56240505/132110264-5af23016-38d9-4d43-94a5-931c3ed4cdd8.png)

계층형 댓글은 다소 특별한 노출 기준을 가지고 있습니다.

* 하위 대댓글이 없는 동일한 Depth의 댓글 A와 B가 존재한다면, 작성일자 오름차순으로 정렬한다.
* 특정한 댓글보다 상단에 위치한 댓글에 추가적인 하위 대댓글이 달리는 경우, 작성일자를 무시하고 계층을 우선적으로 고려하여 정렬한다.

기준이 잘 이해되지 않는다면 위 사진 속 댓글들의 날짜와 Depth 및 순서를 눈여겨봐 주시기를 바랍니다.

> Comment.java

```java
@Entity
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "root_comment_id")
    private Comment rootComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "parentComment", cascade = PERSIST)
    private List<Comment> childComments = new ArrayList<>();

    @Column(nullable = false)
    private Long groupOrder = 1L;

    @Column(nullable = false)
    private Long depth = 1L;

    // 중략

    public void addChildComment(Comment childComment) {
        if (this.depth >= 98) {
            throw new IllegalArgumentException();
        }
        childComment.rootComment = this.rootComment;
        childComment.parentComment = this;
        childComment.depth = this.depth + 1L;
        childComment.groupOrder = ?;
        childComments.add(childComment);
    }
}
```

계층적인 댓글은 특정한 최상위 댓글 및 직속 부모 댓글이 존재한다는 점에 착안하여 연관관계를 위와 같이 구성해보았습니다. 또한 다소 번거로운 댓글 정렬 조건때문에, 추가적으로 특정한 최상위 댓글 그룹 내에 속한 댓글의 순서를 ``groupOrder``라는 별도의 필드로 표현했습니다.

특정 댓글에 대댓글을 작성하는 경우 다음과 같은 로직이 진행됩니다.

> CommentService.java

```java
@Transactional
public void replyComment(CommentReplyRequestDto commentReplyRequestDto) {
    User user = userRepository.findActiveUserById(commentReplyRequestDto.getUserId())
        .orElseThrow(UserNotFoundException::new);
    Post post = postRepository.findActivePostById(commentReplyRequestDto.getPostId())
        .orElseThrow(PostNotFoundException::new);
    Comment parentComment = commentRepository.findById(commentReplyRequestDto.getCommentId())
        .orElseThrow(CommentNotFoundException::new);
    Comment childComment = new Comment(commentReplyRequestDto.getContent(), post, user);
    parentComment.addChildComment(childComment);
    commentRepository.adjustGroupOrders(childComment);
}
```

* 대댓글을 달고자 하는 부모 Comment를 조회한다.
* 자식 Comment를 생성하고 ``parentComment.addChildComment(childComment)``를 호출한다.
  * 자식 Comment의 계층 구조를 부모 Comment 기반으로 설정한다.
  * ``@OneToMany``로 잡힌 컬렉션에 자식 Comment를 추가한다.
* 새로운 자식 Comment가 영속화되기 전에, 해당 자식 Comment가 속한 그룹 내 댓글 순서들이 재정렬되어야 한다.
  * ``commentRepository.adjustGroupOrders(childComment)``를 호출하여 같은 댓글 그룹 내에서, 새롭게 삽입될 자식 Comment보다 groupOrder가 크거나 같은 경우 groupOrder를 +1을 하여 순서를 재조정한다.
* ``Cascade.PERSISTS`` 옵션을 통해 최종적으로 자식 Comment가 영속화된다.

대댓글을 삭제하는 경우도 추가와 비슷한 로직이 수행됩니다.

### 2.1. 문제점

> Comment.java

```java
public void addChildComment(Comment childComment) {
    if (this.depth >= 98) {
        throw new IllegalArgumentException();
    }
    childComment.rootComment = this.rootComment;
    childComment.parentComment = this;
    childComment.depth = this.depth + 1L;
    childComment.groupOrder = ?;
    childComments.add(childComment);
}
```

새롭게 추가될 자식 Comment의 그룹 내 순서는 어떻게 정해질까요? ``부모 Comment에 달려있는 하위 Comment들의 groupOrder 중 최대값 + 1``이 될 것입니다. 그런데 이 부분을 어플리케이션 코드에서 매끄럽게 처리하는 것이 다소 번거롭습니다.

```
A
ㄴ A1
   ㄴ A2
   ㄴ A3
      ㄴ A4
         ㄴ ... //무수히 많은 하위 계층 댓글이 존재
ㄴ A5
ㄴ A6
```

A1 댓글에 대댓글을 다는 경우를 생각해봅시다. 조회하게될 부모 Comment는 A1가 됩니다. 부모 Comment A1은 어떻게 하위 Comment들의 groupOrder 최대값을 찾을 수 있을 까요? 현재 코드에서는 다음과 같은 방법을 고려할 수 있습니다.

1. ``@OneToMany``로 잡힌 자식 Comment 컬렉션에서 groupOrder가 가장 높은 자식 Comment를 찾는다.
2. 해당 자식 Comment가 하위 대댓글 자식 Comment를 보유하는 경우 1번 로직을 반복한다.
3. 최종적으로 탐색한 Comment가 하위 대댓글 자식이 없는 경우, 해당 Comment가 댓글 그룹 내에서 groupOrder가 가장 크다.

만약 A1 하위에 존재하는 대댓글이 많거나 계층이 너무 깊게 뻗어있는 경우 groupOrder를 탐색하는데 많은 시간이 소요될 것입니다. A1이 Root Comment가 아니기 때문에 groupOrder 최대값을 찾을 수 있는 쿼리를 작성하는 것 또한 매우 복잡합니다.

<br>

## 3. 관계형 DB와 계층적인 데이터

관계형 DB는 관계형 모델을 기초로 설계되어 있습니다. 반면에 웹 어플리케이션은 주로 객체지향 언어로 작성되며 내부적으로 이진트리와 같은 계층적인 데이터 구조를 자주 활용합니다. 따라서 웹 어플리케이션에서 사용하는 그래프 구조의 데이터를 관계형 DB에 저장하는 것이 어렵습니다.

### 3.1. 전략

관계형 DB에 그래프를 표현하는 전략은 다음과 같이 4가지가 존재합니다. 각각의 전략에 대한 세부 내용은 [관련 글](https://ibocon.tistory.com/203?category=846768)을 참고하시길 바랍니다. 이번 글에서는 제가 토이 프로젝트를 진행하면서 사용한 Nested Set 방법에 대해 설명하고자 합니다.

* Adjacency list
* Nested set
* Path enumeration
* Closure table

<br>

## 4. 중첩 세트 모델(The Nested Set Model)

![image](https://user-images.githubusercontent.com/56240505/132088882-53a900e6-ad28-40d2-8733-e7bb3f247c81.png)

중첩 세트 모델(The Nested Set Model)이란 계층적인 데이터 구조를 집합 구조로 생각하고 스키마를 설계하는 전략입니다. Modified Preorder Tree Traversal Algorithm(수정 된 선주문 트리 순회 알고리즘, 원문 표기)이라고 일컫는데요.

LEFT 필드와 RIGHT 필드로 레코드가 포함하는 범위를 결정하게 됩니다. 부모는 1 부터 N까지를 포함하고 자녀들은 각자의 범위를 부모 범위 내에서 결정하게 됩니다. 중간에 노드를 삽입 혹은 삭제할 때마다 관련 노드들의 값을 적절히 수정해주면 됩니다.

> Comment.java

```java
@Entity
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "root_comment_id")
    private Comment rootComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @Column(nullable = false)
    private Long leftNode = 1L;

    @Column(nullable = false)
    private Long rightNode = 2L;

    @Column(nullable = false)
    private Long depth = 1L;

    // 중략

    public void addChildComment(Comment childComment) {
        if (this.depth >= 98) {
            throw new IllegalArgumentException();
        }
        childComment.rootComment = this.rootComment;
        childComment.parentComment = this;
        childComment.depth = this.depth + 1L;
        childComment.leftNode = this.rightNode;
        childComment.rightNode = this.rightNode + 1;
        childComments.add(childComment);
    }
}
```

사진을 참고하면 다음과 같은 내용을 알 수 있습니다.

* ``rightNode - leftNode == 1``이면 하위 자식 Comment가 존재하지 않는다.
* ``rightNode - leftNode != 1``이면 하위 자식 Comment가 존재한다.
* leftNode 및 rightNode는 기존 JPA 스켈레톤 코드의 groupOrder와 일맥상통한다.
  * 어떤 특정한 노드에 하위 노드를 삽입하면, 해당 하위 노드의 leftNode는 상위 노드의 rightNode가 되고 rightNode는 상위 노드의 rightNode + 1이 된다.
  * 부모 Comment 하나만 조회해도 가장 마지막에 삽입된 Comment의 순서 정보(leftNode, rightNode)를 알 수 있다.

> CustomCommentRepositoryImpl.java

```java
@Override
public void adjustHierarchyOrders(Comment newComment) {
    jpaQueryFactory.update(QCOMMENT)
        .set(QCOMMENT.leftNode, QCOMMENT.leftNode.add(2))
        .where(QCOMMENT.leftNode.goe(newComment.getRightNode())
            .and(QCOMMENT.rootComment.eq(newComment.getRootComment())))
        .execute();

    jpaQueryFactory.update(QCOMMENT)
        .set(QCOMMENT.rightNode, QCOMMENT.rightNode.add(2))
        .where(QCOMMENT.rightNode.goe(newComment.getLeftNode())
            .and(QCOMMENT.rootComment.eq(newComment.getRootComment())))
        .execute();
}
```

이러한 규칙성을 바탕으로 새롭게 댓글을 삽입했을 때, 같은 그룹 내 댓글의 순서를 재조정하는 것도 어렵지 않습니다. 새롭게 삽입될 newComment의 leftNode 및 rightNode 값을 알았다면 다음 값들을 수정하면 됩니다.

* 같은 그룹 내 댓글들 중, leftNode 값이 새로 삽입될 댓글의 rightNode보다 크거나 같으면 leftNode의 값을 2씩 증가시킨다.
* 같은 그룹 내 댓글들 중, rightNode 값이 새로 삽입될 댓글의 leftNode보다 크거나 같으면 rightNode의 값을 2씩 증가시킨다.

> CustomCommentRepositoryImpl.java

```java
@Override
public List<Comment> findCommentsOrderByHierarchy(Pageable pageable, Post post) {
    return selectCommentInnerFetchJoinUser()
        .where(QCOMMENT.post.eq(post))
        .orderBy(QCOMMENT.rootComment.id.asc(),
            QCOMMENT.leftNode.asc())
        .offset(pageable.getOffset())
        .limit(pageable.getPageSize())
        .fetch();
}
```

또한 댓글을 예시 사진처럼 조회하기 위해서는 ``orderBy`` 조건을 최상위 Root Comment ID 및 leftNode 값을 각각 오름차순으로 조회하면 됩니다.

<br>

## 4. 마치며

중첩 세트 모델을 통해 계층형 데이터를 RDB로 쉽게 관리할 수 있습니다. 이번 글에서는 설명하지 않았지만, 특정 부모 댓글의 대댓글을 조회 혹은 삭제하는 쿼리는 아래와 같이 단순합니다.

> SQL

```sql
SELECT * FROM COMMENT
WHERE ROOT_COMMENT = ? AND LFT BETWEEN ${부모 Comment lft} AND ${부모 Comment rgt};

UPDATE COMMENT SET IS_DELETED TRUE
WHERE ROOT_COMMENT = ? AND LFT BETWEEN ${부모 Comment lft} AND ${부모 Comment rgt};
```

그러나 여러 한계점 또한 존재합니다. 빈번하게 새로운 대댓글 노드를 중간에 삽입 혹은 삭제할 때 성능이 탁월하지 않습니다. 삽입 혹은 삭제가 발생할 때마다 같은 그룹 내 다른 노드들의 lft 및 rgt 필드의 값들 또한 함께 수정되기 때문입니다. 아울러 데이터를 추가할 때 lft 및 rgt 범위가 무결성을 위반하지 않도록 신경을 써야 합니다.

<br>

---

## Reference

* [Managing Hierarchical Data in MySQL](http://mikehillyer.com/articles/managing-hierarchical-data-in-mysql/)
* [What are the options for storing hierarchical data in a relational database?](https://stackoverflow.com/questions/4048151/what-are-the-options-for-storing-hierarchical-data-in-a-relational-database)
* [[Spring] RDB 에서 계층적인 데이터 구조 관리 전략 - Nested set](https://ibocon.tistory.com/206)
