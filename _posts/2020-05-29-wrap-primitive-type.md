---
layout: post
title: "원시 타입을 포장해야 하는 이유"
author: "오렌지"
comment: "true"
tags: ["OOP", "object-calisthenic"]
toc: true
---



변수를 선언하는 방법에는 두 가지가 있다.

```java
int age = 20;
Age age = new Age(20);
```

원시 타입의 변수를 선언하는 방법과,
원시 타입의 변수를 객체로 포장한 변수를 선언하는 방법이 있다. 
(Collection으로 선언한 변수도 포장한다. 이를 일급 컬렉션이라 하며 [티거의 일급 컬렉션](https://woowacourse.github.io/javable/2020-05-08/First-Class-Collection)을 참고하길 바란다.)

이번 글에서는 객체지향 생활 체조에도 언급된
**원시 타입의 값을 객체로 포장하면 얻을 수 있는 이점**들에 대해 소개하려고 한다.





### 자신의 상태를 객체 스스로 관리할 수 있다.


User 라는 클래스에서, 사용자의 나이를 가지고 있다고 가정해 보자.
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
        if (age < 0) {
            throw new RuntimeException("나이는 0살부터 시작합니다.");
        }
        this.age = age;
    }
}
```
이런 식으로 말이다. 지금 예시에는 User 클래스의 멤버변수가 나이밖에 없어 문제를 못 느낄 수도 있다.
사용자의 이름, 이메일 등 추가적인 값들을 관리하게 된다면 문제가 생길 수밖에 없다.
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
        if (age < 0) {
            throw new RuntimeException("나이는 0살부터 시작합니다.");
        }
    }
}
```
와우! 고작 두 개의 멤버변수를 선언했을 뿐인데 User클래스가 할 일이 늘어나 버렸다!
**이름** 값에 대한 상태 관리, **나이** 값에 대한 상태 관리를 모두 해야 한다. 

User클래스는 분명히, 
> 아, 나는 사용자 그 자체 상태만 관리하고 싶은데 왜 자잘 자잘 한 것 까지 내가 관리해야 돼? 이건 불합리해!

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
        if(age < 0) {
            throw new RuntimeException("나이는 0살부터 시작합니다.");
        }
    }
}
```
User클래스가 해방됐다.
> 와! 나 이제 예외 처리 안 해도 돼!

이름과 나이 값이 각각의 Name, Age가 담당하도록 바뀌었다. 
유효성 검증을 비롯한 이름, 나이 값에 대한 상태값을 User에게 넘기지 않고 스스로 관리할 수 있게 되었다. 책임이 명확해졌다.





### 코드의 유지보수에 도움이 된다.



이번엔 다른 예시이다.
다음은 로또 미션의 LottoNumber, Lotto, WinningLotto 클래스의 일부이다.

```java
public class LottoNumber {
    private final static int MIN_LOTTO_NUMBER = 1;
    private final static int MAX_LOTTO_NUMBER = 45;
    private final static String OUT_OF_RANGE = "로또번호는 1~45의 범위입니다.";
    private final static Map<Integer, LottoNumber> NUMBERS = new HashMap<>();

    private int lottoNumber;

    static {
        for (int i = MIN_LOTTO_NUMBER; i < MAX_LOTTO_NUMBER + 1; i++) {
            NUMBERS.put(i, new LottoNumber(i));
        }
    }

    public LottoNumber(int number) {
        this.lottoNumber = number;
    }

    public static LottoNumber of(int number) {
        LottoNumber lottoNumber = NUMBERS.get(number);
        if (lottoNumber == null) {
            throw new IllegalArgumentException(OUT_OF_RANGE);
        }
        return lottoNumber;
    }
    ...
}

```

```java
public class Lotto {
    ...
    private List<LottoNumber> lottoNumbers;

    public Lotto(List<LottoNumber> lottoNumbers) {
        validateDuplication(lottoNumbers);
        validateAmountOfNumbers(lottoNumbers);
        this.lottoNumbers = lottoNumbers;
    }
    ...
}
```

```java
public class WinningLotto {
    ...
    private Lotto winningLottoNumbers;
    private int bonusNumber;
    
    public WinningNumber(Lotto winningLottoNumbers, int bonusNumber) {
        this.winningLottoNumbers = winningLottoNumbers;
        if (isBonusNumberDuplicatedWithWinningNumber(winningLottoNumbers, bonusNumber)) {
            throw new IllegalArgumentException(
                BONUS_CANNOT_BE_DUPLICATE_WITH_WINNING_NUMBER);
        }
        if (bonusNumber < 1 | bonusNumber > 45) {
                throw new RuntimeException();
        }
        this.bonusNumber = bonusNumber;
    }
    ...
}
```

위의 코드를 살펴보면 Lotto 클래스에서는  int 값인 로또 숫자 하나하나를 `LottoNumber`로 포장해 사용하고 있는 것을 볼 수 있다.
(`List<int>` 가 아닌 `List<LottoNumber>` 사용)

물론! LottoNumber 대신에 Integer, int와 같은 자료형을 사용할 수도 있다. (아마 캐싱은 하지 않았거나, Lotto 클래스 내부에서 이루어졌을 것이다.)
그렇게 되면 위에서 다루었듯이 **개별 로또 숫자**에 관한 관리가 **로또**에서 이루어져 로또가 수행하는 일이 늘어날 수밖에 없어진다. 자연히 Lotto 클래스의 크기도 커지게 될 것이고 객체지향과도 작별 인사를 할 수밖에 없어진다. (또륵...)

또!!!!! 다른 문제도 발생한다. 현재는 로또 숫자의 범위가 1-45인데,
혹여나 많은 사람들이 당첨되면 좋겠다는 생각을 하는 사람이 나타나서 나는 로또 숫자의 범위를 1-10 으로 할거야! 라며 
**조건을 변경시키고, 추가시킨다면?**
만약 WinningLotto의 예시처럼 로또 숫자가 원시값이라면 같은 조건의 로또 숫자가 사용되는 WinningLotto 클래스와 Lotto 클래스를 모두 고칠 수밖에 없어진다.

> 너무 비효율적이야!


```java
public class WinningLotto {
    ...
    private Lotto winningLottoNumbers;
    private LottoNumber bonusNumber;
    public WinningNumber(Lotto winningLottoNumbers, LottoNumber bonusNumber) {
        this.winningLottoNumbers = winningLottoNumbers;
        if (isBonusNumberDuplicatedWithWinningNumber(winningLottoNumbers, bonusNumber)) {
            throw new IllegalArgumentException(
                BONUS_CANNOT_BE_DUPLICATE_WITH_WINNING_NUMBER);
        }
        this.bonusNumber = bonusNumber;
    }
    ...
}
```

맞다. 비효율적이다. 원시값인 개별 로또 숫자를 위처럼 LottoNumber로 포장만 해 주면 로또 숫자의 확장, 변경에 대해 유연해진다.
Lotto와 WinningLotto는 전혀 바꿀 필요 없다. 로또 숫자를 포장한 LottoNumber만 수정해 주면 되기 때문이다.




### 자료형에 구애받지 않는다. (여러 타입의 지원이 가능하다.)


점수라는 값을 포장한 Score 클래스가 있다. 현재 점수는 int 값이다.
```java
public class Score {
    private int score;
  
    public Score(int score) {
        validateScore(score);
        this.score = score;
    }
    ...
}
```

점수를 보여주는 역할만 했던 Score객체에 연산 등의 기능이 추가되어 새로운 자료형의 지원이 필요해졌다면?
기존의 Score변수를 없앨 필요가 없다.

```java
public class Score {
    private int score;
    private double doubleScore;
  
    public Score(int score) {
        validateScore(score);
        this.score = score;
    }
    
    public Score(double score) {
        validateScore(score);
        this.doubleScore = score;
    }
    ...
}
```

앞서 말했듯이 유지, 보수에 도움이 되는 점을 이용하면 된다. 기존 Score 클래스를 활용하면 된다. doubleScore라는 멤버변수를 추가하고, 생성자 오버로딩을 통해 간단히 해결할 수 있다. String 값이 필요하다 해도 마찬가지로 해결이 가능하다. 



원시 타입 값을 포장하게 되면, 그 변수가 의미하는 바를 명확히 나타낼 수 있다.
책임 관계 또한 보다 명확해지고 코드의 유지, 보수에도 많은 도움이 된다.
실제로 구현해보면서 장점을 느껴보길 바란다!



------

#### 참고 링크
[객체지향 생활 체조 규칙 3](https://developerfarm.wordpress.com/2012/01/27/object_calisthenics_4/)
