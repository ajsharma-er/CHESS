const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");


let draggedPiece = null;
let sourceSequare = null;
let playerRole = null;

const renderBoard = ()=>{
    const board = chess.board();
    boardElement.innerHTML ="";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square", 
                (rowindex + squareindex)% 2 === 0 ? "light" : "dark" );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;


            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white":"black");
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;
           

        pieceElement.addEventListener("dragstart", (e) => {
            if(pieceElement.draggable){
                draggedPiece = pieceElement;
                sourceSequare = {row: rowindex, col: squareindex};
                e.dataTransfer.setData("text/plain", "");
            }
        });

        pieceElement.addEventListener("dragend", (e) => {
            draggedPiece = null;
            sourceSequare = null;
        });

        squareElement.appendChild(pieceElement);
    }

        squareElement.addEventListener("dragover", function (e) {
            e.preventDefault();
        });

        squareElement.addEventListener("drop", function (e) {
            e.preventDefault();
            if(draggedPiece){
                const targetSource = {
                    row: parseInt(squareElement.dataset.row),
                    col: parseInt(squareElement.dataset.col),

                };

                handleMove(sourceSequare, targetSource);

            }
        });
        boardElement.appendChild(squareElement);

    });

    });

    if(playerRole === 'b'){
        boardElement.classList.add("flipped");
    
    }
    else{
        boardElement.classList.remove("flipped");
    }
    
};


const handleMove = (source, target) => { 
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q',
    };
    console.log("Move Object:", move);

    socket.emit("move", move);
};


const getPieceUnicode = (piece)=>{
    const unicodPieces = {
        
     k:	"♚",
     q:	"♛",
     r:	"♜",
     b:	"♝",
     n:	"♞",
     p:	"♟︎",
     K:	"♚",
     Q:	"♛",
     R:	"♜",
     B:	"♝",
     N:	"♞",
     P:	"♟",
    };

    return unicodPieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

socket.on("playerDisconnected", function (data) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.innerText = `${data.player} player has disconnected.`;

    // Append the notification to the document body
    document.body.appendChild(notification);

    // Remove the notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
});

socket.on("notYourTurn", function (message){
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.innerText = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);

});

renderBoard();