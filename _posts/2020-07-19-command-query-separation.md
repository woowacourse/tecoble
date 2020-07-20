---

layout: post  
title: "조회와 명령(트랜잭션) 책임을 분리하자"
author: "보스독"
comment: "true"
tags: ["query", "api"]

---



## 생성과 조회를 동시에 수행하는 비동기 처리

생성과 조회를 동시에 수행한다는 말이 와닿지 않을 수도 있을 것 같다. 

코드를 먼저 보자. 아마 자바 개발자라면 코드만 보더라도 단숨에 무슨 말인지 알 것이다.

다음의 API 코드는 무엇을 하는 코드일까?

``` java
...
  
@PostMapping("/lines")
public ResponseEntity<LineResponse> createLine(
  @RequestBody LineRequest request
) {
  LineResponse response = lineService.save(request);
  return ResponseEntity.created(URI.create("/lines/" + response.getId()))
    .body(response);
}
```

그렇다. 이 코드는 메서드 명에서도 알 수 있듯이 **새로운 지하철 노선을 생성하는 API함수**이다.

body에 포함된 dto로 응용계층에서 DB에 저장하는 트랜잭션 명령을 수행한 후, 반환되는 영속성 객체를 응답 dto로 바꿔서 다시 내려보내주고 있다.

만약, 반환된 response를 프론트에서 사용한다면, 현재 API는 생성과 조회를 동시에 수행하고 있는 셈이된다.

그럼 실제로 이 API를 호출하는 프론트 엔드 코드는 어떻게 생겼는지 살펴보자.

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

`api.line.create(newSubwayLine)` 부분을 보면 "/lines/" url로 newSubwayLine 객체를 body로 함께 요청을 보내고 있음을 알 수 있다. 즉, 새로운 지하철 노선을 생성하는 로직을 의미한다.

그런데 이어 나오는 promise의 콜백부분을 보면, `then`으로 response를 받고, html의 리스트 자리에 끼워넣는 작업을 수행하고 있다.

우리가 예상한대로, 역시나 생성 로직을 통해 반환된 데이터를 프론트에서 그대로 사용하고 있다. 

아마도 비동기적으로 데이터를 바로 렌더링하기 위해서 생각한 로직인 듯하다.

위와 같이 생성과 조회를 동시에 수행하는 API를 사용한다면, 트랜잭션 명령을 수행함과 동시에 DB에도 반영되고 바로 프론트엔드에도 변화가 적용되니 아주 괜찮은 방법이 아닌가? 🤔

하지만 만약 다음과 같이 여러명이 동시에 노선을 생성하는 상황이라면 어떨까? 예시 상황 통해 문제점을 한번 찾아보자.

처음에 1호선만 존재하고 있고, 화면에도 역시 1호선 밖에 안나와 있다.

![image](https://user-images.githubusercontent.com/42382027/87889912-f858bd80-ca6e-11ea-8e5d-9862de32def6.png)

 

이 때 7명의 유저가 각각 2호선, 3호선, 4호선, 5호선 6호선, 7호선, 8호선을 동시에 생성했다고 가정했을 때, 분명 DB에는 다음과 같이 1호선부터 9호선 까지의 데이터가 쌓여있을 것이다. 의심할 여지가 없다.

![image](https://user-images.githubusercontent.com/42382027/87890053-ac5a4880-ca6f-11ea-8bfa-082a2760ef72.png)

그러나 4호선을 생성했던 유저의 화면에는 어떻게 보일까?

![image](https://user-images.githubusercontent.com/42382027/87889930-12929b80-ca6f-11ea-8447-36b9fea6d02d.png)

![](https://user-images.githubusercontent.com/42382027/87891358-a450d780-ca74-11ea-937a-ddd23e097b5c.png)



당연하게도 현재 기존에 있던 1호선과 4호선 두 개 밖에 보이지 않을 것이다. 왜냐면 본인이 생성한 호선만 그대로 응답으로 내려받아서 화면에 렌더링해주고 있기 때문이다. 물론 다른 호선들을 생성한 유저들의 화면에서도 마찬가지로 1호선과 본인이 생성한 지하철 노선만 화면에 보일 것이다.



이 때, 새로고침을 누르면 우리가 원하는대로 1호선부터 9호선까지의 데이터를 볼 수 있는데,  이는 다시 DB에서 전체 노선 데이터를 불러와 화면에 보여주기 때문이다. 하지만 이는 진정한 비동기 처리라고 할 수 없다. 🧐

![image](https://user-images.githubusercontent.com/42382027/87890037-9c426900-ca6f-11ea-9fb5-1e2b84d354dd.png)



즉, 이러한 프론트 동시성 문제가 존재하기 때문에 실질적으로 비동기 처리를 제대로 하고 있지 못하고 있다고 볼 수 있다.

이를 비동기적으로 올바르게 해결하기 위해서는 생성과 조회를 하나의 API에서 한번에 하기보다, API 책임을 분리하여 두 번 호출하는 것이 더 적절할 것이다. 그러면 적어도 생성 시간에 따른 순서는 지키면서 비동기 적으로 데이터를 화면에 보여줄 수 있을 것이다.



### API가 분리된 Controller

``` java
@PostMapping("/lines")
public ResponseEntity<Void> createLine(
  @RequestBody LineRequest request
) {
  LineResponse response = lineService.save(request);
  return ResponseEntity.created(URI.create("/lines/" + response.getId()))
    .build();
}

@GetMapping("/lines")
public ResponseEntity<Lines> findLines() {
  LinesResponse response = lineService.findAllLines();
  return ResponseEntity.ok(response);
}
```

API를 위와 같이 분리하면, 프론트엔드에서는 create버튼을 눌렀을 때, api.create과 api.findAll 함수를 연속으로 호출해야할 것이다. 단, 주의할 점은 자바스크립트에서는 비동기 처리를 위해 콜백함수 또는 async/await를 반드시 함께 사용해줘야 한다.

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



## CQRS

이렇게 조회하는 책임과 트랜잭션에 관여하는 로직의 책임을 분리하는 것은 중요한데, 아예 두 책임에 사용하는 모델을 따로 관리하자는 것이 **CQRS(Command Query Responsibility Segregation**이다. 

어플리케이션이 거대해지면서 수행되는 쿼리의 비중은 트랜잭션 쿼리보다 조회쿼리가 더 크다. 그 때문에 조회와 명령(트랜잭션) 책임을 분리하고, 각 책임에 최적화된 모델을 사용하는 것이 어플리케이션의 성능을 향상시킬 수 있는 방법 중 하나가 될 것이다.

![image](https://user-images.githubusercontent.com/42382027/87890594-2d1a4400-ca72-11ea-8c34-92456fcdaadc.png)



CQRS에서는 이벤트 소싱 패턴을 사용하는데, 이는 DDD와 관련된 전술적 내용이다. 그만큼 CQRS는 어플리케이션의 성능과 확장 그리고 보안까지도 영향을 주지만, 이를 구현하는데 있어서는 복잡도가 추가적으로 상승하기 때문에 어느정도 비용을 따져본 후 적용하는 것이 좋다고 한다. CQRS에 대해서는 추후 공부를 더해서 추가 포스팅하도록 하겠다.

일단 CQRS에 대해 궁금하다면 [CQRS(명령 및 쿼리 책임 분리) 패턴](https://docs.microsoft.com/ko-kr/azure/architecture/patterns/cqrs)글을 참고하면 좋을 듯 하다.

