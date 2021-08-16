//图片滑动验证
function doGeeTest(GT_CallBack){
    $.ajax({
        'url': ('/user/gt_slide?t=' + new Date().getTime()),
        'type': 'get',
        'dataType': 'json',
        'success': function (resD) {
            initGeetest({
                'gt': resD['gt'],
                'challenge': resD['challenge'],
                'offline': !resD['success'],
                'new_captcha': resD['new_captcha'],
                'product': 'bind',
                'width': '300px'
            }, GT_CallBack);
        }
    });
}
var _GT_Tag;
var GT_CallBack = function (GT_Tag) {
    _GT_Tag = GT_Tag
    GT_Tag['appendTo']('#captcha'),
    GT_Tag['onReady'](function () { $('#wait')['hide'](); });
};  
doGeeTest(GT_CallBack);

//定时器:设置按钮文本
var s = 60;
function Timer(tag) {
    if (0 == s) {
        s = 60
        $(tag).attr('disabled', !1);
        $(tag).text('获取验证码');
    } else {
        s--;
        $(tag).attr('disabled', !0);
        $(tag).text('重新发送(' + s + ')');
        setTimeout(function () { Timer(tag); }, 1000);
    }
};
//获取验证码
function getYZM(obj) {
	layer.msg('开源版本，无短信接口');
};
//找回密码
function getPW() {
    var un = $("#getPW_username").val();
    if (!phoneTest(un)) {
        $("#getPW_username").focus();
        layer.msg('手机号格式不正确');
        return;
    }
    if (!_GT_Tag.getValidate()) {
        layer.msg('请做注册验证');
        return;
    }
    var yzm = $('#yzm_input').val();
    if (yzm.length!=4){
        $("#yzm_input").focus();
        layer.msg('请输入验证码');
        return;
    }
    var pw = $("#getPW_password").val();
    if (!userpwdTest(pw)) {
        $("#getPW_password").focus();
        layer.msg('密码格式:6~16长度,数字+字母+!@#$%^&*');
        return;
    }

	layer.msg('开源版本，无短信接口');
}

//注册界面，点击注册按钮
function register() {
    var un = $("#reg_username").val();
    if (!usernameTest(un)) {
        $("#reg_username").focus();
        layer.msg('账号格式：字母+数字');
        return;
    }
    if (phoneTest(un)) {
        $("#reg_username").focus();
        layer.msg('手机号不能直接用于注册账号');
        return;
    }

    var pw = $("#reg_password").val();
    if (!userpwdTest(pw)) {
        $("#reg_password").focus();
        layer.msg('密码格式:6~16长度,数字+字母+!@#$%^&*');
        return;
    }

    _GT_Tag['onSuccess'](function () {
        AjaxFn('/user/register', {un:un, pw:pw}, function (res) {
            ('ok'==res['status']) ? window.location.href = '/' : layer.msg(res['status']);
        });
    })
    _GT_Tag.verify()
}

//登录界面，点击登录按钮
function login() {
    var un = $("#username").val();
    if (!usernameTest(un)) {
        $("#username").focus();
        layer.msg('请填写正确的账号：字母+数字');
        return;
    }

    var pw = $("#password").val();
    if (!userpwdTest(pw)) {
        $("#password").focus();
        layer.msg('密码不正确');
        return;
    }

    AjaxFn('/user/login', { 'un': un, 'pw': pw },function (res) {
        if ('OK' == res.status) {
            window.location.reload();
        }else{
            layer.msg(res.status);
        }
    })
}

function switchPage(goPage) {
    $(`#${goPage}`).show().siblings().hide();
}
