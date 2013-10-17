///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/async/async.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>

import _ = require('lodash');
import async = require('async');

import Database = require('db/DatabaseInterface');

interface Subscription {
	sockets: Socket[];
	path: String;
}

class DataBaseAdapter {
	private db : Database.db;
	private subscriptions;

	constructor(db, subscriptions) {
		this.db = db;
		this.subscriptions = subscriptions;
	}

	set(req, socket: Socket) {
		var path = req.url;
		var value = req.value;

		this.updateParentVersions(path, () => {
			console.log('Saving data', path, value);

			this.db.set(path, value, (error) => {
				if(error) console.error(error);
				else this.notifySubscriptions(path);
			});
		});
	}

	update(req, socket: Socket) {

		var path = req.url;
		var value = req.value;

		this.updateParentVersions(path, () => {
			console.log('Saving data', path, value);

			this.db.update(path, value, (error) => {
				if(error) console.error(error);
				else this.notifySubscriptions(path);
			});
		});
	}

	get(req, socket: Socket) {
		var path = req.url;

		this.saveSubscription(path, socket);

		this.db.get(path, (err, value) => {

			if(err) console.error('Error reading from db', path);
			else {
				// If there is no value submitted from the client or the server version
				// is behind the client version, send down an updated version from the
				// server, else update the server with the client data.
				if(!req.value.value || (value && value.version > req.value.version) ) {
					socket.emit('data', {
						path: path,
						value: value
					});
				} else {
					this.set(req, socket);
				}
			}
		});
	}

	remove(req, socket: Socket) {
		this.updateParentVersions(req.path, () => {
			this.db.remove(req.path, (err) => {
				if(err) console.error('Remove error: ', err);
				else this.notifySubscriptions(req.path);
			});
		});
	}

	private updateParentVersions(path: string, callback: Function) {
		var newPath = "";
		var paths = path.split('/');
		paths.unshift("");
		var scope = this;

		console.log('Updating all parent versions for path', path);

		async.each(paths,
			function(p, callback) {
				newPath += newPath.length ? "/" + p : p;
				var cachedPath = newPath + "";
				scope.db.updateVersion.call(scope.db, cachedPath, callback);
			},
			function(err, results) {
				if(err) console.error('Updating path error: ', err);
				else callback();
			});
	}

	private notifySubscriptions(path: string) {
		var subscriptions = this.getSubscriptions(path);
		console.log('Found subscriptions', subscriptions);

		_.each(subscriptions, (subscription) => {
			// The db request is inside the loop because each subscription
			// may be at a different path.
			this.db.get(subscription.path, (error, value) => {
				if(error) {
					console.error(error);
				} else {
					_.each(subscription.sockets, (socket) => {
						if(typeof value !== 'undefined' && value !== null) {
							console.log('Notifying subscriber', socket.id, subscription.path);
							console.log('value', value);
							socket.emit('data', {
								path: subscription.path,
								value: value
							});
						}
					});
				}
			})
		});
	}

	public clearSubscription(socket: Socket) {

		console.log('Clearing subscription', socket.id);
		var oldSub = this.subscriptions;

		this.subscriptions = {};

		_.each(oldSub, (subList, key) => {
			// Remove all instances of "socket" from the subscription list
			_.pull(subList, socket);

			// If there are no sockets left, filter out the entire path
			if(subList.length) {
				this.subscriptions[key] = subList;
			}
		});

		console.log('remaining subscriptions', Object.keys(this.subscriptions));
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
