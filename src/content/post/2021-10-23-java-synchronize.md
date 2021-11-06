---
layout: post
title: '🔒 Java 로 동기화를 해보자!'
author: [3기_와일더]
tags: ['java', 'synchronized', 'monitor']
date: '2021-10-23T12:00:00.000Z'
draft: false
image: ../teaser/java-monitor.png
---

이 글에서는 상호배제를 통한 동기화를 알아볼 것이다.
동기화는 프로세스(스레드)가 수행되는 시점을 조절하여 서로가 알고 있는 정보가 일치하는 것인데, 쉽게 말해 프로세스 간 데이터가 일치하도록 하는 것이다. 이러한 동기화 메커니즘인 상호배제는 프로세스들이 필요로 하는 자원에 대해 배타적인 통제권을 요구하는 것이다. 쉽게 말해 하나의 프로세스가 공유자원을 사용할 때 다른 프로세스가 동일한 공유자원에 접근할 수 없도록 통제하는 것을 뜻한다. 상호배제 방법으로는 Mutex, Semaphore 방식이 사용된다. Java 에서는 Monitor 라는 도구를 통해 객체에 Lock 을 걸어 상호배제를 할 수 있다. Monitor 를 사용하면 어떤 점이 좋은지 알아보고 직접 사용해보자.

먼저 Mutex, Semaphore 개념을 간단하게 살펴보자.



## Mutex

여러 스레드를 실행하는 환경에서 자원에 대한 접근에 제한을 강제하기 위한 동기화 메커니즘이다. 특징을 살펴보면 다음과 같다.

- Boolean 타입의 Lock 변수를 사용한다. 따라서 1개의 공유자원에 대한 접근을 제한한다.
- 공유자원을 사용 중인 스레드가 있을 때, 다른 스레드가 공유자원에 접근한다면 Blocking 후 대기 큐로 보낸다.
- Lock 을 건 스레드만 Lock 을 해제할 수 있다.



## Semaphore

멀티프로그래밍 환경에서 다수의 프로세스나 스레드가 n 개의 공유 자원에 대한 접근을 제한하는 방법으로 사용되는 동기화 기법이다.

- 세마포어 변수를 통해 wait, signal 을 관리한다. 세마포어 변수는 0 이상의 정수형 변수를 갖는다.
- n 개의 공유자원에 대한 접근을 제한할 수 있으며 이를 계수 세마포어라고 한다.
- 접근 가능한 공유 자원의 수가 1개일 때는 이진 세마포어로 뮤텍스처럼 사용할 수 있다.
- 큐에 연결된 스레드를 깨우는 방식에 따라 강성 세마포어(큐에 연결된 스레드를 깨울 때 FIFO 정책), 약성 세마포어(큐에 연결된 스레드를 깨울 때 순서를 특별히 명시하지 않음)로 구분된다.
- Lock 을 걸지 않은 스레드도 Signal 을 보내 Lock 을 해제할 수 있다.



## 동기화 메커니즘

Mutex, Semaphore 는 상호배제를 위한 동기화 개념이다. Framework, Library 에서는 이 개념을 바탕으로 구현된 상호배제 도구를 제공한다. 물론 C 언어 같은 언어는 제공하지 않기 때문에 직접 코드를 구현해야 하는 번거로움이 있다. 또한 Semaphore 는 완벽한 상호배제를 제공한다고 할 수 없기 때문에 이를 보완까지 해둔 Monitor 를 사용하면 훨씬 쉽게 동기화를 사용할 수 있다.



## Monitor

임계 구역을 지켜내기 위한 방법인 상호 배제를 프로그램으로 구현한 것이다. 세마포어는 wait & signal 연산 순서를 바꿔서 실행하거나 둘 중 하나라도 생략하면 상호배제를 위반하는 상황이나 교착 상태가 발생한다. wait & signal 연산이 프로그램 전체에 구성되어 있으면 세마포어의 영향이 미치는 곳이 어딘지 파악하기 어렵기 때문에 세마포어를 사용하여 프로그램을 구현하기 어렵다. 이러한 단점을 극복하기 위해 모니터가 등장했다. 모니터는 프로그래밍 언어 수준에서 제공된다. 대표적으로 Java 에서 제공한다. 순차적으로 사용할  수 있는 공유 자원 혹은 공유 자원 그룹을 할당하는 데 사용된다. 모니터는 이진 세마포어만 가능하다. 모니터를 통해 프로세스가 자원에 접근하는 방식을 이미지로 보면 아래와 같다.

![image](https://user-images.githubusercontent.com/49058669/138542983-2f7517e3-94e1-4086-8084-f11a4d2345cc.png)

공유 자원에 점유 중인 프로세스(스레드)는 Lock 을 가지고 있다. 공유 자원을 점유 중인 프로세스(스레드)가 있는 상황에서 다른 프로세스(스레드)가 공유 자원에 접근하려고 하면 외부 모니터 준비 큐에서 진입을 `wait` 한다. Monitor 는 Semaphore 처럼 signal 연산을 보내는  것이 아니라 조건 변수를 사용하여 특정 조건에 대해 대기 큐에 signal 을 보내 작업을 시작시킨다.



## Synchronized

Java 의 `synchronized` 키워드는 스레드 동기화를 할 때 사용하는 대표적인 기법이다. 자바의 모든 인스턴스는 Monitor 를 가지고 있으며(Object 내부) Monitor 를 통해 Thread 동기화를 수행한다. `synchronized` 키워드가 붙은 메서드를 사용하려면 Lock 을 가지고 있어야 한다.

`synchronized` 를 사용하는 방법으로는 메서드 앞에 키워드 명시, 인스턴스로 사용하기가 있다. 동기화가 필요한 메서드 앞에 `synchronized` 키워드만 붙여주면 편리하게 동기화를 적용할 수 있다. 인스턴스로 사용하려면 메서드 내부에서 `synchronized (메서드) { 구현 }` 으로 사용할 수 있다.



## wait, notify

Monitor 에는 Condition Variable 이 있는데 이를 통해 `wait()`, `notify()` 메서드가 구현되어 있다.

Lock 을 가진 스레드가 다른 스레드에 Lock 을 넘겨준 이후에 대기해야 한다면 `wait()` 를 사용하면 된다. 그리고 대기 중인 임의의 스레드를 깨우려면 `notify()` 를 통해 깨울 수 있다. 대기 중인 모든 스레드를 깨우려면 `notifyAll()` 을 통해 깨울 수 있는데, 이 경우에는 하나의 스레드만 Lock 을 획득하고 나머지 스레드는 다시 대기 상태에 들어간다.



## 동기화를 경험해 보자!

먼저 `synchronized` 를 이용한 메서드 동기화와 블럭 동기화를 살펴본다.

이 브라우저의 특징을 살펴보자.

- 최대 5개의 탭이 활성화될 수 있다.
- 6개 이상의 탭이 동시에 켜지게 되면 브라우저가 강제 종료된다.
- 새로운 탭이 켜지는 시간은 0~1초가 걸린다.
- 새로운 탭이 켜지는 로딩시간 동안은 현재 활성화된 탭 수가 변경되지 않는다.
  - 브라우저 로딩이 끝난 후(1초 후) 탭 수가 갱신된다는 뜻이다. (4개 -> 새로운 탭 로딩(1초) -> 1초 후 5개)
  - 즉, 로딩 중에 새로운 탭이 '아직 4개밖에 활성화되지 않았네?' 라고 판단하고 새로운 탭이 또 켜질 수 있다는 뜻이다.

비동기(결과를 주기 전에 다른 작업이 이루어지는 것)로 처리가 된다면 새로운 탭이 추가되기 위해 로딩 중인 상황에서 또 다른 탭이 추가되는 것을 시도한다면 곧이어 강제 종료가 되는 상황이 발생하는 것을 알 수 있다. 그 때문에 새로운 탭이 추가되는 상황에는 다른 탭이 추가되는 작업을 막을 필요가 있다.

### 세 개의 클래스를 준비한다.

동기화, 비동기화 상태에 따라 스레드가 어떻게 동작하는지 알아보는 실습이므로 아래 코드를 복사해서 사용하면 된다.

```java
public class Computer {

    public static void main(String[] args) {
        final WebBrowser webBrowser = new WebBrowser(5);

        final Thread threadA = new Thread(new WebSite("Google", webBrowser));
        final Thread threadB = new Thread(new WebSite("Naver", webBrowser));
        final Thread threadC = new Thread(new WebSite("Daum", webBrowser));

        threadA.start();
        threadB.start();
        threadC.start();
    }
}

public class WebSite implements Runnable {

    private final String webSiteName;
    private final WebBrowser webBrowser;

    public WebSite(final String webSiteName, final WebBrowser webBrowser) {
        this.webSiteName = webSiteName;
        this.webBrowser = webBrowser;
    }

    @Override
    public void run() {
        // 메서드 블럭 동기화
        synchronized (this) {
            while (webBrowser.hasSpace()) {
                try {
                    Thread.sleep(new Random().nextInt(1000));
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                webBrowser.createNewTab(webSiteName);
            }
        }
    }
}

public class WebBrowser {

    private static final String SPACE = " ";
  
    private final List<String> webSiteNames = new ArrayList<>();
    private final int maxWebCount;

    public WebBrowser(final int maxWebCount) {
        this.maxWebCount = maxWebCount;
    }

    // 메서드 동기화
    public synchronized void createNewTab(final String webSiteName) {
        try {
            if (full()) {
                return;
            }
            System.out.println(webSiteName + " 사이트가 켜지는 중입니다...");
            Thread.sleep(new Random().nextInt(1000));
            webSiteNames.add(webSiteName);
            showRunningBrowser();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    private void showRunningBrowser() {
        if (webSiteNames.size() > maxWebCount) {
            throw new UnsupportedOperationException("현재 브라우저 탭이 6개 이상 활성화 되어 강제 종료합니다...");
        }

        System.out.println("┌───────────────────────────────────────────────────────────────────────────────┐");
        System.out.println("│ ◆ Wilder Web Browser                                                    - □ x │");
        System.out.println("└───────────────────────────────────────────────────────────────────────────────┘");

        StringBuilder browserNameLine = new StringBuilder();
        StringBuilder browserUnderLine = new StringBuilder();

        if (webSiteNames.size() > 0) {
            browserNameLine.append("│");
            browserUnderLine.append("└");
        }

        for (int i = 0; i < webSiteNames.size(); i++) {
            browserNameLine.append(generateWebSiteName(webSiteNames.get(i)))
                .append(i + 1)
                .append("   │");
            browserUnderLine.append("───────────────┘");
        }

        System.out.println(browserNameLine);
        System.out.println(browserUnderLine);
    }

    private String generateWebSiteName(final String name) {
        StringBuilder builder = new StringBuilder();

        if (name.length() > 11) {
            return name.substring(0, 11);
        }

        int space = 11 - name.length();
        int interval = space / 2;

        builder.append(SPACE.repeat(interval))
            .append(name)
            .append(SPACE.repeat(11 - interval - name.length()));

        return builder.toString();
    }

    public boolean hasSpace() {
        return webSiteNames.size() < maxWebCount;
    }

    private boolean full() {
        return !hasSpace();
    }
}
```

Computer 클래스의 main 메서드를 실행해 본다. 위의 예시는 `synchronized` 키워드를 통해 간단하게 모니터를 사용한 것이다. 해당 코드를 실행해 보면 아래와 비슷한 결과를 얻을 수 있다.

![image](https://user-images.githubusercontent.com/49058669/138544352-e9989200-7585-4756-917f-26264aee1288.png)

여기서 핵심은 여러 스레드에서 새로운 탭을 추가하지만, 탭이 5개를 초과하여 생성되지 않는다는 것을 알 수 있다. `synchonized` 키워드를 제거하고 다시 실행해 보자. `WebBrowser` 클래스의 `createNewTab` 메서드와 `WebSite` 의 `run` 메서드의 `synchronized` 부분을 제거한다.

```java
    public void createNewTab(final String webSiteName) {
        try {
            if (full()) {
                return;
            }
            System.out.println(webSiteName + " 사이트가 켜지는 중입니다...");
            Thread.sleep(new Random().nextInt(1000));
            webSiteNames.add(webSiteName);
            showRunningBrowser();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
```

```java
    @Override
    public void run() {
        while (webBrowser.hasSpace()) {
            try {
                Thread.sleep(new Random().nextInt(1000));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            webBrowser.createNewTab(webSiteName);
        }
    }
```

위와 같이 변경한 후 실행해 보면 스레드가 비동기로 처리되면서 6개 이상의 탭이 활성화되며 예외가 발생하는 것을 확인할 수 있다.

![image](https://user-images.githubusercontent.com/49058669/138545250-2535617c-56b1-4aa6-b099-3b74c851eb77.png)

위의 실습으로 동기화가 어떻게 진행되는지 알아보았다. 다음은 wait(), notify() 를 이용한 동기화를 해보자.



## 조건 변수를 통한 모니터 동기화

`wait`, `notify` 를 사용한다. 이전에 사용한 코드와 비슷하지만, 일부 변경 점이 있다.

- 3초마다 가장 먼저 켜진 웹 사이트가 꺼진다.
- 웹 사이트가 꺼지면 대기 중이던 웹 사이트가 켜진다.
- 웹 사이트가 5개가 켜지면 웹 사이트는 대기 상태에 들어간다.
- 웹 사이트가 5개 이하가 켜져 있으면 대기 중이던 웹 사이트가 켜진다.

아래 코드를 복사해서 실습해 보자.

```java
public class Computer {

    public static void main(String[] args) {
        final WebBrowser webBrowser = new WebBrowser(5);

        final Thread threadA = new Thread(new WebSite("Google", webBrowser));
        final Thread threadB = new Thread(new WebSite("Naver", webBrowser));
        final Thread threadC = new Thread(new WebSite("Daum", webBrowser));
        final Thread closer = new Thread(new WebSiteCloser(webBrowser));

        closer.start();
        threadA.start();
        threadB.start();
        threadC.start();
    }
}

public class WebSite implements Runnable {

    private final String webSiteName;
    private final WebBrowser webBrowser;

    public WebSite(final String webSiteName, final WebBrowser webBrowser) {
        this.webSiteName = webSiteName;
        this.webBrowser = webBrowser;
    }

    @Override
    public void run() {
        synchronized (this) {
            while (true) {
                try {
                    Thread.sleep(new Random().nextInt(1000));
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                webBrowser.createNewTab(webSiteName);
            }
        }
    }
}

public class WebBrowser {

    private static final String SPACE = " ";

    private final List<String> webSiteNames = new ArrayList<>();
    private final List<Integer> webSiteIndexes = new ArrayList<>();
    private final int maxWebCount;
    private int webSiteIndex = 0;

    public WebBrowser(final int maxWebCount) {
        this.maxWebCount = maxWebCount;
    }

    public synchronized void createNewTab(final String webSiteName) {
        try {
            if (full()) {
                wait();
            }
            System.out.println(webSiteName + " 사이트가 켜지는 중입니다...");
            Thread.sleep(new Random().nextInt(1000));
            webSiteNames.add(webSiteName);
            webSiteIndexes.add(++webSiteIndex);
            showRunningBrowser();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    private void showRunningBrowser() {
        if (webSiteNames.size() > maxWebCount) {
            throw new UnsupportedOperationException("현재 브라우저 탭이 6개 이상 활성화 되어 강제 종료합니다...");
        }

        System.out.println("┌───────────────────────────────────────────────────────────────────────────────┐");
        System.out.println("│ ◆ Wilder Web Browser                                                    - □ x │");
        System.out.println("└───────────────────────────────────────────────────────────────────────────────┘");

        StringBuilder browserNameLine = new StringBuilder();
        StringBuilder browserUnderLine = new StringBuilder();

        if (webSiteNames.size() > 0) {
            browserNameLine.append("│");
            browserUnderLine.append("└");
        }

        for (int i = 0; i < webSiteNames.size(); i++) {
            browserNameLine.append(generateWebSiteName(webSiteNames.get(i)))
                .append(generateWebSiteIndex(webSiteIndexes.get(i)))
                .append(" │");
            browserUnderLine.append("───────────────┘");
        }

        System.out.println(browserNameLine);
        System.out.println(browserUnderLine);
    }

    private String generateWebSiteName(final String name) {
        StringBuilder builder = new StringBuilder();

        if (name.length() > 11) {
            return name.substring(0, 11);
        }

        int space = 11 - name.length();
        int interval = space / 2;

        builder.append(SPACE.repeat(interval))
            .append(name)
            .append(SPACE.repeat(11 - interval - name.length()));

        return builder.toString();
    }

    private String generateWebSiteIndex(final int index) {
        if (index < 10) {
            return "00" + index;
        }
        if (index < 100) {
            return "0" + index;
        }
        return "" + index;
    }

    public boolean isNotEmpty() {
        return webSiteNames.size() != 0;
    }

    public boolean hasSpace() {
        return webSiteNames.size() < maxWebCount;
    }

    public boolean full() {
        return !hasSpace();
    }

    public synchronized void removeAndNotify() {
        if (isNotEmpty()) {
            System.out.println(webSiteNames.get(0) + " 사이트가 종료됩니다.");
            webSiteNames.remove(0);
            webSiteIndexes.remove(0);
            showRunningBrowser();
            notify();
        }
    }
}

public class WebSiteCloser implements Runnable {

    private final WebBrowser webBrowser;

    public WebSiteCloser(WebBrowser webBrowser) {
        this.webBrowser = webBrowser;
    }

    @Override
    public void run() {
        try {
            while (true) {
                Thread.sleep(3000);
                webBrowser.removeAndNotify();
            }
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}

```

![image](https://user-images.githubusercontent.com/49058669/138548124-00a19c52-8959-4b16-8055-b0c25b5ffd91.png)

5개를 넘지 않는 선에서 새로운 탭이 빈자리가 생길 때마다 추가되는 것을 확인할 수 있다.

이렇게 조건 변수를 이용하여 동기화를 해보는 경험까지 해봤다. 적절한 예시는 아닐 수 있지만, 이 글의 핵심은 어떻게, 어떤 방식으로 Java 에서 동기화를 처리할 수 있는지를 알아보는 시간이었다.



## 결론

Java 에서 제공되는 모니터는 손쉽게 상호배제를 할 수 있도록 해준다. 대부분 멀티 스레드를 제공하기 때문에 스레드 세이프 하지 않은 환경에서는 동기화를 사용해야 한다. 예를 들면 웹 애플리케이션은 멀티 스레드를 사용한다. 이때 싱글톤 패톤(단 하나의 인스턴스만 만드는 패턴)을 사용한다면 처음 싱글톤을 생성할 때 스레드 세이프 하지 않다. 이 경우에 동기화가 필요하다. 이처럼 동기화가 필요한 상황이 종종 발생하기 때문에 이때 모니터를 활용하여 쉽게 동기화를 사용하면 된다.



## 참고

- [Synchronized Method Docs](https://docs.oracle.com/javase/tutorial/essential/concurrency/syncmeth.html)
- [Monitor Docs](https://docs.oracle.com/javase/7/docs/api/javax/management/monitor/Monitor.html)
- [운영체제 - 상호배제와 동기화(뮤텍스,TAS,세마포어,모니터)](https://coding-start.tistory.com/201)
- [JAVA\] WAIT()와 NOTIFY()](https://javafactory.tistory.com/1535)
