---
layout: post  
title: 자원을 자동으로 해제, try-with-resource
author: [와이비]
tags: ['java']
date: "2021-04-26T12:00:00.000Z"
draft: false
image: ../teaser/try-with-resource.png

---
우리는 자바로 프로그램을 짜면서 시스템에 있는 자원들을 사용하게 됩니다. 
자원 자체를 사용하는 것뿐만 아니라 사용이 끝났을 때 해제하는 것도 매우 중요한 일입니다. 
자원 해제를 잊어버리거나, 예외 처리 과정 중에 해제가 이루어지지 않을 수 있습니다. 
Java의 예외 처리 기능인 _try-with-resource_ 와 함께 자바에서의 자원을 사용 이후에 자동으로 해제하보도록 하겠습니다.
---

## Resource
자원은 시스템을 운영하는 데 있어서 메모리나 입출력 장치 등 하드웨어, 소프트웨어 형태로 존재하는 구성요소를 의미합니다.
오늘 자원이라고 지칭할 개념은 자바의 외부자원으로서 _JVM_ 바깥에 메모리 이외의 자원을 지칭하겠습니다.  
자바에서 자원을 사용하고 나면 해제를 해주어야 합니다.
자원을 해제하지 않으면 메모리 누수 및 해당 객체가 올바르게 작동하지 않을 수 있습니다.
_GC(Garbage Collection)_ 를 믿기보단 직접적으로 해제해주는 편이 좋습니다.
자주 사용하는 자원 관련 객체는 _InputStream_ , _OutputStream_ , 그리고 _java.sql.Connection_ 이 있습니다.
각각의 객체들은 자원과 연결하여, 외부에서 가져온 기능들을 사용할 수 있게 해줍니다.
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
자원을 사용할 때에는 먼저 (1)의 과정인 해당 자원과 객체를 연결해주어야 합니다. 
그다음에는 (2)의 과정처럼 해당 자원을 사용하여, 필요한 로직들을 실행합니다. 
마지막으로 (3)의 과정처럼 해당 자원을 해제하면 됩니다. 
간단해 보이지만 이곳에서 문제가 생길 수가 있습니다. 
만약 예외가 발생한다면, 중간의 자원이 해제되지 않을 가능성이 있기 때문입니다. 
JavableBook이라는 책의 페이지가 150쪽이라고 가정을 하게 되면 (2)의 로직을 처리하는 과정에서 예외가 발생이 될 것입니다.
(2)에서 예외가 발생하면 (3)까지 가지 못하고 예외 처리 로직으로 이동하게 됩니다. 
예외의 발생으로 인하여 자원이 해제되지 않는 결과가 발생합니다.
이 문제점을 해결하기 위해서 나온 방법이 _try-finally_ 방법입니다.

## 예외 처리를 고려한 기존의 자원 해제 방법 try - finally

_try-finally_ 는 기존의 블록 단위 예외 처리 방법입니다.
원래 _try-catch-finally_ 블록으로 이루어집니다. 
_try_ 는 처음에 실행하고 싶은 블록, _catch_ 는 예외가 발생 시에 처리하고 싶은 블록입니다.
마지막으로 _finally_ 는 예외 발생 여부에 상관없이 최종적으로 처리하고 싶은 블록을 담게 됩니다. 
이때, 예외 발생 여부에 상관없이 최종적으로 _finally_ 블록을 처리한다는 점을 활용하여 자원을 사용한 다음에 해제하도록 하겠습니다.

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
위의 예시처럼 _try_ 에서 자원을 할당받는 (1) 이나 자원을 사용하여 로직을 수행하는 (2)에서 어떠한 오류가 발생하더라도, 
(3)에서 최종적으로 자원을 해제하게 되므로 저희는 자원 해제를 보장할 수 있습니다. 
하지만 _try-finally_ 의 단점은 무엇이 있을까요? 
JavableBook뿐만이 아니라 다른 자원에 관련된 객체인 JavableVideo를 사용하는 예시를 보겠습니다.

``` java
public void play() throws IOException {
    try {
        JavableBook book = new JavableBook();        //----(1)
        try {
            JavableVideo video = new JavableVideo(); //----(1)
            book.page(150);                          //----(2)
            video.scene(150);                        //----(2)
        } finally {
            video.close()                            //----(3)
    } finally {
        book.close()                                 //----(3)
    }
}
```

갑자기 기하급수적으로 **indent**가 증가한 것을 볼 수가 있습니다. 
만약 자원을 더 사용하게 된다면, 너무나도 많은 _try-finally_ 절이 추가될 것이라는 것을 예상할 수가 있습니다.
이는 코드가 점점 길어지고 **indent**가 깊어지며 지저분해지는 것을 뜻합니다.

## try-with-resource
이러한 점들을 만족시키는 것이 바로 _try-with-resource_ 라는 방법입니다. 
Java 7부터 추가된 이 방법은 앞서 언급한 문제점들을 대해서 해결할 수 있는 점이 장점이 있습니다.

``` java
public void play() throws IOException {
    try (JavableBook book = new JavableBook();
         JavableVideo video = new JavableVideo();){ //----(1)
         book.page(150);
         video.scene(150);                          //----(2)
    }
}
```

위의 예시 코드를 보게 된다면, 
- try 바로 다음 소괄호에서 자원을 할당받게 되는 (1)의 단계를 진행하게 됩니다. 
- 중괄호에서 로직을 실행하게 되는 (2)의 단계를 밟게 됩니다. 

하지만 이 때까지 방법과 다르게 (3)의 단계가 보이지 않습니다. 
_try-with-resource_ 에서는 구절이 모두 끝나게 된다면 자동으로 자원을 반납하게 됩니다.  
그러나 아무런 자원이나 반납이 가능한 것이 아닙니다.
사용자가 임의로 정의한 자원을 할당 받는 객체는 사용하는 현재 구현에서는 _try-with-resource_ 가 작동하지 않을 것으로 예상이 됩니다.
_try-with-resource_ 를 통하여 해제할 자원을 가진 객체는 _AutoCloseable_ 이라는 _Interface_ 를 구현을 해야합니다. 

## Interface AutoCloseable && Method close
이해를 돕기 위해 _try-with-resource_ 에서 자동으로 해제되는 자원인 _FileInputStream_ 소스 코드 구현의 일부를 예시로 보도록 하겠습니다.

``` java
//Class FileInputStream 소스 코드 일부
public class FileInputStream extends InputStream

//Abstract Class InputStream 소스 코드 일부
abstract class InputStream implements Closeable

//Interface Closeable  소스 코드 일부
public interface Closeable extends AutoCloseable {
   public void close() throws IOException;
}

//Interface AutoCloseable 소스 코드 일부
public interface AutoCloseable {
   void close() throws Exception;
}
```

_FileInputStream_ 에서는 _Closeable_ 를 구현하고 있습니다.
_Closeable_ 의 경우에는 _try-with-resource_ 를 사용할 수 있게 해주는 _AutoCloseable_ 를 상속받아서 사용하고 있습니다.
이 때문에 _try-with-resource_ 에 필수적인 close _Method_ 가 각각의 자원에 관련된 객체의 특성에 맞게 구현이 되어있습니다.
다음과 같이 저희가 만든 객체에도 _AutoCloseable_ 라는 _Interface_ 의 close _Method_ 를 구현하게 되면, 
_try-with-resource_ 를 사용할 수 있게 됩니다.

``` java
//try-with-resource 사용을 위한 JavableBook 추가 구현
public class JavableBook implements AutoCloseable {
    @Override
    public void close() throws IOException {
        //책에 대한 자원을 해제하는 로직
    }
}
```

## 결론
코드가 복잡해질수록, 자원을 사용 방향 및 방법뿐만 아니라 해제 및 예외 처리에 대해서도 고민이 많아 지게 됩니다.
이전의 방법보다는 _try-with-resource_ 방법과 함께 자원을 자동으로 해제하고, _catch_ 에서 예외 처리를 해주면
깔끔하면서도 더 견고한 코드로 나아갈 수 있습니다.


## 참조
- [try-with-resource Oracle 공식문서](https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html)
- 조슈아 블로크, "이펙티브 자바", 인사이트(2018), 47-50
