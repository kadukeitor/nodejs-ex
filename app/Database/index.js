var mongoose = require('mongoose');

module.exports = function () {

    mongoose.Promise = global.Promise;

    var active = false;

    // CONNECTION EVENTS

    // When successfully connected
    mongoose.connection.on('connected', function () {
        active = true;
        console.log('+ Database connected');
    });

    // If the connection throws an error
    mongoose.connection.on('error', function (err) {
        active = false;
        console.log('- Database connection error: ' + err);
    });

    // When the connection is disconnected
    mongoose.connection.on('disconnected', function () {
        active = false;
        console.log('- Database disconnected');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', function () {
        mongoose.connection.close(function () {
            console.log('- Database disconnected through app termination');
            process.exit(0);
        });
    });

    return {

        uri: function () {
            var mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
                mongoURLLabel = "";
            if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
                var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
                    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
                    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
                    mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
                    mongoPassword = process.env[mongoServiceName + '_PASSWORD'],
                    mongoUser = process.env[mongoServiceName + '_USER'];
                if (mongoHost && mongoPort && mongoDatabase) {
                    mongoURLLabel = mongoURL = 'mongodb://';
                    if (mongoUser && mongoPassword) {
                        mongoURL += mongoUser + ':' + mongoPassword + '@';
                    }
                    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
                    mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
                }
            }
            if (!mongoURL) {
                mongoURL = 'mongodb://127.0.0.1:27017/sofitndb';
            }
            return mongoURL;
        },

        connect: function () {
            if (!active) {
                mongoose.connect(this.uri());
            }
            return mongoose;
        },

        disconnect: function () {
            if (active) {
                mongoose.disconnect();
                active = false;
            }
        },

        connection: function () {
            return mongoose;
        },

        status: function () {
            return active;
        }

    };

};