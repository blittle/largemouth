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
});