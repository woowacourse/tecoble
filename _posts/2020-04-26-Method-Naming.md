---
layout: post
title: "좋은 코드를 위한 자바 메서드 네이밍"
author: "티거"
comment: "true"
tags: ["naming", "convention"]
toc: true
---

## 네이밍이 중요한 이유

> 클린 코드 참조

코드를 작성한 의도와 목적이 명확해야 하며 다른 사람이 쉽게 읽을 수 있어야 하기 때문이다.

왜 그래야 하나? 

코드의 가독성이 좋아진다. 

그러면 뭐가 좋나?

다른 사람이 코드를 이해하는데 들이는 시간을 최소화하는 방식으로 작성된다는 것을 의미하기 때문이다.

- 의도가 모호한 코드

    ```java
    // 각 이름이 충분한 정보 제공을 하지 않음
    public List<int[]> getThem() {
        List<int[]> list1 = new ArrayList<int[]>();
        for (int[] x : theList) {
            if (x[0] == 4) {
                list1.add(x);
            }
        }
        return list1;
    }
    ```

- 의도가 분명한 코드

    ```java
    // 이름이 명확히 변경
    public List<int[]> getFlaggedCells() {
        List<int[]> flaggedCells = new ArrayList<int[]>();
        for (int[] cell : gameBoard) {
            if (cell.isFlagged()) {
            	flaggedCells.add(cell);
            }
        }
        return flaggedCells;
    }
    ```

첫 번째 코드는 getThem이 무엇을 하는 함수인지, 변수 list1이 무엇을 담고 있는지 알 수 없다. 

하지만 두 번째 코드는 이름만 봐도 getFlaggedCells는 FlaggedCells을 반환하고, FlaggedCells는 flag된 cell들을 담고 있는 것을 알 수 있다.

### 네이밍시 중요한 고려사항

네이밍을 할 때 다음과 같은 질문을 통해 이름을 짓는 것이 필요하다.

- 왜 존재해야 하는가

- 무슨 작업을 하는가

- 어떻게 사용하는가

- Example

  ```java
  public List<Piece> findPiecesByColor(Color color){}
  // 왜 존재해야 하는가 - color에 대해 존재하는 piece들을 알기 위해.
  // 무슨 작업을 하는가 - color에 맞는 piece들을 가져온다.
  // 어떻게 사용하는가 - 체스판에서 흑색(or 백색)의 piece들을 가져와서 점수를 계산.
  ```

이름만으로도 언제 이 메서드를 호출해야 하는지 의미를 파악할 수 있도록 구체적으로 작성하도록 해야 한다.

## 메서드 명명 규칙

- 메서드 이름은 lowerCamelCase로 작성한다.

  -  메서드의 이름에는 첫 번째 단어를 소문자로 작성하고, 이어지는 단어의 첫 글자를 대문자로 작성하는 소문자 카멜표기법를 사용한다.

- 메서드 이름은 동사/전치사로 시작한다.

  - 메서드명은 기본적으로는 동사로 시작한다. 다른 타입으로 전환하는 메서드나 빌더 패턴을 구현한 클래스의 메서드에는 전치사를 쓸 수 있다.

    ```java
    // Example
    // 동사
    public void getUserByName(){}
    public void setDisplayName(){}
    public void inputData(String input){}
        
    // 전치사
    public String toString(){}
    public User of(){}
    ```

- JUnit 테스트 메소드 이름에 언더스코어(_)가 표시되어 이름의 논리 컴포넌트를 구분하고 각 컴포넌트는 lowerCamelCase로 작성된다.

  ```java
  // Example
  // 1. MethodName_StateUnderTest_ExpectedBehavior (메서드명_테스트상태_기대행위)
  @Test
  void isAdult_AgeLessThan18_False(){}
  
  // 2. MethodName_ExpectedBehavior_StateUnderTest (메서드명_기대행위_테스트상태)
  @Test
  void isAdult_False_AgeLessThan18(){}
  ```

## 메서드 이름으로 자주 사용되는 동사

> 동사라도 알면 쓰고 시작을 할 수 있다.(시작이 반이다...) 시간을 조금이라도 단축하고 싶은 마음에 자주 쓰는 동사를 정리해보았다.

- get/set

  - 먼저 getter/setter 관련하여 자바빈 규약이 있다.

    ```java
    // 멤버변수마다 별도의 get/set메서드가 존재한다.
    public class Student {
        private String name;
        private int age;
        
        public String getName() {
            return name;
        }
        
        public int getAge() {
            return age;
        }
        
        public String setName(String name) {
            this.name = name;
        }
        
        public int setAge(int age) {
            this.age = age;
        }
    }
    ```

    이러한 상황이 아니라면 다음과 같은 말을 기억하면 좋을 것 같다.

    > setter 하는 일이 단순하고, 객체 생성 시점에 필요한 모든 값들을 주입하지 않아 개발자의 실수가 발생할 수 있다. 또한, public 으로 공개해놓은 set 메서드는 코드 다른 부분에서 언제 호출되어 값이 바뀔지 알기 힘들다. 고민 없이 자바빈 규약에 따른 getter, setter는 객체지향적인 코드작성에 가장 큰 적이라고 할 수 있다.

    > 객체의 데이터에 마음대로 접근할 수 있다면 메소드를 통해 만들어진 데이터는 의미가 없게 되는 문제가 생긴다.

  - 되도록이면 상태 데이터를 가지는 객체에서 데이터를 (get)하지 말고 객체에 메시지를 보내는 것을 추천한다.

    ```java
    private boolean isMaxPosition(Car car) {
    	return car.getPosition() == maxDistance;
    }
    ```

    위와 같이 구현하지 않고 다음과 같이 Car에게 메시지를 보내 구현한다.

    ```java
    car.isMaxPosition(maxDistance);
    ```

- init

  - 데이터를 초기화하는 메서드 명에 쓰인다.
    ```java
    // 만약 User클래스 안에 있다면 User 데이터를 초기화하는 메서드
    public void initData(){}
    ```

- is/has/can
  - 위의 3개는 boolean 값을 리턴한다.

  - is는 맞는지 틀린지 판단하는 메서드 명에 쓰인다.

    ```java
    // 숫자인지 판단하는 메서드
    public boolean isNumber(){}
    ```

  - has는 데이터를 가지고 있는지 확인하는 메서드 명에 쓰인다.

    ```java
    // Data를 가지고 있는지 확인하는 메서드
    public boolean hasData(){}
    ```

  - can는 할 수 있는지 없는지 확인하는 메서드 명에 쓰인다.

    ```java
    // 주문할 수 있는지 없는지 확인하는 메서드
    public boolean canOrder(){}
    ```

- create

  > 필자는 팩토리 메서드 패턴 블로그 글에서 많이 보았다.

  - 새로운 객체를 만든 후 리턴해주는 메서드 명에 쓰인다.

    ```java
    // Board를 만든 후 리턴해주는 메서드
    public Board create(){}
    ```

- find

  - 데이터를 찾는 메서드 명에 쓰인다.

    ```java
    // number에 해당하는 Element를 찾아 리턴하는 메서드
    public Element findElement(int number){}
    ```

- to

  - 해당 객체를 다른 형태의 객체로 변환해주는 메서드 명에 쓰인다.

    ```java
    // Ex) String으로 변환하는 메서드
    public String toString(){}
    ```

- A-By-B

  - B를 기준으로 A를 하겠다는 메소드명에 쓰인다.

    ```java
    // Ex) Name을 기준으로 User를 get하는 메서드
    public void getUserByName(String name){}
    ```

## 참고한 사이트

[자바 명명 규칙](<https://m.blog.naver.com/reona7140/221306141987>)

[7 Popular Unit Test Naming Conventions](<https://dzone.com/articles/7-popular-unit-test-naming>)

[Google Java Style Guide](<https://google.github.io/styleguide/javaguide.html#s5.3-camel-case>)

[캠퍼스 핵데이 Java 코딩 컨벤션](<https://naver.github.io/hackday-conventions-java/#method-lower-camelcase>)

[우리집앞마당](https://multifrontgarden.tistory.com/207) 

[Dev 미티치 블로그](https://mititch.tistory.com/77)
