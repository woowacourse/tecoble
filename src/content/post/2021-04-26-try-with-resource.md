---
layout: post  
title: 자원을 자동으로 반납, try-with-resource
author: [와이비]
tags: ['java']
date: "2021-04-26T12:00:00.000Z"
draft: false
image: ../teaser/try-with-resource.png

---
### try-with-resource
우리는 자바로 프로그램을 짜면서 시스템에 있는 많은 자원들을 사용하게 된다. 
자원 자체를 잘 사용하는 것도 중요하지만, 적절한 때에 사용을 해제하는 것도 매우 중요한 일이다. 
자원 해제를 잊어버리거나, 해제의 시점을 잘 모르는 경우가 생길 수가 있다. 
Java의 예외 처리 기능인 try-with-resource와 함께 자바에서의 자원을 자동으로 해제해보자.

---

## Resource
자원은 시스템을 운영하는데 있어서 메모리, 입출력 장치 등 하드웨어, 소프트웨어 형태로 존재를 하는 한정적인 능력을 가진 구성요소를 의미합니다.
이 때 오늘 자원이라고 지칭할 개념은 자바의 외부자원으로서 JVM 바깥에 메모리 이외의 시스템의 구성요소를 의미합니다.
자바는 JVM에서 관리하는 메모리 공간뿐 아니라 외부 자원도 활용하게 되는데, 필요한 기능을 모두 사용하고 나면 해제를 하며 사용이 끝났다고 명시를 해주어야 합니다.
메모리에만 관련된 자원이 아니고 다른 프로세스도 함께 사용하기 때문에 GC를 믿기보단 직접적으로 해제해주는 편이 좋습니다.
저희가 자바에서 자주 사용하는 자원 관련 객체는 InputStream, OutputStream, 그리고 java.sql.Connection이 있습니다.
각각의 객체들은 자원과 연결하여, 자바로 이루어진 코드에서 외부에서 온 기능들을 사용할 수 있게 해줍니다.
오늘은 이해를 쉽게 돋기 위해서 임의로 2가지 자원에 관련된 객체를 정의해보겠습니다.  
  

``` java
public class JavableBook {
    public String page(int pageNumber) throws IOException {
        //책에 관련된 로직
    }
    
    public void close() throws IOException {
        //책에 대한 자원을 해제하는 로직
    }
}
```

``` java
public class JavableVideo {
    public String scene(int time) throws IOException {
        //장면에 대한 로직
    }
    
    public void close() throws IOException {
        //비디오에 대한 자원을 해제하는 로직
    }
}
```

## 기존의 자원을 사용하는 순서 
``` java
public void play() throws IOException {
    JavableBook book = new JavableBook(); // ----(1)
    book.page(200);                       // ----(2)
    book.close();                         // ----(3)
}
```
자원을 사용할 때에는 먼저 (1)의 과정처럼 해당 자원과 저희의 객체를 연결해주어야합니다. 
그 다음에는 (2)의 과정처럼 해당 자원을 사용하여, 필요한 로직들을 실행합니다. 
마지막으로 (3)의 과정처럼 해당 자원을 해제하면 됩니다. 
간단해보이지만 여기서 문제가 생길 수가 있습니다. 
만약 예외가 발생한다면, 중간의 자원이 해제되지 않을 가능성이 있기 때문입니다. 
JavableBook이라는 책의 페이지가 150쪽이라고 가정을 하게 되면 (2)의 로직을 처리하는 과정에서 예외가 발생이 될 것입니다.
(2)에서 예외가 발생하면 (3)까지 가지 못하고 예외 처리 로직으로 이동하게 됩니다. 
이러한 생략은 자원이 해제되지 않아, 계속해서 메모리에 남아있게 되어 자원 누수 및 새롭게 JavableBook을 사용하지 못하는 문제가 생기게 됩니다. 
이 문제점을 해결하기 위해서 나온 방법이 try-finally 방법입니다.

## 예외 처리를 고려한 기존의 자원 해제 방법 try - finally

try - finally는 java에서 존재하던 블럭 단위 예외 처리 방법입니다.
원래 try - catch - finally 블럭으로 이루어집니다. 
try는 처음에 실행하고 싶은 블럭, catch는 예외가 발생시에 처리하고 싶은 블럭 그리고 finally는 예외 발생 여부에 상관없이 최종적으로 처리하고 싶은 블럭을 담게 됩니다. 
이 때, 예외 발생 여부에 상관없이 최종적으로 finally 블럭을 처리한다는 점을 활용하여 우리는 자원을 사용한 다음에 반납을 해보도록 하겠습니다.

``` java
public void play() throws IOException {
    try {
        JavableBook book = new JavableBook(); // ----(1)
        book.page(200);                       // ----(2)
    } finally {
        book.close();                         // ----(3)
    }
}
```
위의 예시처럼 try에서 자원을 할당받는 (1) 이나 자원을 사용하여 로직을 수행하는 (2)에서 어떠한 오류가 발생하더라도, 
(3)에서 최종적으로 자원을 해제하게 되므로 저희는 자원 해제에 대한 불확실성을 제거할 수 있습니다. 
하지만 try - finally의 단점은 무엇이 있을까요? 
JavableBook뿐만이 아니라 다른 자원에 관련된 객체인 JavableVideo를 사용하는 예시를 보겠습니다.

``` java
public void play() throws IOException {
    try {
        JavableBook book = new JavableBook();
        try {
            JavableVideo video = new JavableVideo();
            book.page(150);
            video.scene(150);
        } finally {
            video.close()
    } finally {
        book.close()
    }
}
```

갑자기 기하 급수적으로 Depth가 증가한 것을 볼 수가 있습니다. 
만약 다른 자원을 더 추가하게 된다면, 너무나도 많은 try - finally절이 추가될 것이라는 것을 예상할 수가 있습니다.
이는 코드가 점점 길어지고 Depth가 많아지며 지저분해지는 것을 뜻합니다.

## try-with-resource
이러한 점들을 만족시키는 것이 바로 try-with-resource라는 방법입니다. 
Java 7부터 추가된 이 방법은 앞서 언급한 문제점들에 대해서 해결할 수 있다는 점이 장점입니다.

``` java
public void play() throws IOException {
    try (JavableBook book = new JavableBook();
         JavableVideo video = new JavableVideo();) //----(1){
         book.page(150);
         video.scene(150); //----(2)
    }
}
```

위의 예시 코드를 보게 된다면, try 바로 다음 소괄호에서 자원을 할당 받게 되는 (1)의 단계를 진행하게 됩니다.  
그 이후에 중괄호에서 로직을 실행하게 되는 (2)의 단계를 밟게 됩니다. 
하지만 이 때까지 방법과 다르게 (3)의 단계가 보이지 않습니다. 
try-with-resource에서는 구절이 모두 끝나게 된다면 자동으로 자원을 반납하게 됩니다.
하지만 아무런 자원이나 반납이 가능한 것이 아닙니다.
저희가 임의로 정의한 자원을 할당 받는 객체는 try-with-resource가 작동하지 않을 것으로 예상이 됩니다.
try-with-resource를 통하여 해제할 자원을 가진 객체는 AutoCloseable이라는 인터페이스를 구현을 해야합니다. 

## Interface AutoCloseable && Method close
try-with-resource에서 자동으로 해제되는 자원인 FileInputStream 구현을 예시로 보도록 하겠습니다.

``` java
public class FileInputStream extends InputStream

abstract class InputStream implements Closeable

public interface Closeable extends AutoCloseable {
   public void close() throws IOException;
}

public interface AutoCloseable {
   void close() throws Exception;
}
```

FileInputStream에서는 AutoCloseable을 상속받은 Closeable를 구현하고 있습니다.
이 때문에 try-with-resource에 필수적인 close Method가 각각의 자원에 관련된 객체의 특성에 맞게 구현이 되어있습니다.
다음과 같이 저희가 만든 객체에도 AutoCloseable의 인터페이스의 메소드 close를 구현하게 되면, 
try-with-resource를 사용할 수 있게 됩니다.

``` java
public class JavableBook implements AutoCloseable {
    @Override
    public void close() throws IOException {
        //책에 대한 자원을 해제하는 로직
    }
}
```



## 결론
코드가 복잡해질수록, 자원을 어떻게 사용할지에 대한 고려뿐만이 아니라 해제 및 예외 처리에 대해서도 고민이 많아 지게 됩니다.
이전의 수동으로 닫아주는 방법보다는 try-with-resource 방법과 함께 자원을 자동으로 해제하고, catch에서 예외 처리에 대하여
신경을 더 써주게 되면, 깔끔하면서도 더 견고한 코드로 나아갈 수 있습니다.


## 참조
- [try-with-resource Oracle 공식문서](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)
- 조슈아 블로크, "이펙티브 자바", 인사이트(2018), 47-50
