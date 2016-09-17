var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    morgan = require('morgan');

// Server's parameters
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

// Server
app.engine('html', require('ejs').renderFile);
// app.use(morgan('combined'));
app.set('views', __dirname + '/www');
app.use(express.static('www'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});
var server = app.listen(port, ip);
console.log('+ Server running');

// Database
var db = require('./app/Database')();
db.connect();
db.connection().connection.on('connected', function (err) {
    // Socket
    var socket = require('./app/Socket')({server: server, db: db});
    // Params
    var params = {      
        server: app,
        db: db,
        socket: socket.io
    };
    // Modules
    require('./app/Status')(params);
    require('./app/Admin/Controller')(params);
    require('./app/User/Controller')(params);
    require('./app/Activity/Controller')(params);
});

module.exports = app;
