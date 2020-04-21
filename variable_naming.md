## variable_naming



## 변수 명 네이밍에 대한 리뷰 / 피드백 모음



#### 변수명 네이밍 규칙

+ 변수의 이름은 소문자의 명사 형태

+ 상수값 (final static)은 항시 대문자로 적고, 단어와 단어사이에 '_'를 넣는다.

  MAX_NUMBER

  

#### 특정의미를 갖는 숫자는 항상 의미를 나타내는 상수로 바꿔서 사용하도록 한다. (매직넘버 상수화)

``` java
        if (randomNumber >= 4) {
        public Car moveCar(int randomNumber) {
```

+ 4 대신 MOVE_STANDATD_NUMBER 등으로 상수화해서 사용
+ 대문자로 작성하고, 띄어쓰기는 _ 로 표시한다.



+ 단, 매직넘버로서의 의미가 없는 경우 상수로 바꿀 필요 없다.

``` java
	private static final int ONE = 1;
	private static final int TWO = 2;
	private static final int ZERO = 0;
```

+ ZERO, ONE, TWO라는 명칭으로서는 현재 코드상에선 0, 1, 2 그대로의 의미 이상을 가지고 있지 않는 것 같네요.
  특히 for문에 사용하신 ONE의 경우 매직넘버로서의 의미는 없어 보임.

  매직넘버를 기호 상수로 변경하는 가장 큰 목적은 숫자가 가진 의미를 직관적으로 알수 있게하기 위함이지 동일한 숫자가 사용된 부분을 치환하기 위해서가 아닙니다. 

  그런 부분에서 for문에서의 ONE의 사용은 기호 상수의 명칭을 현재의 모호한 ONE으로 귀결시킨 원인 중 하나로 보이네요.
  추가적으로 코드상에 직접 사용된 모든 숫자가 매직넘버를 의미하진 않습니다. (대표적으로 일반적인 for문에서 나오는 i = 0 )

참고링크 : https://hoonmaro.tistory.com/4



#### 의도를 분명히 밝혀라

- 좋은 이름을 지으려면 시간이 걸리지만 좋은 이름으로 절약하는 시간이 훨씬 더 많다.

- 그러므로 이름을 주의 깊게 살펴 더 나은 이름이 떠오르면 개선하기 바란다. 그러면 (자신을 포함해) 코드를 읽는 사람이 좀더 행복해지리라.

- 따로 주석이 필요하다면 의도를 분명히 드러내지 못했다는 소리다.

- 변수 이름이 변수가 표현하고 있는 것을 완벽하고 정확하게 설명해야 한다.

- 이름은 가능한 구체적이어야 한다. 모호하거나 하나 이상의 목적으로 사용될 수 있는 일반적인 이름은 보통 나쁜 이름이다.

   -> x, temp, i와 같은 이름은 적절한 정보를 제공해 주지 않는다



#### 최적의 이름 길이

- 변수 이름의 길이가 평균적으로 10~16일 때 프로그램을 디버깅하기 위해서 들이는 노력을 최소화 할 수 있고, 변수의 평균 길이가 8~20인 프로그램은 디버깅하기가 쉽다.



#### 최적의 이름 길이

+ 전형적인 불린 변수의 이름을 사용.
  + done
  + error
  + found
  + success나 ok
    단, 성공했다는 것을 정확하게 설명하는 구체적인 이름이 있다면 다른 이름으로 대체하는 것이 좋다.
    (예: processingComplete, found, 등)

+ 참이나 거짓의 의미를 함축하는 불린 변수의 이름을 사용한다.
  + status, sourceFile 같은 변수들은 참이나 거짓이 명백하지 않기 때문에 좋지 못한 불린 이름이다.
    statusOK, sourceFileAvailable 또는 sourceFileFound와 같은 이름으로 대체해야 한다.

+ 긍정적인 불린 변수 이름을 사용한다
  notFound, nonDone, notSuccessful과 같은 부정적인 이름은 이 변수의 값이 부정이 되었을 때 읽기가 어려워진다.

```java
if(notFound ==  false) ...
```

+ if(found == true) 가 훨씬 더 자연스럽다.



#### 협업을 염두에 두고 작성해야 한다. 

```java
private void validateNumericPosition(String[] expressionAsArray) {		
  for (int i = 0; i < expressionAsArray.length; i+=2)
```

+ 2가 의미하는게 뭘까?

+ 다른 사람이 봤을 때 i+2를 통해 어떤 처리를 하는지 파악하려면 코드를 분석해야 한다.

  -> 하지만 2에 의미있는 변수명을 붙여주면(예를 들면 number index) 숫자만 걸러내기 위한 식이구나 알 수 있다.



#### 인라인으로 메소드가 여러번 호출되는 코드를 봤을 때 한눈에 알아 볼 수 없으면 변수로 분리

```java
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

  

#### 변수 이름에 자료형이 들어간다면?

```java
 private List<Double> numberList = new ArrayList<>();
 private List<String> operatorList = new ArrayList<>();
```

- 추후 List 대신 다른 자료형(Set...)이 사용되는 경우에 원래 사용되던 변수명이 그 변수의 의미를 나타내지 못하게 됨 -> 결국 변수명을 변경해야 함.
- 타입을 보면 충분히 어떤 변수인지 파악할 수 있다





참고 링크 : https://remotty.github.io/blog/2014/03/01/hyogwajeogin-ireumjisgi/