---

layout: post  
title: "클라이언트에서 비동기 요청 시 최신 데이터를 가져오는 방법"
author: "보스독"
comment: "true"
tags: ["asynchronous", "api"]
toc: true
---



클라이언트 쪽 개발을 하다보면, 서버에 특정 자원을 생성하는 요청을 보내고, 요청이 성공한다면 해당 내용을 화면에도 즉각 반영해야 하는 상황을 종종 마주한다. 

이 경우, 우리는 생성과 조회를 한번에 해결하는 API 요청을 보냄과 동시에 반환되는 새로운 자원을 특정 양식(template)에 맞춰서 화면에 바로 넣어주는 방식을 생각해볼 수 있다. 



## 생성과 조회를 하나의 요청으로 !? 

생성과 조회를 하나의 요청으로 보낸나는게 무슨말일까? 

이건 요청을 받아들이는 Controller의 함수를 보면 이해가 빠를 것이다. 

다음 예시 코드에 등장하는 메서드는 어떤 역할을 하고 있을까?

``` java
...
  
@PostMapping("/lines")
public ResponseEntity<LineResponse> createLine(@RequestBody LineRequest request) {
    LineResponse response = lineService.save(request);
    return ResponseEntity
        .created(URI.create("/lines/" + response.getId()))
        .body(response);
}

...
```

그렇다. 이 코드는 메서드 명에서도 알 수 있듯이 **새로운 지하철 노선을 생성하는 역할**을 한다.

body 부분에 포함된 DTO로 응용계층의 트랜잭션 메서드를 수행한 후, 반환되는 영속성 객체를 응답 DTO로 바꿔서 다시 내려보내주고 있다.

만약 반환된 response를 클라이언트에서 사용한다면, 현재 이 API는 생성과 조회를 하나의 요청으로 해결하고 있는 셈이다.

그럼 실제로 이 API를 호출하는 클라이언트 코드는 어떻게 생겼는지 살펴보자.

``` jsx
// LineAdmin.js

...
  const createSubwayLine = () => {
    const newSubwayLine = {
      name: $subwayLineNameInput.value,
      startTime: $subwayLineStartTime.value,
      endTime: $subwayLineEndTime.value,
      intervalTime: $subwayIntervalTime.value
    };
    api.line
      .create(newSubwayLine)
      .then(response => {
        $subwayLineList.insertAdjacentHTML(
          "beforeend",
          subwayLinesTemplate(response)
        );
        subwayLineModal.toggle();
      })
      .catch(error => {
        alert("에러가 발생했습니다.");
      });
  };
...
```

(여기서 "api"는 모듈화를 통해 대입되고 있으며, 실제로 fetch API를 사용하여 서버로 API를 요청하고 있다.)

``` jsx
api.line.create(newSubwayLine)
=
fetch(`/lines`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ...newSubwayLine
  })
})
```

`api.line.create(newSubwayLine)` 실제로 "/lines" url로 newSubwayLine 객체를 body로 함께 요청을 보내고 있음을 알 수 있다. 즉, 새로운 지하철 노선을 생성을 요청하는 fetch API를 호출한다.

그런데 이어 나오는 promise의 콜백부분을 보면, `then`으로 response를 받고, html의 리스트 자리에 끼워넣는 작업을 수행하고 있는데, 이는 우리가 예상한대로, 생성 요청을 통해 반환된 새로운 자원을 클라이언트에서 그대로 사용하고 있다. 

아마도 비동기적으로 응답 데이터를 바로 화면에 보여주기 위해서 생각한 방식인 듯하다.

위와 같이 생성과 조회를 동시에 수행하는 API를 사용한다면, 트랜잭션 명령을 수행함과 바로 클라이언트에도 변화를 적용시킬 수 있으니 아주 괜찮은 방법이 아닌가? 🤔

하지만 만약 다음과 같이 여러명이 동시에 노선을 생성하는 상황이라면 어떨까? 예시 상황 통해 문제점을 한번 찾아보자.

처음에 1호선만 존재하고 있고, 화면에도 역시 1호선 밖에 안나와 있다.

<img src="https://user-images.githubusercontent.com/42382027/87889912-f858bd80-ca6e-11ea-8e5d-9862de32def6.png" width="360">


이 때 7명의 유저가 각각 2호선, 3호선, 4호선, 5호선 6호선, 7호선, 8호선을 동시에 생성했다고 가정했을 때, 분명 DB에는 다음과 같이 1호선부터 9호선 까지의 데이터가 쌓여있을 것이다. 의심할 여지가 없다.

<img src="https://user-images.githubusercontent.com/42382027/87890053-ac5a4880-ca6f-11ea-8bfa-082a2760ef72.png" width="600">

그러나 4호선을 생성했던 유저의 화면에는 어떻게 보일까?

<img src="https://user-images.githubusercontent.com/42382027/87889930-12929b80-ca6f-11ea-8447-36b9fea6d02d.png" width="360">

<img src="https://user-images.githubusercontent.com/42382027/87891358-a450d780-ca74-11ea-937a-ddd23e097b5c.png" width="320">



당연하게도 현재 기존에 있던 1호선과 4호선 두 개 밖에 보이지 않을 것이다. 왜냐면 본인이 생성한 호선만 그대로 응답으로 내려받아서 화면에 렌더링해주고 있기 때문이다. 물론 다른 호선들을 생성한 유저들의 화면에서도 마찬가지로 1호선과 본인이 생성한 지하철 노선만 화면에 보일 것이다.

이 때, 새로고침을 누르면 우리가 원하는대로 1호선부터 9호선까지의 데이터를 볼 수 있는데,  이는 다시 DB에서 전체 노선 데이터를 불러와 화면에 보여주기 때문이다. 

<img src="https://user-images.githubusercontent.com/42382027/87890037-9c426900-ca6f-11ea-9fb5-1e2b84d354dd.png" width="360">



이 문제 상황을 보면, 생성과 조회를 하나의 요청으로 수행했을 경우 항상 DB의 최신 정보를 화면에서 볼 수 없다는 큰 단점이 존재하게 된다.



## 그럼 어떻게 해결하죠?

사실 이 문제를 해결하는 방법은 아주 간단하다. 요청이 끝날 때 쯤 화면을 다시 한 번 새로고침 해주는 것이다.

함수가 끝나기 직전에 `window.location.reload()` 한 줄만 추가해주면 된다. 그러면 사용자가 직접 새로고침을 하는 대신 요청이 끝나고 자동으로 새로고침이 되어 화면에서 최신 정보를 동기적으로 볼 수 있다.

하지만 이는 진정한 비동기 처리라고 할 수 없다. 🧐  새로 고침으로 최신정보를 동기화하는 방법은 html에서 form으로 요청을 보내는 것과 크게 다를 바가 없다.

그렇다면 새로고침도 안되면서 DB의 최신정보를 반영하여 화면에 보여주는 방법이 있을까?

**당연히 있다.**

이를 위해서는 생성과 조회를 하나의 API에서 한번에 하기보다, 생성과 조회 각각의 API로 분리하여 요청을 두 번 보내면 된다.

어떻게 하는 것일까? 코드를 통해 알아보자.

### Controller에서 조회 API 분리

``` java
...
  
@PostMapping("/lines")
public ResponseEntity<Void> createLine(@RequestBody LineRequest request) {
    LineResponse response = lineService.save(request);
    return ResponseEntity
        .created(URI.create("/lines/" + response.getId()))
        .build();
}

@GetMapping("/lines")
public ResponseEntity<Lines> findLines() {
    LinesResponse response = lineService.findAllLines();
    return ResponseEntity
        .ok(response);
}

...
```

API를 위와 같이 분리하게 되면, 클라이언트에서 create버튼을 눌렀을 때, `api.create`과 `api.findAll` 함수를 연속으로 호출해야 한다.

> 여기서 api.findAll은 fetch('/lines').then(data => data.json())을 의미한다.

단, 주의할 점은 자바스크립트에서는 비동기 처리를 위해 콜백함수 또는 async/await를 반드시 함께 사용해줘야 한다는 것이다.

``` jsx
...
  const createSubwayLine = async () => {
    const newSubwayLine = {
      name: $subwayLineNameInput.value,
      startTime: $subwayLineStartTime.value,
      endTime: $subwayLineEndTime.value,
      intervalTime: $subwayIntervalTime.value
    }

    await api.line
      .create(newSubwayLine)
      .then(subwayLineModal.toggle())
      .catch(error => {
        alert('에러가 발생했습니다.')
      })
    
    await api.line
      .getAll()
      .then(lines => {
        $subwayLineList.innerHTML = lines.map(line => subwayLinesTemplate(line)).join('')
      })
      .catch(() => alert(ERROR_MESSAGE.COMMON))
  }
...
```

이렇게 하면 실제로 새로고침 없이, 클라이언트에서 DB의 최신 정보를 받아서 화면에 보여줄 수 있다.

간혹 요청을 2번이나 보내서 비용이 너무 크지않을까하는 걱정이 들 수 도 있다. 그러나 어차피 언제든 최신 정보를 가져오려면 두번째 요청이 반드시 불려야 하기 때문에, 조삼모사 격이라고 생각한다. 

사용자 입장에서는 특정 이벤트나 액션에 따라 최신정보가 화면에 보여지지 못하거나, 새로고침 횟수가 잦아진다면, 사용자 경험이 낮아질 수 밖에 없을 것이다. 그래서 필자는 한번에 비동기 요청을 2번 보내는 것이 더 낫다고 생각한다. 

개발자마다 생각이 다를 수 있다. 사용자의 경험을 중요하게 생각할 것인지, 당장의 요청에 대한 비용을 더 중요하게 생각할 것인지 상황에 따라 혹은 자신의 가치관에 따라 잘 분별해서 사용하면 좋을 것 같다.
