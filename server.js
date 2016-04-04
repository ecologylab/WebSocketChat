// This node.js program implements a simple chat room service.

// Create a web server using Express.
var express = require('express');
var app = express();
var server = require('http').createServer(app);

// Add WebSocket support to the web server, using socket.io.
var io = require('socket.io')(server);

// Serve static files on the root path.
app.use('/', express.static('static'));

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
    if (msg && msg.user_id) {
      // Message seems valid.
      conn.user_id = msg.user_id;
      conn.emit('login_ok');
      // Broadcast that someone entered the room.
      io.emit('notification', msg.user_id + ' entered the room.');
      // Send a welcome message.
      conn.emit('notification', "welcome to the chat room, " + conn.user_id + "!");
    } else {
      // When something is wrong, send a login_fail message to the client.
      conn.emit('login_fail');
    }
  });

  conn.on('chat', function(msg) {
    if (msg && msg.content) {
      // Broadcast this message to everyone in the room.
      io.emit('chat', {
        sender: conn.user_id,
        content: msg.content,
      });
    }
    // If the message seems invalid, it'll be ignored.
  });

  conn.on('disconnect', function() {
    io.emit('notification', conn.user_id + ' left the room.');
  });
});

// Listen on a high port.
var port = 12121;
server.listen(port, function() {
  console.log("Listening on port " + port);
});

