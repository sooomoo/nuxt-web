静态文件目录 public 用于存放应用的静态文件，此类文件不会被 Nuxt.js 调用 Webpack 进行构建编译处理。服务器启动的时候，该目录下的文件会映射至应用的根路径 / 下。
Files contained within the public/ directory are served at the root and are not modified by the build process. 
This is suitable for files that have to keep their names (e.g. robots.txt) or likely won't change (e.g. favicon.ico)

举个例子: /public/robots.txt 映射至 /robots.txt