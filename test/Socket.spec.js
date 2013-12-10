var Socket = require('../src/Socket');
var InMemory = require('../src/db/InMemory');

var events = {};

var socketio = {
	listen: function() {
		return {
			sockets: {
				on: function(name, callback) {
					callback({
						on: function(type, callback) {
							events[type] = callback;
						},
						emit: function() {}
					})
				}
			},

			configure: function() {

			},

			set: function() {

			}
		}
	}
};

describe('In Memory DB', function () {
	var db, socket;

	var customCallbackCalled1 = false;
	var customCallbackCalled2 = false;

	beforeEach(function () {
		db = new InMemory();
		socket =  Socket(socketio, db, {events: {
			'myCustomCallback': function(test) { customCallbackCalled1 = true;},
			'myOtherCustomCallback': function(test) { customCallbackCalled2 = true; }
		}}, {});
	});

	afterEach(function() {
		var events = {};
	});

	it('Should setup all the initial events correctly', function() {
		expect(events.set).toBeDefined();
		expect(events.update).toBeDefined();
		expect(events.remove).toBeDefined();
		expect(events.disconnect).toBeDefined();
		expect(events.set).toBeDefined();
	});

	it('Should register custom callbacks', function() {
		expect(events.myCustomCallback).toBeDefined();
		expect(events.myOtherCustomCallback).toBeDefined();

		events.myCustomCallback();
		events.myOtherCustomCallback();
		expect(customCallbackCalled1).toBeTruthy();
		expect(customCallbackCalled2).toBeTruthy();
	});

});