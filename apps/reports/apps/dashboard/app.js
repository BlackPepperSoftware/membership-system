var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var auth = require( __js + '/authentication' ),
	discourse = require( __js + '/discourse' ),
	db = require( __js + '/database' ),
	Permissions = db.Permissions,
	Boxes = db.Boxes,
	MemberBoxes = db.MemberBoxes,
	States = db.States,
	Members = db.Members;

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isSuperAdmin, function( req, res ) {
	Boxes.find().sort({ createdAt: -1 }).limit(1)
		.then(newBoxResults)
		.then((results) => {
			res.render( 'index', { boxes: results } );
		});
} );

app.get( '/history', auth.isSuperAdmin, function( req, res ) {
	Boxes.find().sort({ createdAt: -1 }).skip(1)
		.then(newBoxResults)
		.then((results) => {
			res.render( 'history', { boxes: results } );
		});
} );

app.get( '/data.json', auth.isSuperAdmin, function( req, res ) {
	Permissions.findOne( { slug: config.permission.member }, function( err, membership_permission ) {
		Members.find( {
			permissions: {
				$elemMatch: {
					permission: membership_permission._id,
					date_added: { $lte: new Date() },
					$or: [
						{ date_expires: null },
						{ date_expires: { $gt: new Date() } }
					]
				}
			}
		}, function( err, members ) {
			var locations = [];
			for ( var m in members ) {
				var member = members[m];
				if ( member.postcode_coordinates.lat )
					locations.push( member.postcode_coordinates );
			}
			locations.sort();
			res.send( JSON.stringify( locations ) );
		} );
	} );
} );

/**
 *
 * @param {object[]} boxes
 * @returns {Promise<object[]>}
 */
function newBoxResults(boxes) {
	return States.findOne({ slug: 'collected' })
		.then(state => {
			const collectedStateId = state._id;

			return Promise.all(
				boxes
					.map(box => {
						return MemberBoxes.find({box: box._id})
							.then(memberBoxes => ({
								name: box.name,
								totalSmall: memberBoxes.filter(bm => bm.size === 'small').length,
								totalMedium: memberBoxes.filter(bm => bm.size === 'medium').length,
								totalLarge: memberBoxes.filter(bm => bm.size === 'large').length,
								collectedSmall: memberBoxes.filter(bm => bm.size === 'small' && bm.state.equals(collectedStateId)).length,
								collectedMedium: memberBoxes.filter(bm => bm.size === 'medium' && bm.state.equals(collectedStateId)).length,
								collectedLarge: memberBoxes.filter(bm => bm.size === 'large' && bm.state.equals(collectedStateId)).length,
							}));
					})
			)
		});
}

module.exports = function( config ) {
	app_config = config;
	return app;
};
