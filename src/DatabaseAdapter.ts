///<reference path="../d.ts/DefinitelyTyped/socket.io/socket.io.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/async/async.d.ts"/>
///<reference path="../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>

import _ = require('lodash');
import async = require('async');
import RuleEngine = require('RuleEngine');

import Database = require('db/DatabaseInterface');

interface Subscription {
	sockets: Socket[];
	path: String;
}

class DataBaseAdapter {
	private db : Database.db;
	private subscriptions;
	private ruleEngine: RuleEngine;

	constructor(db, ruleEngine: RuleEngine, subscriptions) {
		this.db = db;
		this.subscriptions = subscriptions;
		this.ruleEngine = ruleEngine;
	}

	set(req, socket: Socket, callback?: Function) {
		var path = req.path;
		var value = req.value;

		if(this.ruleEngine.canWrite(path)) {
			this.updateParentVersions(path, () => {
				console.log('Saving data', path, value);

				this.db.set(path, value, (error) => {
					if(error) {
						console.error(error);
						this.executeClientCallback(req.reqId, error, socket, path);
					}
					else {
						this.executeClientCallback(req.reqId, null, socket, path);
						this.notifySubscriptions(path, socket);
					}
				});
			});
		} else {
			console.log('WARNING: Permission denied, no write access', path);
			this.db.get(path, (error, value) => {
				if(error) console.log("ERROR cannot pull data on permission error");
				this.executeClientCallback(req.reqId, "Permission denied", socket, path, value);
			});
		}
	}

	update(req, socket: Socket, callback?: Function) {

		var path = req.path;
		var value = req.value;

		if(this.ruleEngine.canWrite(path)) {
			this.updateParentVersions(path, () => {
				console.log('Saving data', path, value);

				this.db.update(path, value, (error) => {
					if(error) {
						console.error(error);
						this.executeClientCallback(req.reqId, error, socket, path);
					}
					else {
						this.executeClientCallback(req.reqId, null, socket, path);
						this.notifySubscriptions(path, socket);
					}
				});
			});
		} else {
			console.log('WARNING: Permission denied, no write access', path);
			this.db.get(path, (error, value) => {
				if(error) console.log("ERROR cannot pull data on permission error");
				this.executeClientCallback(req.reqId, "Permission denied", socket, path, value);
			});
		}
	}

	get(req, socket: Socket) {
		var path = req.path;

		this.saveSubscription(path, socket);

		if(this.ruleEngine.canRead(path)) {
			this.db.get(path, (err, value) => {

				if(err) console.error('Error reading from db', path);
				else {
					// If there is no value submitted from the client or the server version
					// is behind the client version, send down an updated version from the
					// server, else update the server with the client data.
					if(((typeof req.value.value == 'undefined' && req.value !== null && !req.value.children) && value) || (value && value.version > req.value.version) ) {
						socket.emit('set', {
							path: path,
							value: value
						});
					} else if((req.value.value !== null && typeof req.value.value !== 'undefined') || req.value.children) {
						console.log('Replacing local data with client data');
						// @todo Need to merge the data if possible
						this.set(req, socket);
					}
				}
			});
		} else {
			console.log('WARNING: Permission denied, no read access', path);
			this.executeClientCallback(req.reqId, "Permission denied", socket, path);
		}
	}

	remove(req, socket: Socket, callback?: Function) {
		var path = req.path;

		if(this.ruleEngine.canWrite(path)) {
			this.updateParentVersions(path, () => {
				this.db.remove(path, (error) => {
					if(error) {
						console.error('Remove error: ', error);
						this.executeClientCallback(req.reqId, error, socket, path);
					}
					else {
						this.executeClientCallback(req.reqId, null, socket, path);
						this.notifySubscriptions(path, socket);
					}
				});
			});
		} else {
			console.log('WARNING: Permission denied, no write access', path);
			this.db.get(path, (error, value) => {
				if(error) console.log("ERROR cannot pull data on permission error");
				this.executeClientCallback(req.reqId, "Permission denied", socket, path, value);
			});
		}
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

	private notifySubscriptions(path: string, requestSocket: Socket) {
		var subscriptions = this.getSubscriptions(path);
		console.log('Found subscriptions', subscriptions);

		this.db.get(path, (error, value) => {
			if(error) {
				console.error(error);
			} else {
				_.each(subscriptions, (subscription) => {
					_.each(subscription.sockets, (socket) => {
						// Don't send a notification if the data doesn't exist or if the socket
						// to notify is the same socket that made the original request.
						if(typeof value !== 'undefined' && value !== null && requestSocket !== socket) {
							console.log('Notifying subscriber', socket.id, subscription.path);
							console.log('value', value);
							socket.emit('set', {
								path: path,
								value: value
							});
						}
					});
				});
			}
		})


	}

	private executeClientCallback(reqId: string, err: string, socket: Socket, path: string, data?: any) {
		socket.emit('syncComplete', {
			reqId: reqId,
			err: err,
			path: path,
			data: data
		});
	}

	private sendSuccess(path: string, socket: Socket) {
		socket.emit('syncSuccess', {
			path: path
		});
	}

	private sendError(path: string, socket: Socket) {
		socket.emit('syncError', {
			path: path
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
