---
layout: post
title: '데이터베이스 복제하기(리플리케이션) 1 - 테코와 알아보는 대규모 데이터 관리'
author: [5기_여우]
tags: ['Database']
date: '2023-11-23T11:00:00.000Z'
draft: false
image: ../teaser/replication-thumbnail1.png
---

일상을 공유하는 작은 카페 사이트를 직접 개발해 운영하고 있는 테코(1세).
사이드 프로젝트로 만든 카페에 많은 사람들이 들어와 응원의 글을 남기자 테코는 행복해해요.

![2023-11-06-replication-1.png](./../images/2023-11-06-replication-1.png)

그런데 어느 날!
카카오톡에 '귀염둥이 우테코' 신상 이모티콘이 출시되고,
이 이모티콘이 선풍적인 인기를 끌며
테코의 카페에 유례없이 많은 사람이 유입되기 시작했어요.

하지만 테코의 작은 서버와 데이터베이스로는
엄청나게 많은 사람으로 인한 트래픽을 감당하기에 너무나 버거웠고,

결국 테코의 데이터베이스에 과부하가 걸려
고장 나기에 이르렀어요.

데이터베이스를 뚝딱뚝딱 고쳐서 다시 가동하기까지 걸린 시간은 길어야 3시간 남짓.
하지만 그 **3시간 동안 카페를 전혀 이용하지 못한** 사용자들은 불만이 가득했어요.

짜증 한가득한 사람들에게 사과문을 쓰고 마음에 깊은 상처를 받은 테코는
**다음에 또 데이터베이스 과부하가 생기더라도
카페를 내리지 않고 계속 서비스할 방법**을 공부해 적용하기로 합니다.

---

# 데이터베이스를 하나 더 두자 - 스케일 아웃
테코는 생각했어요.
하나뿐인 데이터베이스가 고장 나면
이것을 완전히 고칠 때까지 카페를 정지할 수밖에 없구나.

만약 **똑같은 데이터를 가지고 있는** 예비용 데이터베이스 서버를 하나 더 둘 수 있다면,
원래 쓰던 하나가 고장 나더라도
예비용 서버로 카페를 운영하고 그동안 고장 난 쪽을 수리하면 되겠구나!

![2023-11-06-replication-2.png](./../images/2023-11-06-replication-2.png)

![2023-11-06-replication-3.png](./../images/2023-11-06-replication-3.png)

테코는 카페의 **단일 장애점(SPOF)** 에 해당하는 데이터베이스의 문제점을 해결하기 위해
데이터베이스에 대한 **스케일 아웃**을 도입해 보기로 했어요.

오! 어떻게 이런 생각을 해냈담.
테코는 자신이 천재가 아닌가 생각했어요.

실행력 강한 테코는 우선 데이터베이스 서버 2대를 추가로 구입해,
**총 3대의 데이터베이스 서버**를 가진 구조를 갖추었어요.

![2023-11-06-replication-4.png](./../images/2023-11-06-replication-4.png)

굿! 하지만 관리가 필요한 서버의 숫자가 늘어나자
테코는 이전까지 해본 적 없던 새로운 고민을 하게 되었습니다.

## 여러 개의 데이터베이스가 어떻게 데이터를 똑같이 가져? - 리플리케이션 개요
테코의 서버에 데이터베이스를 더 설치해서
데이터베이스가 총 세 개가 되긴 했는데,

실시간으로 데이터가 빠르게 생겼다 수정됐다 사라지는 상황에서
어떻게 다수의 데이터베이스 **데이터를 똑같이 동기화, 즉 리플리케이션(Replication)** 해주느냐는 문제가 생겼습니다.

![2023-11-06-replication-5.png](./../images/2023-11-06-replication-5.png)

데이터베이스의 리플리케이션 방법을 사흘 밤낮으로 조사한 테코는
자신의 서버에서 사용하고 있는 MySQL에서 리플리케이션 기능을 제공해 주고 있다는 것을 알게 되었고
이 기능을 공부해 보기로 하였어요!

# MySQL의 리플리케이션
"**MySQL 서버에서 일어나는 모든 변경 기록**은 **바이너리 로그(Binary Log)** 라는 파일에 순서대로 기록된다.
그리고 이 바이너리 로그 안의 변경 기록 하나하나를 **바이너리 로그 이벤트**, 또는 짧게 **이벤트(Event)** 라고 한다."

이 문장을 읽자마자 눈을 반짝이는 테코.
그렇다면 **운영 중인 데이터베이스에서 기록한 모든 바이너리 로그를
예비용 데이터베이스로 가져와 똑같이 적용**하면
간단하게 데이터 동기화를 해낼 수 있겠구나!

테코는 MySQL의 데이터 복제 과정을 조금 더 자세히 들여이다보았어요.

![2023-11-06-replication-6.png](./../images/2023-11-06-replication-6.png)

**바이너리 로그** -> **바이너리 로그 덤프 스레드** -> **리플리케이션 I/O 스레드** -> **릴레이 로그** -> **리플리케이션 SQL 스레드**로 이어지는 긴 여정을 통해
두 데이터베이스가 빠르게 동기화할 수 있도록 MySQL에서 도와주고 있었어요.

---

이 세 대의 서버 데이터를 동기화하기 위해서는
먼저 MySQL 리플리케이션의 중요한 전략 하나를 정해야 했습니다.

바로 **소스 서버에 있는 바이너리 로그의 이벤트 하나하나를 리플리카 서버에서 어떤 방식으로 읽어올 것인가**였습니다.

![2023-11-06-replication-7.png](./../images/2023-11-06-replication-7.png)

![2023-11-06-replication-8.png](./../images/2023-11-06-replication-8.png)

# 테코의 고민 1 - 바이너리 로그를 어떻게 식별할까

## 1. 바이너리 로그 이벤트의 이름과 위치를 통해 식별하자

바이너리 로그 파일 안에는 여러 개의 이벤트가 순서대로 저장되어 있습니다.
'그럼 **복제하려는 파일의 이름**이랑, **복제해 올 이벤트의 위치만 정확하게 알 수 있다면**
이걸 사용해 로그를 식별하면 되겠다!'라고 테코는 생각했어요.

![2023-11-06-replication-9.png](./../images/2023-11-06-replication-9.png)

그 생각을 그대로 재현한
**바이너리 로그 파일 위치 기반 리플리케이션** 을 적용해 두 데이터베이스의 동기화에 성공한 테코.
소스 서버에서 리플리카 서버로 데이터를 쇽쇽 복사해 주는 것을 지켜보면서 뿌듯해하고 있습니다.

### 위 방법의 문제점

그런데 어느 날, 또 다른 우테코 이모티콘 신상이 출시되면서
소스 서버가 또 터지고 말았어요!

테코는 하얗게 타버린 기존의 소스 서버 대신
읽기 전용으로 사용하던 리플리카 서버를 새로운 소스 서버로 대체하고,
백업용으로 사용하던 리플리카 서버를 읽기 전용 서버로 대체하려고 했습니다.

![2023-11-06-replication-24.gif](./../images/2023-11-06-replication-24.gif)


하지만 백업용 리플리카 서버의 상태를 보고 크게 당황한 테코.
백업용 리플리카 서버에는 소스 서버로부터의 동기화가 50분 정도 늦게 진행되어,
소스 서버가 가지고 있던 원본 데이터와 50분만큼의 차이가 있는 상태였어요.

![2023-11-06-replication-10.png](./../images/2023-11-06-replication-10.png)

![2023-11-06-replication-11.png](./../images/2023-11-06-replication-11.png)

'헉, 그래도 A 서버는 소스 서버와 같은 데이터를 가지고 있으니까,
A 서버의 바이너리 로그를 읽어서 데이터 동기화를 이어가면 되겠다!'라는 똑똑한 생각을 하는 테코.

하지만 **바이너리 로그 위치 기반 리플리케이션의 치명적인 단점**으로 인해
테코의 계획은 무용지물이 되었고, 결과적으로
**과부하로 마비된 데이터베이스 서버는 1대인데**
**실제로 쓸 수 없게 된 서버는 2대가 되는** 참혹한 상황을 맞게 되었어요.

결국 2대가 분담해야 할 대량의 부하를 1대가 감당하게 되었고,
또다시 테코의 카페는 새하얀 오류 화면만을 보여주게 되었습니다.

어떤 문제가 있었던 걸까요?

![2023-11-06-replication-12.png](./../images/2023-11-06-replication-12.png)

![2023-11-06-replication-13.png](./../images/2023-11-06-replication-13.png)

![2023-11-06-replication-14.png](./../images/2023-11-06-replication-14.png)

![2023-11-06-replication-15.png](./../images/2023-11-06-replication-15.png)

결국 또다시 반성문을 쓰게 된 테코.
바이너리 로그 파일 위치 기반 복제의 문제점을 몸소 깨닫게 되었네요.

## 2. 바이너리 로그 이름을 통일해서 사용하자

'**특정 서버에서만 식별할 수 있는 이름과 위치 정보는 다른 서버에서 이용할 수 없다.**'

뼈아픈 깨달음을 얻은 테코는
리플리카 서버에서 소스 서버의 이벤트를 읽어올 더 나은 방법을 생각해 내야 했어요.

![2023-11-06-replication-16.png](./../images/2023-11-06-replication-16.png)

놀랍게도, 5.5 버전 이후의 MySQL은 이 아이디어를 실현하여,
**글로벌 트랜잭션 아이디(Global Transaction Identifier, GTID)** 를 이용한 복제 방식을 제공하고 있었습니다.

![2023-11-06-replication-17.png](./../images/2023-11-06-replication-17.png)

![2023-11-06-replication-18.png](./../images/2023-11-06-replication-18.png)

![2023-11-06-replication-19.png](./../images/2023-11-06-replication-19.png)

### GTID 기반 복제의 효과

어느날 우테코 컬렉션이 또 출시되어
소스 데이터베이스 서버가 또 고장났어요!
과연 GTID 기반 복제를 적용한 지금은 장애에 잘 대처할 수 있을까요?

![2023-11-06-replication-20.png](./../images/2023-11-06-replication-20.png)

![2023-11-06-replication-21.png](./../images/2023-11-06-replication-21.png)

![2023-11-06-replication-22.png](./../images/2023-11-06-replication-22.png)

와우!
바이너리 로그 파일 위치 기반 복제와 다르게
소스 서버의 GTID를 리플리카 서버에서도 이용할 수 있게 됨으로써
리플리카 서버 A로부터 리플리카 서버 B로의 데이터 동기화가 가능하게 되었어요.

만세를 부르는 테코!

![2023-11-06-replication-23.png](./../images/2023-11-06-replication-23.png)

---

### 요약
MySQL 리플리케이션의 복제 타입
1. **바이너리 로그 파일 위치 기반 복제**
2. **글로벌 트랜잭션 아이디(GTID) 기반 복제**

자료
Real MySQL 8.0 2권 pp.434~445

---
