var mongoose = require('mongoose');
var _ = require('lodash');
var PushAssociation = require('./model/push-association');


var add = function (user, deviceType, token) {

    PushAssociation.remove({token: token}, function (err, n) {
        console.log(new Date().toString() + ": Removed " + token + " from " + n + " user.");

        var pushItem = new PushAssociation({user: user, type: deviceType, token: token});
        pushItem.save();

        console.log(new Date().toString() + ": Registered " + user +  " for "+ deviceType + " with token " + token);
    });
};

var updateTokens = function (fromToArray) {
    fromToArray.forEach(function (tokenUpdate) {
        PushAssociation.findOneAndUpdate({token: tokenUpdate.from}, {token: tokenUpdate.to}, function (err) {
            if (err) console.error(new Date().toString() + ": " +err);
        });
    });
};

var getAll = function (callback) {
    var wrappedCallback = outputFilterWrapper(callback);

    PushAssociation.find(wrappedCallback);
};

var getForUser = function (user, callback) {
    var wrappedCallback = outputFilterWrapper(callback);

    PushAssociation.find({user: user}, wrappedCallback);
};

var getForUsers = function (users, callback) {
    var wrappedCallback = outputFilterWrapper(callback);

    PushAssociation.where('user')
        .in(users)
        .exec(wrappedCallback);
};

var removeForUser = function (user) {
    PushAssociation.remove({user: user}, function (err) {
        if (err) console.dir(new Date().toString() + ": " +err);
    });
};

var removeDevice = function (token) {
    PushAssociation.remove({token: token}, function (err) {
        if (err) console.log(new Date().toString() + ": " +err);
    });
};

var removeDevices = function (tokens) {
    console.log(new Date().toString() + " : Removing " + JSON.stringify(tokens));

    PushAssociation.remove({token: {$in: tokens}}, function (err) {
        if (err) console.log(new Date().toString() + ": " +err);
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

var initWrapper = function (object) {
    return _.transform(object, function (newObject, func, funcName) {
        if(!_.isFunction(func)) return newObject[funcName] = func;

        newObject[funcName] = function () {
            if (_.isUndefined(PushAssociation)) {
                initialize();
            }

            return func.apply(null, arguments);
        };
    });
};

var errorHandler = function(error) {
    console.error(new Date().toString() + ": " +'ERROR: ' + error);
};

module.exports = initWrapper({
    add: add,
    updateTokens: updateTokens,
    getAll: getAll,
    getForUser: getForUser,
    getForUsers: getForUsers,
    removeForUser: removeForUser,
    removeDevice: removeDevice,
    removeDevices: removeDevices
});