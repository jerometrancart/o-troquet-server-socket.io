/* eslint-disable prefer-destructuring */
/*
 * Require
 */
const express = require('express');
const bodyParser = require('body-parser');
const Server = require('http').Server;
const socket = require('socket.io');

// const server = require('http').createServer();



// const io = require('socket.io')(server, {
//   path: '/test',
//   serveClient: false,
//   // below are engine.IO options
//   pingInterval: 10000,
//   pingTimeout: 5000,
//   cookie: false
// });

// server.listen(3001);


/*
 * Vars
 */
const app = express();
const server = Server(app, {
  path: '/test'
});
const io = socket(server);
io.path('/test');
const port = 3001;
const path = require('path');
/**
 * Instance variables
 */

const rooms = [];
const previousRooms = [];
/*
 * Express
 */
app.use(bodyParser.json());
app.use((request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  // response.header('Access-Control-Allow-Credentials', true);
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  response.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

// Page d'accueil du serveur : GET /
// app.use(express.static("public"));
app.get('/', (request, response) => {
//   response.redirect('http://localhost:8080')
  // response.sendFile(path.join(__dirname, '../../APOTHÉOSE/obar\ \-\ front/public/src/assets/'))
  // /home/etudiant/Bureau/html/APOTHÉOSE/obar - front/src/index.js
  // obar - front/src/index.js
  response.send(`
    <div style="margin: 5em auto; width: 400px; line-height: 1.5">
      <h1 style="text-align: center">Hello!</h1>
      <p>Si tu vois ce message, c'est que ton serveur est bien lancé !</p>
      <div>Désormais, tu peux utiliser le chat et le jeu</div>
    </div>
  `);
});

// listen for GET request on url /{roomId} and
// app.get('/:roomId', (request, response) => {
//   // if empty
//   if (rooms[request.params.room] == null) {
//     // redirects to home (should result in /gameselect page)
//     return response.redirect('/')
//   }
//   // if not empty : renders (constructs) a view
//   response.render('room', {roomName: request.params.room})
// });

/*
 * Socket.io
 */
let id = 2;

const tinyURL = (length) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.match(/./g);
  let text = '';
  for (let i = 0; i < length; i++) {
    text += charset[Math.floor(Math.random() * charset.length)];
  }
  return text;
};

io.on('connection', (ws) => {

  // say who connects
  console.log('>> socket.io - connected');
  console.log(ws.handshake.headers.referer);

  // listen and react to general messages
  ws.on('send_message_client_to_server', (roomId, message) => {
    console.log('message received by server', 'general', roomId, message);
    message.id = ++id;
    // emits to all
    ws.emit('send_message_server_to_client', message);
    console.log('message emitted by server', message);
  });

  // listen and reacts when a user joins
  ws.on('new_user_client_to_server', (message) => {
    console.log('new user ', message.author);
    // rooms[room].users[ws.id] = name;
    ws.emit('new_user_server_to_client', { content: ' joined', author: message.author })
  });

   // for later : reacts when a user leaves
   ws.on('disconnect', (name) => {
    console.log('user disconnected ', name);
    // getUserRooms(ws).forEach(room => {
    //   ws.to(room).broadcast.emit('user-disconnected', rooms[room].users[ws.id])
    // });
    // and delete the user
    // delete rooms[room].users[ws.id]
    //ws.disconnect(true);
    ws.emit('send_message', { content: ' left', author: name })
  });
 
  // ------ room management ------ //

  ws.on('create_room', (roomId, user) => {
    // aknowledgement
    console.log('creating a room');
    // room is an object with an id and a list of user objects
    newRoom = { id: roomId, users: []};
    // user objects have only one property : name
    userObject = {name: user}
    // users enter newly created room
    newRoom.users.push(userObject);
    ws.join(roomId);
    // aknowledgement of the room created
    ws.emit('room_created', newRoom);
    console.log('room created', newRoom, newRoom.users);
    // the new room enters the list of rooms
    rooms.push(newRoom);
    // send the list to front
    ws.emit('available_rooms', rooms);
    console.log('available_rooms', rooms);    
    console.log('userObject : ', userObject)
    console.log('websocket joining new room : ', roomId);
    // ws.emit('room_created', roomId);
    
    previousRoom = rooms.find((room) => {
      return room.users.includes(userObject)
    })

    previousRooms.push(previousRoom)
    console.log('previousRoom : ', previousRoom);
    console.log('previousRooms : ', previousRooms);

    ws.on('say to someone', function(id, msg){
      ws.broadcast.to(id).emit('my message', msg);
    });

    // TODO manage the empty rooms

    ws.on('new_user', (name) => {
      console.log('new user', name);
      // rooms[room].users[ws.id] = name;
      // ws.to(room).broadcast.emit('user-connected', name)
    });
  
    // say who speaks & display in the correct room
    ws.on('send_message', (room, message) => {
      console.log('message received by server', room, message);
      message.id = ++id;
      // emits to the correct room
      // ws.to(room).emit('send_message', {content: message.content, author: rooms[room].users[ws.id], id:message.id});
      ws.to(room).emit('send_message', message);
      ws.emit('send_message', message);
      console.log('message emitted by server', message, room);
    });
  
    // say who disconnects
    ws.on('disconnect', () => {
      console.log('user disconnected');
      getUserRooms(ws).forEach(room => {
        ws.to(room).broadcast.emit('user-disconnected', rooms[room].users[ws.id])
      });
      // and delete the user
      // delete rooms[room].users[ws.id]
      //ws.disconnect(true);
    });




  });

  ws.on('get_room', () => {
    ws.emit('available_rooms', rooms);
    console.log('available_rooms : ', rooms);
    yourRoom = rooms.find( (room) => (room.users.length <= 3))
    ws.join(yourRoom.id);
    ws.emit('your_room', yourRoom.id)
    ws.emit('room_created', yourRoom.id)
    console.log('your_room : ', yourRoom.id);
  })
});
/*
rooms = {
  { id: tinyURL,

    users : [
      { name: 'jérôme' },
      { name: 'damien' },
      { name: 'florian' },
      { name: 'thomas' },
    ]
  },
  { id: tinyURL2,

    users : [
      { name: 'user1' },
      { name: 'user2' },
      { name: 'user3' },
      { name: 'user4' },
    ]
  },
  { id: tinyURL3,

    users : [
      { name: 'user5' },
      { name: 'user6' },
      { name: 'user7' },
      { name: 'user8' },
    ]
  },
}
*/
// io.on('disconnect', () => {
//   console.log('user disconnected');
//   io.disconnect(true);
// });


/**
 * Sessions
 */

 // ------ getting the random session path ------ //

// io.on('set_path', (path) => {

//   io.emit('send_message', {author: 'Bartender', content: 'Pleased to see you again ^^ Have this link to connect : www.otroquet.com/gameboard/fourtwentyone/'+path });
//   const room = io.of('/gameboard/fourtwentyone/'+path);
//   room.on('connection', function(socket){
//     console.log('someone connected on the tiny url');
//   });
//   room.emit('send_message', {author: 'Bartender', content: 'Hi everyone !'} );


// });

function getUserRooms(ws) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[ws.id] != null ) names.push(name)
    return names
  }, [])
}


/**
 * Will connect a socket to a specified room
 * @param socket A connected socket.io socket
 * @param room An object that represents a room from the `rooms` instance variable object
 */

const joinRoom = (socket, room) => {
  room.sockets.push(socket);
  socket.join(room.id, () => {
    // store the room id in the socket for future use
    socket.roomId = room.id;
    console.log(socket.id, "Joined", room.id);
  });
};

/**
 * Will make the socket leave any rooms that it is a part of
 * @param socket A connected socket.io socket
 */

const leaveRooms = (socket) => {
  const roomsToDelete = [];
  for (const id in rooms) {
    const room = rooms[id];
    // check to see if the socket is in the current room
    if (room.sockets.includes(socket)) {
      socket.leave(id);
      // remove the socket from the room object
      room.sockets = room.sockets.filter((item) => item !== socket);
    }
    // Prepare to delete any rooms that are now empty
    if (room.sockets.length == 0) {
      roomsToDelete.push(room);
    }
  }
  // Delete all the empty rooms that we found earlier
  for (const room of roomsToDelete) {
    delete rooms[room.id];
  }
};







/*
 * Server
 */
server.listen(port, () => {
  console.log(`listening on :${port}`);
});
