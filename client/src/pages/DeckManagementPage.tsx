import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    createDeck,
    deleteDeck,
    getDecks,
    getLevelLabel,
    getLevelOptions,
    updateDeck,
    type Deck,
    type CreateDeckPayload,
    type UpdateDeckPayload,
} from "../services/deckService";

const emptyForm = {
    name: "",
    level: 0,
};

export default function DeckManagementPage() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formState, setFormState] = useState<CreateDeckPayload>(emptyForm);

    const loadDecks = async () => {
        setLoading(true);
        setError(null);

        try {
            const nextDecks = await getDecks();
            setDecks(nextDecks);
        } catch {
            setError("Unable to load decks right now.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDecks();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setFormState(emptyForm);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!formState.name.trim()) {
            setError("Please enter a deck name.");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (editingId === null) {
                await createDeck({ name: formState.name.trim(), level: formState.level });
                setSuccess("Deck created successfully.");
            } else {
                const payload: UpdateDeckPayload = {
                    name: formState.name.trim(),
                    level: formState.level,
                };
                await updateDeck(editingId, payload);
                setSuccess("Deck updated successfully.");
            }

            resetForm();
            await loadDecks();
        } catch {
            setError("Unable to save the deck right now.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (deck: Deck) => {
        setEditingId(deck.id);
        setFormState({ name: deck.name, level: deck.level });
        setError(null);
        setSuccess(null);
    };

    const handleDelete = async (deck: Deck) => {
        if (!window.confirm(`Delete ${deck.name}?`)) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            await deleteDeck(deck.id);
            setSuccess("Deck deleted.");
            await loadDecks();
        } catch {
            setError("Unable to delete the deck right now.");
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(135deg,_#f8fcff_0%,_#f5fbf7_45%,_#faf6ff_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_-25px_rgba(15,23,42,0.28)] backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-8">
                    <div>
                        <p className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                            Deck manager
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Keep your quiz decks tidy and ready.
                        </h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-600">
                            Add new decks, refine existing ones, or jump straight into the questions inside each set.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/host" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                            Host view
                        </Link>
                        <Link to="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                            ← Back home
                        </Link>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Deck form</p>
                                <h2 className="text-2xl font-bold text-slate-900">{editingId === null ? "Create a deck" : "Edit deck"}</h2>
                            </div>
                        </div>

                        {error ? (
                            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                {error}
                            </div>
                        ) : null}

                        {success ? (
                            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                {success}
                            </div>
                        ) : null}

                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700" htmlFor="deck-name">
                                    Deck name
                                </label>
                                <input
                                    id="deck-name"
                                    value={formState.name}
                                    onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                                    placeholder="JLPT N3 Vocabulary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700" htmlFor="deck-level">
                                    JLPT level
                                </label>
                                <select
                                    id="deck-level"
                                    value={formState.level}
                                    onChange={(event) => setFormState((current) => ({ ...current, level: Number(event.target.value) }))}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                                >
                                    {getLevelOptions().map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? "Saving..." : editingId === null ? "Create deck" : "Save changes"}
                                </button>
                                {editingId !== null ? (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                                    >
                                        Cancel
                                    </button>
                                ) : null}
                            </div>
                        </form>
                    </section>

                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Available decks</p>
                                <h2 className="text-2xl font-bold text-slate-900">Your library</h2>
                            </div>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                                {decks.length} decks
                            </div>
                        </div>

                        {loading ? (
                            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
                                Loading decks...
                            </div>
                        ) : decks.length === 0 ? (
                            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
                                No decks yet. Create your first deck to get started.
                            </div>
                        ) : (
                            <div className="mt-6 space-y-3">
                                {decks.map((deck) => (
                                    <div key={deck.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{deck.name}</h3>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {getLevelLabel(deck.level)} • {new Date(deck.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                                                Deck #{deck.id}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Link
                                                to={`/decks/${deck.id}/questions`}
                                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Manage questions
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(deck)}
                                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(deck)}
                                                className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
