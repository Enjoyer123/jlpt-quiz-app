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

// Reusable timer progress bar component
function TimerBar({ timeLeft, timeLimit }: { timeLeft: number; timeLimit: number }) {
    const pct = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;
    const color =
        pct > 60 ? "#10b981"   // emerald
        : pct > 30 ? "#f59e0b"  // amber
        : "#ef4444";             // red

    return (
        <div className="flex items-center gap-3">
            <span
                className="min-w-[3.2rem] text-right text-sm font-black tabular-nums transition-colors duration-500"
                style={{ color }}
            >
                {timeLeft}s
            </span>
            <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                <div
                    className="progress-bar-fill absolute left-0 top-0 h-full rounded-full"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 8px 1px ${color}88`,
                    }}
                />
            </div>
        </div>
    );
}

// Rank badge for top 3
function RankBadge({ rank }: { rank: number }) {
    if (rank === 1) {
        return (
            <span className="rank-gold inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 text-xs font-black text-amber-900">
                1
            </span>
        );
    }
    if (rank === 2) {
        return (
            <span className="rank-silver inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-black text-slate-700">
                2
            </span>
        );
    }
    if (rank === 3) {
        return (
            <span className="rank-bronze inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-orange-300 to-amber-600 text-xs font-black text-amber-900">
                3
            </span>
        );
    }
    return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
            {rank}
        </span>
    );
}

// Answered progress bar
function AnsweredBar({ answered, total }: { answered: number; total: number }) {
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    return (
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-white/80 px-5 py-4">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-600">Players answered</span>
                <span className="font-black text-slate-900">{answered} / {total > 0 ? total : "—"}</span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

// Leaderboard list (shared between result and ended)
function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
    return (
        <div className="space-y-2">
            {entries.map((entry, index) => (
                <div
                    key={`${entry.nickname}-${index}`}
                    className="slide-in-up flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                    style={{ animationDelay: `${index * 60}ms` }}
                >
                    <RankBadge rank={index + 1} />
                    <span className="flex-1 font-semibold text-slate-900">{entry.nickname}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black tabular-nums tracking-wide text-slate-600">
                        {entry.score} pts
                    </span>
                </div>
            ))}
        </div>
    );
}

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

    const choiceColors = [
        { border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-900", badge: "bg-sky-200 text-sky-800" },
        { border: "border-violet-200", bg: "bg-violet-50", text: "text-violet-900", badge: "bg-violet-200 text-violet-800" },
        { border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-900", badge: "bg-amber-200 text-amber-800" },
        { border: "border-rose-200", bg: "bg-rose-50", text: "text-rose-900", badge: "bg-rose-200 text-rose-800" },
    ];

    const getChoiceClassName = (index: number) => {
        const base = "w-full rounded-[20px] border px-4 py-4 text-left text-sm font-semibold transition-all duration-200";

        if (phase === "result") {
            if (index === correctIndex) return `${base} border-emerald-300 bg-emerald-50 text-emerald-800 shadow-[inset_0_0_0_2px_rgba(52,211,153,0.4)]`;
            if (index === selectedIndex && index !== correctIndex) return `${base} border-rose-300 bg-rose-50 text-rose-700`;
            return `${base} border-slate-200 bg-white/60 text-slate-400`;
        }

        if (selectedIndex === index) {
            return `${base} ${choiceColors[index].border} ${choiceColors[index].bg} ${choiceColors[index].text} shadow-md`;
        }

        return `${base} border-slate-200 bg-white/90 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md`;
    };

    const getChoiceBadgeClass = (index: number) => {
        if (phase === "result") {
            if (index === correctIndex) return "bg-emerald-200 text-emerald-800";
            if (index === selectedIndex && index !== correctIndex) return "bg-rose-200 text-rose-700";
            return "bg-slate-100 text-slate-400";
        }
        if (selectedIndex === index) return choiceColors[index].badge;
        return "bg-slate-100 text-slate-700";
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

                {/* ── JOIN ── */}
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
                            <div className={`mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${canJoinGame ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                <span className={`inline-block h-2 w-2 rounded-full ${canJoinGame ? "bg-emerald-400" : "bg-amber-400"} animate-pulse`} />
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

                {/* ── LOBBY ── */}
                {phase === "lobby" && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Waiting room</p>
                                <h2 className="mt-2 text-2xl font-bold text-slate-900">Room {roomCode}</h2>
                            </div>
                            {/* Waiting pulse indicator */}
                            <div className="flex items-center gap-1.5">
                                <span className="lobby-dot h-3 w-3 rounded-full bg-sky-400" />
                                <span className="lobby-dot h-3 w-3 rounded-full bg-sky-400" />
                                <span className="lobby-dot h-3 w-3 rounded-full bg-sky-400" />
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">The host will start the session soon. You are all set and ready to play.</p>
                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <h3 className="text-lg font-bold text-slate-900">Players in the room ({players.length})</h3>
                            <div className="mt-4 grid gap-2">
                                {players.map((name, index) => (
                                    <div key={`${name}-${index}`} className="slide-in-up flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700" style={{ animationDelay: `${index * 50}ms` }}>
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

                {/* ── QUESTION / ANSWERED ── */}
                {(phase === "question" || phase === "answered") && currentQuestion && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        {/* Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Question</p>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}
                                </h2>
                            </div>
                        </div>

                        {/* Timer bar */}
                        <div className="mt-4">
                            <TimerBar timeLeft={timeLeft} timeLimit={currentQuestion.timeLimit} />
                        </div>

                        {/* Question term */}
                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Prompt</p>
                            <h3 className="mt-3 text-3xl font-black text-slate-900">{currentQuestion.term}</h3>

                            {/* Choices */}
                            <div className="mt-6 grid gap-3">
                                {currentQuestion.choices.map((choice, index) => (
                                    <button
                                        key={`${choice}-${index}`}
                                        onClick={() => handleAnswer(index)}
                                        disabled={selectedIndex !== -1}
                                        className={getChoiceClassName(index)}
                                    >
                                        <span className={`mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full font-bold transition-colors duration-200 ${getChoiceBadgeClass(index)}`}>
                                            {['A', 'B', 'C', 'D'][index]}
                                        </span>
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Answered progress */}
                        <AnsweredBar answered={answeredCount} total={players.length} />
                        {phase === "answered" && (
                            <p className="mt-3 text-center text-sm font-semibold text-emerald-700">
                                Answer sent — waiting for the reveal.
                            </p>
                        )}
                    </section>
                )}

                {/* ── RESULT ── */}
                {phase === "result" && currentQuestion && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Reveal</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">See how you did</h2>
                        <div className="mt-6 grid gap-3">
                            {currentQuestion.choices.map((choice, index) => (
                                <div key={`${choice}-${index}`} className={getChoiceClassName(index)}>
                                    <span className={`mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full font-bold ${getChoiceBadgeClass(index)}`}>
                                        {['A', 'B', 'C', 'D'][index]}
                                    </span>
                                    {choice}
                                    {index === correctIndex && (
                                        <span className="ml-auto text-xs font-bold text-emerald-600">Correct</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <h3 className="text-lg font-bold text-slate-900">Leaderboard</h3>
                            <div className="mt-4">
                                <LeaderboardList entries={leaderboard} />
                            </div>
                        </div>
                        <p className="mt-5 text-sm text-slate-600">The host will move to the next question soon.</p>
                    </section>
                )}

                {/* ── ENDED ── */}
                {phase === "ended" && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Session complete</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900">Great work, learner.</h2>
                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <h3 className="text-lg font-bold text-slate-900">Final leaderboard</h3>
                            <div className="mt-4">
                                <LeaderboardList entries={leaderboard} />
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}