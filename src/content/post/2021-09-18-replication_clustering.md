---
layout: post  
title: Replication과 Clustering
author: [3기_영이]
tags: ['database', 'replication', 'clustering']
date: "2021-09-18T12:00:00.000Z"
draft: false
image: ../teaser/replication.png
---
프로젝트를 진행하면서 서버를 늘리게 되었다. 서비스 이용자가 당장 많아서 적용한 것은 아니었지만 미래에 많은 사용자가 이용하기를 바라는 마음과 그때 허겁지겁 대비하는 것보다는 미리 대비하자는 차원에서 적용하였다. 하지만 서버는 늘렸는데 과연 효율적으로 동작을 할 까라는 의문이 들었다. 결국, 서버는 데이터베이스와 통신을 하여 정보를 읽어오거나 수정하는 작업을 거치는데 우리 서비스의 데이터베이스는 하나뿐이었다. 과연 서버를 확장한 것 만으로 효과가 있을 것인가란 의문이 들었고 우리 팀은 데이터베이스도 확장하기로 하였다.

데이터베이스를 확장하는 데는 여러 가지 방법이 있었다. 이번 글에서는 데이터베이스 Clustering과 Replication에 대해 알아보자.

## 일반적인 데이터베이스 구조

우선 일반적인 데이터베이스의 구조를 보자. 처음으로 데이터베이스를 구성하게 되면 아래와 같은 구조로 데이터베이스를 만들었을 것이다. 데이터베이스 서버와 스토리지가 하나씩 구성되어 있다.

![image](https://user-images.githubusercontent.com/63634505/133868099-4176692c-f042-47ec-af6c-a3ee969f2786.png)

이렇게 구성된 데이터베이스는 그림만 봐도 서버가 제대로 동작하지 않으면 먹통이 된다는 것을 알 수 있다. 이러한 문제점을 해결하기 위해 가장 먼저 떠오르는 방법은 서버를 하나 더 늘리는 것이다. 이렇게 서버를 하나가 아닌 여러개로 구성하는 것을 Clustering이라 한다.

## Clustering 이란?

앞서 본 데이터베이스 구조의 문제, 데이터베이스 서버가 동작하지 않게 되면 전체 서비스가 동작할 수 없는 점을 해결하기 위해 Clustering을 통하여 서버를 한 대가 아닌 두 대로 구성하게 된다. 서버가 두대인 상황을 간략하게 표현하면 아래와 같은 구조다. 이때 DB서버는 서로 다른 인스턴스테서 동작한다.

![image](https://user-images.githubusercontent.com/63634505/133868115-03263a5c-d337-4707-a2b6-afcc43c6f552.png)

이 경우 같은 데이터베이스 서버 두 대를 하나로 묶어 운영하고 있다. 이때 두 서버의 상태가 모두 Active인 상태다. 이렇게 되면 서버 한 대가 죽게 되더라도 하나의 서버가 동작하고 있어서 서비스에 큰 문제가 발생하지 않는다. 다른 서버가 동작하는 동안 복구를 하여 서비스의 중단이 없도록 할 수 있다. 또한 이렇게 구성함으로써 하나의 데이터베이스 서버에 가해지던 부하가 두 개로 나눠져 지므로 CPU와 Memory도 부하가 줄어들게 된다.

### Active & Stand-By

이렇게 구성하면 무조건 좋은점만 있을까? 여러 개의 서버가 하나의 스토리지를 공유함으로써 병목현상이 발생할 수 있다. 이러한 문제점을 해결하기 위해 하나의 서버는 Active 상태 다른 하나는 Stand-by 상태로 두는 방법이 있다. Active 상태의 서버에 문제가 생겼을 때 Fail over를 하여 Stand-by 서버를 Active로 전환하여 문제에 대응 할 수 있다. 비용적인 부분에서는 별다른 차이가 없을 수 있지만 한 대로 서버가 운영되기 때문에 병목현상을 해결 할 수있다.

![image](https://user-images.githubusercontent.com/63634505/133868138-68c71901-79fb-4502-8429-f450fd6eaedf.png)

하지만 Active & Stand-by에도 문제점이 있다. Fail over가 발생하는 시간 동안에는 서비스가 중단될 수 밖에 없다. 또한 결론적으로 한 대로 운영하기 때문에 효율은 Active & Active의 1/2 정도가 된다.

서버를 하나 더 둠으로써 문제를 해결하고 싶지만 뭔가 찜찜한 기분이 든다. 아마 서버는 늘리지만, 스토리지는 그대로 두는 점 일 것이다. 그래서 이번에는 스토리지를 여러개 가지는 Replication에 대하여 알아보자.

## Replication 이란?

Replication은 말 그대로 복제라는 의미다. 여기서는 데이터베이스 스토리지를 복제하는 것을 의미한다. Clustering은 단순히 데이터베이스 서버를 확장한 것이라면 Replication은 데이터베이스 서버와 스토리지 모두를 확장하게 된다. 이때 단순히 확장만 하는 것이 아니라 메인으로 사용할 Master 서버와 이를 복제한 Slave 서버로 구성하게 된다. 아래 그림은 Replication을 통해 확장한 구조를 나타낸다.

![image](https://user-images.githubusercontent.com/63634505/133868152-6a82b34f-1994-484b-805e-cd0b2f9c4d5b.png)

Master와 Slave로 구성된 구조를 자세히 살펴보면 Master 서버에는 INSERT, UPDATE, DELETE 작업이 전달되고 Slave 서버에는 SELECT 작업이 전달되는 것을 볼 수 있다. Slave는 결국 Master 서버에서 복제된 데이터이기 때문에 데이터의 조작이 발생할 수 있는 INSERT, UPDATE, DELETE 작업은 Master로 전달이 되고 조회만을 하는 SELECT 작업은 Slave 서버를 통하여 진행하게 된다. 그림에서는 Slave 서버가 하나뿐이지만 서비스에 맞게 Slave 서버를 여러 개 가져갈 수 있다. 데이터베이스에서 발생하는 대부분의 쿼리는 조회인 SELECT인데 이러한 것을 Slave 서버를 통해 분산하여 처리할 수 있으니 좀 더 성능 향상을 가져갈 수 있다.
### Replication의 단점
Replication을 사용한다고 좋은점만 있는 것은 아니다. 각각의 서로 다른 서버로 운영하다보니 버전을 관리해야한다. 이때 Master와 Slave의 데이터베이스 버전을 동일하게 맞춰주는 것이 좋다. 버전이 다를 경우 적어도 Slave 서버가 상위 버전이어야 한다. 또 한가지의 단점으로는 Master에서 Slave로 비동기 방식으로 데이터를 동기화 하기 때문에 일관성있는 데이터를 얻지 못할 수 있다. 동기방식으로 Replication을 할 수 있지만 이럴 경우 속도가 느려진다는 문제점이 있다. 마지막으로는 Master 서버가 다운이 될경우 복구 및 대처가 까다롭다는 단점이 있다. 

## 정리

이번 글에서는 데이터베이스를 확장하기 위한 방법으로 Clustering과 Replication에 대해 알아보았다. Clustering은 데이터베이스 서버만을 늘려 처리하는 것이고 Replication은 서버와 스토리지 모두 복제하여 구성하는 방법이었다. 이때 Replication은 Master와 Slave로 구성하여 SELECT 쿼리는 Slave에서 나머지 INSERT, UPDATE, DELETE는 Master에서 진행하였다. Clusterting과 Replication 중 어느 것이 좋다고 말할 수는 없는 것 같다. 무엇보다도 데이터베이스를 무조건 확장하는 것은 최대한 피해야 할 것이다. 각자의 서비스에 맞춰서 적절하게 선택한다면 좀 더 성능이 좋은 서비스를 제공할 수 있을 것 같다.

## 참고

- [https://jordy-torvalds.tistory.com/94](https://jordy-torvalds.tistory.com/94)
- [https://mangkyu.tistory.com/97](https://mangkyu.tistory.com/97)
- [https://bryceyangs.github.io/study/2021/06/01/Database-Sharding-&-Replication-&-Clustering/](https://bryceyangs.github.io/study/2021/06/01/Database-Sharding-&-Replication-&-Clustering/)
