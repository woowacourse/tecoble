---
layout: post  
title: 'Spring Data Elasticsearch 설정 및 검색 기능 구현'
author: [3기_케빈]
tags: ['database', 'elasticsearch', 'spring']
date: "2021-10-19T12:00:00.000Z"
draft: false
image: ../teaser/elasticsearch-logo.png
---

> [실습 Repository](https://github.com/xlffm3/spring-data-elasticsearch-practice)에서 코드를 확인할 수 있습니다.

## 1. Elasticsearch

Elasticsearch는 Apache Lucene 기반의 Java 오픈소스 분산형 RESTful 검색 및 분석 엔진입니다. 방대한 양의 데이터에 대해 실시간으로 저장과 검색 및 분석 등의 작업을 수행할 수 있습니다. 특히 정형 데이터, 비정형 데이터, 지리 데이터 등 모든 타입의 데이터를 처리할 수 있는데요. Elasticsearch는 **JSON 문서(Document)로 데이터를 저장하기 때문입니다.**

Elasticsearch는 단독 검색을 위해 사용하거나, **ELK(Elasticsearch & Logstash & Kibana) 스택**을 기반으로 사용합니다.

### 1.1. ELK

![image](https://user-images.githubusercontent.com/56240505/134549954-b93fedde-f86c-4a31-bae8-9fd02ae7d35f.png)

본 글의 주제와는 벗어나지만 ELK에 대해서도 짧게나마 알아봅시다. ELK는 Elasticsearch + Logstash + Kibana를 같이 연동하여 사용한다는 의미입니다.

* Filebeat
  * 로그를 생성하는 서버에 설치해 로그를 수집합니다.
  * Logstash 서버로 로그를 전송합니다.
* Logstash
  * 로그 및 트랜잭션 데이터를 수집과 집계 및 파싱하여 Elasticsearch로 전달합니다.
  * 정제 및 전처리를 담당합니다.
* Elasticsearch
  * Logstash로부터 전달받은 데이터를 저장하고, 검색 및 집계 등의 기능을 제공합니다.
* Kibana
  * 저장된 로그를 Elasticsearch의 빠른 검색을 통해 가져오며, 이를 시각화 및 모니터링하는 기능을 제공합니다.

### 1.2. RDB 비교

![image](https://user-images.githubusercontent.com/56240505/134550384-69294c02-20c5-4627-a832-ab0713c55e0b.png)
![image](https://user-images.githubusercontent.com/56240505/134551520-b15876b6-9216-433c-a336-81a293dd828c.png)

Elasticsearch는 데이터를 행렬 데이터로 저장하는 것이 아니라, **JSON 문서(Document)**로 직렬화된 복잡한 자료 구조를 저장하는 방식을 채택하고 있습니다. 따라서 기존 RDB에서 사용하던 용어를 그대로 사용하지 않습니다. 단, 그에 대응하는 적합한 용어들이 존재하니 이 글을 읽는데 어려움 없으시길 바라겠습니다. 😅

### 1.3. Inverted Index

![image](https://user-images.githubusercontent.com/56240505/134555327-82533784-030d-425b-8683-ee33a728b5fd.png)
![image](https://user-images.githubusercontent.com/56240505/134555053-daa5f704-5f52-47dc-aa07-0de3bea33e78.png)

> Elasticsearch는 특정 문장을 입력받으면, 파싱을 통해 문장을 단어 단위로 분리하여 저장합니다. 또한 대문자를 소문자로 치환하거나 유사어 체크 등의 추가 작업을 통해 텍스트를 저장합니다.

Elasticsearch는 **역 색인**이라고 하는 자료 구조를 사용하는데, 이는 전문 검색에 있어서 빠른 성능을 보장합니다. 책의 전반부에 위치한 일반적인 목차가 Index라면, 책 후반부에 키워드마다 내용을 찾아볼 수 있도록 돕는 목차가 Reverted Index입니다.

역 색인은 각 Document에 등장하는 모든 고유한 단어들을 리스트업하고, 해당 단어들이 등장하는 Document들을 식별합니다. 색인은 최적화된 Document 컬렉션이며, 각 Document는 **데이터를 포함하고 있는 Key-Value 쌍으로 이루어진 Field**의 컬렉션입니다.

Elasticsearch는 모든 Field의 데이터를 인덱싱하는데, 인덱싱된 Field는 각각의 최적화된 자료구조를 사용합니다. 텍스트 형식의 Field는 Inverted Index에 저장되며, 숫자 혹은 지리 관련 Field는 BKD 트리에 저장됩니다.

![image](https://user-images.githubusercontent.com/56240505/135963544-3a9c0ae0-89e8-464f-a4c2-ce3a9095003e.png)
![image](https://user-images.githubusercontent.com/56240505/135963557-e18dac48-aac9-4c43-b4c5-7ce1fd3d4d68.png)

RDB는 데이터 수정·삭제의 편의성과 속도 면에서 강점이 있지만 다양한 조건의 데이터를 검색하고 집계하는 데에는 구조적인 한계가 존재합니다. 특정 단어 검색시 ROW 개수만큼 확인을 반복하기 때문입니다. 반면 단어 기반으로 데이터를 저장하는 Elasticsearch는 특정 단어가 어디에 저장되어 있는지 이미 알고 있어 모든 Document를 검색할 필요가 없습니다.

반면 수정과 삭제는 내부적으로 굉장히 많은 리소스가 소요되는 작업이라, RDBMS를 대체하기 어렵습니다.

### 1.4. Architecture

![image](https://user-images.githubusercontent.com/56240505/134556753-5133f373-7814-4c4f-8505-6dfbe9f47ed9.png)

> 하나의 클러스터 내 복수 개의 노드를 사용하는 경우, 저장된 Document는 클러스터 전역으로 분배되기 때문에 어느 노드에서든 즉시 접근이 가능합니다.

* Cluster
  * 최소 하나 이상의 노드로 이루어진 노드들의 집합을 의미합니다.
  * 서로 다른 클러스터는 데이터의 접근 및 교환을 할 수 없는 독립적인 시스템으로 유지됩니다.
  * 여러 대의 서버가 하나의 클러스터를 구성하거나, 하나의 서버에 여러 개의 클러스터가 존재할 수 있습니다.
* Node
  * Elasticsearch를 구성하는 하나의 단위 프로세스를 의미합니다.
* Shard
  * 데이터를 분산해서 저장하는 방법을 의미합니다.
  * Scale-Out을 위해 RDB의 Database에 해당하는 Index를 여러 Shard로 쪼갭니다.
  * 기본적으로 1개가 존재하며, 검색 성능 향상을 위해 클러스터의 Shard 개수를 조정할 수 있습니다.
* Replica
  * 또 다른 형태의 Shard를 의미합니다.
  * 노드를 손실했을 경우, 데이터의 신뢰성을 위해 Shard를 복제하는 것입니다.
  * 따라서 Replica는 서로 다른 노드에 위치시킬 것을 권장하고 있습니다.

추가적으로, Node는 [다양한 역할](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-node.html)로 분류할 수 있습니다.

* 대규모 클러스터에서 로드 밸런싱 역할을 하는 노드.
* 데이터 변환 등 사전 처리 파이프라인 노드.
* 색인된 데이터 CRUD 노드.
* 메타 데이터 등 전체 클러스터를 제어하는 마스터 노드.
  * 인덱스 생성과 삭제.
  * 데이터 입력시 샤딩 할당.

단일 노드로 Elasticsearch를 구동할 수 있지만, 트래픽이 많아진다면 노드별로 서버를 분리하거나 작업 노드에 대해 Scale-Out 및 로드 밸런싱을 함으로써 성능을 향상시킬 수 있습니다.

### 1.5. 특징

1. Scale out : Shard를 통해 규모가 수평적으로 늘어날 수 있습니다.
2. 고가용성 : Replica를 통해 데이터의 안정성을 보장하고, 단일 장애점을 극복합니다.
3. Schema Free : Json 문서를 통해 데이터를 검색하므로, 스키마의 개념이 없습니다.
4. RESTful : CRUD 작업은 RESTful API를 통해 수행되며, 각각이 HTTP의 PUT / GET / POST / DELETE 메서드에 대응됩니다.

<br>

## 2. Spring Data Elasticsearch

Spring Data Elasticsearch 프로젝트는 Elasticsearch 검색 엔진을 사용하는 솔루션 개발을 도와주는 모듈입니다. 다음 작업에 대해 높은 수준의 추상화를 템플릿으로 제공하고 있습니다.

* Document의 저장과 검색 및 정렬.
* Document를 Aggregate로 재구성.

Spring Data JPA가 Repository 인터페이스에 정의한 메서드 이름을 분석해서 JPQL을 자동으로 생성 및 실행해주는 것처럼, Spring Data Elasticsearch 또한 Repository 인터페이스에 메서드를 정의함으로써 쿼리를 표현할 수 있습니다.

<br>

## 3. Docker를 활용한 Elasticsearch 설치

> Shell

```bash
$ docker pull docker.elastic.co/elasticsearch/elasticsearch:7.10.0
$ docker run -d -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:7.10.0
```

다양한 설치 방법이 있지만 그 중 가장 간편한 Docker를 사용했습니다. 해당 예제는 단일 노드로 클러스터를 구성하는데, 클러스터를 멀티 노드로 구성하고 싶다면 [docker-compose를 활용하시면 됩니다.](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html#docker-compose-file)
9200 포트는 HTTP 클라이언트와 통신에 사용되며, 9300 포트는 노드들간 통신할 때 사용됩니다.

* 최신 공식 문서 기준 Spring Data Elasticsearch 4.2.x 버전이 Elasticsearch 7.10.0. 버전과 호환되기 때문에 7.10.0 버전으로 이미지를 받습니다.
* 다른 버전을 사용하고 싶다면 [Srping Data Elasticsearch 프로젝트 버전 및 Elasticsearch 버전 호환 유무](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html/#new-features)를 꼭 확인하도록 합시다.

<br>

## 4. Spring Boot 설정

> build.gradle

```groovy
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-data-JPA'
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.data:spring-data-elasticsearch:4.2.2'
    compileOnly 'org.projectlombok:lombok'
    runtimeOnly 'com.h2database:h2'
    annotationProcessor 'org.projectlombok:lombok'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}
```

현재 사용 중인 Elasticsearch 버전과 호환되게 Spring Data Elasticsearch 4.2.x 버전으로 의존성을 받습니다.

### 4.1. Elasticsearch Clients 설정

> ElasticsearchOperations.java

```java
public interface ElasticsearchOperations extends DocumentOperations, SearchOperations {
    //...
}
```

Elasticsearch 관련 작업을 수행할 때 주로 ElasticsearchOperations 인터페이스의 구현체를 사용합니다. 해당 인터페이스는 DocumentOperations 및 SearchOperations 인터페이스를 확장하고 있습니다.

> AbstractElasticsearchConfiguration.java

```java
public abstract class AbstractElasticsearchConfiguration extends ElasticsearchConfigurationSupport {

	@Bean
	public abstract RestHighLevelClient elasticsearchClient();

	@Bean(name = { "elasticsearchOperations", "elasticsearchTemplate" })
	public ElasticsearchOperations elasticsearchOperations(ElasticsearchConverter elasticsearchConverter,
			RestHighLevelClient elasticsearchClient) {

		ElasticsearchRestTemplate template = new ElasticsearchRestTemplate(elasticsearchClient, elasticsearchConverter);
		template.setRefreshPolicy(refreshPolicy());

		return template;
	}
}
```

AbstractElasticsearchConfiguration 클래스가 ElasticsearchOperations을 Bean으로 등록하고 있습니다. 구현체는 ElasticsearchRestTemplate이네요. 해당 부분을 개발자가 커스텀하게 Bean 등록을 해주면 됩니다.

> ElasticSearchConfig.java

```java
@Configuration
public class ElasticSearchConfig extends AbstractElasticsearchConfiguration {

    @Override
    public RestHighLevelClient elasticsearchClient() {
        ClientConfiguration clientConfiguration = ClientConfiguration.builder()
            .connectedTo("localhost:9200")
            .build();
        return RestClients.create(clientConfiguration).rest();
    }
}
```

Spring Data Elasticsearch는 ElasticsearchClient를 통해 Elasticsearch 노드 혹은 클러스터와 연결됩니다. **ElasticsearchClient를 직접 사용할 수 있지만, 대게 더 추상화된 ElasticsearchOperations 혹은 ElasticsearchRepository를 사용합니다.**

ElasticsearchClient 구현체는 리액티브 지원 여부 등에 따라 종류가 다양한데, RestHighLevelClient가 일반적입니다. ElasticsearchOperations 구현체가 사용하는 RestHighLevelClient만 Bean으로 등록해주면 설정이 완료되었습니다.

### 4.2. Logging

> application.properties

```properties
logging.level.org.springframework.data.elasticsearch.client.WIRE=TRACE
```

Spring Data Elasticsearch가 제대로 동작하는지 확인하고 싶다면, 위 로거를 등록합니다.

<br>

## 5. 예제 코드

> User.java

```java
@Document(indexName = "users")
@Entity
public class User {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    private BasicProfile basicProfile;

    protected User() {
    }

    public User(String name) {
        this(name, null);
    }

    public User(String name, String description) {
        this(null, new BasicProfile(name, description));
    }

    @PersistenceConstructor
    public User(Long id, BasicProfile basicProfile) {
        this.id = id;
        this.basicProfile = basicProfile;
    }

    // getter 생략
}
```

> BasicProfile.java

```java
@Embeddable
public class BasicProfile {

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    protected BasicProfile() {
    }

    public BasicProfile(String name, String description) {
        this.name = name;
        this.description = description;
    }

    // getter 생략
}
```

과거의 Spring Data Elasticsearch는 Jackson 기반으로 데이터를 직렬화해 JSON으로 맵핑했는데, 현재는 Meta Object Mapping 방식을 사용합니다. JPA에서 @Entity 애너테이션을 통해 특정 클래스가 RDB에 저장될 테이블임을 명시한 것 처럼, @Document 애너테이션으로 해당 클래스가 ES DB에 맵핑될 클래스임을 표기합니다.

또한 @PersistenceConstructor가 부착된 생성자통해 ES DB에 저장된 Document가 Aggregate로 재구성됩니다. 그 외 기타 애너테이션 및 설정들은 공식 문서를 확인하길 바랍니다.

> ElasticsearchRepository.java

```java
@NoRepositoryBean
public interface ElasticsearchRepository<T, ID> extends PagingAndSortingRepository<T, ID> {

	Page<T> searchSimilar(T entity, @Nullable String[] fields, Pageable pageable);
}
```

Spring Data JPA에서 사용자 정의 Repository 인터페이스를 정의할 때 JpaRepository 인터페이스를 확장한 것처럼, ElasticsearchRepository 인터페이스를 확장해 정의하면 됩니다.

> UserRepository.java

```java
public interface UserSearchRepository extends ElasticsearchRepository<User, Long>, CustomUserSearchRepository {

    List<User> findByBasicProfile_NameContains(String name);
}
```

Spring Data JPA처럼 메서드 이름을 기반으로 CRUD 명령 쿼리를 생성할 수 있습니다.

> ElasticSearchConfig.java

```java
@EnableElasticsearchRepositories
@Configuration
public class ElasticSearchConfig extends AbstractElasticsearchConfiguration {
    // ...
}
```

@EnableElasticsearchRepositories 애너테이션을 부착해줍니다.

> CustomUserSearchRepositoryImpl.java

```java
@RequiredArgsConstructor
@Component
public class CustomUserSearchRepositoryImpl implements CustomUserSearchRepository {

    private final ElasticsearchOperations elasticsearchOperations;

    @Override
    public List<User> searchByName(String name, Pageable pageable) {
        Criteria criteria = Criteria.where("basicProfile.name").contains(name);
        Query query = new CriteriaQuery(criteria).setPageable(pageable);
        SearchHits<User> search = elasticsearchOperations.search(query, User.class);
        return search.stream()
            .map(SearchHit::getContent)
            .collect(Collectors.toList());
    }
}
```

복잡한 쿼리를 직접 다뤄야 한다면 ElasticsearchOperations Bean을 주입받아 커스텀하게 쿼리를 작성할 수 있습니다.

> UserController.java

```java
@RequiredArgsConstructor
@RequestMapping("/api")
@RestController
public class UserController {

    private final UserService userService;

    @PostMapping("/users")
    public ResponseEntity<Void> save(@RequestBody UserRequest userRequest) {
        UserRequestDto userRequestDto = new UserRequestDto(
            userRequest.getName(),
            userRequest.getDescription()
        );
        Long id = userService.save(userRequestDto);
        URI uri = URI.create(String.valueOf(id));
        return ResponseEntity.created(uri)
            .build();
    }

    @GetMapping("/users/{name}")
    public ResponseEntity<List<UserResponse>> search(@PathVariable String name, Pageable pageable) {
        List<UserResponse> userResponses = userService.searchByName(name, pageable)
            .stream()
            .map(UserResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(userResponses);
    }
}
```

> UserService.java

```java
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserSearchRepository userSearchRepository;

    @Transactional
    public Long save(UserRequestDto userRequestDto) {
        User user = new User(userRequestDto.getName(), userRequestDto.getDescription());
        User savedUser = userRepository.save(user);
        userSearchRepository.save(user);
        return savedUser.getId();
    }

    public List<UserResponseDto> searchByName(String name, Pageable pageable) {
        // userSearchRepository.findByBasicProfile_NameContains(name) 가능
        return userSearchRepository.searchByName(name, pageable)
            .stream()
            .map(UserResponseDto::from)
            .collect(Collectors.toList());
    }
}
```

간단한 User 저장 및 검색 예제 코드를 작성했습니다. 자세한 코드는 글 상단에 위치한 [실습 Repository](https://github.com/xlffm3/spring-data-elasticsearch-practice) 링크에서 확인 가능합니다.

### 5.1. 트러블 슈팅

> Log

```
The bean 'userRepository', defined in com.example.elasticsearch.user.domain.UserRepository defined in @EnableJpaRepositories declared on JpaRepositoriesRegistrar.EnableJpaRepositoriesConfiguration, could not be registered.
A bean with that name has already been defined in com.example.elasticsearch.user.domain.UserRepository defined in @EnableElasticsearchRepositories declared on ElasticsearchRepositoriesRegistrar.EnableElasticsearchRepositoriesConfiguration and overriding is disabled.

Action:

Consider renaming one of the beans or enabling overriding by setting spring.main.allow-bean-definition-overriding=true
```

Spring Data Elasticsearch 단일 모듈을 사용할 때는 문제가 없는데, 예제 코드처럼 Spring Data JPA와 함께 사용하는 경우 ApplicationContext 로드에 실패합니다.

User 클래스를 위해 생성한 JPA용 Repository와 Elasticsearch용 Repository 인터페이스 모두 ``PagingAndSortingRepository<T, ID>``를 확장하고 있습니다. 그 결과 @EnableAutoConfiguration을 기반으로 Bean을 주입하는 과정에서 Bean 중복 문제가 발생합니다.

> application.properties

```properties
spring.main.allow-bean-definition-overriding=true
```

Bean을 오버라이딩할 수 있도록 상기 옵션을 추가해줍니다. 그럼에도 불구하고 다시 실행해보면 에러가 발생하는데요.

> Trouble Annotations

```java
@EnableJpaRepositories
@EnableElasticsearchRepositories
```

@EnableJpaRepositories 및 @EnableElasticsearchRepositories 등 두 애너테이션은 기본적으로 Repository 관련 클래스를 **모두** 스캐닝하려고 시도합니다.

> Log

```
UnsupportedFragmentException: Repository com.example.elasticsearch.user.domain.UserRepository implements org.springframework.data.repository.query.QueryByExampleExecutor but ElasticsearchRepositoryFactory does not support Query by Example!
```

@EnableElasticsearchRepositories 애너테이션이 JpaRepository 인터페이스를 확장한 JPA 관련 클래스를 스캐닝하면 위와 같은 에러가 발생합니다.

> Log

```
Caused by: org.springframework.data.mapping.PropertyReferenceException: No property searchSimilar found for type User!

혹은

Caused by: org.springframework.data.mapping.PropertyReferenceException: No property index found for type User!
```

반대로 @EnableJpaRepositories 애너테이션이 ElasticsearchRepository 인터페이스를 확장한 Elasticsearch 관련 클래스를 스캐닝하면 위와 같은 에러가 발생합니다.

> ElasticSearchConfig.java

```java
@EnableElasticsearchRepositories(basePackageClasses = UserSearchRepository.class)
@Configuration
public class ElasticSearchConfig extends AbstractElasticsearchConfiguration {

    //...
}
```

> ElasticsearchApplication.java

```java
@EnableJpaRepositories(excludeFilters = @ComponentScan.Filter(
    type = FilterType.ASSIGNABLE_TYPE,
    classes = UserSearchRepository.class))
@SpringBootApplication
public class ElasticsearchApplication {

    public static void main(String[] args) {
        SpringApplication.run(ElasticsearchApplication.class, args);
    }

}
```

따라서 @EnableElasticsearchRepositories 애너테이션은 Elasticsearch 관련 Repository 클래스만 스캐닝하도록 합니다. 반대로 @EnableJpaRepositories 애너테이션은 JPA 관련 Repository 클래스만 스캐닝하도록 합니다.

@EnableXXX 관련 애너테이션을 잘 설정했다면 필요없는 ``spring.main.allow-bean-definition-overriding=true`` 옵션은 제거하셔도 됩니다.

### 5.2. 동작 확인

어플리케이션을 실행해보고 Elasticsearch 서버로의 데이터 쓰기 및 조회가 원활하게 동작하는지 확인해봅시다.

RDB는 SQL 쿼리를 통해 CRUD 작업을 수행한다면, Elasticsearch는 [RESTful API](https://www.elastic.co/guide/en/elasticsearch/reference/current//docs.html) 쿼리를 통해 CRUD 작업을 수행합니다. Spring Data JPA가 자동으로 SQL 쿼리를 생성해 DB 서버로 요청을 보내는 것처럼, Spring Data Elasticsearch 또한 RESTful API 쿼리를 생성해 ES DB 서버로 요청을 보냅니다.

![image](https://user-images.githubusercontent.com/56240505/137831507-5fd54393-e2ca-4ece-99cd-ef0c120ec350.png)

``jinhong``이라는 문자열이 포함된 모든 User 검색에 성공했습니다.

![image](https://user-images.githubusercontent.com/56240505/137831649-b38a0587-b114-4575-b26b-0ac2351e69f9.png)

RESTful한 GET 요청을 통해 ES DB에 저장된 Document를 조회한 모습입니다.

![image](https://user-images.githubusercontent.com/56240505/137831732-2ffed90b-9ea6-45ba-ba2e-f8502350975f.png)

``COUNT(*)`` SQL 쿼리처럼 몇 명의 유저가 저장되어있는지 카운팅할 수 있습니다.

> Query

```json
POST /users/_delete_by_query

{
  "query": {
    "range": {
      "id": {
        "gte" : 1
      }
    }
  }
}
```

User ID가 1보다 크거나 같은 경우 삭제하겠다는 쿼리를 요청 본문에 담아 삭제를 진행할 수 있습니다. SQL 쿼리가 다양한 것처럼 Elasticsearch 또한 다양한 RESTful API 쿼리가 존재하니, 자세한 내용은 공식 문서를 참고해주세요.

<br>

## 6. Trade-Off

행 기반으로 데이터를 저장하는 RDB에서 특정 키워드가 포함된 데이터를 조회할 때 LIKE 쿼리를 주로 사용합니다. 문제는 ``LIKE '%jinhong%'``과 같이 ``jinhong`` 키워드가 들어간 데이터를 조회할 때, ``%`` 기호를 앞에 사용하는 경우 조회 성능 향상을 위한 인덱스 사용이 불가능합니다.

![image](https://user-images.githubusercontent.com/56240505/137668936-6fd70a7a-702a-4ec8-8a07-e1b245357824.png)

2대의 조회 Slave DB(Replication)를 사용하는 웹 어플리케이션에서 특정 이름 키워드가 포함된 유저 정보를 조회하는 부하 테스트를 진행한 결과입니다. 평균 TPS가 38.9입니다.

![image](https://user-images.githubusercontent.com/56240505/137674715-51fcf017-29dd-4f60-bf16-3004f37e1079.png)

**키워드 검색 요청** 상황에서 RDB를 ES 검색 엔진으로 대체하면 성능 이점을 얻을 수 있습니다. ES를 도입한 다음 부하 테스트를 동일 환경에서 진행했습니다. ES의 경우 단 1대의 서버만으로도 평균 TPS가 82.2를 기록했습니다! 이는 2대의 서버를 사용하는 기존의 RDB 방식보다 성능이 2배 이상을 상회합니다.

물론 Elasticsearch라는 별도의 DB를 사용함으로써 고려해야할 관리 포인트가 많아진다는 단점이 존재합니다.

* 기존 RDB에 저장된 데이터를 ES로 이관해야 합니다.
* 업데이트 발생시 RDB와의 데이터 정합성을 제대로 유지해야합니다.
* ES는 루씬 쓰기 성능이 나쁜 만큼, 업데이트 방식에 대한 추가적인 의사결정이 필요합니다.
  * RDB - ES 간의 데이터 싱크를 실시간으로 맞출 것인지, 혹은 배치 방식을 사용할 것인지 등.
  * 실시간으로 데이터 싱크를 맞추면 ES 서버 트래픽이 증가하고 쓰기 작업을 수행하느라 많은 리소스를 사용하게 됩니다.
  * Bulk API 기반의 배치 방식으로 데이터 싱크를 맞추면 Document의 반복 업데이트를 줄일 수 있으나, 데이터 싱크에 지연이 발생합니다.
* 고가용성을 위한 단일 장애점 극복을 위해 ES 클러스터링 및 샤딩 등 아키텍쳐에 대한 고려가 필요합니다.

<br>

---

## References

* [Elasticsearch Guide Docs](https://www.elastic.co/guide/en/elasticsearch/reference/7.15/index.html)
* [Spring Data Elasticsearch - Reference Documentation](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html/#preface)
* [ELK Stack을 이용한 로그 관제 시스템 만들기](https://steemit.com/elk/@modolee/elk-stack)
* [🙈[Elasticsearch] 기본 개념잡기🐵](https://victorydntmd.tistory.com/308)
* [No property index found for type User](https://stackoverflow.com/questions/36252099/no-property-index-found-for-type-user)
* [엘라스틱서치(Elasticsearch)에서 관계형 데이터 모델링하기](https://www.samsungsds.com/kr/insights/elastic_data_modeling.html)
