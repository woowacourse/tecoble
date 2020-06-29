# 컬렉션을 조회하는 로직에 따른 성능 비교
API를 개발하다 보면 DB에서 컬렉션을 조회해야 하는 경우가 많이 생긴다. 컬렉션을 조회하는 방법은 여러 가지가 있지만, 어떤 방법을 사용하느냐에 따라 성능 차이가 심해질 수 있다. 특히나 API 요청 횟수와 데이터가 많이 필요한 서비스에서는 더욱 주의해서 사용해야 할 것이다.

이번 포스팅에서는 흔히 실수하기 쉬운 세 가지 방법을 소개한다. 간단한 예제를 통해 어떤 방법이 가장 성능이 좋은지 비교해 보도록 하자.
예제는 Spring Data JPA를 사용했다.

먼저 테스트에 사용할 간단한 Member 엔티티를 만들어보자.
``` java
@Entity
@Getter @Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(of = {"id", "username", "age"})
public class Member {

    @Id @GeneratedValue
    @Column(name = "member_id")
    private Long id;
    private String username;
    private int age;

    public Member(final String username, final int age) {
        this.username = username;
        this.age = age;
    }
}
```

이 Member 엔티티를 가지고 회원 1000명의 데이터 중에서 Id가 홀수인 회원의 데이터를 조회하는 테스트를 수행해보자. JpaRepository의 save() 메서드를 사용해서 저장하는 코드를 작성하면 다음과 같다.
``` java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    @Transactional
    public void create(final Member member) {
        memberRepository.save(member);
    }
}

@SpringBootTest
@Rollback(false)
class MemberServiceTest {

    private MemberService memberService;

    @Autowired
    private MemberRepository memberRepository;

    @BeforeEach
    void setUp() {
        memberService = new MemberService(memberRepository);
        createMembers();
    }

    @Transactional
    public void createMembers() {
        LongStream.range(1L, 1001L)
                .forEach(l -> {
                    final Member member = new Member("aaa", 20);
                    memberService.create(member);
                });
    }
}
```


자,  이렇게 테스트할 준비를 끝냈으면 이제 컬렉션을 조회하는 세 가지 방법에 대해 성능을 비교해보자. 

## 1. Id 컬렉션을 가지고 Stream Mapping으로 엔티티 조회하는 방법
1~1000까지 자연수 중 홀수로 이루어진 Id 리스트인 `memberIds`를 생성하고 Stream API의 Mapping을 사용해서 모든 홀수 Id에 대해 JpaRepository에 내장된`findById()`로 엔티티 조회한 것을 모아서 Member 리스트를 반환할 수 있다.
``` java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    ....

    public List<Member> findOddIdMembers_v1() {
        List<Long> memberIds = NaturalNumber.oddNumbers();  // 1 ~ 1000까지 자연수 중 홀수로 이루어진 리스트 반환
        return memberIds.stream()
                .map(this::findById)
                .collect(Collectors.toList());
    }
}
```

`findOddIdMembers_v1()` 메서드를 실행해서 함수가 실행되는 속도를 측정해보자.

``` java
@DisplayName("Stream Mapping으로 엔티티 조회하기")
@Test
void findOddNumbers_v1() {
    // when
    long startTime = System.currentTimeMillis();
    List<Member> members = memberService.findOddIdMembers_v1();
    long finishTime = System.currentTimeMillis();

    // then
    assertThat(members).hasSize(500);
    System.out.println("That took: " + (finishTime - startTime) + " ms");
}
```

#### 👉 That took: 1340 ms!!
아직 비교할 만한 기준이 없으므로 수행시간만 봐서는 성능을 판별하기 어렵다.
그럼 일단 어떤 쿼리가 수행되었나 살펴보자.
> ...  
> `select member0_.member_id as member_i1_0_0_, member0_.age as age2_0_0_, member0_.username as username3_0_0_ from member member0_ where member0_.member_id=889;`  
>   
> `select member0_.member_id as member_i1_0_0_, member0_.age as age2_0_0_, member0_.username as username3_0_0_ from member member0_ where member0_.member_id=891;`  
> ...  

홀수 Id를 가진 Member 리스트를 반환하기 위해서 총 500번의 SELECT 쿼리가 수행된다. 필요한 Member의 개수만큼 쿼리 개수는 증가하기 때문에, 회원의 개수가 조금만 더 증가할수록 비효율적인 로직이 되리라는 것을 알 수 있다. 🤔

다음 방법을 살펴보도록 하자.

## 2. 반복자를 인자로 받는 findAllById 사용하여 컬렉션을 한번에 조회하는 방법
다음은 JpaRepository에서 지원하는 `findAllById()` 를 사용하여 한 번에 조회하는 방법이다. 주어진 메서드를 사용하는 것이기 때문에 별도의 로직이 필요하지 않다.
``` java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

	  ......

    public List<Member> findOddIdMembers_v2() {
        List<Long> memberIds = NaturalNumber.oddNumbers();
        return memberRepository.findAllById(memberIds);
    }
}
```

``` java
@DisplayName("findByIds로 한 번에 조회하기")
@Test
void findOddNumbers_v2() {
    // when
    long startTime = System.currentTimeMillis();
    List<Member> members = memberService.findOddIdMembers_v2();
    long finishTime = System.currentTimeMillis();

    // then
    assertThat(members).hasSize(500);
    System.out.println("That took: " + (finishTime - startTime) + " ms");
}
```

그렇다면 수행시간은??
#### 👉 That took: 341 ms!!

첫 번째 방법보다 약 7배 정도 속도가 향상되었다.!! 👏
그렇다면 이번에는 과연 어떤 쿼리가 수행될까?

> `select member0_.member_id as member_i1_0_, member0_.age as age2_0_, member0_.username as username3_0_ from member member0_ where member0_.member_id in (1 , 3 , .... , 997 , 999);`  

이번에는 객체 수 만큼 쿼리문이 수행되는 것이 아니라 한 번의 SELECT 쿼리문이 수행되었다. 별도의 로직 없이 쿼리문 하나로 원하는 Member 리스트를 반환할 수 있는 것이다. 

하지만 수행되는 쿼리문을 자세히 보면 조건문에서 in 절을 사용하여 데이터베이스 내부에서 회원 데이터를 일일이 색인 알고리즘이 수행되고 이를 바탕으로 우리가 원하는 객체를 조회하고 있다는 것을 알 수 있다. 이 또한 회원 수가 많아질 수록 색인하는 데 시간이 오래 걸릴 것을 예상해볼 수 있다.

더 좋은 방법은 없을까? 마지막으로 애플리케이션 내부에서 객체를 캐싱하는 방법을 살펴보자.

## 3. findAll로 모든 Member를 조회한 뒤 캐싱하는 방법
마지막 방법은 JpaRepository의 인터페이스인 `findAll()`를 사용하여 모든 Member를 조회한 뒤, 서비스 로직에서 이를 캐싱하여 Member 리스트를 반환하는 방법이다.
``` java
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class MemberService {

    private final MemberRepository memberRepository;

    .....

    public List<Member> findOddIdMembers_v3() {
        List<Long> memberIds = NaturalNumber.oddNumbers();
        List<Member> allMembers = memberRepository.findAll();
        Map<Long, Member> memberMap = new HashMap<>();
        LongStream.range(1L, 1001L)
                .forEach(l -> memberMap.put(l, allMembers.get((int) l)));

        return memberIds.stream()
                .map(memberMap::get)
                .collect(Collectors.toList());
    }
}
```

앞선 두 방법보다 코드가 좀 더 복잡해 보인다.  모든 회원 객체를 가지고 Map을 초기화했고, 주어진 memberIds로 Stream을 사용해 값을 캐싱하고 있다.

``` java
@DisplayName("findAll로 캐싱하기")
@Test
void findOddNumbers_v3() {
    // when
    long startTime = System.currentTimeMillis();
    List<Member> members = memberService.findOddIdMembers_v3();
    long finishTime = System.currentTimeMillis();

    // then
    assertThat(members).hasSize(500);
    System.out.println("That took: " + (finishTime - startTime) + " ms");
}
```

#### 👉 That took: 59 ms!!

!!!! 🧐
두 번째 방법보다 무려 5배 이상이나 속도가 빨라졌다.
애플리케이션 내에서 반복문이 존재하여 코드의 가독성이 떨어진다는 단점은 있지만, 첫 번째 방법에 비하면 무려 22배 이상이나 속도가 빨라진 것이다.

이번에도 역시 쿼리문은 두 번째 방법과 마찬가지로 한 번만 수행된다.

> `select member0_.member_id as member_i1_0_, member0_.age as age2_0_, member0_.username as username3_0_ from member member0_`  

쿼리 문의 수행 개수는 두 번째 방법과 똑같지만 이 방법은 색인이 수행되는 조건문이 없기 때문에 속도가 훨씬 빠르다는 것을 알 수 있다. 

## 결론 
현재는 함수를 각각 한 번씩만 수행했지만 특정 Id의 회원들을 조회하는 로직이 여러 번 수행된다면 애플리케이션의 성능은 그 차이가 커지게 된다.

비즈니스 로직상 특정 조건의 회원들을 한 번에 조회하는 경우가 별로 없을 때는 가독성을 고려하여 두 번째 방법과 세 번째 방법 중 선택해서 사용할 수도 있을 것이다.
그러나 첫 번째 방법과 같이 필요한 객체의 개수만큼 쿼리문을 수행하는 방식은 절대 사용하면 안 된다.

이 글을 통해 한 가지만 명심하자.

> DB에 접근하는 쿼리 수가 많아질수록 애플리케이션의 성능은 나빠진다.   

그렇기 때문에 비록 단순한 로직이라 할지라도, 반복문 안에 쿼리를 넣는 것보다 필요한 데이터를 한번에 가져올 수 있는 쿼리를 작성하는 것이 더 유익하다고 볼 수 있다.

