var mongoose = require( 'mongoose' ),
	ObjectId = mongoose.Schema.ObjectId;

module.exports = {
	name: 'Boxes',
	schema: mongoose.Schema( {
		_id: {
			type: ObjectId,
			default: function() { return new mongoose.Types.ObjectId(); },
			required: true
		},
		name: {
			type: String,
			required: true
		},
		image: {
			large: String,
			icon: String
		},
		states: [
			{
				type: ObjectId,
				ref: 'States',
				required: true
			}
		],
		defaultState: {
			type: ObjectId,
			ref: 'States',
			required: true
		}
	} )
};

module.exports.model = mongoose.model( module.exports.name, module.exports.schema );
