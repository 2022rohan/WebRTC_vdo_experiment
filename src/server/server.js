// server/server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let connectedUsers = [];

io.on('connection', (socket) => {
  console.log('New client connected');

  // When a user sends an offer
  socket.on('offer', (offer, callback) => {
    // Broadcasting the offer to a random user
    if (connectedUsers.length > 0) {
      const randomUser = connectedUsers[Math.floor(Math.random() * connectedUsers.length)];
      randomUser.emit('offer', offer);
    }
    callback('Offer sent to stranger');
  });

  // When a user sends an answer
  socket.on('answer', (answer, callback) => {
    const randomUser = connectedUsers.find(user => user.id !== socket.id);
    if (randomUser) {
      randomUser.emit('answer', answer);
    }
    callback('Answer sent to stranger');
  });

  // When a user sends ICE candidates
  socket.on('ice-candidate', (candidate) => {
    const randomUser = connectedUsers.find(user => user.id !== socket.id);
    if (randomUser) {
      randomUser.emit('ice-candidate', candidate);
    }
  });

  // Add user to connectedUsers list
  connectedUsers.push(socket);

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    connectedUsers = connectedUsers.filter(user => user.id !== socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
