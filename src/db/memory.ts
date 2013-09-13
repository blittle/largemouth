import db = require('db');

class InMemory implements db {

	private data: any;

	constructor() {
		this.data = {};
	}

	save(key, value, callback) {

		this.data[key] = value;

		setTimeout(callback, 0);

		return this;
	}

	get(key, callback) {

		var value = this.data[key];

		setTimeout(() => {
			callback(null, value);
		}, 0);

		return this;
	}

	remove(key, callback) {

		delete this.data[key];
		setTimeout(callback, 0);

		return this;
	}
}

export = InMemory;