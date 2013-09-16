#!/usr/bin/env node

'use strict';
var nopt = require("nopt"),
	knownOpts = {
		"port": Number,
		"database": String,
		"help": Boolean
	},
	shortHands = {
		"p": "--port",
		"d": "--database",
		"h": "--help"
	},
	parsed = nopt(knownOpts, shortHands, process.argv, 2);

if(parsed.help) {
	console.log("SmallMouth BAAS");
	console.log("---------------");
	console.log("--help | -h - print help");
	console.log("--port | -p - port to boot server on");
	console.log("--database | -d - 'inmemory' [default] or 'leveldb'");
	return;
}

var Socket = require("../src/socket");
var InMemory = require("../src/db/memory");

var dbPath = parsed.database === 'leveldb' ? '../src/db/leveldb' : '../src/db/memory';

var dbInstance = new (require(dbPath))();

Socket(dbInstance, parsed);

