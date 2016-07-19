var gzRoot = 'http://10.1.2.42:8080';
var app    = {};

// Constants
( () => {
	app.constants = {
		'blockList' : [
			'Bautista, Marc Florense',
			'Dumadag , Chad Allen P.',
			'Iway,Hazel(SMS)',
			'Lamayo, Francis Kennet V.',
			'Malveda, Juliene Mae G.',
			'Moulic, Axxon M.',
			'Rosales, Gideon R.',
			'Yutiamco, Crystal Dianne'
		]
	}
} )();

// Utilities
( () => {
	app.utils = {
		fetch ( url ) {
			return new Promise ( (resolve, reject) => {
				fetch( `${gzRoot}${url}` ).then( ( data ) => {
					data.json().then( resolve, reject );
				}, reject );
			} );
		},
		sort ( key ) {
			return function ( prev, curr ) {
				var prevItem = prev[ key ].toUpperCase();
				var currItem = curr[ key ].toUpperCase();
				if ( prevItem < currItem ) {
					return -1;
				} else if ( prevItem > currItem ) {
					return 1;
				}
				return 0;
			}
		},
		getHtmlNode ( selector ) {
			return document.querySelector( selector );
		},
		replaceHtmlAllData ( selector, html ) {
			var parent = app.utils.getHtmlNode( selector );
			parent.innerHTML = html;
			return parent;
		},
		clearHtmlChildren ( selector ) {
			return app.utils.replaceHtmlAllData( selector, '' );
		},
		appendHtmlChild ( html, source, selector ) {
			return ( source || app.utils.getHtmlNode( selector ) ).insertAdjacentHTML( 'beforeend', html );
		},
		removeHtmlChild ( selector ) {
			var node = app.utils.getHtmlNode( selector );
			if ( node.parentNode ) {
				node.parentNode.removeChild( node );
			}
		},
		fetchInfo () {
			return Promise.all( Object.keys( app.data.watchers ).map( ( key ) => {
				return app.data.watchers[ key ];
			} ) );
		},
		today () {
			var today = new Date();
			return [ ( today.getMonth() + 1 ), today.getDate(), today.getFullYear() ].join( '-' );
		},
		toggleClass ( selector, className ) {
			app.utils.getHtmlNode( selector ).classList.toggle( className );
		},
		addWatch ( Userid ) {
			var today = app.utils.today();
			app.data.watchers[ Userid ] = app.utils.fetch( `/attlogs/${Userid}?start=${today}&end=${today}` ).then( ( res=[] ) => {
				app.data.watchLogs[ Userid ] = res;
			} )
		},
		formLogs ( Userid ) {
			var res          = app.data.watchLogs[ Userid ];
			var parent       = app.utils.getHtmlNode( `#card-id-${Userid} ul.time-list` );
			parent.innerHTML = '';

			res.forEach( ( timeIn ) => {
				var log  = new Date( timeIn.Checktime );
				app.utils.appendHtmlChild( app.tpl.employeeCardItem( log.toUTCString() ), parent );
			} );
		},
		newClientDate () {
			var dt = new Date();
			dt.setTime( dt.getTime() + 8 * 3600 * 1000 );
			return dt;
		},
		updateCount ( Userid ) {
			var res       = app.data.watchLogs[ Userid ];
			var start     = res && res.length ? res[ 0 ] : null;
			var end       = res && res.length % 2 === 0 ? res[ res.length - 1 ] : null;
			var startTime = start ? new Date( start.Checktime ) : app.utils.newClientDate();
			var endTime   = end ? new Date( end.Checktime ) : app.utils.newClientDate();

			app.utils.getHtmlNode( `#card-id-${Userid} h1.text-center` ).innerHTML = app.utils.msToHMS( endTime.getTime() - startTime.getTime() );
		},
		removeWatch ( Userid ) {
			delete app.data.watchers[ Userid ];
			delete app.data.watchLogs[ Userid ];
		},
		padd ( num ) {
			let t = '00' + ( num || '' );
			return t.substring( t.length - 2 );
		},
		msToHMS ( ms ) {
			var seconds = ms / 1000;
			var hours = app.utils.padd( parseInt( seconds / 3600 ) );
			seconds = seconds % 3600;
			var minutes = app.utils.padd( parseInt( seconds / 60 ) );
			seconds = seconds % 60;
			var secStr = seconds.toFixed(4).split( '.' );
			var secOnly = app.utils.padd( secStr[ 0 ] );
			var secFraction = secStr[ 1 ];
			return  `${hours}:${minutes}:${secOnly}.${secFraction}`;
		},
		countUp () {
			if ( Object.keys( app.data.watchers ).length ) {
				if ( app.data.callCount === 700 ) {
					Object.keys( app.data.watchers ).forEach( ( key ) => {
						app.utils.updateCount( key );
						app.utils.addWatch(key);
					} );

					app.utils.fetchInfo().then( () => {
						setTimeout( () => {
							app.utils.countUp();
						}, 7 );
					} );
					app.data.callCount = 0;
				} else {
					Object.keys( app.data.watchers ).forEach( ( key ) => {
						app.utils.updateCount( key );
					} );

					setTimeout( () => {
						app.utils.countUp();
					}, 7 );
					app.data.callCount++;
				}
			}
		}
	}
} )();

// Templates
( () => {
	app.tpl = {
		employeeList ( data ) {
			var icon = 'add_circle_outline';
			return `<li class="list-group-item no-selection" id="id-${data.Userid}"><a onclick="app.actions.addWatch('${data.Userid}','${data.Name}')">${data.Name} <i class="material-icons">${icon}</i></a></li>`;
		},
		employeeCard ( data ) {
			var timeListA = `<div class="toggler-hide hidden"><ul class="list-group time-list"></ul><div class="text-right"><a onclick="app.actions.toggleLogs('#card-id-${data.Userid} .toggler','${data.Userid}')">[ hide logs ]</a> <a onclick="app.actions.addWatch(${data.Userid}, '${data.Name}')">[ close ]</a></div></div>`
			var timeListB = `<div class="toggler-view"><div class="text-right"><a onclick="app.actions.toggleLogs('#card-id-${data.Userid} .toggler','${data.Userid}')">[ view logs ]</a>  <a onclick="app.actions.addWatch(${data.Userid}, '${data.Name}')">[ close ]</a></div></div>`;
			return `<div class="col-lg-4 watch-cards" id="card-id-${data.Userid}"><div class="well"><h3>${data.Name}</h3><hr/><h1 class="text-center">00:00:00</h1><hr/>${timeListA}${timeListB}</div><div class="clearfix"></div></div>`;
		},
		employeeCardItem ( data ) {
			return `<li class="list-group-item no-selection">${data}</li>`;
		}
	}
} )();

// Actions
( () => {
	app.actions = {
		initialize () {
			app.data = {
				'watched' : [],
				'watchers' : {},
				'watchLogs' : {},
				'names' : {}
			};
			return app.actions;
		},
		setDateToday () {
			app.utils.replaceHtmlAllData( '#dateToDay', app.utils.today() );
			return app.actions;
		},
		refreshEmployeeList () {
			app.utils.fetch( '/users' ).then( ( users=[] ) => {
				var target = app.utils.clearHtmlChildren( '.member-list' );
				users.filter( ( user ) => {
					return !app.constants.blockList.includes( user.Name );
				} ).sort( app.utils.sort( 'Name' ) ).forEach( ( user ) => {
					app.utils.appendHtmlChild( app.tpl.employeeList( user ), target );
					app.data.names[ user.Userid ] = user.Name;
				} );
			} );
			return app.actions;
		},
		addWatch ( Userid, Name ) {
			var cardId = `#card-id-${Userid}`;
			var listId = `li#id-${Userid} i`;

			if ( app.utils.getHtmlNode( cardId ) ) {
				app.utils.replaceHtmlAllData( listId, 'add_circle_outline' );
				app.utils.removeHtmlChild( cardId );
				app.utils.removeWatch( Userid );
			} else {
				app.utils.replaceHtmlAllData( listId, 'remove_circle_outline' );
				app.utils.appendHtmlChild( app.tpl.employeeCard( { Userid, Name } ), null, '.gz-main-content' );
				app.utils.addWatch( Userid );
			}

			app.actions.start();
		},
		toggleLogs ( selector, Userid ) {
			if ( app.utils.getHtmlNode( `${selector}-hide` ).classList.contains( 'hidden' ) ) {
				app.utils.formLogs( Userid )
			}

			app.utils.toggleClass( `${selector}-view`, 'hidden' );
			app.utils.toggleClass( `${selector}-hide`, 'hidden' );
		},
		start () {
			app.data.callCount = 0;
			if ( Object.keys( app.data.watchers ).length ) {
				app.utils.fetchInfo().then( () => {
					app.utils.countUp();
				} );
			}
		}
	}
} )();

app.actions.initialize().setDateToday().refreshEmployeeList();








