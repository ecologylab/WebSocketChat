// This node.js program implements a simple chat room service.

// Database related.
var MongoClient = require('mongodb').MongoClient;
var dbUrl = 'mongodb://localhost:27017/chat';
var db = null;

var collections = require('./collections');
var messages = collections.messages;

// Create a web server using Express.
var express = require('express');
var app = express();
var server = require('http').createServer(app);

// Add WebSocket support to the web server, using socket.io.
var io = require('socket.io')(server);

// Serve static files on the root path.
app.use('/', express.static('static'));

// Utility function for computing a digest.
var crypto = require('crypto');
function digest(input) {
  var d = crypto.createHash('md5').update(input).digest('base64').substr(0, 12);
  return d.replace(/\+/g, '-').replace(/\//g, '_');
}

// Tells socket.io to listen to a built-in event 'connection'. This event is
// triggered when a client connects to the server. At that time, the callback
// function (the 2nd argument) will be called with an object (named as 'conn')
// representing the connection.
io.sockets.on('connection', function(conn) {
  // JavaScript functions are 'closures', which means they keep references to
  // local variables in the scope they were created.
  //
  // That means, for each connected client, the JavaScript engine will create
  // the callback functions given to conn.on() below, each of which keeps a
  // reference to that connection (represented by 'conn'). That's why we can
  // refer to 'conn' in these callback functions to get the correct connection.

  conn.on('login', function(msg) {
    if (msg && msg.user_id
        && /^[^\/]+$/.test(msg.user_id)
        && msg.user_id != '*'
        && msg.user_id != 'system') {
      // Message seems valid.
      conn.user_id = msg.user_id;

      conn.emit('login_ok');

      // Retrieve chat history and send to this client.
      messages.all(db, function(err, result) {
        if (err) {
          return console.error(err);
        }
        if (result) {
          if (result.sender === 'system') {
            conn.emit('notification', result);
          } else {
            conn.emit('chat', result);
          }
        }
      });

      // Broadcast that someone entered the room.
      var notif = {
        ts: Date.now(),
        sender: "system",
        receiver: "*",
        content: conn.user_id + " entered the room.",
      };
      notif._id = digest(notif.receiver + notif.ts + notif.content);
      io.emit('notification', notif);
      messages.insert(db, notif, function(err, result) {
        if (err) {
          return console.error(err);
        }
        console.log("message inserted: " + notif);
      });
    } else {
      // When something is wrong, send a login_fail message to the client.
      conn.emit('login_fail');
    }
  });

  conn.on('chat', function(msg) {
    if (msg && msg.content) {
      // Broadcast this message to everyone in the room.
      var chat = {
        ts: Date.now(),
        sender: conn.user_id,
        receiver: "*",
        content: msg.content,
      };
      chat._id = digest(chat.sender + chat.ts + chat.content);
      io.emit('chat', chat);
      messages.insert(db, chat, function(err, result) {
        if (err) {
          return console.error(err);
        }
        console.log("message inserted: " + chat);
      });
    }
    // If the message seems invalid, it'll be ignored.
  });

  conn.on('disconnect', function() {
    if (conn.user_id) {
      var notif = {
        ts: Date.now(),
        sender: "system",
        receiver: "*",
        content: conn.user_id + " left the room.",
      };
      notif._id = digest(notif.receiver + notif.ts + notif.content);
      io.emit('notification', notif);
      messages.insert(db, notif, function(err, result) {
        if (err) {
          return console.error(err);
        }
        console.log("message inserted: " + notif);
      });
    }
  });
});

// Path like /u/yin/messages
app.use(/\/u\/([^\/]+)\/messages/, function(req, res) {
  var userId = req.params[0];
  var msgs = new Array();
  messages.find(db, { sender: userId }, function(err, result) {
    if (err) {
      return console.error(err);
    }
    if (result) {
      msgs.push(JSON.stringify(result));
    } else {
      res.type('text/plain').send(msgs.join('\n'));
    }
  });
});

var port = 12121;

// Connect to database, before starting the web server.
MongoClient.connect(dbUrl, function(err, result) {
  if (err) {
    return console.error("Cannot connect to database: " + url);
  }

  db = result;

  // Start the web server on a high port.
  server.listen(port, function() {
    console.log("Listening on port " + port);
  });
});

