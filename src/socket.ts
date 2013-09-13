///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>
import _ = require('lodash');
import dbInterface = require('db/db');
import socketio = require('socket.io');

import subscriptions = require('subscriptions');

var start = function(db: dbInterface) {

	var io = socketio.listen(3000);

	io.sockets.on('connection', (socket: Socket) => {
		var id = _.uniqueId('c');

		subscriptions[id] = {};
	});


	io.sockets.on('connection', function (socket) {

		var id = _.uniqueId('c');

		subscriptions[id] = {};

		socket.set('connection_id', id, function () {
			socket.emit('ready');
		});

		socket.on('subscribe', function(dataPath) {
			console.log('subscribe', dataPath);
			subscriptions[id][dataPath] = socket;

			db.get(dataPath, function(err, value) {
				if (err) value = {};
				subscriptions[id][dataPath].emit('data', {
					path: dataPath,
					value: value
				});
			});
		});

		socket.on('set', function(obj) {

			db.save(obj.path, obj.value, function(err) {
				_.each(subscriptions, function(sub) {
					_.each(sub, function(socket, path) {
						if(path === obj.path) {
							socket.emit('data', {
								path: path,
								value: obj.value
							});
						}
					});
				});
			});
		});

		socket.on('disconnect', function() {
			delete subscriptions[id];
		});
	});
}

export = start;