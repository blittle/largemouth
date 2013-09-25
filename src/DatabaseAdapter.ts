///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>

import _ = require('lodash');

import Database = require('db/DatabaseInterface');

class DataBaseAdapter {
	private db : Database;
	private subscriptions;

	constructor(db, subscriptions) {
		this.db = db;
		this.subscriptions = subscriptions;
	}

	save(key, value, socket: Socket) {

		_.each(this.subscriptions, function(sub) {
			_.each(sub, function(socket, path) {
				if(path === key) {
					socket.emit('data', {
						path: path,
						value: value
					});
				}
			});
		});
	}

	get(path, socket: Socket) {
		this.subscriptions[socket.id][path] = socket;

		this.db.get(path, (err, value) => {
			if (err) value = {};
			this.subscriptions[socket.id][path].emit('data', {
				path: path,
				value: value
			});
		});
	}

	remove(key, value, socket: Socket) {

	}
}

export = DataBaseAdapter;
