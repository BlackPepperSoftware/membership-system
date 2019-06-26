var __root = '../../../..';
var __src = __root + '/src';
var __js = __src + '/js';
var __config = __root + '/config';

var	express = require( 'express' ),
	app = express();

var db = require( __js + '/database' ),
	Boxes = db.Boxes,
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

	return doCreateBox(req.body.name)
		.then(() => {
			req.log.debug({
				app: 'settings/boxes',
				action: 'create',
				error: 'Box created',
				body: req.body
			});
			req.flash('success', 'item-created');
			res.redirect(app.parent.mountpath + app.mountpath);
		})
		.catch(err => {
			console.error(err);
			req.log.error({
				app: 'settings/boxes',
				action: 'create',
				error: 'Error creating box:' + err,
				body: req.body
			});
			req.flash('danger', 'item-not-created');
			res.redirect(app.parent.mountpath + app.mountpath + '/create');
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

/**
 *
 * @param {string} name
 * @returns {Promise}
 */
function doCreateBox(name) {
	return newBox(name)
		.then(saveBox);
}

/**
 *
 * @param {string} name
 * @returns {Promise<object>}
 */
function newBox(name) {
	return getReadyState()
		.then(state => newMemberBoxes(state._id)
			.then(memberBoxes => ({
				name: name,
				memberBoxes: memberBoxes,
			}))
		);
}

/**
 *
 * @param {object} box
 * @returns {Promise}
 */
function saveBox(box) {
	return new Boxes(box).save();
}

/**
 *
 * @returns {Promise<object>}
 */
function getReadyState() {
	return States.findOne({slug: 'ready'});
}

/**
 *
 * @param {string} initialStateId
 * @returns {Promise<object[]>}
 */
function newMemberBoxes(initialStateId) {
	return Members.find()
		.then(members => Promise.all(
			members
				.map(member => getMemberSubscriberPermission(member)
					.then(subscriberPermission => {
						if (subscriberPermission) {
							return {
								member: member,
								state: initialStateId,
								size: subscriberPermission
							};
						}
					})
				)
			)
		)
		.then(results => results.filter(r => !!r));
}

/**
 *
 * @param {object} member
 * @returns {Promise<string|undefined>}
 */
function getMemberSubscriberPermission(member) {
	return Promise.all(member.permissions.map(p => Permissions.findById(p.permission)))
		.then(permissions => permissions
			.map(permission => permission.slug)
			.find(slug => slug.indexOf('Subscriber') > -1)
		);
}

module.exports = function( config ) {
	app_config = config;
	return app;
};
