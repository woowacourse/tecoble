---
layout: post
title: java에서 객체를 생성하는 다양한 방법
author: [샐리]
tags: ['java']
date: '2021-05-17T12:00:00.000Z'
draft: false
image: ../teaser/java.png
---

이 글은 java 초심자들에게 추천합니다.

우리가 사용하는 java라는 언어는 객체지향 프로그래밍 언어입니다.  
객체지향 프로그래밍이란 수행하고자 하는 프로그래밍 로직을 상태와 행위로 이루어진 객체들의 모임으로 수행해나가는 것입니다.  
자연스레 우리는 java로 프로그래밍을 할 때 어떠한 `행위`을 맡길 객체를 생성하게 되고, 행위를 수행할 `책임`을 맡은 객체에게 `상태`를 부여합니다.

이렇게 객체에 책임과 상태를 부여함으로써 현실 세계에서의 물건과 유사합니다.  
예를 들어 학생이 `24살`이라는 상태와 `샐리`라는 이름을 가지고 있는 것을 생각할 수 있습니다.

그렇다면 이러한 객체를 생성하는 방법에는 어떤 것이 있을까요?

### 기본 생성자
가장 기본적으로 객체를 생성하는 방법을 알아봅시다.  
예제의 객체는 `Student`는 자신의 `상태`인 나이와 이름을 가지고 있습니다.  
`Student`는 자신의 나이에서 입력받은 `adder`를 더하는 `행위`를 수행하는 `addAge(int)` 메서드를 가지고 있습니다.

이렇게 자신의 상태를 가지고 있는 객체는 그 상태를 초기화해주는 생성자가 필요합니다.

생성자까지 포함한 Student 객체의 코드는 아래와 같습니다.
```java
public class Student {
    private int age;
    private String name;

    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void addAge(int adder) {
        this.age += adder;
    }
}
```  

아래와 같은 코드로 Student 객체의 `name`에는 "sally", `age`에는 24라는 상태를 부여할 수 있습니다.  

```java
Student student = new Student("sally", 24);
```  

만약 여기서 같은 변수를 가진 StudentRequest를 전달받아 Student로 변환해야하는 경우가 있다고 가정해봅시다.
```java
StudentRequest studentRequest = new StudentRequest("student", 23);
Student student = new Student(studentRequest.getName(), studentRequest.getAge());
```  
이처럼 구현하기에는 가독성이 떨어지고 studentRequest의 정보가 불필요하게 공개되어 캡슐화라는 장점을 가진 객체지향 프로그램의 특성이 헤쳐진다는 단점이 있습니다.

주생성자와 부생성자를 만들어 생성자를 추가하는 방법으로 이를 해결할 수 있습니다.

### 주생성자/부생성자
Student와 같이 나이와 이름 상태를 가진 Person 객체를 Student 객체로 생성한다고 생각해봅시다.  
getter를 사용해 다음과 같이 구현할 수 있습니다.

```java
Person nick = new Person("nick", 8);
Student personToStudent = new Student(nick.getName(), nick.getAge()));
```  

하지만 이렇게 구현하게 되면 person이 가진 속성을 getter로 공개해야 한다는 단점이 있습니다.  
이를 주생성자/부생성자를 통해 해결할 수 있습니다.

```java
public class Student {
    private String name;
    private int age;

    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public Student(Person person) {
        this(person.getName(), person.getAge());
    }
}
```  

위와 같이 구현하게 되면 Person 객체를 다음과 같이 간단하게 생성할 수 있습니다.

```java
Person nick = new Person("nick", 8);
Student personToStudent = new Student(nick);
```  

이 때 아래의 생성자를 부생성자라고 하고, 상단의 생성자를 주생성자라고 합니다.  
생성자가 추가됨에 따라 유연하게 객체를 생성할 수 있어진 것을 알 수 있습니다.

이번에는 student 객체에 score라는 상태가 추가된다고 가정해보겠습니다.  
하지만 같은 student 객체임에도 이 score가 불필요한 경우가 있다고 할 때, 새로운 클래스를 만들지 않고 생성할 수 있는 방법은 무엇이 있을까요?  
이 경우에도 새로운 생성자를 추가해 해결할 수 있습니다.

```java
public class Student {
    private String name;
    private int age;
    private int score;

    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public Student(String name, int age, int score) {
        this.name = name;
        this.age = age;
        this.score = score;
    }

    public Student(StudentRequest studentRequest) {
        this(studentRequest.getName(), studentRequest.getAge());
    }
    
    public void addAge(int adder) {
        this.age += adder;
    }
}
```  

아래와 같이 주생성자와 부생성자를 활용하는 this를 이용해 코드의 중복을 피할 수도 있습니다.

```java
    public Student(String name, int age, int score) {
        this(name, age);
        this.score = score;
    }
```

이처럼 생성자의 추가를 두려워하지 않으면 객체를 사용함에 있어 유연성과 확장성이 커진다는 것을 알 수 있습니다.

하지만 이와 같이 구현하는 경우, 첫번째 생성자를 이용하면 score에는 null 값이 들어가게 된다는 문제가 있습니다.  
이렇게 생성자가 만들어진 경우 score의 사용이 필요한 객체임에도 개발자가 착각해서 잘못된 생성자를 사용한다면, score 사용 시에 null이 들어가있어 객체를 사용할 때 자칫하면 Null Pointer Exception이 발생할 수 있습니다.

정적 팩토리 메서드를 가짐으로써 이 문제를 해결할 수 있습니다.

### 정적 팩토리 메서드
정적 팩토리 메서드란 객체의 생성자를 숨기면서 객체를 만들어낼 수 있는 메서드입니다.  
구현은 다음과 같습니다.  

```java
public class Student {
    private String name;
    private int age;
    private int score;

    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }

    private Student(String name, int age, int score) {
        this(name, age);
        this.score = score;
    }

    public static Student withScore(String name, int age, int score) {
        return new Student(name, age, score);
    }
}
```  

정적 팩토리 메서드는 이름을 가짐으로써 객체 생성의 의도를 드러낼 수 있습니다.  
그렇게 되면 여러 생성자가 생겼을 때 명확한 의도를 가진 이름으로 구분할 수 있습니다.  
또한, 이 예제와는 무관하지만 여러 객체를 캐싱해두고 팩토리메서드를 사용하는 경우에는 메서드가 호출될 때마다 인스턴스를 새로 생성하지 않아도 된다는 장점이 있습니다.

지금은 예시를 위해 이해가 쉬운 함수명을 지었지만 정적 팩토리 메서드명을 짓는데도 개발자 간 이해를 돕기 위한 암묵적인 컨벤션이 존재하는데, 자세한 것은 `Effective Java`의 `아이템 01 - 생성자 대신 정적 팩토리 메서드를 고려하라`에서 참고할 수 있습니다.

## 결론
객체의 활용성이 커질수록 우리는 다양한 생성자를 만들며 객체를 유연하게 확장해갈 필요성이 있습니다.  
다양한 생성자로 확장에 유리해진 객체는 더 많은 책임을 맡아 수행할 수 있습니다.  
적재적소에 올바른 방법으로 생성자를 만들고, 이를 통해 객체를 만들며 프로그래밍하는 것은 어떨까요?  
