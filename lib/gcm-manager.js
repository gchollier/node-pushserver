var config = GLOBAL.config;
var _ = require('lodash');
var pushAssociations = require('./PushAssociations');
var gcm = require('node-gcm');


function GcmManager(gcmSender, logger)
{
    this.gcmSender = gcmSender;
}

var handleResults = function (results) {
    var idsToUpdate = [],
        idsToDelete = [];

    results.forEach(function (result) {
        if (!!result.registration_id) {
            idsToUpdate.push({from: result.token, to: result.registration_id});

        } else if (result.error === 'InvalidRegistration' || result.error === 'NotRegistered') {
            idsToDelete.push(result.token);
        }
    });

    if (idsToUpdate.length > 0) pushAssociations.updateTokens(idsToUpdate);
    if (idsToDelete.length > 0) pushAssociations.removeDevices(idsToDelete);
};

GcmManager.prototype.push = function (tokens, message)
{
    this.gcmSender.send(message, tokens, 4, function (err, res) {
        if(err) console.log(new Date().toString() + ": " +err);

        if (res && res.failure > 0) {
            var mappedResults = _.map(_.zip(tokens, res.results), function (arr) {
                return _.merge({token: arr[0]}, arr[1]);
            });

            handleResults(mappedResults);
        }
    });
};

GcmManager.prototype.buildPayload = function (options) {
    return new gcm.Message(options);
};

module.exports = GcmManager;