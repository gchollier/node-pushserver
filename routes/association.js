var express = require('express');
var router = express.Router();
var _ = require('lodash');

router.post('/subscribe', function (req, res) {
    var deviceInfo = req.body;

    var pushAssociationManager = req.app.pushAssociationManager;
    pushAssociationManager.add(deviceInfo.user, deviceInfo.type, deviceInfo.token);
    res.send();
});

router.post('/unsubscribe', function (req, res) {
    var data = req.body;
    var logger = req.app.logger;
    var pushAssociationManager = req.app.pushAssociationManager;

    if (data.user) {
        pushAssociationManager.removeForUser(data.user);
    } else if (data.token) {
        pushAssociationManager.removeDevice(data.token);
    } else {
        return res.status(503).send();
    }

    res.send();
});

router.get('/users/:user/associations', function (req, res) {
	var pushAssociationManager = req.app.pushAssociationManager;

    pushAssociationManager.getForUser(req.params.user, function (err, items) {
        if (!err) {
            res.send({"associations": items});
        } else {
            res.status(503).send();
        }
    });
});

router.get('/users', function (req, res) {
	var pushAssociationManager = req.app.pushAssociationManager;

    pushAssociationManager.getAll(function (err, pushAss) {
        if (!err) {
            var users = _(pushAss).map('user').unique().value();
            res.send({
                "users": users
            });
        } else {
            res.status(503).send();
        }
    });
});

router.delete('/users/:user', function (req, res) {
	var pushManager = req.app.pushManager;
    pushManager.unsubscribeUser(req.params.user);
    res.send('ok');
});

module.exports = router;