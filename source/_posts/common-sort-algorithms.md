---
title: 常用排序算法
date: 2022-05-06 15:27:00
tags:
- 排序算法
categories: 
- 成神之路
- 代码记录
---

因为一直来说没有去手写过这些排序算法，只是了解原理，所以将一些常用的算法自己手写了一遍，并且详细注释了每一步的作用，还做了下简单的速度对比。目前有：冒泡排序、选择排序、插入排序、希尔排序、快速排序、归并排序、堆排序，后续会考虑更新些不常用的排序。

```java
package com.konb.heap;

import java.util.Arrays;
import java.util.Random;

/**
 * @author konb
 * @version 1.0
 * @date 2022-05-05 9:43
 * 把几个常用的算法自己手写一遍，加深印象
 */
public class Sort {

    /**
     * 冒泡排序 升序 这个没啥好说的，最简单也非常慢,到1000差距就已经很明显了，可以考虑优化
     * @param a
     */
    public static void bubbleSort(int[] a) {
        for (int i = a.length - 1; i > 0; i --) {
            boolean isChange = false;
            for (int j = 0; j < i; j ++) {
                if (a[j] >  a[j + 1]) {
                    isChange = true;
                    int temp = a[j];
                    a[j] = a[j + 1];
                    a[j + 1] = temp;
                }
            }
            //优化：判断一轮结束后是否发生交换，如果没有则说明有序直接退出
            if (! isChange) {
                break;
            }
        }
    }

    /**
     * 选择排序 升序 仅仅是比冒泡排序好
     * @param a
     */
    public static void selectionSort(int[] a) {
        for (int i = 0; i < a.length - 1; i ++) {
            //记录最小值，默认遍历的第一个值
            int min = a[i];
            //记录每次最小值的下标
            int minIndex = i;
            for (int j = i + 1; j < a.length; j ++) {
                if (a[j] < min) {
                    min = a[j];
                    minIndex = j;
                }
            }

            //交换当前无序的第一个值和最小值
            int temp = a[i];
            a[i] = min;
            a[minIndex] = temp;
        }
    }

    /**
     * 快速排序 升序 经测试该方法比quick_sort（网上找的）更快
     *
     * @param a 待排序数组
     */
    public static void quickSort(int[] a, int left, int right) {

        //当前数组需要进行排序的长度
        int length = right - left;

        //如果排序的数组长度小于2就不需要排了
        if (length < 2) {
            return;
        }

        //确定当前基准值，以当前数组的第一个值作为基准
        int pivot = a[left];
        //记录当前基准值的位置
        int pivotIndex = left;

        //遍历当前数组，将小于基准值的值移动到其左边
        for (int i = left + 1; i < right; i ++) {
            if (a[i] < pivot) {
                //将小于基准的值覆盖基准值的位置，并把基准值的位置+1,这样小于基准值的值就移动到基准值的左边
                a[pivotIndex] = a[i];
                pivotIndex ++;

                //把基准值下一位的值覆盖i上的值
                a[i] = a[pivotIndex];
            }
        }

        //将基准值覆盖此时基准值的位置
        a[pivotIndex] = pivot;

        //继续排序基准值左边的数组
        quickSort(a, left, pivotIndex);
        //继续排序基准值右边的数组
        quickSort(a, pivotIndex + 1, right);

    }

    /**
     * 插入排序 升序 测试效率很低，100万级就不行了，比快排慢多了，应该是因为有很多无用的比较
     * @param a
     */
    public static void insertSort(int[] a) {
        //从1开始遍历数组，该位置之前的数组是有序的，初始有序数组长度为1
        for (int i = 1; i < a.length; i ++) {
            //拿到需要进行插入的值，和有序数组的每个值进行对比
            int temp = a[i];
            //拿到即将要和插入的值进行比较的值的下标，初始为有序数组的第一个元素
            int j = i - 1;
            //遍历数组有序部分
            for (; j >= 0; j --) {
                //升序，如果小于，则交换，即将当前遍历到的有序数组的值往后移一位
                if (temp < a[j]) {
                    a[j + 1] = a[j];
                } else{
                    break;
                }
            }
            //插入的位置
            a[j + 1] = temp;
        }
    }

    /**
     * 希尔排序 升序 实际就是插入排序的优化版，测试速度比插入排序快很多，在20万数据以前和快速排序（quick_sort)差不多，10万以内的数据
     * 和快速排序（quickSort）差不多，但是在20万以后，就比快速排序慢，100万以后差距就比较明显了
     * @param a
     */
    public static void shellSort(int[] a) {

        //获取数组长度
        int length = a.length;
        //获取间隙，初始为数组长度除以2
        int gap = length / 2;

        //循环分组插入排序
        while (gap > 0) {
            //遍历每一组
            for (int i = 0; i < gap; i ++) {

                //对当前组进行插入排序，这部分和插入排序时一样的，只不过插入排序每次是加1，希尔排序每次是gap
                for (int j = i + gap; j < length; j += gap) {

                    int k = j - gap;
                    int temp = a[j];
                    for (; k >= 0; k -= gap) {
                        if (temp < a[k]) {
                            a[k + gap] = a[k];
                        } else {
                            break;
                        }
                    }

                    a[k + gap] = temp;
                }
            }
            //对所有组都进行一次排序后，减少间隙，重新分组并排序
            gap /= 2;
        }
    }

    /**
     * 归并排序 升序 100万级速度和希尔排序相近，比快排慢，1000万级相对来说速度非常快，远超希尔和快排，可能这就是Java底层在数据量较少的情况下用快速排序，较多的情况下用归并排序的原因
     * @param a
     */
    public static void mergeSort(int[] a, int left, int right) {
        //判断是否可再分
        if (left < right) {
            //获取中间值
            int mid = (right + left) / 2;
            //递归左半部分
            mergeSort(a, left, mid);
            //递归右半部分
            mergeSort(a, mid + 1, right);
            //合并
            merge(a, left, mid, right);
        }
    }

    /**
     * 归并排序的合并
     * @param a
     * @param left
     * @param mid
     * @param right
     */
    private static void merge(int[] a, int left, int mid, int right) {

        //获取临时数组长度
        int length = right - left + 1;

        //临时数组，保存当前部分排序后的结果
        int[] temp = new int[length];

        //左边最大值小于右边最小值则已经是有序，不需要再排序
        if (a[mid] <= a[mid + 1]) {
            return;
        }

        //临时数组下标
        int k = 0;
        //如果左边最小值大于右边最大值，则需要把左右两部分反转
        if (a[left] > a[right]) {
            for (int i = mid + 1; i <= right; i ++) {
                temp[k ++] = a[i];
            }
            for (int i = left; i <= mid; i ++) {
                temp[k ++] = a[i];
            }
            //其他情况，对比左右两边，判断最小值放入临时数组
        } else {
            //左半部分下标
            int i = left;
            //右半部分下标
            int j = mid + 1;

            while (i <= mid) {
                while (j <= right) {
                    //左半部分的值更小
                    if (a[i] <= a[j] && i <= mid) {
                        temp[k ++] = a[i ++];
                        //右半部分的值更小
                    } else {
                        temp[k ++] = a[j ++];
                    }
                }
                //右半部分遍历完，左半部分还没有遍历完的话，直接追加到临时数组后面
                if (i <= mid) {
                    temp[k ++] = a[i ++];
                }
            }
        }

        //将临时数组的值更新到目标排序数组
        for(int i = left; i <= right; i ++) {
            a[i] = temp[i - left];
        }

    }

    /**
     * 堆排序，使用最大堆升序 10万级速度很快，超过快排，100万级以上比希尔快，比归并和快排慢
     * @param a
     */
    public static void heapSort(int[] a) {
        //构建最大堆，从最后一个有子节点的节点开始，最后一个有子节点的节点的下标 = (length -2) / 2
        for (int i = (a.length - 2) / 2; i >= 0; i --) {
            downAdjust(a, i, a.length);
        }

        //最大堆的堆顶即为该堆的最大值，每次将堆定替换数组最后一个数，然后下沉
        for (int i = a.length - 1; i >= 0; i --) {
            int temp = a[i];
            a[i] = a[0];
            a[0] = temp;
            downAdjust(a, 0, i);
        }
    }

    /**
     * 构建最大堆，下沉
     * @param a
     * @param parentIndex
     * @param length
     */
    private static void downAdjust(int[] a, int parentIndex, int length) {
        //保存根节点的值
        int temp = a[parentIndex];
        /**
         * 将二叉堆层序遍历到数组后可以发现如下关系
         * 左子节点的下标 = 父节点下标 * 2 + 1
         * 右子节点的下标 = 父节点下标 * 2 + 2
         */
        int childIndex = parentIndex * 2 + 1;

        //遍历子节点
        while (childIndex < length) {
            //如果有右子节点且右子节点比左子节点更大，则替换成右子节点
            if (childIndex + 1 < length && a[childIndex + 1] > a[childIndex]) {
                childIndex ++;
            }
            //如果根节点比左右子节点都大，则不需要下沉，直接退出
            if (temp > a[childIndex]) {
                break;
            }
            /**
             * 如果根节点比子节点小，则将子节点覆盖根节点，
             * 并且继续判断子节点的子节点，这里不需要替换而是覆盖，
             * 是因为前面保存了最开始的根节点的值
             */
            a[parentIndex] = a[childIndex];
            parentIndex = childIndex;
            childIndex = parentIndex * 2 + 1;
        }
        //将当前的根节点即最后一个对比的有效子节点替换为最开始的根节点，有这一步前面就不需要交换
        a[parentIndex] = temp;
    }

    /**
     * 网上找的快排，比我写的快排效率稍差， 我的思路是参考这个，这个是双指针，我的是单指针
     * @param num
     * @param l
     * @param r
     * @return
     */
    public static int[] quick_sort(int[] num, int l, int r) {
        //r为数组元素总个数，last下标等于r-1
        int first = l, last = r - 1, key = num[first];
        while (first < last) {
            while (first < last && num[last] >= key) {
                --last;
            }
            //如果值小于 key分界值 交换
            num[first] = num[last];
            while (first < last && num[first] < key) {
                ++first;
            }
            //如果值大于key分界值 交换
            num[last] = num[first];
        }
        num[first] = key;
        //递归左右部分进行快排
        if (first > l) {
            num = quick_sort(num, l, first);
        }
        if (first + 1 < r) {
            num = quick_sort(num, first + 1, r);
        }
        return num;
    }

    //[11, 10, 9, 7, 7, 6, 6, 5, 3, 1]
    public static void main(String[] args) {

        Random random = new Random();
        int[] array1 = new int[100000];
        for (int i = 0; i <100000; i ++) {
            array1[i] = random.nextInt(1000);
        }

        int[] array2 = Arrays.copyOf(array1, array1.length);
        int[] array3 = Arrays.copyOf(array1, array1.length);
        int[] array4 = Arrays.copyOf(array1, array1.length);
        int[] array5 = Arrays.copyOf(array1, array1.length);
        int[] array6 = Arrays.copyOf(array1, array1.length);
        int[] array7 = Arrays.copyOf(array1, array1.length);

        //System.out.println(Arrays.toString(array1));
        //System.out.println("---------------------------------------");

//        long time5 = System.currentTimeMillis();
//        insertSort(array3);
//        long time6 = System.currentTimeMillis();
//        System.out.println(Arrays.toString(array3));
//        System.out.println("插入排序耗时：" + (time6 - time5));

        long time7 = System.currentTimeMillis();
        shellSort(array4);
        long time8 = System.currentTimeMillis();
        //System.out.println(Arrays.toString(array4));
        System.out.println("希尔排序耗时：" + (time8 - time7));

        long time13 = System.currentTimeMillis();
        heapSort(array7);
        long time14 = System.currentTimeMillis();
        //System.out.println(Arrays.toString(array7));
        System.out.println("堆排序耗时：" + (time14 - time13));

        long time9 = System.currentTimeMillis();
        mergeSort(array5, 0, array5.length - 1);
        long time10 = System.currentTimeMillis();
        //System.out.println(Arrays.toString(array5));
        System.out.println("归并排序耗时：" + (time10 - time9));

//        long time11 = System.currentTimeMillis();
//        selectionSort(array6);
//        long time12 = System.currentTimeMillis();
//        //System.out.println(Arrays.toString(array6));
//        System.out.println("选择排序耗时：" + (time12 - time11));


//        long time3 = System.currentTimeMillis();
//        bubbleSort(array2);
//        long time4 = System.currentTimeMillis();
//        //System.out.println(Arrays.toString(array2));
//        System.out.println("冒泡排序耗时：" + (time4 - time3));

        long time1 = System.currentTimeMillis();
        quickSort(array1, 0, array1.length);
        long time2 = System.currentTimeMillis();
        //System.out.println(Arrays.toString(array1));
        System.out.println("快排（自己）耗时：" + (time2 - time1));

    }

}
```
