var __root = '../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var __apps = __dirname + '/apps';

var	fs = require( 'fs' ),
	express = require( 'express' ),
	app = express();

var config = require( __config + '/config.json' );

var apps = [];
var app_config = {};

var auth = require( __js + '/subscriber-authentication' );

var	db = require( __js + '/database' ),
	MemberBoxes = db.MemberBoxes;

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title
	} );
	res.locals.activeApp = app_config.uid;
	next();
} );

app.get( '/', auth.isSubscriber, function( req, res ) {
	var boxes = [];


	MemberBoxes.find({ member : req.user._id }).populate(['state', 'box']).exec( function( err, results ) {
		for ( var r in results ) {
			var memberBox = results[r];
			boxes.push( {
				name: memberBox.box.name,
				status: memberBox.state,
				size: memberBox.size
			} );
		}
		res.render( 'index', { boxes: boxes } );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
