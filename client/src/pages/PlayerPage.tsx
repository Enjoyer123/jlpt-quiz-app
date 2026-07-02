import { useState, useEffect } from "react";
import { startConnection, joinRoom, onPlayerJoined, onError } from "../services/signalrService";

export default function PlayerPage() {
    const [roomCode, setRoomCode] = useState<string>("");
    const [nickname, setNickname] = useState<string>("");
    const [players, setPlayers] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [hasJoined, setHasJoined] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        startConnection().then(() => {
            setIsConnected(true);

            onPlayerJoined((playerList) => {
                setPlayers(playerList);
                setHasJoined(true);
            });

            onError((message) => {
                setError(message);
            });
        });
    }, []);

    const handleJoinRoom = () => {
        if (!roomCode || !nickname) return;
        setError("");
        joinRoom(roomCode, nickname);
    };

    return (
        <div>
            <h1>Join Room</h1>

            {!hasJoined ? (
                <div>
                    <div>
                        <label>Room Code: </label>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="เช่น A3F9B2"
                        />
                    </div>
                    <div>
                        <label>Nickname: </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="ชื่อของคุณ"
                        />
                    </div>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    <button onClick={handleJoinRoom} disabled={!isConnected}>
                        เข้าห้อง
                    </button>
                </div>
            ) : (
                <div>
                    <h2>ห้อง: {roomCode}</h2>
                    <p>รอ host เริ่มเกม...</p>
                    <h3>ผู้เล่นในห้อง ({players.length} คน)</h3>
                    <ul>
                        {players.map((name, index) => (
                            <li key={index}>{name}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}