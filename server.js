/* eslint-disable prefer-destructuring */
/*
 * Require
 */
const express = require('express');
const bodyParser = require('body-parser');
const Server = require('http').Server;
const socket = require('socket.io');


/*
 * Vars
 */
const app = express();
const server = Server(app);
const io = socket(server);
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
app.use(express.static("public"));
// app.get('/', (request, response) => {
//   response.redirect('http://localhost:8080')
  // response.sendFile(path.join(__dirname, '../../APOTHÉOSE/obar\ \-\ front/public/src/assets/'))
  // /home/etudiant/Bureau/html/APOTHÉOSE/obar - front/src/index.js
  // obar - front/src/index.js
  // response.send(`
  //   <div style="margin: 5em auto; width: 400px; line-height: 1.5">
  //     <h1 style="text-align: center">Hello!</h1>
  //     <p>Si tu vois ce message, c'est que ton serveur est bien lancé !</p>
  //     <div>Désormais, tu peux utiliser le chat et le jeu</div>
  //   </div>
  // `);
// });

// listen for GET request on url /{roomId} and
app.get('/:roomId', (request, response) => {
  // if empty
  if (rooms[request.params.room] == null) {
    // redirects to home (should result in /gameselect page)
    return response.redirect('/')
  }
  // if not empty : renders (constructs) a view
  response.render('room', {roomName: request.params.room})
});

/*
 * Socket.io
 */
let id = 0;

io.on('connection', (ws) => {

  // say who connects
  console.log('>> socket.io - connected');
  console.log(ws.handshake.headers.referer);
  // identifies new user, and let him join the room
  ws.on('new-user', (room, name) => {
    console.log('new-user')
    ws.join(room);
    rooms[room].users[ws.id] = name;
    ws.to(room).broadcast.emit('user-commected', name)
  });

  // say who speaks & display in the correct room
  ws.on('send_message', (room, message) => {
    console.log('message sent', room, message);
    message.id = ++id;
    // emits to the correct room
    ws.to(room).broadcast.emit('send_message', {message: message, name: rooms[room].users[ws.id]});
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

 
 
 
  // ------ create room ------ //

  ws.on('create_room', (roomId, user) => {
    console.log('creating a room');
    newRoom = { id: roomId, users: []};
    userObject = {name: user}
    newRoom.users.push(userObject);
    ws.emit('room_created', newRoom);
    console.log('room created', newRoom, newRoom.users)
    rooms.push(newRoom);
    ws.emit('available_rooms', rooms);
    console.log('available_rooms', rooms);

    // before joining the new room we need to get out of the previous one
    
    console.log('userObject : ', userObject)
    
    // previousRoom = rooms.map((room) => {
    //   room.users.includes((name) => name === userObject)
    // })
    // previousRoom = rooms.users.find((user) => user.name === user)
    // previousRoom = rooms.filter(room => console.log(room.users))
    previousRoom = rooms.find((room) => {
      return room.users.includes(userObject)
    })
    // previousRoom = rooms.filter(room => {
    //   return room.users.includes(userObject)
    // })
    // newPreviousRoom = previousRoom.slice



    previousRooms.push(previousRoom)
    console.log('previousRoom : ', previousRoom);
    console.log('previousRooms : ', previousRooms);
    // and cleaning all empty rooms on the server
    ws.join(roomId);
    console.log('websocket after joining new room : ',ws);
    ws.emit('room_created', roomId);
    // console.log(roomId);
    ws.on('say to someone', function(id, msg){
      ws.broadcast.to(id).emit('my message', msg);
    });
  });

  ws.on('get_room', () => {
    ws.emit('available_rooms', rooms);
    console.log('available_rooms : ', rooms);
    yourRoom = rooms.find( (room) => (room.users.length <= 3))
    ws.emit('your_room', yourRoom.id)
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
