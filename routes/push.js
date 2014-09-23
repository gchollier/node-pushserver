var express = require('express');
var router = express.Router();
var _ = require('lodash');

router.post('/send', function (req, res) {
    var notifs = [req.body];

    var pushManager = req.app.pushManager;
    var pushAssociations = req.app.pushAssociations;
    var notificationsValid = sendNotifications(notifs, pushManager, pushAssociations);

    res.status(notificationsValid ? 200 : 400).send();
});

router.post('/sendBatch', function (req, res) {
    var notifs = req.body.notifications;

    var pushManager = req.app.pushManager;
    var pushAssociations = req.app.pushAssociations;
    var notificationsValid = sendNotifications(notifs, pushManager, pushAssociations);
    res.status(notificationsValid ? 200 : 400).send();
});

// Helpers
function sendNotifications(notifs,  pushAssociations, pushController) {
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

        var fetchUsers = users ? pushAssociations.getForUsers : pushAssociations.getAll,
            callback = function (err, pushAssociations) {
                if (err) return;

                if (target !== 'all') {
                    // TODO: do it in mongo instead of here ...
                    pushAssociations = _.where(pushAssociations, {'type': target});
                }

                pushController.send(pushAssociations, androidPayload, iosPayload);
            },
            args = users ? [users, callback] : [callback];

        // TODO: optim. -> mutualise user fetching ?
        fetchUsers.apply(null, args);
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