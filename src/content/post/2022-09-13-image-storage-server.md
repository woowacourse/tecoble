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

기존에 이미 RDB를 사용하고 있었기 때문에 이미지 데이터를 단순히 binary로 전환하여 RDB에 저장하는 방법을 고려했었습니다. 다만 아래의 문제점이 거론되었어요.

- binary 로 관리하게 되는 경우 너무 큰 데이터 파일로 인하여 관리가 힘들다.
- binary의 크기가 크기 때문에 입출력 시 database에 병목현상이 발생하여 다른 데이터에 영향을 준다.

저희 팀에서는 이런 문제점을 고려하여 이미지 스토리지 서버를 따로 두어 관리하는 방향을 잡게 되었습니다.


## 이미지 스토리지 서버

이미지 스토리지 서버는 *MVP*로 개발했기 때문에 아래의 두 가지 기능만을 제공하고 있었습니다.

- 이미지를 업로드한다.
- 이미지를 제공한다.

따라서 업로드할 수 있는 웹 애플리케이션 서버(WAS)와 업로드된 이미지를 제공할 수 있는 웹 서버(WS)를 구축하였습니다.

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

이미지 파일을 HTTP 메시지 바디에 담아 이미지를 업로드하는 API를 호출하면, 서버에서는 `MultipartFile` 타입으로 이미지를 받아 저장하고, 이미지의 경로를 반환합니다. 이후에는 해당 경로를 통해 이미지를 요청하게 됩니다.

<br>

```nginx
server {
	server_name image.gongcheck.shop;

	location /images {
		alias /home/ubuntu/images/;
	}

	# ...
```

WS(nginx)에서는 요청받은 이미지 경로를 통해 이미지를 반환합니다.


## 단순 이미지 업로드 서버로서의 문제점

위의 이미지 서버는 단순히 `이미지 업로드`와 `이미지 제공`만을 담당하고 있습니다. 잘 운영되고 있다는 생각 중에 운영상황에서 문제를 발견합니다.

> 원본 이미지를 저장하다보니 이미지의 크기가 너무 커서 이미지 로딩 시간이 너무 길다.


![](https://user-images.githubusercontent.com/63030569/189908680-be9385ce-e346-4dcc-8caa-dabe313beb47.png)

위 스크린샷은 저희 서비스에서 여러 이미지 파일을 요청하는 페이지를 요청할 때 걸리는 시간들을 나타내고 있습니다.

위처럼 로딩하는데 최대 `8.59 초`까지 걸리는 이미지도 존재합니다. 이 문제가 단순히 네트워크 환경의 문제인지 이미지 크기의 문제인지 객관적으로 판단하기 위해 웹 페이지 성능 분석 도구인 `lighthouse`를 통해 확실한 지표를 확인해보았습니다.

![](https://user-images.githubusercontent.com/63030569/189908706-708a42d8-05c0-49f0-bd6e-c33dff1b7305.png)

![](https://user-images.githubusercontent.com/63030569/189909707-54e3d097-b0c8-4b74-b58b-dd58a03f964f.png)

여러 지표 중 이미지와 관련된 지표를 보면 다음과 같습니다.

- 이미지의 크기를 사용하는만큼 줄여서 사용하여야 한다.
- 이미지 파일 형식을 *webp*로 전환하여야 한다.

> WebP: 웹사이트의 트래픽 감소 및 시간 단축을 겨냥해 만들어진 이미지 포맷으로, 2010년 9월 구글이 공개하였다.

화면에 필요한 만큼의 크기가 아니라 원본 이미지의 크기를 그대로 사용하기 때문에 이미지를 최적화하여 전달받아야 조금 더 빠르다는 것입니다. 또한 기존의 이미지를 webp 확장자로 변환하여 더 좋은 이미지 압축률을 가진 파일 형식을 제공하도록 하자라는 것이죠.

<br>

정확한 리포트를 전달받았으니 이제는 서버를 고칠 차례입니다. 클라이언트에게 하나의 이미지 파일에 대해 여러가지 크기의 이미지를 제공할 수 있도록 서버 내부에는 원본 이미지 파일을 저장한 후, 클라이언트가 요청한 크기에 맞게 이미지를 변환하여 webp 확장자로 반환하도록 설계했습니다.

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

변경하고자 하는 크기의 가로 길이를 입력받고, webp로 변환할지 말지 여부를 입력받습니다. 여기에서 webp에 대한 반환 여부를 넣은 이유는 브라우저마다 [호환 여부](https://caniuse.com/webp)가 다른데요. 프론트 페이지에서 이를 판단하여 호환되는 곳에서만 webp를 반환하게 하기 위해 이렇게 API를 설계했습니다.

webp와 관련된 변환 로직은 대표적으로는 2가지가 있습니다. [C로 작성된 코덱 파일](https://chromium.googlesource.com/webm/libwebp)을 이용하여 활용하는 방법과 이를 래핑한 바이너리 파일을 실행하는 방법인데요. 해당 api 내에서는 바이너리 파일을 실행하는 방법을 사용하였으며 본 포스팅에서는 다루지 않습니다.

<br>

이제 이미지 크기로 인한 문제를 해결했습니다. 이미지도 잘 업로드하고 있고, 이미지 크기에 맞게 최적화된 이미지를 전달해주고 있기 때문입니다. 그러나 클라이언트가 이미지를 요청할 때마다 크기를 변환하는 로직을 수행해야한다는 새로운 문제가 발생하였습니다.

## 이미지 서버 최적화

이러한 문제를 해결하고자 캐싱과 etag를 적용하였습니다.

### nginx를 이용한 캐싱

저희 팀은 Nginx의 reverse proxy cache 기능을 활용하기로 결정했습니다.

Nginx에서는 특정 요청에 대해서 중간에 처리를 해줄 수 있는 reverse proxy 서버와 처리된 요청을 캐싱할 수 있는 기능을 제공합니다. 이를 이용하여 저희는 WAS에서 반환된 자원을 Nginx에 캐싱하도록 만들었습니다.

![](https://user-images.githubusercontent.com/63030569/189910905-1be63822-2caf-4a80-9950-2299db7ede55.png)

(4)에서 캐싱된 이미지는 이후 같은 요청이 들어올 때, WAS까지 가지 않고 바로 Nginx에서 처리해줄 수 있습니다.

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

- proxy_cache_path : 캐싱할 데이터를 저장할 경로를 설정합니다. 데이터를 저장할 크기, 캐시 레벨 등을 설정할 수 있습니다.
- proxy_cache_key : 캐싱할 요청의 key입니다. 동일한 key라면 동일한 값을 반환합니다.
- location : 유저가 요청한 URI를 원하는 경로로 매핑하기 위한 설정을 정의합니다.
- rewrite : WAS로 전달하기 위해 요청을 api 스펙에 맞게 수정하여 reverse proxy 요청합니다.
- add_header X-Proxy-Cache : header에 cache 상태를 반환합니다.
- proxy_pass : reverse proxy 전달할 서버 url입니다.


이렇게 Nginx의 reverse proxy cache를 활용하여 불필요한 요청이 WAS로 넘어가지 않도록 만들었습니다.


### Http Header를 이용한 캐싱 적용

이미지는 브라우저단에서 캐싱되어 사용될 수도 있습니다. 현재 정적 파일에 대해 필요한 범위에 따라 `Cache-Control`을 조절하여 브라우저에서 어떻게 캐싱하여 사용할 것인지를 판별할 수 있습니다.

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

저희 서비스의 경우 이미지 파일이 수정될 일이 거의 없기 때문에 `no-cache` 값을 사용하지 않고 `max-age`로 최소한의 갱신 기간만 설정하였습니다.

만료 기간이 다 되었을 경우 WAS로 다시 리소스를 요청하게 됩니다. 하지만 만료 기간이 다 되었음에도 리소스에 변경 사항이 없다면 어떨까요? 굳이 WAS로 다시 요청할 필요 없이 브라우저에 캐시된 값을 사용하도록 만들면 됩니다. `etag`를 사용하면 이를 구현할 수 있습니다.

이미지마다 `etag`를 만들어서 반환한다면 이미지에 대한 특정 식별자가 생깁니다. HTTP 통신 시 해당 식별자의 컨텐츠가 변경되었는지 아닌지를 판단할 수 있습니다. 이렇게 WAS에서 이미지에 대한 반환 값으로 `etag`를 달아주면, `max-age`가 지난 후에 다시 요청이 올 때, 만약 해당 컨텐츠가 수정되지 않았다면 WS가 304 응답을 통해 브라우저의 캐시를 사용하도록 만들 수 있습니다.

## 개선된 결과물

![](https://user-images.githubusercontent.com/63030569/189909738-c70f77f1-46de-4eda-ae19-b2155f8d7dbb.png)

글 초반부에서 이미지가 최악의 상황에는 8초가 걸렸던 것을 기억하시나요?

이미지 스토리지 서버 최적화를 통해 평균적으로 초 단위가 걸리던 응답을 10ms대로 줄일 수 있었습니다.


## 마무리

많은 개선이 이루어졌지만, 아직도 풀어나가야 할 과제들이 많습니다. 하나의 인스턴스 내에 WS와 WAS가 공존하고 있어서 이를 분리해야 하고, 이미지 스토리지를 확장하게 된다면 어떻게 경로 설정을 하고 캐싱을 할 것 인지 등을 고민해야할 것 같습니다.

아직 많이 부족한 글이지만 새롭게 이미지 서버를 개발하는 분들에게 도움이 되었으면 좋겠습니다. 감사합니다 🙇‍♂️

## 참고 자료

- [MDN - Cache-Control Header](https://developer.mozilla.org/ko/docs/Web/HTTP/Headers/Cache-Control)
- [Nginx - Reverse Proxy with Caching](https://www.nginx.com/resources/wiki/start/topics/examples/reverseproxycachingexample/)
- [이동욱님 블로그 - Nginx Cache 문제 해결 시리즈](https://jojoldu.tistory.com/60)
- [AWS - Caching](https://aws.amazon.com/ko/caching/)

