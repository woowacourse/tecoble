---
layout: post
title: '웹 어플리케이션의 역사'
author: [5기_테오]
tags: ['Web']
date: '2023-11-17T12:00:00.000Z'
draft: false
image: ../teaser/chain.jpeg
---

# 웹 어플리케이션의 역사

---

## 들어가면서

백엔드 개발자라면 웹 어플리케이션이라는 개념을 자주 접하게 됩니다.
그렇지만 웹 어플리케이션이 왜 등장했는지, 어떻게 지금의 형태에 이르렀는지에 대해 답하기는 쉬운 일이 아닐 것입니다.

좋은 엔지니어는 기술 그 자체에 매몰되는 것이 아니라 기술을 문제 해결을 위한 하나의 도구로써 활용합니다.
우리가 사용하는 도구가 ‘왜’ 등장했는지는 알아야 할 필요가 있습니다.

따라서 이번 아티클에서는 Spring을 사용하는 백엔드 개발자의 관점에서 웹 어플리케이션의 발전 과정을 살펴보려고 합니다.
WWW의 등장부터 시간순으로 설명할 예정이니, 참고해주시면 감사하겠습니다.

## WWW(World-Wide-Web)

![2023-10-25-HISTORY-OF-WEB-APP_001.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_001.png)

웹 어플리케이션을 이해하기 위해서는 웹이란 도대체 무엇인지, 왜 등장했는지를 이해할 필요가 있습니다. WWW은 도대체 어떤 이유에서 등장했을까요?

1989년, 팀 버너스 리라는 사람이 CERN(유럽 입자 물리 연구소)이라는 기관에서 근무하고 있었습니다.

그런데 그는 근무를 하면서 한 가지 고민에 빠지게 되었습니다.
당시 CERN에서는 핵 소립자 실험의 성과를 전 세계의 연구자들과 공유하고자 하는 니즈가 있었는데, 쉽게 정보를 공유할 방법이 없었기 때문입니다.

사실 당대에 이메일이나 파일 전송과 같은 기술은 이미 존재했습니다.
그런데 수많은 연구자를 상대로 일일이 메일을 보내야 한다면 얼마나 번거로울까요?
따라서 팀 버너스 리는 보다 효율적인 정보 관리 방법을 고민하게 됩니다.

1989년, 팀 버너스 리는 ‘정보 관리(Information Management)’ 라는 이름의 제안서를 CERN의 경영진에게 제출합니다.
해당 제안서에서는 하이퍼텍스트(HyperText) 등의 개념을 소개하면서 ‘정보 관리 네트워크’의 필요성을 주장했습니다.
그리고 이 제안서가 바로 WWW의 개념적인 시초입니다.

> 하이퍼텍스트(HyperText)란 웹 페이지를 다른 웹 페이지로 연결하는 링크를 말합니다. 
> 이런 하이퍼텍스트의 등장으로 참조하고 있는 다른 페이지에 대한 열람이 쉬워졌고, 정보의 전달 효율은 크게 향상되었습니다.
>

팀 버너스 리는 개념적인 모델의 WWW를 제안했을 뿐만 아니라, 실제로 구현까지 직접 참여했습니다.
그는 구현 과정에서 웹의 핵심 기술들을 많이 고안했는데, 대표적인 기술이 바로 HTML과 HTTP입니다.
그리고 최초의 웹 서버라고 불리는 CERN Httpd도 이 시점에 등장했습니다.

## **CGI**

그런데 WWW를 사용하고자 하는 수요가 급속도로 늘어남에 따라 이슈가 하나 생기게 됩니다.
바로 동적 페이지에 대한 요구 또한 증대되었다는 것입니다.

하지만 초기 웹 서버 모델은 URL에 맞춰 페이지를 반환하기만 할 뿐, 동적인 페이지를 생성할 수 있는 능력은 없었습니다.
이런 동적 페이지를 생성하기 위해서는 외부 프로그램의 도움이 필요했습니다.

따라서 HTTP 요청이 들어오면 그에 걸맞은 적절한 프로그램을 수행하자는 아이디어가 부상하게 되었고, CGI라는 표준 인터페이스가 등장하게 됩니다.

> CGI란, Common Gateway Interface의 약자로 서버와 애플리케이션 간에 데이터를 주고받는 방식을 의미합니다.
> 

![2023-10-25-HISTORY-OF-WEB-APP_002.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_002.png)

웹 서버는 동적 페이지를 원하는 클라이언트 요청이 들어오면 CGI 인터페이스를 통해 외부 프로그램을 실행시키면서 적절한 HTTP 응답을 반환할 수 있었습니다.

예를 들어, 사용자가 장바구니 조회 요청을 보내는 경우에는 다음과 같이 동적 페이지를 구성했습니다.

![2023-10-25-HISTORY-OF-WEB-APP_003.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_003.png)

- 장바구니 조회 요청이 발생하면 웹 서버에 도달합니다.
- 웹 서버는 CGI 인터페이스를 사용해 외부 프로그램에 요청 처리를 위임합니다.
- CGI 프로그램은 사용자의 장바구니 정보를 반환합니다.

이처럼 CGI의 등장 덕분에 사용자들은 정적 페이지만 사용하는 것이 아닌 동적 페이지도 접근할 수 있게 되었습니다.

하지만 CGI 방식에도 몇 가지 문제점들이 존재했습니다.
우선 요청마다 프로그램을 실행시켜야 하니 서버 리소스가 많이 소모되었습니다.
또한 HTTP 요청마다 스레드가 아닌 프로세스를 할당하는 구조였기 때문에 서버의 부하가 상당했습니다.

심지어 CGI 프로그램은  C, C++, Perl 등의 언어로 작성되는 경우가 많았기 때문에, 어플리케이션 확장에도 어려움을 겪었습니다.

이에 Java 진영에서는 이런 문제점들을 해결할 수 있는 Servlet이라는 모델을 제시했습니다.

## **Servlet**

Servlet은 Java 코드를 사용해서 웹페이지를 동적으로 생성하는 기술을 의미합니다. 
‘어떻게 Java 코드를 통해 동적 페이지를 생성하지?’ 라는 의문이 드실 수 있는데, 간단하게 HTTP 요청이 하나 들어오면 요청에 대응하는 클래스의 메소드를 호출하는 방식이라고 이해하셔도 됩니다.

이런 Servlet 방식은 CGI 방식과 대비해 상당히 경제적인데, 프로세스가 아닌 스레드 기반으로 동작하기 때문입니다. 
CGI 방식의 경우 요청마다 프로세스를 할당하지만, Servlet 방식은 스레드를 할당합니다.

조금 더 구체적으로 이야기하면, Java Application을 미리 띄워두기 때문에 매번 프로세스를 할당할 필요가 없는 것입니다. 
HTTP 요청이 들어오면 Java Application에게 ‘처리해줘’ 라고 의뢰를 하게 되고 Java Application은 스레드를 생성해서 요청 처리에 적합한 Servlet을 실행합니다.

또한 Servlet은 Java 진영의 기술이기 때문에 순수 Java 코드로 작성됩니다. 
따라서 JVM 생태계에 친화적이고, Java의 특징 중 하나인 ‘플랫폼 독립성’ 가장 잘 누릴 수 있게 됩니다. 
Servlet을 한 번만 구현해두면 어느 플랫폼에서도 쉽게 재사용할 수 있습니다. 
이처럼 Servlet은 앞서 설명해 드렸던 CGI의 문제점들을 극복하는 모델입니다.

Servlet을 사용하는 경우의 HTTP 요청 처리 방식은 CGI 방식과 크게 다르진 않습니다. 
도식화하면 아래와 같습니다.

![2023-10-25-HISTORY-OF-WEB-APP_004.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_004.png)

- HTTP 요청이 발생하면 웹 서버에 도달합니다.
- 웹 서버는 Servlet Container에게 HTTP 요청을 토스합니다.
- Servlet Container는 적절한 Servlet(Java 프로그램)을 선택하고 실행시킵니다.
- Servlet은 요청에 걸맞은 동적 페이지를 반환합니다.

> Servlet Container란 Servlet을 관리해주면서 동적 웹페이지를 제공하기 위한 기타 작업을 수행해주는 역할을 합니다. 
> Servlet은 동적 페이지를 만들어내기 위한 프로그램에 불과하므로 이들을 초기화해주고 관리해주는 누군가가 필요하기 때문입니다.
>

그렇지만 서블릿 방식의 웹 어플리케이션도 문제점은 존재했습니다. 
바로 자바 코드에서 HTML을 다루다보니 비즈니스 로직과 뷰의 영역 자체가 모호했다는 것입니다.

다음 코드를 보면 ‘뷰의 영역이 모호하다’ 라는 말이 이해가 될 것입니다. 
아래 Servlet 코드에서는 로그인 처리를 위한 코드와 렌더링을 위한 코드가 공존합니다.

```sql
public class MyServlet extends HttpServlet {
	
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response) {
		String account = request.getHeader("account");
		String password = request.getHeader("password");
		
		// 비즈니스 로직
		validateCredential(account, password);

		// 뷰를 위한 로직
		out.write("<html>"); 
		out.write("<head> </head>");
		out.write("<body> Hello world! </body>");
		out.write("</html>");
	}
```

이처럼 뷰의 변경 지점과 비즈니스 로직의 수정 지점이 같아지다 보니, 유지 보수하는 데 어려움을 겪기 일쑤였습니다. 
프로그래머는 Servlet 코드를 변경하고 싶어도 디자이너가 HTML 작업을 하고 있다면 기다려야 했습니다.

따라서 Java 코드와 HTML 코드의 분리를 더 명확히 하자는 요구가 생겨났고, JSP가 등장하게 됩니다.


## **JSP**

JSP는 Java Server Page의 약자로(현재는 Jakarta Server Page라고도 불립니다) HTML 코드에 Java 코드를 넣어 동적 웹페이지를 생성하는 기술을 의미합니다.

```html
<HTML>
<HEAD><TITLE>The Welcome User JSP</TITLE></HEAD>
<BODY>
		<% String user=request.getParameter("user"); %>
		<H3>Welcome <%= (user==null) ? "" : user %>!</H3>
		<P><B> Today is <%= new java.util.Date() %>. Have a nice day! :-)</B></P>
		<B>Enter name:</B>
		<FORM METHOD=get>
				<INPUT TYPE="text" NAME="user" SIZE=15>
				<INPUT TYPE="submit" VALUE="Submit name">
		</FORM>
</BODY>
</HTML>
```

위 코드는 간단한 JSP 파일 예시입니다. 
<% %> 블록 안에 Java 코드가 포함된 것을 확인하실 수 있습니다. 
<% %>와 같은 식별자들을 JSP 태그라고 하는데, JSP에서는 JSP 태그를 활용해 Java 코드를 HTML에 삽입할 수 있습니다.

JSP를 사용하는 경우 프로그래머는 JSP 태그로 감싸진 부분만 다루면 되고, 디자이너는 JSP 태그 이외의 HTML만 다루면 되므로 순수 Servlet을 사용하는 방법과 대비해 유지 보수성이 향상됩니다.

사실 위처럼 비즈니스 로직을 직접 JSP 페이지에 작성하기보다는 재사용 가능한 컴포넌트인 Java Beans를 사용하는 경우가 많았습니다.
참고로 Java Beans란 재사용할 수 있는 Java 클래스를 의미하는데, 자세한 설명은 본문의 주제를 벗어날 것 같아 생략하도록 하겠습니다.

아래 코드는 Java Beans를 활용해 JSP 프로그래밍을 한 예시입니다. 
userBean, dataBean이라는 Java Bean을 활용해 렌더링에 필요한 정보를 가져옵니다.
```html
<HTML>
<HEAD><TITLE>The Welcome User JSP</TITLE></HEAD>
<BODY>
		<jsp:useBean id="userBean" class="mybeans.UserBean" scope="page" />
		<jsp:useBean id="dateBean" class="mybeans.DateBean" scope="page" />
		<% String user=request.getParameter("user"); %>
		<H3>Welcome <%= userBean.getName() %>!</H3>
		<P><B> Today is <%= dateBean.getDate() %>. Have a nice day! :-)</B></P>
		<B>Enter name:</B>
		<FORM METHOD=get>
				<INPUT TYPE="text" NAME="user" SIZE=15>
				<INPUT TYPE="submit" VALUE="Submit name">
		</FORM>
</BODY>
</HTML>
```
 
이런 JSP의 경우 어떤 방식으로 사용하느냐에 따라 모델 1 구조와 모델 2 구조로 나뉘었습니다.
JSP를 통해 뷰의 구성과  제어 로직의 처리까지 모두 수행한다면 모델 1이라고 불렸고, 뷰의 구성만 담당한다면 모델 2라고 불렸습니다.

앞서 본 Java Beans를 활용하는 JSP 예시 코드가 모델 1에 해당합니다. 
JSP가 직접 Java Beans를 호출하는 등의 제어 로직을 담당하기 때문입니다.

![2023-10-25-HISTORY-OF-WEB-APP_005.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_005.png)

모델 1의 경우에는 구조가 단순하여 간단한 페이지를 구성하는 데에 주로 사용되었지만, 규모가 큰 프로그램을 작성할 때에는 상당한 양의 Java 코드가 JSP 파일에 드러나게 되었습니다. 
이는 시스템 규모가 크다면 JSP의 장점을 살릴 수 없었음을 의미합니다.

따라서 대안으로 모델 2가 등장하게 됩니다. 
모델 2의 경우는 모델 1을 보완한 것으로 제어 로직 처리 자체는 서블릿이 하며 JSP는 렌더링만 담당하게 됩니다. 
이를 통해 비즈니스 로직과 뷰의 책임을 명확하게 분리할 수 있게 됩니다.

코드로 나타내면 아래와 같습니다. 
서블릿에서는 HTTP 요청을 받고, 적절한 제어 로직을 수행합니다. 
그리고 request의 Attribute에 렌더링을 원하는 객체를 등록한 뒤, JSP 페이지로 포워딩합니다.

> 클라이언트를 거쳐 다시 HTTP 요청을 보내는 것이라면 리다이렉션, 서버 내에서만 이동하는 경우 포워딩이라고 부릅니다.
>

- Servlet 코드

```java
public class MyServlet extends HttpServlet {
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // 비즈니스 로직 수행
        java.util.Date now = new java.util.Date();
        request.setAttribute("currentDateTime", now);

        // JSP 페이지로 리다이렉션
        request.getRequestDispatcher("myView.jsp")
					.forward(request, response);
    }
}
```

그리고 JSP 페이지에서는 단순히 currentDateTime 객체를 꺼내 렌더링만 수행합니다.

- JSP 코드

```html
<HTML>
<HEAD><TITLE>JSP Model 2 example</TITLE></HEAD>
<BODY>
    <H1>current date and time:</H1>
    <P><%= request.getAttribute("currentDateTime") %></P>
    <h2>login form:</h2>
    <FORM action="process.jsp" method="post">
        <INPUT type="text" name="name"><BR>
        <INPUT type="text" name="email"><BR>
        <INPUT type="submit" value="submit">
    </FORM>
</BODY>
</HTML>
```

이처럼 모델 2는 Servlet과 JSP의 관심사를 분리하여 유지 보수성을 향상시킨 모델입니다. 
Servlet은 제어 로직을 담당하고, JSP는 뷰 로직을 담당합니다. 
그리고 이 구조는 현재 우리에게 익숙한 MVC 패턴과 유사합니다.

## **J2EE와 EJB**

![2023-10-25-HISTORY-OF-WEB-APP_006.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_006.png)

앞서서 우리는 동적 페이지를 구현하기 위한 방법으로 Servlet과 JSP를 살펴보았습니다. 
사실 Servlet과 JSP는 J2EE에 포함되어 있는데, J2EE란 기업 환경의 어플리케이션을 구성하는 데 필요한 표준의 집합을 의미합니다.

많은 Java 개발자들은 이 J2EE라는 표준을 따르며 웹 어플리케이션을 구축해왔습니다. 
J2EE에는 JDBC, Servlet, JSP 등 JVM 진영에서 개발을 해보았다고 한다면 한 번쯤은 들어보았을만한 표준이 많이 존재합니다. 
그렇지만 모든 표준이 항상 실용적이었던 건 아닙니다.

J2EE에는 EJB라는 기술이 존재합니다.
EJB(Enterprise Java Beans)란 분산 애플리케이션을 지원하는 컴포넌트 객체이며, J2EE를 사용해 엔터프라이즈급 서버를 개발하는 경우 EJB로 비즈니스 로직을 처리했습니다.
그리고 이런 EJB 객체들을 관리하는 EJB 컨테이너라는 것도 존재했는데, EJB 컨테이너는 분산 트랜잭션 지원 등의 기술적인 지원을 해주었습니다.

하지만 EJB로부터 기술적인 지원을 받기 위해서는 EJB 컨테이너에 종속적인 코드들을 많이 작성해야 했고, 더는 순수한 비즈니스 로직을 작성하기가 어려웠습니다.

다음은 EJB를 사용하는 경우의 예시 코드입니다. 
HelloBean은 단순히 이름이 입력으로 들어왔을 때 “Hello”를 붙여 출력해주는 비즈니스 객체입니다. 
해당 객체는 단순한 비즈니스 로직을 수행함에도 불구하고 SessionBean이라는 인터페이스를 구현해야 합니다. 
EJB와 관련된 코드가 상당 부분을 차지하고 있는 모습을 확인하실 수 있습니다.

```java
import javax.ejb.*;

public class HelloBean implements SessionBean {

    public String sayHello(String myName) throws EJBException {
        return ("Hello " + myName);
    }

    /* ------------------------------------------------------
    * Begin EJB-required methods. The following methods are called
    * by the container, and never called by client code
    * ------------------------------------------------------- */

    public void ejbCreate() throws CreateException {
        // when bean is created
    }

    public void setSessionContext(SessionContext ctx) {

    }

		// Life Cycle Methods

    public void ejbActivate() {

    }

    public void ejbPassivate() {

    }

    public void ejbCreate() {

    }

    public void ejbRemove() {

    }
}
```
이런 형식의 웹 어플리케이션 개발은 유지 보수성에 있어 많은 문제를 불러왔고, 흔히 이 시기를 '추운 겨울'이라고 표현하기도 했습니다.

## **Spring**

이처럼 J2EE 표준을 준수한 애플리케이션들이 너무나도 복잡해지니 로드 존슨이라는 사람이 나타나 ‘J2EE Development without EJB’ 라는 책을 출간합니다.

![2023-10-25-HISTORY-OF-WEB-APP_007.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_007.png)

로드 존슨은 해당 저서에서 EJB의 문제점을 제시하면서 EJB를 사용하지 않고도 충분히 고품질의 애플리케이션을 개발할 방법이 존재함을 증명했습니다. 
그리고 이 저서가 바로 Spring이라는 웹 프레임워크의 시작점입니다. 

![2023-10-25-HISTORY-OF-WEB-APP_008.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_008.png)

로드 존슨이 주장하는 Spring의 핵심 가치는 ‘POJO를 통해 순수한 비즈니스 로직을 작성하자’ 입니다. 
EJB를 사용하는 경우 앞서 말씀드렸듯이 특정 기술에 종속적인 코드를 작성하게 되었고, 객체 지향적이고 순수한 비즈니스 로직과는 거리가 멀어졌기 때문입니다.

> Spring is essentially a technology dedicated to enabling you to build applications using POJOs. - Rod Johnson
>

Spring은 EJB의 문제점을 해결하기 위한 장치들을 여럿 가지고 있습니다. 
대표적인 장치로는 제어의 역전(Inversion Of Control), 의존성 주입(Dependency Injection), 관점 지향 프로그래밍(Aspect Oriented Programming) 등이 있습니다.
이외에도 트랜잭션 추상화 같은 다양한 개발 편의 기술들을 제공하기도 합니다.  

이런 Spring을 사용하면 EJB 스펙을 따르지 않아도 EJB와 비슷한 효과를 낼 수 있었습니다.
하지만 여기서 주의해야 할 점은, Spring 자체가 J2EE 사양을 대체하기 위해 등장한 프레임워크는 아니라는 것입니다.
로드 존슨의 저서 이름을 보시면 아시다시피, Spring은 J2EE 사양을 보완하기 위해 등장한 프레임워크임을 알아야 합니다.

현재는 Spring이 단순히 J2EE 사양을 보완할 뿐만 아니라, 독자적인 생태계를 구성하고 있습니다. 
Spring MVC 뿐만 아니라 Spring Batch, Spring Security, Spring Reactive 등과 같은 많은 기술이 생겨나고 있으며 그 입지를 단단히 하고 있습니다.

## **마치면서**

WWW의 등장으로부터 Spring에 이르기까지의 역사를 훑어보았습니다.
이를 통해 시대적 배경 속에 각각의 기술들이 등장할 수밖에 없었던 이유를 확인할 수 있었습니다.

정보 공유를 위해 WWW가 탄생했으며, 동적 페이지에 대한 요구에 대응하기 위해 CGI, Servlet, JSP 등의 기술이 생겨났습니다.
또한, J2EE 사양의 한계를 극복하기 위해 웹 프레임워크인 Spring이 등장했었습니다.

역사를 보시면 아시다시피, 100% 완전무결한 기술은 없습니다.
그렇기 때문에 기술의 근본을 이해하려는 노력이 중요하다고 생각합니다.

이번 글을 통해 평소 웹 어플리케이션의 발전 과정에 대해 궁금하셨던 분들의 요구가 충족되었으면 하는 바람입니다.

감사합니다.

## 참고 자료
프로가 되기 위한 웹기술 입문 - 위키북스

- [Introduction to the Spring Framework - Rod Johnson](https://www.theserverside.com/news/1364527/Introduction-to-the-Spring-Framework)

- [Information Management: A Proposal - Tim Berners-Lee, CERN](https://cds.cern.ch/record/369245/files/dd-89-001.pdf)

- [History of World Wide Web -Wikipedia](https://en.wikipedia.org/wiki/History_of_the_World_Wide_Web)

- [Web Server - Wikipedia](https://en.wikipedia.org/wiki/Web_server)

- [HTML - MDN Web Docs](https://developer.mozilla.org/ko/docs/Web/HTML)

- [Servlet Overview - Oracle](https://docs.oracle.com/cd/B12166_01/web/B10321_01/overview.htm)

- [JSP Overview - Oracle](https://docs.oracle.com/cd/B14099_19/web.1012/b14014/genlovw.htm#i1005577)

- [About the Model 2 Versus Model 1 Architecture - Oracle](https://download.oracle.com/otn_hosted_doc/jdeveloper/1012/developing_mvc_applications/adf_aboutmvc2.html)

- [Session Bean Interface - Oracle](https://docs.oracle.com/javaee%2F6%2Fapi%2F%2F/javax/ejb/SessionBean.html)

- [Spring Framework Overview - Spring](https://docs.spring.io/spring-framework/reference/overview.html)
