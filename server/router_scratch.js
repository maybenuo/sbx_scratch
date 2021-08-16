var express = require('express');
var router = express.Router();
var fs = require('fs');

//功能函数集
var I = require('./lib/fuck.js');
//数据库
var DB = require("./lib/database.js");

router.all('*', function (req, res, next) {
	next();
});


//==作品状态：
//0：未发布；
//1：已发布；
//2：已开源；（开源的必须发布）
//Scratch项目展示
router.get('/play', function (req, res) {
    var deviceAgent = req.headers["user-agent"].toLowerCase();
    var agentID = deviceAgent.match(/(iphone|ipad|android|windows phone)/);
    res.locals['is_mobile'] = false;
    if(agentID){
        res.locals['is_mobile'] = true;//请求来自手机、pad等移动端
    }

    //浏览数+1
    var SQL = `UPDATE scratch SET view_count=view_count+1 WHERE id=${req.query.id} LIMIT 1`;
    DB.query(SQL, function(err,U){
        if (err|| U.affectedRows==0) {
            res.locals.tip = {'opt': 'flash', 'msg':'项目不存在或未发布'};
            res.render('ejs/404.ejs');
            return;
        }
        
        if (!res.locals.login) {
            SQL = `SELECT scratch.id,scratch.authorid,scratch.time,scratch.view_count,scratch.like_count,`+
            ` scratch.favo_count,scratch.title,scratch.state,scratch.recommented,scratch.description,`+
            ` '' AS likeid, '' AS favoid,`+
            ` user.nickname AS author_nickname`+
            ` FROM scratch `+
            ` LEFT JOIN user ON (user.id=scratch.authorid) `+
            ` WHERE scratch.id=${req.query.id} AND scratch.state>=1 LIMIT 1`;
        } else {//登录用户，需要判断是否已点赞、收藏
            SQL = `SELECT scratch.id,scratch.authorid,scratch.time,scratch.view_count,scratch.like_count,`+
            ` scratch.favo_count,scratch.title,scratch.state,scratch.recommented,scratch.description,`+
            ` scratch_like.id AS likeid,`+
            ` scratch_favo.id AS favoid,`+
            ` user.nickname AS author_nickname`+
            ` FROM scratch `+
            ` LEFT JOIN scratch_like ON (scratch_like.userid=${req.session.userid} AND scratch_like.projectid=${req.query.id}) `+
            ` LEFT JOIN scratch_favo ON (scratch_favo.userid=${req.session.userid} AND scratch_favo.projectid=${req.query.id}) `+
            ` LEFT JOIN user ON (user.id=scratch.authorid) `+
            ` WHERE scratch.id=${req.query.id} AND scratch.state>=1 LIMIT 1`;
        }
    
        DB.query(SQL, function (err, SCRATCH) {
            if (err|| SCRATCH.length==0) {
                res.locals.tip = {'opt': 'flash', 'msg':'项目不存在或未发布'};
                res.render('ejs/404.ejs');
                return;
            }
    
            res.locals['is_author'] = (SCRATCH[0].authorid==req.session.userid)?true:false;
            res.locals['project'] = SCRATCH[0];
            res.render('ejs/scratch_play.ejs');
        });
    });
});
//Scratch_play获取源代码数据部分
router.get('/play/project/:filename', function (req, res) {
    var SQL = `SELECT src FROM scratch WHERE id=${req.param('filename')} LIMIT 1`;
    DB.query(SQL, function(err, SCRATCH){
        if (err){
            return;
        }
        if (SCRATCH.length==0){
            return;
        }

        res.status(200).json(JSON.parse(SCRATCH[0].src));
    });
 });
//项目点赞
router.post('/play/like', function (req, res) {
    if (!res.locals.login){
        res.status(200).send( {'status': 'failed','msg': '请先登录'});
        return;
    }

    var pid = req.body['pid'];
    var SQL = `SELECT id FROM scratch_like WHERE userid=${req.session.userid} AND projectid=${pid} LIMIT 1`;
    DB.query(SQL, function(err, LIKE){
        if (err){
            res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
            return;            
        }
        
        if (LIKE.length==0){
            //插入一条点赞记录、scratch表like_count+1
            var UPDATE = `UPDATE scratch SET like_count=like_count+1 WHERE id=${pid} LIMIT 1`;
            DB.query(UPDATE, function(err, SCRATCH){
                if (err|| SCRATCH.changedRows==0){
                    res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                    return;  
                }

                var INSERT =`INSERT INTO scratch_like (userid, projectid) VALUES (${req.session.userid}, ${pid})`;
                DB.query(INSERT, function(err, LIKE){
                    if (err || LIKE.affectedRows == 0){
                        res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                        return; 
                    }

                    res.status(200).send( {'status': '1','opt':1,'msg': '感谢点赞！'});
                });
            });
        } else {
            //删除一条点赞记录、scratch表like_count-1
            var UPDATE = `UPDATE scratch SET like_count=like_count-1 WHERE id=${pid} LIMIT 1`;
            DB.query(UPDATE, function(err, SCRATCH){
                if (err|| SCRATCH.changedRows==0){
                    res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                    return;  
                }

                var INSERT =`DELETE FROM scratch_like WHERE id=${LIKE[0].id} LIMIT 1`;
                DB.query(INSERT, function(err, LIKE){
                    if (err || LIKE.affectedRows == 0){
                        res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                        return; 
                    }

                    res.status(200).send( {'status': '1','opt':-1,'msg': '操作成功'});
                });
            });
        }
    });
});
//项目收藏
router.post('/play/favo', function (req, res) {
    if (!res.locals.login){
        res.status(200).send( {'status': 'failed','msg': '请先登录'});
        return;
    }

    var pid = req.body['pid'];
    var SQL = `SELECT id FROM scratch_favo WHERE userid=${req.session.userid} AND projectid=${pid} LIMIT 1`;
    DB.query(SQL, function(err, FAVO){
        if (err){
            res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
            return;            
        }
        
        if (FAVO.length==0){
            //插入一条收藏记录、scratch表favo_count+1
            var UPDATE = `UPDATE scratch SET favo_count=favo_count+1 WHERE id=${pid} LIMIT 1`;
            DB.query(UPDATE, function(err, SCRATCH){
                if (err|| SCRATCH.changedRows==0){
                    res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                    return;  
                }

                var INSERT =`INSERT INTO scratch_favo (userid, projectid) VALUES (${req.session.userid}, ${pid})`;
                DB.query(INSERT, function(err, FAVO){
                    if (err || FAVO.affectedRows == 0){
                        res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                        return; 
                    }

                    res.status(200).send( {'status': '1','opt':1,'msg': '感谢收藏！'});
                });
            });
        } else {
            //删除一条收藏记录、scratch表favo_count-1
            var UPDATE = `UPDATE scratch SET favo_count=favo_count-1 WHERE id=${pid} LIMIT 1`;
            DB.query(UPDATE, function(err, SCRATCH){
                if (err|| SCRATCH.changedRows==0){
                    res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                    return;  
                }

                var INSERT =`DELETE FROM scratch_favo WHERE id=${FAVO[0].id} LIMIT 1`;
                DB.query(INSERT, function(err, FAVO){
                    if (err || FAVO.affectedRows == 0){
                        res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                        return; 
                    }

                    res.status(200).send( {'status': '1','opt':-1,'msg': '操作成功'});
                });
            });
        }
    });
});
//项目推荐
router.post('/play/reco', function (req, res) {
    if (!res.locals.login){
        res.status(200).send( {'status': 'failed','msg': '请先登录'});
        return;
    }
    if (res.locals.is_admin==0){
        res.status(200).send( {'status': 'failed','msg': '无权做此操作'});
        return;
    }

    var pid = req.body['pid'];
    var SQL = `SELECT recommented FROM scratch WHERE id=${pid} AND state>0 LIMIT 1`;
    DB.query(SQL, function(err, RECO){
        if (err||RECO.length==0){
            res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
            return;            
        }
        
  
        if (RECO[0].recommented==1){
            var t = "推荐";
            var recommented = 0;
        } else {
            var t = "已推荐";
            var recommented = 1;            
        }

        var UPDATE = `UPDATE scratch SET recommented=${recommented} WHERE id=${pid} LIMIT 1`;
        DB.query(UPDATE, function(err, SCRATCH){
            if (err){
                res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                return;  
            }

            res.status(200).send( {'status': '1','t':t,'msg': '操作成功'});
        });
    });
});
//项目开源、闭源
router.post('/play/openSrc', function (req, res) {
    if (!res.locals.login){
        res.status(200).send( {'status': 'failed','msg': '请先登录'});
        return;
    }

    var pid = req.body['pid'];
    var SQL = `SELECT state FROM scratch WHERE id=${pid} AND authorid=${req.session.userid} LIMIT 1`;
    DB.query(SQL, function(err, RECO){
        if (err||RECO.length==0){
            res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
            return;            
        }
        

        var state = 1;
        if (RECO[0].state==1){
            state = 2;
        }

        var UPDATE = `UPDATE scratch SET state=${state} WHERE id=${pid} LIMIT 1`;
        DB.query(UPDATE, function(err, SCRATCH){
            if (err){
                res.status(200).send( {'status': 'failed','msg': '数据错误，请再试一次'});
                return;  
            }

            res.status(200).send( {'status': '1','msg': '操作成功'});
        });
    });
});




//Scratch编程界面
router.get('/edit', function (req, res) {
    res.render('ejs/scratch_edit.ejs');
});

//Scratch内部调用一：获取作品数据：JSON源代码
var SDP = require("./lib/scratch_default_project.js");
router.post('/project/:projectid', function (req, res) {
    console.log('服务器：获取作品JSON源代码');
 
    var projectid = req.params.projectid;
    if (projectid == 0){
        res.status(200).send({status:'ok',src:SDP});
        return;
    }

    var SQL = '';
    if (!res.locals.login){
        SQL = `SELECT * FROM scratch WHERE id=${projectid} AND state>=2 LIMIT 1`;
    }else {
        SQL = `SELECT * FROM scratch WHERE id=${projectid} AND (authorid=${req.session.userid} OR state>=2) LIMIT 1`;
    }
    DB.query(SQL, function(err, SCRATCH) {
        if (err||SCRATCH.length==0) {
            res.status(200).send({'status':"作品不存在或无权打开"});//需要Scratch内部处理
        } else {
            //项目被浏览次数+1
            var UPDATE = `UPDATE scratch SET view_count=view_count+1 WHERE id=${SCRATCH[0].id} LIMIT 1`;
            DB.query(UPDATE, function(err, s) { if (err) {} });

            res.status(200).send({status:'ok',src:SCRATCH[0]});
        }
    });
});

//Scratch内部调用二：获取作品素材：背景、角色、音频。取素材时需要完整的文件路径
router.get('/assets/:filename', function (req, res) {  
    var dir = __dirname.substring(0,__dirname.length-7);// trim('server', 'right');
    var p = dir + '/data/material/asset/' + req.params.filename;
    res.sendFile(p);//必须是绝对路径
});

//保存作品：标题
router.post('/saveProjcetTitle', function (req, res) {
    if (!res.locals.login) {
        res.status(404);
        return;
    }

    var UPDATE =`UPDATE scratch SET title=? WHERE id=${req.body.id} AND authorid=${req.session.userid} LIMIT 1`;
    var VAL = [`${req.body.title}`];
    DB.qww(UPDATE, VAL, function(err,SCRATCH){
        if (err) {
            res.status(404).send({"status":"err"});//返回内容可有可无，，因为客户端没处理
        }else{
            res.status(200).send({"status":"ok"})//返回内容可有可无，因为客户端没处理
        }
    })
});

//保存作品源代码：此时作品已存在。req.body为项目JSON源代码
router.put('/projects/:projectid',function(req, res) {
    console.log('服务器：保存作品JSON源代码');
    if (!res.locals.login) {
        res.status(404);
        return;
    }

    var UPDATE =`UPDATE scratch SET src=? WHERE id=${req.params.projectid} AND authorid=${req.session.userid} LIMIT 1`;
    var VAL = [`${JSON.stringify(req.body)}`];
    DB.qww(UPDATE, VAL, function(err,SCRATCH){
        if (err) {
            res.status(404).send({});
            return;
        }

        res.status(200).json({"status":"ok"})
    })
});

//保存作品：缩略图
router.post('/thumbnail/:projectid', function (req, res) {
    console.warn('开始保存缩略图：'+req.params.projectid);

    // 请求的头部为 'Content-Type': 'image/png'时，用req.on接收文件
    var _data = [];
    req.on('data', function (data) {if (data) { _data['push'](data); }});
    req.on('end', function () {
        //var dir = __dirname.substring(0,__dirname.length-7);// trim('server', 'right');
        var strFileName = './data/scratch_slt/' + req.params.projectid;
        let content = Buffer['concat'](_data);
        fs.writeFile(strFileName, content, function (err) {
        if (err) {
            res.status(404).send({ 'status': 'err' });
            console.log(err);
            console.warn('保存缩略图失败：'+strFileName);
        } else {
            console.warn('保存缩略图成功：'+strFileName);
            res.status(200).send( { 'status': 'ok' });
        }
        });
    });
});

//分享作品：
router.post('/shareProject/:projectid',function(req, res) {
    console.log('服务器：开始分享作品');    
    if (!res.locals.login) {
        res.status(404);
        return;
    }
    //只能分享自己的作品
    var UPDATE =`UPDATE scratch SET state=1 WHERE id=${req.params.projectid} AND authorid=${req.session.userid} LIMIT 1`;
    DB.query(UPDATE, function (err, U) {
        if (err) {res.send(404); return;}
        console.log('服务器：分享作品成功');
        res.status(200).send( {'status': 'ok'});
    });
});

//保存新作品：保存源代码及作品名称。req.body为项目JSON源代码,?title=作品名称
router.post('/projects',function(req, res) {
    console.log('服务器：新建作品JSON源代码');

    if (!req.body) {res.send(404); return;}
    var title = '新作品'
    if (req.query.title) { title = req.query.title;}
   
    var INSERT =`INSERT INTO scratch (authorid, title, src) VALUES (${req.session.userid}, ?, ?)`;
    var VAL = [title,`${JSON.stringify(req.body)}`];
    DB.qww(INSERT, VAL, function (err, newScratch) {
        if (err){
            console.error(err);
            res.send(404);
            return;
        }

        if (newScratch.affectedRows==0) {
            console.error("数据格式有误，保存作品失败");
            res.send(404);
            return;
        }

        res.status(200).send( {
            'status': 'ok',
            'id':newScratch['insertId'],
        });
    });
});

//新作品：保存作品素材
router.post('/assets/:filename', function (req, res) {
    var strFileName = './data/material/asset/' + req.params.filename;
    fs.exists(strFileName, function (bExists) {
        if (bExists) {
            console.warn('素材已存在：'+strFileName);
            res.status(200).send( {'status': 'ok'});
        } else {
            var _data = [];
            req.on('data', function (data) {if (data) { _data['push'](data); }});
            req.on('end', function () {
                let content = Buffer['concat'](_data);
                fs.writeFile(strFileName, content, function (err) {
                    if (err) {
                        console.warn('素材保存失败：'+strFileName);
                        res.send(404);
                    } else {
                        console.warn('素材保存成功：'+strFileName);
                        res.status(200).send( {'status': 'ok'});
                    }
                });
            });
        }
    });
});

module.exports = router;
