var DatabaseAdapter = require('../src/DatabaseAdapter');
var InMemory = require('../src/db/InMemory');

var mockSocket = {
	emit: function() {
		this.calls.push(arguments);
	},
	calls: [],
	id: Math.random()
}, mockSocket2;

describe('Database Adapter', function () {
	var adapter, subscriptions;

	beforeEach(function () {
		mockSocket = {
			emit: function() {
				this.calls.push(arguments);
			},
			calls: [],
			id: Math.random()
		};

		mockSocket2 = {
			emit: function(type, res) {

			},
			calls: [],
			id: Math.random()
		}
		subscriptions = {};
		adapter = new DatabaseAdapter(new InMemory(), subscriptions);
	});

	afterEach(function() {
		adapter.clearSubscription(mockSocket);
	})

	it('Should initialize the memory datastructure', function() {
		adapter.get({ url: "some/path", value: {version: 1} }, mockSocket);
		expect(adapter.db.data.version).toBe(0);
		expect(adapter.db.data.children.some).toBeUndefined();
	});

	it('Should add a subscription', function () {
		adapter.get({ url: "some/path", value: {} }, mockSocket);
		expect(subscriptions['some/path'][0]).toBe(mockSocket);
	});

	it('Should should modify memory datastructure versions on set', function(run) {

		adapter.get({ url: "some/path", value: "" }, mockSocket);

		mockSocket.emit = function() {
			expect(adapter.db.data.version).toBe(1);
			expect(adapter.db.data.children.some.version).toBe(0);
			expect(adapter.db.data.children.some.children.path.version).toBe(3);
			run();
		}

		adapter.set({
			url: "some/path",
			value: {
				value: "something",
				version: 3,
				children: {}
			}
		}, mockSocket2)

	});

	it('Should save data and notify subscriptions', function(run) {

		adapter.get({ url: "some/path", value: {} }, mockSocket);

		mockSocket.emit = function() {
			expect(arguments[0]).toBe("set");
			expect(arguments[1].path).toBe("some/path");
			run();
		}

		adapter.set({url: "some/path", value: {
			value: "does this work",
			version: 0,
			children: {}
		}}, mockSocket2);
	});

	it('Should not notify subscribbers of same socket client', function(run) {
		adapter.get({ url: "some/1", value: {} }, mockSocket);
		adapter.get({ url: "some/2", value: {} }, mockSocket);

		adapter.get({ url: "some", value: {} }, mockSocket);

		adapter.set({url: "some/1", value: {
			value: "something",
			version: 3,
			children: {}
		}}, mockSocket);

		var i = 0;

		mockSocket.emit = function(type, res) {
			i++;
		}

		setTimeout(function() {
			// Should not make any response cause the
			// subscriber and requester are the same socket
			expect(i).toBe(0);
			run();
		}, 100);
	});

	it('Should only notify subscribers', function(run) {

		var i = 0;

		adapter.get({ url: "some/1", value: {} }, mockSocket);
		adapter.get({ url: "some/1", value: {} }, mockSocket2);

		adapter.set({url: "some/1", value: {
			value: "something",
			version: 3,
			children: {}
		}}, mockSocket);

		mockSocket2.emit = function(type, res) {
			i++;
			if(i === 1) {
				expect(res.path).toBe('some/1');
				expect(JSON.stringify(res.value)).toBe(JSON.stringify({ version : 3, children : {  }, value : 'something' }));
				expect(type).toBe('set');

				setTimeout(function() {
					expect(i).toBe(1);
					run();
				}, 100);
			}
		}
	});

	it('Should not send messages for blank data', function(run) {
		adapter.get({ url: "some/1", value: {} }, mockSocket);
		adapter.get({ url: "some", value: {} }, mockSocket);
		adapter.get({ url: "some/2", value: {} }, mockSocket);

		adapter.set({url: "some/1", value: {
			value: "something",
			version: 3,
			children: {}
		}}, mockSocket);

		adapter.set({"url":"some","value":{"version":0}}, mockSocket);

		adapter.set({url: "some/2", value: {
			value: "something2",
			version: 3,
			children: {}
		}}, mockSocket);

		var i = 0;

		mockSocket.emit = function(type, res) {
			i++;
		}

		setTimeout(function() {
			// No messages should have been sent to the client
			expect(i).toBe(0);
			run();
		}, 100);
	});

	it('Should execute onComplete callback on set', function(run) {
		var onCompleteCalls = 0;;

		adapter.get({ url: "books/alma", value: {} }, mockSocket);

		adapter.set({url: "books/alma", value: {
			value: "heleman",
			version: 3,
			children: {}
		}}, mockSocket, function() {
			onCompleteCalls++;
		});

		setTimeout(function() {
			expect(onCompleteCalls).toBe(1);
			run();
		}, 100);
	});

	it('Should execute onComplete callback on update', function(run) {
		var onCompleteCalls = 0;;

		adapter.get({ url: "books/alma", value: {} }, mockSocket);

		adapter.update({url: "books/alma", value: {
			value: "heleman",
			version: 3,
			children: {}
		}}, mockSocket, function() {
			onCompleteCalls++;
		});

		setTimeout(function() {
			expect(onCompleteCalls).toBe(1);
			run();
		}, 100);
	});

	it('Should execute onComplete callback on remove', function(run) {
		var onCompleteCalls = 0;

		adapter.get({ url: "books/alma", value: {} }, mockSocket);

		adapter.set({url: "books/alma", value: {
			value: "heleman",
			version: 3,
			children: {}
		}}, mockSocket);

		adapter.remove({ url: "books/alma" }, mockSocket, function() {
			onCompleteCalls++;
		});

		setTimeout(function() {
			expect(onCompleteCalls).toBe(1);
			run();
		}, 100);
	});
});