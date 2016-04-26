var express = require('express');


module.exports = function(passport) {
    var router = express.Router();
    
    /* GET users listing. */
    router.get('/', function(req, res, next) {
      res.send('respond with a resource');
    });
    
    // route for twitter authentication and login
    router.get('/auth/twitter', passport.authenticate('twitter'));
    
    // handle the callback after twitter has authenticated the user
    router.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/',
            failureRedirect : '/'
        }));
    return router;    
};


// module.exports = router;
