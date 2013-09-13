import Socket = require('src/socket');
import InMemory = require('src/db/memory');

var dbInstance = new InMemory();

Socket(dbInstance);