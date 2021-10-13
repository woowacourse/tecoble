---
layout: post  
title: 커버링 인덱스
author: [3기_다니]
tags: ['database', 'index', 'covering index']
date: "2021-10-12T12:00:00.000Z"
draft: false
image: ../teaser/covering-index.png
---

조회 성능 개선 미션을 진행하며 `커버링 인덱스`를 알게됐다.
처음 보는 단어여서 이게 어떤 인덱스일까 궁금했고, 바로 찾아보고 이해했다.
그러면서 한번 내용을 글로 정리하면 좋을 것 같다는 생각을 했다.
그래서 이번 기회에 학습 테스트를 하며 해당 개념을 잡고가려 한다.<br/>

<!-- end -->

<br/>

# 커버링 인덱스?

인덱스는 데이터를 효율적으로 찾는 방법이다.
MySQL의 경우 인덱스 안에 있는 데이터를 사용할 수 있다.
이를 잘 이용하면 실 데이터까지 접근할 필요가 없다.
즉, 테이블에 액세스하지 않아도 된다.<br/>

`커버링 인덱스`는 쿼리를 충족하는데 필요한 모든 데이터를 갖는 인덱스를 뜻한다.
`SELECT / WHERE / GROUP BY / ORDER BY` 등에 활용되는 모든 컬럼이 인덱스의 구성 요소인 경우를 말한다.<br/>

커버링 인덱스를 잘 쓰면(특히, 대용량 데이터 처리 시), 조회 성능을 상당 부분 높일 수 있다.<br/>

<sup>*</sup>인덱스에 대해 기초를 쌓고 싶다면, 테코블에 있는 아래 글을 참고해보자.<br/>

> [DB Index 입문](https://tecoble.techcourse.co.kr/post/2021-09-18-db-index/)

<br/>

# 기본 지식

## 실행 계획

쿼리의 실행 계획을 확인하는 방법은 2가지가 있다.
아래 쿼리를 이용해서 어떤 방법인지 알아보자.<br/>

```sql
SELECT * FROM programmer WHERE member_id < 10;
```

<br/>

### Workbench 아이콘

MySQL Workbench를 사용하면, 쿼리문을 작성하는 화면 상단에서 아래와 같이 여러 아이콘을 볼 수 있다.
이중 `⚡️ + 🔍`를 클릭하면 실행 계획을 확인할 수 있다.(왼쪽에서 5번째에 위치한 아이콘이다.)<br/>

![workbench_icon1](https://user-images.githubusercontent.com/50176238/136898561-30f19651-9a98-48e0-a6e1-bad76b5cb270.png)

<br/>

`⚡️ + 🔍`를 클릭해서 확인하면, 이렇게 실행 계획이 나타난다.
해당 쿼리는 Index Range Scan을 했음을 알 수 있다.<br/>

![workbench_icon2](https://user-images.githubusercontent.com/50176238/136899046-82fbc92d-edc8-4447-9619-b664b2f5311b.png)

<br/>

### EXPLAIN

쿼리의 맨 앞에 `EXPLAIN`을 붙여 실행하면, 아이콘보다 더 상세한 실행 계획을 확인할 수 있다.
이는 SQL 쿼리로 보는 방식이다.<br/>

```sql
EXPLAIN SELECT * FROM programmer WHERE member_id < 10;
```

<br/>

SQL 쿼리로 확인하면, 아래처럼 실행 계획이 나타난다.
각 항목에 관한 내용은 바로 이어서 설명한다.<br/>

![explain](https://user-images.githubusercontent.com/50176238/136902808-bddf6277-dc8f-4b54-be81-9ded54fe38c1.png)

<br/>

<b>id</b>

SQL문이 실행되는 순서를 의미한다.
2개 행의 id가 같다면, 조인이 된 것이다.<br/>

<br/>

<b>select_type</b>

SELECT문의 유형을 의미한다.<br/>

- SIMPLE: 단순한 SELECT문
- PRIMARY: 외부쿼리 또는 UNION이 포함되는 경우 1번째 SELECT문
- SUBQUERY: SELECT / WHERE에 작성되어 있는 서브쿼리
- DERIVED: FROM에 작성되어 있는 서브쿼리
- UNION: UNION 또는 UNION ALL로 합쳐진 SELECT문

<br/>

<b>type</b>

- system: 0개 또는 1개의 데이터만 테이블에 존재하는 경우
- const: 단 1개의 데이터만 조회하는 경우
- eq_ref: 조인이 될 때, 드리븐 테이블의 PK 또는 고유 인덱스로 단 1개의 데이터만 조회하는 경우
- ref: eq_ref와 같지만, 2개 이상의 데이터를 조회하는 경우
- index: Index Full Scan
- range: Index Range Scan
- all: Table Full Scan

<br/>

<b>key</b>

옵티마이저가 실제로 선택한 인덱스를 의미한다.<br/>

<br/>

<b>rows</b>

SQL문을 수행하기 위해 접근한 데이터의 모든 행 수를 의미한다.<br/>

<br/>

<b>extra</b>

- Distinct: 중복을 제거하는 경우
- Using where: WHERE로 필터링한 경우
- Using temporary: 데이터 중간 결과를 위해 임시 테이블을 생성한 경우 (보통 `DISTINCT / GROUP BY / ORDER BY`가 포함되면 임시 테이블 생성)
- Using index: `커버링 인덱스`를 사용한 경우
- Using filesort: 데이터를 정렬한 경우

<br/>

실행 계획의 `extra`에 `Using index`가 나타나면, 이는 커버링 인덱스를 활용한 것으로 해석할 수 있다.<br/>

<br/>

## Non-clustered Key와 Clustered Key

| |대상 |제한 |
|:-:|:-:|:-:|
|Non-clustered Key|일반적인 인덱스|테이블에 여러 개 생성 가능|
|Clustered Key|(1) PK<br/>(2) PK가 없을 땐, Unique Key<br/>(3) PK가 없고 Unique Key도 없을 땐,<br/>6 bytes의 Hidden Key 생성|테이블당 1개만 생성 가능|

<br/>

Non-clustered Key와 Clustered Key를 통한 탐색은 다음과 같이 진행된다.<br/>

![non-clustered-key-and-clustered-key](https://user-images.githubusercontent.com/50176238/136989175-03758ad2-5660-47e2-ac20-6ef04c2d781c.png)

> 이미지 출처: [1. 커버링 인덱스 (기본 지식 / WHERE / GROUP BY)](https://jojoldu.tistory.com/476)
<br/>

현재 age와 PK에 인덱스가 걸려있다. 따라서 Non-clustered Key는 age에, Clustered Key는 PK에 인덱스가 있다.
그리고 Non-clustered Key는 age 순으로, Clustered Key는 PK 순으로 정렬된다.<br/>

Non-clustered Key에는 인덱스 컬럼(age)의 값들과 PK의 값들이 있고, Clustered Key는 테이블의 실제 레코드 위치를 알고 있다.
MySQL에서는 Non-clustered Key에 Clustered Key가 항상 포함되어 있다. Non-clustered Key엔 데이터 블록의 위치가 없기 때문이다.<br/>

그러므로 인덱스 조건에 부합하는 WHERE가 있더라도,
SELECT 문에 인덱스에 포함되어 있는 컬럼 외의 다른 컬럼 값이 필요할 때는 Non-clustered Key에 있는 Clustered Key 값으로 데이터 블록을 찾는 과정이 필요하다.<br/>

그렇지만, PK를 사용하는 경우에는 테이블 액세스 시간이 없어져서 필요로 하는 데이터에 더 빠르게 접근할 수 있다.<br/>

결국 `커버링 인덱스`는 이미지의 `2. 실제 데이터 접근` 과정 없이, 인덱스에 존재하는 컬럼 값으로만 쿼리를 완성하는 것을 얘기한다.<br/>

<br/>

# 적용 조건

학습 테스트에서는 아래의 member 테이블을 활용했다.
테이블의 컬럼은 다음과 같고, 전체 레코드는 96206개가 있다.<br/>

![member_table](https://user-images.githubusercontent.com/50176238/136998203-cea92b70-4ab6-474a-a936-a87b970a8866.png)

<br/>

학습 테스트를 시작하기 앞서 (email)으로 인덱스를 추가했다.<br/>

```sql
CREATE INDEX `idx_member_email` ON `member` (email);
```

<br/>

## SELECT + WHERE

먼저, 아래 쿼리의 실행 계획을 확인했다.<br/>

```sql
SELECT *
FROM member
WHERE email = 'probitanima8@gmail.com';
```

![select_where_explain1](https://user-images.githubusercontent.com/50176238/137000538-48493036-80cb-4d8d-a32a-755be7aed65f.png)

<br/>

그렇다면, SELECT 문을 `*`가 아닌 `email`로 변경하면 어떤 일이 일어날까?<br/>

```sql
SELECT email
FROM member
WHERE email = 'probitanima8@gmail.com';
```

![select_where_explain2](https://user-images.githubusercontent.com/50176238/137000717-c4132a2a-e0db-41de-b4e5-d20f11bb0f5e.png)

실행 계획의 `extra`를 보면, 커버링 인덱스가 사용됐다. 즉, 이 쿼리는 인덱스에 포함되어 있는 컬럼만으로 쿼리 생성이 가능하다.<br/>

<br/>

## WHERE + GROUP BY

우선, GROUP BY는 아래 조건에서 인덱스가 적용된다.<br/>

- 인덱스 컬럼과 GROUP BY에 명시하는 컬럼의 순서는 동일해야 된다.
- 인덱스 컬럼 중 뒤에 있는 컬럼은 GROUP BY에 명시하지 않아도 된다.
- 인덱스 컬럼 중 앞에 있는 컬럼은 GROUP BY에 명시해야 된다.
- 인덱스에 없는 컬럼을 GROUP BY에 명시하면 안된다.

```sql
--- 인덱스가 (a, b, c)인 경우

GROUP BY b              --- 인덱스 적용 X
GROUP BY b, a           --- 인덱스 적용 X
GROUP BY a, c, b        --- 인덱스 적용 X

GROUP BY a              --- 인덱스 적용 O
GROUP BY a, b           --- 인덱스 적용 O
GROUP BY a, b, c        --- 인덱스 적용 O

GROUP BY b, c           --- 인덱스 적용 X

GROUP BY a, b, c, d     --- 인덱스 적용 X
```

<br/>

### WHERE가 동등 비교일 때

WHERE + GROUP BY가 함께 사용되면, WHERE에 있는 컬럼은 GROUP BY에 없어도 된다.<br/>

```sql
--- 인덱스가 (a, b, c)인 경우

WHERE a = 1
GROUP BY b, c           --- 인덱스 적용 O

WHERE a = 1 and b = 'dani'
GROUP BY c              --- 인덱스 적용 O
```

<br/>

### WHERE가 동등 비교가 아닐 때

학습 테스트를 하기 앞서 (email, id, age)로 인덱스를 추가했다.<br/>

```sql
CREATE INDEX `idx_member_email_id_age` ON `member` (email, id, age);
```
<br/>

그리고 아래 쿼리의 실행 계획과 수행 시간을 확인했다.<br/>

```sql
SELECT *
FROM member
WHERE email LIKE 'probitanima1%'
GROUP BY id, age;
```

<br/>

실행 계획의 `extra`에 `Using where`가 나타났다. 이는 WHERE로 필터링한 것으로 해석할 수 있다.
수행 시간은 `0.250sec`이 소요됐다.<br/>

해당 시간이 긴 건지 짧은 건지 판단하기 어려웠다. 그래서 커버링 인덱스를 사용하는 테스트를 이어 진행했다.<br/>

![where_group_by_explain1](https://user-images.githubusercontent.com/50176238/137096460-d8427f15-0096-4d15-8139-4cb33ac3951e.png)
![where_group_by_time1](https://user-images.githubusercontent.com/50176238/137097814-8c5b6141-fce0-470f-81eb-3c39ebe3fab9.png)

<br/>

이번에는 아래 쿼리의 실행 계획과 수행 시간을 확인했다.<br/>

```sql
SELECT email, id, age
FROM member
WHERE email LIKE 'probitanima1%'
GROUP BY id, age;
```

<br/>

실행 계획의 `extra`에 `Using index`가 나타났다. 이는 커버링 인덱스를 이용한 것으로 해석할 수 있다.
수행 시간은 `0.70sec`이 소요됐다.<br/>

이전 테스트와 비교하여 수행 시간이 약 3.5배 정도 단축됐다.
커버링 인덱스를 적용하니 결과를 상대적으로 빠르게 얻을 수 있었다.<br/>

![where_group_by_explain2](https://user-images.githubusercontent.com/50176238/137096924-3bb21258-af08-41d7-8da6-497f11cf6539.png)
![where_group_by_time2](https://user-images.githubusercontent.com/50176238/137097925-52a771bd-7f8d-48e0-812e-a1b079779a2c.png)

<br/>

# 결론

조회 쿼리를 작성할 때, `커버링 인덱스`를 적절하게 활용하면 성능 개선에 도움을 줄 수 있다.
다만, 인덱스 적용 조건을 잘 숙지해야 한다.<br/>

이번 글에서 실험한 상황 외에도 다양한 곳에서 커버링 인덱스를 사용할 수 있다.
WHERE + ORDER BY와 같은 케이스에 대한 내용은 바로 아래 레퍼런스에 첨부했다.
관심이 있는 사람은 참고해서 추가로 학습하면 좋을 것 같다.<br/>

<br/>

# References

- 우아한테크코스 강의 자료
- [1. 커버링 인덱스 (기본 지식 / WHERE / GROUP BY)](https://jojoldu.tistory.com/476)
- [2. 커버링 인덱스 (WHERE + ORDER BY / GROUP BY + ORDER BY )](https://jojoldu.tistory.com/481)
- [MySQL에서 커버링 인덱스로 쿼리 성능을 높여보자!!](https://gywn.net/2012/04/mysql-covering-index/)