---
title: 记一次文件切片上传文件损坏的bug
date: 2021-12-15 15:11:01
tags:
categories: 
- 神秘事件
---

## 现象

上传之后从系统里下载回来的 PDF，打开时会提示文件损坏。但同一个文件，用浏览器和 WPS 打开完全正常，只有 Adobe Acrobat 说它坏了。

同一个文件，不同阅读器一个报损坏一个不报——这本身就是线索：**文件内容已经变了**，只是坏得不够彻底，读起来还像那么回事。

下面记录整个定位过程。

## 排查过程

### 第一步：先对账，看看差了多少字节

从服务器上把上传后的文件和原文件比大小：上传后的文件比原文件**大了 1017 个字节**。

变大是往大了变，不是变小了。这排除了"内容被截断"这一类猜想，方向只剩下一个：是哪个环节往文件里多写了东西。

接下来要确认的，是**变大的动作发生在哪一环**——前端拆分的时候，还是后端合成的时候。

### 第二步：保留后端临时文件，核对字节总数

改代码保留后端收到的分片临时文件，观察它们的大小：所有分片的字节数之和等于生成后文件的字节数。

```
2097152 * 10 + 890880 = 21862400
```

对得上。所以**不是文件合成这一步变大的**。

### 第三步：核对前端传上来的分片

再把前端上传的切片打印出来，它们的字节数之和等于原文件的字节数：

```
2097152 * 10 + 889683 = 21861383
```

把这两个数字放一起看：

```
21862400 - 21861383 = 1017
```

差值正好等于第一步里多出来的 1017 字节。而且只有**小于 2M 的那个分片**对不上。

于是范围锁死了：**文件是在前端上传完成、后端开始合成之前变大的**，也就是文件转存那一步。

### 第四步：查转存的代码

转存逻辑里有一个手写的拷贝方法，问题就出在这里：

```java
/**
 * 将上传的文件保存到新文件中
 * @param uploadFile 上传的文件 MultipartFile
 * @param saveFile 新保存的文件
 */
public static void copyUploadFile(MultipartFile uploadFile, File saveFile) {
   byte[] data = new byte[1024];
   try(InputStream inputStream = uploadFile.getInputStream();
      BufferedInputStream bufferedInputStream = new BufferedInputStream(inputStream);
      OutputStream outputStream = new FileOutputStream(saveFile);
      BufferedOutputStream bufferedOutputStream = new BufferedOutputStream(outputStream)) {
       //当文件剩余的部分小于1024个字节时，data中不足1024的部分仍是上一个1024个字节的部分，直接write就导致那部分重新写了
      while (bufferedInputStream.read(data) > 0) {
         bufferedOutputStream.write(data);
         bufferedOutputStream.flush();
      }
   } catch (IOException e) {
      e.printStackTrace();
      throw new SrsException(300, "文件读取失败");
   }
}
```

问题就写在注释里了：**当文件剩余部分不足 1024 字节时，`data` 数组里没被覆盖的那一段，还是上一次读取留下的旧内容**。而 `write(data)` 写的是整个数组，于是最后那一截被重复写了一遍。

修改后的代码：

```java
/**
 * 将上传的文件保存到新文件中
 * @param uploadFile 上传的文件 MultipartFile
 * @param saveFile 新保存的文件
 */
public static void copyUploadFile(MultipartFile uploadFile, File saveFile) {
   byte[] data = new byte[1024];
   try(InputStream inputStream = uploadFile.getInputStream();
      BufferedInputStream bufferedInputStream = new BufferedInputStream(inputStream);
      OutputStream outputStream = new FileOutputStream(saveFile);
      BufferedOutputStream bufferedOutputStream = new BufferedOutputStream(outputStream)) {
      int len = -1;
      while ((len = bufferedInputStream.read(data)) != -1) {
          //只写新读取到的字节数，不把1024个字节都写进去
         bufferedOutputStream.write(data, 0, len);
         bufferedOutputStream.flush();
      }
   } catch (IOException e) {
      e.printStackTrace();
      throw new SrsException(300, "文件读取失败");
   }
}
```

关键改动只有一处：`write(data, 0, len)`——**读多少写多少**。

## 复盘

这类 bug 留给我的东西，比 bug 本身更有用：

1. **缓冲区写入必须按实际读取长度写。** `read` 返回多少就写多少，别图省事把整个数组丢进去。`while (read(data) > 0)` 换成 `while ((len = read(data)) != -1)`，再 `write(data, 0, len)`，差别就在这一处。
2. **大小对账是最快的定位手段。** 出事先比字节数，再看差值能不能跟某个环节的数字对上。对上了，范围立刻缩小一圈；这比逐行读代码快得多。
3. **多阅读器验证能暴露"半损坏"。** Acrobat 报错而浏览器不报错，说明文件结构被破坏、内容却还在——这种"部分损坏"最容易被误判成阅读器自己的毛病，从而跑偏方向。
4. **这种代码最好不要手写。** Java 里 `Files.copy(inputStream, path, REPLACE_EXISTING)` 或者 Apache Commons 的 `FileUtils.copyInputStreamToFile` 一行就够；手写拷贝流的代码，几乎每一行都要提防"最后一段不足缓冲区"这个坑，而这个坑踩过一次就会记住。
