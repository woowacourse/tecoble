# 문자열 계산기 PR

## Exception 관련 이슈
 ##### Exception을 class 로 분리
 ###### throw new IllegalArgumentException() 부분이 중복되어 호출된다. 
 ###### throw 하는 메세지들을 Exception 클래스로 따로 관리해 주는게 더 좋을까?
``` java
private static void checkPosition(String[] equation, int index) {
        if (isNotNumberPosition(index) && isNumber(equation[index])) {
            throw new IllegalArgumentException(String.format(INCORRECT_POSITION_MESSAGE, INCORRECT_POSITION_NUMBER));
        }
        if (isNumberPosition(index) && isNotNumber(equation[index])) {
            throw new IllegalArgumentException(String.format(INCORRECT_POSITION_MESSAGE, INCORRECT_POSITION_OPERATOR));
        }
    } 
 ```
   - 새로 만든 Exception을 호출하는 부분이 똑같이 중복될 수 있다.
   - Custom Exception이 발생했을때 비즈니스 로직적으로 어떤 액션을 취해야 하는 경우가 아니라면 굳이 Exception을 만들지 않아도 될 것 같다.
   - 각 상황에 맞는 네이밍을 갖는 Exception을 만들어 한번 더 맵핑하면 규모가 커질수록 Exception이 점점 늘어나고, 관리하기 힘들어질 수도 있다.
 - 참고 링크 : https://jaehun2841.github.io/2019/03/10/effective-java-item72/#서론
 
 ##### 예외의 상세 메시지에 실패 관련 정보를 담기 (이펙티브 자바 아이템 75)
 ``` java
 return Arrays.stream(values())
			.filter(operator -> value.equals(operator.symbol))
			.findFirst()
			.orElseThrow(() -> new IllegalArgumentException());

 ```
  - 추후에 구조적 수정 등 문제가 발생하면 무슨 예외인지 판별이 어려울 수 있음.

 
 
 ## 네이밍 이슈
  ##### 의도를 분명히 밝혀라
 - 좋은 이름을 지으려면 시간이 걸리지만 좋은 이름으로 절약하는 시간이 훨씬 더 많다.
 - 그러므로 이름을 주의 깊게 살펴 더 나은 이름이 떠오르면 개선하기 바란다. 그러면 (자신을 포함해) 코드를 읽는 사람이 좀더 행복해지리라.
 - 따로 주석이 필요하다면 의도를 분명히 드러내지 못했다는 소리다.
 
  ##### 인라인으로 메소드가 여러번 호출되는 코드를 봤을 때 한눈에 알아 볼 수 없으면 변수로 분리
  ``` java
     public void run() {
        try {
            RawEquationDTO rawEquationDTO = inputEquation();
            OutputView.showResult(calculate(rawEquationDTO));
        } catch (RuntimeException e) {
            OutputView.showExceptionMessage(e);
            run();
        }
    }

    private RawEquationDTO inputEquation() {
        return new RawEquationDTO(inputView.inputEquation());
    }
  ```
   - RawEquationDTO rawEquationDTO = new RawEquationDTO(inputView.inputEquation()) 로 변경
   
   ##### Java 에서는 테스트 코드가 아니면 메서드에 _ 를 사용하지 않습니다.
   ##### 변수 이름에 자료형이 들어간다면?
   ``` java
    private List<Double> numberList = new ArrayList<>();
    private List<String> operatorList = new ArrayList<>();
   ```
 - 추후 List 대신 다른 자료형(Set...)이 사용되는 경우에 원래 사용되던 변수명이 그 변수의 의미를 나타내지 못하게 됨 -> 결국 변수명을 변경해야 함.
    
    
## 단위 테스트 이슈
 ##### 테스트 당 하나의 단위에 대해서만 테스트 -> 어떤 케이스에서 실패했는지 파악하기 용이함
 ##### 테스트 당 하나의 테스트 케이스에 대해서만 테스트
 ##### 테스트의 조건이 되는 것은 코드가 중복되더라도 각 테스트에 존재하는 것이 가장 좋다
 ##### 예외 케이스도 테스트하기
 ##### private 인 메서드를 테스트하고 싶다
 - 보통 테스트는 public 메서드를 테스트한다. 
 - 리플렉션까지 사용해 private 메서드를 테스트를 해야하는 경우라면 이 클래스에서 해야하는 역할이 맞는지 고민해보고 클래스를 분리할 수 있다면 분리해서 테스트를 진행하기.
 
 
## enum 관련 이슈
 ##### 연산자와 같이 값이 정해진 경우에는 enum도 매우 훌륭한 도구
 ```java
 private static double calculateBinomialByRawData(double firstOperand,
            Operator operator, double secondOperand) {

         if (operator.isAdd()) {
            return firstOperand + secondOperand;
        }

         if (operator.isSubtract()) {
            return firstOperand - secondOperand;
        }

         if (operator.isMultiply()) {
            return firstOperand * secondOperand;
        }

         return firstOperand / secondOperand;
    }
 ```
  - 클래스 대신 enum 으로 대체 가능
  - 관련 링크 : https://woowabros.github.io/tools/2017/07/10/java-enum-uses.html
 
