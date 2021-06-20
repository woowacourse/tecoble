---
layout: post
title: 'Optional 과 null 에 대해 ⌥␀'
author: [와일더]
tags: ['stream']
date: '2021-05-23T12:00:00.000Z'
draft: false
image: ../teaser/optional-vs-null.png
---
런타임에서 발생하는 NullPointException 방어를 위해 만들어둔 로직체크는 코드의 가독성과 유지 보수성이 떨어진다. 어떻게 null 을 다루면 좋을 지에 대한 해결책을 함수형 언어에서 찾았다. 함수형 언어는 <b>존재하지 않을 수도 있는 값</b>에 대한 별도의 타입을 가지고 있다. 개발자들은 여러가지 API 를 통해 간접적으로 값에 접근할 수 있다. 자바는 함수형 언어로부터 영감을 받아  <b>자바 8</b>에서 처음 Optional 이 도입 되었다.

## Optional?

> 값이 존재할 수도, 존재하지 않을 수도 있는 값을 포장한 객체

<b>Null 이 될 가능성을 가진 값</b>을 객체로 감싸는 래퍼 클래스다. 즉, Optional 에 포장된 객체는 하나의 원소 혹은 Null 원소가 되는 것을 뜻한다. Null 을 직접 다루면 위험한 상황이 발생하거나 굉장히 까다롭다. 이를 Optional 객체에 포장하므로서 유연한 처리가 가능해 진다. Null 을 Optional 에 포장하게 되면 Null 을 값으로 보고 로직을 구현할 수 있다.



## Optional 사용하기

Optional 사용법에 대해서는 [공식문서](https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html)를 참고해 보는 것을 추천한다.



<b>Optional 객체 생성</b>

세 가지 정적 팩토리 메서드를 사용해서 만들 수 있다.

1. Optional.empty( )

```java
// 비어있는(null) Optional 객체를 가져온다.
Optional<Station> optStation = Optional.empty();
```

2. Optional.of(T value)

```java
// 객체를 담은 Optional 객체를 생성한다. 이 경우 null 이 들어오면 NPE 가 발생한다.
Optional<Line> optLine = Optional.of(new Line("1호선"));
```

3. Optional.ofNullable(T value)

```java
// 비어있거나 값이 있을 수 있는 객체를 생성한다. (null 여부를 확신할 수 없을 때)
Optional<Section> optNullSection = Optional.ofNullable(null);
Optional<Section> optSection = Optional.ofNullable(new Section("잠실역", "몽촌토성역", "850m"));
```



<b>Optional 값에 접근하기</b>

1. get( )

```java
// 값을 가져오고, 비어있는 Optional 객체에 대해서는 NoSuchElementException 예외를 던진다.
Optional<Station> optStation = Optional.of(new Station("잠실역"));
Station station = optStation.get();
```

2. orElse(T other)

```java
// 비어있는 Optional 객체에 대해서 orElse 로부터 넘어온 인자를 반환한다.
Optional<Station> optStation = Optional.of(null);
Station station = optStation.orElse(new Station("잠실역"));
```

3. orElseGet(Supplier<? Extends T> other)

```java
// 비어있는 Otional 객체에 대해서 orElseGet 으로부터 넘어온 함수형 인자를 통해 생성된 객체를 전달한다.
Optional<Station> optStation = Optional.of(null);
Station station = optStation.orElseGet(() -> new Station("임시역"));
```

4. orElseThrow(Supplier<? Extends X> exceptionSupplier)

```java
// 비어있는 Optional 객체에 대해서 orElseThrow 로부터 넘어온 함수형 인자를 통해 예의를 던진다.
Optional<Station> optStation = Optional.empty();
Station station = optStation.orElseThrow(UnsupportedOperationException::new);
```



## Optional 의 장점

- 명시적으로 변수에 대한 null 가능성을 표현할 수 있다.
- null 체크를 직접하지 않아도 된다.
- Null Point Exception 이 발생할 가능성이 있는 값을 직접 다룰 필요가 없다.



## Optional 의 단점

- Wrapper 클래스이기 때문에 두 개의 참조를 가지기 때문에 생성 비용이 비싸다.
- 직렬화가 불가능하다.



## Optional 의 의문

Optional 객체의 공백 여부를 확인하기 위해서 Optional 의 isPresent 메서드를 통해 다음과 같은 작업을 한다.

```java
    public String findStationName(Optional<Station> optStation) {
        if (optStation.isPresent()) {
            return optStation.get().getName();
        }
        return new Station("존재하지 않는 역").getName();
    }
```

만약 Optional 을 사용하지 않고 똑같은 기능을 구현한다면 어떻게 될까?

```java
    public String findStationName(Station station) {
        if (Objects.nonNull(station)) {
            return station.getName();
        }
        return new Station("존재하지 않는 역").getName();
    }
```

이렇게 되면 왜 Optional 을 사용해서 얻는 이점이 없어 보인다. Optional 을 처음 접하거나 Optional 의 개념을 제대로 이해하지 못한 상황이라면 다음과 같은 고민을 하게 된다.

> 어떻게 Optional 의 null 체크를 해야할까?

정답은 <b>Optional 을 사용한 시점에서 null 체크는 할 필요가 없다.</b> Optional 을 사용하는 이유는 <b>null 처리를 직접하지 않고 Optional 클래스에 위임</b>하기 위해서 사용한다.

### 올바른 Optional 사용법은 다음과 같다.

```java
    public String findStationName(Optional<Station> optStation) {
        return optStation.orElse(new Station("존재하지 않는 역")).getName();
    }
```

Optional 을 정확하게 이해하고 사용 한다면, 위와 같이 한 줄의 코드로 작성할 수 있어야 한다. 조건문으로 null 체크를 하던 수준에서 <b>함수형 사고</b>로 전환해야 한다.



## DAO 에서 Optional 을 사용해야 할까?

JDBC template 을 사용하여 DB 에서 값을 가져올 때, 그 값을 어떻게 처리하여 반환할 지에 대해 사람들의 생각이 갈렸다.

1. DAO 에서 값을 조회하고 Optional 로 포장해서 포장된 값을 반환하고 Service 에서 값에 대한 로직을 수행하는 방법
2. DAO 에서 조회 결과가 null 일 경우 발생하는 예외(EmptyResultDataAccessException)를 잡아서 예외를 던지고 ControllerAdvice 에서 처리를 하는 방법

즉, Optional 처리를 할 지 null 처리를 할 지 의견이 분분하다.

<b>Optional 로 포장해서 구현하는 방법을 택하면 다음과 같은 상황이 발생한다.</b>

1. DB 처럼 Java application 외부의 로직에 관여하는 상황이 발생한다.
2. 위에서 언급한 것처럼 Optional 스럽지 못한 구현이 생길 수 있다. 아래 코드는 null 을 다루었을 때 더 적절한 코드라는 것을 알 수 있다.

```java
    public Station save(Station station) {
        if (stationDao.findByName(station.getName()).isPresent()) {
            throw new DuplicatedStationException();
        }
        return stationDao.save(station);
    }
```

<b>Null 처리를 하면 다음과 같은 상황이 발생한다.</b>

1. Dao 에서 예외를 던지기와 같은 해야할 행위가 늘어난다.
2. Service 에서 다양한 상황에 대한 처리를 할 수 없게 된다.

당신은 어떤 방식으로 데이터를 처리하는 것이 더 좋은 방법이라고 생각하는가?



## 결론

무분별한 Optional 사용은 되려 독이 될 수 있다. Optional 이 필요하다고 생각되는 부분에서 Optional 을 사용한다면 유연한 코드를 구사할 수 있을 것이다. Null 이라는 것은 개발자가 평생 짊어지고갈 까다로운 녀석이다. 까다로운 녀석을 어떻게 다룰지 한 번 곰곰히 생각해본다면 의외로 간단하게 다룰 수 있을지도 모르겠다.

## 참고

- [공식문서](https://docs.oracle.com/javase/8/docs/api/java/util/Optional.html)
- [자바 옵셔널(Java Optional)](https://jdm.kr/blog/234)
- [자바8 Optional 2부: null을 대하는 새로운 방법](https://www.daleseo.com/java8-optional-after/)
- 모던 자바 인 액션
