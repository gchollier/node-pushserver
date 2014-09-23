var mongoose = require('mongoose');
var _ = require('lodash');
var PushAssociation = require('./model/push-association');

function PushAssociationManager()
{

}

PushAssociationManager.prototype.add = function (user, deviceType, token) {
    var self = this;

    PushAssociation.remove({token: token}, function (err, n) {
        self.logger.log(new Date().toString() + ": Removed " + token + " from " + n + " user.");

        var pushItem = new PushAssociation({user: user, type: deviceType, token: token});
        pushItem.save();

        self.logger.log(new Date().toString() + ": Registered " + user +  " for "+ deviceType + " with token " + token);
    });
};

PushAssociationManager.prototype.updateTokens = function (fromToArray) {
    var self = this;
    fromToArray.forEach(function (tokenUpdate) {
        PushAssociation.findOneAndUpdate({token: tokenUpdate.from}, {token: tokenUpdate.to}, function (err) {
            if (err) self.logger.error(new Date().toString() + ": " +err);
        });
    });
};

PushAssociationManager.prototype.getAll = function (callback) {
    var wrappedCallback = outputFilterWrapper(callback);

    PushAssociation.find(wrappedCallback);
};

PushAssociationManager.prototype.getForUser = function (user, callback) {
    var wrappedCallback = outputFilterWrapper(callback);

    PushAssociation.find({user: user}, wrappedCallback);
};

PushAssociationManager.prototype.getForUsers = function (users, callback) {
    var wrappedCallback = outputFilterWrapper(callback);

    PushAssociation.where('user')
        .in(users)
        .exec(wrappedCallback);
};

PushAssociationManager.prototype.removeForUser = function (user) {
    var self = this;

    PushAssociation.remove({user: user}, function (err) {
        if (err) self.logger.dir(new Date().toString() + ": " +err);
    });
};

PushAssociationManager.prototype.removeDevice = function (token) {
    var self = this;
    PushAssociation.remove({token: token}, function (err) {
        if (err) self.logger.log(new Date().toString() + ": " +err);
    });
};

PushAssociationManager.prototype.removeDevices = function (tokens) {
    var self = this;
    this.logger.log(new Date().toString() + " : Removing " + JSON.stringify(tokens));

    PushAssociation.remove({token: {$in: tokens}}, function (err) {
        if (err) self.logger.log(new Date().toString() + ": " +err);
    });
};

var outputFilterWrapper = function (callback) {
    return function (err, pushItems) {
        if (err) return callback(err, null);

        var items = _.map(pushItems, function (pushItem) {
            return _.pick(pushItem, ['user', 'type', 'token']);
        });

        return callback(null, items);
    };
};

module.exports = PushAssociationManager;