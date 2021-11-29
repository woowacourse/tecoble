---
layout: post  
title: Ubuntu PPA 저장소 관리
author: [3기_와이비]
tags: ['linux']
date: "2021-11-01T12:00:00.000Z"  
draft: false
image: ../teaser/ubuntu-ppa.png
---

서버를 구성할 때, 필요한 프로그램들을 공식 저장소를 통하여 보통 설치하게 됩니다.
하지만 저장소에 모든 프로그램 설치 데이터가 존재하진 않습니다.
다른 버전을 설치해야 할 때도 있을 것이고, 아예 등록되어 있지 않은 프로그램을 설치해야 할 때도 있습니다.
이번 주제는 서버용 배포판으로 많이 사용되는 우분투에서 어떻게 저장소들을 관리할 수 있는지에 대한 글입니다.
<!-- end -->

## 공식 저장소는 만능이 아니다.
Java, Nginx, redis는 일반적으로 WAS를 구성할 때 많이 사용하는 프로그램입니다.
동시에 우분투 기본 저장소를 통하여 설치를 할 수 있는 공통점이 있습니다.
[지난번 글](https://tecoble.techcourse.co.kr/post/2021-09-13-linux-distribution/)에서는 공식 저장소를 통하여 Java를 설치하는 방법에 대해서 간단하게 정리했습니다.
서버를 운영하기 위해서는 Java 뿐만이 아니라 다양한 프로그램들이 필요합니다.
그렇기 때문에 의문이 드는 점이 있습니다. <br><br>
먼저 공식 저장소에는 모든 프로그램이 등록되어있지 않다는 점입니다.
기능을 확인하고 안정성을 검증하는 과정을 모든 프로그램에 적용할 수가 없습니다.
우분투, 정확히는 데비안의 공식 저장소에서는 일부 프로그램들만 등록하여 사용하고 있습니다.
그래서 비교적 소규모의 커뮤니티나 개인이 개발한 프로그램들은 등록되어 있지 않습니다. <br><br>
두 번째로는 공식 저장소에 등록된 프로그램들이 항상 최신 버전을 지원할까? 에 대한 의문입니다.
공식 저장소에서는 안정성을 중요시하기 때문에 충분한 검증을 거치고 난 다음에서야 프로그램이 등록됩니다.
해당 배포판의 채널을 stable에서 도전적인 프로그램 버전을 제공하는 채널로 바꾸어서 필요한 프로그램들을 설치할 수 있겠으나 추천하지 않습니다.
만약 개발자가 조금 더 최신의 기술을 원한다면 공식 저장소에 있는 버전이 아닌 다른 곳을 통하여 최신 버전을 설치를 해야 합니다.
<br><br>
우분투의 기반이 되는 배포판인 데비안의 공식 저장소의 패키지는 [Debian package](https://www.debian.org/distrib/packages#search_packages)에서 확인할 수가 있습니다.
하지만 존재하지 않는 패키지나 stable 버전에서 지원하지 않는다면 위의 이유 때문에 공식 저장소를 통해서 설치하기가 매우 어려울 것입니다.
이와 같은 문제점을 해결하려면 필요한 프로그램들이 저장되어 있는 주소를 직접 등록하는 방법을 사용해야만 합니다.
각각의 커뮤니티나 개인이 운영하면서 최신 혹은 새로운 프로그램을 관리하는 저장소를 PPA(Personal Package Archive)라고 합니다.
MariaDB 라는 RDBMS를 통해 PPA 저장소를 등록하고 설치하는 예시를 함께 보면서 알아가보도록 하겠습니다.

## 예시 : 최신 버전 MariaDB를 설치하고 싶을 때
MariaDB는 널리 쓰이는 RDBMS 중 하나로써 이미 데비안 저장소에 등록되어 있습니다.
저장소에서는 현재 10.5를 기본적으로 제공하고 있습니다.
하지만 2021년 8월 6일에 새로운 버전인 10.6 버전이 출시되었고, 우리는 10.6 버전에서만 제공하는 새로운 기능이 필요하다고 가정을 해보겠습니다.
기존의 저장소에서 다운을 시도하게 된다면 10.5 버전이 계속 설치가 될 것입니다.
소스 코드 파일을 내려받아서 이를 빌드해서 사용하는 방법도 있지만, 해당 방법은 패치가 일어날 때에도 똑같이 소스 코드 파일을 다운받아서 이를 다시 빌드해야하는 과정을 거쳐야 할 것입니다.
우리는 패키지 관리자에게 10.6 버전을 가지고 있는 저장소를 등록하여 저장소를 사용하도록 하겠습니다.

## apt-key
MariaDB 재단에서 제공하는 문서는 해당 명령어를 입력을 하며 설치를 시작합니다. 

```bash
$ sudo apt-key adv --fetch-keys 'https://mariadb.org/mariadb_release_signing_key.asc'
```

```bash
//결과
>> Executing: /tmp/apt-key-gpghome.zHSJrMrTbv/gpg.1.sh --fetch-keys https://mariadb.org/mariadb_release_signing_key.asc
>> gpg: requesting key from 'https://mariadb.org/mariadb_release_signing_key.asc'
>> gpg: key <%GPG KEY VALUE%> : public key "MariaDB Signing Key <signing-key@mariadb.org>" imported
>> gpg: Total number processed: 1
>> gpg:           	imported: 1
```

저장소를 추가하기 전에 해당 명령어를 입력하게 됩니다.
apt-key는 apt가 해당 패키지를 인증할 때 사용하는 키를 관리하는 명령어입니다.
해당 명령어를 사용하게 된다면, MariaDB를 설치하기 위한 키가 추가가 되는 것입니다.
apt-key list 라는 명령어를 사용하면, 지금 우분투 혹은 데비안에서 사용되고 있는 key들을 모두 확인할 수가 있습니다.
여기서 GPG란 GNU Privacy Guard로 해당 키를 암호화해주는 프로그램입니다.

## add-apt-respository

저장소를 추가하기 위한 키도 추가했습니다.
그 다음에는 저장소를 추가해야할 차례입니다.
MariaDB 10.6를 관리하는 저장소를 추가하기 위해서는 다음과 같은 명령어를 입력해야합니다.

```bash
$ sudo add-apt-repository 'deb [arch=amd64,arm64,ppc64el] https://mirror.yongbok.net/mariadb/repo/10.6/ubuntu focal main'
```
```bash
// 추가된 출력
>> Get:2 https://mirror.yongbok.net/mariadb/repo/10.6/ubuntu focal InRelease [7758 B]
>> Get:4 https://mirror.yongbok.net/mariadb/repo/10.6/ubuntu focal/main arm64 Packages [16.6 kB]
```

명령어의 각각의 구성들을 살펴보도록 하겠습니다. <br>
먼저, 해당 파일은 deb라는 파일 형식으로 내려받겠다는 것을 알려줍니다.
각각의 리눅스 배포판들은 프로그램을 설치할 때, 패키지 관리자에게 호환되는 패키지가 존재합니다.
CentOS나 페도라 같은 레드헷 계열은 일반적으로 yum을 통해서 rpm이 설치가 되고, 저희가 사용하는 우분투 및 데비안 계열은 apt를 통해서 deb 형식의 패키지 파일을 읽어와 프로그램을 설치하게 됩니다. <br>
그다음에는 해당 패키지를 내려받을 수 있는 Mirror Server를 등록해야 합니다.
한국에서는 yongbok.net 이라는 서버에서 패키지를 제공하고 있습니다. <br>
마지막으로 focal main이라는 부분이 있습니다.
focal은 무엇일까요?
각각의 리눅스 배포판들도 버전이 존재합니다.
우분투에서는 2년마다 LTS(Long Term Support, 장기 지원 버전) 및 6개월마다 신 버전(상대적으로 실험적 요소들이 많음)을 내는데, 각각의 배포판 버전에 따라서도 조금씩 구성이 다를 것입니다.
버전마다 맞는 패키지를 등록하게 되는데, focal은 최근에 나온 LTS 버전인 20.04 버전의 이명입니다.
실제로 비교적 최신 버전인 21.04 버전을 조회하게 되면 다음과 같은 명령어로 다르게 입력을 하는 것을 권장하고 있습니다.
hirsute는 21.04 버전의 이명입니다.

```bash
$ sudo add-apt-repository 'deb [arch=amd64] https://mirror.yongbok.net/mariadb/repo/10.6/ubuntu hirsute main'
```

<br>
이렇게 사용할 PPA, 저장소를 등록하게 되면 해당 sudo apt -y update 시에 해당 저장소도 같이 업데이트 조회를 하는 것을 확인할 수가 있습니다.

```bash
$ sudo apt -y update
```
```bash
>> Hit:2 https://mirror.yongbok.net/mariadb/repo/10.6/ubuntu focal InRelease
```

## 저장소 수정 및 삭제하기
한 번 등록하면 계속 업데이트를 받아오면서 사용할 수 있지만, 간혹가다 오타 때문에 저장소가 잘못 등록될 수가 있습니다.
혹은 저장소에서 더 이상의 업데이트를 제공하지 않을 때도 있습니다.
이를 해결하기 위해서는 /etc/apt/sources.list에 vim으로 접근하여 수정 및 삭제를 할 수가 있습니다.
해당 경로의 의미는 [리눅스 파일시스템 경로 구조](https://tecoble.techcourse.co.kr/post/2021-10-18-linux-file-directory-system/)를 참조해주시길 바랍니다.

```bash
$ sudo vim /etc/apt/sources.list
```

```bash
# 해당 부분 삭제
>> deb [arch=amd64,ppc64el,arm64] https://mirror.yongbok.net/mariadb/repo/10.6/ubuntu focal main
# deb-src [arch=amd64,ppc64el,arm64] https://mirror.yongbok.net/mariadb/repo/10.6/ubuntu focal main
```

이렇게 추가해준 MariaDB 저장소를 삭제해주었습니다. 
이후에 sudo apt -y update를 실행하면, 제거된 저장소에 대해 더 이상 업데이트 조회를 하지 않습니다.
만약 PPA의 저장소명을 정확히 알고 있다면 해당 명령어를 통해서 삭제할 수가 있습니다.

```bash
$ sudo add-apt-repository --remove ppa:저장소명
```

## 마치며
우리는 오픈 소스 세계에서 빠른 기술 성장 속도를 경험하고 있습니다. 
또한, 리눅스 배포판들의 상당수도 오픈 소스로 운영되고 있습니다.
이 때문에 모든 오픈 소스의 변화들을 각각의 리눅스 배포판 저장소에서 검증하고 등록하기까지는 많은 시간이 필요합니다.
필요한 프로그램을 제공해주는 PPA를 직접 등록하고 관리하여 인스턴스에서 필요한 기능 및 성능을 구현하도록 합시다. 
 
## Reference
- [How To Add Apt Repository In Ubuntu](https://linuxize.com/post/how-to-add-apt-repository-in-ubuntu/)
- [MariaDB Foundation, Download MariaDB Server](https://mariadb.org/download/?tab=repo-config&distro=Mint+19&ver=10.2&r_mirror=yongbok)

