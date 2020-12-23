---
layout: post
title: Spring Security가 적용된 곳을 효율적으로 테스트하자.
author: [라테]
tags: ['security', 'test']
date: "2020-09-30T12:00:00.000Z"
draft: false
image: ../teaser/spring-security.jpg
---

Spring Security와 관련된 기능을 테스트하다보면 인증 정보를 미리 주입해야 하는 경우가 종종 발생한다.
기본적으로 생각할 수 있는 가장 간단한 방법은 테스트 전에 SecurityContext에 직접 Authentication을 주입하는 것이다.

```java
class DemoTest {
    @BeforeEach
    void setUp() {
        UserDetails user = createUserDetails();

        SecurityContext context = SecurityContextHolder.getContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(user, user.getPassword(), user.getAuthorities()));
    }

    private UserDetails createUserDetails() {
        ...
    }

    @Test
    void test() {
        ...
    }
}
```

다만 이렇게 할 경우, 인증 정보를 필요로 하는 메서드를 테스트할 때 항상 SecurityContext에 Authentication을 주입해야 하는 번거로움이 생길 수 있으며, setUp을 통해 관리를 한다고 해도
메서드에서 요구되는 권한 설정이 바뀔 경우, SecurityContext를 비우고 다시 원하는 정보로 채워야하는 번거로움이 생기게 된다.

이러한 경우에 Spring Security에서 테스트 시 어노테이션을 통해 간단하게 인증 정보를 줄 수 있는 방법을 알게 되어 공유해보고자 한다. 

> 간단하게 Spring Security가 인증 정보를 어떻게 관리하는 지 구조를 확인하고 넘어가자.
>
> ![](../images/2020-09-30-spring-security-test-01.png)
> 우선 사용자의 인증 정보를 담은 Authentication가 있으며, 이 정보를 SecurityContext에 보관한다.
> 이 SecurityContext는 기본적으로 SecurityContextHolder에 있는 ThreadLocal에 저장되며 결과적으로 같은 Thread 내에서는 SecurityContextHolder를 통해 인증 정보에 접근할 수 있다. 

우선 간단하게 Test 메소드에 사용자의 인증이 필요하다고 가정해보자.

```java
@Service
public class DemoService {
    private final DemoRepository demoRepository;

    public DemoService(DemoRepository demoRepository) {
        this.demoRepository = demoRepository;
    }

    @PreAuthorize("isAuthenticated()")
    public Long save(Demo demo) {
        return demoRepository.save(demo).getId();
    }
}
```

> @PreAuthorize("isAuthenticated()")는 메소드를 실행하기 전 인증된 사용자가 요청했는지를 확인한다. @PreAuthorize는 SpeL expression을 사용할 수 있으며 
> "isAuthenticated()"는 인증된 사용자를 판별할 수 있는 메소드로서 Spring Security에서 미리 지원되는 표현식이다.
> 
> @PreAuthorize 어노테이션을 활용하기 위해서는 @EnableGlobalMethodSecurity(prePostEnabled=true)를 통해 메소드 보안을 활성화시켜주어야 한다.

## @WithMockUser
@WithMockUser 어노테이션은 테스트에 필요한 인증된 인증 정보를 제공하며 간단한 정보를 기본으로 설정할 수 있게끔 도와준다.

```java
@Test
@WithMockUser
public void authenticatedUser() {
    assertThat(demoService.save(new Demo())).isNotNull();
}
```

기본적으로 @WithMockUser만 사용할 경우, 미리 인증된 사용자를 만들어놓지 않아도 간단하게 인증이 필요한 메소드를 테스트할 수 있다.

@WithMockUser는 userName, password, role 등을 어노테이션 value를 통해 설정해줄 수 있으며, default value로 username = "user", password = "password", role = "USER"가 설정되어 있다.

> 어노테이션 속성 중 role과 authorites의 차이는 단순히 권한 이름을 지정할 때 "ROLE_"이라는 단어를 prefix로 달아줄 것인가에 대한 차이만 존재한다.
> role에 값을 준다면 prefix가 붙고 authorites에 있으면 값 그대로 권한이 지정된다. 다만 authorites는 role과 동시에 지정될 수 없다.

테스트 시 필요한 정보가 인증여부 정도거나, 사용자 이름 등과 같이 간단한 것이라면 이 어노테이션을 활용한다면 간단히 테스트를 진행할 수 있을 것이다.

> 좀 더 명확히 설명하자면 SecurityContext에 등록되는 Authentication은 UsernamePasswordAuthenticationToken이며,
> Authentication에 등록되는 Principal은 User(org.springframework.security.core.userdetails) 객체이다. @WithMockUser가 이렇게 동작하는 이유는 밑에서 좀 더 추가적으로 설명할 것이다.

## @WithAnonymousUser

@WithMockUser가 인증된 사용자에 정보를 어노테이션을 통해 간단히 주입해주었다면, 반대로 @WithAnonymousUser는 인증되지 않은 사용자를 테스트에서 사용할 때 필요한 어노테이션이다.

간단하게 생각한다면, 아예 이 어노테이션이 없으면 되지 않나?라고 생각할 수도 있지만, @WithMockUser를 비롯한 유저 인증 관련 어노테이션이 클래스에서도 사용될 수 있다는 걸 생각해보면 특정 메소드에서 미인증 인증 정보가 필요할 경우 유용하게 사용될 수 있을 것이다.

```java
@SpringBootTest
@WithMockUser
class DemoServiceTest {
    @Autowired
    private DemoService demoService;

    @Test
    void test1() {
        System.out.println("test1: " + SecurityContextHolder.getContext().getAuthentication());
        ...
    }

    @Test
    @WithAnonymousUser
    void test2() {
        System.out.println("test2: " + SecurityContextHolder.getContext().getAuthentication());
        ...
    }
}
```

이와 같이 실행했을 때, 콘솔창을 확인해본다면

```
test1: org.springframework.security.authentication.UsernamePasswordAuthenticationToken...
test2: org.springframework.security.authentication.AnonymousAuthenticationToken...
```

@WithAnonymousUser로 지정한 메소드는 AnonymousAuthenticationToken이 반환되는 것을 확인할 수 있다.

## @WithUserDetails

간단한 정보만 필요로 하는 테스트는 위에서 소개한 @WithMockUser를 활용할 수 있으나, 대부분 UserDetails를 직접 구현하여 인증 정보를 관리하고 있을 것이다.

특히 테스트할 메소드가 Authentication의 principal을 직접 사용한다면 @WithMockUser는 잘못 동작할 가능성이 높다.

따라서 Custom으로 만든 UserDetailsService를 통해 자신이 구현한 방식으로 인증 정보를 가지고 와야 할 필요성이 존재한다.

UserDetails를 구현한 CustomUser가 있고 다음과 같은 메소드를 테스트한다고 가정하자. CustomUser의 printName은 간단히 자신의 username을 System.out.println로 출력하는 메소드라고 생각하자.

```java
@PreAuthorize("isAuthenticated()")
public void print() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    CustomUser principal = (CustomUser)authentication.getPrincipal();
    principal.printName();
}
```

위의 메소드를 테스트하기 위해서는 CustomUser를 Authentication의 principal로 설정해야 한다. 하지만 @WithMockUser로는 설정이 불가능하기에 직접 구현한 UserDetailsService를 통해 찾은 CustomUser를 principal로 설정해야 한다.

```java
@Service
public class TestUserDetailsService implements UserDetailsService {
    ...

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        ...
        return new CustomUser("name", "password", "ADMIN");
    }
}
```

```java
@Test
@WithUserDetails("name")
void test3() {
    demoService.print();
}
```

@WithUserDetails는 등록된 Bean 중 UserDetailsService 찾아 미리 어노테이션에서 설정한 username으로 사용자를 찾는다.

value을 통해 테스트에 필요한 사용자 이름을 지정할 수 있고, userDetailsServiceBeanName을 통해 직접 사용할 Bean을 지정할 수 있다. 다만 이 Bean은 UserDetailsService를 구현한 Bean이어야 한다.

## @WithSecurityContext

위에서 소개한 방법으로 인증 정보를 테스트에서 활용할 수 있었지만, 실제 UserDetailsService에 등록된 사용자만 사용할 수 있다는 단점이 존재한다.

따라서 직접 SecurityContext에 테스트에서 활용할 인증 정보를 넣어줄 때 사용할 어노테이션 또한 필요하다. @WithSecurityContext를 통해 직접 어노테이션을 생성해서 인증 정보를 주입해보자.

### @WithSecurityContext 활용하여 사용자 어노테이션 만들기

```java
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithMockCustomUserSecurityContextFactory.class)
public @interface WithMockCustomUser {
    String first() default "first";

    String second() default "second";
}
```

어노테이션을 활용하여 테스트 시 우리가 원하는 인증 정보를 주입하기 위해 @WithMockCustomUser 어노테이션을 만들었다. value를 활용해 우리가 인증 정보를 주입할 때 원하는 정보를 어노테이션을 통해 설정할 수 있도록 하였다.

@WithSecurityContext 어노테이션을 메타 어노테이션을 선언하여 테스트에서 SecurityContext를 설정할 수 있도록 하였으며, factory 속성에서는 WithSecurityContextFactory 구현 클래스인 WithMockCustomUserSecurityContextFactory를 지정하였다.

이제 실제로 SecurityContext를 설정할 factory 클래스에 대해 살펴보자.

### WithSecurityContextFactory 구성하기

```java
public class WithMockCustomUserSecurityContextFactory implements WithSecurityContextFactory<WithMockCustomUser> {
    @Override
    public SecurityContext createSecurityContext(WithMockCustomUser customUser) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();

        CustomUser principal = new CustomUser(customUser.first(), customUser.second(), "ADMIN");
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, principal.getPassword(), principal.getAuthorities());
        context.setAuthentication(auth);
        return context;
    }
}
```

Factory는 WithSecurityContextFactory interface를 구현해 만들어지며, Generic에 이전에 만든 WithMockCustomUser 어노테이션 클래스를 입력해 사용자가 미리 설정한 value를 사용할 수 있다.

SecurityContext는 기존에 설정한 것과 같이 context에 authentication을 만들어 set한 다음, context를 반환하면 된다. 이 Factory 클래스는 Spring Bean을 주입받을 수 있으며, 기타 Spring 어노테이션 또한 사용할 수 있다. 

위와 같이 구현이 완료되었으면 다른 어노테이션처럼 테스트할 메소드에 Custom 어노테이션을 달기만 하면 된다.

```java
@Test
@WithCustomUser(first = "myName", second = "myPassword")
void test3() {
    demoService.print();
    ...
}
```

@WithMockUser, @WithUserDetails, @WithAnonymousUser 모두 @WithSecurityContext를 활용한 어노테이션들이며 미리 구현된 factory를 통해 SecurityContext에 인증 정보를 넣을 수 있었다.

```java
final class WithMockUserSecurityContextFactory implements WithSecurityContextFactory<WithMockUser> {
	public SecurityContext createSecurityContext(WithMockUser withUser) {
		...
		List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
		for (String authority : withUser.authorities()) {
			grantedAuthorities.add(new SimpleGrantedAuthority(authority));
		}

		if (grantedAuthorities.isEmpty()) {
			for (String role : withUser.roles()) {
				...
				grantedAuthorities.add(new SimpleGrantedAuthority("ROLE_" + role));
			}
		} ...

		User principal = new User(username, withUser.password(), true, true, true, true,
				grantedAuthorities);
		Authentication authentication = new UsernamePasswordAuthenticationToken(
				principal, principal.getPassword(), principal.getAuthorities());
		SecurityContext context = SecurityContextHolder.createEmptyContext();
		context.setAuthentication(authentication);
		return context;
	}
}
```

위 코드는 @WithMockUser가 사용하는 WithMockUserSecurityContextFactory의 코드이다.
@WithMockUser는 Spring Security에서 미리 구현된 User 객체를 통해 Authentication의 principal 정보를 주입했으며, 이 때문에 사용자가 구현한 객체를 활용할 수 없었던 것이다. 

## 메타 어노테이션 활용하기

위에서 어노테이션을 활용해 간단히 인증 정보를 주입할 수 있었지만, 어노테이션 value가 중복되어 사용성이 다소 떨어지는 문제가 발생할 수 있다. 이럴 경우 간단히 메타 어노테이션을 활용하여 추가적인 입력을 줄일 수 있다.

```java
@Retention(RetentionPolicy.RUNTIME)
@WithMockUser(roles = "ADMIN")
public @interface WithMockAdmin {
}
```

## Spring MVC Test시 어노테이션 활용하기

위에서 살펴본 방식은 Method 단위에서 Spring Security Test 관련 어노테이션을 활용하는 방식이었다.

만약 MockMvc를 통해서 웹 요청을 테스트할 때 위와 같은 어노테이션을 활용하고 싶다면, MockMvc에 다음과 같은 설정을 추가해야 한다.

또한 WebSecurityConfigurerAdapter를 상속받아 Spring Security 설정을 구현했다면 Test시 설정에 필요한 Bean들이 모두 등록되었는지도 주의해서 확인해야 한다.

```java
@BeforEach
public void setup() {
    mockMvc = MockMvcBuilders
            .webAppContextSetup(context)
            **.apply(springSecurity())**
            .build();
}
```

> SecurityMockMvcConfigurers.springSecurity() : Spring Security를 Spring MVC 테스트와 통합할 때 필요한 모든 초기 세팅을 수행한다.


Spring Security 관련 테스트 시, 인증 정보를 간단히 어노테이션을 활용해 주입하는 방법에 대해 살펴보았다. 상황에 맞는 적절한 어노테이션을 활용한다면, 보다 편리하게 테스트를 수행할 수 있다는 점을 알게 되었다.

다만 어노테이션이 어떻게 동작하는지 알지 못한다면 잘못된 어노테이션 활용으로 테스트 시 오류가 발생할 수 있다는 점을 말하면서 글을 마치고자 한다.

### 참고
https://docs.spring.io/spring-security/site/docs/current/reference/html5/#test

https://godekdls.github.io/Spring%20Security/testing/#192-spring-mvc-test-integration