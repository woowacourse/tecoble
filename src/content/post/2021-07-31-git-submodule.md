---
layout: post  
title: git submodule로 중요한 정보 관리하기
author: [3기_다니]
tags: ['git', 'submodule']
date: "2021-07-31T12:00:00.000Z"
draft: false
image: ../teaser/git-submodule.png
---

레벨 3 팀 프로젝트를 진행하며 중요한 정보(e.g. secret key)를 외부에 노출되지 않게 관리할 일이 생겼다.
Jasypt으로 암호화하는 방법, submodule로 관리하는 방법 등 여러 방식을 두고 고민하게 됐다.

<!-- end -->

전자의 경우에는 프로덕션 코드에 암호화를 위한 코드를 추가해야 한다는 부담 때문에 제외했다. 대신에 git submodule을 사용하여 관리하기로 결정했다.
git submodule을 중요한 정보를 숨기기 위한 목적으로 활용한 건 처음이었다. 복습 겸 이번에 적용했던 과정을 한번 정리하려 한다.<br/>

<br/>

## git submodule?

git submodule은 메인 레포지토리에 하위 레포지토리를 두고 관리를 하기 위한 도구이다.
여기서 메인 레포지토리를 부모 레포지토리, 하위 레포지토리를 자식 레포지토리라고 부른다.<br/>

<br/>

## 적용 과정

우선 private 레포지토리를 하나 생성한다. 이 레포지토리를 submodule로 이용한다.
예를 들면, 필자는 팀 organization 내부에 private 레포지토리를 만들었다.<br/>

```
2021-pick-git
        ⌙ security
```

<br/>

해당 레포지토리에 외부로 노출되면 안되는 정보를 추가한다.
필자 팀의 경우엔 `application-prod.yml`, `application-secret.yml`에 중요한 정보가 들어있다. 따라서, 두 파일을 이 레포지토리에 넣어뒀다.<br/>

```
2021-pick-git
        ⌙ security
                ⌙ application-prod.yml
                ⌙ application-secret.yml
```

<br/>

이제 git 명령어로 메인 레포지토리에 하위 레포지토리를 추가한다.
이 명령어는 메인 레포지토리에서 작성해야 한다.<br/>

아래의 두 명령어는 어떤 차이가 있을까? 사실 `-b {branch_name}`을 제외하면 동일하다.
단지 `-b` 옵션을 주면 하위 레포지토리의 특정 브랜치를 기준으로 submodule을 추가한다.
해당 옵션이 없으면 default branch를 기준으로 submodule을 등록한다.<br/>

```
% git submodule add {submodule_repository_url}

또는

% git submodule add -b {branch_name} {submodule_repository_url}
```

<br/>

메인 레포지토리에 하위 레포지토리를 추가하면, 루트 경로에 `.gitmodules`란 이름의 숨김 파일이 생성된다.
이 파일의 내용을 확인하면 아래와 같다.<br/>

```
[submodule "backend/pick-git/security"]
path = backend/pick-git/security
url = https://github.com/2021-pick-git/security.git
```

<br/>

참고로, `.gitmodules` 파일에 브랜치 정보를 넣어두면 해당 브랜치를 기준으로 submodule을 업데이트한다.
아래와 같이 브랜치 정보를 작성해둘 수 있다.<br/>

```
[submodule "backend/pick-git/security"]
path = backend/pick-git/security
url = https://github.com/2021-pick-git/security.git
branch = main
```

<br/>

메인 레포지토리에 submodule을 추가하고 상태를 확인하면, 새로 커밋해야 할 파일이 나타난다.
이 파일을 add하고 commit해야 비로소 메인 레포지토리에 submodule이 반영된다.<br/>

```
% git status

pick-git/security (새 커밋)

% git add .
% git commit -m "{commit_message}"
```

<br/>

이어서 원격 레포지토리에도 push를 해야 프로젝트 형상관리에 문제가 없다.<br/>

```
% git push {remote_repository_url} {branch_name}
```

<br/>

여기까지 따라왔다면, 본인의 프로젝트에는 submodule이 잘 적용됐다.
만약 팀 프로젝트 중이면 팀원들의 프로젝트에도 submodule을 적용해야 어플리케이션 실행이 잘 될 것이다.<br/>

이번에는 팀원들의 프로젝트에 어떻게 submodule을 적용해야 하는지 알아보자.
아직 프로젝트를 clone하지 않은 상황이면, 먼저 프로젝트를 clone한다.<br/>

```
% git clone {project_url}
```

<br/>

다음으로 submodule을 초기화하고 업데이트한다. 이 부분은 가장 처음 딱 1번만 수행하면 된다.<br/>

```
// submodule 초기화
% git submodule init

// 메인 레포지토리가 기억하는 submodule의 특정 커밋 시점으로 업데이트
% git submodule update
```

<br/>

추가로, 메인 프로젝트 clone에서 하위 프로젝트 적용까지 하나의 명령어로 처리할 수도 있다.<br/>

```
% git clone --recurse-submodules {project_url}
```

<br/>

메인 프로젝트에 submodule이 이미 있고, 하위 프로젝트의 새로운 커밋을 가져와야 하는 상황에선 update 명령어를 활용한다.
이 명령어로 메인 프로젝트에서 submodule의 커밋을 가져오면, 이전에 봤던 것처럼 새로 커밋해야 하는 파일이 생긴다.
앞서 한 것과 동일하게 해당 파일을 add, commit, push해서 로컬과 원격 프로젝트에 반영한다.<br/>

```
% git submodule update --remote --merge

// .gitmodules 파일에 정의되어 있는 브랜치(default는 main 또는 master)의 최신 버전으로 업데이트
// % git submodule update --remote

// 로컬에서 작업 중인 부분과 원격에 작업된 부분이 다른 경우 머지까지 진행
// % git submodule update --remote --merge
```

<br/>

## 결론

지금까지 메인 프로젝트에 하위 프로젝트를 추가하는 방법을 알아봤다.
내용이 복잡해 보여도 직접 해보면 크게 어렵지 않게 적용할 수 있을 것이다.<br/>

프로젝트에 submodule을 적용하는 경우 한 가지 주의할 점이 있다.
submodule에 변경사항이 생겼다면, 메인 프로젝트보다 먼저 push 또는 pull을 해야 한다.
만약 메인 프로젝트를 push/pull하고 submodule을 push/pull하면 예상치 못한 오류가 발생할 수도 있다.
메인 프로젝트는 submodule을 그대로 가지지 않고 path, url, commit 정보만 저장하기 때문이다.<br/>

독자들이 git submodule을 활용해서 비밀 정보를 잘 관리하길 바란다.
단, 하나만 주의해서 submodule을 안전하게 사용하도록 하자.<br/>

<br/>

## References

- [Git: 서브모듈 이해하기 (git submodule)](https://ohgyun.com/711)
- [[git] git submodule 적용하기](https://jujeol-jujeol.github.io/2021/07/12/git-submodule-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0/)
- [Git submodule 사용하기](https://pinedance.github.io/blog/2019/05/28/Git-Submodule)