var _ = require('lodash');

function PushManager(apnManager, gcmManager, pushAssociationManager, logger)
{
    this.apnManager = apnManager;
    this.gcmManager = gcmManager;
    this.logger = logger;
    this.pushAssociationManager = pushAssociationManager;
}

PushManager.prototype.send = function (pushAssociations, androidPayload, iosPayload) {
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

PushManager.prototype.send = function (users, payload) {
    this.pushAssociationManager.getForUsers(users, function (err, pushAss) {
        if (err) return;
        this.send(pushAss, payload);
    });
};

PushManager.prototype.send = function (deviceInfo) {
    this.pushAssociationManager.add(deviceInfo.user, deviceInfo.type, deviceInfo.token);
};

PushManager.prototype.send = function (deviceToken) {
    this.pushAssociationManager.removeDevice(deviceToken);
};

PushManager.prototype.send = function (user) {
    this.pushAssociationManager.removeForUser(user);
};

module.exports = PushManager;