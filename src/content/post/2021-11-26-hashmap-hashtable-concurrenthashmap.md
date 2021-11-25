---
layout: post  
title: HashMap vs HashTable vs ConcurrentHashMap
author: [3기_다니]
tags: ['hashmap', 'hashtable', 'concurrenthashmap']
date: "2021-11-26T12:00:00.000Z"
draft: false
image: ../teaser/data-structures.jpeg
---

> 이미지 출처: [Top 35 Data Structure & Algorithms Interview Questions and Answers in 2021](https://www.simplilearn.com/data-structure-interview-questions-and-answers-article)

<br/>

각 자료구조는 필요에 따라 선택되고 활용된다.
`Map` 인터페이스의 구현체로는 `HashMap`, `HashTable`, `ConcurrentHashMap` 등이 있다.
Map 인터페이스를 구현하면, `<Key, Value>` 형태를 띈다.
그렇다면 이 셋은 무슨 특징을 가지고, 서로 어떤 차이가 있을까?
이번 글에서 해당 구현체를 비교하며 확인해보자.<br/>

<!-- end -->

<br/>

## HashMap

- key와 value에 null을 허용한다.
- 동기화를 보장하지 않는다.

HashMap은 thread-safe하지 않아, `싱글 쓰레드 환경`에서 사용하는 게 좋다.
한편, 동기화 처리를 하지 않기 때문에 데이터를 탐색하는 속도가 빠르다.
결국 HashTable과 ConcurrentHashMap보다 데이터를 찾는 속도는 빠르지만, 신뢰성과 안정성이 떨어진다.<br/>

```java
public class HashMap<K,V> extends AbstractMap<K,V> implements Map<K,V>, Cloneable, Serializable {

    ...

    public V put(K key, V value) {
        return putVal(hash(key), key, value, false, true);
    }

    final V putVal(int hash, K key, V value, boolean onlyIfAbsent, boolean evict) {
        Node<K,V>[] tab; Node<K,V> p; int n, i;
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1)
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) {
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
    }

    ...
}
```

<br/>

## HashTable

- key와 value에 null을 허용하지 않는다.
- 동기화를 보장한다.

HashTable은 thread-safe하기 때문에, `멀티 쓰레드 환경`에서 사용할 수 있다.
이는 데이터를 다루는 메소드(get(), put(), remove() 등)에 `synchronized` 키워드가 붙어 있다.
해당 키워드는 메소드를 호출하기 전에 쓰레드간 동기화 락을 건다.
그래서 멀티 쓰레드 환경에서도 데이터의 무결성을 보장한다.
그러나, 쓰레드간 동기화 락은 매우 느린 동작이라는 단점이 있다.<br/>

```java
public class Hashtable<K,V> extends Dictionary<K,V> implements Map<K,V>, Cloneable, java.io.Serializable {

    ...

    public synchronized V put(K key, V value) {
        if (value == null) {
            throw new NullPointerException();
        }
        
        Entry<?,?> tab[] = table;
        int hash = key.hashCode();
        int index = (hash & 0x7FFFFFFF) % tab.length;
        @SuppressWarnings("unchecked")
        Entry<K,V> entry = (Entry<K,V>)tab[index];
        for(; entry != null ; entry = entry.next) {
            if ((entry.hash == hash) && entry.key.equals(key)) {
                V old = entry.value;
                entry.value = value;
                return old;
            }
        }

        addEntry(hash, key, value, index);
        return null;
    }

    ...
}
```

<br/>

## ConcurrentHashMap

- key와 value에 null을 허용하지 않는다.
- 동기화를 보장한다.

ConcurrentHashMap은 thread-safe하기 때문에, `멀티 쓰레드 환경`에서 사용할 수 있다.
이 구현체는 HashMap의 동기화 문제를 보완하기 위해 나타났다.
동기화 처리를 할 때, 어떤 Entry를 조작하는 경우에 해당 Entry에 대해서만 락을 건다.
그래서 HashTable보다 데이터를 다루는 속도가 빠르다.
즉, Entry 아이템별로 락을 걸어 멀티 쓰레드 환경에서의 성능을 향상시킨다.<br/>

```java
public class ConcurrentHashMap<K,V> extends AbstractMap<K,V> implements ConcurrentMap<K,V>, Serializable {

    ...

    public V put(K key, V value) {
        return putVal(key, value, false);
    }

    final V putVal(K key, V value, boolean onlyIfAbsent) {
        if (key == null || value == null) {
            throw new NullPointerException();
        }
        int hash = spread(key.hashCode());
        int binCount = 0;
        for (Node<K,V>[] tab = table;;) {
            Node<K,V> f; int n, i, fh;
            if (tab == null || (n = tab.length) == 0)
                tab = initTable();
            else if ((f = tabAt(tab, i = (n - 1) & hash)) == null) {
                if (casTabAt(tab, i, null,
                             new Node<K,V>(hash, key, value, null)))
                    break;
            }
            else if ((fh = f.hash) == MOVED)
                tab = helpTransfer(tab, f);
            else {
                V oldVal = null;
                synchronized (f) {
                    if (tabAt(tab, i) == f) {
                        if (fh >= 0) {
                            binCount = 1;
                            for (Node<K,V> e = f;; ++binCount) {
                                K ek;
                                if (e.hash == hash &&
                                    ((ek = e.key) == key ||
                                     (ek != null && key.equals(ek)))) {
                                    oldVal = e.val;
                                    if (!onlyIfAbsent)
                                        e.val = value;
                                    break;
                                }
                                Node<K,V> pred = e;
                                if ((e = e.next) == null) {
                                    pred.next = new Node<K,V>(hash, key,
                                                              value, null);
                                    break;
                                }
                            }
                        }
                        else if (f instanceof TreeBin) {
                            Node<K,V> p;
                            binCount = 2;
                            if ((p = ((TreeBin<K,V>)f).putTreeVal(hash, key,
                                                           value)) != null) {
                                oldVal = p.val;
                                if (!onlyIfAbsent)
                                    p.val = value;
                            }
                        }
                    }
                }
                if (binCount != 0) {
                    if (binCount >= TREEIFY_THRESHOLD)
                        treeifyBin(tab, i);
                    if (oldVal != null)
                        return oldVal;
                    break;
                }
            }
        }
        addCount(1L, binCount);
        return null;
    }

    ...
}
```

<br/>

## 정리

|   |HashMap|HashTable|ConcurrentHashMap|
|:-:|:-----:|:-------:|:---------------:|
|key와 value에 null 허용|O|X|X|
|동기화 보장(Thread-safe)|X|O|O|
|추천 환경|싱글 쓰레드|멀티 쓰레드|멀티 쓰레드|

<br/>

## 결론

싱글 쓰레드 환경이면 HashMap을, 멀티 쓰레드 환경이면 HashTable이 아닌 ConcurrentHashMap을 쓰자.
그 이유는 HashTable보다 ConcurrentHashMap이 성능적으로 우수하기 때문이다.
앞에서도 언급했듯이 HashTable은 쓰레드간 락을 걸어 데이터를 다루는 속도가 느리다.
반면, ConcurrentHashMap은 Entry 아이템별로 락을 걸어 데이터를 다루는 속도가 빠르다.<br/>

<br/>

## References

- HashMap, HashTable, ConcurrentHashMap 내부 코드
- [Hashtable, HashMap, ConcurrentHashMap 비교](https://jdm.kr/blog/197)
- [[Java] HashTable, Hashmap, ConCurrentHashMap 차이](https://limkydev.tistory.com/40)
- [HashMap, Hashtable, ConcurrentHashMap 동기화 처리 방식](https://tomining.tistory.com/169)