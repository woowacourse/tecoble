---
layout: post
title: '다중 이미지 업로드 최적화: 병렬 스트림과 CompletableFuture'
author: [5기_애쉬]
tags: ['parallelism', 'parallel stream', 'CompletableFuture']
date: '2023-10-13T12:00:00.000Z'
draft: false
image: ../teaser/multiple-image-upload.png
---

이번 포스트에서는 예제 코드를 통해 여러 장의 이미지를 업로드하는 다양한 방법을 소개하겠다.

# 예제 코드 소개

이번 예제에서는 `이미지 동반 포스트 업로드 서비스` 를 구현했다.
전체 소스코드는 [Github](https://github.com/xxeol2/multi-image-upload-demo)에서 확인 가능하다.

> [요구사항]
>
> - 한 포스트당 최대 10장의 이미지를 포함시킬 수 있다.
> - 업로드 실패 시, 해당 포스트에 대한 모든 이미지 파일을 저장소에서 삭제한다.

클래스의 구조와 전체적인 코드의 흐름은 아래와 같다.

<img src="../img/multiple-image-upload/클래스 구조도.png" width="700">

- `PostFacadeService`는 전체 이미지 파일 업로드를 `ImageStorageService`에 요청한다.

- `ImageStorageService`는 각 이미지 파일 업로드를 `StorageClient`에 요청한다.

- 이미지 업로드가 성공하면, `PostFacadeService`는 포스트 저장을 `PostService`에 요청한다.

이 포스트에서는 주로 `ImageStorageService`에 집중하여 여러 이미지 업로드 방법을 살펴본다.

# 순차적 업로드 방식

가장 기본적인 방법은 모든 이미지를 하나씩 순차적으로 업로드하는 것이다.

아래는 `ImageStroageService`에서 파일 업로드를 담당하는 `uploadFiles()` 코드이다.

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
        throw new InternalServerException("이미지 업로드시 예외가 발생했습니다.");
    }
}

```

이미지 파일들을 순차적으로 `StorageClient`에 업로드 요청을 보내고, 업로드에 성공한 파일의 이름을 모아 반환한다.

로그를 통해 모든 요청이 단일 스레드에서 순차적으로 처리되는 것을 확인할 수 있다.

<img src="../img/multiple-image-upload/순차적 업로드 로그.png" width="500">

<img src="../img/multiple-image-upload/순차적 업로드 구조.png" width="500">

## 성능 측정

<img src="../img/multiple-image-upload/순차적 업로드 성능.png" width="300">

10장의 354KB 이미지를 업로드하는 데에 평균 1272ms가 소요되었다.

여러 스레드에서 이미지를 병렬로 업로드하면 처리 시간이 단축될 것으로 예상된다.
여러 이미지를 병렬적으로 업로드하는 방식으론 어떤 게 있을까?

# 병렬 스트림을 활용한 업로드

Java8부터는 컬렉션의 병렬 처리를 지원하는 "병렬 스트림(parallel stream)"이 도입되었다.
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
        throw new InternalServerException("이미지 업로드시 예외가 발생했습니다.");
    }
}

```

각 이미지 업로드 요청이 병렬 스레드에서 동시에 처리되는 것을 로그를 통해 확인할 수 있다.

<img src="../img/multiple-image-upload/병렬 스트림 로그.png" width="500">

<img src="../img/multiple-image-upload/병렬 스트림 구조.png" width="400">

## 성능 측정

<img src="../img/multiple-image-upload/병렬 스트림 성능.png" width="300">

병렬 스트림을 활용하니 처리 시간이 평균 1272ms에서 231ms로 약 **5배 이상 단축**되었다.

## 병렬 스트림 사용 시 주의점

병렬 처리 중 공유 자원에 대한 동시 접근시 문제가 발생할 수 있다.

### 공유 자원과 `ConcurrentModificationException`

본 예제에서 이미지 파일들을 병렬로 업로드하는 작업 중 실패가 발생하면, 이미 업로드된 이미지들을 삭제하려고 한다.
이 과정에서 `ConcurrentModificationException` 예외가 발생할 수 있다.
이는 여러 스레드가 동시에 같은 컬렉션을 수정하려 할 때 발생하는 예외이다.

`uploadFiles` 메서드에서 파일 업로드가 성공하면 해당 파일의 이름을 `fileNames` 리스트에 추가한다.
만약 어떤 스레드의 업로드가 실패하면, 즉시 `deleteFiles(fileNames)` 메서드를 호출하여 삭제 작업을 시작한다.
이때 다른 스레드가 아직 업로드를 완료하지 않아 리스트에 새로운 요소를 추가하는 상황이 발생하면 `ConcurrentModificationException` 예외가 발생한다.

<img src="../img/multiple-image-upload/ConcurrentModificationException 발생.png" width="700">

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
        throw new InternalServerException("이미지 업로드시 예외가 발생했습니다.");
    }
}

```

여기서 `AtomicBoolean`을 사용해 예외 발생 여부를 thread-safe하게 관리한다.
각 스레드에서 업로드 도중 예외가 발생하면 이 값을 `true`로 설정한다.

모든 병렬 작업이 종료된 후, 예외 발생 여부를 확인하여 처리한다.
이렇게 함으로써 동시성 문제를 피하면서 안정적으로 예외를 처리할 수 있게 되었다.

## 병렬 스트림의 제약점

병렬 스트림은 자바 내부의 `ForkJoinPool`을 활용하여 동작한다. 이 풀은 시스템의 프로세서 수를 기반으로 적절한 수의 스레드를 할당한다. (이 포스트에서의 성능 측정은 7개의 스레드가 할당된 환경에서 진행되었다.)

병렬 스트림의 스레드 수를 조절하는 것이 가능하기는 하나, 이는 모든 병렬 스트림에 영향을 미치는 전역 설정이다. 이러한 특성 때문에 특정 작업에 최적화된 병렬 처리를 구현하기 쉽지 않다.

그렇다면, 더 세밀한 병렬 처리 제어를 원할 땐 어떻게 해야 할까?

# CompletableFuture를 활용한 병렬 업로드

Java 8부터는 `CompletableFuture`라는 클래스가 도입되었다.
이는 비동기 연산의 결과를 표현하며, 연산의 완료 시점을 명시적으로 제어할 수 있다.

`CompletableFuture`는 executor를 지정하여 병렬 처리의 스레드 풀을 명시적으로 제어할 수 있다.
이를 통해 특정 작업에 최적화된 병렬 처리 구현이 가능하다.

기본적으로 `CompletableFuture`는 executor를 지정하지 않으면, 병렬 스트림과 같이 `ForkJoinPool`을 사용한다.

본 예제에서는 하나의 포스트에서 최대 10장의 이미지를 업로드할 수 있기에, `coreSize`를 10으로 설정한 `ThreadPoolTaskExecutor`를 사용하여 병렬 업로드를 진행했다.

```java
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
        throw new InternalServerException("이미지 업로드시 예외가 발생했습니다.");
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

<img src="../img/multiple-image-upload/CompletableFuture 성능.png" width="500">

스레드풀을 별도로 지정하지 않았을 때의 평균 처리 시간은 272ms였다.
반면, 커스텀 스레드풀을 적용했을 때의 평균 처리 시간은 190ms로 짧아졌다.
이전에 살펴본 병렬 스트림의 처리 시간인 231ms와 비교하면 전자는 약간 더 긴 시간이, 후자는 약간 더 짧은 시간이 소요되었다.

이러한 결과를 통해, 일반적인 경우 병렬 스트림과 `CompletableFuture`의 성능 차이는 크게 나지 않는다는 것을 알 수 있다.
그러나, 특정 작업에 최적화된 executor를 사용하면 더욱 빠른 성능을 얻을 수 있다.
따라서 실제 사용 시나리오와 요구 사항을 고려하여 성능 테스트를 통해 최적의 선택을 하는 것이 중요하다.

# 마무리

병렬 처리를 통해 다중 이미지를 효율적으로 업로드하는 방법들을 알아보았다.
이번 예제에서 사용한 방법들은 다중 이미지 업로드 뿐만 아니라 다른 여러 기능에 적용시킬 수 있다.

병렬 스트림과 `CompletableFuture` 외에도 다양한 병렬 처리 방식이 존재한다. 그 중 본인의 상황에 가장 적합한 방법을 선택하여 적용하는 것이 중요하다.
다양한 방법을 시도하고, 성능 측정 결과를 기반으로 자신에게 최적화된 방법을 결정해야한다.
