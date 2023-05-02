---
layout: post
title: '이미지 사이즈 최적화'
tags: ['web', 'image', 'optimization']
author: [5기_황펭]
date: '2023-05-02T13:10:00.000Z'
draft: false
image: ../teaser/image-size-optimization.png
---

## 들어가며

우아한테크코스에서 미션을 진행할 때, 요구 사항을 분석하고 기능 구현을 끝으로 마무리하는 경우가 많았다. 하지만 다양한 기능들이 있어도 사용자에게 제공하는 시간이 느리다면 좋은 서비스라고 할 수 있을까? 어느 정도의 기능이 뒷받침되어야 하겠지만, 사용자 경험에서 속도도 중요한 요소라고 생각한다. 속도 향상을 위해 최적화에 관심을 가지게 되었고, 이 중 이미지를 최적화의 간단한 방법을 작성해 본다.

## 웹에서 이미지

웹 페이지를 보여주기 위해 서버에 리소스(HTML, CSS, Javascript, 이미지, 동영상, 폰트 등)를 요청해 받아온다. 그렇다면 웹에서 이미지는 어느 정도 차지하고 있을까?

<figure align="center">
  <img width="600px" height="371px" src="./../images/2023-05-02-image-in-web.png" />
  <figurecaption>출처: Web Almanac</figurecaption>
</figure>

<br>

위의 통계에서 보면 가장 큰 비율을 차지하는 것을 볼 수 있다. 이미지가 많은 페이지라면 이 용량을 줄이는 것만으로 성능 향상을 가져올 수 있을 것이다. 이미지의 용량을 줄이는 다양한 방법이 있지만, 그중에 사이즈를 줄이는 방법에 대해 알아본다.

## 렌더링 사이즈에 맞추기

특정 크기로 보이는 이미지에서 이미지 사이즈 설정 전후 속도 차이를 비교해 본다.
(아래의 내용은 리액트 개발 환경에서 진행했다.)

<img width="700px" height="403px" src="./../images/2023-05-02-image-size-test-1.png" />

직경 60px 크기의 원에 이미지를 넣는다고 가정해 본다. 위의 이미지는 원본 이미지로 크기가 `389kb`, 아래는 크기를 축소한 이미지로 크기가 `12.8kb`이다. 보이는 크기에 맞게 축소했을 뿐인데 용량을 `97%`나 줄일 수 있다. 여러 네트워크 상황에서 두 이미지를 받아오는 시간을 비교해 본다.

<img width="700px" height="403px" src="./../images/2023-05-02-image-size-test-2.png" />
<img width="700px" height="403px" src="./../images/2023-05-02-image-size-test-3.png" />
<img width="700px" height="403px" src="./../images/2023-05-02-image-size-test-4.png" />

원본 이미지가 현재 속도에서는 `2배`, Fast 3G 환경에서는 `4배`, Slow 3G 환경에서는 `4배` 더 오래 걸리는 것을 확인할 수 있다.

## 반응형 이미지

이번에는 데스크톱과 모바일 환경에서 생각해 본다. 두 환경은 화면의 크기에서 차이가 있다. 데스크톱의 큰 화면과 모바일의 작은 화면을 비교했을 때 데스크톱의 큰 이미지는 모바일에서 필요하지 않을 수 있다. 이런 상황에서 반응형 이미지를 사용할 수 있다. 반응형 이미지는 환경에 맞게 적절한 사이즈를 제공해 용량을 줄이는 방법이다.

반응형 이미지는 아래와 같이 사용할 수 있다.

```html
<img srcset="horong-480w.jpg 480w,
             horong-800w.jpg 800w"
     sizes="(max-width: 480px) 440px,
            800px"
     src="horong-800w.jpg" alt="밥상 위에 올라간 호롱이" />
```

- srcset: 브라우저에 제시할 이미지 목록과 크기를 정의한다. 480w, 800w는 이미지의 고유 픽셀 너비로 단위는 w를 사용한다.
- sizes: 화면 크기 조건을 정의한다. 특정 크기일 때 이미지를 크기를 나타낸다.

위와 같이 작성하면 브라우저는 다음과 같이 확인한다.

- 기기 너비 확인
- sizes 목록에서 조건 확인
- 해당 조건에서 이미지 크기 확인
- 크기에 근접한 srcset에 작성한 이미지를 불러온다.

<img width="600px" height="473px" src="./../images/2023-05-02-responsive-image-test.gif" />

`69.1kb`의 이미지를 모바일 환경에서 `29kb`로 용량을 `58%` 줄였다!

## 실전 적용

테코블에 글을 올리기 전 프로필을 만들었다. 프로필 배경에 적용하고 싶은 사진이 있는데 사진의 크기가 5.9MB이다..! 용량을 줄이기 위해 위에서 작성한 내용을 적용해 보았다.

- 이미지 사이즈 축소: 3024x3024 -> 1240x1240,  `5.9mb -> 2.76mb`
- 이미지 압축: 75%, `2.76mb -> 468kb`
- 이미지 자르기: 1240x1240 -> 1240x620, `468kb -> 137kb`

위의 과정을 거쳐 이미지의 용량이 `98%` 감소했다!

## 참고

- [Web Almanac - Page Weight](https://almanac.httparchive.org/en/2022/page-weight)
- [web.dev - 올바른 크기의 이미지 제공](https://web.dev/serve-images-with-correct-dimensions/)
- [MDN - 반응형 이미지](https://developer.mozilla.org/ko/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)