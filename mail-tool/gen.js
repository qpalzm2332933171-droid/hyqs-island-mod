/* 邮件 payload 生成核心 (浏览器/Node 通用) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./md5.js')); }
  else { root.MailGen = factory(root.MD5); }
})(typeof self !== 'undefined' ? self : this, function (md5) {
  'use strict';
  var SECRET = 'apsdfAJOJ(#@&($0809283JLJOOJ';
  var FIELDS = ['id', 'type', 'goods', 'to_user', 'createTime', 'deadline', 'coin'];

  function calcToken(mail) {
    var s = '';
    for (var i = 0; i < FIELDS.length; i++) s += String(mail[FIELDS[i]]);
    return md5(s + SECRET);
  }

  /* selected: [{id, count}] ; 返回 "id:count;id:count" */
  function buildGoods(selected) {
    var parts = [];
    for (var i = 0; i < selected.length; i++) {
      var it = selected[i];
      var c = Math.floor(Number(it.count));
      if (!c || c < 1) continue;
      parts.push(String(it.id) + ':' + c);
    }
    return parts.join(';');
  }

  /* opts: {mailId, title, message, coin, toUser, fromUser, nick, channel, type,
            createTime, deadline, selected} */
  function buildMail(opts) {
    var mail = {
      id: Number(opts.mailId),
      title: opts.title || '',
      nick: opts.nick || '',
      type: opts.type || 'item',
      message: opts.message || '',
      goods: buildGoods(opts.selected),
      createTime: Number(opts.createTime),
      deadline: Number(opts.deadline),
      valid: 1,
      from_user: opts.fromUser || '',
      to_user: String(opts.toUser),
      channel: opts.channel || '_',
      is_receive: 0,
      is_open: 0,
      coin: Number(opts.coin) || 0
    };
    mail.token = calcToken(mail);
    return mail;
  }

  function buildResponse(mail, nowMs) {
    return {
      errorCode: 0,
      errorMsg: '',
      data: { goods_from_channel: [], goods_from_user: [mail] },
      time: nowMs
    };
  }

  return {
    SECRET: SECRET,
    FIELDS: FIELDS,
    calcToken: calcToken,
    buildGoods: buildGoods,
    buildMail: buildMail,
    buildResponse: buildResponse
  };
});
