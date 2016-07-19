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
				fetch( gzRoot + url ).then( ( data ) => {
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
		addWatch ( Userid, Name ) {
			app.data.watchers[ Userid ] = app.utils.fetch( '/attlogs/' + Userid + '?start=' + app.utils.today() + '&end=' + app.utils.today() ).then( ( res=[] ) => {
				var parent       = app.utils.getHtmlNode( `#card-id-${Userid} ul.time-list` );
				parent.innerHTML = '';
				var time         = 0;
				var lastTime     = new Date();

				res.reduce( ( prev, timeIn, index ) => {
					var log  = new Date( timeIn.Checktime );
					app.utils.appendHtmlChild( app.tpl.employeeCardItem( log.toUTCString() ), parent );

					if ( index > 0 && index % 2 !== 0 ) {
						time += log.getTime() - prev.getTime();
					}

					lastTime = log;
					return log;
				}, null )

				if ( res.length > 0 && res.length % 2 !== 0 ) {
					var now = new Date();
					time += ( now.getTime() + 8 * 3600 * 1000 ) - lastTime.getTime();
				}

				app.utils.getHtmlNode( `#card-id-${Userid} h1.text-center` ).innerHTML = app.utils.msToHMS( time );
			} )
		},
		removeWatch ( Userid ) {
			delete app.data.watchers[ Userid ];
		},
		padd ( num ) {
			let t = '00' + ( num || '' );
			return t.substring( t.length - 2 );
		},
		msToHMS ( ms ) {
			var seconds = ms / 1000;
			var hours = parseInt( seconds / 3600 );
			seconds = seconds % 3600;
			var minutes = parseInt( seconds / 60 );
			seconds = seconds % 60;
			var secStr = seconds.toFixed(4).split( '.' );
			return app.utils.padd( hours ) + ':' + app.utils.padd( minutes ) + ':' + app.utils.padd( secStr[ 0 ] ) + '.' + secStr[ 1 ];
		}
	}
} )();

// Templates
( () => {
	app.tpl = {
		employeeList ( data ) {
			var icon = 'add_circle_outline';
			return `<li class="list-group-item no-selection" id="id-${data.Userid}"><a onclick="app.actions.addWatch(${data.Userid}, '${data.Name}')">${data.Name} <i class="material-icons">${icon}</i></a></li>`;
		},
		employeeCard ( data ) {
			var timeListA = `<div class="toggler-hide hidden"><ul class="list-group time-list"></ul><div class="text-right"><a onclick="app.actions.toggleLogs('#card-id-${data.Userid} .toggler')">[ hide logs ]</a> <a onclick="app.actions.addWatch(${data.Userid}, '${data.Name}')">[ close ]</a></div></div>`
			var timeListB = `<div class="toggler-view"><div class="text-right"><a onclick="app.actions.toggleLogs('#card-id-${data.Userid} .toggler')">[ view logs ]</a>  <a onclick="app.actions.addWatch(${data.Userid}, '${data.Name}')">[ close ]</a></div></div>`;
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
				'watchers' : {}
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
		toggleLogs ( selector ) {
			app.utils.toggleClass( selector + '-view', 'hidden' );
			app.utils.toggleClass( selector + '-hide', 'hidden' );
		},
		start () {
			if ( Object.keys( app.data.watchers ).length ) {
				app.utils.fetchInfo().then( () => {
					// console.log( 'mana ko!' );
				} );
			}
		}
	}
} )();

app.actions.initialize().setDateToday().refreshEmployeeList();








