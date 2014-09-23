var express = require('express');
var router = express.Router();
var _ = require('lodash');

router.post('/send', function (req, res) {
    var notifs = [req.body];

    var pushManager = req.app.pushManager;
    var pushAssociationManager = req.app.pushAssociationManager;
    var notificationsValid = sendNotifications(notifs, pushManager, pushAssociationManager);

    res.status(notificationsValid ? 200 : 400).send();
});

router.post('/sendBatch', function (req, res) {
    var notifs = req.body.notifications;

    var pushManager = req.app.pushManager;
    var pushAssociationManager = req.app.pushAssociationManager;
    var notificationsValid = sendNotifications(notifs, pushManager, pushAssociationManager);
    res.status(notificationsValid ? 200 : 400).send();
});

// Helpers
function sendNotifications(notifs, pushController, pushAssociationManager) {
    var areNotificationsValid = _(notifs).map(validateNotification).min().value();

    if (!areNotificationsValid) return false;

    notifs.forEach(function (notif) {
        var users = notif.users,
            androidPayload = notif.android,
            iosPayload = notif.ios,
            target;

        if (androidPayload && iosPayload) {
            target = 'all';
        } else if (iosPayload) {
            target = 'ios';
        } else if (androidPayload) {
            target = 'android';
        }

        if(users){
            pushAssociationManager.getForUsers(function(err, associations){
                traitSend(err, associations);
            });

        }else{

            pushAssociationManager.getAll(users, function(err, associations){
                traitSend(err, associations);
            });
        }

        function traitSend(err, associations)
        {
            if (err) throw err;

            if (target !== 'all') {
                // TODO: do it in mongo instead of here ...
                associations = _.where(associations, {'type': target});
            }

            pushController.send(associations, androidPayload, iosPayload);

        }
    });

    return true;
}

function validateNotification(notif) {
    var valid = true;

    valid = valid && (!!notif.ios || !!notif.android);
    // TODO: validate content

    return valid;
}

module.exports = router;