// Ce code tourne sur Internet 24h/24 (sur Render ou Glitch)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Autorise ton site Netlify à se connecter
        methods: ["GET", "POST"]
    }
});

let players = {};

io.on('connection', (socket) => {
    console.log(`Joueur connecté : ${socket.id}`);

    // Gestion de l'entrée en jeu
    socket.on('join', (data) => {
        players[socket.id] = {
            id: socket.id,
            x: data.x || 0,
            z: data.z || 0,
            angle: data.angle || 0,
            hp: 100,
            name: data.name || "Joueur",
            skin: data.skin || "blue",
            room: data.room || "public"
        };
        socket.join(players[socket.id].room);
        
        // Envoie la liste des joueurs actuels au nouveau venu
        socket.emit('currentPlayers', players);
        
        // Prévient les autres joueurs de la salle qu'un nouveau est arrivé
        socket.to(players[socket.id].room).emit('newPlayer', players[socket.id]);
    });

    // Gestion des mouvements (transmis instantanément)
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].z = data.z;
            players[socket.id].angle = data.angle;
            players[socket.id].hp = data.hp;
            socket.to(players[socket.id].room).emit('playerMoved', players[socket.id]);
        }
    });

    // Gestion de la déconnexion
    socket.on('disconnect', () => {
        if (players[socket.id]) {
            const room = players[socket.id].room;
            delete players[socket.id];
            io.to(room).emit('playerLeft', socket.id);
        }
    });
});

// Port spécial pour l'hébergement en ligne (Render utilise process.env.PORT)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log("=========================================");
    console.log(`  SERVEUR EN LIGNE SUR LE PORT ${PORT}`);
    console.log("=========================================");
});
