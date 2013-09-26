///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>

import _ = require('lodash');

import Database = require('db/DatabaseInterface');

interface Subscription {
	sockets: Socket[];
	path: String;
}

class DataBaseAdapter {
	private db : Database;
	private subscriptions;

	constructor(db, subscriptions) {
		this.db = db;
		this.subscriptions = subscriptions;
	}

	save(key, value, socket: Socket) {
		console.log('Saving data', key, value);

		this.db.save(key, value, (error) => {
			if(error) {
				console.error(error);
			} else {
				var subscriptions = this.getSubscriptions(key);
				console.log('Found subscriptions', subscriptions);

				_.each(subscriptions, (subscription) => {
					this.db.get(subscription.path, (error, value) => {
						if(error) {
							console.error(error);
						} else {
							_.each(subscription.sockets, (socket) => {
								console.log('Notifying subscriber', socket.id, subscription.path);
								console.log('value', value);
								socket.emit('data', {
									path: subscription.path,
									value: value
								});
							});
						}
					})
				});
			}
		});
	}

	get(path, socket: Socket) {
		this.saveSubscription(path, socket);

		this.db.get(path, (err, value) => {
			if (err) value = {};
			socket.emit('data', {
				path: path,
				value: value
			});
		});
	}

	remove(key, value, socket: Socket) {

	}

	private saveSubscription(path: string, socket: Socket): DataBaseAdapter {
		console.log('Saving subscription', path);

		if(!this.subscriptions[path]) {
			this.subscriptions[path] = [socket];
		} else {
			this.subscriptions[path].push(socket);
		}

		return this;
	}

	private getSubscriptions(path) {

		return _.chain(this.subscriptions)
			.map((sockets, path)=> {
			    return {
					path: path,
					sockets: sockets
				}
			})
			.filter((sub: Subscription) => {
				return (path.indexOf(sub.path) === 0 || sub.path.indexOf(path) === 0);
			})
			.value();
	}
}

export = DataBaseAdapter;
