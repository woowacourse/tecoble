---
layout: post  
title: git 브랜치 전략에 대해서  
author: [3기_샐리]  
tags: ['git']  
date: "2021-07-15T12:00:00.000Z"  
draft: false  
image: ../teaser/dot-git.jpg  
---

## Git

우리는 개발을 진행하면서 우리가 구현한 소스코드를 git이라는 버전 관리 시스템을 통해 관리한다.  
git을 사용하지 않았더라면 협업을 진행하면서 메일이나 USB로 소스코드를 주고받아야 했을 것이다.
git을 사용함으로써 우리는 시시각각 코드를 전송할 수 있다. 
게다가 일일이 병합하는 과정을 생략하고도 손쉽게 소스코드를 관리할 수 있다.
뿐만 아니라 꼼꼼한 commit 로그 작성을 통해 과거의 소스코드와도 한 눈에 비교할 수 있다.  
협업을 할 때도 이 git을 사용해 분산 버전관리를 할 수 있어 브랜치에 따라 독자적인 개발을 하고 메인 저장소에 merge 하는 방식으로 체계적으로 개발을 진행할 수 있다.

그렇다면 이러한 브랜치를 어떻게 나누고 개발할 수 있을까?

이번 글에서는 대표적으로 많이 사용되는 브랜치 전략인 Git flow, Github flow, Gitlab flow에 대해서 알아보도록 하자.

### Git Flow

git flow는 `feature`, `develop`, `release`, `hotfix`, `master` 5가지의 브랜치를 갖는다.  
아래 사진은 git flow의 브랜치 전략을 가장 잘 드러내주는 그림이다.
![git flow](https://user-images.githubusercontent.com/43775108/125800526-2ea36d8e-6262-4ba5-9ef0-af7845131d85.png)

각각의 브랜치에 대해서 간략하게 알아보자.

1. feature  
   feature 브랜치는 기능의 구현을 담당한다.  
   브랜치명은 팀마다 컨벤션을 가지고 지을 수 있지만 `feature/{구현기능명}`과 같은 명칭을 준수하는 것이 일반적이다.  
   예를 들어, `feature/login`은 login 기능을 구현하는 브랜치임을 알 수 있다.    
   feature 브랜치는 develop 브랜치에서 생성되며, develop 브랜치로 머지된다.  
   머지된 후에는 해당 브랜치가 삭제된다.

2. develop  
   develop 브랜치는 말 그대로 개발을 진행하는 브랜치로 중심적인 브랜치이다.  
   하나의 feature 브랜치가 머지될 때마다 develop 브랜치에 해당 기능이 더해지며 살을 붙여간다.  
   develop 브랜치는 배포할 수준의 기능을 갖추면 release 브랜치로 머지된다.

3. release  
   release 브랜치는 개발된 내용을 배포하기 위해 준비하는 브랜치이다.  
   브랜치명은 `release-1`과 같은 방식으로 첫번째 릴리즈, 두번째 릴리즈 등을 지정하는 것이 보편적이다.  
   release 브랜치에서 충분한 테스트를 통해 버그를 검사하고 수정해 배포할 준비가 완전히 되었다고 판단되면 master로 머지해 배포한다.    
   release 브랜치는 develop 브랜치에서 생성되며 버그 수정 내용을 develop 브랜치에도 반영하고, 최종적으로 master 브랜치에 머지한다.

4. hotfix  
   hotfix 브랜치는 배포된 소스에서 버그가 발생하면 생성되는 브랜치이다.  
   브랜치명은 `hotfix-1`로 지정된다. release 브랜치를 거쳐 한차례 버그 검사를 했지만 예상치 못하게 배포 후에 발견된 버그들에 대해서 수정한다.
   hotfix 브랜치는 master 브랜치에서 생성되며, 수정이 완료되면 develop 브랜치, release 브랜치와 master 브랜치에 수정 사항을 반영한다.  

5. master  
   master 브랜치는 최종적으로 배포되는 가장 중심의 브랜치이다.  
   develop 브랜치에서는 개발이 진행되는 와중에도 이전 release 브랜치 내용이 master에 있어 배포되어 있다.

Git flow 브랜치 전략은 여러 브랜치들이 존재하고 각 브랜치마다 상황이 명확하게 분류되어 있지만, 오히려 이렇게 많은 브랜치가 흐름을 더욱 복잡하게 만들기도 한다.  
뿐만 아니라, release와 master의 구분이 모호하기도 하다.  
하지만 프로젝트의 규모가 커지면 커질수록 소스코드를 관리하기에 용이하다는 장점이 있다.

<br>

### Github Flow

github flow는 git flow의 브랜치 전략이 너무 복잡하고 적용하기 어렵다고 해서 생겨난 브랜치 전략이다.  
github flow는 master 브랜치 하나만을 가지고 진행하는 방식이다.  
master 브랜치는 어떤 기능이 구현되든, 오류가 수정되든 모두 master에 머지되어 항상 update된 상태를 유지한다.

아래 흐름은 github flow의 흐름을 보여주는 그림이다.  
![github flow](https://user-images.githubusercontent.com/43775108/125813582-d1500c51-e1af-44e7-9f90-83901dfec03f.png)

자세한 github flow의 과정을 알아보자.

1. master 브랜치에서 개발이 시작된다.
2. 기능 구현이나 버그가 발생하면 issue를 작성한다.
3. 팀원들이 issue 해결을 위해 master 브랜치에서 생성한 `feature/{구현기능}` 브랜치에서 개발을 하고 commit log를 작성한다.
4. push를 하면 pull request를 날릴 수 있다.
5. pull request를 통해 팀원들 간의 피드백, 버그 찾는 과정이 진행된다. release 브랜치가 없으므로 이 과정이 탄탄하게 진행되어야 한다.
6. 모든 리뷰가 이루어지면, merge하기 전에 배포를 통해 최종 테스트를 진행한다.
7. 테스트까지 진행되면 master 브랜치에 머지한다.

github flow는 시시각각 master에 머지될 때마다 배포가 이루어지는 것이 좋다.  
따라서 CI/CD를 통한 배포 자동화를 적용하는 것이 좋다.  
브랜치 전략이 단순해 master 브랜치에서 pull 하고, 기능 구현하고, 머지하는 일의 반복이다.  
하지만 pull request에서 팀원간의 충분한 리뷰와 피드백이 진행되지 않으면 배포된 자체에서 버그가 발생할 수 있으므로 주의해야 한다.

<br>

### GitLab Flow

gitlab flow는 복잡하지 않고 효율을 높이고자 생겨난 브랜치 전략으로 master, feature, production 브랜치가 존재한다.  
gitlab flow는 이슈트래킹을 연동해 프로세스를 단순화하고자 한다. merge request를 통해 승인이 되는 이슈만 머지하도록 하는 것이 핵심이다.

아래 그림은 gitlab flow의 흐름을 간단히 보여준다.  
![gitlab flow](https://user-images.githubusercontent.com/43775108/125891998-ccba14fb-b15d-4259-8220-d11bc1b809f0.png)

각 브랜치에 대해서 알아보자.

1. feature  
   모든 기능 구현은 feature 브랜치에서 진행된다.  
   이 feature 브랜치는 master 브랜치에서 나와 master 브랜치로 머지된다.  
   기능 구현이 완료되면 merge request를 보낸다.  
   merge request에서 팀원 간의 협의가 완료되면 master 브랜치로 머지한다.

2. master gitlab flow의 master 브랜치는 git flow의 develop 브랜치와 같다.  
   master 브랜치는 feature 브랜치에서 병합된 기능에 대해 test 한다.  
   전체적인 테스트가 진행되어 기능에 대한 보장이 되었다면 production 브랜치로 머지한다.

3. production  
   production 브랜치는 한 마디로 배포 브랜치이다. git flow의 master 브랜치와 같다.  
   안정된 소스코드가 되었을 때 production 브랜치에 병합해 배포하도록 한다.  
   하지만 여기서 견고한 test를 거치고 싶은 경우 pre-production 브랜치를 생성해 production에 병합하기 전에 test server에 배포해 확인할 수도 있다.

gitlab flow는 git flow처럼 복잡하지 않으면서, github flow처럼 너무 단순하지 않아 비교적 적용이 쉬우면서도 원활한 운영이 가능하다.  
gitlab의 CEO는 [최대한의 효울을 위해 지켜야 할 11가지 규칙](https://about.gitlab.com/blog/2016/07/27/the-11-rules-of-gitlab-flow/)에 대해 서술해두었다.  
이 11가지 규칙에 대해서 이해하고 적용한다면 최상의 gitlab flow 전략을 가져갈 수 있을 것이다.  

<br>

### 마치며

이렇게 오늘은 3가지의 브랜치 전략에 대해서 알아보았다.  
각 팀의 상황과 문화에 따라서 적합한 브랜치 전략이 있을 것이다.  
협업을 하며 최대의 효율을 내기 위해 적용할 브랜치 전략에 대해서 팀원들과 충분한 대화를 해보는 것은 어떨까?

<br>

### 참고

[Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
[Github Flow](https://guides.github.com/introduction/flow/)  
[Github Flow - Scott Chacon](https://scottchacon.com/2011/08/31/github-flow.html)  
[GitLab Flow](https://about.gitlab.com/topics/version-control/what-is-gitlab-flow/)  
