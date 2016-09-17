var moment = require('moment');
var request = require('request');
var jwt = require('jwt-simple');
var async = require('async');

var config = require('../../config.js');

module.exports = function (params) {

    // Params
    var server = params.server;

    // Internal dependencies
    var User = require('./Schema');
    var Authentication = require('../Authentication')(params);

    /*
     |--------------------------------------------------------------------------
     | GET /api/me
     |--------------------------------------------------------------------------
     */
    server.get('/api/me', Authentication.ensureAuthenticated, function (req, res) {

        var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
        var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');

        User.findById(req.user, '-friends', function (err, user) {
            if (!user) {
                return res.status(400).send({message: 'User not found'});
            } else {
                // // Updating User
                request.get({
                    url: graphApiUrl,
                    qs: user.facebookToken,
                    json: true
                }, function (err, response, profile) {
                    if (response.statusCode !== 200) {
                        return res.status(500).send({message: profile.error.message});
                    }
                    user.displayName = user.displayName || profile.name;
                    user.save(function (err, user) {
                        syncFriends(user, function () {
                        });
                        syncBots(user, function () {
                        });
                        // Remove facebookToken
                        user.set('facebookId', null);
                        user.set('facebookToken', null);
                        res.send(user);
                    });
                });
            }
        });
    });

    /*
     |--------------------------------------------------------------------------
     | Login with Facebook
     |--------------------------------------------------------------------------
     */
    server.post('/auth/facebook', function (req, res) {

        var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
        var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
        var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
        var params = {};

        if (req.body.mobile) {

            var accessToken = {
                expires_in: config.expires_in,
                token_type: 'bearer',
                access_token: req.body.access_token
            };

            facebookSync(req, res, graphApiUrl, accessToken);

        } else {

            params = {
                code: req.body.code,
                client_id: req.body.clientId,
                client_secret: config.FACEBOOK_SECRET,
                redirect_uri: req.body.redirectUri
            };

            request.get({url: accessTokenUrl, qs: params, json: true}, function (err, response, accessToken) {

                if (response.statusCode !== 200) {
                    return res.status(500).send({message: accessToken.error.message});
                }

                facebookSync(req, res, graphApiUrl, accessToken);

            });
        }


    });

    /*
     |--------------------------------------------------------------------------
     | Facebook Sync
     |--------------------------------------------------------------------------
     */

    function facebookSync(req, res, graphApiUrl, accessToken) {

        request.get({url: graphApiUrl, qs: accessToken, json: true}, function (err, response, profile) {

            if (response.statusCode !== 200) {
                return res.status(500).send({message: profile.error.message});
            }

            if (req.header('Authorization')) {

                User.findOne({facebookId: profile.id}, function (err, existingUser) {


                    var token = req.header('Authorization').split(' ')[1];
                    var payload = jwt.decode(token, config.TOKEN_SECRET);

                    User.findById(payload.sub, function (err, user) {
                        if (!user) {
                            return res.status(400).send({message: 'User not found'});
                        }
                        user.facebookId = profile.id;
                        user.facebookToken = accessToken;
                        user.picture = user.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
                        user.displayName = user.displayName || profile.name;
                        user.save(function () {
                            var token = createJWT(user);
                            res.send({token: token});
                        });
                    });

                });

            } else {
                // Step 3. Create a new user account or return an existing one.
                User.findOne({facebookId: profile.id}, function (err, existingUser) {

                    if (existingUser) {
                        // Updating facebookToken
                        existingUser.facebookToken = accessToken;
                        existingUser.save(function () {
                        });
                        var token = createJWT(existingUser);
                        return res.send({token: token});
                    }

                    var user = new User();
                    user.facebookId = profile.id;
                    user.facebookToken = accessToken;
                    user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
                    user.displayName = profile.name;
                    user.save(function (err, user) {
                        var token = createJWT(user);
                        res.send({token: token});
                    });

                });
            }
        });

    }


    /*
     |--------------------------------------------------------------------------
     | GET /api/me
     |--------------------------------------------------------------------------
     */
    server.get('/api/friends', Authentication.ensureAuthenticated, function (req, res) {
        User.findById(req.user, function (err, user) {
            if (!user) {
                return res.status(400).send({message: 'User not found'});
            } else {
                user.populate('friends', '-friends -facebookToken -facebookId', function (err, user) {
                    res.json(user.friends)
                });
            }
        });
    });

    /*
     |--------------------------------------------------------------------------
     | Generate JSON Web Token
     |--------------------------------------------------------------------------
     */
    function createJWT(user) {
        var payload = {
            sub: user._id,
            iat: moment().unix(),
            exp: moment().add(14, 'days').unix()
        };
        return jwt.encode(payload, config.TOKEN_SECRET);
    }

    /*
     |--------------------------------------------------------------------------
     | Sync Friends
     |--------------------------------------------------------------------------
     */
    function syncFriends(user, done) {
        var graphApiUrl = 'https://graph.facebook.com/v2.5/' + user.facebookId + '/friends?fields=picture,name';
        request.get({url: graphApiUrl, qs: user.facebookToken, json: true}, function (err, response, result) {
            var friends = result.data;
            async.each(friends, function (friend, callback) {
                // Search if the Friend Exist
                User.findOne({facebookId: friend.id}, function (err, userFriend) {
                    if (userFriend) {
                        // Update User's Friends
                        User.findByIdAndUpdate(user._id, {$addToSet: {friends: userFriend._id}}, {new: true}, callback);
                    } else {
                        var newUser = new User();
                        newUser.facebookId = friend.id;
                        newUser.picture = 'https://graph.facebook.com/' + friend.id + '/picture?type=large';
                        newUser.displayName = friend.name;
                        newUser.save(function (err, newUser) {
                            // Update User's Friends
                            User.findByIdAndUpdate(user._id, {$addToSet: {friends: newUser._id}}, {new: true}, callback);
                        });
                    }
                });
            }, function (err) {
                done();
            });
        });
    }

    function syncBots(user, done) {
        User.find({isBot: true}, function (err, bots) {
            async.each(bots, function (bot, callback) {
                User.findByIdAndUpdate(bot._id, {$addToSet: {friends: user._id}}, {new: true}, function (err, bot) {
                    User.findByIdAndUpdate(user._id, {$addToSet: {friends: bot._id}}, {new: true}, callback);
                });
            }, function (err) {
                done();
            });
        })
    }

};