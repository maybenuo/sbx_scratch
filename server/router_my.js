//个人中心
var express = require('express');
var router = express.Router();
var fs = require('fs');

//功能函数集
var I = require('./lib/fuck.js');
//数据库
var DB = require("./lib/database.js");

router.all('*', function(req, res, next) {
    //限定访问该模块的权限：必须已登录
    if (!res.locals.login){//未登录时，跳转到登录界面
        res.render('ejs/login_or_register.ejs');
        return;
    }

    //设置导航栏选中情况
    res.locals['curItem'] = {};
	next();
});

//个人中心：当前版本，直接跳转到个人作品
router.get('/', function (req, res) {
    res.redirect('/my/project');    
});

//作品
router.get('/project', function (req, res) {
    var SQL = `SELECT `+
        ` count(case when state=0 then 1 end) AS state0_count, `+
        ` count(case when state=1 then 1 end) AS state1_count, `+
        ` count(case when state=2 then 1 end) AS state2_count `+
        ` FROM scratch WHERE authorid=${req.session.userid}`;
    
    DB.query(SQL, function(err, data){
        if (err){
            res.locals.state0_count = 0;
            res.locals.state1_count = 0;
            res.locals.state2_count = 0;
        }else{
            res.locals.state0_count = data[0].state0_count;
            res.locals.state1_count = data[0].state1_count;
            res.locals.state2_count = data[0].state2_count;
        }
        res.render('ejs/my_scratch_projects.ejs');
    });
});  
//显示Scratch项目列表：数据，{curr:obj.curr, limit:obj.limit,state:state}
router.post('/getProjects', function (req, res) {
    var curr = parseInt(req.body.curr);     //当前要显示的页码
    var limit = parseInt(req.body.limit);   //每页显示的作品数
    var state = parseInt(req.body.state);   //每页显示的作品状态

    var SQL = `SELECT id, title,view_count FROM scratch WHERE authorid=${req.session.userid} AND state=${state} ORDER BY view_count DESC LIMIT ${(curr-1)*limit}, ${limit}`;
    DB.query(SQL, function (err, data) {
        if (err) {
            res.status(200).send([]);
        } else {
            res.status(200).send(data);
        }
    });
});

//分享Scratch项目
router.post('/scratch/share', function (req, res) {
    var SQL = `UPDATE scratch SET state=1 WHERE id=${ req.body['id']} AND authorid=${req.session.userid} LIMIT 1`;
    DB.query(SQL, function (err, d) {
        if (err) {
            res.status(200).send(I.msg_fail);
            return;
        }

        res.status(200).send( { 'status': 'success', 'msg':'分享成功' });
    });
});
//删除Scratch项目
router.post('/scratch/del', function (req, res) {
    var DEL = `DELETE FROM scratch WHERE id=${ req.body['id']} AND authorid=${req.session.userid} LIMIT 1`;
    DB.query(DEL, function (err, d) {
        if (err) {
            res.status(200).send(I.msg_fail);
            return;
        }

        if (d.affectedRows==0) {
            res.status(200).send( {'status': 'failed','msg': '删除失败'});
            return;
        }

        var filename = ('./data/scratch_slt/' + req.body['id']);
        fs.unlink(filename,function (err) {if(err){}});

        res.status(200).send( { 'status': 'success', 'msg':'删除成功' });
    });
});
//收藏的Scratch项目：页面
router.get('/scratch/favo', function (req, res) {
    res.locals['curItem']['scratch'] = 'active';
    res.render('_my/my_scratch_favorites.ejs');
});  
//收藏Scratch项目列表：数据，流加载模式
router.post('/scratch/favo_data', function (req, res) {
    rtn={'status': 'success','data':[],'total':0}

    var SQL = `SELECT count(id) AS c FROM scratch_favo WHERE userid=${req.session.userid}`;
    DB.query(SQL, function(err, c){
        if (err || c[0].c == 0) {
            rtn['msg']='暂无此类作品';
            rtn['status'] = 'fail';
            res.status(200).send(rtn);
            return;
        }
        //获取当前数据集合：以修改时间降序排列
        var page = parseInt(req.body.page);
        SQL = `SELECT f.*,scratch.title,scratch.view_count,scratch.like_count FROM scratch_favo f `+
        ` LEFT JOIN scratch ON (scratch.id=f.projectid) `+
        ` WHERE f.userid=${req.session.userid} ORDER BY f.time DESC LIMIT ${(page-1)*24},24`;
        DB.query(SQL, function (err, data) {
            if (err) {
                rtn['msg']='暂无此类作品';
                rtn['status'] = 'fail';
                res.status(200).send(rtn);
            } else {
                rtn.data = data;
                rtn.total = c[0].c/24;
                res.status(200).send(rtn);
            }
        });
    })
});


//个人设置
router.get('/info', function (req, res) {
    res.locals['curItem']['set'] = 'active';
    var SQL = `SELECT * FROM user WHERE id=${req.session.userid} LIMIT 1`;
    DB.query(SQL, function (err, USER) {
        if (err || USER.length == 0) {
            res.render('ejs/404.ejs');
            return;
        }

        res.locals['sex'] = USER[0]['sex'];
        res.locals['birth'] = USER[0]['birthday'];
        res.locals['motto'] = USER[0]['motto'];

        res.render('ejs/my_info.ejs');
    });
});
//修改头像
router.post('/set/avatar', function (req, res) {
    //保存文件到正确位置
    if (!req['files']['file']) {
        res.status(200).send( {'status':'文件上传失败'});
        return;
    }

    tmppath = req['files']['file']['path'];
    newpath = `./data/user/${req.session.userid}.png`;
    fs.rename(tmppath, newpath,function (err) {
        if (err) {
            res.status(200).send( {'status':'文件上传失败'});
            return;
        }

        res.status(200).send( {'status': 'ok'}); 
    });
});
//修改个人信息
router.post('/set/userinfo', function (req, res) {
    var UPDATE = `UPDATE user SET ? WHERE id=${req.session.userid} LIMIT 1`;
    var SET = {
        'nickname':req.body['nickname'],
        'motto': req.body['aboutme'],
        'sex': req.body['sex'],
        'birthday': new Date(`${req.body['year']}-${req.body['month']}-${req.body['day']} 00:00:00`)
    };
    DB.qww(UPDATE, SET, function (err, u) {
        if (err) {
            res.status(200).send( {'status':'请再试一次'});
            return;
        }
        if(u.changedRows!=0 && (req.session['nickname'] != req.body['nickname'])){
            //更新cookie等信息中的昵称
            req.session['nickname'] = req.body['nickname'];
            res.locals['nickname'] = req.body['nickname'];
            res.cookie('nickname', req.body['nickname'], { 'maxAge': 604800000, 'signed': true });
        }

        res.status(200).send( {'status': '个人信息修成成功'});
      });
});
//修改密码：动作
router.post('/set/pw', function (req, res) {
    var oldPW = I.md5(I.md5(req.body['oldpw'])+req.session.username);
    var newPW = I.md5(I.md5(req.body['newpw'])+req.session.username);

    //判断用户是手机账号用户、校区自己生成的账号
    if (!I.usernameTest(req.session.username)){
        SET = {pwd:newPW, mima:req.body['newpw']};
    }else{
        SET = {pwd:newPW};
    }
    
    UPDATE = `UPDATE user SET ? WHERE id=${req.session.userid} AND pwd="${oldPW}" LIMIT 1`;
    DB.qww(UPDATE, SET, function (err, u) {
        if (err) {
            res.status(200).send({'status': '请再试一次'});
            return;
        }
        if (u.changedRows==0) {
            res.status(200).send( {'status': '原密码错误'});
            return;
        }

        res.status(200).send( {'status':'ok'});
    });
});


module.exports = router;