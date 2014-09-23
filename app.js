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

var gcm = require('node-gcm');

// Creating logger 
var transports = [];

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
mongoose.connect(config.database, function(err){
    if(err) {
        throw err;
    }
});

// Creating APN
var apnConnection = new apn.Connection(config.apn);

var apnManager = new ApnManager(apnConnection, logger);
app.apnManager = apnManager;

// Creating GCM sender
var gcmSender = new gcm.Sender(config.get('gcm').apiKey);
var gcmManager = new GcmManager();

var pushAssociationManager = new PushAssociationManager();
app.pushAssociationManager = pushAssociationManager;

// Creating Manager
var pushManager = new PushManager(apnManager, gcmManager, pushAssociationManager, logger);
app.pushManager = pushManager;


// Middleware
app.use(express.compress());
app.use(express.bodyParser());

app.use(express.static(__dirname + '/../public'));

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
