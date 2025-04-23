// server/server.js
const cors = require('cors');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
// const io = socketIo(server);
app.use(cors());

const io = require('socket.io')(server, {
    cors: {
      origin: ["http://localhost:3000","https://web-rtc-vdo-experiment.vercel.app/"] ,// Your deployed frontend
      methods: ["GET", "POST"],
      credentials: true
    }
  });
let connectedUsers = [];
// console.log("hlo outside socket.io, its working")
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  connectedUsers.push(socket);
  console.log(`connected users : ${connectedUsers}`)

  // When a user sends an offer
  socket.on('offer', (offer, callback) => {
    console.log('Received offer from:', socket.id);
    // Broadcasting the offer to a random user
    if (connectedUsers.length > 1) {
      const randomUser = connectedUsers.find(user => user.id !== socket.id);
      if (randomUser) {
        console.log('Sending offer to:', randomUser.id);
        randomUser.emit('offer', offer);
        // callback('Offer sent to stranger');
      } 
    } 
  });

  // When a user sends an answer
  socket.on('answer', (answer, callback) => {
    console.log('Received answer from:', socket.id);
    const randomUser = connectedUsers.find(user => user.id !== socket.id);
    if (randomUser) {
      console.log('Sending answer to:', randomUser.id);
      randomUser.emit('answer', answer);
      // callback('Answer sent to stranger');
    } 
  });

  // When a user sends ICE candidates
  socket.on('ice-candidate', (candidate) => {
    console.log('Received ICE candidate from:', socket.id);
    const randomUser = connectedUsers.find(user => user.id !== socket.id);
    if (randomUser) {
      console.log('Sending ICE candidate to:', randomUser.id);
      randomUser.emit('ice-candidate', candidate);
    }
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedUsers = connectedUsers.filter(user => user.id !== socket.id);
  });
});

const PORT = process.env.PORT || 5000;
app.get("/", (req, res) => {
    res.send("WebRTC signaling server is running 🚀");
  });
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
