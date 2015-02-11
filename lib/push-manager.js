var _ = require('lodash');

function PushManager(apnManager, gcmManager, logger)
{
    this.apnManager = apnManager;
    this.gcmManager = gcmManager;
    this.logger = logger;
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

module.exports = PushManager;