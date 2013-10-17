///<reference path="../../d.ts/DefinitelyTyped/underscore/underscore.d.ts"/>

import _ = require('lodash');

import Database = require('DatabaseInterface');

class InMemory implements Database.db {

	private data: any;

	constructor() {
		this.data = {
			version: 0,
			children: {}
		};
	}

	set(path, value: Database.element, callback) {

		var paths = path.split('/');

		var data = this.data;

		_.each(paths, function(path) {
//			if(!data.children) data.children = {};

			if(!data.children[path]) {
				data.children[path] = {
					version: 0,
					children: {}
				}
			}

			data = data.children[path];
		});

		data.version = value.version;
		if(value.value) data.value = value.value;
		else data.children = value.children || {};

		if(callback) setTimeout(callback, 0);

		return this;
	}

	update(path, value: Database.element, callback) {

		var paths = path.split('/');

		var data = this.data;

		_.each(paths, function(path) {
//			if(!data.children) data.children = {};

			if(!data.children[path]) {
				data.children[path] = {
					version: 0,
					children: {}
				}
			}

			data = data.children[path];
		});

		this.mergeDataFromElement(data, value);

		if(callback) setTimeout(callback, 0);

		return this;
	}

	get(path, callback) {

		var paths = path.split('/');

		var data = this.data;

		for(var i = 0, iLength = paths.length; i < iLength; i++) {
			if(!data.children[paths[i]]) {
				if(callback) callback(null, null);
				return this;
			}

			data = data.children[paths[i]];
		}

		if(callback) {
			setTimeout(function() {
				callback(null, data);
			}, 0);
		}

		return this;
	}

	remove(path, callback) {

		var paths = path.split('/');

		var data = this.data;

		for(var i = 0, iLength = (paths.length - 1); i < iLength; i++) {
//			if(!data.children) data.children = {};

			if(!data.children[paths[i]]) break;
			data = data.children[paths[i]];
		}

		if(data.children) delete data.children[paths[paths.length - 1]];

		if(callback) setTimeout(callback, 0);

		return this;
	}

	updateVersion(path, callback) {

		console.log('updating version for path', path, this.data.version);

		var paths = path.split('/');

		var data = this.data;
		var skip = false;

		if(path.length) {
			for(var i = 0, iLength = paths.length; i < iLength; i++) {
//			if(!data.children) break;

				if(!data || !data.children[paths[i]]) {
					skip = true;
					break;
				}
				data = data.children[paths[i]];
			}
		}

		if(!skip && data && typeof data.version !== 'undefined') {
			data.version++;
		}

		if(callback) setTimeout(callback, 0);

		return this;
	}

	private mergeDataFromElement(data: Database.element, el: Database.element) {
		if(el.value) {
			data.value = el.value;
			return;
		}

		_.each(el.children, (child, key) => {
//			if(!data.children) break;

			if(!data.children[key]) {
				data.children[key] = {
					version: 0,
					children: {}
				}
			}

			this.mergeDataFromElement(data.children[key], child);
		});
	}
}

export = InMemory;
