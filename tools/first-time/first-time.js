var __root = __dirname + '/../..';

var config = require( __root + '/config/config.json' ),
	db = require( __root + '/src/js/database' ).connect( config.mongo ),
	Permissions = db.Permissions;

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
			slug: config.permission[obj.slug]
		} ).save( function( err ) {
			if ( ! err ) {
				console.log( `created ${obj.name} permission` );
			} else {
				console.log( err );
			}
		} );
	});

setTimeout( function () {
	db.mongoose.disconnect();
}, 1000);
