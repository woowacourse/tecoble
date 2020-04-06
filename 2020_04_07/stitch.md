# 온보딩 미션 - 코드 리뷰 주제 선정

## equals() 메서드의 NPE 방지

> [쿨라임 PR 링크](https://github.com/woowacourse/java-calculator/pull/15#discussion_r376695501)

- 상수.equals(비교하려는 값) -> 존재 가능성이 높은 값이 앞에 나와야지 NPE을 방지할 수 있다.

## 매개변수의 불변성을 보장하자

> [로운 PR 링크](https://github.com/woowacourse/java-calculator/pull/20#discussion_r376775494)

- 인자로 넘겨진 매개변수를 변경시키는 코드가 많아질수록 상태에 대한 추적이 어렵다.

- 이로 인해 예외가 발생할 가능성이 커지게 된다.

- 매개변수에 대한 불변성을 보장해주도록 작성하는 것이 더 안전하고 유연한 코드를 만들 수 있다.

## 친화적인 에러 메시지

> [범블비 PR 링크](https://github.com/woowacourse/java-calculator/pull/35#discussion_r376675375)

- 모든 Exception을 묶어서 처리하면(try-catch에서) 개발하는 것은 편리하지만 사용자는 정확한 에러를 파악하기 어렵다.

- 의도하는 에러가 발생했는지 여부를 확인하도록 코드를 구현.

## 하나의 테스트에서는 한 가지만 검증하자

> [코즈 PR 링크](https://github.com/woowacourse/java-calculator/pull/40#discussion_r376693325)

- 하나의 테스트에서 두 가지 케이스를 검증할 경우 제대로 검증이 이루어 질 수 없다.

- 하나의 테스트가 오류가 발생하면 나머지 하나의 테스트는 실행되지 않을 수 있다.

- 메서드 한 개가 하나의 역할을 하듯, 하나의 테스트에서도 한 가지만 검증하도록 작성하자.