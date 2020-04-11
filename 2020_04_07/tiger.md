# Method Naming

## 네이밍시 가장 중요한 고려사항

- 변수 이름이 변수가 표현하고 있는 것을 완벽하고 정확하게 설명해야 한다.
- 이름은 가능한 구체적이어야 한다. 모호하거나 하나 이상의 목적으로 사용될 수 있는 일반적인 이름은 보통 나쁜 이름이다.

## 메서드 명명 규칙

- 메서드 이름은 lowerCamelCase로 작성한다.

  -  메서드의 이름에는 첫 번째 단어를 소문자로 작성하고, 이어지는 단어의 첫 글자를 대문자로 작성하는 소문자 카멜표기법를 사용한다.

- 메서드 이름은 동사/전치사로 시작한다.

  - 메서드명은 기본적으로는 동사로 시작한다. 다른 타입으로 전환하는 메서드나 빌더 패턴을 구현한 클래스의 메서드에는 전치사를 쓸 수 있다.

    ```java
    // Example
    public void getData()
    public void setData()
    public void inputData(String input)
    ```

- JUnit 테스트 메소드 이름에 언더스코어(_)이 표시되어 이름의 논리 컴포넌트를 구분하고 각 컴포넌트는 lowerCamelCase로 작성됩니다 .

## 메서드 자주  사용되는 동사

- get/set

  - 속성에 접근하는 메서드 명에 쓰인다.

- init

  - 데이터를 초기화하는 메서드 명에 쓰인다.

- is/has/can
  - 위의 3개는 boolean 값을 리턴한다.

  - is는 맞는지 틀린지 판단하는 메서드 명에 쓰인다. 

    ```java
    // Ex) 숫자인지 판단하는 메서드
    public boolean isNumber()
    ```

  - has는 데이터를 가지고 있는지 확인하는 메서드 명에 쓰인다.

    ```java
    // Ex) Data를 가지고 있는지 확인하는 메서드
    public boolean hasData()
    ```

  - can는 할 수 있는지 없는지 확인하는 메서드 명에 쓰인다.

    ```java
    // Ex) 주문할 수 있는지 없는지 확인하는 메서드
    public boolean canOrder()
    ```

- create

  - 새로운 객체를 만든 후 리턴해주는 메서드 명에 쓰인다.

- find

  - 데이터를 조회하는 메서드 명에 쓰인다.

- to

  - 해당 객체를 다른 형태의 객체로 변환해주는 메서드 명에 쓰인다.

## 참고한 사이트

[효과적인 이름짓기](<https://remotty.github.io/blog/2014/03/01/hyogwajeogin-ireumjisgi/>)

[자바 명명 규칙](<https://m.blog.naver.com/reona7140/221306141987>)

[Google Java Style Guide](<https://google.github.io/styleguide/javaguide.html#s5.3-camel-case>)

[캠퍼스 핵데이 Java 코딩 컨벤션](<https://naver.github.io/hackday-conventions-java/#method-lower-camelcase>)