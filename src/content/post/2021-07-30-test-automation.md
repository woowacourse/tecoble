---
layout: post
title: 프론트엔드 테스트 자동화 해보기.
author: [3기_파노]
tags: ['lxc']
date: "2021-08-13T12:00:00.000Z"
draft: false
image: ../teaser/frontend-test-automation.png
---


## 우테코는 프로젝트 중

 여름이 막바지에 접어드는 요즘, 우아한테크코스에서는 크루들이 모여 진행하는 프로젝트 기간인 레벨3도 끝나가고 있습니다. 코스는 프로젝트만 하라고 마냥 내버려두는게 아니라 일정기간마다 프로젝트에 적용해야 되는 과제를 내줍니다.  성능 측정을 통해 성능 개선하기, 배포 자동화하기, 사용성 테스트 진행하기 등등.

 그 중에서 프론트엔드 개발환경에서 테스트를 자동화해보라는 과제가 나왔습니다.

>  ...예?

이전에 접해보지 않은 생소한 과제에 잠시 당황 했었는데요. 테스트러너를 동작시킬 때 --watch 옵션을 주라는 건지.. 팀원과 잠시 고민에 빠졌습니다.  곧 이런 테스트 러너를 직접 동작시키지 않고, 프로그래밍을 진행하면서 자연스럽게 테스트가 동작하도록 환경을 구성하라는 뜻으로 이해하게 됐습니다.

## 테스트 자동화 방법

![image](https://user-images.githubusercontent.com/44419181/129481126-6a61326f-5e5d-4e8d-8021-07b0ba08a1fb.png)

Git을 활용해 진행하는 프로그래밍 루틴에 테스트를 녹이는 방법은 어디에서 진행하든 가능했습니다. 코드작성 -> 프로그램 배포 과정 중 테스트가 어디에 위치하든 간에 테스트가 실패한다면, 다음 단계로 나아가지 못하게 하는 것이 키포인트였습니다.

프로젝트에서는 이미 적용 중인 테스트 자동화 방법이 있었습니다.

### 1. Netlify: Deploy Preview

![image](https://user-images.githubusercontent.com/44419181/129477970-72ac1437-3e99-4e0e-9917-d3ead07d50c0.png)

프로젝트를 정식으로 배포하기 전, 빠른 테스트를 위해서 netlify를 이용해 간이로 배포를 진행했습니다.  netlify에서는 netlify site를  Github Repository와 연결하면 강력한 기능을 제공합니다. 레포지토리의 웹어플리케이션에 대한 CI/CD를 클릭 몇 번만에 셋업해주는데요. 감시하고 있는 브랜치에 커밋이 올라오면 새롭게 netlify가 배포를 하게 됩니다. 이와 관련해서 Deploy Preview라는 기능도 제공하는데, repository에 PR이 등록되면 해당 PR에 대해 네틀리파이 자체적으로 배포 + 테스트를 진행합니다.

![image](https://user-images.githubusercontent.com/44419181/129478241-f572fb42-f64a-412b-a4a2-cff710008c87.png)

배포가 성공적으로 끝나면, netilfy github app이 PR의 코멘트에 위와 같은 메세지를 남기게 되고,  Browse the preview란의 url을 클릭하면 pr코드를 실제 배포된 환경에서 테스트해볼 수 있습니다.



![image](https://user-images.githubusercontent.com/44419181/129478325-28828199-eb26-4951-8501-54f0e093cde3.png)

배포가 실패하면 위 메세지가 등장하고, PR을 merge할 때 경고문이 뜨게 됩니다.

위 기능은 프로젝트 초기 빠르게 기능을 구현하는 단계에 많은 도움이 되었습니다. 새로 추가되는 기능이 오류가 나는 코드인지 별도의 테스트코드를 작성하지 않고도, 별도로 CI/CD 파이프라인을 구축하지 않고도 netlify가 알아서 모두 해결해준 것이죠.

하지만 netlify는 서비스 로직이 어떻게 동작해야 하는지는 알지 못했기에, 팀에서 작성한 테스트코드를 자동화 해야했습니다.



### 2. husky

![image](https://user-images.githubusercontent.com/44419181/129478578-ee0df4a2-1af5-446b-8796-cdddc490f80e.png)

첫 번째로 적용한 방법은 [husky](https://typicode.github.io/husky/#/)입니다. husky는 git commit hook을 이용해서 commit이 실행될 때마다 테스트, 코드 린팅, 커밋메시지 린팅 등을 실행시켜줍니다.

husky를 이용해서 로컬에서 commit이 일어날 때마다 테스트가 동작해 테스트가 성공하는 경우에만 commit이 이뤄지도록 세팅했습니다.

사용법은 정말 간단합니다.  아래와 같습니다.

```sh
npx husky-init && yarn  # husky 설치
npx husky add .husky/pre-commit "yarn test" # husky add <file> [cmd] 입니다. file에는 git hook이름이 따라옵니다. [cmd]에는 실행할 쉘 커맨드를 입력합니다.
```

husky로 이용할 수 있는 hook은 다양합니다. [git 공식문서](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks) 링크를 남겨놓았으니 필요한 훅을 이용해보세요.

저희는 git hook 중 push hook을 이용할 수도 있지만, 피드백은 빠르면 빠를수록 좋다는 판단으로 테스트 진행단위를 commit으로 잡았습니다.



### 3. 배포시에는 어떻게 할까?

이제 commit 단위에서 테스트자동화를 이뤘지만, 고민이 하나 남았습니다. Github Actions로 CI/CD파이프라인을 구축해놓은 상황에서 workflow가 실행 중일때 테스트를 해서 바로 배포할 앱이 무결한지 체크해야하는 상황이었습니다. 사실 이 경우는 생각보다 간단하게 해결할 수 있습니다. 파이프라인 상에서 테스트를 실행 시켜주면 되기 때문입니다. 테스트가 실패하게 된다면 프로그램 종료코드가 에러번호를 담고 종료될 것이므로 job은 실패합니다. 사실 위에서 소개한 방법들이 이 방법으로 테스트가 실패했을 때 커밋을 실패시키고, preview 배포도 중단시킨 것입니다. 프로세스 종료코드가 에러번호를 담을 수만 있다면 workflow yaml파일이든, dockerfile이든, 빌드 npm script이든 어디든 가능합니다.

팀은 빌드 npm script에 테스트를 우선 수행하기로 했습니다.

```sh
    "build": "jest src && webpack --mode=production --node-env=production",
```

`&&`연산자를 통해 `jest src`명령어를 먼저 실행시킵니다. `&&`연산자는 먼저 실행된 명령어가 오류코드를 담고 종료되면 이후 명령어를 실행시키지 않음으로 테스트가 실패한다면 빌드를 진행시키지 않을 수 있습니다.

빌드 npm script자체가 테스트를 하도록 수정하게 되면, 이 빌드 npm script는 workflow yaml파일이든 dockerfile에서든 빌드가 필요한 모든 곳에서 실행될 명령어이기에 테스트를 강제할 수 있다는 것입니다.

### 4.  github action PR 테스트

github action은 [github의 이벤트를 활용할 수 있습니다](https://docs.github.com/en/actions/reference/events-that-trigger-workflows). 그 말인즉슨, 처음에 소개해드렸던 netlify deploy-preview처럼 PR상에서 테스트를 진행할 수 있다는 것입니다.  마켓에 올라와있는 [액션](https://github.com/marketplace/actions/github-action-tester)을 이용해서 예제를 만들어보겠습니다.



```yaml
name: workflow-example

on: pull_request # on에 pull_request를 적으면 jobs에 기재된 명령어들이 PR이 올라올 때마다 실행됩니다.

jobs:
  test:
    name: Run tests
    runs-on: ubuntu-latest
    steps:
     - name: checkout PR			# 1.해당 PR에 checkout합니다
       uses: actions/checkout@master
	-  name: yarn install 		    # 2. 패키지를 설치합니다.
	   run: yarn
	- name: Test				   # 3. 테스트러너를 실행하고, 테스트가 실패/성공에 따라 해당 PR에 코멘트를 남깁니다.
      uses: skx/github-action-tester@master
      with:
        script: yarn test
```



깃헙에서 스크립트 액션을 제공해주기 때문에, 기존의 액션을 이용하지 않고 직접 액션을 작성할 수도 있습니다.



## 자동화를 마치고 나서

테스트를 자동화하게 되니 로컬에서 구현한 기능들을 보다 안전하게 기존 코드와 통합할 수 있게 되었습니다. 물론 우리는 코드를 실행시켜서 직접 테스트 해야하고 주의를 계속 기울여야 합니다. UI와 관련된 에러가 발생할 수 있는 변수가 다분한 프론트엔드 영역에서는  더욱 그렇습니다. 자동화는 깜빡하고 넘어갈 수 있는 부분을 대신 한 번 체크해준 것일뿐입니다.  당연한 말이지만 테스트코드를 더욱 열심히 짜야 효과가 있는 작업입니다. 우리 모두 테스트를 작성하고, 테스트가 주는 혜택을 누려봅시다.
