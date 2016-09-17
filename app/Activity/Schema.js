var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    activity: {type: String, lowercase: true, required: true},
    datetime: {type: Date, default: Date.now},
    duration: {type: Number},
    location: {type: String},
    description: {type: String},
    creator: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    members: [{type: Schema.Types.ObjectId, ref: 'User'}],
    created: {type: Date, default: Date.now}
});

schema.post('save', function (doc, next) {
    if (!doc.members.length) {
        this.remove({_id: doc._id});
    }
    next();
});

module.exports = mongoose.model('Activity', schema);
