---
layout: post
title: 우테코 프로젝트에서 Github Actions를 이용한 배포 자동화
author: [3기_주모]
tags: ['Github Actions', 'deployment', 'aws']
date: '2021-09-23T12:00:00.000Z'
draft: false
image: ../teaser/frontend-deployment.png
---

[팀 프로젝트 백중원](https://github.com/woowacourse-teams/2021-cvi)에서 프론트앤드 배포 인프라로 AWS의 S3와 CloudFront를 사용하고 있다. 하지만 배포 과정에서 자동화가 적용되지 않은 상태라, 실제 서비스에 사용되는 `main` 브랜치나 `develop` 브랜치가 최신화될 때 매번 수동으로 S3에 객체를 업로드하고 있었다. 객체 자체를 업로드하는 과정이 복잡한 것은 아니지만, 매번 최신 객체가 업로드되어 있는지 확인해야 하고 이로 인해 추가적인 커뮤니케이션의 비용이 든다. 따라서 Github Actions를 사용하여 배포 자동화를 적용하게 되었다.

배포 자동화가 이루어지면 다음과 같은 플로우로 배포가 진행된다.

![frontend-deployment-flow](https://user-images.githubusercontent.com/40762111/134311751-60db6b90-76e1-4ef3-81dd-90ac4c73bb2a.png)

이번 글에서는 5, 6번과 관련된 부분을 다룰 예정이다. 글은 먼저 전체적인 과정을 설명한 뒤, 각 부분을 직접 따라 하는 방식으로 진행된다.

## 목차

- 전체적인 과정 요약
- 자격 증명 정보 발급
- 프로젝트 Repository Secret 등록
- S3 버킷 ACL(엑세스 제어 목록) 피부여자 추가
- S3 버킷 객체 소유권 변경
- Github Actions workflow 작성

## 전체적인 과정 요약

위 사진의 배포 플로우에서 6번을 보면 Github Actions를 사용하여 AWS S3에 객체를 업로드한다. 이 부분을 자세히 살펴보면, Github Actions는 특정 이벤트가 발생할 때 미리 입력된 명령어가 동작할 수 있는 환경을 제공하는데, 우리는 S3 버킷에 객체를 업로드하기 위해, 이곳(`.yml` 파일)에 AWS 명령어를 입력할 예정이다. 그런데, 이 AWS 명령어가 동작하기 위해서는 자격 증명 정보(`access-key-id`와 `secret-access-key`)와 리전 정보(`region`)가 필요하다. 이 정보들은 AWS SDK와 AWS CLI에서 확인되어 AWS 명령어가 동작하기 위한 자격 증명과 지역을 결정하는 데 사용되기 때문이다.

그래서 AWS 팀 계정에서 먼저 자격 증명 정보(`access-key-id`와 `secret-access-key`)를 발급받는 과정이 필요하다. 그런데, 우테코에서 제공해 주는 팀 계정은 이 정보를 발급받을 권한이 없다. 다른 곳에서 사용된다면 보안상의 문제가 발생할 수 있기 때문이다. 이런 이유로 자격 증명을 발급받을 수 있는 다른 계정이 필요하다. (우테코에서 미션을 위해 개인적으로 제공해 주었던 계정도 자격 증명 정보를 발급받을 수 없다.)

새로운 계정을 생성했으면, 해당 계정으로 자격 증명 정보(`access-key-id`와 `secret-access-key`)를 발급받는다. 새로운 계정에서 발급받은 자격 증명 정보와 팀 계정에서 S3 버킷을 생성할 때 지정한 리전 정보는 앞서 말했던 것처럼 S3에 객체를 업로드하는 AWS 명령어가 동작하기 위해서 사용된다. 이제 이 정보들을 Github Actions가 실행되는 환경에서 사용될 수 있도록 프로젝트 Repository Secret에 등록한다.

그런데, 여기서 생각해 볼 부분이 있다. Github Actions에서 AWS 명령어를 동작시키기 위해 자격 증명 정보(`access-key-id`, `secret-access-key`)와 리전(`region`) 정보를 사용했는데, 이는 새로 생성한 계정의 정보이다. 하지만, S3 버킷을 소유하고 있는 계정은 우테코에서 제공된 팀 계정이다. 즉, S3 버킷에 객체를 업로드하는 계정과 S3 버킷을 소유하는 계정이 서로 다르다. 이런 이유로 새로 생성한 계정은 팀 계정의 S3 버킷에 접근할 수 없다. 새로운 계정이 팀 계정의 S3 버킷에 접근하여 객체를 업로드하기 위해서, 팀 계정에서 생성한 S3 버킷의 ACL(액세스 제어 목록)의 피부여자에 새로 만든 계정을 추가한다. 이렇게 하면 새로 만든 계정에서 팀 계정이 만든 S3 버킷에 접근하여 객체를 업로드할 수 있다.

그런데, 한 가지 더 설정이 필요하다. 이는 S3 버킷의 특성에서 비롯되는데, 기본적으로 S3 버킷의 객체 소유권은 버킷에 객체를 업로드한 계정이 갖게 된다. 즉, 새로 생성한 계정이 S3 버킷에 객체를 업로드하면, 해당 계정이 그 객체의 소유권을 갖게 되는 것이다. 이렇게 되면 Github Acitons를 이용해 객체를 업로드하는 계정은 새로 만든 계정이므로, 팀 계정은 S3 버킷을 생성한 버킷의 소유자임에도 불구하고, 해당 버킷의 객체 소유권은 새로 만든 계정에서 갖게 된다. 객체의 소유권이 달라지게 되면, 팀 계정의 CloudFront에서 S3 버킷의 객체에 소유권이 없어 접근하지 못하게 된다. 이런 상황을 방지하기 위해서 팀 계정에서 생성한 S3 버킷의 권한에서 객체 소유권을 `버킷 소유자 선호`로 변경한다.

![순서](https://user-images.githubusercontent.com/40762111/134388343-cf8b640a-293d-48cc-9461-1a98e20bdd27.png)

## 자격 증명 정보 발급

해당 단계는 위 사진을 기준으로 `1. AWS 계정 생성` 과정을 마친 이후 `2. 자격 증명 발급`이다. 앞으로의 과정에서 AWS 관리 콘솔에 새로 만든 계정과 우테코 팀 계정을 동시에 로그인해야 하므로, 둘 중 하나의 계정은 시크릿 모드를 이용해 로그인한다.

자격 증명을 발급받기 위해 새로 생성한 계정에서 로그인 후, 메뉴에서 `내 보안 자격 증명`을 누른다.

![스크린샷 2021-09-23 오전 1 36 58](https://user-images.githubusercontent.com/40762111/134385627-e51f6d16-6a6b-4259-ac36-a9ecf4f01c35.png)

나타나는 `보안 자격 증명` 페이지에서 `액세스 키(액세스 키 ID 및 비밀 액세스 키)`의 `새 액세스 키 만들기`를 눌러 자격 증명을 발급받는다. 참고로 나타나는 보안 액세스 키는 한 번 밖에 확인할 수 없으므로 따로 보관하거나 `키 파일 다운로드`로 파일을 다운로드해 보관한다.

![스크린샷 2021-09-23 오전 1 44 55](https://user-images.githubusercontent.com/40762111/134386454-bf37c846-4c87-444d-a399-f541bc0b93e9.png)

## 자격 증명 정보, 리전 정보 Repository Secrets에 등록

이번 단계는 방금 발급받은 자격 증명 정보와 우테코 팀 계정에서 만든 S3 버킷의 리전 정보를 프로젝트 Repository Secrets에 등록하는 과정이다. 자격 증명 정보는 바로 이전에 단계에서 발급받았으므로 제외하고, S3 버킷의 리전 정보를 확인하겠다.

우테코 팀 계정의 S3 메뉴로 들어가 설정하고자 하는 버킷을 눌러 상세 페이지로 이동한다. 버킷의 `속성` 메뉴에서 `버킷 개요` 부분을 보면, 리전 정보를 확인할 수 있다.

![스크린샷 2021-09-23 오전 2 05 45](https://user-images.githubusercontent.com/40762111/134389491-bd17f42b-d05c-468c-a958-b09a1b10beba.png)

이제 깃허브 프로젝트 페이지로 이동하여, `Settings` - `Secrets` - `New repository secret`을 눌러 자격 증명 정보와 리전 정보 등록한다. `Name`은 임의로 만들어도 상관없고, `Value`는 발급받은 자격 증명 정보를 입력한다.

![스크린샷 2021-09-23 오전 2 10 02](https://user-images.githubusercontent.com/40762111/134390167-29f2f822-5fbd-4896-8491-e8d4e09c955b.png)![스크린샷 2021-09-23 오전 2 21 45](https://user-images.githubusercontent.com/40762111/134391668-3ec3c86a-781d-4f5a-ac35-4fc8ed31f435.png)![스크린샷 2021-09-23 오전 2 22 11](https://user-images.githubusercontent.com/40762111/134391665-7e8f5f22-9d09-4001-b797-0e85bfbebfe3.png)

## S3 버킷의 ACL(엑세스 제어 목록)에 피부여자 추가

다음은 새로 만든 계정이 우테코 팀 계정의 S3의 버킷에 객체를 업로드하기 위해서 접근할 수 있도록 하는 과정이다. S3의 버킷의 ACL에 피부여자로 등록하기 위해서는 AWS 계정의 ID가 필요하다. 그래서 이전 단계에서 자격 증명을 발급받았던 것처럼 새로 만든 계정에서 메뉴의 `내 보안 자격 증명`을 눌러 접근한 뒤 `계정 ID` 탭을 눌러 `정규 사용자 ID`를 확인한다.

![스크린샷 2021-09-23 오전 2 43 43](https://user-images.githubusercontent.com/40762111/134394748-25489249-f6b4-44ac-9bd5-f8bc5a6e64db.png)

이제 다시 우테코 팀 계정의 S3 버킷의 상세 페이지로 돌아가, 메뉴 중에 `권한`을 눌러 아래로 스크롤 해 `ACL(액세스 제어 목록)`에서 `편집`을 누른다. 이후 `피부여자 추가` 버튼을 눌러, 새로 만든 계정의 `정규 사용자 ID`를 입력하고 객체의 나열, 쓰기 / 버킷 ACL의 읽기, 쓰기를 모두 체크하고 저장한다.

![스크린샷 2021-09-23 오전 2 39 27](https://user-images.githubusercontent.com/40762111/134394153-b2be8b27-c5f9-4e6e-b065-9a2b88fbfa33.png)

## S3 버킷의 객체 소유권 변경

설정의 마지막으로 S3 버킷의 객체 소유권을 변경하는 단계이다. 새로 만든 계정이 S3의 버킷에 객체를 업로드해도, 객체의 소유권을 우테코 팀 계정이 갖기 위해 필요한 과정이다. 위의 과정과 비슷하게 S3 버킷의 상세 페이지에서 `권한`의 `객체 소유권` - `편집`을 누른다. 이후 `버킷 소유자 선호`를 누른 후 저장한다.

![스크린샷 2021-09-23 오전 2 51 55](https://user-images.githubusercontent.com/40762111/134395846-ef8398eb-a712-4281-bb6c-3f87ad7fb50c.png)

## Github Actions workflow 작성

workflow는 프로젝트 repository 내에서도 작성할 수 있고, 따로 폴더와 파일을 만들어 작성할 수도 있다. 프로젝트 repository 내에서 작성하는 경우 메뉴에서 `Actions`를 누른 후, 왼쪽의 `New workflow` - 아래로 스크롤을 내려 `Manual workflow`의 `Set up this workflow`를 눌러 작성할 수 있다.

![스크린샷 2021-09-23 오전 2 58 28](https://user-images.githubusercontent.com/40762111/134396850-5d7b8068-05de-480c-b21f-a9654cee7db2.png)

예시로 작성한 workflow는 다음과 같다.

```yaml
# .github/workflows/front-dev-deploy.yml

name: front-dev-deploy

on:
  push: # 적용될 액션
    branches: develop # 적용될 브랜치
    paths:
      - 'frontend/**' # workflow에서 적용될 path

defaults:
  run:
    working-directory: ./frontend # workflow에서 default working directory

jobs:
  deploy:
    runs-on: ubuntu-latest # 인스턴스 OS
    steps:
      - name: Checkout source code
        uses: actions/checkout@v2 # 워크플로에서 액세스할 수 있도록 에서 저장소를 체크아웃

      - name: Install Dependencies
        run: yarn

      - name: Build
        run: yarn build

      - name: S3 Deploy
        run: aws s3 sync ./dist s3://2021-cvi-dev/ --acl bucket-owner-full-control # s3 이름 2021-cvi-dev
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: ${{ secrets.AWS_REGION }}
```

Github actions가 `develop` 브랜치에 `push`되는 경우 동작하도록 workflow를 작성했다.

![스크린샷 2021-09-23 오전 5 28 56](https://user-images.githubusercontent.com/40762111/134417159-38ad59a0-c625-4ed8-be04-ed409ca9c4fd.png)

`develop`에 `push` 이벤트가 발생하니 Github Actions가 잘 동작한다.

AWS에서 S3 버킷의 객체도 확인해 보니, 새롭게 업로드된 것을 확인할 수 있다.

![스크린샷 2021-09-23 오전 5 27 45](https://user-images.githubusercontent.com/40762111/134417146-9f5725db-a55a-47b0-9006-67db188e66ee.png)

## 참조

- [https://github.com/aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials)
- [https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/about-object-ownership.html](https://docs.aws.amazon.com/ko_kr/AmazonS3/latest/userguide/about-object-ownership.html)
- [https://yung-developer.tistory.com/111](https://yung-developer.tistory.com/111)
