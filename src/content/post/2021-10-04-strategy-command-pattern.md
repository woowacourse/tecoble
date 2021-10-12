---
layout: post  
title: 전략패턴과 커맨드패턴
author: [3기_와이비]
tags: ['design-pattern']
date: "2021-10-04T12:00:00.000Z"  
draft: false 
image: ../teaser/strategy-command-pattern.png
---

인터페이스를 구현하여 사용하는 두 가지 패턴인 전략 패턴과 커맨드 패턴. 
자주 사용하지만, 이 둘의 차이점은 무엇일까? 
알쏭달쏭한 전략 패턴과 커맨드 패턴의 차이점을 알아보는 전략 패턴과 커맨드 패턴 글입니다.

<!-- end -->

## 학습 로그 정리 중에 만난 복병
지난 우아한테크코스 레벨 2 때는 크루들끼리 레벨 1 때 배운 내용을 학습 로그를 통하여 돌아보는 내용을 가지게 됩니다.
자바 및 객체에 대한 것이 주 내용을 이루게 됩니다.
객체를 공부하다 보니 대표적인 디자인 패턴도 몇 가지 나오게 되었습니다.
특히 미션에서 전략 패턴 및 커맨드 패턴을 사용하였기 때문에 내용을 정리하였는데요.
하지만 한 크루의 “그럼 와이비, 전략 패턴과 커맨드 패턴의 차이점은 무엇인가요?”라는 질문에 시원하게 차이점을 답변하지 못하였던 경험이 있습니다.
인터페이스에 의존하도록 만들고, 이를 이용하여 유연성을 가지도록 구현하는 점이 상당히 비슷하게 느껴지기 때문입니다.
이를 돌이켜보며, 같은 인터페이스를 구현하여 사용하는 디자인 패턴이지만 전략 패턴과 커맨드 패턴의 차이점을 예시와 함께 알아보도록 하겠습니다. 

## 전략 패턴과 예시
와이비는 오늘도 일확천금의 꿈을 꿈꾸며 복권을 사러 가게 되었습니다.
하지만 와이비의 집과 복권 판매점의 거리가 상당히 멀어서 어떻게 가야 할 것인가에 대해서 고민을 하게 되었습니다.
이때, 와이비가 갈 방법은 버스나 자전거를 사용하는 방법이 있습니다.
이 두 방법을 유연하게 선택하여 코드로 구현할 방법은 무엇일까요? <br>
이에 대한 해결책이 바로 전략 패턴입니다.
전략 패턴은 프로그램이 진행되면서 캡슐화된 로직을 선택할 수 있게 하는 디자인 패턴입니다.
로직 실행은 인터페이스에 의존을 시키고 인터페이스를 구현한 로직들을 전달해줌으로써 분기처리 없이 유연성을 갖출 수가 있습니다.
위의 예시를 전략 패턴을 적용하여 구현해보도록 하겠습니다.

```java
public class PeopleWithMovement {

    private Transportation transportation;

    public PeopleWithMovement(Transportation transportation) {
        this.transportation = transportation;
    }

    public void move(String start, String end) {
        transportation.move(start, end);
    }

    public void changeTransporation(Transportation transportation) {
        this.transportation = transportation;
    }
}
```

먼저 전략을 행할 주체를 작성을 하였습니다. 
여기서 전략은 Transporation이라는 인터페이스로 분리되어 캡슐화되어 있습니다. 

```java
public interface Transportation {

    void move(String start, String end);
}

public class Bicycle implements Transportation {

    @Override
    public void move(String start, String end){
        System.out.println("출발점 : " + start + "에서 목적지 : " + end + "까지 `자전거`로 이동합니다.");
    }
}

public class Bus implements Transportation {

    @Override
    public void move(String start, String end){
        System.out.println("출발점 : " + start + "에서 목적지 : " + end + "까지 `버스`로 이동합니다.");
    }
}
```

Transporation 인터페이스를 구현한 두 가지 전략 Bus와 Bicycle 코드도 작성하게 되었습니다. 
이렇게 전략을 캡슐화를 함으로써, 예시 코드처럼 Bus 및 Bicycle을 선택하여 실행할 수 있으며, 중간에 전략을 바꿔서 진행하는 것도 가능합니다.

```java
public class Main {

    public static void main(String[] args) {
        Bicycle bicycle = new Bicycle();
        Bus bus = new Bus();

        PeopleWithMovement whybeFirst = new PeopleWithMovement(bicycle);
        whybeFirst.move("시작점", "끝점");

        PeopleWithMovement whybeSecond = new PeopleWithMovement(bus);
        whybeSecond.move("시작점", "끝점");

        PeopleWithMovement whybeChangeMovement = new PeopleWithMovement(bicycle);
        whybeChangeMovement.move("시작점", "중간지점");
        whybeChangeMovement.changeTransporation(bus);
        whybeChangeMovement.move("중간지점", "끝점");
    }
}
```

```bash
출발점 : 시작점에서 목적지 : 끝점까지 `자전거`로 이동합니다.
출발점 : 시작점에서 목적지 : 끝점까지 `버스`로 이동합니다.
출발점 : 시작점에서 목적지 : 중간지점까지 `자전거`로 이동합니다.
출발점 : 중간지점에서 목적지 : 끝점까지 `버스`로 이동합니다.
```

## 커맨드 패턴과 예시
이렇게 와이비는 복권 판매점에 도착하게 되었습니다.
복권 판매점에서는 여러 가지 종류의 복권을 판매합니다.
와이비는 그 중 즉석 복권과 번호식 복권을 사게 되었습니다.
즉석 복권은 바로 당첨 여부를 확인할 수가 있지만, 번호식 복권의 경우에는 당첨을 확인하려면 당첨 번호가 필요합니다.
이동수단을 고를 때보다 조금 더 까다로워지게 되었습니다.
이를 코드로 유연하게 구현하려면 어떻게 해야 할까요? <br>
답은 커맨드 패턴에 있습니다.
커맨드 패턴은 요청을 홀로 처리할 수 있도록 요청을 수행하는 여러 인자를 함께 패키징하여 나중에 처리할 수 있도록 만들어주는 행동 중심 디자인 패턴입니다.
커맨드를 실행시키는 객체는 커맨드 내부의 요소에 대해서 숨김으로써 코드의 유연성을 가질 수 있습니다.
앞서 언급한 각각의 복권은 당첨을 확인할 수 있는 조건이 다릅니다.
먼저 즉석 복권을 긁는 행위를 캡슐화한 코드를 작성하도록 하겠습니다. 

```java
public class PeopleWithLottery {

    private List<LotteryCommand> lotteryCommands;

    public PeopleWithLottery(List<LotteryCommand> lotteryCommands) {
        this.lotteryCommands = lotteryCommands;
    }

    public void addLotteryCommand(LotteryCommand lotteryCommand) {
        lotteryCommands.add(lotteryCommand);
    }

    public void scratchAllLottery() {
        for (int i = 0; i < lotteryCommands.size(); i++) {
            LotteryCommand lotteryCommand = lotteryCommands.get(i);
            lotteryCommand.scratch();
        }
        //초기화
        lotteryCommands = new LinkedList<>();
    }
}

public interface LotteryCommand {
    void scratch();
}

public class InstantScratch implements LotteryCommand {
    
    private InstantLottery instantLottery;
    private account Account;

    public InstantScratch(InstantLottery instantLottery, Account account) {
        this.instantLottery = instantLottery;
        this.account = Account;
    }

    @Override
    public void scratch() {
      //instantLottery의 당첨을 확인하고 account에 돈을 집어 넣는 로직
    }
}

public class InstantLottery {
    
    private boolean win;

    public InstantLottery(boolean win) {
        this.win = win;
    }

    public boolean isWin() {
        return win;
    }
}

public class Account {

    private int balance;

    public void putMoney(int money) {
        balance += money;
    }
}
```
위의 코드를 바탕으로 프로그램을 구성하면 다음과 같습니다.  
```java
public class Main {
    public static void main(String[] args) {
        PeopleWithLottery whybe = new PeopleWithLottery(new LinkedList<>());
        Account 와이비통장 = new Account();
        
        //즉석복권 구입
        for (int i = 0; i < 10; i++) {
            //즉석복권 생성 로직 
            InstantLottery instantLottery = new InstantLottery(당첨여부);
            //즉석복권긁기행위 객체 생성 및 커맨드 목록에 추가
            InstantScratch 즉석복권긁기커맨드 = new InstantScratch(즉석복권, 와이비통장);
            whybe.addLotteryCommand(즉석복권긁기커맨드);
        }
        
        whybe.scratchAllLotery();
    }
}
```

해당 코드에서 볼 수 있다시피 당첨을 확인하고 통장에 돈을 추가하는 것을 캡슐화하게 되었습니다.
여기서 알 수 있는 점은 복권을 긁는 행위를 호출하는 객체(People) , 명령을 담당하는 객체(LotteryCommand) 그리고 명령 수행으로 인하여 영향을 받는 객체(MyAccount)가 모두 다른 것을 알 수가 있습니다.
각각의 객체들을 분리함으로써 행위의 구성 요소들을 독립적으로 쓸 수 있다는 점입니다. <br>
그다음 예시를 통해 조금 더 자세히 알아보도록 하겠습니다.
와이비는 영이와의 내기를 통해서 번호식 복권의 당첨금은 영이의 통장으로 넣어주기로 하였습니다.
하지만 번호식 복권같은 경우에는 당첨을 확인하기 위해서는 당첨 번호가 필요합니다.
이를 반영한 번호식 복권의 코드 및 다른 사람의 통장에 대한 로직은 다음과 같이 작성될 수 있을 것입니다.

```java
public class NumberScratch implements LotteryCommand {

    private Set<Integer> winners;
    private NumberLottery numberLottery;
    private Account account;

    public NumberScratch(Set<Integer> winners, NumberLottery numberLottery, Account account) {
        this.winners = winners;
        this.numberLottery = numberLottery;
        this.account = account;
    }

    @Override
    public void scratch() {
        // winners와 numberLottery를 비교하여 당첨금을 계산하고 
        // account에 해당 금액을 입금하는 로직
    }   
}

public class NumberLottery {
    
    private Set<Integer> numbers;

    public NumberLottery(Set<Integer> numbers) {
        this.numbers = numbers;
    }

    public int rank(Set<Integer> winners) {
        // 당첨 번호와 비교하여 자신의 등수를 계산하는 로직
    }
}

```
위의 코드를 바탕으로 프로그램을 구성하면 다음과 같습니다.  

```java
public class Main {
    public static void main(String[] args) {
        PeopleWithLottery whybe = new PeopleWithLottery(new LinkedList<>());
        Account 영이통장 = new Account();
        
        //즉석복권 구입
        for (int i = 0; i < 10; i++) {
            //번호식 복권 생성 로직 
            NumberLottery 번호식복권 = new NumberLottery(선택한 번호);
            //번호식복권긁기행위 객체 생성 및 커맨드 목록에 추가
            NumberScratch 번호식복권긁기커맨드 = new NumberScratch(이번주 당첨번호, 번호식복권, 영이통장);
            whybe.addLotteryCommand(번호식복권긁기커맨드);
        }

        whybe.scratchAllLottery();
    }
}
```

예시에서는 기준이 되는 당첨 번호를 비교하여 해당하는 금액을 영이의 통장으로 돈을 넣어주는 코드를 완성하게 되었습니다.
행위를 캡슐화하였기 때문에 복권을 긁는 행위를 호출하는 객체인 PeopleWithLottery와 명령 수행으로 인하여 영향을 받는 객체에 큰 변화를 거치지 않고도 로직을 수행할 수 있게 되었습니다.
그렇다면 같은 인터페이스에 의존하여 유연성을 갖도록 구현하는 전략 패턴과의 차이는 무엇일까요? 

## “어떻게” 와 “무엇” 의 차이
전략 패턴은 먼저 **어떻게** 라는 측면에 집중하게 됩니다.
하고자 하는 것은 이미 정해져 있고, 방법을 어떻게 할지에 대한 유연성을 고려하며 구현합니다.
인터페이스의 메소드에 직접적으로 의존을 하게 되어서, 해당 메소드의 parameter들에 강하게 영향을 받습니다.
때문에 위의 복권예시처럼 로직을 수행할 때 다른 인자가 필요하게 된다면 오버로딩을 해주어야하는데, 전략 패턴의 가치가 퇴색이 될 것입니다.

```java
// 만약 버스를 타는데에는 요금이 필요하게 된다면?
public interface Transportation {
    void move(String start, String end);
    void move(String start, String end, int money);
}

public class Bicycle implements Transportation {
    @Override
    public void move(String start, String end){
        System.out.println("출발점 : " + start + "에서 목적지 : " + end + "까지 자전거로 이동합니다.");
    }
    
    @Override
    public void move(String start, String end, int money) {
        System.out.println("버스가 아닙니다.");
    }
}

public class Bus implements Transportation {
     @Override
     public void move(String start, String end){
        System.out.println("자전거가 아닙니다");
     }
    
    @Override
    public void move(String start, String end, int money) {
        System.out.println("버스 요금으로 " + String.valueOf(money) + "만큼 지불했습니다.");
        System.out.println("출발점 : " + start + "에서 목적지 : " + end + "까지 버스로 이동합니다.");
    }
}
```

하지만 커맨드 패턴은 **무엇**을 초점을 두게 됩니다.
어떻게 할지에 대한 방법은 외부에서 정의하며 주입을 해주며, 그것을 실행하는 것이 중요하기 때문입니다.
그래서 즉석 복권 혹은 번호식 복권 중 **무엇**을 긁을지에 대해서 구현할 때에는 전략 패턴보다는 커맨드 패턴이 조금 더 적합하다고 볼 수가 있습니다.
위의 예시에서는 커맨드 패턴은

1) 무엇을 할지를 선택하면 해당 행위를 하기 위한 필요한 변수들을 같이 캡슐화하여 제공받기 때문에 유연하다.
2) Receiver(Account)도 같이 제공을 받기 때문에 행위에 따른 영향을 받는 객체도 조건에 따라 설정할 수 있다.  

의 장점을 알 수가 있습니다.

## 마무리
결과물이 비슷해 보이지만, 다른 방향의 두 패턴 탐구를 통해서 차이점 및 각각의 장점을 볼 수가 있었습니다.
하지만 무조건 커맨드 패턴이 전략 패턴보다 유리한 것일까요?
그렇지 않습니다. 위의 코드에서도 볼 수 있다시피 커맨드 패턴을 구현하려면 각각의 행위를 캡슐화를 해야 하기 때문에 비약적으로 코드의 양이 상승하게 됩니다.
디자인 패턴에는 항상 옳은 것이 없는 것 같습니다. 각각의 로직 및 환경에 적합한 코드를 작성하는 것이 중요하다고 할 수 있습니다. 

## Reference
- [Difference between Strategy Pattern and Command Pattern](https://stackoverflow.com/questions/4834979/difference-between-strategy-pattern-and-command-pattern)
- [Strategy Pattern by Refactoring Guru](https://refactoring.guru/design-patterns/strategy)
- [Command Pattern by Refactoring Guru](https://refactoring.guru/design-patterns/command)
- [What does the client do in Command Pattern?](https://stackoverflow.com/questions/37773648/what-does-the-client-do-in-command-pattern)
