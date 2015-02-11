var _ = require('lodash');
var apn = require('apn');
var util = require('util');
var EventEmitter = require("events").EventEmitter;

function ApnManager(apnConnection, apnFeedback, logger)
{
    this.apnConnection = apnConnection;
    this.apnFeedback = apnFeedback;
    this.logger = logger;

    var self = this;

    // Handling APNS events
    this.apnConnection.on('connected', function(){
        self.logger.info("Connected to APNS.");
    });

    this.apnConnection.on('disconnected', function(){
        self.logger.info("Disconnected from APNS.");
    });

    this.apnConnection.on('transmitted', function(notification, device){
        self.logger.info("Notification transmitted to:" + device.token.toString('hex'));
    });

    this.apnConnection.on('socketError', function(err){
        self.logger.error(err);
    });

    this.apnConnection.on('transmissionError', function(errCode, notification, device) {
        self.logger.info("Notification caused error: " + errCode + " for device ", device.toString('hex').toUpperCase(), notification);

        switch(errCode)
        {
            case 8:
                var token = device.toString('hex').toUpperCase();
                self.logger.info("APN error 8: need to remove device " + token);
                self.emit('deviceToRemove', token);
                break;
        }
    });

    // Handling APNS feedback events
    this.apnFeedback.on('feedbackError', function(err){
        self.logger.error(err);
    });

    this.apnFeedback.on('feedback', function(feedbackData){
        var time;
        var device;
        
        self.logger.info("Received a feedback with data: " + JSON.stringify(feedbackData));

        for(var i in feedbackData) {
            time = feedbackData[i].time;
            device = feedbackData[i].device.toString('hex').toUpperCase();

            self.logger.info("Device: " + device + " has been unreachable, since: " + time);
            this.emit('deviceToRemove',  device);
        }
    });
}

util.inherits(ApnManager, EventEmitter);

ApnManager.prototype.push = function(tokens, payload){
    this.logger.info("Sending " + JSON.stringify(payload) + " to ios devices.");
    this.apnConnection.pushNotification(payload, tokens);
};

ApnManager.prototype.buildPayload = function(options){
    var notif = new apn.Notification(options.payload);

    notif.expiry = options.expiry || 0;
    notif.alert = options.alert;
    notif.badge = options.badge;
    notif.sound = options.sound;

    return notif;
};

module.exports = ApnManager;