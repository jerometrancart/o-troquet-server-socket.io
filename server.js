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

    // userObject = { id: ws.id, name: user, score: 0};
    
    const newPlayers = [...newRoom.users];
    const newPlayer = { id: ws.id, name: user, score: 0, };
    newPlayers.push(newPlayer);
    newRoom = { ...newRoom, users: newPlayers,};





    // newRoom.users.push(userObject);
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

      console.log('229 room.find : ', yourRoom);
      if (yourRoom !== undefined) {  
        ws.join(yourRoom.id);
        ws.room = yourRoom.id
        ws.name = name;
        // yourRoom.users.push({id: ws.id, name, score: 0});
        
        
        const newPlayers = [...yourRoom.users];
        const newPlayer = { id: ws.id, name, score: 0, };
        newPlayers.push(newPlayer);
        yourRoom = { ...yourRoom, users: newPlayers,};



        console.log('224 i push a new user !!!!!', yourRoom);
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
        // newPlayer={id: ws.id, name: name, score: 0}

        const newPlayers = [...yourRoom.users];
        const newPlayer = { id: ws.id, name, score: 0, };
        newPlayers.push(newPlayer);
        yourRoom = { ...yourRoom, users: newPlayers,};
    
        yourRoom.users.push(newPlayer);


        updateClientRoom(yourRoom, {content: `Welcome, ${name} make yourself comfortable !` , author: 'Bartender'});


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
  // ws.on('disconnect', () => {
  //   console.log('user disconnected');
  //   getUserRooms(ws).forEach(room => {
  //     ws.in(room).broadcast.emit('user-disconnected', rooms[room].users[ws.id])
  //     updateClientRoom(room, {content: `Farewell, ${ws.name} !` , author: 'Bartender'})
  //   });
    // and delete the user
    // delete rooms[room].users[ws.id]
    // ws.disconnect(true);
  // });


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
    
    // room = rooms.find( (room) => (room.id === roomId));
    // room = rooms[roomId];
    // if (room) {
    //   room.users.push({id: ws.id, name : ws.name, score: 0});

    // }

    // console.log('363 i push a new user here !!!!!', room);
    // updateClientRoom(room, {content: `${ws.name} joined : say hi !`, author: 'Bartender'})
    // io.sockets.in(roomId).emit('UPDATE_PARTY', room);
    console.log('377 rooms in the server : ', rooms);
    // console.log('party updated');
  
  });

  // =======================      USER DISCONNECTS      ======================= //

  // reacts when a user leaves
   ws.on('disconnect', (reason) => {
    console.log('385 user disconnected ws.name ', ws.name);
    console.log('386 ws.room : ', ws.room); // room name
    socketRoom = rooms.find((room) => (room.id === ws.room)); // room object
    if (socketRoom !== undefined ){
      console.log('socketRoom object : ', socketRoom);
      userInSocketRoom = socketRoom.users.find((socket) => (socket.id === ws.id));
      console.log('394 i delete ', userInSocketRoom)
      // ws.disconnect(true);

      const players = socketRoom.users;
      delete players.find((player) => (player.id === ws.id));
      console.log('PLAYERS LEFT : ', players)
      // const playerGone = { id: ws.id, name, score: 0, };
      // newPlayers.push(newPlayer);
      // yourRoom = { ...yourRoom, users: newPlayers,};
  
      // yourRoom.users.push(newPlayer);


      // updateClientRoom(yourRoom, {content: `Welcome, ${name} make yourself comfortable !` , author: 'Bartender'});
      socketRoom.users = players;




      // delete socketRoom.users.find((socket) => (socket.id === ws.id));
      ws.leave(ws.room)
      console.log('398 new socket room after i left : ', socketRoom);
      updateClientRoom(socketRoom, {content: `Farewell, ${ws.name} !` , author: 'Bartender'})
      // let userRooms = getUserRooms(ws);
      console.log('305 rooms in server : ', rooms);
      // if (userRooms !== null){
      //   userRooms.forEach(userRoom => {
      //     ws.to(userRoom).emit('user_disconnected', rooms[userRoom].users[ws.id])
      //     // and delete the user
      //     // delete rooms[userRoom].users[ws.id];
      //   });
      // }
    };
  

    // player={name: ws.name, score: 0}
    // yourRoom.users.push(newPlayer);
    // io.sockets.in(yourRoom.id).emit('UPDATE_PARTY', yourRoom);
    // io.sockets.in(ws.room).emit('UPDATE_PARTY', ws.room);
    // ws.leave(roomId);

    // delete rooms[ws.room].users.find(user => name == ws.name)
    
    // io.sockets.in(ws.room).emit('user_disconnected', { content: ' left', author: ws.name })
    // ws.disconnect(true);
  });
 

//==========================================================================//
//                                                                          //
// =======================      GAME COMMANDS       ======================= //
//                                                                          //
//==========================================================================//
  
// =======================        Game start / pause       ======================= //

  ws.on('start_game', (action) => {
    console.log('452 action ', action);
    console.log('346 rooms on the server ', rooms);
    let socketsInRoom = io.sockets.in(action.roomId);
    console.log('action.roomId : ', action.roomId);
    // console.log('sockets in room : ', socketsInRoom);
    socketsInRoom.emit('GAME_STARTED', action.player);
    if (!action.room.started) {
      action.room.started = true;
      updateClientRoom(action.room, {content: `Game started by ${action.player} !` , author: 'Bartender'})
    }
    else {
      action.room.started = false;
      updateClientRoom(action.room, {content: `Game paused by ${action.player} !` , author: 'Bartender'})
    }
  })
// =======================        Toggle block die        ======================= //

  ws.on('toggle_block', (action, player, targetedDie) => {
    console.log('on toggleBlock action : ', action);
    switch (targetedDie){
      case 'firstDie':
        if (action[targetedDie].blocked===true) {
          updateClientRoom(action, {content: `First die blocked by ${player}` , author: 'Bartender'});
        } else {
          updateClientRoom(action, {content: `First die released by ${player}` , author: 'Bartender'});
        }
      break;
      case 'secondDie':
        if (action[targetedDie].blocked===true) {
          updateClientRoom(action, {content: `Second die blocked by ${player}` , author: 'Bartender'});
        } else {
          updateClientRoom(action, {content: `Second die released by ${player}` , author: 'Bartender'});
        }
        break;
      case 'thirdDie':
        if (action[targetedDie].blocked===true) {
          updateClientRoom(action, {content: `Third die blocked by ${player}` , author: 'Bartender'});
        } else {
          updateClientRoom(action, {content: `Third die released by ${player}` , author: 'Bartender'});
        }
        break;
      default:
        if (action[targetedDie].blocked===true) {
          updateClientRoom(action, {content: `${targetedDie} blocked by ${player}` , author: 'Bartender'});
        } else {
          updateClientRoom(action, {content: `${targetedDie} released by ${player}` , author: 'Bartender'});
        }
    }
  })

// =========================        Roll dice        ========================= //
  ws.on('roll_dice', (room, player) => {
    console.log('on roll_dice action : ', room);

    const getRandomNumber = ((min, max) => {
      const mini = Math.ceil(min);
      const maxi = Math.floor(max);
      return Math.floor(Math.random() * (maxi - mini + 1)) + mini;
    });    
    
    const dice = [room.firstDie, room.secondDie, room.thirdDie]

    // console.log('dice : ', dice)

    const random = () => {
      dice.forEach((die) => {
        // toggleClasses(die);
        if (die.blocked === false){
          die.data = getRandomNumber(1, 6)
          return dice;
        };
      });
    }
    random();
    console.log('results : ', dice)

    const sum = Object.keys(dice).reduce( (previous, key) => {
      return previous + dice[key].data;
    }, 0);

    room.users.find((user) => (user.name === player)).score = sum; // objet ok

    room = {
      ...room,
      firstDie: dice[0],
      secondDie: dice[1],
      thirdDie: dice[2],
    };
    
    console.log('new room :', room);

    updateClientRoom(room, {content: `${player} rolls the dice and scores ${sum} !` , author: 'Bartender'});

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
  if(room){
    io.sockets.in(room.id).emit('UPDATE_PARTY', room, message);
  }
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
