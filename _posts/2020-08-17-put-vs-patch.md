---
layout : post
title : "자원을 수정하는 HTTP 메서드 - PUT vs PATCH"
author : "비밥", "보스독"
comment: "true"
tags: ["http-method", "put", "patch"]

---



## 들어가며

여기 지하철 노선 정보를 수정하는 자바스크립트 코드가 있다. 

지하철 노선(Line)은 이름(name), 첫 차 시간(startTime), 마지막 차 시간(endTime), 배차간격(intervalTime)을 상태로 갖는다.

``` jsx
const updateSubwayLine = () => {
  // 수정할 노선 정보
  const updatedSubwayLine = {
    name: $subwayLineNameInput.value,
    startTime: $subwayLineStartTime.value,
    endTime: $subwayLineEndTime.value,
    intervalTime: $subwayIntervalTime.value
  }
  
  // 노선 정보를 수정하는 API 호출
  request(`/lines/${$activeSubwayLineItem.dataset.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...updatedSubwayLine
    })
  })
  .then(() => {
    subwayLineModal.toggle()
    $activeSubwayLineItem.querySelector('.line-name').innerText = updatedSubwayLine.name
  })
  .catch(error => alert(ERROR_MESSAGE.COMMON))
}
```

`updateSubwayLine` 함수가 실행되면 'PUT' 메서드로 노선 정보를 수정하는 API가 호출되고, 요청으로 전달된 데이터에 따라서 데이터베이스에 저장된 노선의 정보가 변경될 것이다. 

이렇게 자원의 수정 역할을 하는 Http Method는 흔히 'PUT'과 'PATCH'가 있다고 많은 사람들이 알고 있다. 그렇다면 위의 함수에서 'PUT'을 'PATCH'로 바꾼다면 똑같이 의도한대로 수정이 될까?

**그렇다!**

현재로서는 'PUT'과 'PATCH'가 같은 결과를 도출하기 때문에 둘다 자원을 "수정하는 역할"을 한다고 말할 수 있다. 

실제로도 HTTP 메서드 중 PUT과 PATCH 모두 자원을 수정하는 용도로 많이 사용한다. 

하지만 둘은 자원을 수정하는 Http Method 중에서 **대체재 관계**라고는 할 수 없다. 왜냐하면 둘은 애초에 엄연히 다른 정의와 규약을 가지고 있고, 실제 사용할 때도 멱등성과 관련한 미묘한 차이를 보이기 때문이다. 

이 두 가지 메서드는 수정이라는 같은 작업을 하는 것 같이 보이기 때문에  
잘못 사용하면 클라이언트와 서버 간의 통신에 혼선이 올 수 있다. 

따라서 PUT과 PATCH의 정의의 차이를 알아보고 코드로써 이를 다뤄보겠다.



## HTTP Method - PUT

> The PUT method requests that the state of the target resource be
> created or replaced with the state defined by the representation
> enclosed in the request message payload.

RFC 문서에 따르면 PUT 메서드는 요청한 URI에 payload(ex. Request Body)에 있는 자원으로 **대체(replace)**하는 메서드이다.  여기서 대체하는 메서드라는 것은 대상을 저장하기도, 변경한다는 것을 의미한다.결국 PUT 메서드는 상황에 따라 다르게 동작하게 되는데 이를 두 가지 경우로 나누어 살펴보도록 하자.

#### 요청한 URI 아래에 자원이 존재하지 않는 경우

자원이 존재하지 않는 경우는 단순하다.  POST와 마찬가지로 새로운 자원으로써 저장하고 클라이언트에게 Http Status Code를 `201(Created)` 응답을 보내주면 된다.

#### 요청한 URI 아래에 자원이 존재하는 경우자원이 존재하는 경우 

payload에 담긴 정보를 이용해서 새로운 자원을 만들어 기존에 존재하던 자원을 대체한다.그리고 해당 요청이 잘 적용되었다는 것을 클라이언트에게 `200(ok)` 혹은 `204(no content)`를 이용해서 알려주면 된다.



## PUT을 사용하는 코드

PUT의 정의를 가장 잘 설명하는 예시가 주변에서 흔히 볼 수 있는 "좋아요"와 "싫어요''(혹은 추천/비추천) 기능이라고 생각한다. 좋아요와 싫어요 정보를 갖고 있는 Like 엔티티가 다음과 같이 구성되어있다.

``` java
@Entity
public class Like {
  
  @Id
  private Long id;
  
  private Long articleId;
  
  private Long userId;
  
  private LikeType likeType;   //** liked or disliked
    
  ...
}
```

Like 엔티티는 articleId(어떤 게시물에 대한 건지), userId(누가 좋아요를 한건지), 그리고 type(좋아요/싫어요)를 상태로 가지고 있다. 

클라이언트에서 액션을 받을 때에도 이 세 정보가 모두 필요하다. 유저가 처음으로 좋아요(혹은 싫어요)를 눌렀다면, 생성이 되어야할 것이고, 기존에 누른 적이 있다면 다른 타입으로 토글(수정) 되거나, 취소가 되어야 한다.

이런 경우는 다음과 같이 PUT Method를 사용해서 Like 자원의 온전한 생성과, 수정을 표현할 수 있다.

``` java
// LikeController.java
...
@PutMapping  //** PUT Method
public ResponseEntity<Void> updateLike(
    @RequestParam Long articleId,
    @LoginUser User user,
    @RequestBody LikeRequest request  //** LikeType
) {
    articleService.update(articleId, user.getId(), request.getLikeType());
    return ResponseEntity.noContent().build();
}
...
  
// LikeService.java
...
@Transactional
public void update(Long articleId, Long userId, LikeType likeType) {
    Like like = likeRepository.findByArticleIdAndUserId(articleId, userId)
      .map(l -> l.setType(likeType))
      .orElse(new Like(articleId, userId, likeType));

    likeRepository.save(like);
}
```

LikeService에서 payload로 전달받은, articleId와 userId를 사용해서 식별가능한 데이터가 있는지 확인한 후 있으면, body에 있는 새로운 type으로 수정한다. 만약 식별가능한 데이터가 없다면, payload에 있는 데이터들로 새로운 엔티티를 만들어 데이터베이스에 저장하게된다. 이렇게하면 PUT 메서드 정의와 규약을 지키면서도 도메인 요구사항에 맞는 API를 만들 수 있다.



## HTTP Method - PATCH

> This specification defines the new HTTP/1.1 [RFC2616] method, PATCH,
> which is used to apply **partial modifications to a resource.**

RFC 문서에 따르면 PATCH 요청은 자원에 대한 **부분적인 수정을 적용**하기 위한 HTTP 메서드이다.

### 주의점

**PUT 메서드를 사용하는 클라이언트는 해당 자원의 상태를 모두 알고 있다고 가정되어야 한다. **PUT 메서드는 요청 경로에 자원이 존재하는 경우 해당 자원을 payload 정보와 교체하는 메서드이다. 
따라서 payload 정보가 해당 자원의 상태 값을 모두 알고 있어야 대체할 수 있는 정보를 보낼 수 있기 때문이다. 이러한 이유로 PUT 메서드를 사용할 때 전송하는 **payload만으로 자원의 전체 상태를 나타낼 수 있어야 한다.** 새로운 자원을 생성해야 하는 경우 완전한 상태의 자원을 저장해야 하고 새로운 자원으로 대체하는 경우 대체하는 자원이 완전한 상태를 가지고 있어야 하기 때문이다.



## Patch를 사용하는 코드

그렇다면 이번에는 PATCH의 경우를 살펴보자.

처음 들었던 예시로 다시 돌아가서 지하철노선(Line)이 가지고 있는 네 가지 필드 중 이번에는 이름(name)과 배차간격(intervalTime) 필드만 변경이 가능하다고 가정해보겠다. 클라이언트에서는 기존처럼 모든 필드를 요청에 실을 필요없이 아래처럼 name과 intervalTime에 대한 정보만 body에 담아서 보내면 된다.

```jsx
...
body: JSON.stringify({
  name: "변경된 노선 이름",
  intervalTime: 100
})
...
```

PUT의 경우, URL에 담긴 정보로 엔티티를 식별할  수 없다면 생성까지 해야하기 때문에 엔티티에 필요한 모든 정보를 payload에 실어 보내야 한다. 

하지만 PATCH는 부분 수정을 위한 데이터만 요청의 payload로 보내기 때문에 아래와 같이 body를 받는 DTO를 별도로 만들어 주어야 하고, 이 부분 데이터를 받는 DTO로는 새로운 엔티티를 생성할 수 없고 오직 부분 수정을 위한 데이터로써의 준비를 마치게 된다.

``` java
public UpdateLineNameAndIntervalTime {
  
    private String name;
    private int intervalTime;
  
    public UpdateLineNameAndIntervalTime() {}
  
    public UpdateLineNameAndIntervalTime(String name, int intervalTime) {
        this.name = name;
        this.intervalTime = intervalTime;
    }
}
```

클라이언트에서 PATCH 요청을 보낸 뒤, 이어서 호출 되는 함수를 보자.

``` java
// LineService.java
...
@Transactional
public void updateLine(final Long id, final UpdateLineNameAndIntervalTime request) {
    Line line = lineRepository.findById(id)
        .orElseThrow(NoSuchElementException::new);
  
    line.update(request);
}
...
  
// Line.java
public void update(final UpdateLineNameAndIntervalTime request) {
    this.name = request.getName();
    this.intervalTime = request.getIntervalTime();
}
```

Service에서 URL에 포함된 Id로 해당 자원을 찾은 뒤 전달받은 DTO를 엔티티에 다시 전달하여 엔티티 안에서 자신의 상태를 변경하게 된다. 처음 보았던 예시코드와 DTO만 달라지고 수정하는 방식은 크게 차이가 없다. 코드만 보아도 기존에 있던 자원을 완전히 대체하거나 새로 생성하는 것이 아닌, 수정하고 싶은 부분만 수정할 수 있고, 이런 경우에는 PUT보다 PATCH 규약이 더 적절한 상황이라고 할 수 있다.



## 결론

PUT과 PATCH는 HTTP 메서드이지만 규약일 뿐 특정 행동을 강제할 수 없다.

하지만 이러한 규약은 모두가 동의한 약속이고 클라이언트와 서버 간의 통신에서 혼란이 발생하지 않도록 정의를 잘 알고 사용하는 것이 좋다.

**++ 멱등성 언급**

## 참고

[RFC-5789](rfc-editor.org/rfc/rfc5789.html)

[RFC-7231](https://tools.ietf.org/html/rfc7231) 

[컴퓨터 과학에서의 멱등성](https://en.wikipedia.org/wiki/Idempotence#Computer_science_meaning)





