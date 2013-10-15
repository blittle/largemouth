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
        adapter.get({ url: "some/path" }, mockSocket);
        expect(adapter.db.data.version).toBe(0);
        expect(adapter.db.data.children.some.version).toBe(0);
        expect(adapter.db.data.children.some.children.path.version).toBe(0);
    });

    it('Should add a subscription', function () {
        adapter.get({ url: "some/path" }, mockSocket);
        expect(subscriptions['some/path'][0]).toBe(mockSocket);
    });

    it('Should should modify memory datastructure versions on set', function(run) {
        console.log('1');
        mockSocket.emit = function() {
            console.log('2');
            this.calls.push(arguments);
            run();
        }

        adapter.get({ url: "some/path" }, mockSocket);
        adapter.set({url: "some/path", value: "does this work"}, mockSocket);

        expect(adapter.db.data.version).toBe(1);
        expect(adapter.db.data.children.some.version).toBe(1);
        expect(adapter.db.data.children.some.children.path.version).toBe(1);
    });

    it('Should save data and notify subscriptions', function(run) {
        console.log('3');

        adapter.get({ url: "some/path", data: 1 }, mockSocket);

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