// Database related operations.

module.exports = {

  messages: {

    insert: function(db, msg, callback) {
      db.collection('messages').insertOne(msg, callback);
    },

    all: function(db, eachCallback) {
      var cursor = db.collection('messages').find();
      cursor.each(eachCallback);
    },

    find: function(db, cond, eachCallback) {
      var cursor = db.collection('messages').find(cond);
      cursor.each(eachCallback);
    },

  }

};

