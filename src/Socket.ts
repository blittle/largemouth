///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>

import socketio = require('socket.io');

import Database = require('db/DatabaseInterface');
import DatabaseAdapter = require('DatabaseAdapter');
import ServerOptions = require('ServerOptions');
import subscriptions = require('subscriptions');

var start = function(db: Database.db, options: ServerOptions) {

	var io = socketio.listen(options.port || 3000);
	var adapter = new DatabaseAdapter(db, subscriptions);

	io.sockets.on('connection', function (socket: Socket) {

		socket.emit('ready');

		socket.on('subscribe', function(req) {
			console.log('subscribe', req.url);
			adapter.get(req, socket);
		});

		socket.on('set', function(req) {
			console.log('BRET', req);
			adapter.set(req, socket);
		});

		socket.on('update', function(req) {
			adapter.update(req, socket);
		});

		socket.on('remove', function(req) {
			adapter.remove(req, socket);
		});

		socket.on('disconnect', function() {
			adapter.clearSubscription(socket);
		});
	});
}

export = start;