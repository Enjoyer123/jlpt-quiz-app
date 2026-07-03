import { useState, useEffect } from "react";

interface GameHistoryDto {
    id: number;
    roomCode: string;
    deckId: number;
    playedAt: string;
    totalQuestions: number;
    playerCount: number;
}

interface PlayerResultDto {
    nickname: string;
    totalScore: number;
    rank: number;
}

interface GameHistoryDetailDto {
    id: number;
    roomCode: string;
    deckId: number;
    playedAt: string;
    totalQuestions: number;
    playerResults: PlayerResultDto[];
}

export default function HistoryPage() {
    const [histories, setHistories] = useState<GameHistoryDto[]>([]);
    const [selected, setSelected] = useState<GameHistoryDetailDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetch("http://localhost:5296/api/history")
            .then((res) => res.json())
            .then((data) => {
                setHistories(data);
                setLoading(false);
            });
    }, []);

    const handleSelect = (roomCode: string) => {
        fetch(`http://localhost:5296/api/history/${roomCode}`)
            .then((res) => res.json())
            .then((data) => setSelected(data));
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h1>ประวัติการเล่น</h1>

            {histories.length === 0 && <p>ยังไม่มีประวัติการเล่น</p>}

            <div style={{ display: "flex", gap: "20px" }}>
                <div style={{ minWidth: "300px" }}>
                    {histories.map((h) => (
                        <div
                            key={h.id}
                            onClick={() => handleSelect(h.roomCode)}
                            style={{
                                border: "1px solid gray",
                                padding: "10px",
                                marginBottom: "10px",
                                cursor: "pointer",
                                backgroundColor: selected?.roomCode === h.roomCode ? "#eee" : "white"
                            }}
                        >
                            <strong>ห้อง: {h.roomCode}</strong>
                            <p>Deck ID: {h.deckId}</p>
                            <p>ผู้เล่น: {h.playerCount} คน</p>
                            <p>คำถาม: {h.totalQuestions} ข้อ</p>
                            <p>เล่นเมื่อ: {new Date(h.playedAt).toLocaleString("th-TH")}</p>
                        </div>
                    ))}
                </div>

                {selected && (
                    <div style={{ flex: 1 }}>
                        <h2>ผลเกมห้อง {selected.roomCode}</h2>
                        <p>Deck ID: {selected.deckId}</p>
                        <p>คำถามทั้งหมด: {selected.totalQuestions} ข้อ</p>
                        <h3>อันดับ</h3>
                        <ol>
                            {selected.playerResults.map((p) => (
                                <li key={p.rank}>
                                    {p.nickname} — {p.totalScore} คะแนน
                                </li>
                            ))}
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}