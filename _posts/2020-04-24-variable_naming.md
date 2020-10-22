---
layout: post
title: "좋은 코드를 위한 자바 변수명 네이밍"
author: "오렌지"
comment: "true"
tags: ["naming", "convention"]
toc: true
---
# JAVA 변수명 네이밍 규칙

보통 읽기 좋은 코드를 좋은 코드라고 한다. 
변수, 메소드, 클래스 등의 이름이 일관성이 없고 그것의 쓰임을 분명히 나타내지 않는다면 어떨까?


#### 코드의 유지보수가 어려워진다. 

 + 이름만 보고 쓰임을 알 수 없으면, 코드를 읽고 분석해야 하는 불필요한 과정이 필요하다.
 + 좋은 이름을 지으려면 시간이 걸리지만, 좋은 이름으로 절약하는 시간이 훨씬 더 많다.
```java
int a = 33;
int age = 33;
```
두 변수는 모두 나이 정보를 나타내는 변수이다. `a` 와 `age` 중 어떤 것이 더 바람직한가?
`age` 의 경우에는 변수를 보고 바로 나이 변수임을 알 수 있다.
`a` 가 무엇을 의미하는지 알기 위해서는 코드 분석이 반드시 필요하다.



#### 협업자에 대한 배려가 필요하다.

 + 협업자와 함께 개발을 하는 경우에는 이름을 통해 그것이 무엇인지 나타내야 한다. 
 + 그러므로 이름을 주의 깊게 살펴 더 나은 이름이 떠오르면 개선하는 것이 좋다. 그러면 (자신을 포함해) 코드를 읽는 사람이 좀 더 행복해질 것이다.



프레임워크마다 코드 컨벤션이 달라지긴 하지만, 보통 자바는 오라클의 자바 코드 컨벤션을 따른다.
이 글에서는 모든 자바 네이밍 규칙을 다루지는 않고, 변수의 네이밍에 대한 규칙을 간단히 소개해 보려고 한다.





## 기본적인 변수명 네이밍 컨벤션

#### 컴파일러에서 제한하는 변수 명명 규칙

+ 대소문자는 구분되며 길이의 제한은 없다.
+ 예약어를 사용해서는 안 된다.
+ 숫자로 시작하면 안 된다.
+ 특수문자는 `_` 와 `$` 만 허용한다.




#### JE22 에서 권장하는 변수 명명 규칙

+ 변수는 첫 글자의 소문자로 시작하는 명사로 짓는다.
+ 여러 단어로 이루어진 이름인 경우 각 단어의 첫 글자를 대문자로 한다. (카멜 표기법 사용)

```java
String userName;
```





## 좋은 변수명 짓기

#### 의도를 분명히 밝혀 이름을 짓기

+ 따로 주석이 필요하다면 의도를 분명히 드러내지 못했다는 소리다.
+ 변수 이름은 변수가 표현하고 있는 것을 완벽하고 정확하게 설명해야 한다.
+ 이름은 가능한 구체적이어야 한다. 모호하거나 하나 이상의 목적으로 사용될 수 있는 일반적인 이름은 보통 좋지 않은 이름이다.

```java
Set<BoardSquare> findSquaresToRemove(BoardSquare s) {...}
```

`s` 라는 이름을 봤을 때 String 의 s인지, Square의 s인지 바로 알 수가 없다.

```java
Set<BoardSquare> findSquaresToRemove(BoardSquare boardSquare) {...}
```

`boardSquare` 라고 변경함으로써 이름을 통해 적절한 의미를 나타내줄 수 있다.



####  협업을 염두해서 짓기

```java
private void validateNumericPosition(String[] expressionAsArray) {
    for (int i = 0; i < expressionAsArray.length; i += 2) {
    	...
    }
}
```

위 코드에서 2가 의미하는게 뭘까?
다른 사람이 봤을 때 `i += 2` 를 통해 어떤 처리를 하는지 파악하려면 코드를 분석해야 한다.

```java
private void validateNumericPosition(String[] expressionAsArray) {
    int numberIndex = 2;
    for (int i = 0; i < expressionAsArray.length; i += numberIndex) {
    	...
    }
}
```

2에 `numberIndex` 라는 의미 있는 변수명을 붙여주면 숫자만 걸러내기 위한 식인지 알 수 있다.




#### 맥락을 고려해서 짓기

앞서 보았던 여러 예시에서 나타나듯이, 이름이 지나치게 짧을 경우 변수의 용도를 알기 어렵다. 

+ 의도가 불분명한 짧은 이름보다는 의미있는 맥락이 있는 긴 이름이 좋다.

+ 그러나, 쓸데없이 구구절절한 이름은 오히려 독이 된다.
```java
public class User{
    String userName;
    int userAge;
    ...
}
```
위 코드를 보면, 클래스의 이름에서 user정보를 담고 있다는 것을 알 수 있다.
정확한 의미를 담으려는 의도는 좋지만, 굳이 멤버변수의 이름을 `userName`, `userAge`로 지을 필요가 없다.

```java
public class User{
    String name;
    int age;
    ...
}
```
user를 붙이지 않아도 충분히 정보를 전달할 수 있다.



#### 불린 변수의 네이밍

+ 전형적인 불린 변수의 이름을 사용한다.
  `done`, `error`, `found`, `success`, `ok`
  성공했다는 것을 정확히 설명하는 구체적인 이름이 있다면 다른 이름으로 대체하는 것이 좋다.
  `found`, `processingComplete` 등

+ 참이나 거짓의 의미를 함축하는 불린 변수의 이름을 사용한다.
  `status`, `sourceFile` 같은 변수들은 참이나 거짓이 명백하지 않으므로 좋지 못한 이름이다.
  `statusOK`, `sourceFileAvailable` 또는 `sourceFileFound` 와 같은 이름으로 대체한다.

+ 긍정적인 불린 변수 이름을 사용한다.

아래 코드에서 어떤 경우가 더 읽기 쉬운가?

```java
if(notFound == false) {...}
if(found == true) {...}
```

`notFound`, `nonDone`, `notSuccessful` 과 같은 이름은 변수의 값이 부정이 됐을 때 읽기 어렵다. 

+ 접두어 `is`
  

자바에서는 접두어 `is` 를 붙여 불린 메소드나 변수명을 짓는다.
그러나, 접두어가 없는 이름이 읽고 이해하는데 더 쉬운 경우가 있다.

```java
if(isfound) {...}
if(found) {...}
```
접두어 `isfound` 보다 `is` 를 붙이지 않은 `found` 가 오히려 더 쉽게 읽힌다.




#### 메소드가 여러번 호출된 한눈에 보기 힘든 코드

```java
private static final String FORMAT_SYMBOL = "//(.*)\\\\n(.*)";

public static List<String> customSplit(String input) {
    Matcher matcher = Pattern.compile(FORMAT_SYMBOL).matcher(input);
    if (matcher.find()) {
        return Arrays.asList(matcher.group(2).split(Pattern.quote(matcher.group(1))));
    }
    ...
}
```
위 코드의 리턴 부분을 보았을 때, 한 줄에 많은 기능이 있어서 코드 읽기가 어렵다.


```java
private static final String FORMAT_SYMBOL = "//(.*)\\\\n(.*)";

public static List<String> customSplit(String input) {
    Matcher matcher = Pattern.compile(FORMAT_SYMBOL).matcher(input);
    if (matcher.find()) {
        String splitSymbol = matcher.group(1);
        String content = matcher.group(2);
        return Arrays.asList(content.split(Pattern.quote(splitSymbol)));
    }
    ...
}
```
`splitSymbol`, `content` 변수로 선언해 줌으로써 이전보다 훨씬 읽기가 수월해진다.

 

#### 변수 이름에 자료형이 들어간다면?

```java
private List<Double> numberList = new ArrayList<>();
private List<String> operatorList = new ArrayList<>();
```

List 대신 다른 자료형(Set...)을 써야 하는 경우가 오면 어떻게 해야 할까?
기존 변수명이 적절한 의미를 나타내지 못하게 되므로 결국 변수명을 변경해야 하는 번거로움이 생긴다.
변수 이름에 자료형을 쓰지 않아도 타입을 통해 충분히 어떤 변수인지 파악이 가능하다.

```java
private List<Double> numbers = new ArrayList<>();
private List<String> operators = new ArrayList<>();
```

List, Collection 등의 자료형은 복수형으로 표현하는 것이 좋다.



------

#### 참고 링크

+ [효과적인 이름짓기](https://remotty.github.io/blog/2014/03/01/hyogwajeogin-ireumjisgi/)
+ [의미 있는 이름 - 프로그래밍 네이밍방법](https://his2070.tistory.com/6)
+ [Clean Code 2장 -  의미 있는 이름](https://devstarsj.github.io/study/2018/12/02/study.cleanCode.02/)

