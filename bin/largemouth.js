#!/usr/bin/env node
'use strict';

var config = require('../src/Config');
var path = require('path');

var nopt = require("nopt"),
	knownOpts = {
		"port": Number,
		"database": String,
		"config": String,
		"help": Boolean
	},
	shortHands = {
		"p": "--port",
		"d": "--database",
		"h": "--help",
		"c": "--config"
	},
	parsed = nopt(knownOpts, shortHands, process.argv, 2);

if(parsed.help) {
	console.log("SmallMouth BAAS");
	console.log("---------------");
	console.log("--help | -h - print help");
	console.log("--port | -p - port to boot server on");
	console.log("--database | -d - 'inmemory' [default] or 'leveldb'");
	console.log("--config | -c - path to the config file 'gruntfile.js' [default]");
	return;
}

parsed.config = parsed.config || "largemouth.js";

var Socket = require("../src/Socket");

var dbPath = parsed.database === 'leveldb' ? '../src/db/LevelDB' : '../src/db/InMemory';
var dbInstance = new (require(dbPath))();

try {
	var configFile = require(path.join(process.cwd(), parsed.config));
	// Load config with the default config object
	configFile(config.instance);
	console.log('Configuration loaded');
} catch(err) {}

Socket(require('socket.io'), dbInstance, config.instance, parsed);

var http = require('http');

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(dbInstance.data));
}).listen(1337, '127.0.0.1');