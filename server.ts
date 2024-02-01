const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({
    path: './.env'
});

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION!!! shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

const app = require('./app');


mongoose.connect(process.env.DATABASE,
    (err: any) => {
        if(err) throw err;
        console.log('connected to MongoDB')
    });
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});
mongoose.connection.on('error', (error: any) => {
    console.log(error);
});
// Start the server
const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
    console.log(`Application is running on port ${port}`);
});

const { Server } = require('socket.io');

export const socketIo = new Server(server, {
    cors : {
        origin : '*'
    }
})

socketIo.on('connection', (socket: any) => {
    console.log('A user connected');
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  
    socket.on('message', (data: any) => {
      console.log('Received message:', data);
      socketIo.emit('message', data); // Broadcast message to all connected clients
    });
});

process.on('unhandledRejection', (err: any) => {
    console.log('UNHANDLED REJECTION!!!  shutting down ...');
    console.log(err.name, err.message);
    app.close(() => {
        process.exit(1);
    });
});