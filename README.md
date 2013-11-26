![LargeMouth an open BAAS](largemouth.png) [![Build Status](https://travis-ci.org/blittle/largemouth.png?branch=master)](https://travis-ci.org/blittle/largemouth)
========

An open BAAS with a similar API to firebase.

##Motivation
[Firebase](http://firebase.com) is a Backend As A Service (BAAS) which allows developers to quickly build applications without worrying about the communication layer between the server and client. Firebase is awesome but the backend remains entirely proprietary. LargeMouth / SmallMouth attempt to recreate the Firebase api as an open-source project. Idealy a Firebase app could be easily moved to SmallMouth and vice versa.

LargeMouth is built on top of [Socket.io](http://socket.io/) and [NodeJS](http://nodejs.org/).

##Installation
```bash
npm install -g largemouth
```

##Boot Options
Change the server port (3000 default):
```bash
largemouth -p 3000
```
Change the location of the configuration file (working directory largemouth.js default):
```bash
largemouth -c ../myConfig.js
```

##SmallMouth
[SmallMouth](https://github.com/blittle/smallmouth) is the client side library.

##Configuration
Server configuration is defined within a JavaScript file by default located within the working directory of where LargeMouth is run.
The config file allows the following:
 - Permissions - The security permission definition.
 - Custom events - Define custom events which the server will listen for.

An example config file:

```javascript
module.exports = function(largemouth) {

	// Optionally define the server port here (commandline will override this value)
	largemouth.port = 3000;[[

	// The custom event will be passed a request object which will contain
	// any data sent from the client as well as the actual socket instance,
	// allowing you to respond to the client with custom events through socket.emit
	largemouth.events['someEvent'] = function(req, socket) {
			console.log('hi', req);
		}
	}

	// Only basic rules implemented, no expressions/variables
	largemouth.rules = {
		".read": true,
		".write": false,
		"chats": {
			".read": true,
			".write": true
		}
	}
}
```

##Release notes
 - 0.2.4 - Load the config file and define custom events.
 - 0.2.0 - Don't send down entire datasets to notify clients of changes, rather send down what changed and allow the client to resolve the data.
 - 0.1.0 - Minimal portion of the Firebase API supported.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/blittle/largemouth/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

