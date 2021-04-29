const path = require('path');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const {userJoin ,getCurrentUser,userLeave,getRoomUsers} = require('./utils/users');

const formatMessage = require('./utils/messages');


// Set static folder

app.use(express.static(path.join(__dirname,'public')));

const botName = 'ForUs';

// Run when a client conects
io.on('connection',(socket)=>{

    socket.on('joinRoom',({username,room})=>{
        const user = userJoin(socket.id,username,room);
        socket.join(user.room);

       //Welcome current user
       socket.emit('message',formatMessage(botName,`Welcome ${user.username}...! Enjoy time with  ${user.room}`))

       // Broadcast when a user connects (cannot be seen to joined user)
       socket.broadcast.to(user.room).emit('message',formatMessage(botName,` Hey guyzz..! ${user.username}  joined us`));

       // Send users and room info

       io.to(user.room).emit('roomUsers',{
          room : user.room,
          users : getRoomUsers(user.room)
       });
    })
    
    // Listen for chat message
    socket.on('chatMessage',(msg)=>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username,msg))
    })

    // When user disconnects
    socket.on('disconnect',()=>{
        const user = userLeave(socket.id);
        if(user){
            io.to(user.room).emit('message',formatMessage(botName,` oh-oh! Seems like ${user.username} left us`));
            // Send users and room info
            io.to(user.room).emit('roomUsers',{
            room : user.room,
            users : getRoomUsers(user.room)
         });
        }
          
       
    })
});

const PORT = process.env.PORT || 3000;
server.listen(PORT,()=>{
    console.log('Server listening to port');
})