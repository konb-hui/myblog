---
title: 设计模式系列：单例模式
date: 2021-12-31 17:11:35
tags:
categories: 
- 成神之路
- 设计模式
---

单例模式是最简单的设计模式之一，不过也是非常常用的一种创建型的设计模式。

### 一、介绍

1. 目的：保证一个类只有一个实例，防止一个全局使用的类频繁的创建和销毁。
2. 优点：
   - 在内存中只有一个实例，减少内存的开销，尤其是在频繁创建和销毁实例的时候
   - 避免资源的多重占用
3. 缺点：没有接口，不能继承，违反[单一职责原则](https://baike.baidu.com/item/%E5%8D%95%E4%B8%80%E8%81%8C%E8%B4%A3%E5%8E%9F%E5%88%99/9456515?fr=aladdin)
4. 案例：
   - 数据库连接池、线程池等各种池
   - spring的单例模式的bean的生成和使用
   - 平常代码中设置为全局的一些属性的保存

### 二、实现方式

单例模式有多种实现方式，主要有六种

#### 1、懒汉式，线程不安全

单例模式的特点就是不允许外部创建。这种方式是最简单的一种实现方式，并且也满足了懒加载，在需要使用到这个类时才进行实例化，但是没有加锁，线程不安全，在多线程的情况下会出现被多次实例化的情况。

```java
public class Singleton {  
    private static Singleton instance;  
    private Singleton (){}  
  
    public static Singleton getInstance() {  
    if (instance == null) {  
        instance = new Singleton();  
    }  
    return instance;  
    }  
}
```

#### 2、懒汉式，线程安全

相对于上一种只是加了个`synchronized`关键字，不过已经能够保证线程安全了，但是效率非常低，我们大部分情况是不需要同步的，只有在`new`的时候才需要。

```java
public class Singleton {  
    private static Singleton instance;  
    private Singleton (){}  
    public static synchronized Singleton getInstance() {  
    if (instance == null) {  
        instance = new Singleton();  
    }  
    return instance;  
    }  
}
```

#### 3、饿汉式

该方式利用`static`关键字的特性，在程序运行的时候即加载，后续直接获取，在不加锁的情况下实现了线程安全，但不属于懒加载，浪费内存

```java
public class Singleton {  
    private static Singleton instance = new Singleton();  
    private Singleton (){}  
    public static Singleton getInstance() {  
    return instance;  
    }  
}
```

#### 4、双检锁/双重校验锁（DCL，即 double-checked locking）

该方法使用了`volatile`关键字，关于该关键字的介绍请点击[这里](https://www.cnblogs.com/dolphin0520/p/3920373.html)，然后就是对方法上的锁进行了优化，减少了部分获取实例的耗时，并且满足了懒加载

```java
public class Singleton {  
    private volatile static Singleton singleton;  
    private Singleton (){}  
    public static Singleton getSingleton() {  
    if (singleton == null) {  
        synchronized (Singleton.class) {  
        if (singleton == null) {  
            singleton = new Singleton();  
        }  
        }  
    }  
    return singleton;  
    }  
}
```

#### 5、CAS「AtomicReference」(线程安全)

- java并发库提供了很多原子类来支持并发访问的数据安全性；`AtomicInteger`、`AtomicBoolean`、`AtomicLong`、`AtomicReference`。
- CAS在不加锁的情况下，能够保证一定程度的并发性，缺点也很明显，要是并发量特别大，可能某一个线程一直在死循环

```java
public class Singleton {

    private static final AtomicReference<Singleton> INSTANCE = new AtomicReference<Singleton>();

    private static Singleton instance;

    private Singleton() {
    }

    public static final Singleton getInstance() {
        for (; ; ) {
            Singleton instance = INSTANCE.get();
            if (null != instance) return instance;
            INSTANCE.compareAndSet(null, new Singleton());
            return INSTANCE.get();
        }
    }

}

```

#### 6、枚举单例

这种方式是《Effective Java》的作者推荐的，不仅能避免多线程同步问题，而且还自动支持序列化机制，防止反序列化重新创建新的对象，绝对防止多次实例化。

- 其他单例模式一旦继承`Serializable`接口（继承该接口表示可进行序列化和反序列化），就不再是单例了，每次调用`readObject()`方法都是返回一个新创建的对象
- 对于枚举类型，Java做了特殊规定，在序列化的时候仅仅是将枚举对象的`name`属性输出，反序列化时通过`java.lang.Enum`的`valueOf()`方法来根据名字查找对象
- 通过反编译可以知道`enum`的属性都是被`static`修饰的，所以能够保证线程安全

注：序列化和反序列化主要用于对象在网络中的传输

简单示例：

```java
public enum Singleton {  
    INSTANCE;  
    public void whateverMethod() {  
    }  
}
```

具体示例：

```java
public class Singleton {

    private Singleton(){}

    static enum SingletonEnum {
        INSTANCE;
        private Singleton singleton;
        private SingletonEnum() {
            singleton = new Singleton();
        }

        public Singleton getInstance() {
            return singleton;
        }
    }
}
```

