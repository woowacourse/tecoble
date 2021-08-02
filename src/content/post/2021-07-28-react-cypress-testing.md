---
layout: post
title: 'Cypress를 활용한 React 테스팅'
author: [3기_주모]
tags: ['react', 'cypress', 'test']
date: '2021-07-28T12:00:00.000Z'
draft: false
image: ../teaser/cypress.png
source: https://www.cypress.io/
---

cypress에 대한 기본적인 이해가 필요한 글입니다.

---

## 0.Intro

바닐라 자바스크립트에서 cypress를 통해 테스트를 진행한 경험은 있지만, react에서는 아직 적용해보지 못했다. 이번에 프로젝트를 진행하면서 테스팅 도구를 고민하다가 cypress를 선택하게 되었는데, 초기 설정부터 stub response(mock)를 활용한 간단한 network request까지 알아보겠다.

## Table of Contents

1. Cypress 패키지 추가 및 초기 환경 설정
2. Stub Response를 활용한 간단한 Network Request 예제

## 1. Cypress 패키지 추가 및 초기 환경 설정

먼저 관련 패키지들을 추가한다.

```shell
// shell

yarn add -D cypress eslint-plugin-cypress cypress-react-selector
```

> [eslint-plugin-cypress](https://github.com/cypress-io/eslint-plugin-cypress): cypress 테스트 파일 내에서 eslint를 적용하기 위한 패키지

> [cypress-react-selector](https://github.com/abhinaba-ghosh/cypress-react-selector): cypress에서 get과 같은 메서드를 이용하지 않고 react component를 바로 불러올 수 있는 패키지

먼저 `eslint-plugin-cypress`를 적용하기 위해서 `.eslintrc` 파일로 가서, `"extends"`에 `"plugin:cypress/recommended"`를 추가한다.

```json
//.eslintrc

{
  "plugins": ["prettier"],
  "extends": [
    ...

    "plugin:cypress/recommended"
  ],
  ...
}
```

이제 `cypress-react-selector`를 적용하기 위해 cypress의 패키지 추가로 자동 생성된 `cypress/support/index.js` 파일로 가서 `import 'cypress-react-selector'`를 추가한다.

```javascript
// cypress/support/index.js

import './commands';
import 'cypress-react-selector';
```

`support` 폴더 내 `index.js` 파일에 대해서 잠깐 설명하자면, 이 파일은 모든 `spec file(테스트 파일)`이 실행되기 전에 먼저 실행된다.

예를 들어, `index.js` 파일에 다음과 같은 코드를 작성하면 cypress 내장 메서드인 `before`의 규칙에 따라 모든 `spec file` 이 실행되기 전에 각각 한 번 씩 실행된다.

```javascript
before(() => {
  cy.log('여긴 cypress/support/index.js');
});
```

참고로 `cypress/support/index.js` 파일에서 `before` 혹은 `beforeEach`를 만들고 그 안에 `console`을 찍었을 때는 cypress web ui에 표시되는데, 각각의 테스트 파일(`\*. spec.js`)의 `before` 혹은 `beforeEach`를 만들고 그 안에 `console`을 찍었을 때는 실제 개발자 도구 콘솔에서 표시된다.

마지막으로 `root` 폴더에 있는 `cypress.json` 파일에서 다음과 같은 속성을 추가한다.

```json
// cypress.json

{
  // "baseUrl": "http://localhost:9000",
  // "integrationFolder": "cypress/pages",
  "env": {
    "cypress-react-selector": {
      "root": "#root"
    }
  }
}
```

`"root": "#root"` 속성은 cypress에서 해당 라이브러리를 사용하는 테스트 코드를 작성하면서 이용되는데, 리액트 컴포넌트 트리가 로드되는 것을 확인하기 위해서 `waitForReact`라는 메서드를 사용하는 과정에서 `cy.waitForReact(1000, '#root')`와 같은 코드를 `cy.waitForReact()`로 간단하게 작성할 수 있도록 도와준다.

나머지 주석 처리된 부분을 설명하자면, `"baseUrl"`은 각각 테스트 파일마다 `cy.visit(http://localhost:9000")`을 생략하기 위해서 사용했다(이 속성을 사용해도 각 테스트 파일에서 `cy.visit('')`는 써야 한다). 또한, `"integrationFolder"` 속성은 cypress가 통합 테스트 폴더의 path를 지정하는 속성인데 현재 프로젝트에서 page 컴포넌트만 테스트하기 위해서 cypress 폴더 내에 `pages`라는 폴더를 만들어 path를 지정했다(default는 `cypress/integration`). 다른 속성들은 [공식 문서](https://docs.cypress.io/guides/references/configuration)에서 확인할 수 있다.

이제 본격적으로 테스트 코드를 작성해보자.

## 2. Stub Response를 활용한 간단한 Network Request 예제

Cypress의 Stubbing 기능을 활용해서 Network Request를 테스트할 수 있다.

이번 예제에서 실제 url로 요청하고, 미리 작성된 dataset을 통해 응답을 받은 후, 앞서 추가했던 라이브러리인 `cypress-react-selector`로 컴포넌트를 확인하는 방법에 대해서 알아보겠다.

그럼 코드에서 알아보자.

```javascript
describe('Before Login Test', () => {
  const getReviewList = () => {
    cy.intercept('GET', `${BASE_URL}/posts`, { fixture: 'reviewList' }).as('requestReviewData');
  };

  before(() => {
    getReviewList();

    cy.visit('');
    cy.wait('@requestReviewData');
  });

  it('홈페이지에 접속하여 접종 현황을 본다.', () => {
    cy.waitForReact();
    cy.react('VaccinationState', { props: { title: '접종 현황' }, exact: true }).contains(
      '접종 현황',
    );
  });
}
```

다음 코드는 프로젝트의 테스트 코드 중 일부이다.

먼저 HTTP 요청의 행동을 제어하기 위해서 `cy.intercept()` 문법이 사용되었다. `intercept()` 함수는 실제 api를 호출하는 spying, 미리 만들어놓은 데이터로 응답을 반환하는 stubbing, 요청이나 응답을 변경하여 수행할 수 있는 modification을 제공한다. intercept와 관련된 자세한 내용은 [공식 문서](https://docs.cypress.io/api/commands/intercept)에서 확인할 수 있다.

돌아가서 위 코드의 `Line 4`에서는 spying과 stubbing을 진행하고 있는데, 여기서 `fixture`라는 것을 볼 수 있다. `fixture`는 쉽게 말해서 미리 만들어놓은 dataset이다. `fixture`은 테스트 환경과 api 요청에 따라 일정한 데이터를 응답할 수 있도록 제어하는 역할을 하는데, 데이터는 `json` 뿐만 아니라 다른 형식들도 가능하다([참조](https://docs.cypress.io/api/commands/fixture#JSON)). 기본적으로 `cypress/features` 폴더 안에 dataset 파일을 넣으면 되고, 파일의 이름을 코드에 적어주면 된다. 부가적으로 뒤에 `as`는 `fixture` 파일의 별칭이다.

`fixture` 파일까지 준비되었다면, 바로 코드를 확인해보자. 필자는 테스트 케이스가 실행되기 전에 `before()` 함수 안에 몇 가지 코드를 적어놓았는데, 이는 테스트 케이스를 나타내는 `it()` 안에 넣어도 전혀 문제없다. 코드를 살펴보면 먼저 `intercept()` 메서드를 호출하는 함수를 호출했다. 이후 `wait()`이라는 메서드를 볼 수 있는데, 이는 응답을 stubbing 하는 것과 상관없이, cypress 내에서 요청과 응답을 기다리기 위해서 선언적으로 쓰인다. 현재 코드에서 `cy.wait('@requestReviewData')`로 쓰여 있는데, 이 의미는 `requestReviewData`의 요청에 대한 응답이 오기 전까지 기다리는 것을 의미한다.

이제 `it` 테스트 케이스를 확인해보면, `cy.waitForReact()`라는 메서드를 볼 수 있다. 이 메서드는 이전에 추가했던 `cypress-react-selector` 라이브러리와 관계있는데, 리액트 컴포넌트가 로드되기 전까지 기다리는 메서드이다. 위에서 보았던 `cy.wait('@requestReviewData')`와 비슷한 역할을 한다고 보면 된다. 이후 컴포넌트를 불러와 확인하고자 하는 작업을 진행하면 된다. `cypress-react-selector` 메서드와 관련된 자세한 내용은 깃허브에서 확인할 수 있다.

## 참고

- https://docs.cypress.io/guides/core-concepts/writing-and-organizing-tests#Folder-structure
- https://docs.cypress.io/guides/references/configuration
- https://docs.cypress.io/api/commands/intercept#Syntax
- https://docs.cypress.io/api/commands/fixture#JSON
- https://github.com/abhinaba-ghosh/cypress-react-selector
