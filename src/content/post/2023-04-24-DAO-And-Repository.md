# DAO와 Repository
웹 자동차 경주 미션을 진행하며 많은 크루들이 DAO 클래스를 사용해서 DB에 접근을 했다. 이 때 대부분이 스프링의 @Repository 어노테이션을 사용했다. DAO가 Repository의 일종인가, 싶었는데 DAO와 Repository를 함께 사용하는 크루도 있어서 혼란스러웠다.
Spring 공식 문서에 나와있는 @Repository 어노테이션의 설명에는 다음과 같이 나와있다.
`Teams implementing traditional Jakarta EE patterns such as “Data Access Object” may also apply this stereotype to DAO classes, though care should be taken to understand the distinction between Data Access Object and DDD-style repositories before doing so.`
DAO 클래스에도 @Repository 어노테이션을 사용할 수 있지만 DAO와 (DDD-style의) Repository의 차이를 잘 알고 조심해서 사용해야 한다고 한다.
검색을 해본 결과, 엄연히 다른 개념임을 알 수 있었다. 다만, 분류가 명확하지 않고 잘못된 블로그 글들이 많아서 나름대로 이해한 바를 정리해보려고 한다.

1. DAO와 Repository의 필요성
2. DAO Pattern
3. Repository Pattern
4. DAO와 Repository의 공통점과 차이점

## DAO와 Repository의 필요성
Application을 구현할 때, 영속성을 가진 영구저장소를 필요로 하는 경우가 많다. 이 때, application에서 영구저장소에 접근을 하기 위해서는 각 영구저장소 벤더가 제공하는 API를 사용한다. 만약 영구저장소의 API가 다른 비즈니스 로직들과 함께 존재한다면 다음과 같은 문제들이 발생한다.

1. 구현체와 로직이 너무 강한 결합을 가진다.
   만약, 기존의 영구저장소와 다른 벤더의 영구저장소를 사용하게 된다면 기존 영구저장소의 API를 사용한 모든 부분을 비즈니스 로직들 내부에서 찾아서 변경해야 할 것이다. 그러므로 객체 지향의 5원칙인 SOLID 중 확장에 대해서는 열려있고 수정에 대해서는 닫혀 있어야 한다는 OCP(개방-폐쇄 원칙)를 위반한다.

2. 계층화가 깨진다.
   일반적인 웹 application의 구조는 아래와 같은 layered architecture로 되어있다.

[image:1E4EDC3A-7F21-459A-AA85-F7B55B52B9E4-75978-00000965E1BC3C5C/C5AD1391-6312-4E96-B53B-7E26A829A210.png]

영구저장소는 infrastructure 계층에 속하고, 비즈니스 로직들은 application 계층에 속하는데, 영구저장소에 대한 API가 application 계층에 속하게 되면 계층화가 깨진다. Layered architecture의 이점인 모듈화, 유연성 등이 사라지게 되는 문제가 있다.

그러므로 비즈니스 로직과 영구저장소의 API를 분리할 수 있는 추상화 계층이나 객체가 필요하다. 즉, 데이터에 접근하는 행위를 추상화하고 캡슐화하여 비즈니스 로직과 데이터 접근 로직을 분리해야 한다. 이를 구현한 Pattern으로 DAO Pattern과 Repository Pattern이 있다.

## DAO Pattern
DAO(Data Access Object)는 이름 그대로 데이터에 접근하기 위한 객체이다. 이름부터가 자신이 영속성 계층과 연관이 있음을 나타내고 있다. 그 자체로 Data Persistence의 추상화이기 때문에 도메인 계층이 아닌 영속성 계층에 속한다. 따라서 일반적으로 DAO는 DB의 테이블과 일치한다. 즉, 테이블 중심이라고 할 수 있다.

```java
public class Car {
	private final String name;
	private final int position;
	
	//...

	public CarDto toDto() {
		return new CarDto(name, position);
	}
}
```
```java
public class CarDto {
	private final String name;
	private final int position;

	public CarDto(String name, int position) {
		this.name = name;
		this.position = position;
	}

	//getter etc..
}
```

위와 같이 Car 클래스가 존재한다고 하자. 그리고 이 클래스의 필드값 등에 대한 DTO가 존재한다고 하자.
Car 객체의 데이터를 영구저장소에 CRUD하는 메서드가 CarDao에 존재하여 노출되고, 이를 구현하기 위해 DAO 구현체 안에서 영구저장소의 API들이 사용된다. Car와 CarDao는 존재하는 계층이 다르기 때문에 DTO로 통신하는 것이 합리적이다.
아래 예시는 DAO 인터페이스와 해당 인터페이스의 MySQL, MongoDB 각각에 대한 축약된 구현체들이다.

```java
public interface CarDao {
    void create(CarDto carDto);

    CarDto read(int id);

    void update(CarDto carDto);

    void delete(int id);
}
```

```java
public class MySQLCarDao implements CarDao {

	//DB connection etc...

	@Override
	public void create(CarDto carDto) {
		String sql = "INSERT INTO CARS(id, name, position) VALUES(?, ?, ?)";
		//parameter binding etc...
	}
	
	@Override
	public CarDto read(int id) {
		String sql = "SELECT * FROM CARS WHERE id = ?";
		//parameter binding etc...
	} 
	
	//...
}
```
```java
public class MongoDBCarDao implements CarDao {

	//DB connection etc...

	@Override
	public void create(CarDto carDto) {
		//doc -> Document 인스턴스
		doc.put(carDto.getName(), carDto.getPosition());
		//etc...
	}
	
	@Override
	public CarDto read(int id) {
		//MongoCollection의 find() 메서드 이용
		Document doc = collection.find(eq("id", id));
		//etc...
	} 
	
	//...
}
```

이와 같이, 직접적인 DB와의 상호작용을 추상화하고 쿼리를 실행하는 객체를 DAO라고 하고, DAO를 이용하여 데이터에 접근하는 pattern을 DAO Pattern이라고 한다.

## Repository Pattern
Spring 공식 문서에 있는 @Repository 어노테이션에 대한 설명은 다음과 같다.

`Indicates that an annotated class is a “Repository”, originally defined by Domain-Driven Design (Evans, 2003) as “a mechanism for encapsulating storage, retrieval, and search behavior which emulates a collection of objects”.`

위의 정의에서 나와있듯이, Repository는 단순히 저장소라는 의미이다. 이름에서는 전혀 영속성 계층과 연관이 있음을 알 수 없다. 그저 객체들의 집합(collection)을 추상화한 메커니즘이다. 즉, Repository의 구현체는 DB와 연관이 있을 수도, 없을 수도 있다. 도메인과 아주 밀접한 관계가 있고, 영속성 계층과의 연관이 불확실하므로 Repository의 인터페이스는 도메인 계층에 속한다.

아래는 CarRepository와, 메모리와 DB 각각에서 사용될 해당 인터페이스의 축약된 구현체들이다.
```java
public interface CarRepository {
	Car findById(int id);
	List<Car> findAll();
	void save(Car car);
	void deleteById(int id);
}
```
```java
public class InMemoryCarRepository implements CarRepository {
	private Map<int, Car> cars = new HashMap<>();

	@Override
	public Car findById(int id) {
		return cars.get(id);
	}

	@Override
	public List<Car> findAll() {
		return cars.values()
			.stream()
			.collect(Collectors.toList());
	}

	//...
}
```
```java
public class DBCarRepository implements CarRepository {
	private MySQLCarDao mySQLCarDao;
	private MongoDBCarDao mongoDBCarDao;
	private JdbcTemplate jdbcTemplate;

	//constructor etc...

	@Override
	public Car findById(int id) {
		return mySQLCarDao.read(id);
	}

	@Override
	public List<Car> findAll() {
		List<Car> cars = new ArrayList<>();
		for (int id : 전체 id 컬렉션) {
			cars.add(mongoDBCarDao.read(id));
		}
		return cars;
	}

	@Override
	public save(Car car) {
		String sql = "INSERT INTO CARS(id, name, position) VALUES(?, ?, ?)";

		jdbcTemplate.update(sql, id, car.getName(), car.getPosition());
		//...
	}
	//...
}
```
(DBCarRepository처럼 영속성 계층과 통신을 하는 경우는 메서드들의 파라미터로 DTO가 오는 것이 합리적이겠으나, InMemoryCarRepository처럼 계층 내부 간의 통신인 경우가 있어서 예시에서는 Car 객체를 직접 전달받았다.)

InMemoryCarRepository는 내부의 HashMap에 Car들을 저장하여 가지고 있다. 그리고 해당 HashMap에 Car를 저장, 삭제, 검색 등을 한다. 만약 Car의 정보가 저장되는 곳이 외부 파일이라면 FileCarRepository 등의 Repository 구현체를 만들 수 있을 것이다.
이처럼 Repository는 영구저장소와 무관하게, 객체의 정보를 저장하고 읽어오는 역할에 대한 추상화가 가능하다면 사용할 수 있다.

DBCarRepository는 DAO들을 내부에서 이용하거나, jdbcTemplate을 사용해서 DB에 접근하고 있다. 설명을 위해 이와 같이 극단적인 예를 들었지만, 이처럼 어떤 방법을 사용하던 목적인 저장소에 객체의 정보를 저장하고 관리한다면 Repository의 구현체로 사용될 수 있다.

눈치를 챈 사람도 있겠지만, Repository의 인터페이스에는 DAO의 그것과 다르게 전체 Car를 검색하는 메서드가 존재하고, Update 메서드가 빠져있다.
DAO는 DB의 테이블과 밀접하게 연관되어 있고, 그러므로 레코드를 update하는 것이 어색하지 않다. 한편 CarDao가 Car 하나의 레코드가 아닌 전체 테이블의 Car 데이터를 조회하는 메서드를 가지고 있다면 어색할 것이다.
그러나 Repository는 객체의 정보를 저장한 저장소의 관리에 대한 책임을 가지고 있으므로, 전체 Car에 대한 정보를 읽어오는 것이 어색하지 않다. 반면, Repository가 update 등에 대한 메서드를 가지고 있는 것이 어색한 이유는 [StackOverFlow](https://stackoverflow.com/questions/8550124/what-is-the-difference-between-dao-and-repository-patterns)에 다음과 같이 설명되어 있다.
`A method like Update is appropriate on a DAO, but not a Repository. When using a Repository, changes to entities are usually tracked by a separate UnitOfWork.`
여기서 Unit Of Work란 ORM 프레임워크에서 많이 사용되는 Pattern 중에 하나로, 일관성 있는 데이터베이스 작업을 보장하고 데이터베이스에서 실행되는 작업의 수를 줄여서 성능을 향상시키는 데 도움이 된다고 한다. (추가 설명 필요)

이와 같이, `객체의 정보를 가진 저장소에 대한 관리`에 대한 책임을 위임 받은 인터페이스인 Repository를 사용한 Pattern을 Repository Pattern이라고 한다.

## DAO와 Repository의 공통점과 차이점
위에서 설명했다시피, DAO와 Repository 모두 데이터에 대한 접근을 추상화하고 캡슐화하여 비즈니스 로직과 데이터 접근 로직을 분리하는 데에 사용된다.

DAO는 Data Persistence의 추상화이고, Repository는 객체 Collection의 추상화이다.
DAO는 storage system에 더 가까운 개념이고 Repository는 도메인 객체에 가까운 개념이다.
Repository가 상대적으로 더 high-level의 concept이다.
그러므로 Repository는 DAO를 사용해 구현할 수 있으나, 그 반대는 구현할 수 없다.

