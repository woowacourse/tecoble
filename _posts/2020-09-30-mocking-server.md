---
layout: post
title: "외부 서버와의 통신을 테스트해보자"
author: "유안"
comment: "true"
tags: ["test"]
toc: true
---

메일을 주고 받을 때, RSS 피드를 읽어올 때, 크롤링을 할 때 등등 개발을 하다보면 외부서버와 연동되는 동작을 해야 할 때가 있습니다.
이러한 동작은 대부분 라이브러리를 통해 구현 하므로 라이브러리를 믿고 테스트 없이 사용하는 경우가 많습니다.

하지만 라이브러리의 함수 하나하나는 믿을 수 있을 지 몰라도 대부분 라이브러리의 여러 함수를 조합해서 사용하게 됩니다.
내가 작성한 코드는 작동한다고 장담할 수 없으며 테스트를 할 필요가 있습니다.

다음은 RSS Feed를 읽어오는 간단한 코드입니다.
이 코드에 대한 테스트를 직접 작성해보며 어떻게 테스트 해야할 지 알아보겠습니다.
```java
public class RssFeedReader {

    public SyndFeed readFeed(String rssUrl) {
        try {
            URL url = new URL(rssUrl);
            XmlReader reader = new XmlReader(url);
            return new SyndFeedInput().build(reader);
        } catch (FeedException | IOException e) {
            throw new FailToReadFeedException();
        }
    }
}
```  

## 직접 외부 서버와 통신

외부 서버와의 연동을 테스트하기 가장 쉬운 방법은 직접 외부서버와 통신해보는 것입니다.
직접 PostMan 등을 통해 요청과 응답을 확인하고, 테스트에서 같은 값이 나오는지 확인해보면 됩니다.
다음은 제가 즐겨보는 블로그의 RSS피드를 직접 읽어보는 테스트입니다.
제가 미리 직접 통신 해서 얻은 값을 상수화해서 검증에 활용했습니다.

```java
class RssFeedReaderTest {

    @DisplayName("피드 읽어오기 테스트")
    @Test
    void readFeed() {
        RssFeedReader rssFeedReader = new RssFeedReader();
        SyndFeed syndFeed = rssFeedReader.readFeed("https://jojoldu.tistory.com/rss");
        List<SyndEntry> entries = syndFeed.getEntries();

        assertAll(
            () -> assertThat(syndFeed.getLink()).isEqualTo("https://jojoldu.tistory.com/"),

            () -> assertThat(entries.get(0).getTitle()).isEqualTo(POST_ONE_TITLE),
            () -> assertThat(entries.get(0).getLink()).isEqualTo(POST_ONE_LINK),

            () -> assertThat(entries.get(1).getTitle()).isEqualTo(POST_TWO_TITLE),
            () -> assertThat(entries.get(1).getLink()).isEqualTo(POST_TWO_LINK)
        );
    }

}
```

그런데 위와 같은 방법에는 문제가 있습니다.
우선 외부 서버의 값이 바뀔 때마다 테스트 코드를 변경해주어야 하는 문제가 있습니다.
검증에 제가 피드를 직접 확인한 값을 사용하고 있으니, 블로그 피드가 업데이트 될때마다 테스트는 깨질 것입니다.

또한 테스트에 사용하는 블로그 서버가 항상 잘 운영될 거라는 보장이 없습니다.
현재 티스토리 블로그에 요청을 보내고 받고 있는데, 티스토리 서버가 다운되면 저희 테스트도 실패할 것입니다.

## 외부 서버를 Mocking

직접 외부서버와 통신해서 테스트하는 것은 위에서 이야기 한 것 처럼 문제가 있습니다.
내가 작성한 코드는 변경하지 않았는데, 테스트의 결과가 외부 환경에 의존해 바뀔 수 있는 것은 바람직하지 못합니다.
테스트가 외부에 의존하지 않도록 내부적으로 서버와의 통신을 Mocking하는 것은 좋은 해결방법이 될 수 있습니다.

외부 서버를 Mocking하는 방법은 여러가지가 있습니다.
이 글에서는 [MockServer](https://www.mock-server.com/)를 이용하는 코드를 소개하겠습니다.
개인적으로 [MockServer](https://www.mock-server.com/)는 사용법이 간단하며 레퍼런스도 많아 처음 사용해보기 좋은 방법이라고 생각합니다.  

주의해야 할 점은 ClientAndServer 객체를 이용해서 mockServer를 키고 끄는 것을 테스트의 시작과 끝에 해주어야 하는 것입니다.
그리고 서버를 키고 끄는 것은 ClientAndServer 객체를 이용했지만, 요청과 응답에 관한 설정은 MockServerClient 객체에서 해주는 것도 주의해야 합니다.
그 외 사항은 아래 코드를 보면 쉽게 이해할 수 있습니다.

```java
class RssFeedReaderTest {

    private ClientAndServer mockServer;

    @BeforeEach
    void setUp() {
        mockServer = ClientAndServer.startClientAndServer(8888);
        new MockServerClient("localhost", 8888)
            .when(
                request()
                    .withMethod("GET")
                    .withPath(BLOG_RSS_PATH)
            )
            .respond(
                response()
                    .withHeader(new Header("Content-Type", "text/xml;charset=utf-8"))
                    .withBody(RSS_FEED_RESPONSE)
            );
    }

    @AfterEach
    void shutDown() {
        mockServer.stop();
    }

    @DisplayName("피드 읽어오기 테스트")
    @Test
    void readFeed() {
        RssFeedReader rssFeedReader = new RssFeedReader();
        SyndFeed syndFeed = rssFeedReader.readFeed("http://localhost:8888/rss");
        List<SyndEntry> entries = syndFeed.getEntries();

        assertAll(
            () -> assertThat(syndFeed.getLink()).isEqualTo("http://localhost:8888"),

            () -> assertThat(entries.get(0).getTitle()).isEqualTo(POST_ONE_TITLE),
            () -> assertThat(entries.get(0).getLink()).isEqualTo(POST_ONE_LINK),

            () -> assertThat(entries.get(1).getTitle()).isEqualTo(POST_TWO_TITLE),
            () -> assertThat(entries.get(1).getLink()).isEqualTo(POST_TWO_LINK)
        );
    }
}
```

이제 블로그에 글이 올라오는 것과 관계 없이, 티스토리 서버의 상태에 관계 없이 항상 일정하게 동작을 검증해주는 테스트가 가능합니다.
[MockServer](https://www.mock-server.com/)를 이용하는 더 다양한 방법에 대해 알아보고 싶으시면, [공식 홈페이지](https://www.mock-server.com/)를 보시면 될 것 같습니다.

## 외부 서버를 Mocking하는 다양한 방법

MockServer를 이용하는 것 말고도 외부서버를 Mocking하는 방법은 여러가지가 있습니다.
만약 RestTemplate을 이용해서 외부 API를 사용하고 계신다면 [Spring Boot에서 외부 API 테스트하기](https://jojoldu.tistory.com/341)에 소개된 방법을 사용하는 것도 좋습니다.
또한 (외부 API를 어떻게 테스트 할 것인가?)[https://velog.io/@kyle/%EC%99%B8%EB%B6%80-API%EB%A5%BC-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%95%A0-%EA%B2%83%EC%9D%B8%EA%B0%80]에 소개된 방법도 괜찮습니다.

