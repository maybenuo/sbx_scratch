//系统平台部分
var express = require('express');
var router = express.Router();
var fs = require('fs');

//功能函数集
var I = require('./lib/fuck.js');

//数据库
var DB = require("./lib/database.js");


router.all('*', function(req, res, next) {
    if (!res.locals.login){
        res.render('_index/_login_register.ejs');
        return;
    }

	if ( res.locals['is_admin'] != 1) {
        res.render('ejs/404.ejs');
        return;
    }

	next();
});
//平台首页
router.get('/', function (req, res) {    
    res.render('ejs/admin/admin_index.ejs');
});
//平台默认首页
router.get('/default', function (req, res) {    
    res.render('ejs/admin/admin_default.ejs');

});

//平台概况
router.get('/info', function (req, res) {   
    var SQL = `SELECT `+
               ` (SELECT count(id) FROM user ) AS user_count, `+ 
               ` (SELECT count(id) FROM scratch ) AS scratch_count `;
    DB.query(SQL, function(err,d){
        if (err||d.length==0){

            res.locals['user_count'] = 0;
            res.locals['work_count'] = 0;
        } else {
            res.locals['user_count'] = d[0].user_count;
            res.locals['work_count'] = d[0].scratch_count;
        }

        res.render('ejs/admin/admin_info.ejs');
    })
});


//用户管理
router.get('/user', function (req, res) {
    res.render('ejs/admin/admin_user.ejs');
});
//用户管理：数据。0正常用户，2封号用户
router.get('/user/data', function(req, res) {
    var state = parseInt(req.query['s']);
    if (state == 9){//0：正常用户，2：封号用户，9：查找用户
        var SQL = `SELECT count(id) AS c FROM user WHERE username LIKE '%${req.query.t}%'`;
    } else {
        var SQL = `SELECT count(id) AS c FROM user WHERE state=${state}`;
    }
    DB.query(SQL,function (err, count){
        if (err || count.length==0 || count[0]['c']==0) {
            res.status(200).send({'count':0,'data':[]});
            return;
        }
        //获取当前数据集合
        var page = parseInt(req.query['page']);
        var limit = parseInt(req.query['limit']);

        if (state == 9){//0：正常用户，2：封号用户，9：查找用户
            SQL = `SELECT id,username,nickname,state,regTime FROM user WHERE username LIKE '%${req.query.t}%' LIMIT ${(page-1)*limit}, ${limit}`;
        } else {
            SQL = `SELECT id,username,nickname,state,regTime FROM user WHERE state=${state} LIMIT ${(page-1)*limit}, ${limit}`;
        }
        DB.query(SQL, function (err, data) {
            if (err) {
                res.status(200).send({'count':0,'data':[]});
            } else {
                res.status(200).send({'count':count[0]['c'],'data':data});
            }
        });
    });
});
//管理员重置用户密码
router.post('/user_setpwd', function (req, res) {
    if (!req.body.pw || !req.body.un|| !I.userpwTest(req.body.pw)){
        res.status(200).send({"status":"failed","msg":"再试一次"});
        return;
    }

    //对密码进行加密
    let pw = I.md5(I.md5(req.body.pw)+req.body.un);
    var UPDATE = `UPDATE user SET pwd='${pw}' WHERE username='${req.body['un']}' LIMIT 1`;
    DB.query(UPDATE, function (err, d) {
        if (err) {
            res.status(200).send({"status":"failed","msg":"再试一次"})
        } else {
            res.status(200).send( {'status': 'success','msg': '密码重置成功'});
        }
    });
});
//用户管理：功能.0解封 2封号
router.post('/user_setstate',function(req,res){
    var state = 0;
    if (req.body['s'] == undefined || req.body['s'] !=0) {
        state = 2;//未知时，都当作封号处理
    }
    //var state = parseInt(req.body['s']);
    var UPDATE = `UPDATE user SET state=${state} WHERE id=${req.body.id} LIMIT 1`;
    DB.query(UPDATE, function(err,d){
        if(err){
            res.status(200).send({"status":"failed","msg":"再试一次"})
        }
        else {
            res.status(200).send({"status":"success",'msg':'操作成功'})        
        }
    })
});
//用户管理：创建新用户，功能
router.post('/user_new',function(req,res){ 
    if (!req.body.un|| !I.usernameTest(req.body.un)){
        res.status(200).send({"status":"failed","msg":"再试一次"});
        return;
    }
    //检查账号是否已存在
    var SQL = `SELECT id FROM user WHERE username='${req.body.un}' LIMIT 1`;
    DB.query(SQL, function (err, User) {
        if (err) {
            res.status(200).send( msg_fail);
            return;
        }
        if (User.length != 0) {
            res.status(200).send( {'status': 'fail','msg':'该账号已存在'});
            return;
        }

        //对密码进行加密:默认密码为用户手机号后8位
        var nn = req.body.un.substring(req.body.un.length-6);//昵称
        var pw = nn;//req.body.un.substring(req.body.un.length-6);//初始密码
        pw = I.md5(I.md5(pw)+req.body.un);
        SQL = `INSERT INTO user (username,pwd,nickname) VALUES ('${req.body.un}','${pw}','${nn}')`;
        DB.query(SQL, function (err, newUser) {
            if (err) {
                res.status(200).send( { 'status': 'fail', 'msg': '再试一次' });
                return;
            }

            oldpath = './build/img/user_default_icon.png';
            newpath = './data/user/' + newUser.insertId + '.png';
            let oldFile = fs['createReadStream'](oldpath);
            let newFile = fs['createWriteStream'](newpath);
            oldFile['pipe'](newFile);
            

            res.status(200).send( { 'status': 'success', 'msg': '操作成功' });
        });
    });
});


//作品管理：Scratch页面
router.get('/works/scratch', function (req, res) {
    res.render('ejs/admin/admin_works_scratch.ejs');
});
//作品管理：Scratch数据
router.get('/works/scratch/data', function(req, res) {
    WHERE='';
    NICKNAME = '';//根据昵称查找
    if (req.query.w == 'search_state0'){
        WHERE = ` WHERE scratch.state=0 `;
    } else if (req.query.w == 'search_state1'){
        WHERE = ` WHERE scratch.state>0 `;
    } else if (req.query.w == 'search_state2'){
        WHERE = ` WHERE scratch.state=2 `;
    } else if (req.query.w == 'search_recommented1'){
        WHERE = ` WHERE scratch.recommented=1 `;
    } else if (req.query.w == 'search_workname'){
        WHERE = ` WHERE scratch.title LIKE '%${req.query.v}%' `;
    } else if (req.query.w == 'search_nickname'){
        NICKNAME = ` AND user.nickname LIKE '%${req.query.v}%' `;
    }

    if (NICKNAME==''){
        var SQL = `SELECT count(id) AS c FROM scratch ${WHERE}`;
    } else {
        var SQL = `SELECT count(scratch.id) AS c FROM scratch `+
        ` INNER JOIN user ON (user.id=scratch.authorid ${NICKNAME}) `;
    }
    DB.query(SQL, function (err, count){
        if (err || count[0]['c']==0) {
            res.status(200).send({'count':0,'data':[]});
            return;
        }
        //获取当前数据集合
        var page = parseInt(req.query['page']);
        var limit = parseInt(req.query['limit']);
        SQL = `SELECT scratch.id, scratch.state, scratch.recommented, scratch.title, scratch.time, user.username, user.nickname FROM scratch `
             +` INNER JOIN user ON (user.id=scratch.authorid ${NICKNAME}) `
             +` ${WHERE} ORDER BY scratch.time DESC LIMIT ${(page-1)*limit},${limit}`;

        DB.query(SQL, function (err, data) {
            if (err) {
                res.status(200).send({'count':0,'data':[]});
            } else {
                res.status(200).send({'count':count[0]['c'],'data':data});
            }
        });
    });
});
//作品管理：设置作品的标题
router.post('/works/scratch/changeTitle',function(req,res){
    var UPDATE = `UPDATE scratch SET title=? WHERE id=${req.body.id} LIMIT 1`;
    var SET = [`${req.body.t}`]
    DB.qww(UPDATE, SET, function(err,d){
        if(err){
            res.status(200).send({"status":"failed","msg":"再试一次"})
        }
        else {
            res.status(200).send({"status":"success",'msg':'操作成功'})        
        }
    })
});
//作品管理：设置作品的发布状态
router.post('/works/scratch/setState',function(req,res){
    if (req.body.s == undefined || (req.body.s < 0 || 2 < req.body.s)) {
        s = 0;//未知时，都当作取消推荐处理
    }else{
        s = req.body.s;
    }

    var UPDATE = `UPDATE scratch SET state=${s} WHERE id=${req.body.id} LIMIT 1`;
    DB.query(UPDATE, function(err,d){
        if(err){
            res.status(200).send({"status":"failed","msg":"再试一次"})
        }
        else {
            res.status(200).send({"status":"success",'msg':'操作成功'})        
        }
    })
});
//作品管理：设置作品的推荐状态
router.post('/works/scratch/setRecommented',function(req,res){
    if (req.body.r == undefined || (req.body.r !=0 && req.body.r !=1)) {
        r = 0;//未知时，都当作取消推荐处理
    }else{
        r = req.body.r;
    }

    var UPDATE = `UPDATE scratch SET recommented=${r} WHERE id=${req.body.id} LIMIT 1`;
    DB.query(UPDATE, function(err,d){
        if(err){
            res.status(200).send({"status":"failed","msg":"再试一次"})
        }
        else {
            res.status(200).send({"status":"success",'msg':'操作成功'})        
        }
    })
});


module.exports = router;