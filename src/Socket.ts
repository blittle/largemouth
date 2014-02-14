///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>

import _ = require('lodash');

import Database = require('db/DatabaseInterface');
import DatabaseAdapter = require('./DatabaseAdapter');
import ServerOptions = require('./ServerOptions');
import subscriptions = require('./subscriptions');
import RuleEngine = require('./RuleEngine');
import Config = require('./Config');

var start = function(socketio: any, db: Database.db, config: Config.Interface, options: ServerOptions) {

	var ruleEngine = new RuleEngine(config.rules);
	var io : SocketManager = socketio.listen(options.port || config.port || 3000);
	var adapter = new DatabaseAdapter(db, ruleEngine, subscriptions);

	var tokens = {};

	io.sockets.on('connection', function (socket: Socket) {

		var authenticated = false;

		function authCheck() {
			if(!authenticated) {
				console.error('not authenticated');
				socket.emit('error', 'not authenticated');
			}
		}

		var handshake = socket.manager.handshaken[socket.id];

		if(handshake) tokens[handshake.token] = socket.id;

		socket.emit('ready');

		socket.on('auth', function(req) {
			if(config.auth) {
				config.auth(req, function(error, auth, token) {
					if(!error && auth) {
						authenticated = true;
						socket.emit('auth', {
							id: socket.id,
							token: token
						});
					} else {
						socket.emit('authError', error);
						socket.disconnect();
					}
				});
			}
		});

		socket.on('subscribe', function(req) {
			if(authCheck()) return;
			console.log('subscribe', req.path);
			adapter.get(req, socket);
		});

		socket.on('set', function(req) {
			if(authCheck()) return;
			console.log('set', req.path, req.value);
			adapter.set(req, socket); });

		socket.on('update', function(req) {
			if(authCheck()) return;
			adapter.update(req, socket);
		});

		socket.on('remove', function(req) {
			if(authCheck()) return;
			adapter.remove(req, socket);
		});

		socket.on('disconnect', function() {
			if(authCheck()) return;
			adapter.clearSubscription(socket);
		});

		// Initialize custom events
		_.each(config.events, function(event, key: string) {
			socket.on(key, function(req) {
				if(authCheck()) return;
				event(req, socket, adapter);
			});
		});
	});
}


export = start;