<<<<<<< HEAD
// 生成404页面
hexo.extend.generator.register('notfoundPage', function(locals){
    return {
        path: '404.html',
        data: {
            type: '404',
            title: '这个页面走丢了呢…'
        },
        layout: '_pages/404'
    };
=======
// 生成404页面
hexo.extend.generator.register('notfoundPage', function(locals){
    return {
        path: '404.html',
        data: {
            type: '404',
            title: '这个页面走丢了呢…'
        },
        layout: '_pages/404'
    };
>>>>>>> 2143c2b87fc69e61113829da03e865f7bce4c8ff
});