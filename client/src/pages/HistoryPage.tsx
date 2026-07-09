import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory, getHistoryDetail } from "../services/historyService";
import type { GameHistoryDto, GameHistoryDetailDto } from "../services/historyService";
import { logout } from "../services/authService";

export default function HistoryPage() {
    const [histories, setHistories] = useState<GameHistoryDto[]>([]);
    const [selected, setSelected] = useState<GameHistoryDetailDto | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [detailLoading, setDetailLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [hasNextPage, setHasNextPage] = useState<boolean>(false);

    const loadHistory = async (nextPage: number) => {
        setLoading(true);
        setError(null);

        try {
            const data = await getHistory(nextPage);
            setHistories(data);
            setHasNextPage(data.length === 10);
        } catch (error) {
            const err = error as { status?: number };
            if (err.status === 401) {
                await logout();
                window.location.reload();
                return;
            }
            setError("Unable to load history right now.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadHistory(page);
    }, [page]);

    const handleSelect = async (roomCode: string) => {
        setDetailLoading(true);
        setError(null);
        try {
            const detail = await getHistoryDetail(roomCode);
            setSelected(detail);
        } catch (error) {
            const err = error as { status?: number };
            if (err.status === 401) {
                await logout();
                window.location.reload();
                return;
            }
            setError("Unable to load the selected history entry.");
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.22),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(232,121,249,0.2),_transparent_26%),linear-gradient(135deg,_#f8fcff_0%,_#f5fbf7_45%,_#faf6ff_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_-25px_rgba(15,23,42,0.28)] backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-8">
                    <div>
                        <p className="mb-2 inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-sm font-semibold text-fuchsia-700">
                            History lounge
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Review your quiz stories.
                        </h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-600">
                            Explore completed rooms and see the final rankings for each session.
                        </p>
                    </div>
                    <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                        ← Back home
                    </Link>
                </header>

                {loading ? (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur">
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 w-32 rounded-full bg-slate-200" />
                            <div className="h-10 w-3/4 rounded-2xl bg-slate-200" />
                            <div className="h-20 rounded-[20px] bg-slate-100" />
                        </div>
                    </section>
                ) : histories.length === 0 ? (
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur">
                        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">No sessions yet</p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900">Your history will appear here.</h2>
                        <p className="mt-2 text-sm text-slate-600">Once games are played, they will show up here for easy review.</p>
                    </section>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                        <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Sessions</p>
                                    <h2 className="text-xl font-bold text-slate-900">Recent rooms</h2>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{histories.length}</span>
                            </div>

                            {error ? (
                                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                    {error}
                                </div>
                            ) : null}

                            <div className="mt-5 space-y-3">
                                {histories.map((history) => (
                                    <button
                                        key={history.id}
                                        onClick={() => handleSelect(history.roomCode)}
                                        className={`w-full rounded-[20px] border p-4 text-left transition-all duration-200 ${selected?.roomCode === history.roomCode ? "border-violet-300 bg-violet-50 shadow-sm" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"}`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">Room {history.roomCode}</p>
                                                <p className="mt-1 text-sm text-slate-600">Deck {history.deckId}</p>
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                {history.playerCount} players
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600">
                                            <span>{history.totalQuestions} questions</span>
                                            <span>•</span>
                                            <span>{new Date(history.playedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-5 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page === 1 || loading}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Previous
                                </button>
                                <span className="text-sm font-semibold text-slate-600">Page {page}</span>
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => current + 1)}
                                    disabled={!hasNextPage || loading}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Next
                                </button>
                            </div>
                        </section>

                        <section className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-6">
                            {detailLoading ? (
                                <div className="animate-pulse space-y-3">
                                    <div className="h-4 w-24 rounded-full bg-slate-200" />
                                    <div className="h-8 w-2/3 rounded-2xl bg-slate-200" />
                                    <div className="h-20 rounded-[20px] bg-slate-100" />
                                </div>
                            ) : selected ? (
                                <>
                                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Session details</p>
                                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Room {selected.roomCode}</h2>
                                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                                        <span className="rounded-full bg-slate-100 px-3 py-1">Deck {selected.deckId}</span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1">{selected.totalQuestions} questions</span>
                                    </div>
                                    <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6">
                                        <h3 className="text-lg font-bold text-slate-900">Final ranking</h3>
                                        <div className="mt-4 space-y-2">
                                            {selected.playerResults.map((player) => (
                                                <div key={player.rank} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                                                    <span className="font-semibold text-slate-900">{player.rank}. {player.nickname}</span>
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                                        {player.totalScore} pts
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Ready to inspect</p>
                                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Choose a room to explore.</h2>
                                    <p className="mt-2 text-sm text-slate-600">The score breakdown for each completed session will appear here.</p>
                                </div>
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}