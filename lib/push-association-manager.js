var _ = require('lodash');
var PushAssociation = require('./model/push-association');

function PushAssociationManager(removeDuplicatedDevices, logger)
{
    this.removeDuplicatedDevices = removeDuplicatedDevices;
    this.logger = logger;

    this.addDevice = function(user, deviceType, token){
        var self = this;

        var pushItem = new PushAssociation({user: user, type: deviceType, token: token});
        pushItem.save();

        self.logger.info("Registered " + user +  " for "+ deviceType + " with token " + token);
    };
}

PushAssociationManager.prototype.add = function (user, deviceType, token) {
    var self = this;

    if(this.removeDuplicatedDevices)
    {
        PushAssociation.remove({token: token}, function (err, n) {
            self.logger.info("Removed duplicated token " + token + " from " + n + " user.");
            self.addDevice(user, deviceType, token);
        });
    }else{
        self.addDevice(user, deviceType, token);
    }
};

PushAssociationManager.prototype.updateTokens = function (fromToArray) {
    var self = this;
    fromToArray.forEach(function (tokenUpdate) {
        PushAssociation.findOneAndUpdate({token: tokenUpdate.from}, {token: tokenUpdate.to}, function (err) {
            if (err) {
                if (err.message.indexOf("E11000 duplicate key") > -1) {
                    self.logger.info("Can not update device because it already exists,  removing it.");
                    self.removeDevice(tokenUpdate.from);
                } else {
                    throw err;
                }
            }
        });
    });
};

PushAssociationManager.prototype.getAll = function (callback) {
    var wrappedCallback = outputFilterWrapper(callback);

    PushAssociation.find(callback);
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
        if (err) throw err;
        self.logger.info("Removed user " + user );
    });
};

PushAssociationManager.prototype.removeDevice = function (token) {
    var self = this;
    PushAssociation.remove({token: token}, function (err) {
        if (err) throw err;
        self.logger.info("Removed device " + token );
    });
};

PushAssociationManager.prototype.removeDevices = function (tokens) {
    var self = this;
    
    this.logger.info("Removing " + JSON.stringify(tokens));

    PushAssociation.remove({token: {$in: tokens}}, function (err) {
        if (err) throw err;
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