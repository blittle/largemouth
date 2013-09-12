var levelup = require('level'),
_ = require('lodash');

// 1) Create our database, supply location and options.
//    This will create or open the underlying LevelDB store.
var db = levelup('./mydb')

var io = require('socket.io').listen(3000);

var subscriptions = {};

io.sockets.on('connection', function (socket) {

	var id = _.uniqueId('c');

	subscriptions[id] = {};

	socket.set('connection_id', id, function () {
      socket.emit('ready');
    });

	socket.on('subscribe', function(dataPath) {
		console.log('subscribe', dataPath);
		subscriptions[id][dataPath] = socket;
		
		db.get(dataPath, function(err, value) {
			if (err) value = {};
			subscriptions[id][dataPath].emit('data', {
				path: dataPath,
				value: value
			});
		});
	});

	socket.on('set', function(obj) {
		
		db.put(obj.path, obj.value, function(err) {
			_.each(subscriptions, function(sub) {
				_.each(sub, function(socket, path) {
					if(path === obj.path) {
						socket.emit('data', {
							path: path,
							value: obj.value	
						});
					}
				});
			});
		});
	});

	socket.on('disconnect', function() {
		delete subscriptions[id];
	});
});