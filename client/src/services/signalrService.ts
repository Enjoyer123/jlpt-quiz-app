import * as signalR from "@microsoft/signalr";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "connectionLost" | "failed";

const connection = new signalR.HubConnectionBuilder()
    .withUrl(import.meta.env.VITE_SIGNALR_URL || "/gameHub", { withCredentials: true })
    .withAutomaticReconnect()
    .build();

let connectionStatus: ConnectionStatus = "connecting";
const listeners = new Set<(status: ConnectionStatus) => void>();

const setConnectionStatus = (status: ConnectionStatus) => {
    connectionStatus = status;
    listeners.forEach((listener) => listener(status));
};

export const subscribeToConnectionStatus = (listener: (status: ConnectionStatus) => void) => {
    listeners.add(listener);
    listener(connectionStatus);
    return () => listeners.delete(listener);
};

export const getConnectionStatus = () => connectionStatus;

connection.onreconnecting(() => {
    setConnectionStatus("reconnecting");
});

connection.onreconnected(() => {
    setConnectionStatus("connected");
});

connection.onclose(() => {
    setConnectionStatus("connectionLost");
});

export const startConnection = async () => {
    if (connection.state === signalR.HubConnectionState.Connected) {
        setConnectionStatus("connected");
        return;
    }

    if (connection.state === signalR.HubConnectionState.Connecting || connection.state === signalR.HubConnectionState.Reconnecting) {
        return;
    }

    setConnectionStatus("connecting");

    try {
        await connection.start();
        setConnectionStatus("connected");
    } catch (error) {
        setConnectionStatus("failed");
        throw error;
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