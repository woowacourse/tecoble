---
layout: post
title: "Spring Profile: yml 파일 하나로 프로퍼티 관리하기"
author: [4기_정]
image: 기깔 나는 썹네일 만들어주세요. 감사합니다.
(이하 생략)
---

서비스를 개발하다보면 하나의 서버 애플리케이션을 다양한 환경에서 실행할 일이 생깁니다. 그리고 H2 DB를 사용하는 테스트 환경과 MySQL DB를 사용하는 배포 환경에서 사용되는 환경변수 값이 서로 다른 것은 당연한 일이겠죠.

해당 글에서는 일반적인 스프링 부트 애플리케이션에서 하나의 `application.yml` 파일을 통해 각 **프로파일**별로 프로퍼티 설정들을 관리하고, 환경변수를 주입하는 몇 가지 방법에 대해 설명하고자 합니다.

인프라를 다뤄본 경험이 어느 정도 있다는 가정하에서 작성하였습니다.

## 프로퍼티와 JVM 시스템 파라미터

우선 스프링 애플리케이션이 실행되는 포트 번호를 수정하는 예시를 통해 프로퍼티를 설정하는 방법에 대해 가볍게 알아봅시다.

기본적으로 스프링 부트 애플리케이션을 실행하면 8080 포트에서 톰캣 서버가 디폴트로 실행됩니다.

이때 모종의 이유로 포트번호를 8080 대신 5000 포트로 수정하고 싶다면 `main/resources` 경로에 `application.yml` 파일(이하, `yml` 파일)을 생성하고 아래와 같이 포트 번호를 기재해주면 됩니다.

```yml
server.port: 5000
```

한편 이미 배포된 서버를 다른 포트 번호에서 실행되도록 수정해야 하는 경우도 존재합니다. 이 경우 `yml` 파일의 값을 수정하고 애플리케이션을 다시 빌드하여 재실행시키는 방법이 있겠죠. 그러나 **JVM 시스템 파라미터**를 활용하면 **이미 빌드된 애플리케이션에 특정 프로퍼티 값을 주입하여 실행**하는 것도 가능합니다.

이해를 위해 우선 스프링 부트 애플리케이션을 `jar` 파일로 빌드하고, 실행시키고, 종료시키는 명령어를 배워봅시다.

```shell
# gradle을 사용하여 애플리케이션 빌드
./gradlew build
# 빌드된 .jar 파일이 있는 장소로 이동
cd build/libs
# 빌드된 .jar 파일 실행
java -jar 애플리케이션-0.0.1-SNAPSHOT.jar &
# 특정 포트번호에서 실행되는 프로세스를 종료
kill $(lsof -t -i:포트번호)
```

위의 명령어를 실행한다면 **빌드될 때 포함된** `yml` 파일에 설정한 `server.port` 프로퍼티 값을 활용하게 됩니다. 저희의 경우 위에서 설정한 5000 포트가 그대로 활용되겠죠.

그런데 해당 `.jar` 파일을 실행시키는 명령어에 다음과 같이 `-Dserver.port=7000`라는 내용을 추가하면 어떻게 될까요?

```shell
# -Dkey=value 형식으로 JVM 시스템 파라미터 활용
java -Dserver.port=7000 -jar 애플리케이션-0.0.1-SNAPSHOT.jar &
```

이 경우 5000 포트에서 실행되던 애플리케이션이 7000 포트에서 실행됩니다. 이는 `yml` 파일에 포함된 `server.port` 프로퍼티 값이 `7000`이라는 값으로 **완전히 덮어써진 체 실행**되는 것을 의미합니다. `yml` 파일에 `server.port` 정보를 기재하지 않은 경우에도 JVM 시스템 파라미터를 통해 프로퍼티 값을 전달한다면 마찬가지로 7000 포트로 실행됩니다.

## 환경변수의 활용

이번에는 `yml` 파일의 프로퍼티 값을 전달받아 스프링 애플리케이션 내부에서 사용하는 경우를 다뤄보겠습니다.

다음과 같이 `security.jwt.token.secret-key`라는 환경변수를 주입받아 사용하는 스프링 빈을 하나 정의해봅시다. `security.jwt.token.secret-key`는 스프링에서 별도로 존재하는 프로퍼티가 아니라 **개발자가 임의로 만든 프로퍼티**입니다.

```java
@Component
public class ComponentWithSecretKey {

    private final String secretKey;

    public ComponentWithSecretKey(@Value("${security.jwt.token.secret-key}") String secretKey) {
        this.secretKey = secretKey;
    }
}
```

이 상태에서 별도의 작업 없이 즉시 애플리케이션을 실행하는 경우, 예외가 발생하며 서버는 즉시 종료합니다.

이때 `yml` 파일에 다음과 같이 환경변수 값을 추가하고 애플리케이션을 실행하게 되면 애플리케이션은 문제 없이 동작합니다.

```yml
security.jwt.token.secret-key: secret_value_that_is_really_long
```

그런데 개발 과정에서 환경변수를 다룰 때 저희는 다양한 문제 상황에 직면하게 됩니다. 동일한 환경변수에 **상황에 따라 다른 값이 주입되어야 하는 경우**도 존재할 수 있으며, 이러한 값들을 어떻게 **외부로 노출되지 않도록 관리할 것인가**에 대해서도 고민해야 합니다. 이러한 문제에 대한 다양한 해결방안 중 가장 관리 포인트를 최소화하는 방안은 스프링 프로파일을 활용하는 것이라고 생각합니다.

## 스프링 프로파일과 환경변수

이제부터 본격적으로 스프링 프로파일을 활용하여 하나의 `yml` 파일 내에 다양한 프로퍼티 값들을 관리하는 방법에 대해 알아보도록 하겠습니다.

설명을 위해 `yml`로부터 두 가지 환경변수를 주입받아 사용하는 스프링 빈을 만들어봅시다.

```java
@Component
public class ComponentWithSecretKey {

    private final String commonData;
    private final String secretKey;

    public ComponentWithSecretKey(@Value("${common.data}") String commonData,
                                  @Value("${security.jwt.token.secret-key}") String secretKey) {
        this.commonData = commonData;
        this.secretKey = secretKey;
    }
}
```

그리고 `yml` 파일에 다음과 같이 작성해봅시다.

```yml
# 디폴트로 사용하는 프로파일은 test
spring.profiles.active: test
common.data: "모든_프로파일들에서_공통으로_사용되는_데이터"

---
# 현재 프로파일이 prod인 경우, 해당 프로퍼티들을 사용
spring.config.activate.on-profile: prod
security.jwt.token.secret-key: "prod 프로파일일 때 사용되는 secret key"

---
# 현재 프로파일이 test인 경우, 해당 프로퍼티들을 사용
spring.config.activate.on-profile: test
security.jwt.token.secret-key: "test_프로파일일_때_사용되는_secret_key"
```

설명하자면 `---`는 `yml` 파일 내에서 **프로파일 영역별 경계를 설정**하는 기능입니다.

특정 영역에 `spring.config.activate.on-profile` 프로퍼티를 설정하는 경우, **해당 프로파일이 선택되었을 때만 해당 영역의 프로퍼티들이 사용**됩니다.

반대로 `spring.config.activate.on-profile` 프로퍼티가 없는 영역의 프로퍼티들은 **활성화된 프로파일과 무관하게 모든 프로파일들에서 공통적으로 사용**됩니다. 위의 경우 가독성을 위해 `yml` 파일의 최상단에 위치시켰으나, 아래쪽에 있어도 동일하게 동작합니다.

그리고 `spring.profiles.active`는 디폴트로 사용될 프로파일을 명시하는 기능입니다. 해당 값을 명시하지 않는 경우 `default` 프로파일이 사용되며, JVM 시스템 프로퍼티를 통해 덮어쓸 수 있습니다. 프로파일명으로는 주로 `dev`, `prod`, `test`, `local` 등이 사용되지만
예약어는 아니므로 아무 이름이나 자유롭게 사용하면 됩니다.

이론만이 아니라 실제로 실행했을 때의 동작방식을 생각해봅시다.

우선 위와 같이 설정한 프로젝트를 있는 그대로 실행하게 되면 최상단 영역의 설정에 따라 `common.data` 값은 `"모든_프로파일들에서_공통으로_사용되는_데이터"`가 그대로 주입되며, 자동으로 `test` 프로파일이 선택됩니다. 이에 따라 `security.jwt.token.secret-key` 프로퍼티에는 `test` 프로파일 섹션에 설정한 `"test_프로파일일_때_사용되는_secret_key"`라는 내용이 주입됩니다.

이 상태에서 사용될 프로파일을 수정하여 인텔리제이에서 실행하는 방법은 간단합니다. 우측 상단에서 `Edit Configurations`를 선택하고, `Active profiles`에 실행할 때 활성화시킬 프로파일을 기재하는 것입니다.

![인텔리제이 Edit config](https://user-images.githubusercontent.com/50986686/190946160-50e2aae8-d026-4f2e-a13e-0a0b15801763.png)

![인텔리제이 프로파일](https://user-images.githubusercontent.com/50986686/190946407-095cd9ae-e3dc-4bfb-8a45-67e0df160aa2.png)

이처럼 `prod` 프로파일을 활성화시킨 상태로 애플리케이션을 재실행하게 되면, 최상단 영역에 설정한 `common.data` 프로퍼티는 하드코딩한 값이 그대로 주입됩니다. 그러나 `spring.profiles.active` 프로퍼티의 값은 `test` 대신 **외부로부터 주입받은 `prod`로 덮어씌어져 실행**됩니다. 이에 따라 `security.jwt.token.secret-key` 프로퍼티에는 `prod` 프로파일 섹션에 설정한 `"prod 프로파일일 때 사용되는 secret key"`라는 내용이 주입됩니다.

### 환경변수 하드코딩의 문제점

그런데 문제는 DB 관련 정보(주소, 사용자명, 비밀번호)와 같이 외부로부터 숨겨야 하는 프로퍼티 값이 존재하는 경우입니다.

이러한 상황에서 `yml` 파일에 모든 비밀 정보를 직접적으로 하드코딩하고, `yml` 파일 자체를 `.gitignore`에 추가하여 **깃의 관리 대상에서 완전히 누락시키는 방안**을 생각해볼 수 있습니다. 그러나 해당 방법의 문제점은 개발 프로세스가 굉장히 번거로워진다는 점입니다. 예를 들어 개발자마다 로컬 머신에 자신만의 `yml` 파일을 관리하여 작업을 하고, Jenkins 등 빌드 작업이 수행되는 곳에 `yml` 파일을 만들어 올려놓는다면 **`yml` 파일의 내용이 수정될 때마다 수작업으로 모든 yml 파일들을 고쳐야 합니다.**

특히 `yml` 파일에서 **외부에 숨겨야 하는 비밀 정보는 극히 일부분에 불과**합니다. 외부에 노출되어도 상관 없는 기본적인 설정들이 조금 수정될 때마다 모든 컴퓨터에서 관리되는 `yml` 파일들을 전부 수정해야 한다면 이는 너무나도 큰 비용입니다.

바로 이러한 점 때문에 우리는 **깃헙에 `yml` 파일을 올려놓은 상태에서** 오직 숨겨야 하는 비밀정보들만을 **`yml` 파일 내에서 숨길 방법**이 필요합니다.

### yml 파일 내 환경변수 설정

이를 위해 저희는 `yml` 파일 내에서 **외부로부터 환경변수를 받도록 설정**하고 프로그램이 **실행될 때 적절한 값을 주입**해주는 방법을 생각해볼 수 있습니다.

설정하는 방법 자체는 간단합니다. 아래 예시와 같이 환경변수의 이름(`secret-key`)을 프로퍼티의 '값'에 해당되는 부분에 `${환경변수}` 형식으로 추가하면 됩니다.

```yml{7}
spring.profiles.active: test
common.data: '모든_프로파일들에서_공통으로_사용되는_데이터'

---

spring.config.activate.on-profile: prod
security.jwt.token.secret-key: ${secret-key}

---

spring.config.activate.on-profile: test
security.jwt.token.secret-key: "test_프로파일일_때_사용되는_secret_key"
```

해당 프로젝트는 기본적으로 디폴트 프로파일인 `test`를 사용하므로 이전과 마찬가지로 별도의 작업 없이도 언제나 문제 없이 빌드 및 실행될 수 있습니다. 다만, `prod` 프로파일을 활성화시키는 경우 **외부로부터 `secret-key`에 해당되는 환경변수를 전달받아야만 실행**됩니다.

### 인텔리제이에서의 환경변수 설정(2021.3 버전 기준)

그러면 인텔리제이에서 환경변수를 주입하여 실행해보겠습니다. 우선 위에서와 마찬가지로 우측 상단의 `Edit Configurations`를 선택하면 `Active profiles` 칸에 활성화시킬 프로파일을 기재할 수 있습니다.

![인텔리제이 프로파일](https://user-images.githubusercontent.com/50986686/190946407-095cd9ae-e3dc-4bfb-8a45-67e0df160aa2.png)

다음으로 `Modify options`를 선택하면 아래와 같이 환경변수를 입력할 수 있는 칸이 추가됩니다. 이를 통해 다음과 같이 `secret-key` 환경변수의 값을 자유롭게 설정할 수 있습니다.

![인텔리제이 환경변수 설정](https://user-images.githubusercontent.com/50986686/190946508-52cdeeb2-3444-449c-a736-275fcc58b157.png)

![인텔리제이 환경변수 설정 입력](https://user-images.githubusercontent.com/50986686/190946573-f1155c9b-b1b6-4f2c-b09f-7e8c9b2fe6fb.png)

이처럼 인텔리제이에서 환경변수를 설정하는 방법은 **각 프로젝트에 한정된 시스템 환경변수를 설정**할 수 있다는 특징을 지녔습니다. 개발자의 로컬 컴퓨터에서 프로그램을 실행하며 개발하고 싶을 때 사용할 수 있는 최선의 방법입니다.

최신 버전에서는 Profile을 아래에서 서술할 Enviroment Variable의 설정 방식대로 수정할 수 있습니다

### JVM 시스템 파라미터를 통한 환경변수 설정



한편 개발한 애플리케이션의 빌드 결과물을 원격 서버에서 실행하기 위해서는 리눅스 환경에서 특정 프로파일을 활성화시키고 적절한 환경변수 값을 주입해줄 수 있어야 합니다.

우선 개인적으로 선호하는 JVM 시스템 파라미터를 통해 **실행 명령어 한 줄에 모든 환경변수를 전달**하는 방법을 다뤄보겠습니다.

아래와 같은 명령어를 통해 `prod` 프로파일을 활성화시키도록 주입하고, 환경변수 `secret-key`의 값을 주입할 수 있습니다. `secret-key`에 전달된 값은 그대로 `security.jwt.token.secret-key` 프로퍼티의 값으로 사용됩니다.

```bash
java -jar -Dspring.profiles.active=prod -Dsecret-key='prod_프로파일의_secret_key_값' 애플리케이션.jar &
```

물론 아래와 같이 환경변수 `secret-key`를 사용하지 않고 `security.jwt.token.secret-key` 프로퍼티 자체에 대해 값을 주입하는 것도 가능합니다. 그러나 아래에서 확인할 수 있듯 이러한 프로퍼티명은 일반적으로 굉장히 길기 때문에 가독성이 굉장히 낮아지며 휴먼 에러가 발생하기 쉬워집니다.

```bash
java -jar -Dspring.profiles.active=prod -Dsecurity.jwt.token.secret-key='prod_프로파일의_secret_key_값' 애플리케이션.jar &
```

해당 방법은 실행되는 명령어 자체에 모든 정보가 포함되기 때문에 **주입해야 하는 프로퍼티의 개수가 얼마되지 않을 때 굉장히 관리하기 편리합니다.**

### 운영체제 내 시스템 환경변수 설정

다음은 운영체제 자체에 **시스템 환경변수**를 설정하는 방법입니다. `yml` 파일의 `{환경변수}` 문법은 JVM 파라미터만이 아니라 시스템 환경변수 값을 전달받을 수 있습니다.

다만, 시스템 환경변수의 경우 기본적으로 `CONSTANT_CASE` 형식으로 작성해야 합니다. 현재 프로젝트의 경우 `secret-key` 대신 `SECRET_KEY`로 환경변수명을 수정해야 합니다.

```yml{4}
# 생략
---
spring.config.activate.on-profile: prod
security.jwt.token.secret-key: ${SECRET_KEY}
---
# 생략
```

운영체제의 시스템 환경변수를 설정하는 방법은 환경에 따라 조금씩 차이가 있습니다. 그래도 일반적으로 맥이나 리눅스 환경에서는 `.bash_profile` 파일을 수정하여 환경변수를 등록하면 됩니다. 환경변수마다 `export VARIABLE_NAME="value"` 형식으로 한줄씩 나열하여 복수의 환경변수를 설정할 수 있습니다.

```shell
export SECRET_KEY="secret_key_at_bash_profile"
```

해당 세션에서 `.bash_profile`이 즉시 적용되도록 아래 명령어를 실행해봅시다.

```shell
source .bash_profile
```

이 상태로 아래 명령어를 통해 `prod` 프로파일을 활성화시켜 애플리케이션을 실행시켜봅시다. `.bash_profile` 파일에 설정해놓은 시스템 환경변수 `SECRET_KEY`가 문제 없이 등록되었다면, 자동으로 **운영체제의 환경변수 값을 주입받아 사용**하게 됩니다.

```bash
java -Dspring.profiles.active=prod -jar 애플리케이션.jar &
```

만일 시스템 환경변수를 무시하고 다른 값을 주입하여 실행하고 싶은 경우, JVM 시스템 파라미터로 값을 넘기면 됩니다.

```bash
java -jar -Dspring.profiles.active=prod -Dsecurity.jwt.token.secret-key='시스템_환경변수와는_다른_값' 애플리케이션.jar &
```

또한 운영체제에 등록한 시스템 환경변수를 제거하고 싶은 경우, 우선 `.bash_profile` 파일에 추가했던 `export VARIABLE_NAME="value"` 부분을 제거해야 합니다. 이후 `unset VARIABLE_NAME` 명령어를 통해 특정한 이름의 환경변수를 제거할 수 있습니다. `SECRET_KEY`라는 이름의 환경변수를 제거하려는 경우, 아래와 같이 작성하면 됩니다.

```bash
unset SECRET_KEY
```

당연한 얘기지만 해당 방법은 **EC2 인스턴스와 같은 원격 서버에서 사용**해야 합니다.

개발자의 로컬 머신에서는 인텔리제이를 활용하여 개별 프로젝트에 대한 시스템 환경변수를 개별적으로 설정하는 것이 이상적입니다. 예를 들어 로컬에서 작업 중인 복수의 프로젝트에서 전부 `DB_URL`이라는 환경변수를 사용하는 경우를 생각해봅시다. 운영체제의 시스템 환경변수로 `DB_URL`이라는 값을 설정하는 경우, 다른 프로젝트를 실행할 때마다 매번 시스템 환경변수인 `DB_URL` 값을 수정해주는 등의 작업을 해야 할 것입니다.

## 맺으며

해당 글은 스프링 개발자라면 알아야 하는 환경변수에 관한 기본기를 제공하는 데 초점을 맞추었습니다. 다만, 이러한 기법들이 언제나 best practice가 아니라는 점에 유의해야 합니다. 예를 들어 복수의 서버를 운영하는 경우, 각 서버에서 사용될 환경변수를 실행 시점에 맞춤형으로 주입해주는 작업 자체가 번거로울 수 있습니다. 또한 협업하는 개발자들 사이에 환경변수 정보를 어떻게 공유하고 관리할 것인지에 대한 논의 또한 필요합니다.

이런 경우에는 `git submodule`을 활용해 비공개 저장소에 프로파일별로 하드코딩된 `yml` 파일들을 관리하고, 빌드 결과물 자체에 적절한 프로퍼티들이 포함되도록 하는 것이 더 적절할 수 있습니다. 그러나 빌드 결과물에 환경변수들을 저장하더라도 특정한 프로파일을 활성화시키거나, 다른 값으로 덮어쓰는 등의 작업을 위해서는 JVM 시스템 파라미터와 같은 기본적인 지식이 필요하다고 생각합니다.

## 참고문서

- [Baeldung: Spring Profiles](https://www.baeldung.com/spring-profiles)
