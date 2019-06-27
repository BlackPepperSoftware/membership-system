var __root = __dirname + '/../..';
var __config = __root + '/config';
var __src = __root + '/src';
var __js = __src + '/js';

var inquirer = require( 'inquirer' );
var moment = require( 'moment' );
var fs = require('fs');
var csv = require('csv-parser');

var config = require( __config + '/config.json' );

var	db = require( __js + '/database' ).connect( config.mongo ),
	Permissions = db.Permissions,
	Members = db.Members;

var Auth = require( __js + '/authentication' );

var member, admin, superadmin, smallSubscriber, mediumSubscriber, largeSubscriber;

db.mongoose.connection.on( 'connected', function() {
	console.error("In");
	Permissions.find().then(permissions => {
		permissions.forEach(permission => {
			if(permission.slug === config.permission.admin) {
				admin = permission._id;	
			}
			if(permission.slug === config.permission.member) {
				member = permission._id;	
			}
			if(permission.slug === config.permission.superadmin) {
				superadmin = permission._id;	
			}
			if(permission.slug === 'smallSubscriber') {
				smallSubscriber = permission._id;	
			}
			if(permission.slug === 'mediumSubscriber') {
				mediumSubscriber = permission._id;	
			}
			if(permission.slug === 'largeSubscriber') {
				largeSubscriber = permission._id;	
			}
		})
	})
	.then(readpeople).catch(err => console.error(err));

} );

function readpeople() {

	return new Promise(res => {
	var results = [];
	fs.createReadStream('/home/simon/Downloads/canalside-people.csv')  
	.pipe(csv())
	.on('data', (row) => {
	  var size = 'S';
	  switch (row.BoxSize) {
		case 'S':
			  size = 'Small'
			  break;
		case 'M':
			size = 'Medium'
			break;
		case 'L':
			size = 'Small'
			break;
	  }

	  var newuser = {
		    firstname: row.FirstName,
		    lastname: row.LastName, 
			address: 'Line 1, Line 2, CV32 4SQ',
			email: row.Email, 
			permission: 'None',
			membership: 'Yes',
			password: 'Password1',
			activation: 'Yes',
			boxsize: size
		}
		console.log(newuser);
		results.push(newuser);
	})
	.on('end', () => {
	  console.log('CSV file successfully processed');
	  res(results);
	})}).then(		
		results => Promise.all(results.map(processAnswers)));
	
}

db.mongoose.connection.on( 'disconnected', function() {
	console.log( 'Disconnected from database' );
} );

function processAnswers( answers ) {
	var user = {
		firstname: answers.firstname,
		lastname: answers.lastname,
		address: answers.address.split( ',' ).map( function( s ) { return s.trim(); } ).join( "\n" ),
		email: answers.email,
		permissions: []
	};

	var actions = [
		processMembership( user, answers.membership ),
		processPermission( user, answers.permission ),
		processActivation( user, answers.activation ),
		processPassword( user, answers.password ),
		processBoxsize(user, answers.boxsize)
	];

	return Promise.all( actions ).then( function() {
		new Members( user ).save( function( err ) {
			if ( err ) {
				console.log( 'Unable to create user because of error(s):' );
				console.log( err );
			} else {
				console.log( 'New user created.' );
			}

			// setTimeout( function () {
			// 	db.mongoose.disconnect();
			// }, 1000);
		} );
	} );
}

function processPassword( user, password ) {
	return new Promise( function( resolve, reject ) {
		Auth.generatePassword( password, function( result ) {
			user.password = {};
			user.password.hash = result.hash;
			user.password.salt = result.salt;
			user.password.iterations = result.iterations;
			resolve();
		} );
	} );
}

function processMembership( user, answer ) {
	return new Promise( function( resolve, reject ) {
		if ( answer != 'No' ) {
			var memberPermission = {
				permission: member
			}
			var now = moment();
			switch ( answer ) {
				case 'Yes':
					memberPermission.date_added = now.toDate();
					break;
				case 'Yes (expires after 1 month)':
					memberPermission.date_added = now.toDate();
					memberPermission.date_expires = now.add( '1', 'months' ).toDate();
					break;
				case 'Yes (expired yesterday)':
					memberPermission.date_expires = now.subtract( '1', 'day' ).toDate();
					memberPermission.date_added = now.subtract( '1', 'months' ).toDate();
					break;
			}
			user.permissions.push( memberPermission );
			resolve();
		} else {
			resolve();
		}
	} );
}

function processBoxsize( user, answer ) {
	return new Promise( function( resolve, reject ) {
		if ( answer != 'None' ) {
			var now = moment();
			var boxsizePermission = {
				date_added: now.toDate()
			}
			switch ( answer ) {
				case 'Small':
					boxsizePermission.permission = smallSubscriber
					break;
				case 'Medium':
					boxsizePermission.permission = mediumSubscriber
					break;
				case 'Large':
					boxsizePermission.permission = largeSubscriber
					break;
			}
			user.permissions.push( boxsizePermission );
			resolve();
		} else {
			resolve();
		}
	} );
}
function processActivation( user, answer ) {
	return new Promise( function( resolve, reject ) {
		if ( answer == 'Yes' ) {
			user.activated = true;
			resolve();
		} else {
			user.activated = false;
			Auth.generateActivationCode( function( code ) {
				console.log( 'Activation code: ' + code );
				user.activation_code = code;
				resolve();
			} );
		}
	} );
}

function processPermission( user, answer ) {
	return new Promise( function( resolve, reject ) {
		if ( answer != 'None' ) {
			var adminPermission = {
				date_added: moment().toDate()
			}

			switch ( answer ) {
				case 'Admin':
					adminPermission.permission = admin;
					break;
				case 'Super Admin':
					adminPermission.permission = superadmin;
					break;
			}
			user.permissions.push( adminPermission );
			resolve();
		} else {
			resolve();
		}
	} );
}
