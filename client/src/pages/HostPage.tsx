import { useState, useEffect } from "react";
import { startConnection, createRoom, onRoomCreated, onPlayerJoined } from "../services/signalrService";

export default function HostPage() {
    const [deckId, setDeckId] = useState<number>(1);
    const [roomCode, setRoomCode] = useState<string>("");
    const [players, setPlayers] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        startConnection().then(() => {
            setIsConnected(true);

            onRoomCreated((code) => {
                setRoomCode(code);
            });

            onPlayerJoined((playerList) => {
                setPlayers(playerList);
            });
        });
    }, []);

    const handleCreateRoom = () => {
        createRoom(deckId);
    };

    return (
        <div>
            <h1>Host Lobby</h1>

            <div>
                <label>Deck ID: </label>
                <input
                    type="number"
                    value={deckId}
                    onChange={(e) => setDeckId(Number(e.target.value))}
                />
                <button onClick={handleCreateRoom} disabled={!isConnected || !!roomCode}>
                    สร้างห้อง
                </button>
            </div>

            {roomCode && (
                <div>
                    <h2>Room Code: {roomCode}</h2>
                    <p>รอผู้เล่นเข้าห้อง...</p>
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