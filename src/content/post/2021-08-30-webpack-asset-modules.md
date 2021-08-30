---
layout: post
title: '웹팩 Asset Modules'
author: [3기_주모]
tags: ['webpack']
date: '2021-08-30T12:00:00.000Z'
draft: false
image: '../teaser/webpack-asset-modules.png'
---

이 글은 webpack에 대한 기본적인 이해가 필요한 글입니다.

---

웹 애플리케이션을 제작하면서 HTML, CSS, JS와 더불어 아이콘, 사진, 비디오 등 다양한 Asset을 추가하게 된다. Asset Modules은 로더를 추가하지 않아도 이러한 asset 파일들을 사용할 수 있도록 도와주는 모듈이다. 쉽게 말해서 Asset Modules는 Asset 파일들을 처리하는 방식들을 모아놓은 모듈이고, 정의하는 방식에 따라 브라우저가 한 번에 다운로드하는 파일의 개수, 파일의 용량을 결정한다.

Asset Modules의 종류로는 총 4가지, `asset/resource`, `asset/inline`, `asset/source`, `asset`이 있다.

## 목차

- asset/resource
- asset/inline
- asset/source
- asset

## asset/resource

`asset/resource` 모듈은 별도의 파일로 내보내고 URL을 추출한다. 다시 말해서 빌드 후 asset 파일을 출력 디렉터리로 내보내고, 해당 경로를 번들에 추가한다. (webpack 5 이전에는 `file-loader`가 해당 역할을 했다)

파일을 출력 디렉터리로 내보낼 때 `asset/resource` 모듈은 기본적으로 `[hash][ext][query]` 파일명을 사용하는데, `assetModuleFilename: 'static(예시)/[name][ext]` 옵션을 이용하면 출력 디렉터리 안에 폴더`static` 폴더를 생성하고 그 안에 기존 파일 이름과 동일한 이름으로 asset 파일을 내보낼 수 있다. `Rule.generator.filename`은 `assetModuleFilename`의 기능과 동일하지만, `asset/resource`와 `asset` 모듈에서만 동작한다.

```javascript
// webpack.config.js

// 빌드 후 생기는 폴더 안에 images라는 폴더를 만들고 그 안에 기존 에셋 파일 이름과 동일한 이름으로 파일을 내보낸다

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    assetModuleFilename: 'images/[name][ext]',
  },
  module: {
    rules: [
      {
        test: /\.png/,
        type: 'asset/resource',
      },
      {
        test: /\.jpg/,
        type: 'asset.resource',
        generator: {
          filename: 'static/[name][ext]',
        },
      },
    ],
  },
};
```

```javascript
// src/index.js

import mainImage from './assets/main.png';
import subMainImage from './assets/subMain.jpg';

img1.src = mainImage;
img2.src = subMainImage;
```

`.png` 파일은 `asset/resource` 모듈의 사용과 `assetModuleFilename: 'images/[name][ext]'`의 설정으로 출력 디렉터리(`dist`) 안 새로운 폴더(`images`)에 별도의 파일로 생성된다. 또한, 파일의 이름은 기존의 이름 그대로 생성된다. `.jpg` 파일은 `asset/resource` 모듈의 사용과 `Rule.generator.filename: 'static/[name][ext]`의 설정으로 출력 디렉터리(`dist`) 안 새로운 폴더(`static`)에 기존의 이름 그대로의 파일이 생성된다.

```shell
// 출력 파일의 폴더 구조

dist
├── main.js
├── images
│   └── main.png
└── static
    └── subMain.jpg
```

## asset/inline

`asset/inline` 모듈은 asset의 data URI를 내보낸다. 즉, 파일이 data URI 형식으로 번들에 삽입된다. (webpack 5 이전에는 `url-loader`가 해당 역할을 했다)

```javascript
// webpack.config.js

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.svg/,
        type: 'asset/inline',
      },
    ],
  },
};
```

```javascript
// src/index.js

import metroMap from './images/metro.svg';

block.style.background = `url(${metroMap})`; //  build 후 번들에 삽입되는 형태 - url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDo...vc3ZnPgo=)
```

모든 `.svg` 파일은 data URI 형태로 번들(`main.js`)에 삽입된다.

### Custom data URI generator

기본적으로 data URI는 Base64 알고리즘을 사용하여 인코딩 된 파일 콘텐츠를 의미하는데, 파일 인코딩을 위한 커스텀 함수를 지정하여 [mini-svg-data-uri](https://github.com/tigt/mini-svg-data-uri)와 같은 커스텀 인코딩 알고리즘도 사용할 수 있다.

> Base64: 화면에 표시되는 ASCII 문자들만 사용하여 일련의 문자열로 바꾸는 인코딩 방식

```javascript
// webpack.config.js

const path = require('path');
+ const svgToMiniDataURI = require('mini-svg-data-uri');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.svg/,
        type: 'asset/inline',
+       generator: {
+         dataUrl: content => {
+           content = content.toString();
+           return svgToMiniDataURI(content);
+         }
+       }
      }
    ]
  },
};
```

## asset/source

`asset/source` 모듈은 asset의 소스 코드를 그대로 내보낸다. (webpack 5 이전에는 `raw-loader`가 해당 역할을 했다)

```javascript
// webpack.config.js

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.txt/,
        type: 'asset/source',
      },
    ],
  },
};
```

```javascript
// src/example.txt

Hello Webpack
```

```javascript
// src/index.js

import exampleText from './example.txt';

block.textContent = exampleText; // 'Hello world'
```

모든 `.txt` 파일은 있는 그대로(여기서는 텍스트의 형태로) 번들(`main.js`)에 삽입된다.

### asset

이 모듈은 기본 조건에 따라서 `resource`와 `inline` 모듈 중에서 자동으로 선택한다. 용량 크기가 `8KB(default)` 보다 작으면 `inline` 모듈로 처리되고(번들에 삽입), 그렇지 않으면 `resource` 모듈로 처리된다.(별도의 파일로 분리) (webpack 5 이전에는 `url-loader`가 해당 역할을 했다)

[Rule.paser.dataUrlCondition.maxSize](https://webpack.kr/configuration/module/#ruleparserdataurlcondition) 옵션을 설정해서 용량 조건을 변경할 수 있다.

```javascript
// webpack.config.js

const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.txt/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 4 * 1024, // 기준으로 4kb 로 변경
          },
        },
      },
    ],
  },
};
```

참조

- [webpack - Asset Modules](https://webpack.kr/guides/asset-modules/)
- [webpack 5 - Asset Modules / 공식 문서 링크 블로그](https://dev.to/smelukov/webpack-5-asset-modules-2o3h)
