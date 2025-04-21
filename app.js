const roomPlayers = {};
const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");
const {title} = require("process");

const app = express();

function generateRoomId() {
    return Math.random().toString(36).substr(2, 6); // e.g., "4f9kd2"
}


const server = http.createServer(app);
const io = socket(server);


const chess = new Chess();
const rooms = {};

let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));



app.get("/create", (req, res) => {
    const roomId = generateRoomId();
    res.redirect(`/?room=${roomId}`);
});

app.get("/", (req, res) => {
    const room = req.query.room || generateRoomId();
    res.render("index", { title: "Chess Game", room });
});


io.on("connection", function(socket) {
    console.log("New client connected");

    socket.on("joinRoom", (roomId) => {
        socket.join(roomId);

        if (!roomPlayers[roomId]) {
            roomPlayers[roomId] = { white: null, black: null };
        }

       

        const players = roomPlayers[roomId];
        if (!players.white) {
            players.white = socket.id;
            socket.emit("playerRole", "w");
        } else if (!players.black) {
            players.black = socket.id;
            socket.emit("playerRole", "b");
        } else {
            socket.emit("spectatorRole");
        }

        if (players.white && players.black) {
            io.to(roomId).emit("bothPlayersJoined");
        }

        socket.on("move", (move) => {
            try {
                if (
                    (chess.turn() === "w" && socket.id !== players.white) ||
                    (chess.turn() === "b" && socket.id !== players.black)
                ) {
                    socket.emit("notYourTurn", "It's not your turn!");
                    return;
                }
        
                const result = chess.move(move);
                if (result) {
                    io.to(roomId).emit("move", move);
                    io.to(roomId).emit("boardState", chess.fen());
                } else {
                    socket.emit("invalidMove", move);
                }
            } catch (err) {
                console.error("Invalid move:", move);
                socket.emit("invalidMove", move); // optional: tell client it failed
            }
        });
        

        socket.on("disconnect", () => {
            if (players.white === socket.id) {
                delete players.white;
                io.to(roomId).emit("playerDisconnected", { player: "White" });
            } else if (players.black === socket.id) {
                delete players.black;
                io.to(roomId).emit("playerDisconnected", { player: "Black" });
            } else {
                io.to(roomId).emit("playerDisconnected", { player: "Spectator" });
            }
        });
    });
});


server.listen(3000, function () {
    console.log("listening on port 3000");
});