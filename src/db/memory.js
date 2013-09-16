

var InMemory = (function () {
    function InMemory() {
        this.data = {};
    }
    InMemory.prototype.save = function (key, value, callback) {
        this.data[key] = value;

        setTimeout(callback, 0);

        return this;
    };

    InMemory.prototype.get = function (key, callback) {
        var value = this.data[key];

        setTimeout(function () {
            callback(null, value);
        }, 0);

        return this;
    };

    InMemory.prototype.remove = function (key, callback) {
        delete this.data[key];
        setTimeout(callback, 0);

        return this;
    };
    return InMemory;
})();


module.exports = InMemory;

//# sourceMappingURL=file:////home/blittle/dev/largemouth/src/db/memory.js.map
