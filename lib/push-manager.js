var _ = require('lodash');

function PushManager(apnManager, gcmManager, pushAssociationManager, logger)
{
    this.apnManager = apnManager;
    this.gcmManager = gcmManager;
    this.logger = logger;
    this.pushAssociationManager = pushAssociationManager;
}

var send = function (pushAssociations, androidPayload, iosPayload) {
    var androidTokens = _(pushAssociations).where({type: 'android'}).map('token').value();
    var iosTokens = _(pushAssociations).where({type: 'ios'}).map('token').value();

    if (androidPayload && androidTokens.length > 0) {
        var gcmPayload = this.gcmManager.buildPayload(androidPayload);
        this.gcmManager.push(androidTokens, gcmPayload);
    }

    if (iosPayload && iosTokens.length > 0) {
        var apnPayload = this.apnManager.buildPayload(iosPayload);
        this.apnManager.push(iosTokens, apnPayload);
    }
};

var sendUsers = function (users, payload) {
    this.pushAssociationManager.getForUsers(users, function (err, pushAss) {
        if (err) return;
        send(pushAss, payload);
    });
};

var subscribe = function (deviceInfo) {
    this.pushAssociationManager.add(deviceInfo.user, deviceInfo.type, deviceInfo.token);
};

var unsubscribeDevice = function (deviceToken) {
    this.pushAssociationManager.removeDevice(deviceToken);
};

var unsubscribeUser = function (user) {
    this.pushAssociationManager.removeForUser(user);
};

module.exports = PushManager;