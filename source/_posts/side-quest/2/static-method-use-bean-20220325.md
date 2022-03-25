---
title: 静态方法中使用spring管理的bean
date: 2022-03-25 16:30:01
toc: true
tags: 
- spring
categories: 
- 支线任务
- Rank D
---

##### 【任务标题】

静态方法中使用spring管理的bean

##### 【状态】

已解决

##### 【任务奖励】

银币 * 2

##### 【要求时间】

1 Day

##### 【委托人】

村民C

##### 【任务详情】

请提供方法能够在静态方法中调用被spring容器管理的类



##### 【承接人】

konb

##### 【解决过程】

如下代码示例，解决的步骤如下

1. 添加一个当前类的静态属性`serverManager`
2. 添加要使用的被spring管理的对象属性`messageService`
3. 创建被`@PostConstruct`修饰的`initServerManager()`方法，对`serverManager`对象赋值，值（`this`)为当前类被`new`后的对象
4. 调用需要的方法

```java
package com.spm.study.demoproject.area.soft.server;

import com.alibaba.fastjson.JSON;
import com.spm.study.demoproject.area.soft.Service.basic.NormalMessageService;
import com.spm.study.demoproject.area.soft.Service.notice.MessageService;
import com.spm.study.demoproject.area.soft.entity.T_USER;
import com.spm.study.demoproject.area.soft.entity.basic.NormalMessage;
import com.spm.study.demoproject.area.soft.entity.notice.ChangeBatch;
import com.spm.study.demoproject.area.soft.entity.notice.Message;
import com.spm.study.demoproject.area.soft.util.SessionUtil;
import com.spm.study.demoproject.area.soft.util.basic.MessageEnum;
import com.spm.study.demoproject.area.soft.util.manual.ManualConstant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * @author konb
 */
@Component
public class ServerManager {

    //3.@PostConstruct修饰非静态的void方法，保证该方法会在构造函数之后，init()方法之前执行
    @PostConstruct
    public void initServerManager() {
        serverManager = this;
    }
    
    
    //2.添加要使用的被spring管理的对象属性
    @Autowired
    private MessageService messageService;

    @Autowired
    private NormalMessageService normalMessageService;

    private static Map<Integer, WebSocketServer> servers = new ConcurrentHashMap<>();

    //1.添加当前类的静态属性
    public static ServerManager serverManager;

    public static void broadCast(String msg){

    }

    public static int getTotal(){
        return servers.size();
    }
    public static Map<Integer, WebSocketServer> getServers(){
        return servers;
    }
    
    public static void sendNoticeInformation(Integer userId, String message, ChangeBatch changeBatch) {
        WebSocketServer webSocketServer = servers.get(userId);
        Message msg = new Message();
        msg.setContent(message);
        msg.setToUser(userId);
        msg.setBatch(changeBatch.getBatch());
        msg.setCid(changeBatch.getId());
        //4.调用messageService
        serverManager.messageService.save(msg);
        if (webSocketServer != null) {
            webSocketServer.sendMessage(message);
        }

    }
    
    public static void remove(WebSocketServer server) {
        servers.remove(server.getUserId());
    }
    public static void remove(Integer userId) {
        servers.remove(userId);
    }

    /**
     * 查询当前用户是否在线
     * @param userId 用户ID
     * @return boolean
     */
    public static boolean isOnline(Integer userId) {
        return servers.get(userId) != null;
    }

}
```

