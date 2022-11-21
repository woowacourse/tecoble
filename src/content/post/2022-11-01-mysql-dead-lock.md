---
layout: post
title: "데드락 해결 모험기"
tags: ['Mysql', 'DeadLock']
author: [4기_알파]
date : "2022-11-21T15:00:00.000Z"
draft : false
image: ../teaser/deadlock_teaser.png
---

## 용어 설명

   &nbsp;Cycle이란, 사용자가 특정 챌린지에 도전할 때 생성되는 객체이다. 비즈니스 규칙 상 하루에 한번씩 총 3일을 인증해야 하며, 하루에 여러번 인증을 할 수는 없다. 아직 인증을 하지 않은 상황에서 활동을 인증하게 되면 인증 내역인 CycleDetail이라는 객체가 생성된다. 따라서, 3일 동안 정상적으로 하루헤 한번씩 3번 인증을 하게 되면 총 3개의 CycleDetail이 생성되고, 하나의 Cycle은 최대 3개의 CycleDetail을 가지게 된다


## 문제 상황(1)

   &nbsp;QA 시 일반적 시나리오에서는 Cycle의 인증이 예상한대로 동작했으나, “하나의 계정에 두 기기가 접속하여 동일한 Cycle을 인증하는 경우”가 궁금해져 QA를 진행하게 되었다. 이 때 “한번에 하나의 인증만 이루어져야 한다”라는 비즈니스 로직에 의해 인증하려는 Cycle에 대응되는 CycleDetail이 하나만 있는 것을 기대했으나, 실제로는 2개 이상의 CycleDetail이 남아있는 문제가 발생하게 되었다.
   <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199098853-f7b8e40b-c5ca-4655-bfec-85b98bea4bac.png" align="center" width="1000"
            height="200"/>
      </p>

   &nbsp;전형적인 동시성 문제로 판단 되었고, 이에 대한 해결책은 lock을 거는 것으로 알고 있었다. 하지만 이미 mysql 내부에서 우리도 모르는 lock을 비일비재하게 걸고 있기 때문에 추가적으로 lock을 걸었을 때 다른 쿼리들이 예상치 못하게 대기하는 상황이 발생할 수 있을 수 있다. 따라서, 최대한 lock을 지양한 채로 해당 문제를 풀고 싶었다.

   &nbsp;문제가 되는 부분은 CycleDetail이 두번 이상 삽입되는 것이 문제이기 때문에 이것을 방지한다면, 문제를 해결하는 것과 같다고 판단하여 CycleDetail의 외래키인 cycle_id와 현재 몇번째 인증인지를 나타내는 progress를 복합 unique 제약조건을 걸게 되면 삽입이 한번만 이루어질 것이라고 예상하였다



## 문제 상황(2)

   &nbsp;결과적으로는 하나의 기기는 성공하고 다른 기기는 실패하는 것을 확인하였으나, 문제는 에러 메세지였다. 실패한 쪽에서의 예상되는 에러 메세지는 미리 정의한 커스텀한 에러 메세지인 “인증 시간이 지났습니다” 였으나, 실제 에러 메세지는 “알 수 없는 에러가 발생하였습니다”가 나타났다. 로그를 분석해보니, 데드락이 발생하였다는 에러 로그를 마주하게 되었다.
   <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199099254-7bc6cbf1-3a1a-4b3f-a3db-d8a956fe6093.png" align="center" width="1000"
            height="200"/>
      </p>


## 가설 수립 및 원인 규명

   &nbsp;따라서, 실제 Mysql에서 어떤 쿼리가 데드락을 발생시켰는지 알고자 DB 서버에 접속하여 확인해보았다. 이 때 데드락을 발생시킨 직접적인 원인이 되는 쿼리는 Cycle의 progress를 바꾸는 Update문과 CycleDetail을 insert하는 쿼리였다
   <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199100038-5aaf25ee-ce34-4a04-b0a2-60b70e016d7e.png" align="center" width="800"
            height="600"/>
      </p>


   문제를 해결하기 위한 unique 제약조건이 추가된 설정을 기준으로 트랜잭션의 각 흐름에 따른 lock의 획득 과정을 그림으로 도식화하면 다음과 같다
   <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199100493-4fec7d93-4714-4916-abd5-8511e801b729.png" align="center" width="800"
            height="600"/>
      </p>

   먼저 트랜잭션 1이 insert문을 통해 이유는 알 수 없지만 Cycle에 대한 shared lock을 걸게 된다. 설명의 편의를 위해 트랜잭션 1이 Cycle에 대해 건 shared lock을 초록색 타원으로 표기하였다
   <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199100699-f36fd92f-85eb-403b-b344-3db1c238be91.png" align="center" width="800"
            height="600"/>
      </p>


   &nbsp;이후 트랜잭션 2가 역시 insert문을 통해 이번에도 이유는 알 수 없지만 Cycle에 대한 shared lock을 걸게 된다. 이 때 shared lock은 말 그대로 lock간의 공유가 가능하기 때문에 여기서 데드락이 발생하지는 않는다. 마찬가지로 설명의 편의를 위해 트랜잭션 2가 Cycle에 대해 건 shared lock을 파란색 타원으로 표기하였다
   <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199100923-f1b97cff-a46e-4339-9fe5-d100ef2512d4.png" align="center" width="800"
            height="400"/>
      </p>


   &nbsp;먼저 insert한 트랜잭션 1에 의해 unique 제약조건으로 생성된 인덱스에 CycleDetail이 삽입이 되고, 이에 대한 exclusive lock이 걸리게 된다. 따라서 트랜잭션 2에서의 insert 쿼리는 첫번째 트랜잭션이 획득한 exclusive lock에 의해 대기하게 된다
   <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199101485-f429da01-62fe-415f-a0b9-7313353729c0.png" align="center" width="800"
            height="600"/>
      </p>


   &nbsp;이후 트랜잭션 1이 Cycle의 상황을 바꾸려한다. 이 때 데드락이 발생하게 되는데, 그 이유는 트랜잭션 1의 입장에서는 update하기 위해서는 트랜잭션 2의 Cycle에 대한 shared lock을 풀어야 하고, 트랜잭션 2의 입장에서는 insert하기 위해서는 트랜잭션 1의 CycleDetail에 대한 exclusive lock을 풀어야 하기 때문이다. 따라서, unqiue 제약조건으로는 데드락 문제를 해결할 수 없었다

   &nbsp;그런데 사실 Cycle에 대한 shared lock이 애초에 없었다면 데드락이 발생하지는 않았을 것이다. 따라서 왜 설정하지도 않은 shared lock이 발생하는지에 대해 알아보기로 하였다. 여러 가설이 있었으나 가장 유력한 가설은 학부 시절 데이터베이스 개론에 배웠던 “참조 무결성 원칙”이 공유락을 발생시킨다는 가설이었다

   &nbsp;참조 무결성이란 외래키는 참조할 수 없는 값을 가질 수 없다는 규칙이다. CycleDetail을 삽입할 때 왜래키인 cycle_id를 참조하고 있다. 해당 쿼리를 보는 개발자의 입장에서는 모든 맥락을 이해하기 때문에 insert 쿼리에 참조하는 cycle_id는 존재한다는 사실을 알지만, DB입장에서는 전혀 그렇지 않기 때문에 현재 쿼리가 참조 무결성을 위반할 수 있다고 생각할 수 있다. 실제로 문제 해결을 위해 참고하던 Real MySQL에서도 외래키와 데드락의 연관성에 대해 지적하고 있었다.

   > "외래키는 부모테이블이나 자식 테이블에 데이터가 있는지 체크하는 작업이 필요하므로 잠금이 여러 테이블로 전파되고, 
   > 그로인해 데드락이 발생할 수 있다. 그래서 실무에서는 잘 사용하지 않는다."

## 해결책

   * Optimistic lock

     &nbsp;unique 제약 조건에 의해서도 문제 상황을 풀 수는 없었다. 또한 insert와 delete의 쿼리를 바꿔버리게 되면 Cycle에 대한 shared lock을 두 트랜잭션 모두 들고 있을 필요가 없기 때문에 데드락이 발생하지 않을 수 있다는 생각이 들었다. 하지만, JPA는 insert 쿼리에 대해서는 쓰기 지연을 하지 않고 즉시 DB로 보내기 때문에 굳이 update를 먼저 실행시키고 싶다면 강제적으로 flush를 해줘야 한다. 하지만 그렇게 되면 도메인 레벨에서 DB 관련된 로직이 불필요하게 들어가게 되기 때문에 도메인의 책임이라는 관점에서는 부자연스럽다고 판단하였다

     &nbsp;그런데, 데드락을 발생시키는 상황 자체가 상당히 낮은 확률로 이루어지기 때문에 Optimistic lock을 사용하는 것이 좀 더 자연스럽다고 판단하여 Optimistic lock을 해당 문제를 해결해보려고 시도했다. 또한, 기존의 unique 제약조건에 의해 insert시 오히려 추가적인 배타 락이 발생하며 데드락 문제를 해결하지 못하기 때문에 unique 제약 조건은 제거하기로 하였다. 그러나 결론적으로 Optimistic lock도 데드락을 해결해주지 못했다
     <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199102173-456c03e8-2c48-497a-bb60-d6070d93ac4d.png" align="center" width="800"
            height="600"/>
      </p>
     
     초기 상황은 위 그림과 같다. 초기의 Cycle의 version은 0으로 초기화 된 상황이다. 단순히 조회만 하였기 때문에 version의 변화는 없다
     <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199102457-4a3bf6ba-709c-41f2-879c-d7a48b994f10.png" align="center" width="800"
            height="600"/>
      </p>
     
     &nbsp;이후 트랜잭션 1이 CycleDetail을 삽입하게 된다. 이 때 참조 무결성 원칙에 의해 트랜잭션 1은 Cycle에 대한 shared lock을 점유하게 된다. 이 때 주의해야 할 점은 비록 CycleDetail이 삽입된다고 하더라도 Cycle의 version은 증가하지 않는다는 점이다. 설명의 편의를 위해 트랜잭션 1이 Cycle에 대해 건 shared lock을 주황색 타원으로 표기하였다
     <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199102641-54f0b393-9c56-4e56-ba01-58a642d820a9.png" align="center" width="800"
            height="600"/>
      </p>

     &nbsp;트랜잭션 2 역시 후속과정으로 CycleDetail을 삽입하게 된다. 같은 논리에 의해 트랜잭션 2 역시 Cycle에 대한 shared lock을 획득한다. 설명의 편의를 위해 트랜잭션 2가 Cycle에 대해 건 shared lock을 청록색 타원으로 표기하였다
     <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199102954-be31623b-59c7-4a1d-961f-f9aa358c0ff1.png" align="center" width="800"
            height="600"/>
      </p>

     &nbsp;위 그림 8에서는 트랜잭션 2가 트랜잭션 1이 점유한 shared lock에 의해 update 쿼리가 대기하는 모습이다. 결국 versioning도 쿼리가 실행되어야 하기 때문에 대기에 의해 versioning이 이루어지지 않는다
     <p align="center">
       <img src="https://user-images.githubusercontent.com/50986686/199103167-3f7c8029-778d-4314-bde1-73c4621efdb2.png" align="center" width="800"
            height="600"/>
      </p>
     
     &nbsp;현재 트랜잭션 1이 바꾸려는 Cycle의 version이 최신이므로, 트랜잭션 1의 update문이 실행되게 된다. 그러나, 트랜잭션 1도 update문이 위 그림 8에서의 논리에 의해 대기하게 된다. 따라서, 양 측이 commit이나 rollback이 되지 않는 이상 두 트랜잭션 모두 update 쿼리가 무한히 대기하게 된다. 따라서, Optimistic lock으로도 데드락을 해결할 수 없다. 결국 최종적으로 mysql에서 트랜잭션 1과 2 중 임의의 트랜잭션을 rollback하게 되고, 최종적으로는 Cycle의 versioning이 0에서 1로 이루어진다

* Pessimistic lock

  따라서, “데드락을 해결”하기 위해서는 남은 선택지가 Pessimistic lock밖에 없었고, 해당 방법으로 동시성 문제를 해결하게 되었다. Pessimistic lock이 데드락을 해결하는 방법은 아래 그림과 같다
  <p align="center">
    <img src="https://user-images.githubusercontent.com/50986686/199103706-d666402e-577f-485d-b73e-27795a7a71f6.png" align="center" width="800"
         height="600"/>
   </p>

  위 그림은 트랜잭션 1이 Cycle에 대한 exclusive lock을 거는 모습을 도식화한 모습이다. 설명의 편의를 위해 트랜잭션 1이 Cycle에 대해 건 exclusive lock을 보라색 타원으로 표기하였다
  <p align="center">
    <img src="https://user-images.githubusercontent.com/50986686/199103818-34934345-e924-4680-af72-d80a6488793a.png" align="center" width="800"
         height="600"/>
   </p>
     
  exclusive lock은 exclusive lock 사이의 공유를 허용하지 않으므로 트랜잭션 2의 Cycle에 대한 select문은 대기하게 된다
  <p align="center">
    <img src="https://user-images.githubusercontent.com/50986686/199104101-b5f9ad83-7916-4fef-a5b2-f8d0ae8c2974.png" align="center" width="800"
         height="600"/>
   </p>

  &nbsp;이후 트랜잭션 1은 insert와 update를 정상적으로 진행되게 된다. 이 때 데드락은 발생하지 않는데, 트랜잭션 2가 select 조차 하지 못하고 대기 중이기 때문이다. 따라서 트랜잭션 1은 무사히 커밋되게 된다
    <p align="center">
      <img src="https://user-images.githubusercontent.com/50986686/199104421-05bb29a3-a6a7-4e87-a19c-33559e45729a.png" align="center" width="800"
           height="600"/>
     </p>

  &nbsp;트랜잭션 1이 커밋되었기 때문에 보라색 타원으로 나타내었던 트랜잭션 1의 Cycle에 대한 exclusive lock이 해제되었다. 따라서 트랜잭션 2는 비로소 select 쿼리를 실행할 수 있다. 그러나, 이미 상태가 바뀐 Cycle에 대해 트랜잭션 2가 update를 하려하는 순간, 서비스 레이어에서 작성된 방어 로직에 의해 DB에서 예외가 발생하지 않고 Application단에서 정의된 커스텀 예외가 발생하게 된다. 따라서 데드락은 발생하지 않는다. 아래는 Pessimistic lock을 설정한 코드이다

  * Repository Layer
    <p align="center">
         <img src="https://user-images.githubusercontent.com/50986686/199104655-b68789ff-d4d5-428d-8e0f-1f182d8f0ced.png" align="center" width="800"
              height="300"/>
       </p>
  * Service Layer
     <p align="center">
        <img src="https://user-images.githubusercontent.com/50986686/199104935-93bccacd-40f8-47df-ae00-af78b815ccf5.png" align="center" width="800"
              height="500"/>
       </p>
  * Test code
    <p align="center">
        <img src="https://user-images.githubusercontent.com/50986686/199105211-33363d22-bf61-4f21-a353-71e4873a69c2.png" align="center" width="800"
              height="500"/>
       </p>
    <p align="center">
        <img src="https://user-images.githubusercontent.com/50986686/199105328-521b681a-0cba-4d4f-a20a-b9b8eccc6e79.png" align="center" width="800"
              height="500"/>
       </p>
  
  
## 의문점
   * 첫번째 의문점 
   
     &nbsp;그런데 데드락을 해결한 이후, 한가지 의문점이 들었다. “과연 아무것도 하지 않았을 때, 즉 락이나 unqiue 제약조건, versioning 따위를 하지 않았을 때도 데드락이 발생하는가?”이다. 실제로 테스트를 해본 결과 동시성 문제와 데드락 문제가 동시에 발생하는 것을 알 수 있었다. 동시성과 데드락이 양립할 수 없다고 생각했으나, 아래와 같은 흐름이라면 충분히 양립할 수 있다는 것을 파악하였다
     <p align="center">
        <img src="https://user-images.githubusercontent.com/50986686/199105639-b1aebbc3-bb3a-465a-91a5-1a1c75de391d.png" align="center" width="800"
                height="400"/>
      </p>
     &nbsp;우선 트랜잭션 1과 트랜잭션 2의 관계부터 살펴보자. 트랜잭션 1은 트랜잭션 2보다 더 빨리 insert를 하였고 그에 따라 Cycle에 대한 shared lock을 획득한다. 트랜잭션 2는 트랜잭션 1이 update문을 실행하기 전에 동일한 Cycle에 대한 shared lock을 역시 획득한다. 따라서 트랜잭션 1이 update를 수행하게 되면 트랜잭션 2가 가진 shared lock에 의해 update가 대기하게 된다. 이후 트랜잭션 2가 update를 수행하려는 순간, 서로의 shared lock을 놓아야 update가 어느 한쪽에서라도 진행되기 때문에 데드락이 발생한다.
     &nbsp;데드락이 발생하였기 때문에 mysql에서는 트랜잭션 1과 트랜잭션 2 중 어느 하나를 롤백시켜야 한다. 이 때 설명의 편의를 위해 트랜잭션 2를 rollback한다고 하자. 따라서, 트랜잭션 1은 정상적으로 커밋이 된다
     &nbsp;다음으로 트랜잭션 1과 트랜잭션 3의 관계를 살펴보자. 트랜잭션 3은 트랜잭션 1이 commit되기 이전에 시작이 됨을 알 수 있다. 따라서, mysql의 기본 트랜잭션 격리 속성인 REPEATABLE READ에 의해 아직 상태가 바뀌지 않은 Cycle을 획득하게 된다. 이후 트랜잭션 1이 커밋이 되고, 그 이후에 트랜잭션 3이 insert를 수행하면서 Cycle에 대한 shared lock을 획득하게 된다. 이 시점에는 이미 트랜잭션 1이 commit 되었기 때문에 현재 Cycle에 대한 shared lock은 트랜잭션 3만 가지고 있다
     &nbsp;따라서, 트랜잭션 3은 무난하게 update 쿼리까지 수행하게 되고, commit까지 완료된다. 따라서, 같은 Cycle에 대해 트랜잭션 1과 트랜잭션 3에서 수행한 insert에 의해 동시성 문제가 발생하게 된다. 왜냐하면 “하루에 한번만 인증할 수 있다”라는 규칙에 의해 insert가 한번만 정상적으로 이루어져야 하기 때문이다. 따라서, 위 경우라면 충분히 데드락과 동시성 문제가 양립할 수 있다
     
   * 두번째 의문점 

     &nbsp;추가로, “이 문제를 DB에 의존하여 풀지 않고 application단에서 풀 수 없을까?”라는 의문점도 생각해보았다. 자바에서의 대표적 동시성 처리 방법인 synchronized와 동시성을 지원하는 자료구조인ConcurrentMap을 이용하여 문제를 해결할 수 있다고 생각했다. 코드는 아래와 같다

     * Concurrency Layer
         <p align="center">
             <img src="https://user-images.githubusercontent.com/50986686/199106502-3a583879-3fea-44b4-91c9-fd0f591049b8.png" align="center" width="800"
                 height="500"/>
            </p>
         
     * Controller Layer
         <p align="center">
           <img src="https://user-images.githubusercontent.com/50986686/199106703-ae0b869a-43cb-4787-8ac7-5ebf1c32a8f1.png" align="center" width="800"
                 height="500"/>
         </p>
         
     * Service Layer
         <p align="center">
           <img src="https://user-images.githubusercontent.com/50986686/199106790-9b8a8b2c-cb59-4bc2-9ffb-41e19c27dd69.png" align="center" width="800"
                 height="600"/>
         </p>

     * Test code
       <p align="center">
         <img src="https://user-images.githubusercontent.com/50986686/199107007-9eac3e47-96ef-49ab-9bd1-be09287589c7.png" align="center" width="800"
               height="500"/>
       </p>
       <p align="center">
         <img src="https://user-images.githubusercontent.com/50986686/199107093-0b19d9bb-7df8-47ca-b6a3-3e31cef208a0.png" align="center" width="800"
               height="500"/>
       </p>
       
       &nbsp;위 코드가 정상적으로 동작하는 이유는 SyncManager 객체가 멀티스레드에 의해 각자 생성된다고 하더라도, 특정 id에 대한 lock 객체(여기서는 Object 객체)는 static 변수인 ConcurrentMap에 의해 공유되기 때문이다. 또한, 특정 id가 ConcurrentMap가 없다면 computeIfAbsent를 통해 락 객체를 삽입하게 되는데, ConcurrentMap의 특성 상, computeIfAbsent는 각 id별로 atomic하기 때문에 lock 객체의 동일성을 보장할 수 있다
        
       &nbsp;여기서 어차피 lock 객체가 같다면 SyncManager의 getLock을 접근 제어자를 private에서 public으로 바꾸고 Service Layer에서 별도의 synchronized block으로 처리하면 되지 않느냐고 생각할 수 있다. 하지만, 이미 비즈니스 로직을 담당하는 메소드에 @Transactional이 붙어있기 때문에 원하는 대로 동작하지 않는다. 이유를 간단히 말하면 @Transactional은 프록시로 동작하기 때문이다. 따라서, 프록시로 진행되는 부분은 동시성 제어를 받지 않는다
       <p align="center">
         <img src="https://user-images.githubusercontent.com/50986686/199107505-366309ca-fd6f-4736-afdd-b430fd5f35b5.png" align="center" width="800"
               height="500"/>
       </p>
        
       &nbsp;위 그림에서 스레드 1이 먼저 lock 객체를 획득하여 비즈니스 로직을 진행하게 된다. 따라서 스레드 2는 프록시 객체에서 target 객체의 메소드를 실행할 수 없기 때문에 대기하게 된다. 이 때 스레드 1에서 실행했던 비즈니스 로직이 끝나게 된다. 이후는 다시 프록시가 주체가 되어 진행이 된다. 그런데, 바로 비즈니스 로직이 끝나고 프록시의 로직이 실행되는 순간, lock 객체에 대한 획득을 잃어버리게 되므로 스레드 2의 target 객체가 비즈니스 로직을 실행할 수 있는 빌미를 제공한다. 왜냐면 스레드 1의 현재 실행 주체는 프록시이기 때문이다. 따라서, 경우에 따라 동시성 문제가 발생할 수도 있고 데드락 문제가 발생할 수도 있다. 
        
       &nbsp;결국 원하는 결과를 만들어내기 위해서는 비즈니스 로직 외부에서 synchronized로 Service Layer의 비즈니스 로직을 감싸주어야 한다. 그렇기 때문에 Controller Layer에서 Concurrent Layer를 통해 Service Layer의 로직을 실행하는 흐름으로 진행된다
        
   * 세번째 의문점
        
       &nbsp;하나의 WAS와 하나의 DB라면 synchronized로 해결할 수 있고, 복수의 WAS와 하나의 DB라면 DB lock을 통해 해결할 수 있음을 파악하였다. <br>그렇다면 최종적으로 “복수의 WAS와 복수의 DB라면 해당 문제를 어떻게 해결할 수 있을까?”라는 의문이 발생하였다. 코치님들에게 자문한 결과, <br>“분산 락”을 통해 해결할 수 있다고 하셨다. 구현하는 방법은 Redis나 ZooKeeper, 혹은 mysql에서도 named lock을 통해 직접 구현할 수 있다고 한다

## 마무리

   &nbsp;그럼에도 불구하고 현재 exclusive lock을 걸어서 해결한 것이 최선인지는 솔직히 의문이다. 결국 lock을 건다는 것은 성능상으로 매우 위험한 선택이기 때문이다. 이미 이에 대해 팀에서 많은 논의를 거쳤고 각종 테스트를 통해 lock에 의한 유의미한 성능 저하는 관찰되지 않았으나, 예상치 못한 부분에서 성능 저하가 발생할 수 있는 가능성이 있다는 점은 부인할 수 없다.

   &nbsp;결국 데드락의 직접적 원인인 “외래키 제약조건”을 아예 삭제하는 것이 가장 문제를 근본적으로 해결하는 방법이라고 생각한다. 즉, 테이블을 최초에 잘못 설계한 측면이 있다고 생각한다. 결국 처음 설계할 때부터 외래키 제약이 없도록 설계했으면 데드락이 발생하지 않고 단순히 동시성 문제에서 끝났을 것이기 때문이다.

   &nbsp;외래키를 없애면 데드락 문제를 해결할 수 있지만 그럼에도 불구하고 발생가능성이 있는 동시성 문제를 반드시 죄악시해야 하는 것인가에 대한 의문이 남는다. 사실 하나의 Cycle에 대해 동시에 여러번 인증이 이루어져도 금전적이거나 프로젝트 사이트에서 이용상 불편한 점, 혹은 다른 사용자에게 피해를 입히는 점이 없다면 사실 데이터 정합성이 맞지 않더라도 사용자에게는 하루에 하나만 인증되는 것처럼 보여주기만 해도 문제가 없다

   &nbsp;어쨌든 처음으로 동시성 문제를 마주하였는데 생각보다 알아야 할 내용이 많았다. 또한 전공 시간에 배운 “참조 무결성 원칙”이 직접적인 원인으로 나타난 문제 상황을 마주하여 흥미로웠다. 일상적으로 쓰이는 쿼리에 mysql이 어떻게 내부적으로 lock을 수행하는지도 조금이나마 알게 되어 흥미로웠으나, 이해하는 과정이 매우 어려웠다. 마지막으로 synchronized와 @Transactional을 같이 사용할 때의 문제까지 추가되어 해결하고 글을 작성하기까지 오랜 시간이 걸려서 해결하는 내내 힘들었다. 그러나, 하나의 문제의 원인을 파악하고, 그에 대한 여러 해결책을 적용해보고 각 결과의 원인을 파악하는 것은 재미있었고 결과적으로 lock에 대한 학습을 많이 하게 된 계기가 되어 뿌듯하고 쉽게 하기 힘든 경험을 해서 좋았다. 마지막으로 해당 문제 해결에 도움을 주신 구구 코치님, 토미 코치님, 제이슨 코치님, 관심가지고 논의해준 스모디 백엔드 크루들인 토닉,더즈,조조그린에게 감사한 마음을 전하고 싶다
   
## Reference
* 백은빈, 이성욱 지음 Real MySQL 8.0
* 김연희 지음, 데이테베이스 개론 2판
* [synchronized와 @Transactional 을 동시에 사용 시 문제점](https://kdhyo98.tistory.com/59)
