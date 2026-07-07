import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5296/gameHub", { withCredentials: true })
    .withAutomaticReconnect()
    .build();

export const startConnection = async () => {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
        await connection.start();
    }
};

// Host actions
export const createRoom = (deckId: number) =>
    connection.invoke("CreateRoom", deckId);

export const startGame = (roomCode: string) =>
    connection.invoke("StartGame", roomCode);

export const nextQuestion = (roomCode: string) =>
    connection.invoke("NextQuestion", roomCode);

// Player actions
export const joinRoom = (roomCode: string, nickname: string) =>
    connection.invoke("JoinRoom", roomCode, nickname);

export const submitAnswer = (roomCode: string, questionId: number, selectedIndex: number) =>
    connection.invoke("SubmitAnswer", roomCode, questionId, selectedIndex);

// Events from server
export const onRoomCreated = (cb: (roomCode: string) => void) =>
    connection.on("RoomCreated", cb);

export const onPlayerJoined = (cb: (players: string[]) => void) =>
    connection.on("PlayerJoined", cb);

export const onQuestionStarted = (cb: (data: {
    questionId: number;
    term: string;
    choices: string[];
    questionIndex: number;
    totalQuestions: number;
    timeLimit: number;
}) => void) => connection.on("QuestionStarted", cb);

export const onPlayerAnswered = (cb: (data: {
    answeredCount: number;
    totalPlayers: number;
}) => void) => connection.on("PlayerAnswered", cb);

export const onQuestionEnded = (cb: (data: {
    correctIndex: number;
    leaderboard: { nickname: string; score: number }[];
}) => void) => connection.on("QuestionEnded", cb);

export const onGameEnded = (cb: (leaderboard: { nickname: string; score: number }[]) => void) =>
    connection.on("GameEnded", cb);

export const onError = (cb: (message: string) => void) =>
    connection.on("ErrorOccurred", cb);

export default connection;