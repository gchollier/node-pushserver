var basicAuthParser = require('basic-auth-parser');
var _ = require('lodash');

function authenticate(role, req, res, next){
	if(req.header("Authorization")){
        var authorization = req.header("Authorization");
        var provided = basicAuthParser(req.header("Authorization"));

        var user = _.find(req.app.credentials, { 'user': provided.username, 'password': provided.password });

        // The user exists
        if (user !== undefined){
            // The user has correct role
            if(user.scopes.indexOf(role) > -1){
                next();
            }else{
                sendForbidden(res)
            }
        }else{
            sendForbidden(res);
        }
    }else{        
    	sendAskAuthentication(res);
    }

}

function sendForbidden(res){
	res.status(403);
    res.send({message: "Invalid authentication credential"});
}

function sendAskAuthentication(res){
    res.setHeader("WWW-Authenticate", "Basic realm=\"myRealm\"");
    res.status(401).send();
}
module.exports = {
    Auth: function (req, res, next) {
        if(req.path.indexOf("/public") > -1){
            next();
        }else if(req.path.indexOf("/subscribe") > -1 ||
            req.path.indexOf("/unsubscribe") > -1
        ){
            authenticate('subscribe', req, res, next);
        }else{
            authenticate('send', req, res, next);
        }
    }
};