---
layout: post
title: Mockito, 이대로 괜찮은가?
author: [우]
tags: ['test', 'mockito']
date: "2020-10-16T12:00:00.000Z"
draft: false
image: ../teaser/mockito.png
---

![mockito-logo](../images/2020-10-16-mockito-1.png)

<p style="text-align:center;">
<a href="https://site.mockito.org" target="_blank">( Tasty mocking framework for unit tests in Java! )</a>
</p>

## Mockito

Mock 객체와 Mockito에 대한 설명은 스티치의 ["Test Double을 알아보자"](https://woowacourse.github.io/tecoble/post/2020-09-19-what-is-test-double)와 ["Mockito와 BDDMockito는 뭐가 다를까?"](https://woowacourse.github.io/tecoble/post/2020-09-29-compare-mockito-bddmockito)를, 더 자세한 내용은 [공식문서](https://site.mockito.org)를 읽어보길 바란다.

간단하게 말하자면, Mockito는 단위 테스트를 위한 mocking 프레임워크이다. 

생성한 Mock 객체의 특정 메소드에 대한 입력-결과값을 미리 지정하거나, 동작 여부를 검증할 수 있다.

테스트 하기 어려운 부분을 Mock 객체로 대체해 **테스트하려는 부분에 집중**할 수 있다.
간혹 복잡할 수 있는 **의존성을 간소화**시키고, **테스트 실행 속도를 향상**시킨다.

---

한가지 예제를 살펴보자.

Mockito를 통해 서비스 레이어의 테스트에서 DB(DAO) 의존성을 제거한 경우이다.

테이블 그룹을 생성하며, 테이블 그룹은 테이블들을 포함한다.
테이블 그룹이 생성되면 포함된 모든 테이블은 해당 그룹의 아이디를 가지며 `empty`값을 `false`로 변경한다.

```java
@Service
public class TableGroupService {
    @Autowired
    private OrderTableDao orderTableDao;
    @Autowired
    private TableGroupDao tableGroupDao;

    @Transactional
    public TableGroup create(final TableGroup request) {
        List<Long> orderTables = request.getOrderTables()
            .stream()
            .map(OrderTable::getId)
            .collect(Collectors.toList());
    
        if (CollectionUtils.isEmpty(orderTableIds) || orderTableIds.size() < 2) {
            throw new IllegalArgumentException();
        }
    
        List<OrderTable> savedOrderTables = orderTableDao.findAllByIdIn(orderTableIds);
    
        if (orderTableIds.size() != savedOrderTables.size()) {
            throw new IllegalArgumentException();
        }
    
        TableGroup savedTableGroup = tableGroupDao.save(request);
    
        final Long tableGroupId = savedTableGroup.getId();
        for (OrderTable savedOrderTable : savedOrderTables) {
            savedOrderTable.setTableGroupId(tableGroupId);
            savedOrderTable.setEmpty(false);
            orderTableDao.save(savedOrderTable);
        }
    
        return savedTableGroup;
    }
}
```
```java
@ExtendWith(MockitoExtension.class)
class TableGroupServiceTest {
    @InjectMocks
    private TableGroupService tableGroupService;
    @Mock
    private OrderTableDao tableDao;
    @Mock
    private TableGroupDao tableGroupDao;
    
    @DisplayName("테이블 그룹 추가")
    @Test
    void create() {
        List<OrderTable> orderTables = Arrays.asList(TABLE1, TABLE2);
        TableGroup request = TableGroup.builder()
            .orderTables(orderTables)
            .build();

        List<Long> tableIds = orderTables.stream()
            .map(OrderTable::getId)
            .collect(Collectors.toList());
        given(tableDao.findAllByIdIn(tableIds)).willReturn(orderTables);
        given(tableGroupDao.save(request)).willReturn(TABLE_GROUP);
    
        TableGroup createdTableGroup = tableGroupService.create(request);
    
        assertAll(
            () -> assertThat(createdTableGroup.getOrderTables().get(0).getTableGroupId()).isEqualTo(TABLE_GROUP.getId()),
            () -> assertThat(createdTableGroup.getOrderTables().get(1).getTableGroupId()).isEqualTo(TABLE_GROUP.getId()),
            () -> assertThat(createdTableGroup.getOrderTables().get(0).isEmpty()).isFalse(),
            () -> assertThat(createdTableGroup.getOrderTables().get(1).isEmpty()).isFalse()
        );
    }
}
```

Mockito 덕분에 DB에 의존하지 않고 테스트를 완료했다. 
DB에 접근하지 않고 필요한 컨텍스트만을 호출해 사용하기 때문에 테스트도 빠르게 실행할 것이다.

그렇다면, 이대로도 테스트는 괜찮은걸까?

## 무엇을 테스트할 것인가?

테스트는 `설계`를 검증하기 위해 작성된다.

메소드 `A`에 `B`가 들어가면 `C`를 반환한다.
테스트 시에 알아야할 것은 테스트 대상인 `A`, 입력값인 `B`, 출력값인 `C` 뿐이다.
물론 각 항목이 복잡할 수도 있다.
내부의 구현이 어찌되었건, 테스트는 입력값에 대한 기대값을 확인하는 행위다.  
테스트는 일종의 설명서 역할을 한다.

위의 예제를 다시 한 번 살펴보자.
테스트 코드만 봐도 여러 사실을 알 수 있다.

`TableGroupService.create()`는 `TableGroup`를 매개변수로 받고 변화된 객체를 반환한다.
`TableGroup` 내부의 `OrderTables`가 각각 테이블 그룹의 ID를 갖고 `empty`값은 `false`가 된다.

그 과정에서 `TableDao.findAllByIdIn()`과 `TableGroupDao.save()`가 실행된다.
실행 시 넘기는 인자와 반환값의 형태도 알 수 있다.

Mockito를 사용하게 된다면, 이처럼 테스트하려는 대상의 내부 구현도 일부 알고 있어야한다.
`@Mock` 대상 객체가 많아질수록, 호출하는 메소드가 많아질수록 테스트는 길어질 것이다.
이는 테스트의 가독성을 저하시키고 되려 테스트 대상에 집중하는 것을 방해할 수 있다.

내부 로직의 변화로 호출하는 메소드가 바뀌거나, Mock 객체에 넘기는 인자가 바뀌는 경우 에러를 발생시킨다.
테스트는 점점 설계만을 검증하지 않고 내부 구현에 대한 검증까지 진행하게 된다.

## Mockito, 언제 써야할까?

Mockito는 언제 사용하는 게 좋을까?

가장 확실한 것은 **제어할 수 없는 영역**을 대체하기 위해 사용하는 것이다.
`Random`이나 `Shuffle`과 같이 결과값을 예측할 수 없어 테스트할 수 없는 경우, `LocalDate.now()`와 같이 외부 요인에 의해 변해가는 값 등이 있다.
외부 라이브러리나 저장소 등의 권한 밖의 영역 역시 이에 포함된다.

하지만 이 경우에도 무조건적으로 Mockito를 사용하기 보다는 설계를 바꾸는 것이 더 바람직하다.
메소드 내에서 테스트하기 어려운 부분을 메소드 외부에서 관리하도록 변경해 테스트하기 쉽게 설계를 변경하는 것이다.
이에 대한 자세한 이야기는 스티치의 ["메서드 시그니처를 수정하여 테스트하기 좋은 메서드로 만들기"](https://woowacourse.github.io/tecoble/post/2020-05-07-appropriate_method_for_test_by_parameter)를 참고하길 바란다.

프로덕션 서버와의 분리를 위해 Mockito를 사용하는 경우도 있다.
앞선 예제가 바로 그런 경우다.
하지만 이는 DB에 대한 안정성을 잃을 우려가 생긴다.
별도의 DAO 테스트를 진행하거나 통합테스를 통해 안정성을 보장해주어야한다.
후자의 경우에는 H2와 같은 Embedded 시스템을 통해 대체 가능하다.
혹은 프로덕션 서버와 같은 환경의 별도 테스트 DB를 구축하는 것도 하나의 방법이다.

DB를 Mocking하지 않고 사용하게 된다면 테스트간의 의존성 문제가 발생할 수 있다.
이러한 테스트 격리 방법에 대해서는 보스독의 ["인수테스트에서 테스트 격리하기"](https://woowacourse.github.io/tecoble/post/2020-09-15-test-isolation)를 읽어본다면 많은 도움이 될 것이다.

그렇다면 Mockito를 사용하지 않고 전부 대체해야 할까?

아니다.
앞선 상황들 외에, 대체할 수 없는, 테스트하기 어려운 상황이 분명 생길 수 있다.

외부 API같은 경우는 상위 객체로 책임을 전가하기 힘들 수 있다.
컨트롤러에서 실행하는 인증 인가 서비스에 대해서는 테스트 환경을 구축하기 어려울 수 있다.
복잡한 레이어 계층을 갖는 대규모 어플리케이션의 경우엔 계층의 경계에서 Mockito를 사용하는 것이 본래의 테스트에 더 집중할 수 있게 될 것이다.

## 결론

Mockito는 단위테스트를 효율적으로 하기 위한 좋은 프레임워크이지만, 그로 인한 단점도 명확하다.
테스트의 속도를 높혀 빠른 피드백을 받을 수 있다는 장점만으로 무작정 적용하기엔 부족한 감이 있다.
Mockito를 적용하기 전에, 테스트 할 대상이 무엇인지 정확하게 파악하고 충분히 고민한다면 더 좋은 테스트 코드를 작성할 수 있을 것이다.

---

## 참고자료

[우아한 테크코스 리뷰1](https://github.com/woowacourse/jwp-refactoring/pull/2#discussion_r491075672)  

[우아한 테크코스 리뷰2](https://github.com/woowacourse/jwp-refactoring/pull/12#discussion_r503260073)

[스프링캠프 2019 - 무엇을 테스트할 것인가? 어떻게 테스트할 것인가? (권용근)](https://www.youtube.com/watch?v=YdtknE_yPk4)  

[Mockito Test Framework 알아보기](https://velog.io/@ausg/Mockito-Test-Framework-%EC%95%8C%EC%95%84%EB%B3%B4%EA%B8%B0)
