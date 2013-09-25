///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>

import socketio = require('socket.io');

import Database = require('db/DatabaseInterface');
import DatabaseAdapter = require('DatabaseAdapter');
import ServerOptions = require('ServerOptions');
import subscriptions = require('subscriptions');

var start = function(db: Database, options: ServerOptions) {

	var io = socketio.listen(options.port || 3000);
	var adapter = new DatabaseAdapter(db, subscriptions);

	io.sockets.on('connection', function (socket: Socket) {

		subscriptions[socket.id] = {};

		socket.emit('ready');

		socket.on('subscribe', function(dataPath) {
			console.log('subscribe', dataPath);
			adapter.get(dataPath, socket);
		});

		socket.on('set', function(obj) {
			adapter.save(obj.path, obj.value, socket);
		});

		socket.on('disconnect', function() {
			delete subscriptions[socket.id];
		});
	});
}

export = start;