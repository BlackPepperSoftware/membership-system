var Authentication = require('./authentication' );

var activeSubscriber = function( req ) {
	// Check user is logged in
	var status = Authentication.loggedIn( req );
	if ( status != Authentication.LOGGED_IN ) {
		return status;
	} else {
		if ( Authentication.checkPermission( req, 'smallSubscriber' ) ) return Authentication.LOGGED_IN;
		if ( Authentication.checkPermission( req, 'mediumSubscriber' ) ) return Authentication.LOGGED_IN;
		if ( Authentication.checkPermission( req, 'largeSubscriber' ) ) return Authentication.LOGGED_IN;
	}
	return Authentication.NOT_MEMBER;
};

var isSubscriber = function( req, res, next ) {
	var status = activeSubscriber( req );
	switch ( status ) {
		case Authentication.LOGGED_IN:
			return next();
		case Authentication.NOT_ACTIVATED:
			req.flash( 'warning', 'inactive-account' );
			res.redirect( '/' );
			return;
		case Authentication.NOT_MEMBER:
			req.flash( 'warning', 'inactive-membership' );
			res.redirect( '/profile' );
			return;
		case Authentication.REQUIRES_2FA:
			if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
			req.flash( 'warning', '2fa-required' );
			res.redirect( '/otp' );
			return;
		default:
		case Authentication.NOT_LOGGED_IN:
			if ( req.method == 'GET' ) req.session.requestedUrl = req.originalUrl;
			req.flash( 'error', 'login-required' );
			res.redirect( '/login' );
			return;
	}
};

module.exports = { isSubscriber };
