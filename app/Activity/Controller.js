module.exports = function (params) {

    // Params
    var server = params.server;
    var io = params.socket;

    // Internal dependencies
    var Activity = require('./Schema');
    var User = require('../User/Schema');
    var Session = require('../Socket/Schema');
    var Authentication = require('../Authentication')(params);

    server.get('/api/activities/wall',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            User.findById(req.user, function (err, user) {
                if (!user) {
                    return res.status(400).send({message: 'User not found'});
                } else {
                    user.friends.push(req.user);
                    Activity.find({members: {$in: user.friends}}).sort('-datetime').populate('creator members', '-friends -facebookToken -facebookId').exec(function (err, result) {
                        res.json(result);
                    });
                }
            });
        });

    server.get('/api/activities/me',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            Activity.find({members: req.user}).sort('-datetime').populate('creator members', '-friends -facebookToken -facebookId').exec(function (err, result) {
                res.json(result);
            });
        });

    server.get('/api/activities/:id',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            User.findOne({_id: req.user, friends: req.params.id}, function (err, user) {
                if (!user) {
                    res.status(500).send({message: 'Invalid Friend'});
                } else {
                    Activity.find({members: req.params.id}).sort('-datetime').populate('creator members', '-friends -facebookToken -facebookId').exec(function (err, result) {
                        res.json(result);
                    });
                }
            });
        });

    server.get('/api/activities/me/stats',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            Activity.find({members: req.user}).populate('creator members', '-friends -facebookToken -facebookId').exec(function (err, activities) {
                res.json({
                    activities: activities.length,
                    teams: activities.reduce(function (a, b) {
                        return a + (b.members.length > 1 ? 1 : 0);
                    }, 0)
                })
            });
        });


    server.get('/api/activity/:id/subscribe',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            Activity.findOneAndUpdate({_id: req.params.id}, {$addToSet: {members: req.user}}, {new: true}, function (err, activity) {
                if (activity) {
                    activity.populate('creator members', '-friends -facebookToken -facebookId', function (err, activity) {
                        broadcastActivity('update', activity, req.user);
                        res.json(activity)
                    });
                } else {
                    res.status(500).send({message: 'Invalid Activity'});
                }
            });
        });

    server.get('/api/activity/:id/unsubscribe',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            Activity.findOne({_id: req.params.id, members: req.user}).exec(function (err, activity) {
                if (activity) {
                    activity.members.pull(req.user);
                    activity.save(function (err, activity) {
                        if (activity) {
                            activity.populate('creator members', '-friends -facebookToken -facebookId', function (err, activity) {
                                broadcastActivity('update', activity, req.user);
                                res.json(activity)
                            });
                        } else {
                            res.status(500).send({message: 'Invalid Activity'});
                        }
                    })
                } else {
                    res.status(500).send({message: 'Invalid Activity'});
                }
            });
        });

    server.post('/api/activity',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            var data = req.body;
            data.creator = req.user;
            var activity = new Activity(data);
            activity.members = [req.user];
            activity.save(function (err, activity) {
                if (activity) {
                    activity.populate('creator members', '-friends -facebookToken -facebookId', function (err, activity) {
                        broadcastActivity('create', activity, req.user);
                        res.json(activity)
                    });
                } else {
                    res.status(500).send({message: 'Invalid Activity'});
                }
            });
        });

    server.post('/api/activity/:user',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            User.findOne({_id: req.user, isAdmin: true}, function (err, user) {
                if (!user) {
                    res.status(401).send({message: 'Invalid Admin'});
                } else {
                    var data = req.body;
                    data.creator = req.params.user;
                    var activity = new Activity(data);
                    activity.members = [req.params.user];
                    activity.save(function (err, activity) {
                        if (activity) {
                            activity.populate('creator members', '-friends -facebookToken -facebookId', function (err, activity) {
                                broadcastActivity('create', activity, req.params.user);
                                res.json(activity)
                            });
                        } else {
                            res.status(500).send({message: 'Invalid Activity'});
                        }
                    });
                }
            });
        });

    server.put('/api/activity/:id',
        Authentication.ensureAuthenticated,
        function (req, res, next) {
            var data = req.body;
            Activity.findOneAndUpdate({
                _id: req.params.id,
                creator: req.user
            }, data, {new: true}, function (err, activity) {
                if (activity) {
                    activity.populate('creator members', '-friends -facebookToken -facebookId', function (err, activity) {
                        broadcastActivity('update', activity, req.user);
                        res.json(activity)
                    });
                } else {
                    res.status(500).send({message: 'Invalid Activity'});
                }
            });
        });

    function broadcastActivity(operation, activity, user_id) {
        switch (operation) {
            case 'update':
                Session.find({$or: [{user: {$in: activity.members}}, {user: user_id}]}, function (err, sessions) {
                    sessions.forEach(function (session) {
                        io.to(session.socket).emit('activity:' + operation, activity);
                    });
                });
                break;
            case 'create':
                User.findById(user_id, function (err, user) {
                    Session.find({$or: [{user: {$in: user.friends}}, {user: user_id}]}, function (err, sessions) {
                        sessions.forEach(function (session) {
                            io.to(session.socket).emit('activity:' + operation, activity);
                        });
                    });
                });
                break;
        }


    }

};