---
layout: post  
title: 'OAuth 개념 및 동작 방식 이해하기'
author: [3기_케빈]
tags: ['oauth']
date: "2021-07-10T12:00:00.000Z"
draft: false
image: ../teaser/oauth.jpeg
---

## 1. OAuth란?

![image](https://user-images.githubusercontent.com/56240505/125554097-e3b5f9ff-0cda-4328-a673-03b817166aa2.png)

웹 서핑을 하다 보면 Google과 Facebook 및 Twitter 등의 외부 소셜 계정을 기반으로 간편히 회원가입 및 로그인할 수 있는 웹 어플리케이션을 쉽게 찾아볼 수 있습니다. 클릭 한 번으로 간편하게 로그인할 수 있을 뿐만 아니라, 연동되는 외부 웹 어플리케이션에서 Facebook 및 Twitter 등이 제공하는 기능을 간편하게 사용할 수 있다는 장점이 있습니다. 예를 들어, 외부 웹 어플리케이션에 Google로 로그인하면 API를 통해 연동된 계정의 Google Calendar 정보를 가져와 사용자에게 보여줄 수 있습니다.

이 때 사용되는 프로토콜이 OAuth입니다. OAuth에 대한 정의는 다음과 같습니다.

> OAuth는 인터넷 사용자들이 비밀번호를 제공하지 않고 다른 웹사이트 상의 자신들의 정보에 대해 웹사이트나 애플리케이션의 접근 권한을 부여할 수 있는 공통적인 수단으로서 사용되는, 접근 위임을 위한 개방형 표준이다. (위키백과)

위 사진을 예시로 들어보겠습니다. 외부 어플리케이션(원티드)은 사용자 인증을 위해 Facebook과 Apple 및 Google의 등의 사용자 인증 방식을 사용합니다. 이 때, OAuth를 바탕으로 제 3자 서비스(원티드)는 외부 서비스(Facebook, Apple, Google)의 특정 자원을 접근 및 사용할 수 있는 권한을 인가받게 됩니다.

<br>

## 2. OAuth 참여자

OAuth 동작에 관여하는 참여자는 크게 세 가지로 구분할 수 있습니다.

* Resource Server : Client가 제어하고자 하는 자원을 보유하고 있는 서버입니다.
  * Facebook, Google, Twitter 등이 이에 속합니다.
* Resource Owner : 자원의 소유자입니다.
  * Client가 제공하는 서비스를 통해 로그인하는 실제 유저가 이에 속합니다.
* Client : Resoure Server에 접속해서 정보를 가져오고자 하는 클라이언트(웹 어플리케이션)입니다.

<br>

## 3. OAuth Flow

간단한 웹 어플리케이션 제작을 통해 OAuth의 동작 프로세스를 이해해봅시다. Github 계정을 바탕으로 웹 어플리케이션에서 로그인하고, Github에서 제공하는 여러 API 기능을 외부 웹 어플리케이션에서 사용해보겠습니다.

### 3.1. Client 등록

Client(웹 어플리케이션)가 Resource Server를 이용하기 위해서는 자신의 서비스를 등록함으로써 사전 승인을 받아야 합니다. [Github Developer Settings](https://github.com/settings/developers)에서 Github에 웹 어플리케이션을 등록합니다.

![image](https://user-images.githubusercontent.com/56240505/125647361-74fbafb3-ced0-4be0-b79a-0b362cf0aeda.png)
![image](https://user-images.githubusercontent.com/56240505/125647525-70ca3fcd-55ab-4f81-acb5-c04b071c8d1f.png)

등록 절차를 통해 세 가지 정보를 부여받습니다.

1. **Client ID** : 클라이언트 웹 어플리케이션을 구별할 수 있는 식별자이며, 노출이 무방합니다.
2. **Client Secret** : Client ID에 대한 비밀키로서, 절대 노출해서는 안 됩니다.
3. **Authorized redirect URL** : Authorization Code를 전달받을 리다이렉트 주소입니다.

Google 등 외부 서비스를 통해 인증을 마치면 클라이언트를 명시된 주소로 리다이렉트 시키는데, 이 때 Query String으로 특별한 Code가 함께 전달됩니다. 클라이언트는 해당 Code와 Client ID 및 Client Secret을 Resource Server에 보내, Resource Server의 자원을 사용할 수 있는 Access Token을 발급 받습니다. 등록되지 않은 리다이렉트 URL을 사용하는 경우, Resource Server가 인증을 거부합니다.

### 3.2. Resource Owner의 승인

[Github Docs](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow)에서는 Github 소셜 로그인을 하기 위해 다음과 같은 주소로 GET 요청과 필요한 파라미터들을 보내도록 명시합니다.

```
GET https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}?scope={scope}
```

* scope는 Client가 Resource Server로부터 인가받을 권한의 범위입니다.
* 파라미터의 세부 옵션에 대한 내용은 문서를 참고하시길 바랍니다.

Resource Owner는 Client의 웹 어플리케이션을 이용하다가, 해당 주소로 연결되는 소셜 로그인 버튼을 클릭합니다.

<img width="519" alt="스크린샷 2021-07-15 오전 12 29 44" src="https://user-images.githubusercontent.com/56240505/125652924-996597a9-10df-498b-a985-535b7e853bff.png">

Resource Owner는 Resource Server에 접속하여 로그인을 수행합니다. 로그인이 완료되면 Resource Server는 Query String으로 넘어온 파라미터들을 통해 Client를 검사합니다.

* 파라미터로 전달된 Client ID와 동일한 ID 값이 존재하는지 확인합니다.
* 해당 Client ID에 해당하는 Redirect URL이 파라미터로 전달된 Redirect URL과 같은지 확인합니다.

<img width="601" alt="스크린샷 2021-07-15 오전 12 31 48" src="https://user-images.githubusercontent.com/56240505/125652996-386acd70-938e-448b-8bb0-cb07c3079662.png">

검증이 마무리 되면 Resource Server는 Resource Owner에게 다음과 같은 질의를 보냅니다.

* 명시한 scope에 해당하는 권한을 Client에게 정말로 부여할 것인가?

허용한다면 최종적으로 Resource Owner가 Resource Server에게 Client의 접근을 승인하게 됩니다.

### 3.3. Resource Server의 승인

Resource Owner의 승인이 마무리 되면 명시된 Redirect URL로 클라이언트를 리다이렉트 시킵니다. 이 때 Resource Server는 Client가 자신의 자원을 사용할 수 있는 Access Token을 발급하기 전에, 임시 암호인 Authorization Code를 함께 발급합니다.

![image](https://user-images.githubusercontent.com/56240505/125654215-c8d9162e-0603-4395-906b-c802f6752e92.png)

* Query String으로 들어온 code가 바로 Authorization Code입니다.

> OAuthController.java

```java
@GetMapping("/afterlogin")
public ResponseEntity<String> afterlogin(@RequestParam String code) {
    if (Objects.isNull(code)) {
        throw new IllegalStateException("Github 로그인이 실패했습니다.");
    }
    RestTemplate restTemplate = new RestTemplate();
    OauthDto oauthDto = new OauthDto();
    oauthDto.setCode(code);
    oauthDto.setClient_ID("7e930566ecaa306c71b5");
    oauthDto.setClient_secret("client secret 입력");
    String accessToken = restTemplate.postForObject("https://github.com/login/oauth/access_token", oauthDto, String.class);
    return ResponseEntity.ok(accessToken);
}
```

Client는 ID와 비밀키 및 code를 Resource Owner를 거치지 않고 Resource Server에 직접 전달합니다. Resource Server는 정보를 검사한 다음, 유효한 요청이라면 Access Token을 발급하게 됩니다.

![image](https://user-images.githubusercontent.com/56240505/125655418-feead64e-79d8-4421-97ed-ef8b8e3ca288.png)

Client는 해당 토큰을 서버에 저장해두고, Resource Server의 자원을 사용하기 위한 API 호출시 해당 토큰을 헤더에 담아 보냅니다.

### 3.4. API 호출

![image](https://user-images.githubusercontent.com/56240505/125656088-596908d9-03cc-4d45-b40b-8ffe3529ddef.png)

이후 Access Token을 헤더에 담아 Github API를 호출하면, 해당 계정과 연동된 Resource Server의 풍부한 자원 및 기능들을 내가 만든 웹 어플리케이션에서 사용할 수 있습니다.

### 3.5. Refresh Token

> Refresh Token의 발급 여부와 방법 및 갱신 주기 등은 OAuth를 제공하는 Resource Server마다 상이합니다.

Access Token은 만료 기간이 있으며, 만료된 Access Token으로 API를 요청하면 401 에러가 발생합니다. Access Token이 만료되어 재발급받을 때마다 서비스 이용자가 재 로그인하는 것은 다소 번거롭습니다.

보통 Resource Server는 Access Token을 발급할 때 Refresh Token을 함께 발급합니다. Client는 두 Token을 모두 저장해두고, Resource Server의 API를 호출할 때는 Access Token을 사용합니다. Access Token이 만료되어 401 에러가 발생하면, Client는 보관 중이던 Refresh Token을 보내 새로운 Access Token을 발급받게 됩니다.

<br>

---

## Reference

* [Github Docs](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow)
* [생활코딩](https://opentutorials.org/course/3405)
* [Curity](https://curity.io/resources/oauth/)
* [[OAuth 2.0] OAuth란?](https://velog.io/@undefcat/OAuth-2.0-%EA%B0%84%EB%8B%A8%EC%A0%95%EB%A6%AC)
* [위키백과](https://ko.wikipedia.org/wiki/OAuth)
