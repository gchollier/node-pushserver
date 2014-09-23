var express = require('express');
var _ = require('lodash');
var PushAssociationManager = require('./lib/push-association-manager');
var PushManager = require('./lib/push-manager');
var winston = require('winston');
var winstonEmail = require('winston-mail').Mail;
var mongoose = require('mongoose');
var config = GLOBAL.config;
var apn = require('apn');
var app = express();
var ApnManager = require('./lib/apn-manager');
var GcmManager = require('./lib/gcm-manager');
var PushManager = require('./lib/push-manager');
var bodyParser = require('body-parser');
var gcm = require('node-gcm');

// Creating logger 
var transports = [];

if(config.logger === undefined)
{
    config.logger = {
        transposrts : {
            Console: {
                timestamp: true,
                colorize: true,
                handleExceptions: true
            }
        }
    };
}

for(var type in config.logger.transports)
{
    switch(type)
    {
        case 'Mail':
            transports.push(new (winston.transports.Mail)(config.logger.transports[type]));
            break;
        case 'Console':
            transports.push(new (winston.transports.Console)(config.logger.transports[type]));
            break;
        default:
            console.log("Bad transport type");
    }
}

var logger = new (winston.Logger)({
    transports: transports
});

app.logger = logger;

// Connecting to mongo 
mongoose.connect(config.mongodbUrl);

// When successfully connected
mongoose.connection.on('connected', function () {
  logger.info('Mongoose default connection open');
});

// If the connection throws an error
mongoose.connection.on('error',function (err) {
  logger.error('Mongoose default connection error: ' + err);
});
 
// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  logger.error('Mongoose default connection disconnected');
});

// Creating APN
var apnConnection = new apn.Connection(config.apn.connection);
var apnFeedbackConnection = new apn.Feedback(config.apn.feedback);

var apnManager = new ApnManager(apnConnection, apnFeedbackConnection, logger);
app.apnManager = apnManager;

// Creating GCM sender
var gcmSender = new gcm.Sender(config.gcm.apiKey);
var gcmManager = new GcmManager();

var pushAssociationManager = new PushAssociationManager(config.removeDuplicatedDevices || false, logger);
app.pushAssociationManager = pushAssociationManager;


apnManager.on('deviceToRemove', function (device){
    // We can no reuse removeDeviceByToken here so me use callback
    logger.info("Received a deviceToRemove event for device " + device);
    pushAssociationManager.removeDevice(device);
});

// Creating Manager
var pushManager = new PushManager(apnManager, gcmManager, pushAssociationManager, logger);
app.pushManager = pushManager;

// Middleware
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

app.use(function(err, req, res, next) {
    res.status(500);
    res.render('error', { error: err });
});

app.post('/*', function (req, res, next) {
    if (req.is('application/json')) {
        next();
    } else {
        res.status(406).send();
    }
});

app.use('/', require('./routes/push'));
app.use('/', require('./routes/association'));


module.exports = app;
