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
const server = Server(app, {
  path: '/test'
});
const io = socket(server);
io.path('/test');
const port = 3001;
/**
 * Instance variables
 */

const rooms = [];

/*
 * Express
 */
app.use(bodyParser.json());
app.use((request, response, next) => {
  response.header('Access-Control-Allow-Origin', ['http://otroquet.com', 'http://www.otroquet.com']);
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  response.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

// Page d'accueil du serveur : GET /
app.get('/', (request, response) => {
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
        firstDie: { data: 1, blocked: false, roll: true},
        secondDie: { data: 1, blocked: false, roll: true},
        thirdDie: { data: 1, blocked: false, roll: true},
      };
    
    const newPlayers = [...newRoom.users];
    const newPlayer = { id: ws.id, name: user, score: 0, };
    newPlayers.push(newPlayer);
    newRoom = { ...newRoom, users: newPlayers,};

    // socket joins the room
    ws.join(roomId);
    console.log('184 socket joins ', newRoom);
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
    // aknowledgement of the room created, so the client stores it into its state
    ws.emit('room_created', newRoom);
    // the new room enters the list of rooms
  });

//==========================================================================//
//                                                                          //
// =======================         GET ROOM         ======================= //
//                                                                          //
//==========================================================================//
  ws.on('get_room', (name) => {
    
    if (rooms.length !== 0 ) {
      
      yourRoom = rooms.find( (room) => (room.users.length <= 3))

      console.log('229 room.find : ', yourRoom);
      if (yourRoom !== undefined) {  
        ws.join(yourRoom.id);
        ws.room = yourRoom.id
        ws.name = name;

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

        const newPlayers = [...yourRoom.users];
        const newPlayer = { id: ws.id, name, score: 0, };
        newPlayers.push(newPlayer);
        yourRoom = { ...yourRoom, users: newPlayers,};
    
        yourRoom.users.push(newPlayer);

        updateClientRoom(yourRoom, {content: `Welcome, make yourself comfortable !` , author: 'Bartender'});

        console.log('on c/p link, socket joined ', yourRoom.id);
        ws.emit('check_room_server_to_client_ok', yourRoom.id);
        ws.room = yourRoom.id;
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

  // listen and react to general messages
  ws.on('send_message_client_to_server', (roomId, message) => {
    console.log('message received by server', roomId, message);
    // sets up an id for the message
    message.id = ++id;
    // emits to all in room
    io.sockets.in(roomId).emit('send_message_server_to_client', message);
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
    userObject = { id: ws.id, name: ws.name, score: 0};
    console.log('377 rooms in the server : ', rooms);  
  });

  // =======================      USER DISCONNECTS      ======================= //

  // reacts when a user leaves
   ws.on('disconnect', (reason) => {
    console.log('390 user disconnected ws.name ', ws.name);
    console.log('391 ws.room : ', ws.room); // room name
    socketRoom = rooms.find((room) => (room.id === ws.room)); // room object
    if (socketRoom !== undefined ){
      console.log('394 socketRoom object : ', socketRoom);
      userInSocketRoom = socketRoom.users.find((socket) => (socket.id === ws.id));
      console.log('396 i delete ', userInSocketRoom)

      delete socketRoom.users.find((player) => (player.id === ws.id));
      console.log('403 PLAYERS LEFT : ', socketRoom.users)
      let leftPlayers = [];
      const getLeftPlayers = () => {
        socketRoom.users.forEach((player) => {
          if (player !== userInSocketRoom) {
            leftPlayers.push(player);
          }
          return leftPlayers;
        })
      }
      console.log('429 getLeftPlayers : ', getLeftPlayers());
      ws.leave(ws.room)
      console.log('398 new socket room after i left : ', socketRoom);
      updateClientRoom(socketRoom, {content: `Farewell, ${ws.name} !` , author: 'Bartender'})
      console.log('305 rooms in server : ', rooms);
    };
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
    // the randomizing function
    const getRandomNumber = ((min, max) => {
      const mini = Math.ceil(min);
      const maxi = Math.floor(max);
      return Math.floor(Math.random() * (maxi - mini + 1)) + mini;
    });    
    // i construct the dice table
    const dice = [room.firstDie, room.secondDie, room.thirdDie]
    // i modify the dice table with new scores and toggle roll in order for the animation to work
    const random = () => {
      dice.forEach((die) => {
        if (die.blocked === false){
          die.roll = !die.roll,
          die.data = getRandomNumber(1, 6)
          return dice;
        };
      });
    }
    random();
    console.log('results : ', dice);
    // i make the sum of the results to display it in the scoreboard
    const sum = Object.keys(dice).reduce( (previous, key) => {
      return previous + dice[key].data;
    }, 0);
    // i write the score of the user in the room object 
    if (room.users.find((user) => (user.name === player))) {
      room.users.find((user) => (user.name === player)).score = sum; // object ok
    }
    // i set a new room object with the new dice
    room = {
      ...room,
      firstDie: dice[0],
      secondDie: dice[1],
      thirdDie: dice[2],
    };
    
    console.log('new room :', room);
    // i update the room to client
    updateClientRoom(room, {content: `${player} rolls the dice and scores ${sum} !` , author: 'Bartender'});
  })
})

//==========================================================================//
//                                                                          //
// =======================    GENERAL FUNCTIONS     ======================= //
//                                                                          //
//==========================================================================//

function updateClientRoom(room, message) {
  if(room){
    io.sockets.in(room.id).emit('UPDATE_PARTY', room, message);
  }
}

/*
 * Server
 */
server.listen(port, () => {
  console.log(`listening on :${port}`);
});
