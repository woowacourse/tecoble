---
layout: post
title: SVG viewBox를 알아보자
author: [3기_주모]
tags: ['svg']
date: '2021-10-24T12:00:00.000Z'
draft: false
image: ../teaser/svg-viewBox.png
source: https://ko.wikipedia.org/wiki/%ED%8C%8C%EC%9D%BC:SVG_logo.svg
---

### 목차

- SVG란
- viewBox란
  - 의미
  - 기본 예시
  - 위치 조정 예시
  - 확대, 축소 예시
- 정리

### SVG란

SVG에 대해서 간단하게 알아보자. SVG란 **S**calable **V**ector **G**raphics의 약자로 `확장 가능한 벡터 그래픽`, 다시 말해 `크기를 확대하거나 축소할 수 있는, 수학적 함수를 이용해 도형이나 선을 그려서 표현한 그래픽`이라고 할 수 있다. 여기서 `수학적 함수를 이용해 도형이나 선을 그려서 표현한`이라는 의미는 우리가 수학 시간에 배웠던 `좌표평선 위의 그려져 있는 그래프` 정도로 이해할 수 있다. SVG는 이런 방식을 차용함으로써, 우리가 흔히 알고 있는 `jpg`, `png`, `gif`와 다르게 확대해도 선명도가 떨어지지 않는다. 또한, 도형이나 선으로 구성되어 있어 파일의 용량이 상대적으로 작다. 하지만 `svg`를 구성하는 선들이 복잡해지는 경우, 다른 확장자(`jpg`, `png` 등)로 된 동일한 파일보다 그 용량이 더 커질 수 있고, 수학적 계산으로 로딩 시간이 길어질 수 있다는 단점이 있다.

### viewBox란

##### 의미

viewBox는 svg 요소들이 그려지는 영역에서 svg 요소들의 위치를 조정하거나, 크기를 확대하거나 축소할 수 있는 속성이다. viewBox 속성이 없어도 svg 요소를 화면에 그릴 수는 있지만, viewBox를 통해 svg 요소의 크기 배율을 조절하기 때문에 크기를 확대하거나 축소할 수는 없다. 즉, 반응형 웹을 고려한 svg 요소를 만들기 위해서는 필수 속성이다.

##### viewBox 속성 값

viewBox 속성의 값은 다음과 같다.

`viewBox="<min-x> <min-y> <width> <height>"`

<img src="https://user-images.githubusercontent.com/40762111/138582965-1d57b799-4cee-42fa-83dc-fa9e38aa2564.png" width="80%" alt="viewBox 예시1" />

위 그림처럼 `min-x`와 `min-y`는 svg가 그려지는 영역의 시작점, 왼쪽 상단의 꼭짓점으로, `width`와 `height`는 각각 영역의 가로, 세로 길이로 볼 수 있다.

여기서 주의할 점은 `width`와 `height`가 우리가 흔히 생각하는 `px` 단위가 아니라는 것이다. viewBox의 의미에서 말했던 것처럼 svg 요소들의 위치를 조정하거나, 요소들의 확대와 축소를 위한 일종의 좌표 평면이다. 그럼 예시를 통해서 좀 더 자세히 알아보겠다.

##### 기본 예시

이해를 돕기 위해 svg 요소 중에 `circle`을 추가하여 컴포넌트 형태로 만들었다.

```javascript
const App = () => (
  <div style={{ marginTop: '50px', marginLeft: '50px' }}>
    <div style={{ backgroundColor: 'yellow', width: '300px', height: '300px' }}>
      <svg viewBox="0 0 200 200">
        <circle r="100" fill="blue" />
      </svg>
    </div>
  </div>
);

export default App;
```

<img width="100%" alt="SVG viewBox-2" src="https://user-images.githubusercontent.com/40762111/138591296-1cca74c3-136b-4f64-b6db-0cf36cedd3b0.png">

viewport에서 svg는 `width`와 `height`가 각각 300px인 영역 안에 위치하고 있다. 하지만 svg의 viewBox는 `"0 0 200 200"`이므로, viewport의 `width`, `height` 300px의 길이는 svg viewBox 좌표평면 기준으로 200의 길이가 된다. svg의 요소 중에서 `circle`의 좌표 또한 svg의 viewBox의 좌표를 따르게 된다. `circle` 요소의 중심 좌표 속성 `cx`와 `cy`가 설정되지 않은 상태이므로 현재 `cx="0"`, `cy="0"`이 적용된 상태이면서, 반지름 `r=100`의 `circle` 요소가 만들어져 있는 것을 확인할 수 있다. 여기서 특징은 원 중심을 기준으로 제1, 3, 4 사분면(보라색 부분)은 svg viewBox 영역을 벗어났기 때문에 viewport에서 나타나지 않는다는 점이다.

##### 위치 조정 예시

이번에는 다른 예시를 보자.

일단 `circle` 요소에 `cx="100"`, `cy="100"`을 추가했다.

```javascript
const App = () => (
  <div style={{ marginTop: '50px', marginLeft: '50px' }}>
    <div style={{ backgroundColor: 'yellow', width: '300px', height: '300px' }}>
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="100" fill="blue" />
      </svg>
    </div>
  </div>
);

export default App;
```

<img width="100%" alt="SVG viewBox-3" src="https://user-images.githubusercontent.com/40762111/138591304-625a271a-d0b2-4b5e-813b-750dee8f68c0.png">

현재 상태에서 viewBox를 이용해서 어떻게 기본 예시와 같은 모양을 만들 수 있을까. 바로 `min-x`와 `min-y`를 변경하면 된다.

<img width="100%" alt="SVG viewBox-4" src="https://user-images.githubusercontent.com/40762111/138591309-32277e0e-626e-45f8-8117-a22f2f36825c.png">

viewBox의 `min-x`, `min-y`를 변경하면 viewport에서 보이는 영역(현재 예시에서의 `width`, `height` 300px 영역)이 동일하지만, svg에서 보여주는 영역은 변경된다. viewBox가 `"0 0 200 200"`부터 `"1 1 200 200"`, `"2 2 200 200"` 이런 식으로 `"100 100 200 200"`까지 변경되면, 아래 영상과 같이 된다.

<video width="50%" autoplay loop>
    <source src="https://user-images.githubusercontent.com/40762111/138588688-3d925445-a45e-4f4c-9c2f-eaaf94c77087.mov" type="video/mp4">
</video>

##### 확대, 축소 예시

viewBox의 `width`와 `height`를 변경하면 svg 요소들을 확대하거나 축소할 수 있다.

```javascript
const App = () => (
  <div style={{ marginTop: '50px', marginLeft: '50px' }}>
    <div style={{ backgroundColor: 'yellow', width: '300px', height: '300px' }}>
      // 이 부분만 변경 viewBox="0 0 100 100" / viewBox="0 0 200 200" / viewBox="0 0 300 300"
      <svg viewBox="0 0 100 100">
        <circle cx="100" cy="100" r="100" fill="blue" />
      </svg>
    </div>
  </div>
);

export default App;
```

<img width="1023" alt="SVG viewBox-6" src="https://user-images.githubusercontent.com/40762111/138591367-31e26466-f18d-4158-91b2-8033b77fa7bd.png">

viewBox의 속성값 중 `width`와 `height`를 각각 100, 200, 300으로 변경했다. 이 값을 변경하더라도 viewport에서 보이는 영역(`width`, `height` 300px)은 동일하지만, svg 영역 안에서의 요소를 확대하거나 축소할 수 있다.

### 정리

특정 영역에서 svg의 위치를 조정하거나 크기를 확대, 축소하기 위해 viewBox를 이용할 수 있다.
