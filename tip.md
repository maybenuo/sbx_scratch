# scratch 在线编程平台
=============================================

### 介绍
    scratch 是一个轻量级的Scratch在线编程、分享平台

### 功能模块：
1. 注册登录；
2. Scratch创作；
3. 作品管理；
4. 用户管理；
5. 个人信息管理；
6. 作品播放、点赞、收藏、分享。
7. [其他扩展功能请参考网站：www.comecode.net](https://www.comecode.net)

### 搭建成功后的平台界面截图：
1. 注册登录界面:
![Image text](https://gitee.com/scratch-cn/lite/raw/master/build/img/login.png)
2. 登录后的首页界面:
![Image text](https://gitee.com/scratch-cn/lite/raw/master/build/img/1.png)
3. 后台管理界面:
![Image text](https://gitee.com/scratch-cn/lite/raw/master/build/img/2.png)
4. Scratch编程界面:
![Image text](https://gitee.com/scratch-cn/lite/raw/master/build/img/scratch.png)
5. Scratch分享展示界面:
![Image text](https://gitee.com/scratch-cn/lite/raw/master/build/img/scratch_play.png)

### 平台构架技术说明：
1. 前端：Layui 框架；
2. 后端：NodeJS + MySQL；
3. 框架、结构简单清晰，整个版本极易上手；
4. 轻松支撑百万量级用户。

### 开发环境搭建所需要工具（以Windows为例）：
- git：用于下载源代码<br/>
源代码也可直接下载，下载地址:https://gitee.com/scratch-cn/lite/repository/archive/master.zip

- NodeJS：平台运行的服务器<br/>
下载地址：http://nodejs.cn/download/

- MySQL：用户信息、作品保存地<br/>
下载地址：https://dev.mysql.com/downloads/mysql/

- VS Code：源代码开发工具<br/>
下载地址：https://code.visualstudio.com/download

### 源代码获取及运行
1. git 版本源代码：git clone --depth=1 https://gitee.com/scratch-cn/lite.git
- 源代码也可直接下载:https://gitee.com/scratch-cn/lite/repository/archive/master.zip

2. 在MySQL中，新建一个数据库，如：scratch.lite，并导入数据库comecode.opensrc.sql
3. 在/lite/server/lib/database.js文件中，配置MySQL连接参数：MySQL用户名、登录密码、第2步中新建的数据库名
- MySQL8.0的连接鉴权方式会与以前版本不同，如果发生连接鉴权被拒的问题，请修改MySQL的鉴权方式，可以改以前版本的鉴权方式。<br/>
解决方案：<br/>
a.在安装MySQL8过程中，提示选择使用哪种验证方式时，就直接选择MySQL5的；<br/>
b.如果MySQL8已经安装好了，可以按文档在命令行模式下，进入MySQL去修改。<br/>
- 这方面的技术文档1：http://www.cainiaoxueyuan.com/sjk/6124.html
- 这方面的技术文档2：https://jingyan.baidu.com/article/4d58d541689c089dd5e9c062.html

4. 在源代码目录下，直接运行：npm run start
- 开源版本中，已包含了Scratch所需的全部资源，无需依赖其他平台
- 开源版本中，已包含了所需的node_modules包

### 目录说明：

```
lite                            # scratch-cn.lite 目录
├── build                       # Client端文件夹:网页、JS、CSS、IMG
│   ├── css                     #CSS库
│   ├── ejs                     #系统前端文件
│   ├── img                     #IMG库
│   ├── js                      #JS库
│   ├── layui                   #LayUI模块：前端框架
│   ├── scratch                 #scratch编辑器资源文件夹
│ 
├── data                        #所有用户上传的文件
│   ├── material                #scratch作品的素材库
│   ├── scratch_slt             #所有scratch项目的缩略图
│   ├── upload_tmp              #所有上传文件的临时存放目录，该目录正常情况下应该为空，只为临时存放
│   ├── user                    #用户头像文件夹
│
├── node_modules                #整个平台依赖的nodejs模块
├── server                      #Server端文件夹
│   ├── lib                     #Server端共用数据结构库
│   ├── router_admin.js         #系统平台
│   ├── router_my.js            #学习平台
│   ├── router_scratch.js       #scratch模块
│   ├── router_user.js          #用户登录、注册
│
├── app.js                      #平台主程序入口
├── package.json                #平台包依赖文件
├── process.json                #运行nodejs的配置
├── README.md                   #平台说明文件
├── comecode.opensrc.sql        #数据库结构文件
```
#### 注：
1. 数据库结构文件中，已包含两个Scratch作品；
2. 数据库结构文件中，已包含平台管理员账号；（账号：comecode，密码：111111)。


### 交流学习
- 欢迎使用 Scratch-cn.Lite，如您喜欢及对您有帮助，请给点个星，支持赞助一下，为后续版本加点油油！！！
- 技术交流QQ群：115224892
- [功能参考：www.comecode.net](https://www.comecode.net)
- [重要：相关技术文档专栏：https://blog.csdn.net/bailee](https://blog.csdn.net/bailee)
- 版权遵从MIT开源协议，学习交流请入群。如需商用，请联系版权所有者！
