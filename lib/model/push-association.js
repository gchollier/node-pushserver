var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;

var pushAssociationSchema = new mongoose.Schema({
    user: {type: 'String', required: true },
    type: {type: 'String', required: true, enum: ['ios', 'android'], lowercase: true},
    token: {type: 'String', required: true}
});

// I must ensure uniqueness accross the two properties because two users can have the same token (ex: in apn, 1 token === 1 device)
pushAssociationSchema.index({ user: 1, token: 1 }, { unique: true });

var PushAssociation = mongoose.model('PushAssociation', pushAssociationSchema);

module.exports = PushAssociation;