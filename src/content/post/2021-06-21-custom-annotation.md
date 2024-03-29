---
layout: post  
title: ConstraintValidator를 이용한 커스텀 어노테이션 예외 처리
author: [3기_파피]
tags: ['validation']
date: "2021-06-25T12:00:00.000Z"
draft: false
image: ../teaser/custom-annotation.png
---

<p style="font-family: sans-serif; text-align: center; color: #aaa; margin-bottom: 3em; font-size: 85%">image origin: <a href="https://www.c-sharpcorner.com/article/custom-data-annotation-validation-in-mvc/">c-sharpcorner.com</a></p>


## `ConstraintValidator`를 이용한 커스텀 어노테이션 예외 처리

### 커스텀 어노테이션이란?

사용자 입력의 유효성을 보다 세부적으로 입력을 검증해야 할 때, 커스텀 어노테이션을 이용하여 예외 검증 로직을 생성할 수 있다. 

이 때, hibernate에서 제공하는 [Constraint 어노테이션](https://docs.jboss.org/hibernate/beanvalidation/spec/2.0/api/javax/validation/constraints/package-summary.html) 을 사용할 수 있다.

### 커스텀 어노테이션의 장점

어노테이션이 가진 가장 큰 장점은 간결함이다.

로직 흐름에 대한 컨텍스트가 응축돼 있어 적재적소에 사용된다면 불필요한 반복코드가 줄어든다.

따라서 개발자가 비지니스 로직에 더 집중 할 수 있도록 만들어 준다.

### 커스텀 어노테이션과 `Validator` 구현

`ConstraintValidator`를 구현하는 커스텀 `Validator`, 그리고 커스텀 어노테이션을 만들어 예외 처리를 해볼 것이다.

지하철 구간이나 노선 추가 시 상행 종점과 하행 종점이 같으면 예외로 간주할 것이다.

어노테이션의 이름은 `NotEqual`로 하자.

```java
@Constraint(validatedBy = NotEqualValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface NotEqual {
    String message() default "상행 역과 하행 역은 같을 수 없습니다.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    String upStationId();

    String downStationId();

    @Target({ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @interface List {
        NotEqual[] value();
    }
}
```

`@Constraint` 어노테이션의 `validatedBy` 값으로 `NotEqualValidator.class`를 지정하였다.
차후 NotEqualValidator 클래스를 만들어 검증하게 할 것이다.

#### `@Target`
만들어진 어노테이션이 부착될 수 있는 타입을 지정하는 것이다. `TYPE`은 클래스, 인터페이스, Enum에 부착할 수 있게 한다는 의미이다.

#### `@Retention`
어노테이션의 라이프 사이클, 즉 어노테이션이 언제까지 살아 남아 있을지를 정하는 것이다.

#### `@interface`
어노테이션 인터페이스를 의미한다.

---

이제 검증해 줄`Validator` 클래스를 만든다.

```java
package wooteco.subway.line;

import org.springframework.beans.BeanWrapperImpl;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class NotEqualValidator implements ConstraintValidator<NotEqual, Object> {
    private String upStationId;
    private String downStationId;

    @Override
    public void initialize(NotEqual constraintAnnotation) {
        this.upStationId = constraintAnnotation.upStationId();
        this.downStationId = constraintAnnotation.downStationId();
    }

    @Override
    public boolean isValid(Object object, ConstraintValidatorContext context) {
        Object upStationValue = new BeanWrapperImpl(object).getPropertyValue(upStationId);
        Object downStationValue = new BeanWrapperImpl(object).getPropertyValue(downStationId);
        return !upStationValue.equals(downStationValue);
    }
}
```

`ConstraintValidator` 인터페이스를 구현하는데, `initialize`메서드와 `isValid` 메서드를 오버라이딩한다. 

#### `initialize`
어노테이션을 부착한 객체로부터 필드명을 가져와서 초기화한다.

#### `isValid` 
`isValid` 메서드는 필수로 오버라이딩하여 예외 상황을 검증하도록 한다.

어노테이션이 부착된 객체를 인자로 한다.

`initialize` 메서드에서 초기화했던 필드명을 이용해 어노테이션이 부착된 객체로부터 필드 값을 가져온다.

`BeanWrapperImpl`은 리플렉션을 이용해 필드 값을 가져온다.

---

이제 요청 객체에 어노테이션을 적용한다. 구간 추가 요청 객체와 노선 추가 요청 객체에 적용시키면 다음과 같다.

```java
@NotEqual(upStationId = "upStationId", downStationId = "downStationId")
public class SectionRequest {
    @NotNull
    private Long upStationId;

    @NotNull
    private Long downStationId;
    
    // ...
}
```

```java
@NotEqual(upStationId = "upStationId", downStationId = "downStationId")
public class LineRequest {
    @NotNull
    private Long upStationId;

    @NotNull
    private Long downStationId;
    
    // ...
}
```

### 주의할 점

어노테이션의 의도는 숨어있기 때문에 내부적으로 어떤 동작을 하게 되는지 명확하지 않다면 로직 플로우를 이해하기 어렵다.

하물며 '커스텀' 어노테이션은 그 부담을 가중시킬 수 있다. 

어노테이션 추가가 당장의 작업 속도를 끌어올릴 순 있지만, 장기적 관점에서 시의적절한 것인지를 공감할 수 있어야 한다.

코드가 간결해진다는 장점 하나만 보고 커스텀 어노테이션을 남용하지 않게 주의해야 한다.

반복적으로 사용하지도 않고, 특정 요청 외에는 사용할 일이 없어 보이는 유효성 검사라면 단순 메서드로 만들어 처리하는 것이 더 좋을 것이다.

### 결론

커스텀 어노테이션을 잘 이용하면 불필요한 반복코드가 줄어들고, **비즈니스 로직에 더 집중**할 수 있다는 장점이 있다.

다만, 커스텀 어노테이션은 의도와 목적을 명확히 하여 구성원간 공감대를 이룬 후 추가하는 것이 좋다.

### Reference

https://www.baeldung.com/spring-mvc-custom-validator

https://woowabros.github.io/experience/2020/06/26/custom-annotation.html
