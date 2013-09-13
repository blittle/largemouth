import db = require('db');

class LevelUp implements db {
	constructor() {

	}

	save(key, value, callback) {
		return this;
	}

	get(key, callback) {
		return this;
	}

	remove(key, callback) {
		return this;
	}
}

export = LevelUp;