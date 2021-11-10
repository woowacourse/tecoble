---
layout: post
title: 리액트에서 도넛 차트를 만들어보자!
author: [3기_주모]
tags: ['chart', 'stroke-dasharray', 'stroke-dashoffset']
date: '2021-11-10T12:00:00.000Z'
draft: false
image: ../teaser/donut-chart-react.png
---

# 리액트에서 도넛 차트를 만들어보자

### 목차

- 도넛 차트

  - Canvas? DIV? SVG?

  - stroke-dasharray

  - stroke-dashoffset

  - 직접 만들어보기

- 애니메이션
  - keyframes

### 도넛 차트

##### Canvas? DIV? SVG?

도넛 차트는 Canvas, DIV(html, css), SVG 등 크게 3가지 방법을 사용하여 만들 수 있습니다. 각각의 특징을 간단하게 살펴보면, Canvas를 이용한 방식의 특징은 비트맵 영역을 활용하는 것입니다. 즉, 자바스크립트 코드로 화면 위에 픽셀을 그려 넣는 방법입니다. 이와 같은 방식은 픽셀을 다루게 되어 도형의 크기에 따라 해상도를 따로 고려해야 하는 단점이 있습니다. 다음으로 DIV를 이용한 방법입니다. DIV로 도넛 차트를 그리는 경우, 원을 나타내기 위해 radius를 조절하여 그리게 됩니다. 이 방식은 화면의 크기에 상관없이 도형의 크기가 고정되어 있어 반응형에 취약하다는 단점이 있습니다. 마지막으로 SVG를 사용하는 방법입니다. SVG는 벡터 형식으로, 화면의 크기에 따라 그 크기가 유동적으로 변하는 특징이 있습닌다. 또한, SVG 태그 중 하나인 `<circle>`과 `stroke`, `stroke-width` 등의 속성으로 쉽게 도형을 표현할 수 있다는 장점이 있습니다.

세 가지 방법 중에서 SVG를 이용해 도넛 차트를 만들 경우, 반응형을 지원하면서 이미 내장되어 있는 속성인 `stroke`, `stroke-width` 등을 활용하여 쉽게 만들 수 있다는 장점이 있어 SVG를 선택했습니다.

##### stroke-dasharray

도넛 차트를 그리기 앞서 먼저 `stroke-dasharray`의 개념을 먼저 알아보겠습니다.

`stroke-dasharray` 속성은 도형 둘레의 dash와 gap을 정의하는 패턴으로, 도형 둘레의 stroke의 길이와 각각의 stroke 사이 공백의 패턴을 정의합니다. 예시를 통해 알아보겠습니다.

`stroke-dasharray` 속성이 적용되지 않은 기본 `<line>`은 다음과 같습니다.

```javascript
<svg viexBox="0 0 100 100">
  <line x1="0" y1="5" x2="100" y2="5" stroke="green" strokeDasharray="0" />
</svg>
```

이 기본 svg line에 다양한 stroke-dasharray 값을 적용해보겠습니다.

<img width="40%" alt="new-1" src="https://user-images.githubusercontent.com/40762111/140966870-741fedd3-45fe-46d3-9fee-02d8c10b0be0.png">

결과는 위와 같습니다. 하나의 값만 할당하고 있는 `stroke-dasharray="5"`는 각 stroke의 길이와 각각의 stroke 사이 공백의 길이를 5로 정의한다는 의미입니다. stroke 사이 공백의 길이도 따로 정의할 수 있는데, `stroke-dasharray="5 10"`과 같이 두 개의 값 사이에 공백을 두어 할당하면(공백 대신 `,`도 가능합니다) , 첫 번째 값은 각 stroke의 길이, 두 번째 값은 각각의 stroke 사이 공백의 길이를 의미하게 됩니다.

추가적으로 패턴은 아래의 예시처럼 svg 도형의 길이까지만 적용되어, 길이를 넘어가는 부분은 잘리게 됩니다.

<img width="40%" alt="new-2" src="https://user-images.githubusercontent.com/40762111/140972913-d2d2ea1e-550a-4668-b451-a33b19a2618b.png">

그럼 도넛에도 적용해 보겠습니다.

도넛의 둘레의 길이가 약 565인 원이 있습니다. 이 도넛에 `stroke-dasharray="20"`, `stroke-dasharray="40"`, `stroke-dasharray="60"` `stroke-dasharray="40 20"`을 각각 적용해 살펴보겠습니다.

<img width="40%" alt="3" src="https://user-images.githubusercontent.com/40762111/140849596-83847816-4d59-4488-957a-ebb4049f7101.png">

<img width="40%" alt="4" src="https://user-images.githubusercontent.com/40762111/140849600-51904ca8-09e5-4522-a125-5ad634ad6c33.png">

<img width="40%" alt="5" src="https://user-images.githubusercontent.com/40762111/140849605-ce7cd8a5-b675-48d7-a94b-8a5d27924a26.png">

<img width="40%" alt="6" src="https://user-images.githubusercontent.com/40762111/140851420-b836580a-9024-4f09-a237-f8233ebbd9d3.png">

위의 svg line 예시와 동일합니다. 다만 svg circle은 `stroke-dasharray` 패턴이 시계 3시 방향에서 시작한다는 특징이 있습니다.

##### stroke-dashoffset

이번에는 `stroke-dashoffset` 속성을 알아보겠습니다. `stroke-dashoffset`은 dash array를 렌더링 할 때 offset을 정의하는 속성입니다. 예시로 확인해 보겠습니다.

<img width="40%" alt="7" src="https://user-images.githubusercontent.com/40762111/141059819-b72235f6-811f-4cd4-ab3b-630cd7ab813d.png">

<img width="80%" alt="8" src="https://user-images.githubusercontent.com/40762111/141062621-9cc22bb1-84ea-4f13-950b-4d1a0dd1d145.png">

svg line의 기본 형태는 `stroke-dasharray="10 5"`입니다. 여기에 `stroke-dashoffset` 속성을 적용하면 할당되는 값에 따라 화면에 보이는 패턴이 변경됩니다. 두 번째 그림에서 네모 박스는 실제로 화면에서 보이는 영역입니다. 양수인 경우, 할당된 값만큼 네모 박스가 오른쪽으로 이동하여 박스 안에 속한 패턴이 화면에 보이게 됩니다. 음수인 경우, 그 반대인 왼쪽으로 이동합니다.

`stroke-dashoffset` 값에 따라 네모 박스가 이동한다고 하여 화면에 보이는 영역 자체가 이동한다고 착각할 수 있습니다. 하지만, 첫 번째 그림과 같이 화면에 보이는 영역의 위치는 동일하고 영역 내 패턴의 모습만 달라지게 됩니다.

##### 직접 만들어보기

만들고자 하는 차트는 75%를 표시하고 있는 도넛 차트입니다. 바로 진행해 보겠습니다.

환경은 CRA를 이용하여 구성했고, 전체적인 코드를 보여주기 위해서 도넛 차트를 컴포넌트로 따로 분리하지 않았습니다.

```javascript
// App.js

const App = () => (
  <div style={{ marginTop: '50px', marginLeft: '50px' }}>
    <div style={{ width: '200px', height: '200px' }}>
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="beige" strokeWidth="20" />
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="green"
          strokeWidth="20"
          strokeDasharray="423.75"
        />
      </svg>
    </div>
  </div>
);

export default App;
```

<img width="40%" alt="9" src="https://user-images.githubusercontent.com/40762111/141073412-6a563d47-d5bc-457c-a101-0964bcc1b159.png">

75%의 도넛 차트를 그리기 위해서 `stroke-dasharray="423.75"` 속성을 사용했습니다. 423.75의 값은 반지름의 길이가 90인 원의 전체 둘레(약 565라 565로 계산)에 0.75를 곱한 값입니다.

> 둘레의 길이는 `2* Math.PI * 반지름` 또는 `document.getElementById().getTotalLength()` 등으로 구할 수 있습니다.

다음 과정은 도넛 차트를 반시계 방향으로 90° 회전시키는 것입니다. svg에서 도형을 회전시키기 위한 방법으로 `stroke-dasharray`와 `stroke-dashoffset` 속성을 활용할 수 있는데, `stroke-dasharray` 속성으로 먼저 패턴을 정의하고, `stroke-dashoffset` 속성을 이용해서 패턴에서 화면에 보이는 영역을 조정하는 방식입니다.

먼저 현재 도넛 차트에 정의되어 있는 패턴을 확인해 보겠습니다.

<img width="100%" alt="10" src="https://user-images.githubusercontent.com/40762111/141093073-552fbf90-bb26-4623-931c-e77b7136bfce.png">

패턴은 위 그림과 같이 `stroke-dasharray="423.75"`로, stroke의 길이와 stroke 사이 간격 모두 423.75로 정의되어 있고, 화면에 보이는 영역은 빨간 네모 박스 부분입니다. 하지만 최종적으로 화면에 보여야 하는 영역은 다음과 같습니다.

<img width="40%" alt="11-2" src="https://user-images.githubusercontent.com/40762111/141103931-7accdbb9-858d-47e2-8a06-afcfec6c8295.png">

<img width="50%" alt="11" src="https://user-images.githubusercontent.com/40762111/141106723-38c43598-2eed-4f87-8e93-f76a91319c6c.png">

circle에서 stroke가 3시 방향에서 시작되므로, 12시 방향을 0°라고 했을 때, 3시 방향인 90°에서 9시 방향인 270°까지 색이 채워지고, 270°에서 360(0)°까지 공백, 0°에서 90°까지 다시 색이 채워져야 ㄴ합니다.

현재 정의되어 있는 패턴으로는 `stroke-dashoffset`을 조정해도 목표로 하는 패턴을 표현할 수 없기 때문에, 패턴을 다시 정의합니다.

<img width="100%" alt="12" src="https://user-images.githubusercontent.com/40762111/141093134-0ae218ae-f342-45ac-87ae-bed9f03df5cf.png">

stroke의 길이는 전체 둘레의 75%에 해당하는 423.75, 각 stroke 사이 공백은 전체 둘레의 25%인 141.25인 `stroke-dasharray="423.75, 141.25"`로 변경합니다.

> 각 stroke 사이 공백을 141.25로 한 이유는 `stroke-dasharray`의 첫 번째 값과 두 번째 값을 합쳐 원 전체 둘레의 길이가 나오게 하기 위함입니다. 이렇게 하면 패턴이 반복되는 길이의 기준이 전체 원 둘레가 되어, 이후 `stroke-dashoffset` 속성을 적용하기 용이합니다.

<img width="100%" alt="13" src="https://user-images.githubusercontent.com/40762111/141093378-45c6f499-07ec-4988-a8a9-4f7e2b57e486.png">

그러고는 `stroke-dashoffset="141.25"` 속성을 적용하여, 원하는 패턴이 화면에 보이도록 조정합니다. 위 그림에서 화면에 보이는 영역인 빨간 네모 박스의 시작이 180°로 되어 있고 그 위에 있는 도형의 모양도 이전 그림과 동일한데, 이는 이전 그림에서 `stroke-dashoffset` 속성을 적용하여 화면에 보이는 영역이 이동했다는 것을 나타내기 위함입니다. 실제로는 `stroke-dashoffset`의 조정과 동시에 다음과 같이 패턴이 변경됩니다.

<img width="100%" alt="14" src="https://user-images.githubusercontent.com/40762111/141094774-41e8d3a8-c6b2-406c-b8f2-1d19699a7aa7.png">

최종 코드는 다음과 같습니다.

```javascript
// App.js

const App = () => (
  <div style={{ marginTop: '50px', marginLeft: '50px' }}>
    <div style={{ width: '200px', height: '200px' }}>
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="beige" strokeWidth="20" />
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="green"
          strokeWidth="20"
          strokeDasharray="423.75 141.25"
          strokeDashoffset="141.25"
        />
      </svg>
    </div>
  </div>
);

export default App;
```

<img width="40%" alt="15" src="https://user-images.githubusercontent.com/40762111/141095451-abd5cb83-a6aa-40d6-b299-aab495827b9c.png">

위 과정을 보면 `stroke-dasharray`와 `stroke-dashoffset` 속성을 이용해서 도넛 차트 만드는 방법이 굉장히 복잡해보입니다. 하지만, 다음과 같이 계산하여 쉽게 만들 수 있습니다.

```javascript
// React

// x = 원의 전체 둘레 길이
// a = 데이터에 해당하는 원의 둘레 길이 ex) 63% -> x * 0.63

<circle strokeDasharray="<a> <x - a>" strokeDashoffset="<0.25 * x>" />
```

### 애니메이션

애니메이션은 `@keyframes`를 이용하여 간단히 구현할 수 있습니다. 다음 예시는 스타일 라이브러리로는 [emotion](https://emotion.sh/docs/introduction)을 사용했습니다.

```javascript
// App.js

import { AnimatedCircle } from './App.styles';

const App = () => (
  <div style={{ marginTop: '50px', marginLeft: '50px' }}>
    <div style={{ width: '200px', height: '200px' }}>
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="none" stroke="beige" strokeWidth="20" />
        <AnimatedCircle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="green"
          strokeWidth="20"
          strokeDasharray="423.75 141.25"
          strokeDashoffset="141.25"
        />
      </svg>
    </div>
  </div>
);

export default App;
```

```javascript
// App.styles.js

import styled from '@emotion/styled';

const AnimatedCircle = styled.circle`
  animation: circle-fill-animation 2s ease;

  @keyframes circle-fill-animation {
    0% {
      stroke-dasharray: 0 565;
    }
  }
`;

export { AnimatedCircle };
```

`App.styles.js` 파일의 `@keyframes`에서 `0%`는 애니메이션의 시작을 의미합니다. 즉, 애니메이션 초기에는 `stroke-dasharray: 0 565` 속성으로 각 stroke의 길이를 정의하지 않고, stroke 사이 공백을 원 전체 둘레로 정의하는 것을 의미합니다.

<video width="40%" autoplay loop>
    <source src="https://user-images.githubusercontent.com/40762111/141101301-03ad3f18-d37b-4930-962b-4aba3e1f7c5f.mov" type="video/mp4">
</video>

### 참조

https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray

https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dashoffset

https://developer.mozilla.org/ko/docs/Web/CSS/@keyframes
