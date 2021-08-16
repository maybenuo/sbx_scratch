function sooncoming(){
	layer.msg('此功能请参考官网... ...');
}

//服务器通信============================
function AjaxFn(url, data, callbackFn) {
    $.ajax({
        'url': url,
        'type': 'POST',
        'data': data,
        'success': function(d) {
            callbackFn(d);
        },
        'error': function(err) {}
    });
}


//文本格式检查功能函数============================
var phoneTest = function(No) {
    var reg = /^1[3456789]\d{9}$/;
    return reg['test'](No);
};
var usernameTest = function(pw) {
    var reg = /^(?:\d+|[a-zA-Z]+){6,16}$/;
    return reg['test'](pw);
};
var userpwdTest = function(pw) {
    var reg = /^(?:\d+|[a-zA-Z]+|[!@#$%^&*]+){6,16}$/;
    return reg['test'](pw);
};
var spaceTest = function(str) {
    var reg = /^\s*$/;
    return reg['test'](str);
};
var emailTest = function(EMail) {
    var reg = /^[A-Za-z\d]+([-_.][A-Za-z\d]+)*@([A-Za-z\d]+[-.])+[A-Za-z\d]{2,4}$/;
    return reg['test'](EMail);
};
var strTest = function(v) {
    var reg = new RegExp("[`~!@%#$^&*()=|{}':;',\\[\\]<>/?\\.；：%……+￥‘”“'。，？]");
    return reg.test(v);
};
var codeTest = function(v) {
    var reg = /^([A-Za-z0-9]+){6,10}$/;
    return reg['test'](v);
};
var domainTest = function(v) {
    var reg = /^([a-z0-9]+){1,16}$/;
    return reg['test'](v);
};
var numberTest = function(v) {
    var reg = /^([0-9]+){1,24}$/;
    return reg['test'](v);
};


//个人中心：个人信息部分===============================
//更新密码
function updatePassword() {
	oldPW = $('#old_password').val(),
	newPW = $('#new_password').val();

	if (!userpwdTest(oldPW)){
		$('#old_password').focus();
		layer.msg('原密码格式错误');
		return;
	}
	if (!userpwdTest(newPW)){
		$('#new_password').focus();
		layer.msg('新密码格式错误');
		return;
	}

	if (oldPW==newPW){
		layer.msg('新老密码相同，无需更改');
		return;	
	}

	AjaxFn('/my/set/pw', {'oldpw':oldPW,'newpw':newPW}, function (res) {
		if ('ok' == res['status']) {
			layer.closeAll();
			layer.msg('密码修改成功！');
		} else{
			layer.msg(res['status']);
		}
	})
};
//修改密码:弹出窗口
function openWindow_PW(){
	layer.open({
		type: 1
		,shadeClose: true
		,title: '修改密码'
		,area: ['320px', '320px']
		,content:
		`<div style="margin:12px">
			<input class="layui-input" id='old_password' type="text" maxlength="16" placeholder="原密码" style="margin-top:18px;">
			<input class="layui-input" id='new_password' type="text" maxlength="16" placeholder="新密码：数字+写字母+!@#$%^&*" style="margin:28px 0;">
			<div class="layui-btn" onclick="updatePassword()" style="width:180px; line-height:48px; height:48px; margin: 18px 0 20px 58px">修改密码</div>
		</div>`
	});
}

//修改头像
var upload = layui.upload;
upload.render({
	elem: '.avatarUpload'
	,url: '/my/set/avatar'
	,accept: 'file'
	,done: function(res, index, upload){
		if (res.status=="ok"){
			window.location.reload();
		}else{
			layer.msg(res.status);
		}
	}
})

//获取验证码
function get_yzm(obj) {
	layer.msg('开源版本，无短信接口');
};
//判断参数并上传到服务器
function updateUsername(){
	var pw = $("#old_password").val();
	if (!userpwdTest(pw)) {
		$("#old_password").focus();
		layer.msg('密码格式:6~16长度,数字+字母+!@#$%^&*');
		return;
	}
	
	var un = $("#new_username").val();
	if (!phoneTest(un)) {
		$("#new_username").focus();
		layer.msg('手机号格式不正确');
		return;
	}
	
	if (!_GT_Tag.getValidate()) {
		layer.msg('请验证手机号');
		return;
	}
	
	var yzm = $('#yzm_input').val();
	if (yzm.length!=4){
		$("#yzm_input").focus();
		layer.msg('请输入验证码');
		return;
	}

	layer.msg('开源版本，无短信接口');
}
//升级账号//弹出窗口
function openWindow_UN(){
	layer.open({
		type: 1
		,shadeClose: true
		,title: '账号升级'
		,area: ['320px', '380px']
		,content:
		`<div style="margin:12px">
			<input class="layui-input"id='old_password' type="text" maxlength="16" placeholder="账号密码">
			<input class="layui-input" id='new_username' type="text" maxlength="11" placeholder="手机号" style="margin:28px 0" >
			<div style="display:flex">
				<input class="layui-input" id='yzm_input' style="width: 100%;margin-right: 0;" type="text" maxlength="6" placeholder="短信验证码">
				<button class="layui-btn layui-btn-danger" onclick="get_yzm(this)" type="button"  style="border-radius: 0;margin:0;padding: 0; width: 12em; height: 40px;">获取验证码</button>
			</div>
			<div class="layui-btn" onclick="updateUsername()" style="width:180px; line-height:48px; height:48px; margin: 58px 0 20px 58px">升级账号</div>
		</div>`
	});
}

//修改昵称等信息
function updataInfo() {
	var nickname = $('#my_nickname')['val']();
	if (('' == nickname) || (nickname.length > 16)) {
		$('#my_nickname')['focus']();
		layer['msg']('昵称长度不正确');
		return;
	}

	var data = {
		'nickname': nickname,
		'sex': $("input[name='1']:checked")['val'](),
		'year': $('#sel_year')['val'](),
		'month': $('#sel_month')['val'](),
		'day': $('#sel_day')['val'](),
		'aboutme': $('#my_aboutme')['val']()
	};

	AjaxFn('/my/set/userinfo', data, function (res) {
		layer.msg(res.status);
	});
};
