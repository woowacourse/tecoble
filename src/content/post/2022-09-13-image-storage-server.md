---
layout: post  
title: 이미지 스토리지 서버 구축 및 최적화
author: [4기_오리]
tags: ['nginx', 'image', 'cache']
date: "2022-09-13T12:00:00.000Z"
draft: false
image: ../teaser/image-storage-server.png
---

레벨 3 프로젝트 과정 중 이미지 서버를 개발하고 개선해나가는 과정을 이야기하려 합니다.

## 왜 이미지 서버를 만들어야 하는가?

레벨 3 프로젝트인 [공책](https://github.com/woowacourse-teams/2022-gong-check)에서는 특정 공간에 관해서 설명하는 이미지를 올려 보여주어야 합니다. 글보다는 이미지를 제공함으로써 처음 보는 공간에 대해서도 가시적으로 확인하기 쉽게 하기 위함이죠.
<p align="center">
<img width="196" alt="1" src="https://user-images.githubusercontent.com/63030569/189906326-0c10be7b-aad2-460e-af18-24581f93317a.png">
</p>

이에 따라 공간의 관리자가 특정 공간을 추가할 때 본인이 원하는 이미지를 올려야 하기 때문에 서버 측에서 이미지를 저장할 수 있도록 하는 기능이 필요했습니다.

기존에는 RDB를 사용하고 있기 때문에 이미지 데이터를 단순히 binary로 전환하여 RDB에 저장하는 방법을 고려했었습니다. 다만 아래의 문제점이 거론되었어요.

- binary 로 관리하게 되는 경우 너무 큰 데이터 파일로 인하여 관리가 힘들다.
- binary의 크기가 크기 때문에 입출력 시 database에 병목현상이 발생하여 다른 데이터에 영향을 준다.

저희 팀에서는 이런 문제점을 고려하여 이미지 스토리지 서버를 따로 두어 관리하는 방향을 잡게 되었습니다.


## 이미지 스토리지 서버

이미지 스토리지 서버는 *MVP*로 개발했기 때문에 아래의 두 가지 기능만을 제공하고 있었습니다.

- 이미지를 업로드한다.
- 이미지를 제공한다.

따라서 업로드할 수 있는 WAS와 업로드된 이미지를 제공할 수 있는 WS를 구축하였습니다.

> MVP(Minimum Viable Product): 고객의 피드백을 받아 최소한의 기능(features)을 구현한 제품

![이미지 서버 구조](https://user-images.githubusercontent.com/63030569/189909124-76ed1d7c-bab4-4f24-9bfe-526f70502f7c.png)

인증된 사용자만 사용할 수 있게끔 다른 처리는 해두었지만, 대체적인 구조는 위와 같습니다.

```java
// image upload api
@PostMapping("/api/image-upload")  
public ResponseEntity<String> uploadImage(@RequestPart MultipartFile file) {  
  
    ImageSaveResponse imageSaveResponse = imageService.storeImage(file);  
    return ResponseEntity.ok(imageSaveResponse.getImagePath());  
}
```

이렇게 이미지에 대한 `MultipartFile`을 받아 image storage에 저장하는 api를 요청하면, 이미지를 저장하고 해당하는 이미지에 대한 path를 전달받습니다. 앞으로는 해당 path를 통해서 이미지를 전달받을 수 있는 거죠.

<br>

```nginx
server {
	server_name image.gongcheck.shop;

	location /images {
		alias /home/ubuntu/images/;
	}

	# ...
```

전달받은 이미지 path는 WS(nginx)에서 지정된 경로에 맞는 이미지를 반환해줌으로써 이미지 서버 구성이 완료되었습니다.


## 단순 이미지 업로드 서버로서의 문제점

위의 이미지 서버는 단순히 `이미지 업로드`와 `이미지 제공`만을 담당하고 있습니다. 잘 운영되고 있다는 생각 중에 운영상황에서 문제를 발견합니다.

> 원본 이미지를 저장하다보니 이미지의 크기가 너무 커서 이미지 로딩 시간이 너무 길다.


![](https://user-images.githubusercontent.com/63030569/189908680-be9385ce-e346-4dcc-8caa-dabe313beb47.png)


위 이미지에서 이미지에 따라 차이가 나기는 하지만 최대 `8.59s`가 걸리는 것은 사용자 측면에서 큰 불편함이었습니다. 다만 현재의 문제가 네트워크 환경의 문제인지 이미지 자체의 문제인지 판단하지 못했기 때문에 객관적인 기준을 잡기 힘들었습니다.

따라서 프론트 팀에서 사용하는 성능분석 도구인 `lighthouse`를 통해 확실한 지표를 확인해보았습니다.

![](https://user-images.githubusercontent.com/63030569/189908706-708a42d8-05c0-49f0-bd6e-c33dff1b7305.png)

![](https://user-images.githubusercontent.com/63030569/189909707-54e3d097-b0c8-4b74-b58b-dd58a03f964f.png)

여러가지 지표가 있지만 이미지 관련 지표를 보면 다음과 같습니다.

- 이미지의 크기를 사용하는만큼 줄여서 사용하여야 한다.
- 이미지 파일 형식을 webp로 전환하여야 한다.

> WebP: 웹사이트의 트래픽 감소 및 시간 단축을 겨냥해 만들어진 이미지 포맷으로, 2010년 9월 구글이 공개하였다.

화면에 필요한 만큼의 이미지 해상도가 아닌 원본을 사용하기 때문에 이미지를 최적화하여 전달받아야 조금 더 빠르다는 것입니다. 또한 기존의 이미지를 webp 확장자로 변환하여 더 좋은 이미지 압축률을 가진 파일 형식을 제공하도록 하자라는 것이죠.

<br>

정확한 리포트를 전달받았으니 이제는 서버를 고칠 차례입니다. 이미지를 업로드할 때부터 이미지 크기를 변환하게 되면 차후 새로운 해상도가 필요할지 모르니 업로드는 원본 해상도를 유지하여야 합니다. 그래서 저희 팀에서는 WAS에서 이미지 크기를 줄이고, webp 확장자로 변환하여 반환하는 구조를 구상하였습니다.

![](https://user-images.githubusercontent.com/63030569/189910301-c77ad999-3aa5-4091-a258-781778389142.png)

<br>

```java
@GetMapping("/api/resize/{imageUrl}")  
public ResponseEntity<byte[]> getResizeImage(@PathVariable String imageUrl,  
                                             @RequestParam(required = false, defaultValue = DEFAULT_RESIZE_WIDTH) int width,  
                                             @RequestParam(required = false, defaultValue = DEFAULT_WEBP) boolean webp) {  
    ImageResponse response = imageService.resizeImage(imageUrl, width, webp);  
    return ResponseEntity.ok()  
            .contentType(response.getContentType())  
            .body(response.getBytes());  
}
```

변경하고자 하는 가로축의 비율을 받고, webp로 변환하여 반환할 것인지를 선택할 수 있는 api입니다. 여기에서 webp에 대한 반환 여부를 넣은 이유는 브라우저마다 [호환 여부](https://caniuse.com/webp)가 다른데요. 프론트 페이지에서 이를 판단하여 호환되는 곳에서만 webp를 반환하게 하기 위함입니다.

webp와 관련된 변환 로직은 대표적으로는 2가지가 있습니다. [C로 작성된 코덱 파일](https://chromium.googlesource.com/webm/libwebp)을 이용하여 활용하는 방법과 이를 래핑한 바이너리 파일을 실행하는 방법인데요. 해당 api 내에서는 바이너리 파일을 실행하는 방법을 사용하였으며 본 포스팅에서는 다루지 않습니다.

<br>

이제 이미지 크기에 따른 문제를 해결한 것처럼 보입니다. 이미지도 잘 업로드하고 있고, 이미지 크기에 맞게 최적화된 이미지를 전달해주고 있기 때문입니다. 다만 이미지 리사이징을 겪게 되면서 한가지 문제가 발생합니다.

> 이미지를 제공하고자할 때 항상 WAS에서 이미지를 처리해주어서 반환한다.
> WS에서 정적인 이미지를 제공할 때보다 WAS에서 이미지를 처리해주어서 제공하게 되므로 여러 사용자가 같은 이미지를 반환하고자할 때 불필요한 로직이 발생되는 것으로 보인다.

WS까지 사용할 때와는 달리 WAS에서 이미지를 리사이징해서 반환해주게 되므로 항상 리사이징 로직을 발생시킵니다. 서비스 사용 시 사용자가 같은 화면을 보는 경우 사진을 굳이 리사이징해줄 필요가 없으므로 이를 처리해주어야 하는 것이죠.

## 이미지 서버 최적화

이러한 상황을 해결하고자 캐싱과 etag를 적용하였습니다.

### nginx를 이용한 캐싱

이미지 리사이징을 적용하면서 WS를 제거하였지만, WS를 다시 도입하게 되었습니다. Nginx의 reverse proxy cache를 활용하기 위해서입니다.

Nginx에서는 특정 요청에 대해서 중간에 처리를 해줄 수 있는 reverse proxy 서버와 처리된 요청을 캐싱할 수 있는 기능을 제공합니다. 이를 이용하여 저희는 WAS에서 넘어오는 요청을 Nginx에서 캐싱하도록 수정하였습니다.

![](https://user-images.githubusercontent.com/63030569/189910905-1be63822-2caf-4a80-9950-2299db7ede55.png)

(4)에서 캐싱 된 이미지는 차후 캐싱 값이 존재한다는 가정하에, 같은 요청이 들어오게 되더라도 WAS까지 가지 않고 바로 Nginx에서 처리해줄 수 있습니다.

```nginx
proxy_cache_path /home/ubuntu/cache levels=1:2 keys_zone=my_zone:20m inactive=60m;
proxy_cache_key "$scheme$request_method$host$request_uri";

server {
	server_name image.gongcheck.day;

	location ~* ^/images/(.*)\.(?:png|gif|jpg|jpeg)$ {
		rewrite ^/images/(.*)$ /api/resize/$1 break;

		proxy_cache my_zone;
        add_header X-Proxy-Cache $upstream_cache_status;
		expires 1M;

        include /etc/nginx/proxy_params;
		proxy_pass http://localhost:8080;
	}
	
	#...
```

간단하게 저희팀에서 사용하는 nginx의 conf를 살펴보겠습니다.

- proxy_cache_path : reverse proxy에서의 응답값을 캐싱할 path에 대한 설정입니다. 얼마만큼을 캐싱할 지, 어디를 캐싱할 지 등을 설정할 수 있습니다.
- proxy_cache_key : 캐싱할 요청의 key입니다. 동일한 요청의 key라면 캐싱된 값을 반환하기 위한 목적입니다.
- location : 원하는 경로의 이미지 확장자에 대한 값을 사용합니다.
- rewrite : WAS 로 전달하기 위해 요청을 api 스펙에 맞게 수정하여 reverse proxy 요청합니다.
- add_header X-Proxy-Cache : header에 cache 상태를 반환합니다.
- proxy_pass : reverse proxy 전달할 서버 url입니다.


이렇게 Nginx에서 reverse proxy에 대한 캐싱을 통해서 자주 요청되는 이미지에 대해서 불필요한 WAS로의 요청을 금지할 수 있게 되었습니다.


### Http Header를 이용한 캐싱 적용

이미지는 브라우저단에서 캐싱 되어 사용될 수도 있습니다. 현재 정적 파일에 대해 필요한 범위에 따라 `Cache-Control`을 조절하여 브라우저에서 어떻게 캐싱하여 사용할 것인지를 판별할 수 있습니다.

```
Cache-control: must-revalidate
Cache-control: no-cache
Cache-control: no-store
Cache-control: no-transform
Cache-control: public
Cache-control: private
Cache-control: proxy-revalidate
Cache-Control: max-age=<seconds>
Cache-control: s-maxage=<seconds>
```

(출처 : https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/Cache-Control)

개발된 이미지 서버의 경우 "이미지" 파일의 경우 수정될 가능성이 크게 없다 보니 `no-cache`를 두지 않으며 다만 캐싱에 대한 만료 시간을 `max-age`로 담아두었습니다. 이미지는 수정될 일이 크게 없기 때문에 인메모리에 오래 담아두어도 되지만 최소한의 갱신 기간을 둔 것입니다.

여기서 조금 더 나아가서는 "`max-age`로 설정된 값을 다시 요청할 아직 삭제되지 않았다면?"입니다. 만료 시간이 다 되어 브라우저에서 이미지에 대한 요청을 다시 진행할 때 굳이 WS가 이미지를 요청하지 않아도 되는 방법이 있습니다. 바로 `etag`를 사용하는 거죠.

이미지마다 `etag`를 만들어서 반환한다면 이미지에 대한 특정 식별자가 생깁니다. 이 식별자는 HTTP 통신 시 식별자의 컨텐츠가 변경되었는지 확인하고 이를 알려주는 역할을 해요. 이렇게 WAS에서 요청마다 이미지에 대한 반환 값으로 `etag`를 달아서 주게 되면, `max-age`가 지난 후에 다시 요청하게 될 때 수정되지 않은 컨텐츠로 판단하고 304 응답 헤더값을 전달해줍니다. 불필요한 요청을 더 막을 수 있게 해주는 역할입니다.

## 개선된 결과물

![](https://user-images.githubusercontent.com/63030569/189909738-c70f77f1-46de-4eda-ae19-b2155f8d7dbb.png)

글 초반부에서 이미지가 최악의 상황에는 8초가 걸렸던 것을 기억하시나요?

이미지 서버에 대한 최적화의 과정으로 빨라도 1초가 걸리던 이미지 로딩 시간이 매우 짧아진 것을 볼 수 있습니다. 이미지 리사이징 / 캐싱 / webp 전환 등의 복합적인 최적화 과정이 좋은 결과물을 만들어 낸 것이라고 생각이 듭니다.


## 마무리

많은 개선이 이루어졌지만, 아직도 풀어나가야 할 과제들이 많습니다. 하나의 인스턴스 내에 WS와 WAS가 공존하고 있어서 이를 분리해야 하고, 이미지 스토리지를 확장하게 된다면 어떻게 경로 설정을 하고 캐싱을 할 것 인지 등이 있을 것 같아요.

그래서 아직 많이 부족한 글이지만 지금까지의 개발한 이미지 서버에 관한 내용들이 새롭게 이미지 서버를 개발하는 분들에게 도움이 되었으면 좋겠습니다. 감사합니다 🙇‍♂️

## 참고 자료

- [MDN - Cache-Control Header](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/Cache-Control)
- [Nginx - Reverse Proxy with Caching](https://www.nginx.com/resources/wiki/start/topics/examples/reverseproxycachingexample/)
- [이동욱님 블로그 - Nginx Cache 문제 해결 시리즈](https://jojoldu.tistory.com/60)
- [AWS - Caching](https://aws.amazon.com/ko/caching/)

