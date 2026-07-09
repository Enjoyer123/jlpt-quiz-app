import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    startConnection, createRoom, startGame, nextQuestion,
    onRoomCreated, onPlayerJoined, onQuestionStarted,
    onPlayerAnswered, onQuestionEnded, onGameEnded,
    subscribeToConnectionStatus, type ConnectionStatus
} from "../services/signalrService";
import { getDeckSummaries, type DeckSummary } from "../services/deckService";

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
    const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
    const [decks, setDecks] = useState<DeckSummary[]>([]);
    const [isLoadingDecks, setIsLoadingDecks] = useState(true);
    const [roomCode, setRoomCode] = useState<string>("");
    const [players, setPlayers] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
    const [connectionError, setConnectionError] = useState<string>("");
    const [phase, setPhase] = useState<GamePhase>("lobby");
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [answeredCount, setAnsweredCount] = useState<number>(0);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [correctIndex, setCorrectIndex] = useState<number>(-1);

    useEffect(() => {
        const unsubscribe = subscribeToConnectionStatus((status) => {
            setConnectionStatus(status);
            if (status === "connected") {
                setConnectionError("");
                setIsConnected(true);
            } else if (status === "connectionLost") {
                setConnectionError("Connection lost. Reconnecting...");
                setIsConnected(false);
            } else if (status === "failed") {
                setConnectionError("Failed to connect to the game server.");
                setIsConnected(false);
            } else if (status === "connecting") {
                setIsConnected(false);
            }
        });

        const loadDecks = async () => {
            setIsLoadingDecks(true);
            try {
                const nextDecks = await getDeckSummaries();
                setDecks(nextDecks);
                if (nextDecks.length > 0) {
                    setSelectedDeckId(nextDecks[0].id);
                }
            } catch {
                setDecks([]);
            } finally {
                setIsLoadingDecks(false);
            }
        };

        void loadDecks();

        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        void startConnection().then(() => {
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

    const connectionLabel =
        connectionStatus === "connected" ? "Connected" :
        connectionStatus === "reconnecting" ? "Reconnecting..." :
        connectionStatus === "connectionLost" ? "Connection Lost" :
        connectionStatus === "failed" ? "Failed to connect" : "Connecting...";

    const canHostAct = isConnected && connectionStatus === "connected";

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(135deg,_#f8fcff_0%,_#f5fbf7_45%,_#faf6ff_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_-25px_rgba(15,23,42,0.28)] backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-8">
                    <div>
                        <p className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                            Host studio
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Guide the room with calm confidence.
                        </h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-600">
                            Set up a room, welcome players, and move through questions with a warm, game-like flow.
                        </p>
                    </div>
                    <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        ← Back home
                    </Link>
                </header>

                {phase === "lobby" && (
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                        <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Setup</p>
                                    <h2 className="text-2xl font-bold text-slate-900">Create a fresh room</h2>
                                </div>
                                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${canHostAct ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                    {connectionLabel}
                                </div>
                            </div>

                            {connectionError ? (
                                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                    {connectionError}
                                </div>
                            ) : null}

                            <label className="mt-6 block text-sm font-semibold text-slate-700" htmlFor="deck-select">
                                Deck
                            </label>
                            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                                <select
                                    id="deck-select"
                                    value={selectedDeckId ?? ""}
                                    onChange={(event) => setSelectedDeckId(Number(event.target.value))}
                                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                                    disabled={isLoadingDecks}
                                >
                                    {decks.length === 0 ? (
                                        <option value="">No decks available</option>
                                    ) : (
                                        decks.map((deck) => (
                                            <option key={deck.id} value={deck.id}>
                                                {deck.name} • {deck.questionCount} questions
                                            </option>
                                        ))
                                    )}
                                </select>
                                <button
                                    onClick={() => selectedDeckId && createRoom(selectedDeckId)}
                                    disabled={!canHostAct || !!roomCode || !selectedDeckId || isLoadingDecks}
                                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Create room
                                </button>
                            </div>

                            {selectedDeckId !== null ? (
                                <div className="mt-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                                    {(() => {
                                        const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);
                                        if (!selectedDeck) {
                                            return null;
                                        }
                                        return (
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{selectedDeck.name}</p>
                                                    <p className="mt-1">{selectedDeck.questionCount} questions ready</p>
                                                </div>
                                                <Link to="/decks" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                                                    Manage decks
                                                </Link>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ) : null}

                            {roomCode && (
                                <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-500">Room code</p>
                                            <p className="text-3xl font-black tracking-[0.25em] text-slate-900">{roomCode}</p>
                                        </div>
                                        <button
                                            onClick={() => startGame(roomCode)}
                                            disabled={players.length === 0 || !canHostAct}
                                            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Start game
                                        </button>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                                        <span>Players in room</span>
                                        <span className="font-semibold text-slate-900">{players.length} joined</span>
                                    </div>

                                    <div className="mt-4 grid gap-2">
                                        {players.map((name, index) => (
                                            <div key={index} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                                <span className="font-medium">{name}</span>
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                    Player {index + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        <aside className="rounded-[28px] border border-slate-900/10 bg-slate-900 p-6 text-white shadow-[0_20px_70px_-25px_rgba(15,23,42,0.45)] sm:p-8">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Live status</p>
                            <h2 className="mt-3 text-2xl font-bold">Ready when you are</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                Once players join, your host controls will light up so you can begin the session instantly.
                            </p>
                            <div className="mt-6 space-y-3 rounded-[24px] bg-white/10 p-4">
                                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                                    <span>Connection</span>
                                    <span className="font-semibold">{isConnected ? "Live" : "Standby"}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                                    <span>Current phase</span>
                                    <span className="font-semibold">Lobby</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm">
                                    <span>Players</span>
                                    <span className="font-semibold">{players.length}</span>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}

                {phase === "question" && currentQuestion && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Question</p>
                                <h2 className="text-2xl font-bold text-slate-900">
                                    {currentQuestion.questionIndex + 1}/{currentQuestion.totalQuestions}
                                </h2>
                            </div>
                            <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                                {answeredCount}/{players.length} answered
                            </div>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Prompt</p>
                            <h3 className="mt-3 text-3xl font-black text-slate-900">{currentQuestion.term}</h3>
                            <div className="mt-6 grid gap-3">
                                {currentQuestion.choices.map((choice, index) => (
                                    <div key={index} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-medium text-slate-700 shadow-sm">
                                        <span className="mr-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                                            {['A', 'B', 'C', 'D'][index]}
                                        </span>
                                        {choice}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {phase === "result" && currentQuestion && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Reveal</p>
                                <h2 className="text-2xl font-bold text-slate-900">Answer key</h2>
                            </div>
                            <button onClick={() => nextQuestion(roomCode)} disabled={!canHostAct} className="rounded-2xl bg-gradient-to-r from-orange-400 to-amber-400 px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60">
                                Next question →
                            </button>
                        </div>

                        <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50/80 p-6">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Correct answer</p>
                            <p className="mt-2 text-2xl font-black text-emerald-800">
                                {currentQuestion.choices[correctIndex] ?? "—"}
                            </p>
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
                    </section>
                )}

                {phase === "ended" && (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Session complete</p>
                        <h2 className="mt-2 text-3xl font-black text-slate-900">The game has finished</h2>
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