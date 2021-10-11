---
layout: post
title: 리액트 쿼리로 에러처리하기
author: [3기_미키]
tags: ['error-handling', 'react-query']
date: '2021-10-04T12:00:00.000Z'
draft: false
image: '../teaser/react-query-error-handling.jpg'
---

현재 팀 프로젝트를 진행하고 있는 놀토 팀에서는 `리액트 쿼리 + 에러 바운더리`를 통해서 에러 처리를 하고 있다. 에러 처리를 하면서 겪었던 어려움이 머리 속에 정리가 잘 안돼있다고 느껴서 글을 작성하게 되었다.

같은 환경으로 에러 처리를 구현하려고 한다면 글이 참고가 될 것이다.

## 알면 좋은 용어

### QueryCache

react query의 저장소 메커니즘. react query의 모든 데이터를 저장한다.
일반적으로 개발자가 직접 QueryCache에 접근할 일은 거의 없고 특정 cache에 접근하기 위해서는 QueryClient를 사용한다.

### Observer

리액트 쿼리에서 하나의 캐시 entry를 감시하는 객체를 의미한다. 캐시 entry의 무언가가 변경되면 Observer가 알 수 있다.

Observer를 생성하기 가장 쉬운 방법은 `useQuery()` 함수를 호출하는 것이다.

useQuery() 함수를 사용하는 컴포넌트가 리렌더링 될 때마다 useQuery()를 호출하기 때문에 매번 새로운 Observer를 생성한다.
즉, **여러번 리렌더링되면 하나의 캐시 entry에 대해 여러 개의 Observer를 가질 수 있다.**

## 개요

리액트 쿼리로 에러 처리를 할 때 가장 먼저 발견하게 되는 것은 useQuery의 `onError` 옵션이다. onError 옵션으로 에러 핸들러를 넘겨 리액트 쿼리가 처리하도록 하는 것이다.

그러나 onError가 처음에는 잘 동작하는 것처럼 보일지도 모르지만, 곧 이상함을 느끼게 된다. **하나의 네트워크 요청에 대한 오류가 발생했을 뿐인데 onError로 등록한 에러 핸들러가 여러 번 호출**되는 현상이 발생한다.

오늘은 필자가 겪었던 문제와 해결 방법을 같이 따라가면서 상황에 따라 어떤 에러 처리 방식이 적절한지 알아보자.

## 1. 리액트 쿼리의 onError 활용하기

네트워크 요청에 대한 응답을 받아와 캐시에 저장하는 `useQuery()`에는 onError 옵션이 있다. 이 옵션으로 에러 핸들러를 넘기면 네트워크 요청이 실패했을 때 자동으로 콜백을 실행 시켜준다.

```js
const getRecentFeeds = async () => {
  const { data } = await axios.get('/feeds/recent');

  return data;
};

const { data } = useQuery('recentFeeds', getRecentFeeds, {
  onError: () => {
    console.error('에러 발생했지롱');
  },
});
```

위처럼 코드를 작성하면 에러가 발생했을 때 onError에 등록된 에러 핸들러가 자동으로 실행된다.

### 문제점

onError를 사용하면 에러 처리가 끝난 것인가?
사실 **onError로 에러 처리를 하면 의도대로 동작하지 않는 경우가 많다.**

예를 들어 useQuery()를 사용하는 RecentFeedsContent 컴포넌트가 있다고 생각해보자. 처음 useQuery 훅을 사용하게 되면 어떤 요청을 보내고 pending 상태가 될 것이다. 이 상태에서 상위 컴포넌트에 의해 RecentFeedsContent가 4번 리렌더링 된다면 해당 useQuery 요청이 실패했을 때 onError 콜백은 4번 호출된다.
스낵바로 사용자에게 알리는 콜백 코드를 작성했다면 스낵바가 4번 동작하는 것이다.

### 원인

에러 콜백 호출 횟수가 컴포넌트의 리렌더링 횟수를 따라가는 이유는 무엇일까?

그 이유는 useQuery()가 호출될 때마다 리액트 쿼리는 새로운 `Observer`를 만들고 onError는 Observer level에서 동작하기 때문이다.

## 2. useEffect 활용하기

앞서 onError의 문제점을 살펴봤다. 그럼 이 문제를 어떻게 해결할 수 있을까?

아주 간단한 방법으로 useEffect를 사용하는 방법이 있다. useQuery를 훅으로 감싸고, 훅 내에서 useQuery의 isError가 true로 변하는 시점에만 에러 핸들러를 호출하는 것이다.

예를 들면 다음과 같은 방식이다.

```js
//useRecentFeeds.ts
export default function useRecentFeeds(
  errorHandler: () => void,
) {
  const query = useQuery<Feed[], Error>('recentFeeds', getRecentFeeds);

  useEffect(() => {
    if (query.isError) {
      errorHandler();
    }
  }, [query.isError]);

  return query;
}

//RecentFeedsContent.tsx
const RecentFeedsContent = () => {
  const {data: recentFeeds} = useRecentFeeds(() => {
    console.error('이제 한 번만 에러 핸들러 실행!!');
  });

  ...
```

이렇게 구현하면 query.isError가 true로 변할 때만 에러 핸들러가 실행된다.

### 문제점

대부분은 useEffect를 사용하면 문제가 해결될 것이다. 에러 처리 끝....! 이라고 하고 싶었으나 아직 문제가 남았다. **만약 `에러 바운더리`를 사용하고 있다면 문제가 생길 것이다.**

예를 들면 다음과 같은 상황이다.

```js
export default function useRecentFeeds(
  errorHandler: () => void,
) {
  const query = useQuery<Feed[], Error>('recentFeeds', getRecentFeeds, {
    useErrorBoundary: true,
    // 에러 바운더리 사용, 쿼리 훅마다 설정도 가능하지만
    // QueryClient를 이용해서 전역적으로 설정도 가능하다.
  });
  // ----- 여기부터는 실행되지 않는다. -----
  useEffect(() => {
    if (query.isError) {
      errorHandler();
    }
  }, [query.isError]);

  return query;
}
```

에러 바운더리를 사용하면 useQuery() 함수까지만 실행되고 이후에 작성된 useEffect 함수는 실행되지 않는다. **당연히 에러 핸들러도 실행되지 않는다.**

### 원인

그 이유는 에러 바운더리를 사용한다는 의미가 에러가 발생했을 때 외부로 에러를 그대로 전파하고, 외부의 에러 바운더리 컴포넌트가 이것을 처리하겠다는 의미이기 때문이다.

그래서 useQuery() 함수에서 에러를 throw하므로 useQuery 이후에 오는 모든 코드는 평가되지 않는다.

## 3. 커스텀 에러 클래스 정의하기

우리 팀은 이 문제를 커스텀 에러 클래스를 정의함으로써 해결했다. 커스텀 에러 인스턴스를 생성할 때 에러 핸들러를 등록하고, 에러 바운더리에서 핸들러를 실행하도록 한 것이다. 이런 방식을 사용하면 컴포넌트 level에서 에러 핸들러를 정의할 수 있으면서 핸들러도 단 한 번만 실행된다.

예를 들면 다음과 같은 방식이다.

### 1️⃣ 커스텀 에러 클래스 정의

```js
// CustomError.ts
export default class CustomError extends Error {
  name: string;
  errorHandler: ErrorHandler;

  constructor(message?: string, errorHandler?: ErrorHandler) {
    super(message);
    this.name = new.target.name;
    // new 연산자로 호출된 생성자의 이름
    this.errorHandler = errorHandler;
  }

  executeErrorHandler() {
    if (this.errorHandler) {
      this.errorHandler(this);
      // 에러 핸들러는 핸들링 대상 에러를 핸들러로 받음.
    }
  }
}
```

에러 인스턴스를 생성할 때 에러 핸들러도 같이 등록할 수 있게 하였다. 등록된 에러 핸들러는 이후에 에러 바운더리 컴포넌트가 `executeErrorHandler()`메서드를 호출함으로써 처리될 것이다.

### 2️⃣ useQuery 커스텀 훅 수정

```js
const getRecentFeeds = async (errorHandler: () => void) => {
  try {
    const { data } = await axios.get('/feeds/recent');

    return data;
  } catch(error) {
    throw new CustomError("recent 피드에서 에러발생!", errorHandler);
    // 여기서 throw된 에러는 에러 바운더리 컴포넌트까지 전파됨
  }
};

export default function useRecentFeeds(
  errorHandler: () => void,
) {
  return useQuery<Feed[], CustomError>('recentFeeds', () => getRecentFeeds(errorHandler), // 인자로 errorHandler를 전달.
  {
    useErrorBoundary: true,
  });
}
```

생략된 부분이 많지만 가장 중요한 코드만을 담았다. axios에서 throw된 에러를 잡아 커스텀 에러로 재가공해서 외부로 전파하였다.

### 3️⃣ 에러 바운더리에서 커스텀 에러 처리

```js
export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Error Boundary:', error, errorInfo);

    if (error instanceof CustomError) {
      error.executeErrorHandler(); // 1번 과정에서 커스텀 에러 클래스에 정의했던 에러 핸들러를 실행
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
```

CustomError 인스턴스를 생성할 때 넣어준 에러 핸들러를 에러 바운더리에서 처리해준다.
에러 바운더리가 에러를 처리하게 되면 바운더리가 감싸고 있는 컴포넌트들을 errorFallback 컴포넌트로 대체하므로 에러 핸들러는 무조건 한 번만 실행된다.

### 4️⃣ 최종 결과

```js
//App.tsx
const App = () => {
  return (
    <ErrorBoundary fallback={<div>에러났어요~~</div>}>
      <RecentFeedsContent />
    </ErrorBoundary>
  );
};

//RecentFeedsContent.tsx
const RecentFeedsContent = () => {
  const { data: recentFeeds } = useRecentFeeds(() => {
    console.error('에러 처리 완료 with 에러 바운더리');
  });

  ...
```

이제 에러 바운더리를 사용하면서도 에러 핸들러가 한 번만 실행되는 구조가 만들어졌다.
조금 구현이 복잡해 보이지만 사용하는 입장에서는 위와 같이 간단하므로 큰 문제가 없을 것으로 보인다.

이렇게 구현하니 다음과 같은 장점을 느낄 수 있었다.

- useQuery 커스텀 훅을 사용하는 컴포넌트에서 에러 핸들러를 정의할 수 있어 자유도가 높다.
  같은 커스텀 훅을 사용하더라도 컴포넌트마다 다른 에러 처리 방법을 사용할 수 있다.
- 에러 바운더리의 선언적 에러 처리라는 이점을 그대로 가져갈 수 있다.

## 마무리

오늘은 리액트 쿼리로 에러 처리할 때 만나볼 수 있는 문제점을 같이 들여다봤다.
무조건 에러 처리를 커스텀 에러 클래스를 정의해서 처리할 필요는 없고, 상황에 따라 적절한 방법을 사용하면 된다.

우리 놀토 팀은 Observer 관련 문제인지도 몰랐고 리액트 쿼리와 에러 바운더리를 같이 사용하고 있었기 때문에 굉장히 고통받았는데
혹시 우리와 같은 문제를 겪고 있다면 좋은 길잡이가 되었기를 바라면서 글을 맺는다.

## Thanks to

- [React Query Error Handling](https://tkdodo.eu/blog/react-query-error-handling#the-onerror-callback)
- 고통받았던 놀토 팀원([zigsong](https://github.com/zigsong), [0307kwon](https://github.com/0307kwon))
