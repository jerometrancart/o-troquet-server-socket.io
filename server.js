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

/**
 * Instance variables
 */

const rooms = {};

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
app.get('/', (request, response) => {
  response.send(`
    <div style="margin: 5em auto; width: 400px; line-height: 1.5">
      <h1 style="text-align: center">Hello!</h1>
      <p>Si tu vois ce message, c'est que ton serveur est bien lancé !</p>
      <div>Désormais, tu peux utiliser le chat et le jeu</div>
      <!-- <ul style="display: inline-block; margin-top: .2em">
        <li><code>POST http://localhost:${port}/login</code></li>
        <li><code>POST http://localhost:${port}/forgot</code></li>
        <li><code>GET http://localhost:${port}/theme/{email}</code></li>
      </ul> -->
    </div>
  `);
});

/*
 * Theme json
 */
/*
 app.get('/theme/:email', (request, response) => {
  const email = request.params.email;
  if (!email) {
    console.log('<< 400 BAD_REQUEST');
    response.status(400).end();
  }

  let color;
  if (db.users[email] && db.users[email].color) {
    color = db.users[email].color;
  }

  // Réponse HTTP adaptée.
  if (color) {
    console.log('<< 200 OK', email, color);
    response.send(color);
  }
  else {
    console.log('<< 401 UNAUTHORIZED');
    response.status(401).end();
  }
});
*/

/*
 * Socket.io
 */
let id = 0;
io.on('connection', (ws) => {
  console.log('>> socket.io - connected');
  ws.on('send_message', (message) => {
    // eslint-disable-next-line no-plusplus
    message.id = ++id;
    // ++id : incrémente puis assigne ; id++ : assigne puis incrémente
    io.emit('send_message', message);
  });
  ws.on('disconnect', () => {
    console.log('user disconnected');
    ws.disconnect(true);
  });
});

// Login avec vérification : POST /login
/*
app.post('/login', (request, response) => {
  console.log('>> POST /login', request.body);

  
// Extraction des données de la requête provenant du client.
 const { email, password } = request.body;

  // Vérification des identifiants de connexion proposés auprès de la DB.
 let username;
  if (db.users[email] && db.users[email].password === password) {
    username = db.users[email].username;
  }

  // Réponse HTTP adaptée.

  if (username) {
    console.log('<< 200 OK', username);
    response.send(username);
  }
  else {
    console.log('<< 401 UNAUTHORIZED');
    response.status(401).end();
  }
});
*/

// Mot de passe oublié : POST /forgot
// app.post('/forgot', (request, response) => {
//   const { email } = request.body;
//   if (db.users[email]) {
//     response.send(db.users[email].username);
//   }
//   else {
//     response.status(400).end();
//   }
// });

/**
 * Sessions
 */

 // ------ getting the random session path ------ //

io.on('set_path', (path) => {
  // eslint-disable-next-line no-plusplus
  // path.id = ++id;
  // ++id : incrémente puis assigne ; id++ : assigne puis incrémente
  io.emit('send_message', {author: 'Bartender', content: 'Pleased to see you again ^^ Have this link to connect : www.otroquet.com/gameboard/fourtwentyone/'+path });
  const nsp = io.of('/gameboard/fourtwentyone/'+path);
  nsp.on('connection', function(socket){
    console.log('someone connected on the tiny url');
  });
  nsp.emit('send_message', {author: 'Bartender', content: 'Hi everyone !'} );


});

 // ------ create room ------ //

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
  console.log(`listening on *:${port}`);
});
