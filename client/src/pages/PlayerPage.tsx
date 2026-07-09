import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    startConnection, joinRoom, submitAnswer,
    onPlayerJoined, onQuestionStarted,
    onPlayerAnswered, onQuestionEnded, onGameEnded, onError,
    subscribeToConnectionStatus, type ConnectionStatus
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
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
    const [answeredCount, setAnsweredCount] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [correctIndex, setCorrectIndex] = useState<number>(-1);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [error, setError] = useState<string>("");
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const roomCodeRef = useRef<string>("");

    useEffect(() => {
        const unsubscribe = subscribeToConnectionStatus((status) => {
            setConnectionStatus(status);
            if (status === "connected") {
                setIsConnected(true);
                setError("");
            } else if (status === "connectionLost") {
                setIsConnected(false);
                setError("Connection lost. Reconnecting...");
            } else if (status === "failed") {
                setIsConnected(false);
                setError("Failed to connect to the game server.");
            } else {
                setIsConnected(false);
            }
        });

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
        }).catch(() => {
            setIsConnected(false);
            setError("Failed to connect to the game server.");
        });

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            unsubscribe();
        };
    }, []);

    const handleJoin = () => {
        if (!roomCode || !nickname || !isConnected) {
            setError("Waiting for the connection to be ready.");
            return;
        }
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

    const connectionLabel =
        connectionStatus === "connected" ? "Connected" :
        connectionStatus === "reconnecting" ? "Reconnecting..." :
        connectionStatus === "connectionLost" ? "Connection Lost" :
        connectionStatus === "failed" ? "Failed to connect" : "Connecting...";

    const canJoinGame = isConnected && connectionStatus === "connected";

    const getChoiceClassName = (index: number) => {
        const base = "w-full rounded-[20px] border px-4 py-4 text-left text-sm font-semibold transition-all duration-200";

        if (phase === "result") {
            if (index === correctIndex) return `${base} border-emerald-300 bg-emerald-50 text-emerald-800`;
            if (index === selectedIndex && index !== correctIndex) return `${base} border-rose-300 bg-rose-50 text-rose-700`;
        }

        if (selectedIndex === index) return `${base} border-sky-300 bg-sky-50 text-sky-700`;

        return `${base} border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md`;
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.25),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(217,70,239,0.2),_transparent_28%),linear-gradient(135deg,_#f8fcff_0%,_#f3fbf6_50%,_#faf6ff_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-5xl flex-col gap-6">
                <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_-25px_rgba(15,23,42,0.28)] backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-8">
                    <div>
                        <p className="mb-2 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                            Player lounge
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Jump into the quiz with energy.
                        </h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-600">
                            Join a room, answer as the timer counts down, and enjoy a polished, game-ready experience.
                        </p>
                    </div>
                    <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        ← Back home
                    </Link>
                </header>

                {phase === "join" && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <div className="max-w-xl">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Join a room</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">Enter your room code</h2>
                            <div className="mt-6 space-y-4">
                                <label className="block text-sm font-semibold text-slate-700" htmlFor="room-code">
                                    Room code
                                </label>
                                <input
                                    id="room-code"
                                    type="text"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                    placeholder="Room Code"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                                />
                                <label className="block text-sm font-semibold text-slate-700" htmlFor="nickname">
                                    Nickname
                                </label>
                                <input
                                    id="nickname"
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="Nickname"
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                                />
                            </div>
                            {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>}
                            <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${canJoinGame ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                {connectionLabel}
                            </div>
                            <button
                                onClick={handleJoin}
                                disabled={!canJoinGame}
                                className="mt-6 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Join room
                            </button>
                        </div>
                    </section>
                )}

                {phase === "lobby" && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Waiting room</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">Room {roomCode}</h2>
                        <p className="mt-2 text-sm text-slate-600">The host will start the session soon. You are all set and ready to play.</p>
                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <h3 className="text-lg font-bold text-slate-900">Players in the room ({players.length})</h3>
                            <div className="mt-4 grid gap-2">
                                {players.map((name, index) => (
                                    <div key={`${name}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                        <span className="font-medium">{name}</span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            Player {index + 1}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {(phase === "question" || phase === "answered") && currentQuestion && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Question</p>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}
                                </h2>
                            </div>
                            <div className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                                ⏱ {timeLeft}s
                            </div>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Prompt</p>
                            <h3 className="mt-3 text-3xl font-black text-slate-900">{currentQuestion.term}</h3>
                            <div className="mt-6 grid gap-3">
                                {currentQuestion.choices.map((choice, index) => (
                                    <button
                                        key={`${choice}-${index}`}
                                        onClick={() => handleAnswer(index)}
                                        disabled={selectedIndex !== -1}
                                        className={getChoiceClassName(index)}
                                    >
                                        <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                                            {['A', 'B', 'C', 'D'][index]}
                                        </span>
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white/80 px-4 py-4 text-sm text-slate-600">
                            <span>{answeredCount} players have answered so far</span>
                            {phase === "answered" && <span className="font-semibold text-emerald-700">Answer sent. Waiting for the next reveal.</span>}
                        </div>
                    </section>
                )}

                {phase === "result" && currentQuestion && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Reveal</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">See how you did</h2>
                        <div className="mt-6 grid gap-3">
                            {currentQuestion.choices.map((choice, index) => (
                                <div key={`${choice}-${index}`} className={getChoiceClassName(index)}>
                                    <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                                        {['A', 'B', 'C', 'D'][index]}
                                    </span>
                                    {choice}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <h3 className="text-lg font-bold text-slate-900">Leaderboard</h3>
                            <div className="mt-4 space-y-2">
                                {leaderboard.map((entry, index) => (
                                    <div key={`${entry.nickname}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                        <span className="font-semibold text-slate-900">{index + 1}. {entry.nickname}</span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            {entry.score} pts
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <p className="mt-5 text-sm text-slate-600">The host will move to the next question soon.</p>
                    </section>
                )}

                {phase === "ended" && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Session complete</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900">Great work, learner.</h2>
                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <h3 className="text-lg font-bold text-slate-900">Final leaderboard</h3>
                            <div className="mt-4 space-y-2">
                                {leaderboard.map((entry, index) => (
                                    <div key={`${entry.nickname}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                        <span className="font-semibold text-slate-900">{index + 1}. {entry.nickname}</span>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                            {entry.score} pts
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}