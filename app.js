var express = require('express');
var app = express();
var http = require('http');

//设置环境变量 
var session = require('express-session');
app.use(session({ 'secret': 'CoCo-secret', 'resave': false, 'name': 'CoCoName', 'saveUninitialized': true,'cookie': {'secure': false}}));

//express 的cookie的解析组件
var cookieParser = require('cookie-parser');
app.use(cookieParser('CoCo-secret'));

//express 的http请求体进行解析组件
var bodyParser = require('body-parser');
app.use(bodyParser['urlencoded']({ 'limit': '50mb', 'extended': false }));
app.use(bodyParser['json']({ 'limit': '50mb' }));

//文件上传模块
var multipart = require('connect-multiparty');
app.use(multipart({ 'uploadDir': './data/upload_tmp'}));

//压缩组件，需要位于 express.static 前面，否则不起作用
var compress = require('compression');
app.use(compress());

app.set('views', __dirname + '/build');
app.set('view engine', 'ejs');

//数据库
var DB = require("./server/lib/database.js");

//设置静态资源路径 
app.use('/', express.static('build'));
app.use('/', express.static('data'));//用户数据内容

//启动http(80端口)==================================
http.createServer(app).listen(80, '0.0.0.0', function () { console.log('HTTP APP started on port 80'); });

//平台总入口
app.all('*', function (req, res, next) {
    console.log('当前请求:'+ req.method +"="+ req.url);
    if ((req.session['userid'] == undefined) && req.signedCookies['userid']) {
        req.session['userid'] = req.signedCookies['userid'];
        req.session['username'] = req.signedCookies['username'];
        req.session['nickname'] = req.signedCookies['nickname'];
        req.session['authLevel'] = req.signedCookies['auth_level'];

        //判断系统管理员权限：此处写死，无需从数据库获取
        if (req.session['authLevel']=='0'){
            req.session['is_admin'] = 1;
        } else {
            req.session['is_admin'] = 0;
        }
    }

    if (req.session['userid']) {
        res.locals['login'] = true;
        res.locals['userid'] = req.session['userid'];
        res.locals['username'] = req.session['username'];
        res.locals['nickname'] = req.session['nickname'];
        res.locals['is_admin'] = req.session['is_admin'];
    } else {
        res.locals['login'] = false;
        res.locals['userid'] = '';
        res.locals['username'] = '';
        res.locals['nickname'] = '';
        res.locals['is_admin'] = 0;
    }

    next();
});


//首页
app.get('/', function (req, res) {
    //获取已分享的作品总数
    var SQL = `SELECT count(id) AS project_count FROM scratch WHERE state>0`; 
    DB.query(SQL, function(err, data){
        if (err){
            console.error('数据库操作出错：');
            console.error(err);
            res.locals['database_error']=err;
            res.locals.project_count = 0;
        } else {
            res.locals['database_error']='';
            res.locals.project_count = data[0].project_count;
        }
        res.render('ejs/index.ejs');
    });
});

//翻页：Scratch作品列表：数据
app.post('/index/getProjects', function (req, res) {
    var curr = parseInt(req.body.curr);     //当前要显示的页码
    var limit = parseInt(req.body.limit);   //每页显示的作品数
    
    var SQL = `SELECT id, title, state FROM scratch WHERE state>0 ORDER BY view_count DESC LIMIT ${(curr-1)*limit}, ${limit}`;
    DB.query(SQL, function (err, data) {
        if (err) {
            res.status(200).send([]);
        } else {
            res.status(200).send(data);
        }
    });
});

//搜索：Scratch项目列表：数据//只搜索标题
app.post('/index/seachProjects', function (req, res) {
    if (!req.body.txt){
        res.status(200).send([]);
        return;
    }
 
    var SQL = `SELECT id, title FROM scratch WHERE state>0 AND (title LIKE ?) LIMIT 12`;
    var WHERE = [`%${req.body.txt}%`];
    DB.qww(SQL, WHERE, function (err, data) {
        if (err) {
            res.status(200).send([]);
        } else {
            res.status(200).send(data);
        }
    });
});



//放在最后，确保路由时能先执行app.all=====================
//注册、登录等功能路由，含密码找回功能
var router_register = require('./server/router_user.js');
app.use('/user', router_register);

//个人中心路由//学生平台路由
var router_admin = require('./server/router_my.js');
app.use('/my', router_admin);

//系统平台路由
var router_admin = require('./server/router_admin.js');
app.use('/admin', router_admin);

//scratch路由
var router_scratch = require('./server/router_scratch.js');
app.use('/scratch', router_scratch);