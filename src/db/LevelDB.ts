///<reference path="../../d.ts/DefinitelyTyped/levelup/levelup.d.ts"/>

import levelup = require('levelup');
import Database = require('DatabaseInterface');

class LevelUp {

	private db;

	constructor(dbLocation = './leveldb') {
		this.db = levelup(dbLocation, {valueEncoding: "json"});
	}

	save(key, value, callback) {
		this.db.put(key, value, callback);
		return this;
	}

	get(key, callback) {
		this.db.get(key, callback);
		return this;
	}

	remove(key, callback) {
		this.db.del(key, callback);
		return this;
	}
}

export = LevelUp;