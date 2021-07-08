---
layout: post  
title: 방어적 복사와 Unmodifiable Collection
author: [3기_파피]
tags: ['immutable', 'collection']
date: "2021-04-26T12:00:00.000Z"
draft: false
image: ../teaser/defensive-copy.png
---

<p style="font-family: sans-serif; text-align: center; color: #aaa; margin-bottom: 3em; font-size: 85%">image origin: <a href="https://www.asianinvestor.net/article/japanese-korean-asset-owners-seen-getting-defensive/451581">Asian Investor</a></p>

## 방어적 복사 vs  Unmodifiable Collection

불변 객체에 대해 공부할 때 자주 나오는 키워드들이다.

내부의 값을 안전하게 보장하기 위해 사용한다.

일급 컬렉션 ```List```를 예시로 들 것이다.

## 방어적 복사란?

생성자의 인자로 받은 객체의 복사본을 만들어 내부 필드를 초기화하거나,

```getter```메서드에서 내부의 객체를 반환할 때, 객체의 복사본을 만들어 반환하는 것이다.

방어적 복사를 사용할 경우, 외부에서 객체를 변경해도 내부의 객체는 변경되지 않는다.

## 방어적 복사를 사용하지 않는다면

먼저, 방어적 복사를 하지 않았을 때의 코드를 살펴보자.

이름을 의미하는 ```Name``` 클래스가 있고,

```java
public class Name {
    private final String name;

    public Name(String name) {
        this.name = name;
    }
}
```

```List<Name>```을 가지는 ```Names``` 클래스(일급 컬렉션)가 있다. 생성자의 인자로 ```List<Name>```을 받는다. 

```java
import java.util.List;

public class Names {
    private final List<Name> names;

    public Names(List<Name> names) {
        this.names = names;
    }
}

```

아래 코드를 보고 ```crewNames```의 필드 ```names```의 값을 예측해보자. 

```java
import java.util.ArrayList;
import java.util.List;

public class Application {
    public static void main(String[] args) {
        List<Name> originalNames = new ArrayList<>();
        originalNames.add(new Name("Fafi"));
        originalNames.add(new Name("Kevin"));
        
        Names crewNames = new Names(originalNames); // crewNames의 names: Fafi, Kevin
        originalNames.add(new Name("Sally")); // crewNames의 names: Fafi, Kevin, Sally
    }
}

```

결과는 다음과 같다.

![image](https://user-images.githubusercontent.com/50273712/116042466-68087280-a6a9-11eb-9401-0942fb0c9843.png)

![image](https://user-images.githubusercontent.com/50273712/116027820-ce34cb80-a690-11eb-9d63-c0412d001923.png)


```crewNames```의 ```names```는 객체가 생성된 이후에도 외부의 값 변경에 따라 같이 변하고 있다.

```crewNames```의 필드인 ```name```과 ```originalNames```가 주소를 공유하고 있기 때문이다. 

## 방어적 복사를 사용한다면

이제 방어적 복사를 사용하는 경우를 살펴보자.

생성자에서 인자를 받으면서 ```new ArrayList<>()```를 이용해 만든 복사본으로, 필드```names``` 를 초기화하였다.

```java
import java.util.ArrayList;
import java.util.List;

public class Names {
    private final List<Name> names;

    public Names(List<Name> names) {
        this.names = new ArrayList<>(names);
    }
}
```

위에서 썼던 ```main```문을 실행시켜보자. ```crewNames```의 ```names```는 변하지 않는다.

```java
import java.util.ArrayList;
import java.util.List;

public class Application {
    public static void main(String[] args) {
        List<Name> originalNames = new ArrayList<>();
        originalNames.add(new Name("Fafi"));
        originalNames.add(new Name("Kevin"));
        
        Names crewNames = new Names(originalNames); // crewNames의 names: Fafi, Kevin
        originalNames.add(new Name("Sally")); // crewNames의 names: Fafi, Kevin
    }
}

```

```new ArrayList<>()```를 이용해 원본과의 주소 공유를 끊어냈기 때문이다.

![image](https://user-images.githubusercontent.com/50273712/116042591-89695e80-a6a9-11eb-8da3-cae896b32b43.png)

![image](https://user-images.githubusercontent.com/50273712/116027871-e99fd680-a690-11eb-8ad2-e2fbdc91615b.png)

## 방어적 복사는 깊은 복사일까?

결론부터 말하자면 방어적 복사는 깊은 복사가 아니다.

만약 방어적 복사가 깊은 복사라면, 원본과 복사본을 비교했을 때 모든 요소들의 주소가 각각 달라야 할 것이다.

하지만 위에서도 알 수 있듯 서로 컬렉션의 주소만 공유하지 않을 뿐, 내부 요소들의 주소는 공유하고 있다.

### 그래서, 방어적 복사가 깊은 복사가 아닌 게 중요해? 어쨌든 좋다며?

중요하다.

방어적 복사를 통해 객체의 복사본을 만들었어도, 내부 요소들의 주소는 원본과 공유하고 있다.

따라서 원본의 내부 요소를 바꾸면 복사본도 바뀌게 된다.

우선, ```Name``` 클래스를 가변 객체로 만들어보자. ```setter``` 메서드를 추가하였다.

```java
public class Name {
    private String name;

    public Name(String name) {
        this.name = name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
}
```

아래 코드를 보자.

```java
import java.util.ArrayList;
import java.util.List;

public class Application {
    public static void main(String[] args) {
        Name crew1 = new Name("Fafi");
        Name crew2 = new Name("Kevin");
        
        List<Name> originalNames = new ArrayList<>();
        originalNames.add(crew1);
        originalNames.add(crew2);

        Names crewNames = new Names(originalNames); // crewNames의 names: Fafi, Kevin

        crew2.setName("Sally"); // crewNames의 names: Fafi, Sally
    }
}
```

Name 객체 crew2의 내부 값을 ```setName()``` 메서드를 이용해 변경했다.

그에 따라 방어적 복사를 통해 생성된 복사본 ```crewNames``` 의 내부 값도 변경된 것이다.

여기서 끝이 아니다.

### 심지어 n번째 요소(Name)를 반환하는 메서드를 가지고 있기까지 하면?

```Names``` 클래스에 n번째 요소를 반환하는 메서드를 만들어보자.

```java
import java.util.ArrayList;
import java.util.List;

public class Names {
    private final List<Name> names;

    public Names(List<Name> names) {
        this.names = new ArrayList<>(names);
    }
    
    public Name getName(int index) {
        return this.names.get(index);
    }
}
```

아래 코드를 보자.

```java
import java.util.ArrayList;
import java.util.List;

public class Application {
  public static void main(String[] args) {
    List<Name> originalNames = new ArrayList<>();
    originalNames.add(new Name("Fafi"));
    originalNames.add(new Name("Kevin"));

    Names crewNames = new Names(originalNames); // crewNames의 names: Fafi, Kevin

    crewNames.getName(1).setName("Sally"); // crewNames의 names: Fafi, Sally
  }
}
```

직전의 예시에서는 ```crew1```, ```crew2```라는 이름으로 ```Name``` 객체를 생성했고

그 이름을 참조해야만 조작할 수 있기 때문에 객체를 생성한 곳에서만 조작할 수 있었다.  

그런데 이제는 어디서든 ```Names``` 객체만 있다면 내부의 모든 요소들에 대한 조작이 가능해진 것이다.

따라서 외부로부터의 변경에 취약하지 않도록 객체를 **불변**으로 만들고자 한다면 내부 요소들 또한 불변이어야 한다.

---

## Unmodifiable Collection이란?

```Unmodifiable Collection```을 이용했을 경우 외부에서 변경 시 예외처리되기 때문에 안전하게 보장할 수 있다. 

```unmodifiableList()``` 메서드를 통해 리턴되는 리스트는 읽기 용도로만 사용할 수 있으며,  ```set()```,``` add()```, ```addAll()``` 등의 리스트에 변경을 가하는 메서드를 호출하면 ```UnsupportedOperationException``` 이 발생한다. 

다만, ```Unmodifiable```과 ```Immutable```은 다르다. ```Unmodifiable```이라는 키워드가 불변을 보장해주지는 않는다. 

원본 자체에 대한 수정이 일어나면 ```unmodifiableList()``` 메서드를 통해 리턴되었던 리스트 또한 변경이 일어난다.

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Application {
    public static void main(String[] args) {
        List<Name> originalNames = new ArrayList<>();
        originalNames.add(new Name("Fafi"));
        originalNames.add(new Name("Kevin"));

        List<Name> crewNames = Collections.unmodifiableList(originalNames); // crewNames: Fafi, Kevin

        originalNames.add(new Name("Sally")); //crewNames: Fafi, Kevin, Sally
    }
}

```

![image](https://user-images.githubusercontent.com/50273712/116027872-ea386d00-a690-11eb-96c6-e78f3b6b6f78.png)

## 결론 

그래서, ```방어적 복사```와 ```Unmodifiable Collection``` 각각을 언제 어떻게 사용해야 할까?

핵심은 **객체 내부의 값을 외부로부터 보호하는 것**이라는 것을 유념하자.

### 생성자의 인자로 객체를 받았을 때

외부에서 넘겨줬던 객체를 변경해도 내부의 객체는 변하지 않아야 한다.

따라서 방어적 복사가 적절하다.

### getter를 통해 객체를 리턴할 때

이 상황에선 ```방어적 복사```를 통해 복사본을 반환해도 좋고, ```Unmodifiable Collection```을 이용한 값을 반환하는 것도 좋다.

```java
import java.util.ArrayList;
import java.util.List;

public class Names {
    private final List<Name> names;

    public Names(List<Name> names) {
        this.names = new ArrayList<>(names);
    }

    public List<Name> getNames() {
        return new ArrayList<>(names); // 방어적 복사를 이용하여 복사본을 반환한다.
    }
}
```

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Names {
    private final List<Name> names;

    public Names(List<Name> names) {
        this.names = new ArrayList<>(names);
    }

    public List<Name> getNames() {
        return Collections.unmodifiableList(names); // Collections.unmodifiableList 메서드를 이용하여 반환한다.
    }
}
```
