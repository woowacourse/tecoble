---
layout: post
title: 리액트 컴포넌트 npm publish
author: [3기_주모]
tags: ['react', 'library', 'npm']
date: '2021-07-13T12:00:00.000Z'
draft: false
image: ../teaser/react-component-npm-publishing.png
source: https://thicolares.com/2019/02/24/creating-a-react-package-and-publishing-it-on-npm-explained.html
---

리액트를 사용할 수 있는 독자를 대상으로 작성한 글입니다.

## 0. Intro

프로젝트를 진행하면서 이미 친숙한 리액트를 포함하여 다양한 라이브러리들을 npm 또는 yarn으로 설치해서 이용합니다. 그렇다면 이런 라이브러리들은 어떻게 만들어지는 걸까요. '간단하게' 알아보고자 합니다. '간단하게'라는 말을 붙인 이유는 다른 테스팅 작업을 제외했기 때문입니다. 필수적인 것은 아니지만, 라이브러리의 안정성을 위해 보통 배포하기 전에 스토리북이나 jest 등의 도구로 기본적인 테스팅 작업이 선행되는데, 이번 글에서는 테스팅과 관련된 부분은 생략하고 진행하겠습니다.

## Table of Contents

1. 깃허브 디렉토리 생성 및 CRA(Create React App) 설치
2. 컴포넌트 제작
3. 컴포넌트 패키징

## 1. CRA(Create React App) 설치 및 기본 환경 세팅

먼저 깃허브 디렉토리를 만들고 로컬로 `clone`을 실행합니다. 이후 간단하게 리액트 환경을 구성하기 위해서 CRA를 실행합니다. CRA는 바로 프로젝트를 시작할 수 있도록 기본적인 환경을 구성해주는 패키지입니다. CRA로 기본적인 환경을 구성하지만 이를 바탕으로 또 다른 패키지(또는 라이브러리)도 만들 수 있습니다. `npx create-react-app <파일명/디렉토리명>`

```shell
$ git clone https://github.com/jum0/jum0-react-library.git
$ cd jum0-react-library
$ npx create-react-app .

```

## 2. 컴포넌트 제작

CRA 설치 및 기본 환경 세팅을 통해 기본적인 환경 구성을 했습니다. 그러면 다음으로 컴포넌트를 제작하겠습니다. 컴포넌트는 간단하게 `JumoButton`라는 버튼을 하나 만들어보겠습니다.

```jsx
// src/components/JumoButton/JumoButton.js

import React from 'react';

const JumoButton = ({ children, backgroundColor, fontColor, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{ backgroundColor: `${backgroundColor}`, color: `${fontColor}` }}
    >
      {children}
    </button>
  );
};

export default JumoButton;
```

JumoButton 컴포넌트는 props로 텍스트를 자식으로 받고, 배경색, 글자색, 클릭 함수를 받도록 설계했습니다. 그러면 동작하는지 확인해보겠습니다.

```jsx
// src/App.js

import JumoButton from './components/JumoButton/JumoButton';

const App = () => (
  <JumoButton backgroundColor="blue" fontColor="white">
    테스트 버튼
  </JumoButton>
);

export default App;
```

로컬 서버에서 제작한 컴포넌트를 확인할 수 있습니다.

## 3. 컴포넌트 패키징

그럼 이제부터 제작한 컴포넌트를 라이브러리로 만드는 과정을 진행하겠습니다.
먼저, `components/index.js` 파일을 추가합니다. 이 파일은 우리가 만들 라이브러리의 시작점이 되는 동시에, 아까 만들었던 컴포넌트들을 export 할 위치입니다.

```javascript
//components/index.js

import JumoButton from './JumoButton/JumoButton';

export { JumoButton };
```

추가로 `Babel` 관련 몇 가지 패키지를 설치합니다. `Babel`을 통해서 컴포넌트를 컴파일하고, 그 결과물을 이후 `dist` 디렉토리에 복사하기 위함입니다. 설치는 애플리케이션이 빌드할 때만 필요하기 때문에 개발 의존성으로 설치합니다.

```shell
npm install cross-env @babel/cli @babel/preset-env @babel/preset-react --save-dev
```

그리고 설치한 패키지를 적용하기 위해서 `babel.config.js` 파일을 작성합니다. (`package.json`과 같은 레벨의 위치에 작성합니다)
<img width="201" alt="babel-config-directory" src="https://user-images.githubusercontent.com/40762111/125733462-80fe9ca9-670b-4abd-8b31-ffaf54d9275f.png">

```javascript
// babel.config.js

module.exports = function (api) {
  api.cache(true);

  const presets = ['@babel/preset-env', '@babel/preset-react'];
  const plugins = ['macros'];

  return {
    presets,
    plugins,
  };
};
```

추가로 이 라이브러리를 사용하는 앱은 리액트 라이브러리가 이미 설치되어 있을 가능성이 높으므로, 기존의 `dependencies`에 있는 패키지들을 `peerDependencies`로 이동시킵니다. 참고로 [peerDependencies](https://classic.yarnpkg.com/en/docs/dependency-types/#toc-peerdependencies)를 갖고 있다는 것은 어떤 사람이 자신 프로젝트에 당신의 패키지를 설치할 때, 완전히 똑같은 dependencies를 갖고 있다는 것을 의미합니다. 따라서 `react` 패키지와 함께 사용되는 `react-dom` 패키지에는 `react`가 `peerDependencies`로 설치되어 있는 것을 확인할 수 있습니다.

```json
// package.json

"peerDependencies": {
    "react": "^17.0.1",
    "react-dom": "^17.0.1",
    "react-scripts": "4.0.3",
    ...
}
```

이제 배포를 준비하기 위해 `package.json`에 다음과 같은 코드들을 넣어줍니다.

```json
//package.json

"main": "dist/index.js",
"private": false,
"files": [ "dist", "README.md" ],
"repository": {
    "type": "git",
    "url": "URL_OF_YOUR_REPOSITORY"
}

```

여기서 `main`은 이 프로그램의 시작점입니다. `files`는 `.gitignore` 파일과 비슷한 형태로 작동하는데, 역할은 반대로 압축될 때 `tarball(.tar)` 파일에 포함되도록 하는 기능을 합니다.

그리고 마지막으로 `Babel`을 통해서 컴포넌트를 컴파일하고, 그 결과물을 이후 `dist` 디렉토리에 복사하고, 기존의 `dist` 폴더의 내용을 지우는 컴파일 스크립트를 `package.json`에 추가합니다.

```json
//package.json

"clean": "rimraf dist",
"compile": "npm run clean && cross-env NODE_ENV=production babel src/components --out-dir dist --copy-files"
```

이제 차례대로 스크립트를 실행합니다.
먼저 패키지를 빌드합니다.

```shell
$ npm run compile
```

그리고 패키지를 라이브러리에 배포합니다.

```shell
$ npm publish
```

`npm publish`하면서 발생하는 오류는 `npm adduser`를 통해 npm 사이트에 회원 가입을 한 후, 이메일 인증을 하면 됩니다.

이제 라이브러리를 만들었으니깐 확인해봐야겠죠.
라이브러리를 해당 프로젝트에 추가합니다.

```shell
$ npm install jum0-react-library
```

`App.js`에서 해당 라이브러리를 불러와 컴포넌트를 사용합니다.

```jsx
// App.js

import { JumoButton } from 'jum0-react-library';

import React from 'react';

const App = () => (
  <JumoButton backgroundColor="green" fontColor="white">
    테스트 버튼
  </JumoButton>
);

export default App;
```

## 마침

라이브러리를 직접 만들어보았습니다. 라이브러리를 이제까지 사용만 했지, 직접 만든 것은 처음이었습니다. 이번 실습을 통해 팀이나 조직 간에 재사용 가능한 컴포넌트들은 라이브러리화하여 사용할 수도 있고, 유용하지만 복잡한 코드들을 직접 라이브러리로 만들어보면 도움이 될 것 같습니다.

## 참고

- https://fathomtech.io/blog/create-a-react-component-library-using-create-react-app
- https://docs.npmjs.com/cli/v7/configuring-npm/package-json#main
- https://docs.npmjs.com/cli/v7/configuring-npm/package-json#files
- https://classic.yarnpkg.com/en/docs/dependency-types
