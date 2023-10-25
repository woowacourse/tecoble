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

백엔드 개발자라면 웹 어플리케이션이라는 개념을 자주 접하게 됩니다. 그렇지만 웹 어플리케이션이 왜 등장했는지, 어떻게 지금의 형태에 이르렀는지에 대해 답하기는 쉬운 일이 아닐 것입니다.

그렇지만 좋은 엔지니어는 기술 그 자체에 매몰되는 것이 아니라 기술을 문제 해결을 위한 하나의 도구로서 활용합니다. 우리가 사용하는 도구가 ‘왜’ 등장했는지는 알아야 할 필요가 있습니다.

따라서 이번 아티클에서는 Spring을 사용하는 백엔드 개발자의 관점에서 웹 어플리케이션의 발전 과정을 검토해보려고 합니다. WWW의 등장부터 시간 순으로 설명할 예정이니, 참고해주시면 감사하겠습니다.

## WWW(World-Wide-Web)

![2023-10-25-HISTORY-OF-WEB-APP_001.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_001.png)

1989년, 팀 버너스 리라는 사람이 CERN(유럽 입자 물리 연구소)이라는 기관에서 근무하고 있었습니다. 

그런데 한 가지 고민에 빠지게 됩니다. 바로 서로 다른 컴퓨터에 저장되어 있는 정보를 매번 찾기가 어려웠다는 것입니다. 

따라서 1989년, 팀 버너스 리는 ‘정보 관리(Information Management)’ 라는 제안서를 CERN의 경영진에게 제출합니다. 그리고 이것이 바로 WWW의 초기 모델입니다.

하지만 초기 WWW 모델은 예상과는 다르게 큰 환영을 받지 못했습니다. 하지만 이후 해당 제안을 발전시켜 인터넷과 하이퍼텍스트(HyperText)를 결합시킨 모델을 제시하면서 WWW은 점점 주목을 받게 되었습니다.

> 하이퍼텍스트(HyperText)란, 웹 페이지를 다른 웹 페이지로 연결하는 링크를 말합니다.
> 

이 시점에 팀 버너스 리는 WWW을 구현하기 위해 HTTP, HTML 등과 같은 유명한 기술을 고안했고, 웹 서버의 시초라고 불리는 CERN Httpd도 만들어지게 되었습니다.

## **CGI**

이후 WWW가 상용화되고 급속도로 인기를 얻음에 따라 정적인 페이지가 아닌 동적인 페이지에 대한 요구도 빠르게 증대되었습니다. 그렇지만 초기 웹 서버 모델은 URI에 맞춰 페이지를 반환하기만 할 뿐, 동적인 페이지를 생성할 수 있는 능력은 없었습니다.

이런 동적 페이지를 생성하기 위해서는 외부 프로그램이 도움이 필요했습니다. 따라서 HTTP 요청이 들어오면 그에 걸맞는 적절한 프로그램을 수행하자는 아이디어가 부상하게 되었고, CGI라는 표준 인터페이스가 등장하게 됩니다.

> CGI란, Common Gateway Interface의 약자로 서버와 애플리케이션 간에 데이터를 주고 받는 방식을 의미합니다.
> 

![2023-10-25-HISTORY-OF-WEB-APP_002.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_002.png)

웹 서버는 동적 페이지를 원하는 클라이언트 요청이 들어오면 CGI 인터페이스를 통해 외부 프로그램을 실행시키면서 적절한 HTTP 응답을 반환할 수 있었습니다.

예를 들어, 사용자가 장바구니 조회 요청을 보내는 경우에는 다음과 같이 동적 페이지를 구성했습니다.

![2023-10-25-HISTORY-OF-WEB-APP_003.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_003.png)

- 장바구니 조회 요청이 발생하면 서버에 도달합니다.
- 서버는 CGI 인터페이스를 사용해 외부 프로그램에게 요청 처리를 위임합니다.
- CGI 프로그램은 사용자의 장바구니 정보를 반환합니다.

CGI의 등장으로 인해 사용자들은 더 이상 정적 페이지만 사용하는 것이 아닌 동적 페이지도 접근할 수 있게 되었습니다. 참고로, CGI 방식은 초기에 form 데이터를 처리할 때 자주 사용되었다고 합니다. 

이렇게 CGI 방식은 동적 웹페이지를 구성할 수 있었지만, 몇 가지 문제점들이 존재하기도 했습니다. 우선 매 요청마다 프로그램을 실행시켜야 하니 서버 리소스가 많이 소모되었습니다. 또한, CGI 방식은 매 요청마다 스레드가 아닌 프로세스를 할당하는 구조였기 때문에 조금만 많은 요청이 오더라도 서버의 부하가 상당했습니다.

CGI 프로그램의 경우 심지어는 C, C++, Perl 등의 언어로 작성되는 경우가 많았기 때문에, 어플리케이션 확장에도 어려움을 겪었습니다.

그리고 이런 문제점들을 해결하기 위해 Java 진영에서는 Servlet이라는 개념이 등장했습니다.

## **Servlet**

Servlet은 자바 코드를 사용해서 웹페이지를 동적으로 생성하는 기술을 의미합니다. 매 요청마다 외부 프로그램을 실행할 필요가 없이 자바 코드를 실행하기만 하면 되어서 CGI 방식에 비해 경제적입니다. 

Servlet은 프로세스가 아닌 스레드 기반으로 동작하며, 순수 Java 코드로만 짜여지기 때문에 JVM 생태계에 친화적이기도 합니다. 쉽게 말해 Servlet은 CGI 방식의 웹 어플리케이션의 한계를 극복하는 모델이라고도 할 수 있겠습니다.

Servlet을 사용하는 경우 HTTP 요청 처리는 CGI 프로그램을 사용하는 방식과 크게 다르진 않습니다. 다만 프로그램이 더 이상 외부에서 실행되는게 아니라, 자바 코드로 실행된다는 점이 다릅니다.

HTTP 요청 및 응답 과정을 도식화하면 아래와 같습니다.

![2023-10-25-HISTORY-OF-WEB-APP_004.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_004.png)

- HTTP 요청이 발생하면 Servlet Container에 도달합니다.
- Servlet Container는 적절한 Servlet(Java 프로그램)을 선택하고 실행시킵니다.
- Servlet은 HTTP 요청에 걸맞는 동적 페이지를 반환합니다.

Servlet Container란 Servlet을 관리해주면서, 웹소켓 통신을 제공하는 등 동적 웹페이지를 제공하기 위한 기타 작업을 수행해주는 역할을 합니다. Servlet은 동적 페이지를 만들어내기 위한 프로그램에 불과하며, 이들을 초기화해주고 관리해주는 누군가가 필요하기 때문입니다.

그렇지만 서블릿 방식의 웹 어플리케이션도 몇 가지 문제점은 존재했습니다. 우선 자바 코드에서 HTML을 다루다보니 뷰의 영역 자체가 모호했습니다. 

다음은 Servlet 코드를 간략하게 작성한 것입니다. ‘doGet’ 은 쉽게 말해 GET 요청이 들어왔을 때 처리할 내용을 지정한다고 생각하시면 됩니다.

코드를 보면 ‘뷰의 영역이 모호하다’ 라는 말이 이해가 되실 것입니다. 아래 코드에서는 로그인 처리를 위한 코드와 렌더링을 위한 코드가 공존합니다. 이처럼 뷰의 변경 지점과 비즈니스 로직의 변경 지점이 같아지다 보니, 유지보수하는 데 어려움을 겪기 일쑤였습니다.

```sql
public class MyServlet extends HttpServlet {
	
	@Override
	protected void doGet(HttpServletRequest request,
												HttpServletResponse response) {
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

## **JSP**

이런 니즈에 따라 JSP가 등장하게 됩니다. 동적 페이지를 구성하고자 하는 경우, Servlet으로는 프로그래밍을 하기 어려웠고 JSP가 대안이 되었습니다. JSP는 Java Server Page의 약자로(현재는 Jakarta Server Page라고도 불립니다) HTML 코드에 Java 코드를 넣어 동적 웹페이지를 생성하는 기술을 의미합니다.

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

위는 JSP의 구조인데, <% %> 블록 안에 Java 코드가 포함되어 있는 것을 확인하실 수 있습니다. <% %>와 같은 식별자들을 JSP 태그라고 하는데, JSP에서는 JSP 태그를 활용해 Java 코드를 HTML에 삽입할 수 있습니다. 

사실, 위처럼 비즈니스 로직을 직접 JSP 페이지에 작성하기보다는 Java Beans를 사용하는 경우가 많았습니다. 아래처럼 비즈니스 로직을 담당하는 객체를 Import 해 사용해 JSP 프로그래밍을 진행했고, 덕분에 비즈니스 로직과 뷰의 경계가 뚜렷해지게 됩니다. 

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

> 참고로 JSP 파일들은 런타임에 Servlet 객체로 변환이 되므로 Servlet과 JSP는 결국 비슷한 역할을 한다고 이해하셔도 될 것 같습니다.
> 

JSP의 경우 어떤 방식으로 사용하느냐에 따라 모델 1 구조와 모델 2 구조로 나뉘었습니다. JSP를 통해 뷰의 구성과  제어 로직의 처리까지 모두 수행한다면 모델 1 이라고 불렸고, 뷰의 구성만 담당한다면 모델 2라고 불렸습니다.

앞서 본 Java Beans를 활용하는 JSP 예시 코드가 모델 1에 해당합니다. JSP가 직접 Java Beans를 호출하는 등의 제어 로직을 담당하기 때문입니다.

![2023-10-25-HISTORY-OF-WEB-APP_005.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_005.png)

이런 모델 1의 경우에는 구조가 단순하여 간단한 페이지를 구성하는 데에 주로 사용되었지만, 규모가 큰 프로그램을 작성할 때에는 상당한 양의 코드가 JSP 파일에 드러나게 되었습니다.

따라서 모델 2가 등장하게 됩니다. 모델 2의 경우는 모델 1을 보완한 것으로 제어 로직 처리 자체는 서블릿이 하며 JSP는 렌더링만 담당하게 됩니다. 코드로 나타내면 아래와 같습니다. 

서블릿에서는 HTTP 요청을 받고, 적절한 제어 로직을 수행합니다. 그리고 request의 Attribute에 렌더링을 원하는 객체를 등록한 뒤, JSP 페이지로 리다이렉션합니다.

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

이처럼 Model 2는 각각의 책임에 맞게 관심사의 분리를 적절히 응용하여 유지보수성을 향상시킨 모델입니다. Servlet은 제어 로직을 담당하고, JSP는 뷰 로직을 담당합니다. 그리고 이 구조는 현재 우리에게 익숙한 MVC 패턴과 유사합니다.

## **J2EE와 EJB**

![2023-10-25-HISTORY-OF-WEB-APP_006.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_006.png)

앞서 설명한 Servlet, JSP와 같은 기술들이 제안된 곳이 바로 J2EE(Java to Enterprise Edition)입니다. J2EE란 기업 환경의 어플리케이션을 구성하기 위해 필요한 표준의 집합을 의미합니다.

많은 Java 개발자들은 이 J2EE라는 표준을 따르며 웹 어플리케이션을 구축해왔습니다. J2EE에는 JDBC, Servlet, JSP 등 JVM 진영에서 개발을 해보았다고 한다면 한번쯤은 들어보았을만한 표준이 많이 존재합니다. 그렇지만 모든 표준이 항상 실용적이었던 건 아닙니다.

J2EE에는 EJB라는 스펙이 존재합니다. EJB(Enterprise Java Beans)란, 분산 애플리케이션을 지원하는 컴포넌트 객체입니다. 즉 EJB를 활용하면 내 컴퓨터의 객체가 다른 컴퓨터의 객체와 통신을 할 수 있습니다. 그리고 이런 EJB 객체들을 관리하는 EJB 컨테이너라는 것도 존재했는데, EJB 컨테이너는 분산 트랜잭션 지원 등의 업무를 대신 수행해줬습니다.

EJB는 초기에 실용적으로 보였고 많은 사랑을 받았습니다. 하지만 EJB 표준에 맞춰서 개발을 진행하다 보니 순수한 비즈니스 로직에 집중하기는 커녕 EJB 컨테이너 기술들을 위해 상투적인 코드를 작성해야 했고, 특정 EJB 컨테이너에 종속적인 코드를 작성할 수 밖에 없었습니다. 이는 유지보수성에 있어 많은 문제를 불러왔고, 흔히 이 시기를 '추운 겨울'이라고 표현하기도 했습니다.

## **Spring**

이처럼 J2EE 표준을 준수한 애플리케이션들이 너무나도 복잡해지니 로드 존슨이라는 사람이 나타나 ‘J2EE Development without EJB’ 라는 책에서 해결 방법을 제시합니다.

![2023-10-25-HISTORY-OF-WEB-APP_007.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_007.png)

로드 존슨은 해당 저서에서 EJB의 문제점을 제시했습니다. 그리고 EJB를 사용하지 않고도 충분히 고품질의 애플리케이션을 개발할 수 있는 방법이 존재함을 증명했습니다. 그리고 현재 스프링의 기반이 되는 핵심 코드들이 바로 이 책에 포함되어 있습니다.

![2023-10-25-HISTORY-OF-WEB-APP_008.png](..%2Fimages%2F2023-10-25-HISTORY-OF-WEB-APP_008.png)

이런 스프링의 등장으로 '추운 겨울'이 지나가고 '봄(Spring)'이 오기 시작했습니다. 스프링은 EJB와 달리 순수한 POJO(Plain Old Java Object)를 개발할 수 있도록 지원하는 프레임워크이기 때문에, 스프링을 사용하는 개발자들은 어떤 외부 기술에도 종속되지 않는 순수한 비즈니스 로직을 작성할 수 있게 되었습니다. 

이는 테스트하기도 간편했으며 확장하기도 수월했습니다. 스프링은 기술의 영역을 비즈니스의 영역으로부터 성공적으로 분리해냈습니다. 

다만 로드 존슨의 저서 이름(J2EE Development without EJB)을 보시다시피  스프링은 J2EE 사양을 대체하기 위해 등장한 것은 아니고, 기존에 존재하는 J2EE 사양을 유연하게 확장시킨 모델입니다.

스프링을 사용하면 EJB 스펙을 따르지 않아도 EJB와 비슷한 효과를 낼 수 있었습니다. 또한 오픈 소스이면서 경량급 프레임워크였기 때문에 빠르게 인기를 얻게 되었습니다.

현재는 스프링이 단순히 J2EE 사양을 보완할 뿐만 아니라, 독자적인 생태계를 구성하고 있습니다. Spring MVC 뿐만 아니라 Spring Batch, Spring Security, Spring Reactive 등 많은 기술들이 생겨나고 있으며 그 입지를 단단히 하고 있습니다.

## **마치면서**

WWW의 등장으로부터 스프링에 이르기까지의 역사를 훑어보았습니다. 시대적 배경 속에 각각의 기술들이 등장할 수 밖에 없었던 이유가 있었던 것 같습니다.

정보 공유를 위해 WWW가 탄생했으며, 동적 페이지에 대한 요구에 대응하기 위해 CGI, Servlet, JSP 등의 기술이 생겨났습니다. 또한, 이런 J2EE 사양의 한계를 극복하기 위해 Spring이 등장했었습니다.

역사를 보시면 알다시피, 100% 완전무결한 기술은 없을지도 모릅니다. 그렇기 때문에 기술의 근본을 이해하려는 노력이 중요하다는 생각이 듭니다. 

이번 아티클을 통해 평소 웹 어플리케이션의 발전 과정에 대해 궁금하셨던 분들의 니즈가 해소되었으면 하는 바램입니다.

감사합니다.

## 참고 자료

[History of World Wide Web -Wikipedia](https://en.wikipedia.org/wiki/History_of_the_World_Wide_Web)

[Web Server - Wikipedia](https://en.wikipedia.org/wiki/Web_server)

[HTML - MDN Web Docs](https://developer.mozilla.org/ko/docs/Web/HTML)

[Servlet Overview - Oracle](https://docs.oracle.com/cd/B12166_01/web/B10321_01/overview.htm)

[JSP Overview - Oracle](https://docs.oracle.com/cd/B14099_19/web.1012/b14014/genlovw.htm#i1005577)

[About the Model 2 Versus Model 1 Architecture - Oracle](https://download.oracle.com/otn_hosted_doc/jdeveloper/1012/developing_mvc_applications/adf_aboutmvc2.html)

[Spring Framework Overview - Spring](https://docs.spring.io/spring-framework/reference/overview.html)
