import { useState, useEffect } from "react";
import {
    startConnection, createRoom, startGame, nextQuestion,
    onRoomCreated, onPlayerJoined, onQuestionStarted,
    onPlayerAnswered, onQuestionEnded, onGameEnded
} from "../services/signalrService";

interface Question {
    questionId: number;
    term: string;
    choices: string[];
    questionIndex: number;
    totalQuestions: number;
    timeLimit: number;
}

interface LeaderboardEntry {
    nickname: string;
    score: number;
}

type GamePhase = "lobby" | "question" | "result" | "ended";

export default function HostPage() {
    const [deckId, setDeckId] = useState<number>(1);
    const [roomCode, setRoomCode] = useState<string>("");
    const [players, setPlayers] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [phase, setPhase] = useState<GamePhase>("lobby");
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [answeredCount, setAnsweredCount] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [correctIndex, setCorrectIndex] = useState<number>(-1);

    useEffect(() => {
        startConnection().then(() => {
            setIsConnected(true);

            onRoomCreated((code) => setRoomCode(code));

            onPlayerJoined((playerList) => setPlayers(playerList));

            onQuestionStarted((data) => {
                setCurrentQuestion(data);
                setAnsweredCount(0);
                setCorrectIndex(-1);
                setPhase("question");
            });

            onPlayerAnswered((data) => {
                setAnsweredCount(data.answeredCount);
            });

            onQuestionEnded((data) => {
                setCorrectIndex(data.correctIndex);
                setLeaderboard(data.leaderboard);
                setPhase("result");
            });

            onGameEnded((finalLeaderboard) => {
                setLeaderboard(finalLeaderboard);
                setPhase("ended");
            });
        });
    }, []);

    return (
        <div>
            {phase === "lobby" && (
                <div>
                    <h1>Host Lobby</h1>
                    <div>
                        <label>Deck ID: </label>
                        <input
                            type="number"
                            value={deckId}
                            onChange={(e) => setDeckId(Number(e.target.value))}
                        />
                        <button onClick={() => createRoom(deckId)} disabled={!isConnected || !!roomCode}>
                            สร้างห้อง
                        </button>
                    </div>

                    {roomCode && (
                        <div>
                            <h2>Room Code: {roomCode}</h2>
                            <h3>ผู้เล่นในห้อง ({players.length} คน)</h3>
                            <ul>
                                {players.map((name, i) => <li key={i}>{name}</li>)}
                            </ul>
                            <button onClick={() => startGame(roomCode)} disabled={players.length === 0}>
                                เริ่มเกม
                            </button>
                        </div>
                    )}
                </div>
            )}

            {phase === "question" && currentQuestion && (
                <div>
                    <h2>ข้อที่ {currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}</h2>
                    <h1>{currentQuestion.term}</h1>
                    <div>
                        {currentQuestion.choices.map((choice, i) => (
                            <div key={i}>
                                <strong>{["A", "B", "C", "D"][i]}:</strong> {choice}
                            </div>
                        ))}
                    </div>
                    <p>ตอบแล้ว: {answeredCount}/{players.length} คน</p>
                </div>
            )}

            {phase === "result" && currentQuestion && (
                <div>
                    <h2>เฉลย</h2>
                    <p>คำตอบที่ถูก: <strong>{currentQuestion.choices[correctIndex]}</strong></p>
                    <h3>Leaderboard</h3>
                    <ol>
                        {leaderboard.map((entry, i) => (
                            <li key={i}>{entry.nickname} — {entry.score} คะแนน</li>
                        ))}
                    </ol>
                    <button onClick={() => nextQuestion(roomCode)}>
                        ข้อถัดไป →
                    </button>
                </div>
            )}

            {phase === "ended" && (
                <div>
                    <h1>จบเกม!</h1>
                    <h3>อันดับสุดท้าย</h3>
                    <ol>
                        {leaderboard.map((entry, i) => (
                            <li key={i}>{entry.nickname} — {entry.score} คะแนน</li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}