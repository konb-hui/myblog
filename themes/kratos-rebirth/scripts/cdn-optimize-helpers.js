<<<<<<< HEAD
const path = require('path');

const { version } = require(path.normalize('../package.json'));

// 使用CDN提供静态资源，改写URL
hexo.theme.on('processAfter', () => {
    hexo.extend.helper.register('url_cdn', (file) => {
        return (
            hexo.theme.config.cdn
            ? `https://cdn.jsdelivr.net/gh/Candinya/Kratos-Rebirth@${version}/source/`
            : hexo.config.root
        ) + file;
    });
});
=======
const path = require('path');

const { version } = require(path.normalize('../package.json'));

// 使用CDN提供静态资源，改写URL
hexo.theme.on('processAfter', () => {
    hexo.extend.helper.register('url_cdn', (file) => {
        return (
            hexo.theme.config.cdn
            ? `https://cdn.jsdelivr.net/gh/Candinya/Kratos-Rebirth@${version}/source/`
            : hexo.config.root
        ) + file;
    });
});
>>>>>>> 2143c2b87fc69e61113829da03e865f7bce4c8ff
