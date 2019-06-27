var __root = __dirname + '/../..';

var config = require( __root + '/config/config.json' ),
	db = require( __root + '/src/js/database' ).connect( config.mongo ),
	Permissions = db.Permissions,
	States = db.States;

const permissionData = [
	{ name: 'Member', slug: 'member' },
	{ name: 'Admin', slug: 'admin' },
	{ name: 'Super Admin', slug: 'superadmin' },
	{ name: 'Access', slug: 'access' },
	{ name: 'Volunteer', slug: 'volunteer' },
	{ name: 'Investor', slug: 'investor' },
	{ name: 'Subscriber (Small)', slug: 'smallSubscriber' },
	{ name: 'Subscriber (Medium)', slug: 'mediumSubscriber' },
	{ name: 'Subscriber (Large)', slug: 'largeSubscriber' },
];

permissionData
	.forEach(obj => {
		new Permissions( {
			name: obj.name,
			slug: obj.slug,
		} ).save( function( err ) {
			if ( ! err ) {
				console.log( `created ${obj.name} permission` );
			} else {
				console.log( err );
			}
		} );
	});

const stateData = [
	{ slug: 'ready', text: 'Ready', colour: 'default', pastTense: 'was ready', presentTense: 'is ready' },
	{ slug: 'collected', text: 'Collected', colour: 'success', pastTense: 'was collected', presentTense: 'is being collected' },
];

stateData
	.forEach(obj => {
		new States( {
			slug: obj.slug,
			text: obj.text,
			colour: obj.colour,
			pastTense: obj.pastTense,
			presentTense: obj.presentTense,
		} ).save( function( err ) {
			if ( ! err ) {
				console.log( `created ${obj.text} state` );
			} else {
				console.log( err );
			}
		} );
	});

setTimeout( function () {
	db.mongoose.disconnect();
}, 1000);
