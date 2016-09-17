var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    displayName: String,
    picture: String,
    facebookId: String,
    facebookToken: Schema.Types.Mixed,
    friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
    isBot: {type: Boolean, default: false},
    isAdmin: {type: Boolean, default: false}
});


module.exports = mongoose.model('User', schema);
