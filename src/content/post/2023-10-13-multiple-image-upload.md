---
layout: post
title: '다중 이미지 업로드 최적화: 병렬 스트림과 CompletableFuture'
author: [5기_애쉬]
tags: ['parallelism', 'parallel stream', 'CompletableFuture']
date: '2023-10-13T12:00:00.000Z'
draft: false
image: ../teaser/multiple-image-upload.png
---

사이드 프로젝트로 sns 서비스를 개발하며 사용자가 다수의 이미지를 업로드하는 기능을 개발하게 되었다.
웹 애플리케이션에서 다중 이미지 업로드는 일반적이며, 이를 효율적으로 처리하는 것은 사용자 경험 향상에 중요한 역할을 한다.

그렇다면 서버 측에서는 여러 장의 이미지를 어떻게 효율적으로 업로드할 수 있을까?

이 글에서는 구체적인 이미지 저장 방법(로컬 스토리지 저장, 클라우드 서비스 사용, DB에 바이너리 데이터로 저장 등)을 떠나, 이미지 업로드 과정을 어떻게 하면 더 효율적이고 빠르게 처리할 수 있을지에 집중해 보고자 한다.
병렬 처리와 같은 기술을 활용하여 서버 성능을 최대한 활용하고, 사용자에게 빠른 응답 시간을 제공하는 방법을 예제 코드와 함께 살펴보자.

# 예제 코드 소개

이번 예제에서는 `이미지 동반 포스트 업로드 서비스` 를 구현했다.
전체 소스코드는 [Github](https://github.com/xxeol2/multi-image-upload-demo)에서 확인 가능하다.

> [요구사항]
>
> - 한 포스트당 최대 10장의 이미지를 포함할 수 있다.
> - 업로드 실패 시, 해당 포스트에 대한 모든 이미지 파일을 저장소에서 삭제한다.

클래스의 구조와 전체적인 코드의 흐름은 아래와 같다.

<img src="../img/multiple-image-upload/클래스 구조도.png" width="700">

- `PostFacadeService`는 전체 이미지 파일 업로드를 `ImageStorageService`에 요청한다.

- `ImageStorageService`는 각 이미지 파일 업로드를 `StorageClient`에 요청한다.

- 이미지 업로드가 성공하면, `PostFacadeService`는 포스트 저장을 `PostService`에 요청한다.

이 포스트에서는 주로 `ImageStorageService`에 집중하여 여러 이미지 업로드 방법을 살펴본다.

# 순차적 업로드 방식

가장 기본적인 방법은 모든 이미지를 하나씩 순차적으로 업로드하는 것이다.

아래는 `ImageStorageService`에서 파일 업로드를 담당하는 `uploadFiles()` 코드이다.

```java
public ImageUploadResponse uploadFiles(MultipartFile[] imageFiles) {
    validate(imageFiles);
    List<String> fileNames = new ArrayList<>();
    try {
        Arrays.stream(imageFiles)
            .map(storageClient::upload)
            .forEach(fileNames::add);
        return convertFileNamesToResponse(fileNames);
    } catch (Exception e) {
        executor.execute(() -> deleteFiles(fileNames));
        throw new InternalServerException("이미지 업로드 시 예외가 발생했습니다.");
    }
}

```

이미지 파일들을 순차적으로 `StorageClient`에 업로드 요청을 보내고, 업로드에 성공한 파일의 이름을 모아 반환한다.

```
[nio-8080-exec-1] : File Upload 시작 (871cb6aae189.png)
[nio-8080-exec-1] : File Upload 완료 (871cb6aae189.png)
[nio-8080-exec-1] : File Upload 시작 (1e17f3995ade.png)
[nio-8080-exec-1] : File Upload 완료 (1e17f3995ade.png)
[nio-8080-exec-1] : File Upload 시작 (587ab1b903d3.png)
[nio-8080-exec-1] : File Upload 완료 (587ab1b903d3.png)
```

위 로그에서 `[nio-8080-exec-1]`은 해당 작업이 진행된 스레드 이름을 나타낸다. 모든 요청이 단일 스레드에서 순차적으로 처리되는 것을 확인할 수 있다.

<img src="../img/multiple-image-upload/순차적 업로드 구조.png" width="500">

## 성능 측정

```
[PostFacadeService.createPost] 실행 시간(ms): 1396
[PostFacadeService.createPost] 실행 시간(ms): 1287
[PostFacadeService.createPost] 실행 시간(ms): 1251
[PostFacadeService.createPost] 실행 시간(ms): 1383
[PostFacadeService.createPost] 실행 시간(ms): 1338
```

10장의 354KB 이미지를 업로드하는 데에 평균 1331ms가 소요되었다.

다중 이미지 업로드 시, 단일 스레드를 사용하여 순차적으로 처리하는 방식은 간단하고 직관적이다.
이 방법을 사용하면, 각 이미지는 이전 이미지가 완전히 업로드된 후에 업로드된다.
그러나 이러한 단일 스레드 방식은 이미지 하나당 소요되는 시간이 누적되어 전체 업로드 시간이 길어지는 단점이 있다.
예를 들어, 이미지 하나를 업로드하는데 평균 130ms가 소요되고 10개의 이미지를 업로드한다면, 총소요 시간은 약 1300ms가 된다.

이에 비해, 여러 스레드를 사용하여 이미지를 병렬로 업로드하면 처리 시간을 단축할 수 있다.
이 방식에서는 여러 이미지가 동시에 업로드되므로, 10장의 이미지를 업로드하는 데 걸리는 시간을 1331ms에서 더 단축할 수 있을 것으로 예상된다.

이제 병렬 스트림을 활용한 이미지 업로드 방식에 대해 자세히 알아보자.

# 병렬 스트림을 활용한 업로드

Java 8부터는 컬렉션의 병렬 처리를 지원하는 "병렬 스트림(parallel stream)"이 도입되었다.
이를 활용하면, 여러 CPU 코어를 통해 작업을 효율적으로 분산시켜 더 빠르게 수행할 수 있다.

이를 활용하여 이미지 업로드를 병렬적으로 처리할 수 있다.

```java
public ImageUploadResponse uploadFiles(MultipartFile[] imageFiles) {
    validate(imageFiles);
    List<String> fileNames = new ArrayList<>();
    try {
        Arrays.stream(imageFiles)
            .parallel() // 병렬 스트림 생성
            .map(storageClient::upload)
            .forEach(fileNames::add);
        return convertFileNamesToResponse(fileNames);
    } catch (Exception e) {
        executor.execute(() -> deleteFiles(fileNames));
        throw new InternalServerException("이미지 업로드 시 예외가 발생했습니다.");
    }
}

```

각 이미지 업로드 요청이 병렬 스레드에서 동시에 처리되는 것을 로그로 확인할 수 있다. 아래 로그에서 `[onPool-worker-*]`는 해당 작업이 진행된 스레드 이름이다.

```
[onPool-worker-6] : File Upload 시작 (871cb6aae189.png)
[onPool-worker-4] : File Upload 시작 (9af5a8a21538.png)
[onPool-worker-2] : File Upload 시작 (1e17f3995ade.png)
[onPool-worker-1] : File Upload 시작 (587ab1b903d3.png)
[onPool-worker-5] : File Upload 시작 (bdc9a80b2331.png)
[onPool-worker-7] : File Upload 시작 (faac3d412e3e.png)
[onPool-worker-3] : File Upload 시작 (85db46aad248.png)
[onPool-worker-1] : File Upload 완료 (587ab1b903d3.png)
[onPool-worker-1] : File Upload 시작 (3cf2f27aacb3.png)
[onPool-worker-5] : File Upload 완료 (bdc9a80b2331.png)
[onPool-worker-5] : File Upload 시작 (9343ba3a01d1.png)
[onPool-worker-2] : File Upload 완료 (1e17f3995ade.png)
...
```

<img src="../img/multiple-image-upload/병렬 스트림 구조.png" width="400">

## 성능 측정

```
[PostFacadeService.createPost] 실행 시간(ms): 256
[PostFacadeService.createPost] 실행 시간(ms): 223
[PostFacadeService.createPost] 실행 시간(ms): 213
[PostFacadeService.createPost] 실행 시간(ms): 217
[PostFacadeService.createPost] 실행 시간(ms): 238
```

병렬 스트림을 활용하니 처리 시간이 평균 1331ms에서 229ms로 약 **5배 이상 단축**되었다.

## 병렬 스트림 사용 시 주의점

병렬 처리 중 공유 자원에 대한 동시 접근 시 문제가 발생할 수 있다.

### 공유 자원과 `ConcurrentModificationException`

본 예제에서 이미지 파일들을 병렬로 업로드하는 작업 중 실패가 발생하면, 이미 업로드된 이미지들을 삭제하려고 한다.
이 과정에서 `ConcurrentModificationException` 예외가 발생할 수 있다.
이는 여러 스레드가 동시에 같은 컬렉션을 수정하려 할 때 발생하는 예외이다.

`uploadFiles` 메서드에서 파일 업로드가 성공하면 해당 파일의 이름을 `fileNames` 리스트에 추가한다.
만약 어떤 스레드의 업로드가 실패하면, 즉시 `deleteFiles(fileNames)` 메서드를 호출하여 삭제 작업을 시작한다.
이때 다른 스레드가 아직 업로드를 완료하지 않아 리스트에 새로운 요소를 추가하는 상황이 발생하면 `ConcurrentModificationException` 예외가 발생한다.

```
Exception in thread "taskExecutor-1" java.util.ConcurrentModificationException
at java.base/java.util.ArrayList.forEach(ArrayList.java:1513)
at practice.s3.application.ImageStorageService.deleteFiles(ImageStorageService.java:67)
at practice.s3.application.ImageStorageService.lambda$uploadFiles$0(ImageStorageService.java:38) <3 internal lines>
```

### 병렬 작업 종료 후 통합 예외 처리

이러한 문제를 방지하기 위해, **모든 병렬 작업이 끝난 후**에 한꺼번에 예외를 처리하는 방식으로 코드를 개선했다.

```java
public ImageUploadResponse uploadFiles(MultipartFile[] imageFiles) {
    validate(imageFiles);
    AtomicBoolean catchException = new AtomicBoolean(false);

    List<String> fileNames = Arrays.stream(imageFiles)
        .parallel()
        .map(file -> uploadFile(file, catchException))
        .filter(Objects::nonNull)
        .toList();
    handleException(catchException, fileNames);
    return convertFileNamesToResponse(fileNames);
}

private String uploadFile(MultipartFile file, AtomicBoolean catchException) {
    try {
        return storageClient.upload(file);
    } catch (Exception e) {
        catchException.set(true);
        return null;
    }
}

private void handleException(AtomicBoolean catchException, List<String> fileNames) {
    if (catchException.get()) {
        executor.execute(() -> deleteFiles(fileNames));
        throw new InternalServerException("이미지 업로드 시 예외가 발생했습니다.");
    }
}

```

여기서는 `AtomicBoolean`을 활용하여 예외 발생 여부를 각 스레드에서 안전하게 추적한다. 업로드 과정에서 예외가 발생하면, 해당 변수를 true로 설정하여 상태를 기록한다.

모든 병렬 작업이 종료된 후, 이 `AtomicBoolean` 상태를 검사함으로써 예외 발생 유무를 확인한다.
이렇게 함으로써 동시성 문제를 피하면서 안정적으로 예외를 처리할 수 있게 되었다.

## 병렬 스트림의 제약점

병렬 스트림은 내부적으로 `ForkJoinPool`을 사용하여 자동으로 작업을 여러 스레드에 분배한다. 이러한 분배는 시스템의 프로세서 수를 고려하여 스레드 수를 결정한다. 본 포스트의 성능 측정은 7개의 스레드가 활용된 환경에서 이루어졌다.

병렬 스트림의 스레드 수를 조절하는 것은 기술적으로 가능하나, 이 조정은 `ForJoinPool.commonPool()`에 대한 전역 설정을 변경하는 것이므로, 모든 병렬 스트림 작업에 영향을 미친다.

예를 들어, 작업 A에 최적화하기 위해 스레드 수를 10으로 설정한다면, 이는 작업 B,C,D 등 현재 진행 중인 다른 모든 병렬 스트림 작업에도 동일하게 적용된다. 따라서 각 작업의 특성에 따라 최적의 성능을 얻기 위해 병렬 스트림의 스레드 수를 독립적으로 조절하는 것이 쉽지 않다.

그렇다면, 더 세밀한 병렬 처리 제어를 원할 땐 어떻게 해야 할까?

# CompletableFuture를 활용한 병렬 업로드

Java 8이 등장하면서, `CompletableFuture`는 비동기 프로그래밍에 큰 변화를 불러왔다. 이 클래스는 비동기 연산의 결과를 나타내는 것뿐만 아니라, 그 완료 시점과 연산의 수명 주기를 세부적으로 제어할 수 있게 해준다. 이는 단순히 결과를 기다리는 것을 넘어, 연산을 시작하고, 완료하며, 여러 작업을 결합하고, 예외를 처리하는 등의 복잡한 비동기 흐름을 명시적으로 제어할 수 있다는 의미다.

`ForkJoinPool`은 큰 작업을 작은 단위로 분할하여 병렬로 처리한 다음, 그 결과를 합치는 데 초점을 맞추고 있다. 반면, `CompletableFuture`는 기본적으로 사용하는 `ForkJoinPool` 외에도, 자체적으로 지정한 executor를 통해 스레드 풀을 직접 제어할 수 있다. 이를 통해 특정 작업에 최적화된 병렬 처리가 가능해지고, 복잡한 비동기 작업 흐름을 필요에 맞게 구성할 수 있게 된다.

예를 들어, 이미지 업로드 작업과 같이 I/O 집약적인 작업이 있을 때,`CompletableFuture`를 사용하여 특정 `coreSize`인 `ThreadPoolTaskExecutor`를 사용함으로써, 독립적인 스레드 풀을 구성하여 업로드를 병렬로 수행할 수 있다. 이는 각각의 작업이 다른 작업의 리소스 사용에 영향을 끼치지 않으면서 효율적으로 수행할 수 있도록 해준다. 이처럼 `CompletableFuture`는 복잡한 비동기 흐름을 잘 제어하고, 각 작업에 맞는 병렬 처리를 해야 하는 상황에서 유용한 도구이다.

본 예제에서는 한 포스트에 최대 10장의 이미지를 업로드하는 상황을 가정하여, `coreSize`가 10인 `ThreadPoolTaskExecutor`를 설정해 병렬 업로드를 실행했다.

```java
@Configuration
public class AsyncConfig {

    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.initialize();
        return executor;
    }
}
```

```java
@Autowired
private Executor executor:

public ImageUploadResponse uploadFiles(MultipartFile[] imageFiles) {
    validate(imageFiles);
    List<CompletableFuture<String>> futures = Arrays.stream(imageFiles)
        .map(file -> CompletableFuture.supplyAsync(() -> storageClient.upload(file), executor))
        .toList();

    List<String> fileNames = gatherFileNamesFromFutures(futures);
    return convertFileNamesToResponse(fileNames);
}

private List<String> gatherFileNamesFromFutures(List<CompletableFuture<String>> futures) {
    List<String> fileNames = new ArrayList<>();
    AtomicBoolean catchException = new AtomicBoolean(false);
    futures.forEach(future -> {
        try {
            fileNames.add(future.join());
        } catch (CompletionException e) {
            catchException.set(true);
        }
    });
    handleException(catchException, fileNames);
    return fileNames;
}

private void handleException(AtomicBoolean catchException, List<String> fileNames) {
    if (catchException.get()) {
        executor.execute(() -> deleteFiles(fileNames));
        throw new InternalServerException("이미지 업로드 시 예외가 발생했습니다.");
    }
}
```

`uploadFiles` 메서드는 이미지 파일들을 병렬로 업로드한다.
`CompletableFuture.supplyAsync()`를 사용해 병렬 작업을 시작하며 그 결과를 `CompletableFuture`로 반환한다.

`gatherFileNamesFromFutures` 메서드는 `join()` 메서드를 사용해 각 `CompletableFuture`의 결과를 기다린 후, 해당 결과를 `fileNames` 리스트에 추가한다.
`join()` 메서드는 `CompletableFuture`의 작업이 완료될 때까지 대기하고 그 결과를 반환한다.

만약 `join()` 메서드 수행 중 예외가 발생하면 `CompletableException`으로 감싸져 던져진다.
위 코드에서는 `AtomicBoolean`을 사용하여 예외 발생 여부를 관리한다.

이후의 예외 처리 전략은 병렬 스트림에서 사용된 방식과 동일하다.

## 성능 측정

```
// CommonForkJoinPool
[PostFacadeService.createPost] 실행 시간(ms): 312
[PostFacadeService.createPost] 실행 시간(ms): 261
[PostFacadeService.createPost] 실행 시간(ms): 322
[PostFacadeService.createPost] 실행 시간(ms): 251
[PostFacadeService.createPost] 실행 시간(ms): 241

// ThreadPoolTaskExecutor (coreSize 10)
[PostFacadeService.createPost] 실행 시간(ms): 182
[PostFacadeService.createPost] 실행 시간(ms): 161
[PostFacadeService.createPost] 실행 시간(ms): 197
[PostFacadeService.createPost] 실행 시간(ms): 191
[PostFacadeService.createPost] 실행 시간(ms): 179
```

스레드풀을 별도로 지정하지 않았을 때의 평균 처리 시간은 277ms였다.
반면, 커스텀 스레드풀을 적용했을 때의 평균 처리 시간은 182ms로 감소했으며, 이는 기존 병렬 스트림의 처리 시간 229ms와 비교하여 더 짧은 시간이다.

이 결과로부터 병렬 스트림과 `CompletableFuture`를 사용한 일반적인 처리에서 성능 차이는 크지 않지만, 특정 작업에 최적화된 executor를 사용하면 성능이 향상될 수 있다는 결론을 얻을 수 있다.
예를 들어, 대규모 파일 I/O 작업을 수행하는 경우에는 I/O 작업에 최적화된 스레드 풀 설정을 적용하여 디스크 접근과 네트워크 전송을 병렬로 처리할 수 있다. 고성능 컴퓨팅 작업에서는 CPU 사용률을 극대화할 수 있는 스레드 풀 구성으로 성능을 향상할 수 있다.

이처럼 실제 사용 시나리오와 요구 사항을 고려하여 성능 테스트를 실시하고, 테스트 결과를 바탕으로 특정 작업에 최적화된 스레드 풀을 선택하는 것이 중요하다.

# 마무리

이 글을 통해, 병렬 처리를 통해 다중 이미지를 효율적으로 업로드하는 기법들을 알아보았다.

그러나 이러한 기법들은 이미지 업로드에만 국한되지 않는다.

예를 들면, 웹 크롤링을 할 때 여러 사이트의 데이터를 동시에 수집하는 작업에서도 병렬 처리는 큰 이점을 가져다준다. 배치 작업에서도, 서로 독립적인 작업 항목들을 병렬로 처리함으로써 전체 작업 시간을 대폭 줄일 수 있다.

데이터베이스에서는 복잡한 쿼리나 대용량 데이터 처리를 병렬로 실행하여 응답 시간을 단축할 수 있다. 서버 측에서는 사용자의 다양한 요청을 동시에 처리하기 위해 요청 처리를 병렬로 수행하여, 더 빠른 서비스 제공이 가능해진다.

이처럼 병렬 처리는 단순히 업로드 시간을 단축하는 것을 넘어, 다양한 분야에서 응답성과 성능을 향상하는 핵심 기술이다.

본문에서는 특히 병렬 스트림과 `CompletableFuture`에 초점을 맞추어 알아보았는데, 이들은 각각의 사용 사례에 따라 장점이 있다.

병렬 스트림은 사용이 매우 간편하다는 장점이 있으나, 고정된 스레드 풀을 사용한다는 점에서 유연성이 다소 떨어진다.
반면, `CompletableFuture`는 보다 복잡한 비동기 작업을 우아하게 처리할 수 있으며, 특히 커스텀 스레드 풀을 사용하여 성능을 최적화할 수 있다.

이들 외에도 다양한 병렬 처리 방식이 존재한다. 상황과 요구 사항에 따라 가장 적합한 방법을 선택하고 적용하는 것이 중요하다. 따라서 다양한 방법을 시도하고, 성능 측정 결과를 바탕으로 자신에게 맞는 최적의 해결책을 찾는 것이 핵심이다.
