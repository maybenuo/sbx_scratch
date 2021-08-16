//公用小函数库
const crypto = require('crypto');

//以md5的格式创建一个哈希值
exports.md5 = function md5(data){
    let hash = crypto.createHash('md5');
    return hash.update(data).digest('base64');
};
//检查用户密码格式
exports.userpwTest = function(pw) {
    var reg = /^(?:\d+|[a-zA-Z]+|[!@#$%^&*]+){6,16}$/;
    return reg['test'](pw);
};
//检查手机号码是否正确
exports.usernameTest = function(No) {
    var reg = /^(?:\d+|[a-zA-Z]+){6,16}$/;
    return reg['test'](No);
};
exports.phoneTest = function(No) {
    var reg = /^1[3456789]\d{9}$/;
    return reg['test'](No);
};

//常用数据结构
exports.msg_fail = {'status': 'fail', 'msg': '请再试一次'};
