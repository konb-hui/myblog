---
title: SpringBoot启动流程的超详细解析（下）
date: 2022-04-12 10:33:52
toc: true
tags:
- spring
- springboot
categories: 
- 成神之路
- 源码分析
---

继续接着上篇文章讲SpringBoot的启动流程，这篇是真正开始分析启动的完整过程。

```java
@SpringBootApplication
public class WjApplication {
    public static void main(String[] args) {
        SpringApplication.run(WjApplication.class, args);
    }
}
```



## 一、创建`SpringApplication`对象

首先进入`SpringApplication.run`方法，最终发现是执行如下代码，`new`了一个`SpringApplication`对象，并且执行它的`run`方法。

```java
public static ConfigurableApplicationContext run(Class<?>[] primarySources, String[] args) {
    return (new SpringApplication(primarySources)).run(args);
}
```

再看下`SpringApplication`的构造函数，发现主要是对成员变量做了些初始化的操作，后面会进一步介绍它们的作用。

```java
	public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
        //资源加载器，默认为null
		this.resourceLoader = resourceLoader;
		Assert.notNull(primarySources, "PrimarySources must not be null");
		this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
        //Web应用程序类型，通过判断是否存在某些类来确定类型
		this.webApplicationType = WebApplicationType.deduceFromClasspath();
		this.bootstrappers = new ArrayList<>(getSpringFactoriesInstances(Bootstrapper.class));
		setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
		setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
		this.mainApplicationClass = deduceMainApplicationClass();
	}
```



## 二、执行run方法

进入实例化`SpringApplication`对象的`run`方法，如下代码

```java
	public ConfigurableApplicationContext run(String... args) {
        //秒表，计时的，SpringBoot启动完成后能看到一个时间，就是这个
		StopWatch stopWatch = new StopWatch();
		stopWatch.start();
        //加载上下文
		DefaultBootstrapContext bootstrapContext = createBootstrapContext();
		ConfigurableApplicationContext context = null;
        //设置java.awt.headless 模式，是一种配置模式，在系统缺少了显示设备、键盘或鼠标时可以使用该模式。
		configureHeadlessProperty();
        //获取程序运行监听器，并且执行
		SpringApplicationRunListeners listeners = getRunListeners(args);
		listeners.starting(bootstrapContext, this.mainApplicationClass);
		try {
            //将main函数的参数封装到ApplicationArguments，为后面的prepareEnvironment提供参数
			ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
            //准备environment
			ConfigurableEnvironment environment = prepareEnvironment(listeners, bootstrapContext, applicationArguments);
			configureIgnoreBeanInfo(environment);
			Banner printedBanner = printBanner(environment);
			context = createApplicationContext();
			context.setApplicationStartup(this.applicationStartup);
			prepareContext(bootstrapContext, context, environment, listeners, applicationArguments, printedBanner);
			refreshContext(context);
			afterRefresh(context, applicationArguments);
			stopWatch.stop();
			if (this.logStartupInfo) {
				new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), stopWatch);
			}
			listeners.started(context);
			callRunners(context, applicationArguments);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, listeners);
			throw new IllegalStateException(ex);
		}

		try {
			listeners.running(context);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, null);
			throw new IllegalStateException(ex);
		}
		return context;
	}
```



### 1.初始化上下文

```java
    //初始化上下文
	//启动上下文
    DefaultBootstrapContext bootstrapContext = this.createBootstrapContext();
	//配置上下文
    ConfigurableApplicationContext context = null;
```

`DefaultBootstrapContext`继承了`BootstrapRegistry`和`BootstrapContext`分别用于注册和提供注册过的需要在应用上下文加载完成前使用的类的实例。看下启动上下文`bootstrapContext`的创建方法`createBootstrapContext`源码。

注：实际`DefaultBootstrapContext`是实现了`ConfigurableBootstrapContext`，而`ConfigurableBootstrapContext`继承了`BootstrapRegistry`和`BootstrapContext`

```java
private DefaultBootstrapContext createBootstrapContext() {
    //new一个DefaultBootstrapContext对象
    DefaultBootstrapContext bootstrapContext = new DefaultBootstrapContext();
    //遍历bootstrappers并执行intitialize方法
    this.bootstrappers.forEach((initializer) -> {
        initializer.intitialize(bootstrapContext);
    });
    //返回DefaultBootstrapContext对象
    return bootstrapContext;
}
```

我们看下最开始`SpringApplication`的构造函数可以发现`bootstrappers`是通过`this.getSpringFactoriesInstances(Bootstrapper.class)`来获取的，我们看下源码。

```java
private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
    //获取类加载器
    ClassLoader classLoader = this.getClassLoader();
    //获取META-INF/spring.factories文件中Bootstrapper类型的类的全限定名
    Set<String> names = new LinkedHashSet(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
    //通过上步获取的全限定名生成实例
    List<T> instances = this.createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
    //排序
    AnnotationAwareOrderComparator.sort(instances);
    return instances;
}
```

#### （1）获取类加载器

判断`resourceLoader`资源加载器是否为null，不是则用它的类加载器，否则是默认的加载器，从`SpringApplication`的构造函数可以发现当前的资源加载器是null，所以是使用默认的类加载器。

```java
public ClassLoader getClassLoader() {
    return this.resourceLoader != null ? this.resourceLoader.getClassLoader() : ClassUtils.getDefaultClassLoader();
}
```

```java
public SpringApplication(Class<?>... primarySources) {
    this((ResourceLoader)null, primarySources);
}
```

#### （2）加载全限定名

可以看下`loadFactoryNames`的源码`loadFactoryNames`调用了`loadSpringFactories`方法，我们可以看到这个方法就是去获取`META-INF/spring.factories`中的类名，前面也说过这个文件也是SpringBoot自动加载的核心。

```java
/**
 * The location to look for factories.
 * <p>Can be present in multiple JAR files.
 */
public static final String FACTORIES_RESOURCE_LOCATION = "META-INF/spring.factories";
```

```java

public static List<String> loadFactoryNames(Class<?> factoryType, @Nullable ClassLoader classLoader) {
   ClassLoader classLoaderToUse = classLoader;
   if (classLoaderToUse == null) {
      classLoaderToUse = SpringFactoriesLoader.class.getClassLoader();
   }
   String factoryTypeName = factoryType.getName();
   return loadSpringFactories(classLoaderToUse).getOrDefault(factoryTypeName, Collections.emptyList());
}

private static Map<String, List<String>> loadSpringFactories(ClassLoader classLoader) {
...
   try {
       //获取META-INF/spring.factories中的类名
      Enumeration<URL> urls = classLoader.getResources(FACTORIES_RESOURCE_LOCATION);
      while (urls.hasMoreElements()) {
         URL url = urls.nextElement();
         UrlResource resource = new UrlResource(url);
         Properties properties = PropertiesLoaderUtils.loadProperties(resource);
         for (Map.Entry<?, ?> entry : properties.entrySet()) {
            String factoryTypeName = ((String) entry.getKey()).trim();
            String[] factoryImplementationNames =
                  StringUtils.commaDelimitedListToStringArray((String) entry.getValue());
            for (String factoryImplementationName : factoryImplementationNames) {
               result.computeIfAbsent(factoryTypeName, key -> new ArrayList<>())
                     .add(factoryImplementationName.trim());
            }
         }
      }

...
}
```

#### （3）创建实例

看下`createSpringFactoriesInstances`源码。很简单，就是通过反射的方式获取实例。

```java
private <T> List<T> createSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes,
      ClassLoader classLoader, Object[] args, Set<String> names) {
   List<T> instances = new ArrayList<>(names.size());
   for (String name : names) {
      try {
         Class<?> instanceClass = ClassUtils.forName(name, classLoader);
         Assert.isAssignable(type, instanceClass);
          //通过反射获取构造方法
         Constructor<?> constructor = instanceClass.getDeclaredConstructor(parameterTypes);
          //通过获取的构造方法创建实例
         T instance = (T) BeanUtils.instantiateClass(constructor, args);
         instances.add(instance);
      }
      catch (Throwable ex) {
         throw new IllegalArgumentException("Cannot instantiate " + type + " : " + name, ex);
      }
   }
   return instances;
}
```

### 2.执行程序运行监听器

```java
    //获取程序运行监听器，并且执行
	SpringApplicationRunListeners listeners = getRunListeners(args);
	listeners.starting(bootstrapContext, this.mainApplicationClass);
```

首先看下`getRunListeners`方法的代码`SpringApplicationRunListeners`的作用就是让用户可以在SpringBoot启动时在各个阶段可以加入自己的代码逻辑。

```java
private SpringApplicationRunListeners getRunListeners(String[] args) {
   Class<?>[] types = new Class<?>[] { SpringApplication.class, String[].class };
    //创建并返回一个SpringApplicationRunListeners对象
   return new SpringApplicationRunListeners(logger,
         //这个方法上面见过了，获取META-INF/spring.factories中SpringApplicationRunListener类型的实例
         getSpringFactoriesInstances(SpringApplicationRunListener.class, types, this, args),
         this.applicationStartup);
}
```

简单看下`SpringApplicationRunListeners`的代码，可以看到主要有一下阶段。

```java
//当run()方法开始执行时就调用
void starting(ConfigurableBootstrapContext bootstrapContext, Class<?> mainApplicationClass) {}
//当environment构建完成，ApplicationContext创建之前，该方法被调用
void environmentPrepared(ConfigurableBootstrapContext bootstrapContext, ConfigurableEnvironment environment) {}
// 当ApplicationContext构建完成时，该方法被调用
void contextPrepared(ConfigurableApplicationContext context) {}
// 在ApplicationContext完成加载，但没有被刷新前，该方法被调用
void contextLoaded(ConfigurableApplicationContext context) {}
// 在ApplicationContext刷新并启动后，CommandLineRunners和ApplicationRunner未被调用前，该方法被调用
void started(ConfigurableApplicationContext context) {}
// 在run()方法执行完成前该方法被调用
void running(ConfigurableApplicationContext context) {}
// 当应用运行出错时该方法被调用
void failed(ConfigurableApplicationContext context, Throwable exception) {}
```

再看下第二行代码，执行`listeners`的`start`方法,有一个`mainApplicationClass`成员变量，在一开始的构造函数里有赋值操作，调用了`deduceMainApplicationClass`方法，看下它的源码。所以它返回了main函数所在类的全限定名，在这个例子就是`com.konb.wj.WjApplication`。然后`start`方法上面也说了，当run()方法开始执行时就调用。

```java
private Class<?> deduceMainApplicationClass() {
   try {
       //获取方法调用栈的信息
      StackTraceElement[] stackTrace = new RuntimeException().getStackTrace();
      for (StackTraceElement stackTraceElement : stackTrace) {
          //匹配main方法
         if ("main".equals(stackTraceElement.getMethodName())) {
            return Class.forName(stackTraceElement.getClassName());
         }
      }
   }
   catch (ClassNotFoundException ex) {
      // Swallow and continue
   }
   return null;
}
```



### 3.准备environment

准备`environment`环境用了一行代码，主要操作都在`prepareEnvironment`方法中，看下该方法的源码。

```java
//准备environment
ConfigurableEnvironment environment = prepareEnvironment(listeners, bootstrapContext, applicationArguments);
```

```java
private ConfigurableEnvironment prepareEnvironment(SpringApplicationRunListeners listeners,
      DefaultBootstrapContext bootstrapContext, ApplicationArguments applicationArguments) {
   // 根据当前web程序类型获取environment
   ConfigurableEnvironment environment = getOrCreateEnvironment();
   //配置environment
   configureEnvironment(environment, applicationArguments.getSourceArgs());
   ConfigurationPropertySources.attach(environment);
   listeners.environmentPrepared(bootstrapContext, environment);
   DefaultPropertiesPropertySource.moveToEnd(environment);
   configureAdditionalProfiles(environment);
   bindToSpringApplication(environment);
   if (!this.isCustomEnvironment) {
      environment = new EnvironmentConverter(getClassLoader()).convertEnvironmentIfNecessary(environment,
            deduceEnvironmentClass());
   }
   ConfigurationPropertySources.attach(environment);
   return environment;
}
```

#### （1）获取environment

首先看下`getOrCreateEnvironment`的源码

```java
private ConfigurableEnvironment getOrCreateEnvironment() {
    //判断environment是否已创建
   if (this.environment != null) {
      return this.environment;
   }
    //根据当前web程序类型，获取对应的environment，webApplicationType的值已经在前面构造函数中调用deduceFromClasspath获取了
   switch (this.webApplicationType) {
   case SERVLET:
      return new StandardServletEnvironment();
   case REACTIVE:
      return new StandardReactiveWebEnvironment();
   default:
      return new StandardEnvironment();
   }
}
```

#### （2）配置environment

看下`configureEnvironment`的源码

```java
protected void configureEnvironment(ConfigurableEnvironment environment, String[] args) {
    //addConversionService由前面代码可知初始化是true
   if (this.addConversionService) {
       //获取转化服务，用于Object对象之间的类型转换；getSharedInstance获取单例，是通过双重校验锁实现的单例
      ConversionService conversionService = ApplicationConversionService.getSharedInstance();
       //添加转化服务
      environment.setConversionService((ConfigurableConversionService) conversionService);
   }
    //配置environment中的propertysources
   configurePropertySources(environment, args);
    //配置profiles，当前2.4.3该方法是空的，不知道为啥
   configureProfiles(environment, args);
}
```

看下`configurePropertySources`的源码

```java
protected void configurePropertySources(ConfigurableEnvironment environment, String[] args) {
    //获取当前环境的属性源
   MutablePropertySources sources = environment.getPropertySources();
    //判断this.defaultProperties（初始化为空）是否为空，不为空则加到sources
   DefaultPropertiesPropertySource.ifNotEmpty(this.defaultProperties, sources::addLast);
    //判断是否有命令行属性，有的话就增加
   if (this.addCommandLineProperties && args.length > 0) {
      String name = CommandLinePropertySource.COMMAND_LINE_PROPERTY_SOURCE_NAME;
      if (sources.contains(name)) {
         PropertySource<?> source = sources.get(name);
         CompositePropertySource composite = new CompositePropertySource(name);
         composite.addPropertySource(
               new SimpleCommandLinePropertySource("springApplicationCommandLineArgs", args));
         composite.addPropertySource(source);
         sources.replace(name, composite);
      }
      else {
         sources.addFirst(new SimpleCommandLinePropertySource(args));
      }
   }
}
```
