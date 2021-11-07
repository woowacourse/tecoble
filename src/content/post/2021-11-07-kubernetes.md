---
layout: post  
title: 쿠버네티스 입문하기
author: [3기_샐리]
tags: ['infra', 'kubernetes']
date: "2021-11-07T12:00:00.000Z"
draft: false
image: ../teaser/kubernetes.jpeg
---

기존에 웹 서버를 이용해 로드밸런싱, 포트포워딩, 헬스체킹, 무중단 배포 등 안정적인 인프라를 구성하고 있었다. 지금의 인프라 구조도 좋은데 쿠버네티스라는 기술을 적용함으로써 얻는 이점은 무엇일까?

이미지가 변경되면 기존 컨테이너를 새로운 컨테이너로 어떻게 변경할지, 부하가 들어오면 어떻게 부하를 분산할지, 컨테이너가 예기치 못하게 중단될 경우 어떻게 대처할지 등을 웹 서버에서 처리하려면 개발자가직접 설정을 해주고 수정해주어야 했다.

하지만 쿠버네티스는 일정한 상태를 입력해두면 내부적으로 Master node의 관리 하에 다양한 컨테이너를 구동한다. 컨테이너 단위로 서비스를 관리하니 서로 다른 컨테이너 간 영향을 끼치지 않고 os를 매번 새로 시작할 필요도 없다는 장점을 갖고 있다. 뿐만 아니라, 서버의 리소스를 내부적으로 원하는 상태로 알아서 관리하며 컨테이너 증설 시 내장 컨트롤러가 최적의 노드를 찾아 배치하고 자동으로 리소스 확장이 가능하다.

정리하자면, 쿠버네티스를 이용해 아래와 같은 기능을 누릴 수 있다.

1. 무중단 배포
2. health checking
3. Reverse proxy 감지
4. 컨테이너 scale-out
5. 여러 node에서 컨테이너를 관리하며 ip 중복 방지

이렇게 컨테이너의 배포, 관리, 확장, 네트워킹 등을 자동화하는 것을 **컨테이너 오케스트레이션**이라고 한다.



### 쿠버네티스 배포 인프라 구성

kubectl 명령어가 입력되면 아래와 같은 흐름으로 처리가 진행된다.

1. kubectl을 이용해 명령하면 api server에 전달된다.
2. 인증/권한승인/승인제어 등의 확인절차를 거친다.
3. api server가 object를 적절히 변형(mutate)한다.
4. api server가 유효성 검사(validate)한다.
5. etcd에 명령이 기록된다.
6. 응답

<img src="https://user-images.githubusercontent.com/43775108/135277150-6c626d51-d338-4125-92b2-6183c5ed5373.png">

출처: https://blog.heptio.com/core-kubernetes-jazz-improv-over-orchestration-a7903ea92ca



`kubectl api-resources` 를 입력해 쿠버네티스에서 사용할 수 있는 오브젝트들에 대해 조회할 수 있다. 그 오브젝트 설명이 보고싶다면 `kubectl explain {오브젝트명}` 을 이용한다.

쿠버네티스에서 모든 리소스는 오브젝트의 형태로 관리한다. 각 오브젝트를 원하는 상태로 유지하는데, 그 상태를 yml로 관리할 수 있다. 쿠버네티스 오브젝트에는 구성단위가 되는 기본 오브젝트와 이를 생성하고 관리하는 역할을 하는 컨트롤러가 존재한다.

이제부터 쿠버네티스의 각 요소에 대해서 알아보도록 하자.

#### 1. Master Node

모든 Workder Node들을 제어하고 전체 클러스터를 관리해주는 컨트롤러로, 전체적인 제어/관리를 하기 위한 관리 서버이다.

- Api server

  k8s(쿠버네티스)의 모든 구성 요소는 api server와 통신한다.

  etcd와 통신할 수 있는 유일한 요소이다.

- etcd

  위에서 언급한 쿠버네티스가 바라는 오브젝트(pod, service, replicaset)들을 k-v 형태로 저장한다.

  etcd 인스턴스는 과반 투표를 하는 RAFT 알고리즘을 사용하기 때문에 홀수로 구성해야 한다.

- scheduler

  pod를 어느 node에 배치할지 판단하는 역할을 수행한다.

  스케줄될 수 있는 모든 노드의 목록과 affinity의 명세를 확인하고 우선순위를 지정해준다.

  node가 요청을 이행할 수 있는지, 리소스가 부족하지 않은지, node가 PodSpec의 Node Selector에 맞는 라벨을 가질 수 있는지, port가 이미 사용되고 있는지, 볼륨이 마운트 되는지 확인한다.

#### 2. Worker Node

컨테이너가 배포될 장소로 master node로부터 파드를 관리하도록 명령받는 주체이다.

- 기본 설정을 위한 구성요소

  - kubelet

    pod 내 컨테이너 실행을 직접 관리할 뿐만 아니라 마스터와 워커 노드 간의 통신 역할도 담당하는 에이전트이다.

    node 상태, Podspec에 맞춰 Pod들이 정상적으로 동작하는지 확인하고 cAdvisor를 통해 정보를 수집한다.

  - kube-proxy

    가상 네트워크 관리

  - DNS pod

    ip가 중복인 경우 각 service endpoint를 아는 dns pod가 worker node에 존재

- 서비스를 위한 구성요소

  - Cluster

    컨테이너를 실행하기 위한 주체이다. 내부에 하나 이상의 master node, worker node가 존재해야 한다.

  - Pod

    컨테이너의 집합으로 컨테이너 실행을 담당한다. 컨테이너 어플리케이션을 배포하기 위한 기본 단위로 컨테이너의 생성, 운영, 제거 등을 관리한다.

    보통 하나의 pod에 하나의 컨테이너(온전한 어플리케이션)만 실행한다. 하지만 설정 리로더나 로그 수집 등을 위한 추가 컨테이너가 포함될 수 있고 이를 사이드카 컨테이너라고 부른다. 이렇게 만들어진 하나의 포드가 완전한 애플리케이션으로 동작하는 것이다.

  - Replicaset

    복제 담당으로 pod의 갯수가 부족할 경우 복제해서 생성하는 일을 담당한다. 정해진 수의 동일한 포드가 항상 실행되도록 관리한다. 노드 장애 등의 이유로 포드를 사용할 수 없으면 다른 노드에서 포드를 다시 생성한다.

  - Deployment

    replicaset과 pod의 정보를 정의하는 오브젝트로 replicaset의 상위 오브젝트라 deployment가 생성되면 replicaset도 함께 생성된다.

    배포 담당으로 배포되고 있는상태를 확인하고 replicaset의 변경 사항을 저장하는 revision을 남겨 롤백할 수 있다.

    rolling update, scale out이 가능하다.

  - Service

    deployment를 통해 생성된 포드에 접근하도록 도와주는 Endpoint이다. 여러 개의 포드에 쉽게 접근할 수 있도록 고유한 도메인 이름 부여하고 요청을 분산하는 로드밸런서 기능 수행한다.

    하나의 애플리케이션 묶음으로 Pod를 그룹핑하고 라벨로 분류해준다. Pod가 새로 생성되더라도 service를 통해 동일 도메인으로 접근할 수 있다.

    상황에 따라 맞는 type을 지정해 사용한다.

    - ClusterIP

      쿠버네티스 내부에서만 포드들에 접근할 때 사용하는 type

    - NodePort

      포드에 접근할 수 있는 포트를 클러스터의 모든 노드에 동일하게 개방해, 외부에서 포드에 접근 가능하도록 하는 type

    - LoadBalancer

      플랫폼에서 제공하는 로드 밸런서를 동적으로 프로비저닝해 포드에 연결하고 외부에서 접근 가능하도록 하는 type

  - Ingress

    Service의 NodePort + LoadBalancer를 합쳐논 요소이다. 외부에서 들어온 요청을 어떠한 서비스로 라우팅해주고, 같은 ip에 대해 다른 도메인 이름으로 요청이 들어왔을 때 가상 호스트 기반의 요청 처리, SSL/TLS 보안 연결 처리의 역할을 수행한다.

    외부의 요청을 대신 응답해주는 Reverse Proxy의 역할을 담당한다. Ingress를 이용해 각 Deployment에 대해 일일히 설정을 적용할 필요 없이 외부 요청에 대한 처리를 편리하게 관리할 수 있다.

#### Network

Pod 내 컨테이너들은 하나의 veth0을 공유하며 외부에서 같은 ip로 접근해 port로 컨테이너 구분된다.

1. 컨테이너를 생성하면 veth 생성되고 컨테이너 내 eth0과 연결한다.
2. veth들은 docke0을 통해 컨테이너들간 통신 가능하다.
3. 컨테이너는 gateway인 docker0을 거쳐 외부와 통신한다.

<img src="https://user-images.githubusercontent.com/43775108/135275554-2b95e0db-415b-4163-9ae3-258215073902.png">

출처: https://medium.com/google-cloud/understanding-kubernetes-networking-pods-7117dd28727



이렇게 쿠버네티스의 구성 요소에 대해서 간략히 알아보았다.

쿠버네티스를 적용하면 편리한 면도 있지만, 프로젝트에 서비스 간 통신이 필요한지, 비용적인 여유가 되는지 등 다양한 고려가 필요하다.

상황에 알맞게 적용할 수 있어야 한다.



#### 출처

- [공식문서](https://kubernetes.io/)
- [Core Kubernetes](https://blog.heptio.com/core-kubernetes-jazz-improv-over-orchestration-a7903ea92ca)
- [Understanding kubernetes networking](https://medium.com/google-cloud/understanding-kubernetes-networking-pods-7117dd28727)
