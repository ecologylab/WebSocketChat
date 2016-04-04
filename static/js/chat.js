// Chat using socket.io.

function createMessageDiv(sender, content) {
  // A <div> for displaying the content.
  var msgDiv = $('<div/>').addClass('msg_box');
  msgDiv.append($('<span/>').addClass('sender').text(sender));
  msgDiv.append($('<span/>').addClass('said').text(' said: '));
  msgDiv.append($('<span/>').addClass('msg_content').text(content));

  return msgDiv;
}

function createNotificationDiv(content) {
  var notificationDiv = $('<div/>').addClass('msg_box');
  notificationDiv.append($('<span/>').addClass('notification').text(content));
  return notificationDiv;
}

function startChat(userId) {
  $('#login_section').hide();
  $('#room_section').show();

  var loginStatus = $('#login_status').text("logged in as " + userId);

  // If a chat message is received, display it.
  socket.on('chat', function(msg) {
    if (msg && msg.sender && msg.sender != "" && msg.content && msg.content != "") {
      var msgDiv = createMessageDiv(msg.sender, msg.content);
      $('#msg_list').append(msgDiv);
    } else {
      console.error("Malformed msg: " + msg);
    }
  });

  // If a notification is received, display it.
  socket.on('notification', function(content) {
    if (content && content != "") {
      var notificationDiv = createNotificationDiv(content);
      $('#msg_list').append(notificationDiv);
    }
    // If the notification content is empty, it is ignored.
  });
}

function send() {
  var msgBox = $('#msg_input');
  var content = msgBox.val();
  if (content && content != "") {
    socket.emit('chat', {
      content: content,
    });
  }
  msgBox.val(""); // clear the input field.
}

