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
// const previousRooms = [];

/*
rooms = [
  { id: tinyURL,

    users : [
      { name: 'jérôme' 
        score : 11, },
      { name: 'damien',
        score : 13, },
      { name: 'florian',
        score : 0, },
      { name: 'thomas',
        score : 7, },
    ],

    pot: 21,

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
]
*/



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

  console.log('>> socket.io - connected');
  console.log(ws.handshake.headers.referer);
  console.log('ws.id : ', ws.id);

  // rooms = [
  //
  //   { id: tinyURL,
  //
  //     users : [
  //       { id: ws.id, name: 'jérôme', score : 11 },
  //         
  //       { id: ws.id, name: 'damien', score : 13, },
  //         
  //       { id: ws.id, name: 'florian', score : 0, },
  //         
  //       { id: ws.id, name: 'thomas', score : 7, },       
  //     ],
  //
  //     pot: 21,
  //      
  //     first-die: { data: 1, blocked: false}
  //     second-die: { data: 1, blocked: false}
  //     third-die: { data: 1, blocked: false}
  //
  //   },
  //
  

//==========================================================================//
//                                                                          //
// ======================        CREATE ROOM        ======================= //
//                                                                          //
//==========================================================================//
  ws.on('create_room', (user) => {
    // aknowledgement
    console.log('166 creating a room');
    // room Id calculated in back
    roomId = tinyURL(12);
    // room is an object with an id and a list of user objects and scores
      newRoom = {
        id: roomId,
        users: [],
        pot: 21,
        started: false,
        firstDie: { data: 1, blocked: false},
        secondDie: { data: 1, blocked: false},
        thirdDie: { data: 1, blocked: false},
      };

    userObject = { id: ws.id, name: user, score: 0};
    newRoom.users.push(userObject);
    // socket joins the room
    ws.join(roomId);
    console.log('184 socket joins ', newRoom);
    // console.log('185 socket : ', ws)
    console.log('186 socket room : ', ws.rooms)
    console.log('187 new room created ', newRoom);
    
    console.log('189 i push a new user !!!!!', newRoom.users);
    // new room joins rooms
    rooms.push(newRoom);
    console.log('192 rooms on the server : ', rooms);
    console.log('193 rooms on the server : ', io.rooms);

    // for later : new properties for socket
    ws.room = roomId;
    ws.name = user;
    
    updateClientRoom(newRoom, {content: `Hello, it\'s good to see you again ! Here, have this link to share with your friends : www.otroquet.fr/gameboard/fourtwentyone/${roomId}`, author: 'Bartender'});
    // console.log('190 party updated : ', rooms[roomId]);
    // aknowledgement of the room created, so the client stores it into its state
    ws.emit('room_created', newRoom);
    // the new room enters the list of rooms
    // console.log('available_rooms', rooms);
  });

//==========================================================================//
//                                                                          //
// =======================         GET ROOM         ======================= //
//                                                                          //
//==========================================================================//
  ws.on('get_room', (name) => {
    
    // console.log('available_rooms : ', rooms);
    if (rooms.length !== 0 ) {
      
      yourRoom = rooms.find( (room) => (room.users.length <= 3))
      console.log('217 room.find : ', yourRoom);
      if (yourRoom !== undefined) {  
        ws.join(yourRoom.id);
        ws.room = yourRoom.id
        ws.name = name;
        yourRoom.users.push({id: ws.id, name, score: 0});
        console.log('224 i push a new user !!!!!');
        updateClientRoom(yourRoom,  {content: `Here comes ${ws.name}, say hi !`, author: 'Bartender'})
        console.log('213 rooms : ', rooms);
        console.log('party updated');

        ws.emit('your_room', yourRoom.id)
        console.log('your_room : ', yourRoom.id);
        } else {
          ws.emit('no_room');
        }
      }
    else {
      ws.emit('no_room');
    } 
  })

//==========================================================================//
//                                                                          //
// =======================    COPY PASTING LINKS    ======================= //
//                                                                          //
//==========================================================================//

  ws.on('check_room_client_to_server', (roomId, name) => {
    if (rooms.length !== 0 ) {
      yourRoom = rooms.find( (room) => (room.id === roomId));
      console.log('yourRoom : ', yourRoom);
      if (yourRoom !== undefined){
        ws.join(yourRoom.id);
        newPlayer={id: ws.id, name: name, score: 0}
        yourRoom.users.push(newPlayer);
        // io.sockets.in(yourRoom.id).emit('UPDATE_PARTY', yourRoom);
        updateClientRoom(yourRoom, {content: `Welcome, make yourself comfortable !` , author: 'Bartender'});
        console.log('on c/p link, socket joined ', yourRoom.id);
        // console.log(ws.room);
        // GxPv4K7hcmRqdfghnsdfghs
        ws.emit('check_room_server_to_client_ok', yourRoom.id);
        ws.room = yourRoom.id;
        // ws.emit('room_created', yourRoom.id);
        // console.log('your_room : ', yourRoom.id);
      }
      else {
        ws.emit('check_room_server_to_client_not_ok');
      }
    }
    else {
      ws.emit('check_room_server_to_client_not_ok');
    }

  });




//==========================================================================//
//                                                                          //
// =======================         MESSAGES         ======================= //
//                                                                          //
//==========================================================================//

  // say who speaks & display in the correct room
  ws.on('send_message', (room, message) => {
    console.log('message received by server', room, message);
    message.id = ++id;
    // emits to the correct room
    // ws.to(room).emit('send_message', {content: message.content, author: rooms[room].users[ws.id], id:message.id});
    ws.in(room).emit('send_message', message);
    ws.emit('send_message', message);
    console.log('message emitted by server', message, room);
  });
   

  // say who disconnects
  ws.on('disconnect', () => {
    console.log('user disconnected');
    getUserRooms(ws).forEach(room => {
      ws.in(room).broadcast.emit('user-disconnected', rooms[room].users[ws.id])
      updateClientRoom(room, {content: `Farewell, ${name} !` , author: 'Bartender'})
    });
    // and delete the user
    // delete rooms[room].users[ws.id]
    // ws.disconnect(true);
  });


  // listen and react to general messages
  ws.on('send_message_client_to_server', (roomId, message) => {
    console.log('message received by server', roomId, message);
    // sets up an id for the message
    message.id = ++id;
    // emits to all ???
    io.sockets.in(roomId).emit('send_message_server_to_client', message);
    // ws.emit('send_message_server_to_client', message);
    console.log('message emitted by server',roomId, message);
  });




  
//==========================================================================//
//                                                                          //
// =======================      GENERAL EVENTS      ======================= //
//                                                                          //
//==========================================================================//



  // listen and reacts when a user joins a room
  ws.on('new_user_client_to_server', (roomId, message) => {
    console.log('new user ', message.author);
    ws.name = message.author; 
    // ws.join(roomId);
    // rooms[roomId].users[ws.id] = {name : ws.name, score: 0 };
    userObject = { id: ws.id, name: ws.name, score: 0};
    // rooms[roomId].users.push(userObject);
    // io.sockets.in(roomId).emit('new_user_server_to_client', roomId, { content: ' joined', author: message.author });
    
    room = rooms.find( (room) => (room.id === roomId));
    // room = rooms[roomId];
    room.users.push({id: ws.id, name : ws.name, score: 0});
    console.log('301 i push a new user here !!!!!', room);
    // updateClientRoom(room, {content: `${ws.name} joined : say hi !`, author: 'Bartender'})
    // io.sockets.in(roomId).emit('UPDATE_PARTY', room);
    console.log('304 rooms : ', rooms);
    console.log('party updated');
  
  });


  // reacts when a user leaves
   ws.on('disconnect', (reason) => {
    console.log('302 user disconnected ws.name ', ws.name);
    console.log('303 ws.room : ', ws.room);
    socketRoom = rooms.find((room) => (room.id === ws.room));
    console.log('socketRoom object : ', socketRoom);
    userInSocketRoom = socketRoom.users.find((socket) => (socket.id === ws.id));
    console.log('361 i delete ', userInSocketRoom)
    delete userInSocketRoom;
    let userRooms = getUserRooms(ws);
    console.log('305 rooms in server : ', rooms);
    if (userRooms != null){
      userRooms.forEach(userRoom => {
        ws.to(userRoom).emit('user_disconnected', rooms[userRoom].users[ws.id])
        // and delete the user
        // delete rooms[userRoom].users[ws.id];
      });
    }
  

    // player={name: ws.name, score: 0}
    // yourRoom.users.push(newPlayer);
    // io.sockets.in(yourRoom.id).emit('UPDATE_PARTY', yourRoom);
    io.sockets.in(ws.room).emit('UPDATE_PARTY', ws.room);
    // ws.leave(roomId);

    // delete rooms[ws.room].users.find(user => name == ws.name)
    updateClientRoom(ws.room, )
    io.sockets.in(ws.room).emit('user_disconnected', { content: ' left', author: ws.name })
    ws.disconnect(true);
  });
 

//==========================================================================//
//                                                                          //
// =======================      GAME COMMANDS       ======================= //
//                                                                          //
//==========================================================================//
  
// =======================        Game start        ======================= //

  ws.on('start_game', (action) => {

    console.log('GAME STARTED', action);
    console.log('346 rooms on the server ', rooms);
    let socketsInRoom = io.sockets.in(action.roomId);
    console.log('action.roomId : ', action.roomId);
    // console.log('sockets in room : ', socketsInRoom);
    socketsInRoom.emit('GAME_STARTED', action.player);
    action.roomId.started = true;
    socketsInRoom.emit('UPDATE_PARTY', action.room);
    // socketsInRoom.emit('UPDATE_PARTY', {...action.roomId});

    // ===============      update room      =============== //
    // ws.on('PARTY_UPDATED')
    // ws.on('die_blocked', (die) => {})








  })
})




//==========================================================================//
//                                                                          //
// =======================    GENERAL FUNCTIONS     ======================= //
//                                                                          //
//==========================================================================//



function getUserRooms(ws) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[ws.id] != null ) {
      names.push(name);
    }
    return names
  }, [])
}

function updateClientRoom(room, message) {
  io.sockets.in(room.id).emit('UPDATE_PARTY', room, message);
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
