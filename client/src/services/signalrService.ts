import * as signalR from "@microsoft/signalr";

const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5296/gameHub")
    .withAutomaticReconnect()
    .build();

export const startConnection = async () => {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
        await connection.start();
    }
};

export const createRoom = (deckId: number) => {
    return connection.invoke("CreateRoom", deckId);
};

export const joinRoom = (roomCode: string, nickname: string) => {
    return connection.invoke("JoinRoom", roomCode, nickname);
};

export const onRoomCreated = (callback: (roomCode: string) => void) => {
    connection.on("RoomCreated", callback);
};

export const onPlayerJoined = (callback: (players: string[]) => void) => {
    connection.on("PlayerJoined", callback);
};

export const onError = (callback: (message: string) => void) => {
    connection.on("ErrorOccurred", callback);
};

export default connection;