
// Room join logic
const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get("room");

// const socket = io();
const socket = io({
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

if (roomId) {
    socket.emit("joinRoom", roomId);
    document.getElementById("inviteSection").classList.remove("hidden");
    document.getElementById("inviteLink").value = `${window.location.origin}?room=${roomId}`;



    socket.on("bothPlayersJoined", () => {
        document.getElementById("roomControls").classList.add("hidden");
        document.querySelector("boardSection").classList.remove("hidden");
        startGame();
    });
}
// const socket = io();
// const urlParams = new URLSearchParams(window.location.search);
// const roomId = urlParams.get("room");

// socket.emit("joinRoom", roomId);

const chess = new Chess();
const boardElement = document.querySelector(".chessboard");
boardElement.classList.add("touch-none");


// this for mobile touch contrrol 


let touchStart = null;
let touchMove = null;


// this for desktop control 
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
                pieceElement.classList.add("touch-none");
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

        // Touch events for mobile
        pieceElement.addEventListener("touchstart", (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStart = {
                x: touch.clientX,
                y: touch.clientY,
                row: rowindex,
                col: squareindex,
            };
            sourceSequare = { row: rowindex, col: squareindex };
            draggedPiece = pieceElement;
        });
        
        pieceElement.addEventListener("touchmove", (e) => {
            const touch = e.touches[0];
            touchMove = {
                x: touch.clientX,
                y: touch.clientY
            };
        });
        
        pieceElement.addEventListener("touchend", (e) => {
            e.preventDefault();
            if (!touchMove || !touchStart) return;
        
            const boardRect = boardElement.getBoundingClientRect();
            const squareSize = boardRect.width / 8;
        
            const offsetX = touchMove.x - boardRect.left;
            const offsetY = touchMove.y - boardRect.top;
        
            const targetCol = Math.floor(offsetX / squareSize);
            const targetRow = Math.floor(offsetY / squareSize);
        
            // Flip if black
            const adjustedTargetRow = playerRole === 'b' ? 7 - targetRow : targetRow;
            const adjustedTargetCol = playerRole === 'b' ? 7 - targetCol : targetCol;
        
            if (
                adjustedTargetCol >= 0 &&
                adjustedTargetCol <= 7 &&
                adjustedTargetRow >= 0 &&
                adjustedTargetRow <= 7
            ) {
                handleMove(sourceSequare, { row: adjustedTargetRow, col: adjustedTargetCol });
            }
        
            // Reset
            touchStart = null;
            touchMove = null;
            sourceSequare = null;
            draggedPiece = null;
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

document.getElementById("createRoomBtn").addEventListener("click", () => {
    window.location.href = "/create"; // Triggers server to generate new room and redirect
});

document.getElementById("joinRoomBtn").addEventListener("click", () => {
    const inputRoom = document.getElementById("joinRoomInput").value.trim();
    if (inputRoom) {
        window.location.href = `/?room=${inputRoom}`;
    }
});

document.getElementById("copyBtn").addEventListener("click", () => {
    const linkInput = document.getElementById("inviteLink");
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // For mobile
    document.execCommand("copy");
});


function startGame() {
    const board = Chessboard('board', {
        draggable: true,
        position: 'start'
    });
}