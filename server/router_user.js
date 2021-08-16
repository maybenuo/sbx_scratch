//用户账号功能路由：注册、登录等
var express = require('express');
var router = express['Router']();
var fs = require('fs');

//数据库
var DB = require("./lib/database.js");
//功能函数集
var I = require('./lib/fuck.js');

router.all('*',function(req, res, next) {
    next();
});


//登录、注册、找回密码三合一界面
router.get('/login', function (req, res) {
    res.render('ejs/login_or_register.ejs');
});
//登录
router.post('/login', function (req, res) {
    if (!req.body.pw|| !I.userpwTest(req.body.pw) || !req.body.un || !I.usernameTest(req.body.un)){
        res.status(200).send( { 'status': '账号或密码错误' });
        return;
    }

    var SQL = `SELECT * FROM user WHERE username=? LIMIT 1`;
    var WHERE = [`${req.body['un']}`];
    DB.qww(SQL, WHERE, function (err, USER) {
        if (err||USER.length==0) {
            res.status(200).send( { 'status': '账号或密码错误' });
            return;
        }
        
        var User = USER[0];
        pw = I.md5(I.md5(req.body.pw)+req.body.un);
        if (User['pwd'] != pw) {
            res.status(200).send( { 'status': '账号或密码错误' });
        } else if (User['state'] == 2) {
            res.status(200).send( { 'status': '您已经被封号，请联系管理员' });
        } else {
            req.session['userid'] = User['id'];
            req.session['username'] = User['username'];
            req.session['nickname'] = User['nickname'];
            //console.log('已登录：**********************************');

            //判断系统管理员权限
            if (req.session['username']=='comecode'){
                req.session['is_admin'] = 1;
            } else {
                req.session['is_admin'] = 0;
            }
            //7天时长的毫秒数：86400000=24*60*60*1000
            res.cookie('userid', User['id'], { 'maxAge': 604800000, 'signed': true });
            res.cookie('username',User['username'], { 'maxAge': 604800000, 'signed': true });
            res.cookie('nickname', User['nickname'], { 'maxAge': 604800000, 'signed': true });

            res.status(200).send( {
                'status': 'OK',
                userid: parseInt(User['id']),
                username: User['username'],
                nickname: User['nickname'],
                avatar: `/user/${User['id']}.png`
            });
        }
    });
});

//退出
var logout = function (req, res) {
    req.session.destroy();

    res.locals['userid'] = null;
    res.locals['username'] = null;

    res.cookie('userid', '', { 'maxAge': 0, 'signed': true });
    res.cookie('username', '', { 'maxAge': 0, 'signed': true });
    res.cookie('nickname', '', { 'maxAge': 0, 'signed': true });
};
router.get('/logout', function (req, res) {
    logout(req, res);
    res.redirect('/');
});

//注册
router.post('/register', function (req, res) {
    if (!req.body.pw|| !I.userpwTest(req.body.pw) || !req.body.un|| !I.usernameTest(req.body.un)){
        res.status(200).send( { 'status':'账号或密码格式错误' });
        return;
    }
    if (I.phoneTest(req.body.un)){
        res.status(200).send( { 'status':'手机号不能直接用于注册账号' });
        return;
    }

    var username = req.body.un;
    SQL = `SELECT id FROM user WHERE username='${username}' LIMIT 1`;
    DB.query(SQL, function (err, User) {
        if (err) {
            res.status(200).send( { 'status':'账号格式错误' });
            return;
        }
        if (User.length>0) {
            res.status(200).send( { 'status':'账号已存在' });
            return;
        }

        //对密码进行加密
        var pw = req.body.pw;
        pw = I.md5(I.md5(pw)+username);
        //新用户注册 //loginInfo = [{'t': new Date(),'ip':req.ip,'agent':req.headers["user-agent"]}];
        var nickname = username.substring(username.length-5);
        var INSERT = `INSERT INTO user (username,pwd,nickname) VALUES ('${username}','${pw}','${nickname}')`;
        DB.query(INSERT, function (err, newUser) {
            if (err) {
                res.status(200).send( { 'status':'再试一次' });
                return;
            }
            
            req.session['userid'] = newUser.insertId;
            req.session['username'] = username;
            req.session['nickname'] = nickname;

            //7天时长的毫秒数：604800000=7*24*60*60*1000
            res.cookie('userid', newUser.insertId, { 'maxAge': 604800000, 'signed': true });
            res.cookie('username',username, { 'maxAge': 604800000, 'signed': true });
            res.cookie('nickname', nickname, { 'maxAge': 604800000, 'signed': true });

            oldpath = './build/img/user_default_icon.png';
            newpath = './data/user/' + newUser.insertId + '.png';
            let oldFile = fs['createReadStream'](oldpath);
            let newFile = fs['createWriteStream'](newpath);
            oldFile['pipe'](newFile);
            
            res.status(200).send( { 'status': 'ok' });
         });
    });
});
//产生图片滑动验证码
var Geetest = require('gt3-sdk');//注册时图片拖动验证：极验证的运用
var newGeeTest = new Geetest({'geetest_id': 'c6af355b3f8d0107b821ce6da980ca2b','geetest_key': '348b495b2c97f087301c51deb40f466e'});
router.get('/gt_slide', function (req, res, next) {
    newGeeTest['register']({ 'client_type': 'unknown', 'ip_address': 'unknown' }, function (err, data) {
        if (err) {
            console['error'](err);
            return;
        }
        if (!data['success']) {
            req.session['fallback'] = true;
            res.send(data);
        } else {
            req.session['fallback'] = false;
            res.send(data);
        }
    });
});


//Scratch启动时，自动获取一次登录信息
router.post('/getSession', (req, res) => {
    if (!res.locals.login) {
        var new_session = {
            userid: 0,
            username:'',
            nickname: '',
            avatar: ``
        };
    } else {
        var new_session = {
            userid: parseInt(req.session['userid']),
            username: req.session['username'],
            nickname: req.session['nickname'],
            avatar: `/user/${req.session.userid}.png`
        };
    }
    
    res.status(200).send(JSON.stringify(new_session));
});
//从Scratch中退出
router.post('/logout', function (req, res) {
    logout(req, res);
    var login_info = [{ 'username':'CoCo', 'success': 1}];
    res.status(200).send( login_info);
});

module.exports = router;