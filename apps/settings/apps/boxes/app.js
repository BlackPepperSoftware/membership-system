var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	Boxes = db.Boxes,
	MemberBoxes = db.MemberBoxes,
	Members = db.Members,
	States = db.States,
	Permissions = db.Permissions;

var auth = require( __js + '/authentication' );

var config = require( __config + '/config.json' );

var app_config = {};

app.set( 'views', __dirname + '/views' );

app.use( function( req, res, next ) {
	res.locals.app = app_config;
	res.locals.breadcrumb.push( {
		name: app_config.title,
		url: app.parent.mountpath + app.mountpath
	} );
	res.locals.activeApp = 'settings';
	next();
} );

app.get( '/', auth.isSuperAdmin, function( req, res ) {
	Boxes.find( function( err, boxes ) {
		if ( err ) {
			req.log.error( {
				app: 'settings/boxes',
				action: 'list',
				error: 'Error retrieving list of boxes ' + err,
				body: req.body
			} );
		}
		res.render( 'index', { boxes: boxes } );
	} );
} );

app.get( '/create', auth.isSuperAdmin, function( req, res ) {
	res.locals.breadcrumb.push( {
		name: 'Create'
	} );
		States.find( function (err, states) {
			if ( err ) {
				req.log.error( {
					app: 'settings/boxes',
					action: 'create',
					error: 'Error finding boxes ' + err,
					body: req.body
				} );
			}
			res.render( 'create', { states: states } );
		});

} );

app.post( '/create', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.log.debug( {
			app: 'settings/boxes',
			action: 'create',
			error: 'Name not provided',
			body: req.body
		} );
		req.flash( 'danger', 'item-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var box = {
		name: req.body.name,
		defaultState: req.body.defaultState
	};

	const failedErr = 'create failed';

	new Boxes( box )
		.save()
		.catch(err => {
			if ( err ) {
				req.log.error( {
					app: 'settings/boxes',
					action: 'create',
					error: 'Error creating box:' + err,
					body: req.body
				} );
				req.flash( 'danger', 'item-not-created' );
				res.redirect( app.parent.mountpath + app.mountpath + '/create');
			}

			throw new Error(failedErr);
		})
		.then(() => Members.find())
		.then(members => {
			const subscriberPermissionForMember = (member) =>
				Promise
					.all(member.permissions.map(p => Permissions.findById(p.permission)))
					.then(permissions => permissions.map(permission => permission.slug).find(slug => slug.indexOf('Subscriber') > -1));

			const memberBoxPromises = members
				.map(member => {
					return subscriberPermissionForMember(member)
						.then(subscriberPermission => {
							if (subscriberPermission) {
								return {
									member: member,
									state: box.defaultState,
									size: subscriberPermission
								};
							}
						})
				});

			return Promise.all(memberBoxPromises)
				.then(results => results.filter(r => !!r));
		})
		.then(memberBoxes => Promise.all(memberBoxes.map(mb => new MemberBoxes( mb ).save())))
		.catch(err => {
			req.log.error( {
				app: 'settings/boxes',
				action: 'create',
				error: 'Error creating box:' + err,
				body: req.body
			} );
			req.flash( 'danger', 'item-not-created' );
			res.redirect( app.parent.mountpath + app.mountpath + '/create');

			throw new Error(failedErr)
		})
		.then(() => {
			req.log.debug( {
				app: 'settings/boxes',
				action: 'create',
				error: 'Box created',
				body: req.body
			} );
			req.flash( 'success', 'item-created' );
			res.redirect( app.parent.mountpath + app.mountpath );
		})
		.catch(err => {
			if (err.message === failedErr) {
				return;
			}

			throw err;
		});
} );

app.get( '/:id/edit', auth.isSuperAdmin, function( req, res ) {
	Boxes.findById(req.params.id).exec ( function( err, box ) {
		if ( err ) {
			req.log.debug( {
				app: 'settings/boxes',
				action: 'edit',
				error: 'Error retrieving box to edit ' + err,
				body: req.body
			} );
		}
		if ( ! box ) {
			req.log.debug( {
				app: 'settings/boxes',
				action: 'list',
				error: 'Box could not be retrieved',
				body: req.body
			} );
			req.flash( 'warning', 'item-404' );
			res.redirect( app.parent.mountpath + app.mountpath);
			return;
		}

		res.locals.breadcrumb.push( {
			name: box.name
		} );
		States.find( function (err, states) {
			if ( err ) {
				req.log.error( {
					app: 'settings/boxes',
					action: 'edit',
					error: 'Error retrieving list of states ' + err,
					body: req.body
				} );
			}
			res.render( 'edit', { box: box, states: states } );
		} );
	} );
} );

app.post( '/:id/edit', auth.isSuperAdmin, function( req, res ) {
	if ( ! req.body.name || req.body.name.trim() === '' ) {
		req.log.debug( {
			app: 'settings/boxes',
			action: 'edit',
			error: 'Name not provided',
			body: req.body
		} );
		req.flash( 'danger', 'item-name-required' );
		res.redirect( app.parent.mountpath + app.mountpath );
		return;
	}

	var box = {
		name: req.body.name,
		defaultState: req.body.defaultState
	};

	Boxes.update( { id: req.params.id }, box, function( status ) {
		req.log.debug( {
			app: 'settings/boxes',
			action: 'edit',
			error: 'Box updated',
			body: req.body
		} );
		req.flash( 'success', 'item-updated' );
		res.redirect( app.parent.mountpath + app.mountpath );
	} );
} );

module.exports = function( config ) {
	app_config = config;
	return app;
};
