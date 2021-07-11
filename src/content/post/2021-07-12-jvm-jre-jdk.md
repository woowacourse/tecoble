---
layout: post  
title: JVM에 관하여 - Part 1, JVM, JRE, JDK
author: [3기_와이비]
tags: ['jvm']
date: "2021-07-12T12:00:00.000Z"
draft: false
image: ../teaser/jvm-jre-jdk.png
---

자바로 작성된 코드는 어떻게 돌아가는걸까?
해당 물음에 답을 찾기 위한 JVM 시리즈 1편, JVM, JRE, JDK에 관한 글입니다.
이번 글에서는 배포 환경 혹은 개발 환경을 세팅하면서 설치를 하였던 JRE와 JDK가 무엇인지에 대해서 다루게 되었습니다.

<br/>

## _Java_ 프로그램 배포 및 개발 환경 세팅
우아한 테크코스 Level3부터는 서비스를 직접 만들고, 이를 배포하게 됩니다.
이전까지 미션처럼 주어진 환경에서 진행하는 것이 아닌 스스로 개발, 배포 그리고 운영 환경을 구축합니다.
저희 팀도 AWS의 EC2를 사용하여 _Linux_ 중 _Ubuntu_ 배포판 위에서 _Java_ 프로그램의 개발 및 배포 환경을 설정하였습니다.
이 때 습관처럼 다음과 같은 명령어를 입력하게 되었습니다.

``` bash
sudo apt -y install default-jre default-jdk
```
<br/>

항상 잘 사용하던 명령이지만 다른 프로그래밍 언어인 _Python_ 이나 _Run Time_ 환경인 _Nodejs_ 와 비교했을 때 낯섬이 느껴졌습니다.
난 _Java_ 를 직접적으로 설치하지 않고, _default jdk_ 와 _default jre_ 라는 관계없는 것을 설치하는걸까?
이번 포스팅에서는 위의 질문에 대한 답을 찾아가보겠습니다.

## JVM이란
설치한 수수께끼의 두 프로그램을 알기 위해서는 이번 시리즈의 주인공인 _JVM_ 에 대해서 이해를 해야합니다.
_JVM_ 은 _Java Virtual Machine_ 의 약자로 _Java_ 로 작성된 프로그램이 돌아가도록 만들어주는 프로그램입니다.
_JVM_ 의 구성 요소 및 작동 방식은 다음 포스팅에서 다루도록 하겠습니다.
_Java_ 로 작성된 프로그램은 운영체제에 맞는 실행 파일로 컴파일 되는 것이 아닌 _.class_ 라는 확장자를 가진 파일로 변환이 됩니다.
변환된 _.class_ 파일은 _JVM_ 위에서 작동이 됩니다.
이 때, 미리 설치된 _JVM_ 은 운영체제 별로 동일하게 작동하도록 _.class_ 파일에게 환경을 제공합니다.

![images](../images/2021-07-12-jvm.png)

이 프로그램을 사용함으로서 _Java_ 는 높은 이식성이라는 장점을 얻을 수가 있었습니다.
다음은 _Java_ 의 소유권을 가진 _Oracle_ 사의 홍보 캐치프레이즈입니다.

![images](../images/2021-07-12-jvm.png)

## JRE이란


## JDK이란



## 마무리

지금까지 DispatcherServlet의 정의, 설정 방법, 동작 흐름을 간단하게 짚어봤다. 이어지는 2편에서는 DispatcherServlet의 동작 원리를 코드와 함께 이해해보자.<br/>

<br/>

## References
