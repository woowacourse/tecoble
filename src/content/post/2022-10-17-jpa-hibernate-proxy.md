---
layout: post
title: "JPA Hibernate 프록시 제대로 알고 쓰기"
tags: ['JPA', 'hibernate']
author: [4기_오찌]
date : "2022-10-17T13:10:00.000Z"
draft : false
image: ../teaser/active-profile.png
---

JPA를 사용할 때 장점이 뭘까요? 많은 장점들이 있겠지만, 그 중 하나로 객체 그래프를 통해 연관관계를 탐색할 수 있다는 것을 꼽을 수 있습니다. 하지만 엔티티들은 데이터베이스에 저장되어 있기 때문에 한 객체 조회 시 연관되어 있는 엔티티들을 모두 조회하는 것 보다는 필요한 연관관계만 조회해 오는 것이 효과적입니다. 이런 상황을 위해 JPA는 지연 로딩이라는 방식을 지원하는데요, 그 중에서도 우리가 일반적으로 가장 많이 사용하는 JPA 구현체인 하이버네이트(Hibernate)는 프록시 객체를 통해 지연 로딩을 구현하고 있습니다. JPA 프록시는 지연 로딩이 가능하게 해주는 고마운 기술이지만 잘못 사용하면 예상하지 못한 예외들을 만나게 될 수 있습니다. 오늘 이 시간에는 JPA를 사용하며 만나는 예외에 당황하지 않기 위해 JPA 프록시에 대해 알아보는 시간을 갖도록 하겠습니다.

# JPA 프록시(Proxy) 란?
JPA 프록시에 대해 알아보기에 앞서, 프록시란 무엇일까요? 프록시는 ‘대신하다‘라는 의미를 가지고 있는 단어인데요, 동작을 대신해주는 가짜 객체의 개념이라고 생각하시면 되겠습니다. 프록시는 JPA 하이버네이트에만 존재하는 개념은 아닙니다. 대표적으로 스프링에서도 초기화를 지연시켜준다든가, 트랜잭션을 적용한다든가 하는 부가 기능을 추가할 때 프록시 기술을 사용하는 것을 생각하면 이해하기 쉽습니다.

위에서 설명했듯이 하이버네이트는 지연 로딩을 구현하기 위해 프록시를 사용합니다. (JPA 명세에는 지연 로딩의 구현 방법은 나와있지 않습니다. 즉, 구현체에 지연 로딩의 방법을 위임합니다. 때문에 이후로 설명하는 모든 내용은 하이버네이트 기준입니다.) 지연 로딩을 하려면 연관된 엔티티의 실제 데이터가 필요할 때 까지 조회를 미뤄야 합니다. 그렇다고 해당 엔티티를 연관관계로 가지고 있는 엔티티의 필드에 null 값을 넣어 둘 수는 없겠죠? 하이버네이트는 지연 로딩을 사용하는 연관관계 자리에 프록시 객체를 주입하여 실제 객체가 들어있는 것처럼 동작하도록 합니다. 덕분에 우리는 연관관계 자리에 프록시 객체가 들어있든 실제 객체가 들어있든 신경쓰지 않고 사용할 수 있습니다.
참고로 프록시 객체는 지연 로딩을 사용하는 것 외에도 `em.getReference`를 호출하여 프록시를 호출할 수도 있습니다.

# 프록시는 실제 객체의 상속본이다
프록시가 어떻게 실제 객체처럼 동작을 할 수 있을까요? 이는 프록시가 실제 객체를 상속한 타입을 가지고 있기 때문입니다. 그리고 프록시 객체는 실제 객체에 대한 참조를 보관하여, 프록시 객체의 메서드를 호출했을 때 실제 객체의 메서드를 호출합니다. 그래서 실제 객체 타입 자리에 들어가도 문제 없이 사용할 수 있는 것이죠.
프록시 객체가 실제 객체의 상속본인 것은 JPA 엔티티 생성의 중요한 규칙을 만들어내기도 했습니다. 바로 '기본 생성자는 최소 protected 접근 제한자를 가져야 한다.' 는 규칙과 '엔티티 클래스는 final로 정의할 수 없다. 입니다.' 만약 기본 생성자가 private이면 프록시 생성 시 `super`를 호출할 수 없을 것이고, 엔티티를 final로 선언한다면 상속이 불가능하게 되겠죠?

# 프록시의 초기화
그런데 최초 지연 로딩 시점에는 당연히 참조 값이 없습니다. 때문에 실제 객체의 메서드를 호출할 필요가 있을 때 데이터베이스를 조회해서 참조 값을 채우게 되는데요, 이를 프록시 객체를 초기화한다고 합니다. 앞서 말씀드렸듯이 실제 객체의 메서드를 호출할 필요가 있을 때 select 쿼리를 실행하여 실제 객체를 데이터베이스에서 조회해오고, 참조 값을 저장하게 됩니다. 예를 들어볼까요? 다음과 같은 두 엔티티가 있습니다.
``` java
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String name;

    @JoinColumn(name = "team_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private Team team;

    public Member(String name, Team team) {
        this.name = name;
        this.team = team;
    }
    ...
}

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column
    private String name;

    public Team(String name) {
        this.name = name;
    }
    ...
}
```
(간략한 코드를 위해 Lombok을 사용한 점 이해 부탁드립니다)
Member의 연관관계 Team은 지연 로딩으로 설정되어 있기 때문에, Member를 조회해오게 되면 team 필드 자리에는 프록시가 들어가 있습니다. 이 때 프록시 Team의 getName 메서드를 호출하게 되면 select 쿼리가 실행되고 프록시가 초기화됩니다.

``` java
System.out.println("========");
Team team = member.getTeam();
System.out.println(team.getName()); // 이 시점에 프록시 초기화!
```

![](https://velog.velcdn.com/images/ohzzi/post/9053cb2c-4838-4698-8cdc-4230e54bf7ad/image.png)

단, 이 때 프록시가 실제 객체를 참조하게 되는 것이지 프록시가 실제 객체로 바뀌지는 않는다는 점을 주의하셔야합니다.
참고로 프록시를 초기화하지 못하는 경우도 있습니다. 프록시의 초기화는 영속성 컨텍스트의 도움을 받습니다. 때문에 영속성 컨텍스트의 관리를 받지 못하는 상황, 즉 준영속 상태의 프록시를 초기화 한다거나 OSIV 옵션이 꺼져 있는 상황에(기본값으로는 켜져 있습니다.) 트랜잭션 바깥에서 프록시를 초기화 하려 하는 경우 `LazyInitializationException`을 만나게 되실 수 있습니다. 때문에 프록시를 초기화할 때는 반드시 프록시가 `영속 상태`여야 한다는 점에 주의해주세요!

## id를 조회할 때는 프록시가 초기화되지 않는다
그런데 getName이 아닌 getId를 호출할 때도 초기화될까요? 테스트해보도록 하겠습니다.
``` java
System.out.println("========");
Team team = member.getTeam();
System.out.println(team.getId());
```
![](https://velog.velcdn.com/images/ohzzi/post/05499387-2b31-4fcf-82c7-53905d1bcd4d/image.png)

id를 그대로 출력하고 select 쿼리는 발생하지 않습니다! 우리는 여기서 식별자를 조회할 때는 프록시를 초기화하지 않는다 라는 사실을 유추할 수 있습니다.
좀 더 자세히 들어가볼까요? 프록시 초기화 과정은 프록시 객체 내부의 `ByteBuddyInterceptor`라는 클래스가, 정확히는 상위의 추상 클래스인 `AbstractLazyInitializer`가 담당하게 됩니다. AbstractLazyInitializer의 초기화 로직을 확인해보도록 하겠습니다.
``` java
@Override
public final Serializable getIdentifier() {
    if (isUninitialized() && isInitializeProxyWhenAccessingIdentifier() ) {
        initialize();
    }
    return id;
}
```

엔티티의 식별자를 조회하는 메서드를 호출하게 되면 최종적으로는 AbstractLazyInitializer의 getIdentifier 메서드를 호출하게 되는데요, 이 때 if 문 바깥쪽을 보면 그대로 id를 반환하는 것을 알 수 있습니다. AbstractLazyInitializer가 id 값을 가지고 있기 때문에 가능한 일입니다. if문 안쪽은 초기화되지 않았을 것과, 식별자 접근시 프록시를 초기화 하는 옵션을 켰을 때 true가 되는 조건문인데요, hibernate.jpa.compliance.proxy 라는 설정값을 true로 해 줘야만 해당 옵션이 켜집니다. 기본 설정값은 false이기 때문에 일반적으로는 id의 getter를 호출하게 되면 프록시가 초기화되지 않는 것이죠.
그런데 주의하실 점이 있습니다. 제가 호출한 메서드는 `getId`로, 자바 빈 규약에 맞는 get + 필드명 이기 때문에 getIdentifier 메서드가 호출된 것입니다. 만약 `findId`와 같이 getter에 대한 자바 빈 규약을 만족시키지 못하거나, `getTeamId`와 같이 식별자 이름과 매칭되지 않을 경우 getIdentifier 메서드를 호출하지 못하고 프록시가 초기화되게 됩니다.
또하나 주의하실 점은, id값은 프록시가 아니라 프록시 내부의 인터셉터에 들어있고, 프록시 객체가 가진 필드값들은 모두 null이라는 것입니다. 일반적으로는 필드로 꺼내 쓰기 때문에 상관 없겠지만, 만약 필드가 public이어서 바로 접근한다면 null에 접근하게 되는 것입니다.

![](https://velog.velcdn.com/images/ohzzi/post/765c9b32-9cec-4cbd-aea8-79cdd1fe17c4/image.png)

# 프록시의 equals를 재정의 할 때는 instanceof와 getId를 사용할 것
우리는 흔히 equals / hashcode 메서드를 만들 때 인텔리제이의 기능을 빌리곤 합니다. 그리고 보통 JPA 엔티티의 equals는 id값만 비교해서 재정의하게 되죠. 결국 다음과 같은 메서드가 만들어질 것입니다!
``` java
@Override
public boolean equals(Object o) {
    if (this == o) {
        return true;
    }
    if (o == null || getClass() != o.getClass()) {
        return false;
    }
    Team team = (Team) o;
    return Objects.equals(id, team.id);
}
```

이렇게 equals를 재정의하게 된다면, 프록시 객체의 equals를 호출했을 때 문제가 생기게 됩니다! 다음 테스트 코드를 통해 확인해보겠습니다.
``` java
Team team = member.getTeam();
Team sameTeam = member.getTeam();
assertThat(team).isEqualTo(sameTeam);
```
![](https://velog.velcdn.com/images/ohzzi/post/bec03142-1fc3-4b80-bc4a-b5bdbf404371/image.png)

주소값도 같은 객체인데 equals 메서드를 통해 동등성을 비교하는 isEqualTo를 통과하지 못합니다. 주소값이 같기 때문에 `==`로 비교하면 같은 객체라고 하는데, 정작 동등성은 만족시키지 못하는 것이죠. 어떻게 된 일일까요? 답은 `getClass`에 있습니다.
sameTeam을 인수로 하여 team의 equals를 호출합니다. getId가 아닌 메서드를 호출했으니 프록시 team이 초기화되고 프록시 team 내부의 실제 객체의 equals를 호출합니다. 그렇다면 getClass는 어떻게 될까요? equals 안에서 호출되는 getClass의 결과는 Team.class인 반면, 인수로 전달받은 sameTeam의 getClass의 결과로는 프록시 타입이 나오게 되어 equals 결과값이 false가 나오게 됩니다.

때문에 일반적으로 equals를 비교하던 것처럼(물론 애초에 리스코프 치환 원칙을 위반하는 코드이기는 합니다!) getClass를 비교하는 것으로 equals를 작성해서는 안되고, `o instanceof Team`과 같은 형태로 코드를 작성해주셔야 합니다! 프록시는 원본 객체의 상속이라고 했었죠? 때문에 instanceof를 통과하게 됩니다.
그리고 또 하나 수정해줘야 하는 부분이 있습니다. 일반적인 객체의 상속관계라면 문제가 없겠지만, 위에서 설명드렸듯이 `프록시의 필드값은 모두 null`입니다. 그래서 team.id는 사실 null인 것이죠. 그래서 `Objects.equals(id, team.id)`는 id값과 null을 비교하게 되어 false가 반환되게 됩니다. 하지만 getId는 실제 id를 반환하므로, 우리는 equals 코드를 다음과 같이 고칠 수 있습니다.
``` java
@Override
public boolean equals(Object o) {
    if (this == o) {
        return true;
    }
    if (o == null || o instanceof Team) {
        return false;
    }
    Team team = (Team) o;
    return Objects.equals(id, team.getId());
}
```

프록시의 equals 부분은 간과하고 넘어가기 쉬운 부분이면서, 많은 버그를 발생시키는 부분이니 꼭 주의해주시길 바랍니다 :)

# 프록시가 생성되면 영속성 컨텍스트는 프록시를 반환한다
프록시로 만들어진 엔티티에 대한 조회가 들어온다면, 영속성 컨텍스트는 실제 엔티티와 프록시 객체 중 어떤 객체를 반환해야 할까요?
영속성 컨텍스트의 특징으로 `동일성 보장`이 있습니다. 그런데 위에서 한 번 프록시로 만들어진 객체는 프록시 초기화를 하더라도 실제 엔티티로 변환되지 않고 참조값만 가지게 된다고 언급했습니다. 때문에 동일성을 보장해주기 위해서 한 트랜잭션 내에서 최초 생성이 프록시로 된 엔티티는 이후 초기화 여부에 상관 없이 영속성 컨텍스트가 무조건 같은 프록시 객체를 반환해주게 됩니다.
``` java
Team team = teamRepository.findById(1L).get();
assertThat(team).isInstanceOf(HibernateProxy.class);
```

![](https://velog.velcdn.com/images/ohzzi/post/204c244d-3647-4072-bf40-26f024de360e/image.png)

반대로 영속성 컨텍스트에 최초로 저장될 때 실제 엔티티로 저장될 경우, 이후로는 프록시가 아닌 실제 엔티티가 반환됩니다. 이는 지연 로딩으로 인해 프록시가 들어갈 자리에도 마찬가지로, 이미 영속성 컨텍스트에 엔티티가 저장된 상태에서 해당 엔티티를 FetchType.LAZY로 가지고 있는 엔티티를 조회하는 경우라면, 프록시 객체를 반환하는 대신 실제 엔티티를 반환해주게 됩니다.

``` java
System.out.println("========");
Team team = teamRepository.findById(1L).get();
Member member = memberRepository.findById(1L).get();
assertThat(member.getTeam()).isNotInstanceOf(HibernateProxy.class)
```
![](https://velog.velcdn.com/images/ohzzi/post/ef85f291-c9fd-463b-9a54-7cc59d9b9255/image.png)

# 정리
JPA Hibernate의 프록시는 지연 로딩을 통해 불필요한 데이터 조회를 방지해주는 고마운 기술입니다. 하지만 그만큼 기술에 대한 이해를 하고 사용하지 못하면 예상치 못한 결과로 오히려 버그와 씨름하느라 더 많은 자원을 낭비할수도 있는 기술입니다. 대부분의 기술이 버그와 부작용을 막으려면 그 기술에 대해 깊게 이해해야 하겠지만, 제 생각에 프록시는 눈으로 보이는 부분이 많지 않기 때문에 더더욱 그렇습니다. 물론 이 글을 끝까지 정독해주신 여러분이라면 큰 문제 없이 프록시를 다루게 되실 수 있을 겁니다. 프록시에 대해서 제대로 알고, 편하고 안전하게 JPA를 사용해보도록 합시다!

# 참고 자료
- 자바 ORM 표준 JPA 프로그래밍 (김영한 저)