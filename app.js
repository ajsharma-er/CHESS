const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");
const {title} = require("process");

const app = express();


const server = http.createServer(app);
const io = socket(server);


const chess = new Chess();
let players = {};
let currentPlayer = "W";

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.render("index", {title: "Chess Game"});
});

io.on("connection", function(socket){
    console.log("connected");

    if (!players.white) {
      players.white = socket.id;
      socket.emit("playerRole", "w");  
    }
    else if (!players.black){
        players.black = socket.id;
       socket.emit("playerRole", "b");
    }
    else{

    socket.emit("spectatorRole");
    }

  socket.on("disconnect", function () {
    if(socket.id === players.white){
        console.log("White player disconnected");
        delete players.white;
        io.emit("playerDisconnected", { player: "White" });
    }
    else if(socket.id === players.black){
        console.log("Black player disconnected");
        delete players.black;
        io.emit("playerDisconnected", { player: "Black" });
    }
    else{
        console.log("A spectator disconnected");
        io.emit("playerDisconnected", { player: "Spectator" });
    }
    });

socket.on("move", (move) => {
    try {
        if (chess.turn() === 'w' && socket.id !== players.white){
            socket.emit("notYourTurn", "It's not your turn!");
            return;
        }
        if (chess.turn() === 'b' && socket.id !== players.black){
            socket.emit("notYourTurn", "It's not your turn!");
            return;
        }
    
        const result = chess.move(move);
        if(result){
            currentPlayer = chess.turn();
            io.emit("move", move);
            io.emit("boardState", chess.fen())
        }
        else{
            console.log("Invalid Move :", move);
            socket.emit("invalidMove", move);
        }

    } catch (error) {
        console.log(error);
        socket.emit("Invalid move :", move);
    }
})

});

server.listen(3000, function () {
    console.log("listening on port 3000");
});