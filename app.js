var express = require('express');
var _ = require('lodash');
var PushAssociationManager = require('./lib/push-association-manager');
var PushManager = require('./lib/push-manager');
var winston = require('winston');
var mongoose = require('mongoose');
var config = GLOBAL.config;
var apn = require('apn');
var app = express();
var ApnManager = require('./lib/apn-manager');
var GcmManager = require('./lib/gcm-manager');
var bodyParser = require('body-parser');
var gcm = require('node-gcm');
var basic = require('./middlewares/basic');

// Creating logger 
var transports = [];

transports.push(new (winston.transports.Console)({
    "timestamp": true,
    "colorize": true,
    "handleExceptions": true
}));

var logger = new (winston.Logger)({
    transports: transports
});

app.logger = logger;
app.engine('jade', require('jade').__express);

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

// Creating push association manager
var pushAssociationManager = new PushAssociationManager(config.removeDuplicatedDevices || false, logger);
app.pushAssociationManager = pushAssociationManager;

// Creating APN
var apnConnection = new apn.Connection(config.apn.connection);
var apnFeedbackConnection = new apn.Feedback(config.apn.feedback);

var apnManager = new ApnManager(apnConnection, apnFeedbackConnection, logger);
app.apnManager = apnManager;

// Creating GCM sender
var gcmSender = new gcm.Sender(config.gcm.apiKey);
var gcmManager = new GcmManager(gcmSender, pushAssociationManager, logger);

apnManager.on('deviceToRemove', function (device){
    // We can no reuse removeDeviceByToken here so me use callback
    logger.info("Received a deviceToRemove event for device " + device);
    pushAssociationManager.removeDevice(device);
});

// Creating Manager
var pushManager = new PushManager(apnManager, gcmManager, pushAssociationManager, logger);
app.pushManager = pushManager;

app.credentials = config.credentials;

var baseUrl = '/';
if (config.urlPrefix !== undefined){
    baseUrl += config.urlPrefix;
}
app.baseUrl = baseUrl;

// Middleware
if(config.credentials !== undefined){
    app.use(basic.Auth);
}

app.use(function(req, res, next) {
    res.locals.baseUrl = req.app.baseUrl;
    next();
});

app.use(bodyParser.json());
app.use(app.baseUrl+"/public", express.static(__dirname + '/public'));
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send('error', { error: err });
});

app.post('/*', function (req, res, next) {
    if (req.is('application/json')) {
        next();
    } else {
        res.status(406).send();
    }
});

app.use(app.baseUrl, require('./routes/push'));
app.use(app.baseUrl, require('./routes/association'));

module.exports = app;
