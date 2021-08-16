var table = layui.table;
var _table_render = table.render({
    elem: '#TableOne'
    , url: '/admin/user/data'
    , where:{s:0}
    , toolbar: '#TableOne_bar'
    , page: true
    , cols: [[
        { field: 'username', width: 120, title: '账号' }
        , { field: 'nickname', title: '昵称' }
        , { title: '作品查看', width: 100, align: "center", templet: "#tyTpl",event:'see_works'}
        , { title: '课程查看', width: 100, align: "center", templet: "#tyTpl",event:"see_course"}
        , { field: 'regTime', width: 180, title: '注册时间' }
        , { title: '操作', width:150, toolbar: '#TableOne_tool'}
    ]]
    , parseData: function (res) {
        //_data = res;
        return {
            "code": 0,
            "msg": "",
            "count": res.count,
            "data": res.data
        };
    }
});
table.on('toolbar(TableOne)', function (obj) {
    if (obj.event === 'getZC') {
        _table_render.reload({where: {s: 0},page: {curr: 1}});
    } else if (obj.event === 'getFH') {
        _table_render.reload({where: {s: 2},page: {curr: 1}});
    } else if (obj.event === 'search') {
        layer.prompt({title:'请输入查找的账号',formType:0, maxlength: 16,shadeClose:true}, function (v, index) {
            _table_render.reload({where: {s:9, t:v},page: {curr: 1}});
            layer.close(index);
        });
    } else if (obj.event === 'new') {
        layer.prompt({title:'添加新用户',formType:0, maxlength: 16,shadeClose:true}, function (v, index) {
            if (!usernameTest(v)) {
                layer.msg('账号格式不正确');
                return;
            }

            AjaxFn('/admin/user_new', {'un': v }, function (res){
                layer.msg(res['msg']);
                if ('success' == res['status']){
                    layer.close(index);
                }
            })
        });
    }
});
//监听行工具事件
table.on('tool(TableOne)', function (obj) {
    if (obj.event === 'setpwd') {
        var vv = obj.data.username.substring(obj.data.username.length-6);
        layer.prompt({title:obj.data.username+'密码重置',value:vv,formType:0, maxlength: 12,shadeClose:true}, function (v, index) {
            if (!userpwdTest(v)) {
                layer.msg('密码格式不正确');
                return;
            }

            AjaxFn('/admin/user_setpwd', {'un': obj.data.username,'pw':v }, function (res){
                layer.msg(res['msg']);
                if ('success' == res['status']){
                    layer.close(index);
                }
            })
        });      
    } else if (obj.event === 'fh') {
        layer.confirm('即将对此用户封号？',{title:'重要提示',shadeClose:true}, function (index) {
            AjaxFn('/admin/user_setstate', {'id': obj.data.id,'s':'2'}, function (res){
                layer.msg(res['msg']);
                if ('success' == res['status']){
                    obj.del();
                    layer.close(index);
                }
            })
        });
    } else  if (obj.event === 'jf') {
        layer.confirm('即将对此账号进行解封？',{title:'重要提示',shadeClose:true}, function (index) {
            AjaxFn('/admin/user_setstate', {'id': obj.data.id,'s':'0'}, function (res){
                layer.msg(res['msg']);
                if ('success' == res['status']){
                    obj.del();
                    layer.close(index);
                }
            })
        });
    }
});
