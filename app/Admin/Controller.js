var async = require('async');

module.exports = function (params) {

    // Params
    var server = params.server;
    var io = params.socket;

    // Internal dependencies
    var Activity = require('../Activity/Schema');
    var User = require('../User/Schema');
    var Session = require('../Socket/Schema');
    var Authentication = require('../Authentication')(params);

    server.get('/api/bots',
        function (req, res) {
            User.find({isBot: true}, '-friends', function (err, users) {
                res.json(users);
            });
        });

    server.get('/api/bots/sync',
        function (req, res, next) {
            var botsTemplate = [
                {facebookId: 'bot-1', displayName: 'Green Bot', picture: '/img/bots/robot-1.png'},
                {facebookId: 'bot-6', displayName: 'Long Neck Bot', picture: '/img/bots/robot-6.png'},
                {facebookId: 'bot-10', displayName: 'Glasses Bot', picture: '/img/bots/robot-10.png'}
            ];
            async.mapSeries(botsTemplate, function (botTemplate, callbackBot) {
                User.findOne({facebookId: botTemplate.facebookId}, function (err, bot) {
                    if (!bot) {
                        bot = new User();
                    }
                    bot.facebookId = botTemplate.facebookId;
                    bot.picture = botTemplate.picture;
                    bot.displayName = botTemplate.displayName;
                    bot.isBot = true;
                    User.find({facebookId: {$ne: botTemplate.facebookId}}, function (err, users) {
                        bot.friends = users.map(function (user) {
                            return user._id;
                        });
                        bot.save(function (err, bot) {
                            async.each(users, function (user, callbackUser) {
                                User.findByIdAndUpdate(user._id, {$addToSet: {friends: bot._id}}, {new: true}, callbackUser);
                            }, function (err) {
                                callbackBot(err);
                            })
                        });
                    });
                })
            }, function (err) {
                res.json({message: 'bots sync', err: err});
            });
        });

    // server.get('/api/bots/remove',
    //     function (req, res, next) {
    //         User.find({isBot: true}, function (err, bots) {
    //             async.mapSeries(bots, function (bot, callbackBot) {
    //                 async.each(bot.friends, function (friend, callbackFriend) {
    //                     User.findOne({_id: friend}).exec(function (err, botFriend) {
    //                         botFriend.friends.pull(bot._id);
    //                         botFriend.save(function (err, botFriend) {
    //                             callbackFriend(err);
    //                         })
    //                     });
    //                 }, function (err) {
    //                     User.remove({_id: bot._id}, callbackBot);
    //                 })
    //             }, function (err) {
    //                 res.json({message: 'bots removed'});
    //             });
    //         })
    //     });

};