---
layout: post
title: 'UseEffect 다양한 상황'
tags: ['react', 'hook']
author: [4기_밧드]
date: '2022-17-03T14:10:00.000Z'
draft: false
image: ../teaser/active-profile.png
---

# useEffect

> 컴포넌트 렌더링에 따른 이펙트를 수행하기 위해 사용하는 hook

<br />

### 형태

```tsx
useEffect(() => {
  // effect
  return; // clean-up
}, [dependencies]);
```

effect는 첫 번째 렌더링 또는 DOM을 업데이트한 이후에 실행할 함수를 말한다.

depedencies는 의존성 배열로서 배열의 요소 중 변한 값이 있다면 effect를 실행시킨다. 모든 렌더링에서 effect가 실행되지 않도록 방지할 수 있다. 선택적 인자로서 기입하지 않는 경우에는 매 렌더링마다 effect를 실행하게 된다.

clean-up은 정리를 위한 effect의 반환값으로 함수의 형태를 가진다. 리액트는 컴포넌트가 unmount 될 때, 해당 함수를 실행한다. effect는 한번이 아니라 렌더링이 실행되는 때마다 실행된다. React가 다음 차례의 effect를 실행하기 전에 이전의 렌더링에서 파생된 effect 또한 정리하는 이유가 바로 이 때문이다.

```tsx
function Component(props) {
  // ...
  useEffect(() => {
    // ...
    effect(props.id);
    return () => {
      cleanUp(props.id);
    };
  });
}
```

```tsx
// { id: 100 } state을 사용하여 마운트합니다.
effect(100); // 첫번째 effect가 작동합니다.

// { id: 200 } state로 업데이트합니다.
cleanUp(100); // 이전의 effect를 정리(clean-up)합니다.
effect(200); // 다음 effect가 작동합니다.

// { id: 300 } state로 업데이트합니다.
cleanUp(200); // 이전의 effect를 정리(clean-up)합니다.
effect(300); // 다음 effect가 작동합니다.

// 마운트를 해제합니다.
cleanUp(300); // 마지막 effect를 정리(clean-up)합니다.
```

이 방식은 이러한 방식으로 동작하는 것이 일관성을 유지해주며 클래스 컴포넌트에서는 흔히 업데이트 로직을 빼먹으면서 발생할 수 있는 버그를 예방한다.

<br />

### class 컴포넌트 생명주기 메서드에 비해 가지는 이점

1. 결합도를 높일 수 있다. class 컴포넌트에서는 마운트 되었을 때, 업데이트 되었을 때 같은 이펙트를 수행하고 싶다면 componentDidMount, componentDidUpdate 두개의 메서드를 사용해서 중복되는 로직을 넣어줘야 했다. componentWillUnmount에 들어가는 로직 또한 관계가 깊은 로직임에도 따로 정의해야한다. useEffect는 한 곳에 관련된 로직을 묶음으로써 관리를 용이하게 해준다.

2. useEffect로 전달된 effect 함수는 모든 렌더링에서 새로 실행된다. 이러한 방식은 각각의 effect를 특정한 렌더링 결과에 속하게 만든다. 이 방식은 class 컴포넌트를 사용했을 때 발생할 수 있는 버그를 해결해준다.

   만약 아래와 같이 class 컴포넌트로 작성한 코드가 있다고 했을 때 결과가 다르다. 아래 예제는 최초의 0의 값을 가지는 count를 3초 동안 5번 증가시켜서 리렌더링이 5번 일어났을 때 결과를 비교하면 다음과 같다.

   ```tsx
   // class component
   componentDidUpdate() {
     setTimeout(() => {
        console.log(`You clicked ${this.state.count} times`);
     }, 3000);
   }

   // 5 5 5 5 5

   ---

   // function component
   useEffect(() => {
     setTimeout(() => {
       console.log(`You clicked ${count} times`);
     }, 3000);
   });

   // 1 2 3 4 5
   ```

3. 관심사를 분리할 수 있다. class 생명주기 메서드에 관련없는 로직을 한 곳에 모아 놓는 문제가 있었다. useEffect를 사용해서 서로 관련없는 로직을 분리할 수 있다. 리액트는 사용된 모든 Effect를 지정된 순서에 맞춰서 적용한다.

   ```tsx
   componentDidMount() {
     document.title = `You clicked ${this.state.count} times`;
     ChatAPI.subscribeToFriendStatus(
       this.props.friend.id,
       this.handleStatusChange
     );
   }

   ---

   useEffect(() => {
     document.title = `You clicked ${count} times`;
   }, []);

   useEffect(() => {
   	ChatAPI.subscribeToFriendStatus(props.friend.id, handleStatusChange);
   }, []);
   ```

4. 브라우저가 화면을 업데이트하는 것을 blocking하지 않는다. 리액트는 브라우저가 paint를 하고 난 뒤에 effect를 실행시킨다. 이렇게 하면 effect의 실행이 화면의 업데이트를 막지 않기 때문에 앱을 더 빠르게 만들어준다.

   ![Untitled](https://blog.kakaocdn.net/dn/luWQt/btrECzPTg5b/0IRrUvwvxBWXXJXZmIu9Ek/img.png)

<br />

### useEffect 어떻게 사용하면 좋을까

- 리액트 컴포넌트에는 사이드 이펙트를 clean-up이 필요한 것과 필요하지 않은 것 2종류로 나눌 수 있다.
  clean-up이 필요하지 않은 것은 실행 이후 신경쓸 것이 없는 것들을 말한다. 예로 api 요청, DOM 조작, 로깅 등이 있다.
- 모든 렌더링 이후에 effect를 실행하거나, clean-up 하는 것은 성능 저하를 발생시킬 수 있다. useEffect에서는 이러한 문제를 해결하기 위해서 Effect를 건너띌 수 있는 기능을 제공한다. 두 번째 인수에 의존성 배열을 전달하여 배열의 요소 중 변한 값이 있다면 effect를 실행시킨다.
  의존성 배열을 추가할 때 주의점이 있다. 배열이 effect 내부에서 사용되는 값들을 모두 포함해야한다. 그렇지 않았을 경우에는 내부에서 사용하고있는 값이 변경되더라도 실행시킬 수 없다. 아래의 예제 코드는 `name` 을 내부에서 사용하고 있지만 업데이트 되더라도 `title` 을 변경시키지 못한다.

  ```tsx
  function Compoenent = () => {
  	const [name, setName] = useState("kim");

  	useEffect(() => {
  		document.title = 'Hello, ' + name;
  	}, [])
  }
  ```

  만약 일부의 값만 배열에 포함시키더라도 일부의 값이 변경될 때는 실행이되기 때문에 원하지 않는 사이드 이펙트를 줄 수 있다.

- 마운트와 마운트 해제 시에 한 번씩만 실행하고 싶다면, 빈 배열(`[]`)을 두 번째 인수로 넘기면 된다. 이렇게 함으로써 effect가 어떤 값에도 의존하지 않는 것을 알린다.

- 의존성 배열을 사용할 수 없는 상황이 있을 수 있다. 예를 들어 아래의 코드는 1초 간격으로 `count` 를 증가시키는 `setTimeout` 을 마운트시에 설정하는 로직이다.

  ```tsx
  function Counter() {
    const [count, setCount] = useState(0);

    useEffect(() => {
      const id = setInterval(() => {
        setCount(count + 1);
      }, 1000);
      return () => clearInterval(id);
    }, []); // `count`가 종속성으로 지정되지 않음

    return <h1>{count}</h1>;
  }
  ```

  count값이 0인 클로저가 생성되었고, count를 의존성 배열로 추가하지 않았기 때문에 콜백은 1초마다 `setCount( 0 + 1 )` 을 실행시킨다. 하지만 그렇다고 count를 의존성 배열에 추가하면 count가 변경될 때마다 시간이 재설정된다. 이와 같은 경우는 의존성 배열을 사용하기 보단 `setCount(prevCount => prevCount + 1)` 와 같이 업데이트 폼을 사용한다.

- 함수를 의존성에 포함시키기. 아래의 코드는 컴포넌트가 커지면서 모든 경우를 다루고 있는지 보장하기 힘들다는 문제가 있다.

  ```tsx
  function SearchResults() {
    const [data, setData] = useState({ hits: [] });
  	const [query, setQuery] = useState('react')

    async function fetchData() {
      const result = await axios(
        `https://hn.algolia.com/api/v1/search?query=${query}`,
      );
      setData(result.data);
    }

    useEffect(() => {
      fetchData();
    }, []); // 이거 괜찮은가?
    // ...
  ```

  이 문제를 해결하기 위해서 useEffect 내부에 함수를 정의하는 방법이 있다. 어떠한 함수를 이펙트 안에서만 쓴다면, 그 함수를 직접 이펙트 안으로 옮긴다

  ```tsx
  function SearchResults() {
    const [query, setQuery] = useState('react');

    useEffect(() => {
      function getFetchUrl() {
        return 'https://hn.algolia.com/api/v1/search?query=' + query;
      }

      async function fetchData() {
        const result = await axios(getFetchUrl());
        setData(result.data);
      }

      fetchData();
    }, [query]);
    // ...
  }
  ```

  위 방식을 사용하면 useEffect 내부에서 사용하는 모든 값을 넣을 수 있다. 나중에 `getFetchUrl`을 수정하고 `query`state를 써야한다고 하면, 이펙트 안에 있는 \*\*함수만 고치면 된다는 것을 쉽게 발견할 수 있다.

<br />

### 참고 자료

[https://overreacted.io/ko/a-complete-guide-to-useeffect/#tldr-too-long-didnt-read---요약](https://overreacted.io/ko/a-complete-guide-to-useeffect/#tldr-too-long-didnt-read---%EC%9A%94%EC%95%BD)

[https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies](https://reactjs.org/docs/hooks-faq.html#is-it-safe-to-omit-functions-from-the-list-of-dependencies)
