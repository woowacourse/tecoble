---
layout : post
title : 메소드 시그니처를 변경하지 않고, 테스트 가능한 구조 만들기.
author : "카일"
toc: true
---

# 메소드 시그니처를 변경하지 않고 테스트하기

메소드 시그니처란 메소드의 이름, 파라미터, 반환값의 데이터 타입을 통칭하는 말이다. 프로그래밍을 하다 보면 기존의 메소드 시그니처를 변경하지 않으면서 테스트 가능한 구조로 변경해야 하는 경우가 종종 있다. 예를 들어 난수에 의해서 어떤 메소드의 행동이 결정된다고 가정해보자. 이 경우 난수가 메소드에 포함되어 있기 때문에 이 메소드가 정상 작동하는지 판단하기 어렵다. 아래의 예를 보자.

```java
public class Car {
    private int position;
    
    public Car(int position) {
	    this.position = position;   
    }
        
    public void move() {
    	if ((int)(Math.random() * 10) > 4) {
    		this.position++;
    	}   
    }
    
    public boolean isSamePosition(int position) {
        return this.position == position;
    }
}
```

위의 자동차 클래스에서 `move` 메소드는 난수에 의해서 현재 자신의 `position` 이 변경된다. 문제는 메소드의 로직에 `난수 (int)(Math.random() *10` 이 포함되어 있어 메소드가 정상 작동하는지 테스트하기 어렵다. 이 경우 어떻게 테스트 가능한 구조로 만들 수 있을까?

- 파라미터를 추가한다.
- 전략 패턴을 사용한다.
- 상속을 사용한다.

나는 이러한 문제를 해결하기 위해 외부에서 파라미터를 통해 값을 주입하는 방식, 혹은 전략 패턴을 사용했었다. 하지만 현업에서 `move` 라는 메소드를 사용하는 곳이 매우 많고 사용하는 곳과의 관계를 명확하게 모르는 경우에 메서드 시그니처를 변경하는 것은 큰 위험이 따른다. 이 메소드를 사용하는 모든 부분을 수정해 줘야 하며 수정과 동시에 다른 버그가 발생할 수 있다. 따라서 이번에는 **상속을 활용하여 메서드 시그니처를 변경하지 않는 형태로 진행하는 방식**으로 리팩토링하고자 한다.

### 상속을 활용하여 메소드 재정의 하기.

기존의 코드에서 문제가 되는 부분은 `move` 내에 존재하는 난수를 생성하는 부분이다. 난수는 우리가 예측할 수 없기 때문에 메서드를 정상적으로 테스트할 수 없는 것이다. 따라서 난수 생성 부분을 메소드로 분리하고 이 메소드의 값을 재정의하는 방식으로 해결할 수 있다. 아래의 코드를 보자.

```java
public void move() {
    if (randomInt() > 4) {
        this.position++;
    }
}

protected int randomInt() { // 메소드 분리
    return (int)(Math.random() * 10);
}
```

일차적으로 랜덤한 수를 생성하는 부분을 재정의할 수 있는 형태로 분리한다. 그리고 아래와 같이 테스트 코드를 작성하는 부분에서 `randomInt()` 메서드를 재정의하면 move 라는 메서드가 4라는 기준에 의해서 움직이는 것인지를 정상적으로 테스트할 수 있다.

```java
class CarTest {
    
    @Test
    void moveTest() {
    	Car car = new Car(3) {
    	    @Override
    	    protected int randomInt() { // 랜덤한 난수를 생성하는 부분 재정의(4보다 큰 경우)
    	    	return 4;
            }
    	};
    	car.move();
    	assertThat(car.isSamePosition(4)).isTrue();     
    }
   
    @Test
    void notMoveTest() {
    	final Car car = new Car(3) {
    	    @Override
    	    protected int randomInt() { // 랜덤한 난수를 생성하는 부분 재정의(4보다 작은 경우)
    	    	return 3;
            }
    	};
    	car.move();
    	assertThat(car.isSamePosition(3)).isTrue();     
    }
}
```

### 결론

위에서 언급했듯 전략 패턴이나 메소드 파라미터를 추가하는 방식 또한 좋은 해결책이 된다. 하지만 이번 포스팅의 목표는 메소드 시그니처를 변경하지 않고 테스트 가능한 구조를 만드는 것이었다. '위와 같이 상속을 사용하는 경우 Production code의 메소드 시그니처를 변경하지 않고 단위 테스트가 가능하게 된다.'

테스트하기 어려운 부분을 테스트하는 것은 어렵지만 중요한 일이다. 위와 같이 상속을 활용하는 방법도 하나의 방법이 될 수 있다. 정도로 알아두면 좋을 것 같다.
