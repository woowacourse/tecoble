---
layout: post
title: "원시 타입을 포장해야 하는 이유"
author: "오렌지"
comment: "true"
tags: ["blog", "jekyll"]
---



변수를 선언하는 방법에는 두 가지가 있다.

```java
int age = 20;
Age age = new Age(20);
```

원시 타입의 변수를 선언하는 방법과, 
원시 타입의 변수를 객체로 포장한 변수를 선언하는 방법이 있다.

이번 글에서는 원시 타입의 값을 객체로 포장하면 얻을 수 있는 이점들에 대해 소개하려고 한다.





### 자신의 상태를 객체 스스로 관리할 수 있다.


User 라는 클래스에서, 사용자의 나이 값을 가지고 있다고 가정 해 보자.
```java
public class User {
    private int age;

    public User(int age) {
        this.age = age;
    }
}
```

위의 형태처럼 원시 타입인 int 로 나이를 가지고 있으면 어떻게 될까?
쉽게 생각해 보면 우선, 나이에 관한 유효성 검사를 User 클래스에서 하게 된다.

```java
public class User {
    private int age;

    public User(String input) {
        int age = Integer.parseInt(input);
        if (age >= 0) {
            throw new RuntimeException("나이는 0살부터 시작합니다.");
        }
        this.age = age;
    }
}
```
이런 식으로 말이다. 지금 예시에는 User 클래스의 멤버변수가 나이밖에 없어 문제를 못 느낄 수도 있다.
사용자의 이름, 이메일 등 추가적인 값들을 관리하게 된다면 문제가 생길 수 밖에 없다.
두 글자 이상의 이름만을 지원한다고 가정하고, 이름 변수를 추가해 보자.

```java
public class User {
    private String name;
    private int age;

    public User(String nameValue, String ageValue) {
        int age = Integer.parseInt(ageValue);
        validateAge(age);
        validateName(nameValue);
        this.name = nameValue;
        this.age = age;
    }

    private void validateName(String name) {
        if (name.length() < 2) {
            throw new RuntimeException("이름은 두 글자 이상이어야 합니다.");
        }
    }

    private void validateAge(int age) {
        if (age >= 0) {
            throw new RuntimeException("나이는 0살부터 시작합니다.");
        }
    }
}
```
와우! 고작 두 개의 멤버변수를 선언했을 뿐인데 User클래스가 할 일이 늘어나 버렸다!
**이름** 값에 대한 상태 관리, **나이** 값에 대한 상태 관리를 모두 해야 한다. 
또, 각각 변수의 고유 특성이 추가된다면 이 역시 User 클래스에서 해야 할 일이 되어 버린다.

User클래스는 분명히, 
> 아, 나는 사용자 그 자체 상태만 관리하고 싶은데 왜 자잘자잘한 것 까지 내가 관리해야돼? 이건 불합리해!

라고 생각하지 않을까?

그럼, 원시 타입 변수를 포장해보자.


```java
public class User {
    private Name name;
    private Age age;

    public User(String name, String age) {
        this.name = new Name(name);
        this.age = new Age(age);
    }
}

public class Name {
    private String name;

    public Name(String name) {
        if (name.length() < 2) {
            throw new RuntimeException("이름은 두 글자 이상이어야 합니다.");
        }
        this.name = name;
    }
}

public class Age() {
    private int age;

    public Age(String input) {
        int age = Integer.parseInt(input);
        if(age >= 0) {
            throw new RuntimeException("나이는 0살부터 시작합니다.");
        }
    }
}
```
User클래스가 해방됐다.
> 와! 나 이제 예외처리 안 해도 돼!

이름과 나이 값이 각각의 Name, Age가 담당하도록 바뀌었다. 
유효성 검증을 비롯한 이름, 나이 값에 대한 상태값을 User에게 넘기지 않고 스스로 관리할 수 있게 되었다. 책임이 명확해졌다.






### 코드의 유지보수에 도움이 된다.

이번엔 다른 예시를 살펴보자.



