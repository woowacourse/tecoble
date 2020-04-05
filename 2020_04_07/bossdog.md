### 👉 [문자열 계산기 저장소 풀리퀘스트 목록](https://github.com/woowacourse/java-calculator/pulls?q=is%3Apr+is%3Aclosed)
---

## 문자열 계산기 : Enum VS Map
### 리뷰 개요
입력받은 수식 계산을 위해 `"+"`, `"-"`, `"*"`, `"/"`에 해당하는 네 가지 연산자를 인식하고 용도에 맞게 연산하는 기능이 필요하다.  
**연산자**와 **실제 연산 작업**을 연관시켜 저장하는 두 가지 방식에 대해서 살펴보자.

### Map 활용
Map은 관련있는 한 쌍의 값을 key와 value를 이용하여 저장하고, 빠른 검색을 특징으로 한다.  
각 연산자의 **String 값**을 key로 하고, **실제 연산하는 함수**를 value로 하는 map을 만들어볼 수 있다.  
static으로 네 가지 연산자와 연산 함수들을 map으로 먼저 초기화 해놓고, 필요한 순간에 map의 key인 연산자의 **String 값**으로 매칭되는 내용을 get하여 연산을 수행할 수 있다.  
아래 코드를 예시로 살펴보자. 
``` java
// PR#45 제이미
public class Calculator {
    private static Map<String, BiFunction<Double, Double, Double>> operators = new HashMap<>();
    private final Formulas formulas;

    static {
        operators.put("+", (num1, num2) -> num1 + num2);
        operators.put("-", (num1, num2) -> num1 - num2);
        operators.put("*", (num1, num2) -> num1 * num2);
        operators.put("/", (num1, num2) -> num1 / num2);
    }
    
    ...
}
```
이처럼 Map 을 사용하면, key로 value를 이용해서 시간 복잡도 O(1)만에 바로 원하는 데이터를 찾을 수 있다.  
그러나 메모리에 항상 업로드 되어 있어야 한다는 점과, 연산자 유효성 검증 등 관련있는 책임이 분산되어 유지보수 및 가독성이 좋지 않다는 단점이 있다. 

### Enum 활용
이번엔 **String 값**과 **실제 연산 함수**를 인스턴스 변수로 가지는 `Operator Enum`을 만들어보자.
``` java
// PR#27 알트
public enum Operator {
    PLUS("+", (first, second) -> first + second),
    MINUS("-", (first, second) -> first - second),
    DIVIDE("/", (first, second) -> {
        if (second == 0) {
            throw new DivideByZeroException();
        }
        return first / second;
    }),
    MULTIPLY("*", (first, second) -> first * second);

    private final String operator;
    private final BinaryOperator<Double> expression;

    Operator(final String operator, final BinaryOperator<Double> expression) {
        this.operator = operator;
        this.expression = expression;
    }
}
```
Enum을 사용하면 관련 정보들을 하나로 묶어 상수처럼 관리할 수 있기 때문에 앞서 Map에서 저장한 데이터들을 그대로 저장할 수 있다.
하지만 애초에 Enum과 Map은 사용 목적이 다르다.

**Enum**의 목적이 관련있는 상수, 자료구조, 함수, 클래스 등을 하나로 묶어서 편하게 관리하는 것에 있다면,  
**Map**은 관련 있는 한 쌍의 데이터를 저장하고 빠르게 검색하기 위한 목적으로 사용된다.

이처럼 사용 되는 목적이 다른 만큼 Enum은 Map이 할 수 있는 것보다 더 많은 것을 할 수 있고, 
한 쌍을 넘어서 서로 관련있다면 갯수에 관계없이 얼마든지 묶어서 관리할 수 있다.

그렇다면 이러한 장점들을 가진 Enum으로 데이터를 저장했다고 해보자.  
Enum이 더 많은 부분을 커버할 수 있다고 하더라고, 잊지 말아야할 것은 기능 요구사항이다.  
즉, **String 값**으로 **실제 연산 함수**를 반환해서 연산 결과를 만들어 내야 하는 것이다.  

그렇다면 Enum 에서는 어떻게 **String 값**으로 **실제 연산 함수**를 사용할 수 있을까?
실제 연산 함수를 사용하기 전에 선행되야 할 작업이 바로 **String 값**으로 해당하는 **Enum Value**를 찾는 것이다.  
그래야 Enum Value를 통해서 expression에 해당하는 실제 연산 함수를 이어 사용할 수 있기 때문이다.
이 부분에 대한 구현은 아래 크루들의 코드 통해서 살펴보자.

#### Enum으로 특정 value 찾기
```java
//PR#9 보스독
public static Operator getEnumFromString(String sign) {
    for (Operator op : Operator.values()) {
        if (op.sign.equals(sign)) {
            return op;
        }
    }
    return null;
}
```
```java
// PR#15 쿨라임
public static Operator getOperator(String input) {
    Operator[] operators = Operator.values();
    for (Operator operator : operators) {
        if (operator.shape.equals(input)) {
            return operator;
        }
    }
    throw new IllegalArgumentException("입력값과 같은 연산 기호가 없습니다.");
}
```
``` java
// PR#33 앨런
public static Operator getOperatorForChar(char charOperator) {
    return Arrays.stream(Operator.values())
                .filter(x -> x.symbol == charOperator)
                .findAny()
                .orElseThrow(IllegalArgumentException::new);
}
```

위 코드는 모두 외부로부터 String이나 char 값을 입력받아 그 값을 갖고 있는 특정 Enum Value를 찾아내는 메서드이다. 
그렇다면 위 코드들의 공통된 문제는 무엇일까?  

**그것은 바로 메서드가 호출될 때 마다 전체 Enum 요소들에 대한 반복문이 필요하다는 것이다.**   
물론 enum의 요소가 현재는 4개 밖에 되지 않기 때문에 성능에 미치는 영향이 미미할 수 있다.  
하지만 메서드의 호출 주기가 짧아지고 enum 요소의 개수가 부득이하게 늘어나야 한다면 이러한 방법이 효율적이라고 보기는 어려울 것이다.

그래서 Enum의 장점을 살리면서 Map의 검색 속도를 모두 활용하는 방법도 생각해볼 수 있다. 

### Enum + Map
``` java
public enum Operator {
  PLUS("+", (first, second) -> first + second),
  MINUS("-", (first, second) -> first - second),
  DIVIDE("/", (first, second) -> {
      if (second == 0) {
          throw new DivideByZeroException();
      }
      return first / second;
  }),
  MULTIPLY("*", (first, second) -> first * second);

  private final static Map<String, Operator> valuesWithStringMap = new HashMap<>();

  static {
      valueWithStringMap.put("+", PLUS);
      valueWithStringMap.put("-", MINUS);
      valueWithStringMap.put("/", DIVIDE);
      valueWithStringMap.put("*", MULTIPLY);
  }

  private final String operator;
  private final BinaryOperator<Double> expression;


  Operator(final String operator, final BinaryOperator<Double> expression) {
      this.operator = operator;
      this.expression = expression;
  }
}
```

이렇게 하면 Enum과 Map의 장점을 모두 살릴 수 있다.  
클래스로서의 기능을 하는 Enum 덕분에 관련 책임을 한 곳에서 처리할 수 있다는 장점을 유지하면서,  
Map으로 인해 value에 대한 검색이 빨라진다는 장점까지 가져갈 수 있다.
하지만 이는 일반적으로 많이 사용되는 방법은 아니다.  
보통은 정의되는 enum의 요소가 많아봐야 10개 정도 이기 때문에 그냥 정적 메서드를 사용하여 value값을 검색하곤 한다. 

도메인 상황에 맞게 처리해야 할 `Enum 갯수`와 `검색 메서드 호출 주기`등을 고려하여 참고해볼 수 있는 방법 정도로 알아두면 좋을 것이다. 
