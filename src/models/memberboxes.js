var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'MemberBoxes',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		box: {
			type: ObjectId,
			ref: 'Boxes',
			required: true
		},
		size: {
			type: String,
			required: true
		},
		member: {
			type: ObjectId,
			ref: 'Members',
			required: true
		},
		state: {
			type: ObjectId,
			ref: 'States',
			required: true
		},
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
