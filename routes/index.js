var express = require('express');
var yelp = require('node-yelp');
var router = express.Router();
var Booking = require("../routes/models/userBook");

var yelpClient = yelp.createClient({
  oauth: {
    "consumer_key": "XR54Sykt5WASTU_I6c0hig",
    "consumer_secret": "zExHzphUz1tZQTDRpEYk12CPDTE",
    "token": "R7ty0zES1cGS3MGoZ7iUHWjgalbaTmiV",
    "token_secret": "rS31wjCcgZviaVtkLT_sxJJOqEE"
  },
  
  // Optional settings: 
  httpClient: {
    maxSockets: 25  // ~> Default is 10 
  }
});

module.exports = function (passport) {
    /* GET home page. */
    router.get('/', function(req, res, next) {
        
        
        var geoip = require('geoip-lite');

        var ip = getClientIP(req);
        var geo = geoip.lookup(ip);
        
        // console.log(ip, geo, geo.ll[0]+','+geo.ll[1]);

        yelpClient.search({
          term: "bar",
          ll: geo.ll[0]+','+geo.ll[1],
          limit: 10
        }).then(function (data) {
            // var myData = [];
            
            dataPack(req.user, data, function(err, myData) {
                if(err) console.log(err);
                res.render('index', {user: req.user, data: myData});
            });
            
            // if(req.user) {
            //     Booking.findOne({userName: req.user.twitter.username}, function(err, userbooking) {
            //       if(err) console.log(err);
                   
            //       console.log(userbooking);
            //       data.businesses.forEach(function(item) {
            //             myData.push({
            //                 id: item.id,
            //                 name: item.name,
            //                 rating_img: item.rating_img_url,
            //                 url: item.url,
            //                 img_url: item.image_url,
            //                 isbooked: userbooking.bookingList.indexOf(item.id)>=0?true:false
            //             }); 
            //       });
            //       console.log(myData);
            //       res.render('index', { user: req.user, data: myData });
            //     });
            // }else{
            //     data.businesses.forEach(function(item) {
            //         myData.push({
            //             id: item.id,
            //             name: item.name,
            //             rating_img: item.rating_img_url,
            //             url: item.url,
            //             img_url: item.image_url,
            //             isbooked: false
            //         });
            //     });
            //     console.log(myData);
            //     res.render('index', { user: req.user, data: myData });
            // }
            
          
        }).catch(function (err) {
            console.log(err);
            res.status(400);
            res.render("index", {user: req.user, data:""});
        });
        
        //res.send(req.isAuthenticated());
        
    });
    
    router.post("/search", function(req, res) {
        yelpClient.search({
          term: "bar",
          location: req.body.cityName,
          limit: 10
        }).then(function (data) {
        
        dataPack(req.user, data, function(err, myData) {
            console.log("dataPack");
                if(err) console.log(err);
                res.send(myData);
            });
        }).catch(function (err) {
            console.log(err);
            res.status(400);
            res.send(err.source.text);
        });  
        
    });
    
    router.post("/booking", isLoggedIn, function(req, res) {
        console.log(typeof req.body.isBooking);
        if(req.body.isBooking == 'true') {
            Booking.findOneAndUpdate(
                {userName: req.user.twitter.username}, //query
                { $push: { bookingList: req.body.barId}}, //update
                {new: true, upsert: true}, //option: remove, new, upsert
                function(err, ret) {
                    if(err) console.log(err);
                    
                    console.log(ret);
            });
        } else if(req.body.isBooking == 'false'){
            console.log("remove booking");
            Booking.findOneAndUpdate(
                {userName: req.user.twitter.username}, //query
                { $pull: { bookingList: req.body.barId}}, //update
                {new: true}, //option: remove, new, upsert
                function(err, ret) {
                    if(err) console.log(err);
                    
                    console.log(ret);
            });
        }
        
        res.send("OK");
    });
    // route for twitter authentication and login
    router.get('/auth/twitter', passport.authenticate('twitter'));
    
    // handle the callback after twitter has authenticated the user
    router.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect : '/',
            failureRedirect : '/'
        }));
        
    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });    
    return router; 
};

function dataPack(user, orgData, callback) {
    var packedData = [];
    if(user) {
        Booking.findOne({userName: user.twitter.username}, function(err, userbooking) {
          if(err) console.log(err);
           
          console.log(userbooking);
          orgData.businesses.forEach(function(item) {
                packedData.push({
                    id: item.id,
                    name: item.name,
                    rating_img: item.rating_img_url,
                    url: item.url,
                    img_url: item.image_url,
                    isbooked: userbooking.bookingList.indexOf(item.id)>=0?true:false
                }); 
          });
          console.log(packedData);
          callback(err, packedData);
        });
    }else{
        orgData.businesses.forEach(function(item) {
            packedData.push({
                id: item.id,
                name: item.name,
                rating_img: item.rating_img_url,
                url: item.url,
                img_url: item.image_url,
                isbooked: false
            });
        });
        console.log(packedData);
        callback(null, packedData);
    }
    
}

function getClientIP(req) {
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
     //console.log(ip);
     return ip;
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.status(400);
    res.send("Please login for booking!");
    // res.redirect('/auth/twitter');
}