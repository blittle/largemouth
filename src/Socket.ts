///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>

import _ = require('lodash');

import Database = require('db/DatabaseInterface');
import DatabaseAdapter = require('DatabaseAdapter');
import ServerOptions = require('ServerOptions');
import subscriptions = require('subscriptions');
import RuleEngine = require('RuleEngine');
import Config = require('Config');

var start = function(socketio: any, db: Database.db, config: Config.Interface, options: ServerOptions) {

	var ruleEngine = new RuleEngine(config.rules);
	var io : SocketManager = socketio.listen(options.port || config.port || 3000);
	var adapter = new DatabaseAdapter(db, ruleEngine, subscriptions);

	io.sockets.on('connection', function (socket: Socket) {

		socket.emit('ready', {id: socket.id});

		socket.on('subscribe', function(req) {
			console.log('subscribe', req.path);
			adapter.get(req, socket);
		});

		socket.on('set', function(req) {
			console.log('set', req.path, req.value);
			adapter.set(req, socket); });

		socket.on('update', function(req) {
			adapter.update(req, socket);
		});

		socket.on('remove', function(req) {
			adapter.remove(req, socket);
		});

		socket.on('disconnect', function() {
			adapter.clearSubscription(socket);
		});

		// Initialize custom events
		_.each(config.events, function(event, key: string) {
			socket.on(key, function(req) {
				event(req, socket, adapter);
			});
		});
	});
}


export = start;