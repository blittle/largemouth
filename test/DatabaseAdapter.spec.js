var DatabaseAdapter = require('../src/DatabaseAdapter');
var InMemory = require('../src/db/InMemory');

var mockSocket = {
	emit: function() {
		this.calls.push(arguments);
	},
	calls: [],
	id: Math.random()
};

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
		subscriptions = {};
		adapter = new DatabaseAdapter(new InMemory(), subscriptions);
	});

	afterEach(function() {
		adapter.clearSubscription(mockSocket);
	})

	it('Should initialize the memory datastructure', function() {
		adapter.get({ url: "some/path", value: {} }, mockSocket);
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

		adapter.set({url: "some/path", value: {
			value: "something",
			version: 3,
			children: {}
		}}, mockSocket);


	});

	it('Should save data and notify subscriptions', function(run) {

		adapter.get({ url: "some/path", value: {} }, mockSocket);

		mockSocket.emit = function() {
			expect(arguments[1].value.value).toBe("does this work");
			run();
		}

		adapter.set({url: "some/path", value: {
			value: "does this work",
			version: 0,
			children: {}
		}}, mockSocket);
	});

	it('Should only notify subscribers', function(run) {
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
			if(i == 1) {
				expect(res.path).toBe('some/1');
				expect(JSON.stringify(res.value)).toBe(JSON.stringify({"version":3,"children":{},"value":"something"}));
			}
			if(i == 2) {
				expect(res.path).toBe('some');
				expect(JSON.stringify(res.value)).toBe(JSON.stringify({ version : 0, children : { 1 : { version : 3, children : {  }, value : 'something' } } }));
			}
			if(i == 2) run();
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

		console.log('--------------------------------------');

		mockSocket.emit = function(type, res) {
			i++;

			if(i == 5) {
				setTimeout(function() {
					// There should only be 5 messages emmited the client
					expect(i).toBe(5);
					run();
				}, 100);
			}
		}
	});
});