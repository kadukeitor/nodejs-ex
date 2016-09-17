var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    user: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    socket: {type: String, required: true},
    created: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Session', schema);
