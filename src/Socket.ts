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

		socket.emit('ready', {id: socket.id});

		socket.on('subscribe', function(req) {
			console.log('subscribe', req.url);
			adapter.get(req, socket);
		});

		socket.on('set', function(req, callback) {
			console.log('set', req.url, req.value);
			adapter.set(req, socket, callback);
		});

		socket.on('update', function(req, callback) {
			adapter.update(req, socket, callback);
		});

		socket.on('remove', function(req, callback) {
			adapter.remove(req, socket, callback);
		});

		socket.on('disconnect', function() {
			adapter.clearSubscription(socket);
		});
	});
}


export = start;