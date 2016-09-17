var config = require('../../config.js');
var socketIO = require('socket.io');
var socketIOAdapterMongo = require('socket.io-mongodb');

module.exports = function (params) {

    if (config.debug) {
        console.log('+ Module Socket Loaded');
    }

    // Internal dependencies
    var Authentication = require('../Authentication')(params);
    var Session = require('./Schema');

    // Params
    var io = socketIO.listen(params.server);
    io.adapter(socketIOAdapterMongo({mongoClient: params.db.uri(), collectionName: 'socket'}));

    Session.remove({}, function () {
    });

    io.sockets.on('connection', function (socket) {

        var token = socket.handshake.query.token;
        if (token) {
            Authentication.isValidToken(token, function (err, user_id) {
                if (err || !user_id) {
                    socket.disconnect();
                } else {
                    Session.update({
                        socket: socket.id
                    }, {user: user_id, socket: socket.id}, {new: true, upsert: true}, function (err, sesion) {
                    });
                }
            });
        } else {
            socket.disconnect();
        }

        socket.on('disconnect', function () {
            Session.remove({socket: socket.id}, function (err, sesion) {
            });
        });

    });


    return {
        io: io
    };

};