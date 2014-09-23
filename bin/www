#!/usr/bin/env node

var pack = require('../package');
var program = require('commander');
var fs = require('fs');
var path = require('path');
var debug = require('debug')('PushServer');

program.version(pack.version)
    .option("-c --config <configPath>", "Path to config file")
    .parse(process.argv);

var configPath = program.config;
if (configPath) {
    configPath = configPath.indexOf('/') === 0 ? configPath : path.join(process.cwd(), configPath);
    if (!fs.existsSync(configPath)) {
        console.log(new Date().toString() + ": " +'The configuration file doesn\'t exist.');
        return program.outputHelp();
    }
} else {
    console.log(new Date().toString() + ": " +'You must provide a configuration file.');
    return program.outputHelp();
}


var config = require(configPath);
GLOBAL.config = config; // TODO find a way to inject config in app

var app = require('../app');

app.set('port', config.webPort || 3001);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
