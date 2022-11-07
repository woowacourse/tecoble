---
layout: post
title: '공식 팀에서의 에러 헨들링'
author: [4기_자스민]
tags: ['React', 'ErrorHandling']
date: '2022-09-30T12:00:00.000Z'
draft: false
image: ../teaser/error-handling.png
---

# 현재 팀에서의 에러 핸들링

공식에서 비동기 통신에 대하여 제대로 된 에러 관리 방식이 없어서 잡지 못하는 에러도 많았고, 컴포넌트내에 에러 로직이 무더기로 있는 경우가 있었다.
그래서 지금부터 공식팀이 에러를 처리한 방식에 대해서 알아볼 것이다!

## 일반적인 에러 처리 방식들

먼저 일반적으로 하는 에러처리 방식에 대해서 조사해보았다.

- try / catch
- ErrorBoundary
- react query에서의 onError
  이렇게 크게 3가지 방식으로 처리를 많이하는데 이번에는 **ErrorBoundary**를 이용하여 에러를 처리하기로 하였습니다.

  [에러 바운더리 공식문서](https://ko.reactjs.org/docs/error-boundaries.html)

  > **왜 ErrorBoundary를 이용했는가?**
  > ErrorBoundary를 이용할시 **선언적**으로 에러를 처리할수 있다는 장점이 있습니다. try / catch방식을 이용하면 컴포넌트내에 내가 실패했을때 어떤 처리를 할지 남아있게 됩니다. 이렇게 되면 화면을 렌더하는게 주 목적인 컴포넌트가 에러에 대한 처리까지 가지게 됩니다. <br><br> Errorboundary를 이용하게 되면 에러에 대한 로직을 부모에 위임할수 있으므로 컴포넌트내에서는 성공했을 때만을 신경쓰면 됩니다.

## 커스텀 에러 코드

현재 공식에서는 프로젝트에서 커스텀 에러 코드를 이용하여 에러를 구분하고 처리하고 있습니다.
| 에러 번호 | 설명 | 메시지 |
| --- | --- | --- |
| 0000 | 예상하지 못한 서버 예외가 발생할 때 | 알 수 없는 에러가 발생했습니다. |
| 0001 | 요청 데이터가 잘못된 경우 | 요청 데이터가 잘못되었습니다. |
| 1001 | 깃허브에서 응답받은 토큰이 null일 때 | Github API에서 Accesstoken을 받는것에 실패했습니다. |
| 1002 | 깃허브에서 유저 정보를 불러오는 것에 실패할 경우 | Github API에서 사용자 정보를 받는 것에 실패했습니다. |
| 1003 | 프론트에서 요청하는 토큰이 null일 때 | 토큰이 존재하지 않습니다. |
| 1004 | 토큰 타입이 잘못되었을 때 | 토큰 타입이 올바르지 않습니다. |
| 1005 | 유효하지 않은 토큰일 때 | accessToken 이 유효하지 않습니다. |
| 1006 | http servlet request가 null일 때, | 인증할 수 있는 사용자 데이터가 없습니다. |
| 1007 | 권한이 없는 경우 : 작성자가 아닐 때 (수정, 삭제) | 작성자가 아니므로 권한이 없습니다. |
| 1008 | 권한이 없는 경우 : 회원이 아닐 때 (수정, 삭제) | 회원이 아니므로 권한이 없습니다. |
| 1009 | 리프레시 토큰이 유효하지 않을 때 | 리프레시 토큰이 유효하지 않습니다. |
| 1010 | 유효한 액세스 토큰으로 리프레시 토큰을 발급받을 수 없다. | "유효한 액세스 토큰으로 리프레시 토큰을 발급할 수 없습니다." |
| 1011 | 리프레시 토큰을 요청할 때, 액세스 토큰이 유효하지 않는 경우 | 권한이 없는 유저입니다. 재로그인을 해주세요 |
| ... | ... | ... |
| 5009 | 투표 항목수가 2보다 작거나 5보다 클 때 | 투표 항목 수는 2이상 5이하여야 합니다. |
| 6001 | 해시태그 이름이 비었을 때 | 해시태그 이름은 비어있을 수 없습니다. |
| 6002 | 해시태그 이름이 2자 미만이거나 20자 초과일 때 | 해시태그 이름은 2자 이상 20자 이하입니다. |
| 6003 | 해시태그 이름이 중복될 때(대소문자 구분x) | 해시태그 이름은 중복될 수 없습니다. |
| 6004 | 한 게시글당 태그가 5개 초과일 때 | 해시태그는 한 게시글 당 최대 5개입니다. |
이렇게 커스텀 에러코드에 따라서 어떤 로직을 실행할지 어떤 ui를 보여줄지를 유연하게 설정할 수 있습니다.

## 프로젝트에서 발생할수 있는 에러의 종류

- 서버문제로 인한 500번대 에러
- 런타임 환경에서의 에러
- 일반적인 API요청에 대한 에러
- 네트워크 문제로 인한 에러<br />
  현재 공식에서 발생할 수 있는 에러는 다음 4개로 나누어 보았습니다.
  공식에서는 react-query를 이용하기에 error.response.data에서 에러를 잡을수 있습니다.
  그래서 발생할수 있는 4가지 상황에서 다음과 같이 잡을 수 있도록 처리하였습니다.
- 서버문제로 인한 500번대 에러
  > error.response.data.errorCode === ‘0000’ → 서버 에러 화면을 보여준다.
- 런타임 환경에서의 에러
  > 타입스크립트를 이용해서 컴파일 환경에서 최대한 잡아주었다. → 잡지못한 에러(error.response === undefined)는 개발자가 알 수 있도록 에러를 던져줌
- 일반적인 API요청에 대한 에러
  > error.response.data.errorCode → 에러코드에 따라 로직을 수행하거나 대체 화면을 보여준다.
- 네트워크 문제로 인한 에러
  > error.response.data === undefined → 다시 '0000' 커스텀 에러를 던져서 서버 에러 화면을 보여준다.

<br>

## 그래서 어떻게 에러를 처리했을까?

에러를 처리하는 방식으로는 `ErrorBoundary`를 에러를 구분할 수 있는 것은 `커스텀 에러코드`로 마지막으로 `어디서 에러가 발생할 수 있는지`까지 조사하였습니다.
그렇다면 어떻게 깔끔하게 여러 군데에서 발생하는 에러를 잡아줄 수 있을까?

공식에서는 `ErrorBoundary`를 이용한 **중앙집중식 에러핸들링**을 시도하였습니다.
Error의 특징인 버블링되어 올라간다는 것을 이용하여 여러 컴포넌트에서 발생하는 에러들을 하나의 `전역` 공간에서 처리해주었습니다.
![](https://velog.velcdn.com/images/baby_dev/post/ec60e69c-7573-4313-947e-a93ee08941b3/image.png)
여기서 하나의 에러바운더리에서 모두 처리하는 것이 아니라 관심사의 분리를 위하여 2개의 ErrorBoundary로 나누었습니다.
에러가 발생할 시 대체화면을 보여주는 `FallbackErrorBoundary`, 화면을 바꾸지 않고 특정 로직을 수행하는 `LogicErrorBoundary` 2개로 나누어서 관리하였고 각각은 `CommonErrorBoundary`라는 공용으로 사용되는 메서드를 포함한 ErrorBoundary를 상속하여 구현하였습니다.

### 예시

- **LogicErrorBoundary**

```jsx
class LogicErrorBoundary extends CommonErrorBoundary<LogicErrorBoundaryProps> {
	constructor(props: LogicErrorBoundaryProps & ErrorBoundaryProps) {
		super(props);
	}
	componentDidUpdate(_: never, prevState: ErrorBoundaryState) {
		if (prevState.error === this.state.error || !this.state.error) {
			return;
		}
		const { showSnackBar, navigate } = this.props;
		const errorCode = this.state.error.errorCode;
		if (
			typeof errorCode === 'undefined' ||
			typeof showSnackBar === 'undefined' ||
			typeof navigate === 'undefined'
		) {
			throw new CustomError('9999', '빠진 인자가 없는지 확인해주세요');
		}
		const errorMessage = ErrorMessage[errorCode];
		if (isExpiredTokenError(errorCode)) {
			navigate(URL.REFRESH_TOKEN_HANDLER);
		}
		if (isVoteError(errorCode)) {
			navigate(-1);
		}
		if (isNotAccessVoteError(errorCode)) {
			navigate(URL.CATEGORY_DISCUSSION);
		}
		if (isCommentError(errorCode)) {
			queryClient.invalidateQueries('comments');
		}
		if (isAlreayLoginRefreshTokenError(errorCode)) {
			navigate(URL.HOME);
		}
		if (isInvalidRefreshTokenError(errorCode)) {
			localStorage.removeItem(ACCESSTOKEN_KEY);
			window.location.href = URL.HOME;
		}
      // 모든 에러에 대해서는 스낵바를 보여준다.
		showSnackBar(errorMessage);
      // Server에러나 NotFound에러는 LogicErrorBoundary의 부모인 FallbackErrorBoundary에게 에러를 던져 처리를 위임한다.
		if (isServerError(errorCode) || isNotFoundArticleError(errorCode)) {
			throw new CustomError(errorCode);
		}
		if (this.state.error !== null && prevState.error !== null) {
			this.reset();
		}
	}
```

- **FallbackErrorBoundary**

```jsx
class FallbackErrorBoundary extends CommonErrorBoundary<FallbackErrorBoundaryProps> {
  constructor(props: FallbackErrorBoundaryProps & ErrorBoundaryProps) {
    super(props);
  }
  componentDidUpdate(_: never, prevState: ErrorBoundaryState) {
    if (prevState.error === this.state.error || !this.state.error) {
      return;
    }
    if (prevState.error !== null) {
      this.reset();
    }
  }
  render() {
    const { children, serverErrorFallback, NotFoundErrorFallback } = this.props;
    if (this.state.error) {
      if (String(this.state.error.errorCode) === '0000') {
        return serverErrorFallback;
      }
      return NotFoundErrorFallback;
    }
    return children;
  }
}
```

**중앙집중식 에러 핸들링의 장점?**

- 에러를 추가하거나 수정할때 더 편하게 처리할 수 있었습니다.
- 컴포넌트를 만들때 마다 에러를 잡기위해 에러바운더리로 감싸야 한다는 것도 신경쓰지 않아도 됩니다.

## class에서 hook을 사용하고 싶어..

위의 `LogicErrorBoundary`를 보면 showSnackBar, navigate 라는것을 이용하여 에러가 발생한 후처리를 합니다.
하지만 showSnackBar는 `useSnackBar`라는 커스텀 훅에서, navigate는 `useNavigate`라는 react-router-dom의 내장 훅을 이용합니다.
하지만 class형 컴포넌트에서는 이러한 훅을 이용할 수 없었기에 class에서 훅을 쓸 수 있게하는 연결체 HOC를 만들어서 처리하였습니다.

```jsx
import { useNavigate } from 'react-router-dom';
import useSnackBar from '@/hooks/common/useSnackBar';
function WithHooksHOC<F>(Component: React.ComponentType<F>) {
	return function Hoc(props: F) {
		const { showSnackBar } = useSnackBar();
		const navigate = useNavigate();
		return <Component {...props} showSnackBar={showSnackBar} navigate={navigate} />;
	};
}
export default WithHooksHOC;
// LogicErrorBoundary
export default WithHooksHOC(LogicErrorBoundary);
```

이렇게 이용할시 LogicErrorBoundary내에서도 훅에서 리턴하는 값을 props로 받아서 이용할 수가 있게됩니다.

## 에러도 선언적으로 던지자!

에러 바운더리는 Promise에러를 잡을수 없습니다. 사실 try/catch도 동일합니다.

```jsx
try {
  // 비동기 에러 발생!
} catch (err) {
  console.log(err.message);
}
```

이런 방식으로 코드를 작성을 한다면 catch에서 에러가 잡히길 기대하지만 사실은 `Uncaught promise Error`의 메시지를 만나게 될것입니다.
이에 대해서 설명하기 위해 잠시 `이벤트 루프` 개념이 나오게 됩니다.
try에서 실행한 비동기 로직은 `callback queue`에 들어가게 되고, 이 `callback queue`는 모든 콜스택이 비어야 실행을 합니다.
그래서 실제로 에러가 던져지는 시점은 catch문까지 모두 끝난시점이기때문에 에러를 잡을수 없는것입니다.

**그래서 에러를 선언적으로 던지자**랑은 무슨 상관..?
에러 바운더리에서 에러를 잡게 하기위해서 error를 상태로 관리하여 component의 `useEffect`에서 던져주면 promise가 벗겨진 상태로 에러를 던지게 됩니다.

```jsx
const [error, setError] = useState(null);
try {
  fetch('some url').catch(err => {
    setError(err);
  });
} catch (err) {
  //
}
useEffect(() => {
  if (error) {
    throw new Error(error.message);
  }
}, [error]);
```

하지만 공식에서는 react-query를 이용하기 때문에 이렇게 복잡한 과정없이 error를 받을 수 있습니다.

**ex)**

```jsx
useEffect(() => {
  if (error) {
    if (!error.response) {
      throw new CustomError('9999', '런타임 에러');
    }
    if (typeof error.response.data === 'undefined') {
      throw new CustomError('0000', '네트워크에 에러가 발생하였습니다.');
    } // 네트워크 에러
    throw new CustomError(
      error.response.data.errorCode,
      ErrorMessage[error.response.data.errorCode],
    ); // 일반 API에러
  }
}, [error]);
```

하지만 이 역시 컴포넌트마다 커스텀 에러를 던지는 로직이 있기 때문에 모처럼 에러를 선언적으로 처리한 보람이 없습니다. 그래서 에러를 던지는것 마저도 `useThrowCustomError`라는 커스텀 훅을 이용하여 처리하였습니다.

## 마무리

이렇게 하여서 에러를 선언적으로 처리하여 컴포넌트내에서의 가독성을, 중앙집중식으로 에러를 관리하여 에러처리의 수정, 확장등이 간편해지도록 관리하였습니다.
추후 `Sentry`라는 라이브러리를 이용하여 미처 잡지 못한 에러들에 대해서 추적할 수 있도록 할 예정입니다.
