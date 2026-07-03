import { useState, useEffect, useRef } from "react";
import {
    startConnection, joinRoom, submitAnswer,
    onPlayerJoined, onQuestionStarted,
    onPlayerAnswered, onQuestionEnded, onGameEnded, onError
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

type GamePhase = "join" | "lobby" | "question" | "answered" | "result" | "ended";

export default function PlayerPage() {
    const [roomCode, setRoomCode] = useState<string>("");
    const [nickname, setNickname] = useState<string>("");
    const [players, setPlayers] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [phase, setPhase] = useState<GamePhase>("join");
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [answeredCount, setAnsweredCount] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [correctIndex, setCorrectIndex] = useState<number>(-1);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [error, setError] = useState<string>("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const roomCodeRef = useRef<string>("");

    useEffect(() => {
        startConnection().then(() => {
            setIsConnected(true);

            onPlayerJoined((playerList) => {
                setPlayers(playerList);
                setPhase("lobby");
            });

            onQuestionStarted((data) => {
                setCurrentQuestion(data);
                setTimeLeft(data.timeLimit);
                setSelectedIndex(-1);
                setAnsweredCount(0);
                setPhase("question");

                // countdown timer
                if (timerRef.current) clearInterval(timerRef.current);
                timerRef.current = setInterval(() => {
                    setTimeLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(timerRef.current!);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            });

            onPlayerAnswered((data) => {
                setAnsweredCount(data.answeredCount);
            });

            onQuestionEnded((data) => {
                if (timerRef.current) clearInterval(timerRef.current);
                setCorrectIndex(data.correctIndex);
                setLeaderboard(data.leaderboard);
                setPhase("result");
            });

            onGameEnded((finalLeaderboard) => {
                setLeaderboard(finalLeaderboard);
                setPhase("ended");
            });

            onError((message) => setError(message));
        });

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleJoin = () => {
        if (!roomCode || !nickname) return;
        setError("");
        roomCodeRef.current = roomCode;
        joinRoom(roomCode, nickname);
    };

    const handleAnswer = (index: number) => {
        if (selectedIndex !== -1 || !currentQuestion) return;
        setSelectedIndex(index);
        setPhase("answered");
        submitAnswer(roomCodeRef.current, currentQuestion.questionId, index);
    };

    const getChoiceStyle = (index: number): React.CSSProperties => {
        if (phase === "result") {
            if (index === correctIndex) return { backgroundColor: "green", color: "white" };
            if (index === selectedIndex && index !== correctIndex) return { backgroundColor: "red", color: "white" };
        }
        if (selectedIndex === index) return { backgroundColor: "gray", color: "white" };
        return {};
    };

    return (
        <div>
            {phase === "join" && (
                <div>
                    <h1>Join Room</h1>
                    <div>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="Room Code"
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Nickname"
                        />
                    </div>
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    <button onClick={handleJoin} disabled={!isConnected}>
                        เข้าห้อง
                    </button>
                </div>
            )}

            {phase === "lobby" && (
                <div>
                    <h2>ห้อง: {roomCode}</h2>
                    <p>รอ host เริ่มเกม...</p>
                    <h3>ผู้เล่นในห้อง ({players.length} คน)</h3>
                    <ul>
                        {players.map((name, i) => <li key={i}>{name}</li>)}
                    </ul>
                </div>
            )}

            {(phase === "question" || phase === "answered") && currentQuestion && (
                <div>
                    <h2>ข้อที่ {currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}</h2>
                    <p>⏱ {timeLeft} วินาที</p>
                    <h1>{currentQuestion.term}</h1>
                    <div>
                        {currentQuestion.choices.map((choice, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(i)}
                                disabled={selectedIndex !== -1}
                                style={getChoiceStyle(i)}
                            >
                                {["A", "B", "C", "D"][i]}: {choice}
                            </button>
                        ))}
                    </div>
                    <p>ตอบแล้ว: {answeredCount} คน</p>
                    {phase === "answered" && <p>✅ ส่งคำตอบแล้ว รอคนอื่น...</p>}
                </div>
            )}

            {phase === "result" && currentQuestion && (
                <div>
                    <h2>เฉลย</h2>
                    <div>
                        {currentQuestion.choices.map((choice, i) => (
                            <div key={i} style={getChoiceStyle(i)}>
                                {["A", "B", "C", "D"][i]}: {choice}
                            </div>
                        ))}
                    </div>
                    <h3>Leaderboard</h3>
                    <ol>
                        {leaderboard.map((entry, i) => (
                            <li key={i}>{entry.nickname} — {entry.score} คะแนน</li>
                        ))}
                    </ol>
                    <p>รอ host ไปข้อถัดไป...</p>
                </div>
            )}

            {phase === "ended" && (
                <div>
                    <h1>จบเกม!</h1>
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