## Enum의 요소를 조회하는 방법 비교

Enum을 사용하다보면 요소들을 조회해야 하는 경우가 발생한다.
Enum에 정의된 함수들이나 상수를 호출하기 위해서는 특정 요소에 접근해야 하는데, 많이 사용되는 두 가지 방식을 소개해 보고자 한다.

첫번째는 Enum안에 팩토리 메서드를 만들어 사용하는 것이다.
보통은 find, findByName, of, ... 등의 이름을 가지며 형태는 다음의 Operator 클래스에 있는 find 메서드와 비슷한 모양으로 생겼다.


``` java
public enum Operator {
  PLUS("+", (first, second) -> first + second),
  MINUS("-", (first, second) -> first - second),
  DIVIDE("/", (first, second) -> first / second),
  MULTIPLY("*", (first, second) -> first * second);

  private final String representation;
  private final BinaryOperator<Double> expression;

  public static Operator find(String input) {
      return Arrays.stream(Operator.values())
                .filter(x -> x.symbol == charOperator)
                .findAny()
                .orElseThrow(IllegalArgumentException::new);
  }
```

위 find 메서드는 파라미터로 비교하고자 하는 값을 전달 받고 stream의 filter를 통해 원하는 enum 요소를 찾아낸다.
만약 원하는 enum 요소를 조회하지 못한다면 예외를 발생시킨다. 
하지만 이와 같은 방식의 치명적인 단점은 enum 요소를 조회할 때마다 enum의 values()를 매번 새로 순회해야 한다는 점이다. enum 요소의 개수가 많아지거나 메서드의 호출 주기가 잦다면 효율적인 방식으로 보긴 어려울 것이다.

두 번째 방법으로는 Enum안에서 HashMap을 통해 캐싱하는 방법을 생각해 볼 수 있다.
이번에도 역시 Operator 클래스를 통해서 각 연산자 enum 요소를 조회하는 방식을 살펴보자.

``` java
public enum Operator {
  PLUS("+", (first, second) -> first + second),
  MINUS("-", (first, second) -> first - second),
  DIVIDE("/", (first, second) -> first / second),
  MULTIPLY("*", (first, second) -> first * second);

  private final static Map<String, Operator> ENUM_MAP = new HashMap<>();

  static {
        for (Operator operator: values()) {
            ENUM_MAP.put(representation, operator);
        }
    }

  private final String representation;
  private final BinaryOperator<Double> expression;

  Operator(final String representation, final BinaryOperator<Double> expression) {
      this.operator = representation;
      this.expression = expression;
  }
}

public static Operator valueOfRepresentation(String representation) {
        if (ENUM_MAP.containsKey(representation)) {
            return ENUM_MAP.get(representation);
        }
        throw new IllegalArgumentException("매치되는 연산자가 없습니다.");
    }
```

이전 방식에 비해 코드가 길어지긴 했지만, 이와 같이 Enum 안에서 Map을 통해 요소를 `캐싱하는` 방식으로 구현하면 Stream 처리를 한번만 하면 된다. 
이후에는 map의 get()메서드를 통해 시간복잡도 O(1)만에 요소를 조회할 수 있기 때문에 팩토리 메서드를 사용했을 때보다 약 20배 정도 빠른 조회 성능을 얻을 수 있다. 

보통은 정의되는 enum의 요소가 많아봐야 10개 정도 이기 때문에 프로그래밍 상의 편이를 위해 팩토리 메서드를 사용하는게 일반적이지만, 도메인 상황에 맞게 처리해야 할 `Enum 요소의 개수`와 `조회 메서드의 호출 주기` 등을 고려하여 캐싱하는 방법을 사용한다면 더욱 효율적인 성능을 얻을 수 있을 것이다.


---
#### 참고하면 좋은 글
- [Attaching Values to Java Enum](https://www.baeldung.com/java-enum-values)  
- [Enum의 조회성능을 높여보자](https://pjh3749.tistory.com/279)