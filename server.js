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

  // say who connects
  console.log('>> socket.io - connected');
  console.log(ws.handshake.headers.referer);
  console.log('ws.id : ', ws.id);

  // rooms = [
  //   { id: tinyURL,
  
  //     users : [
  //       { name: 'jérôme' 
  //         score : 11, },
  //       { name: 'damien',
  //         score : 13, },
  //       { name: 'florian',
  //         score : 0, },
  //       { name: 'thomas',
  //         score : 7, },
  //     ],
  
  //     pot: 21,
  
  //   },
  



  ws.on('get_room', (name) => {
    // ws.emit('available_rooms', rooms);
    // console.log('available_rooms : ', rooms);
    if (rooms.length !== 0 ) {
      yourRoom = rooms.find( (room) => (room.users.length <= 3))
      if (yourRoom !== undefined) {  
        ws.room = yourRoom.id
        ws.name = name;
        ws.join(yourRoom.id);
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

  // ------ room management ------ //
  ws.on('create_room', (user) => {
    // aknowledgement
    console.log('creating a room');
    // room Id calculated in back
    roomId = tinyURL(12);
    // room is an object with an id and a list of user objects
      newRoom = {
        id: roomId,
        users: [],
        pot: 21,
        started: false
      };

      console.log('ws',ws);
     // console.log('sockeeeeet : ',ws);
    if (newRoom.users >= 3 ){
      
    }
    // user objects have only one property : name
    userObject = {name: user, score: 0}
    // users enter newly created room
    newRoom.users.push(userObject);
    
    ws.join(roomId);
    ws.room = roomId;
    ws.name = user;

   // console.log('room id', roomId);
    console.log('on create room, socket joined ', roomId);
    // aknowledgement of the room created
    ws.emit('room_created', newRoom);
    console.log('room created', newRoom, newRoom.users);
    // the new room enters the list of rooms
    rooms.push(newRoom);
    // send the list to front
    ws.emit('available_rooms', rooms);


    // TODO manage the empty rooms

    ws.on('new_user', (name) => {
      console.log('new user room created ', name);
      // rooms[room].users[ws.id] = name;
      // ws.to(room).broadcast.emit('user-connected', name)
    });
  
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
        });
        // and delete the user
        // delete rooms[room].users[ws.id]
        // ws.disconnect(true);
      });


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

  // listen and reacts when a user joins
  ws.on('new_user_client_to_server', (roomId, message) => {
    console.log('new user ', message.author);
    ws.name = message.author; 
    ws.join(roomId);
    // rooms[roomId].users[ws.id] = name;
    io.sockets.in(roomId).emit('new_user_server_to_client', { content: ' joined', author: message.author })
  });

  // reacts when a user leaves
   ws.on('disconnect', (reason) => {
    console.log('user disconnected ws.name ', ws.name);
    console.log('ws.room : ', ws.room);
    let rooms = getUserRooms(ws);
    console.log(rooms);
    // rooms.forEach(room => {
    //   ws.to(room).broadcast.emit('user_disconnected', rooms[room].users[ws.id])
    // });
    // and delete the user
    // delete rooms[room].users[ws.id]
    ws.disconnect(true);
    // ws.leave(roomId);
    io.sockets.in(ws.room).emit('user_disconnected', { content: ' left', author: ws.name })
  });
 


  ws.on('check_room_client_to_server', (roomId) => {
    if (rooms.length !== 0 ) {
      yourRoom = rooms.find( (room) => (room.id === roomId));
      console.log(yourRoom);
      if (yourRoom !== undefined){
        ws.join(yourRoom.id);
        console.log('on c/p link, socket joined ', yourRoom.id);
        // console.log(ws.room);
        // GxPv4K7hcmRqdfghnsdfghs
        ws.emit('check_room_server_to_client_ok', yourRoom.id);
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
    // ===============      Game      =============== //

  ws.on('start_game', (action) => {

    // ===============      Game start      =============== //
    console.log('GAME STARTED');
    let socketsInRoom = io.sockets.in(action.roomId);
    console.log('action.roomId : ', action.roomId);
    // console.log('sockets in room : ', socketsInRoom);
    socketsInRoom.emit('GAME_STARTED', action.player);
    action.roomId.started = true;
    socketsInRoom.emit('UPDATE_PARTY', {...action.roomId});

    // ===============      update room      =============== //
    // ws.on('PARTY_UPDATED')
    // ws.on('die_blocked', (die) => {})
  })
})



function getUserRooms(ws) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[ws.id] != null ) {
      names.push(name);
    }
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
