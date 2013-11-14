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
		adapter.get({ path: "some/path", value: {version: 1} }, mockSocket);
		expect(adapter.db.data.version).toBe(0);
		expect(adapter.db.data.children.some).toBeUndefined();
	});

	it('Should add a subscription', function () {
		adapter.get({ path: "some/path", value: {} }, mockSocket);
		expect(subscriptions['some/path'][0]).toBe(mockSocket);
	});

	it('Should should modify memory datastructure versions on set', function(run) {

		adapter.get({ path: "some/path", value: "" }, mockSocket);

		mockSocket.emit = function() {
			expect(adapter.db.data.version).toBe(1);
			expect(adapter.db.data.children.some.version).toBe(0);
			expect(adapter.db.data.children.some.children.path.version).toBe(3);
			run();
		}

		adapter.set({
			path: "some/path",
			value: {
				value: "something",
				version: 3,
				children: {}
			}
		}, mockSocket2)

	});

	it('Should save data and notify subscriptions', function(run) {

		adapter.get({ path: "some/path", value: {} }, mockSocket);

		mockSocket.emit = function() {
			expect(arguments[0]).toBe("set");
			expect(arguments[1].path).toBe("some/path");
			run();
		}

		adapter.set({path: "some/path", value: {
			value: "does this work",
			version: 0,
			children: {}
		}}, mockSocket2);
	});

	it('Should not notify subscribbers of same socket client', function(run) {
		adapter.get({ path: "some/1", value: {} }, mockSocket);
		adapter.get({ path: "some/2", value: {} }, mockSocket);

		adapter.get({ path: "some", value: {} }, mockSocket);

		adapter.set({path: "some/1", reqId: 1, value: {
			value: "something",
			version: 3,
			children: {}
		}}, mockSocket);

		setTimeout(function() {
			// Should not make any response cause the
			// subscriber and requester are the same socket
            // except for the set success event
			expect(mockSocket.calls.length).toBe(1);
            expect(mockSocket.calls[0][1].reqId).toBe(1);
			run();
		}, 100);
	});

	it('Should only notify subscribers', function(run) {

		var i = 0;

		adapter.get({ path: "some/1", value: {} }, mockSocket);
		adapter.get({ path: "some/1", value: {} }, mockSocket2);

		adapter.set({path: "some/1", value: {
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
		adapter.get({ path: "some/1", value: {} }, mockSocket);
		adapter.get({ path: "some", value: {} }, mockSocket);
		adapter.get({ path: "some/2", value: {} }, mockSocket);

		adapter.set({path: "some/1", reqId: 1, value: {
			value: "something",
			version: 3,
			children: {}
		}}, mockSocket);

		adapter.set({"path":"some", reqId: 2, "value":{"version":0}}, mockSocket);

		adapter.set({path: "some/2", reqId: 3, value: {
			value: "something2",
			version: 3,
			children: {}
		}}, mockSocket);

		setTimeout(function() {
			// Only success messages should be sent to the client
			expect(mockSocket.calls.length).toBe(3);
            expect(mockSocket.calls[0][1].reqId).toBe(1);
            expect(mockSocket.calls[1][1].reqId).toBe(2);
            expect(mockSocket.calls[2][1].reqId).toBe(3);
			run();
		}, 100);
	});

	it('Should execute onComplete callback on set', function(run) {

		adapter.get({ path: "books/alma", value: {} }, mockSocket);

		adapter.set({path: "books/alma", reqId: 100, value: {
			value: "heleman",
			version: 3,
			children: {}
		}}, mockSocket);

		setTimeout(function() {
            expect(mockSocket.calls.length).toBe(1);
            expect(mockSocket.calls[0][1].reqId).toBe(100);
            expect(mockSocket.calls[0][1].err).toBe(null);
			run();
		}, 100);
	});

	it('Should execute onComplete callback on update', function(run) {

		adapter.get({ path: "books/alma", value: {} }, mockSocket);

		adapter.update({path: "books/alma", reqId: 100, value: {
			value: "heleman",
			version: 3,
			children: {}
		}}, mockSocket);

		setTimeout(function() {
            expect(mockSocket.calls.length).toBe(1);
            expect(mockSocket.calls[0][1].reqId).toBe(100);
            expect(mockSocket.calls[0][1].err).toBe(null);
			run();
		}, 100);
	});

	it('Should execute onComplete callback on remove', function(run) {

		adapter.get({ path: "books/alma", value: {} }, mockSocket);

		adapter.set({path: "books/alma", reqId: 100, value: {
			value: "heleman",
			version: 3,
			children: {}
		}}, mockSocket);

		adapter.remove({ path: "books/alma", reqId: 101 }, mockSocket);

		setTimeout(function() {
			expect(mockSocket.calls.length).toBe(2);
            expect(mockSocket.calls[1][1].reqId).toBe(101);
            expect(mockSocket.calls[1][1].err).toBe(null);
			run();
		}, 100);
	});
});