import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    createQuestion,
    deleteQuestion,
    updateQuestion,
    type CreateQuestionPayload,
    type Question,
} from "../services/questionService";
import { getDeck, getDecks, getLevelLabel, type Deck } from "../services/deckService";

const emptyForm = {
    term: "",
    choiceA: "",
    choiceB: "",
    choiceC: "",
    choiceD: "",
    correctIndex: 0,
};

export default function QuestionManagementPage() {
    const { deckId } = useParams();
    const [decks, setDecks] = useState<Deck[]>([]);
    const [selectedDeckId, setSelectedDeckId] = useState<number | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formState, setFormState] = useState<CreateQuestionPayload>(emptyForm);

    const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;

    const loadDecks = async () => {
        try {
            const nextDecks = await getDecks();
            setDecks(nextDecks);
        } catch {
            setError("Unable to load decks right now.");
        }
    };

    const loadQuestions = async (deckIdToLoad: number) => {
        setLoading(true);
        setError(null);

        try {
            const detail = await getDeck(deckIdToLoad);
            setQuestions(detail.questions);
        } catch {
            setError("Unable to load questions for this deck.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadDecks();
    }, []);

    useEffect(() => {
        if (decks.length === 0) {
            setSelectedDeckId(null);
            setQuestions([]);
            return;
        }

        const requestedDeckId = Number(deckId);
        const hasRequestedDeck = !Number.isNaN(requestedDeckId) && decks.some((deck) => deck.id === requestedDeckId);

        if (hasRequestedDeck) {
            setSelectedDeckId(requestedDeckId);
            return;
        }

        if (selectedDeckId === null || !decks.some((deck) => deck.id === selectedDeckId)) {
            setSelectedDeckId(decks[0].id);
        }
    }, [deckId, decks, selectedDeckId]);

    useEffect(() => {
        if (selectedDeckId === null) {
            return;
        }

        void loadQuestions(selectedDeckId);
    }, [selectedDeckId]);

    const resetForm = () => {
        setEditingId(null);
        setFormState(emptyForm);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedDeckId) {
            setError("Choose a deck first.");
            return;
        }

        if (!formState.term.trim()) {
            setError("Please enter the question term.");
            return;
        }

        if (!formState.choiceA.trim() || !formState.choiceB.trim() || !formState.choiceC.trim() || !formState.choiceD.trim()) {
            setError("Please fill out all four answer choices.");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            if (editingId === null) {
                await createQuestion(selectedDeckId, {
                    term: formState.term.trim(),
                    choiceA: formState.choiceA.trim(),
                    choiceB: formState.choiceB.trim(),
                    choiceC: formState.choiceC.trim(),
                    choiceD: formState.choiceD.trim(),
                    correctIndex: formState.correctIndex,
                });
                setSuccess("Question created successfully.");
            } else {
                await updateQuestion(editingId, {
                    term: formState.term.trim(),
                    choiceA: formState.choiceA.trim(),
                    choiceB: formState.choiceB.trim(),
                    choiceC: formState.choiceC.trim(),
                    choiceD: formState.choiceD.trim(),
                    correctIndex: formState.correctIndex,
                });
                setSuccess("Question updated successfully.");
            }

            resetForm();
            await loadQuestions(selectedDeckId);
        } catch {
            setError("Unable to save the question right now.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (question: Question) => {
        setEditingId(question.id);
        setFormState({
            term: question.term,
            choiceA: question.choiceA,
            choiceB: question.choiceB,
            choiceC: question.choiceC,
            choiceD: question.choiceD,
            correctIndex: question.correctIndex,
        });
        setError(null);
        setSuccess(null);
    };

    const handleDelete = async (question: Question) => {
        if (!window.confirm(`Delete “${question.term}”?`)) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            await deleteQuestion(question.id);
            setSuccess("Question deleted.");
            await loadQuestions(selectedDeckId ?? 0);
        } catch {
            setError("Unable to delete the question right now.");
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.2),_transparent_25%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_24%),linear-gradient(135deg,_#f8fcff_0%,_#f5fbf7_45%,_#faf6ff_100%)] px-4 py-6 text-slate-700 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_70px_-25px_rgba(15,23,42,0.28)] backdrop-blur sm:flex-row sm:items-end sm:justify-between sm:p-8">
                    <div>
                        <p className="mb-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                            Question manager
                        </p>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Shape the questions inside each deck.
                        </h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-600">
                            Switch decks, add fresh prompts, and keep every answer set polished and ready to play.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/decks" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                            Decks
                        </Link>
                        <Link to="/host" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                            Host view
                        </Link>
                    </div>
                </header>

                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <section className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_70px_-25px_rgba(15,23,42,0.26)] backdrop-blur sm:p-8">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Deck selection</p>
                                <h2 className="text-2xl font-bold text-slate-900">Choose a deck</h2>
                            </div>
                        </div>

                        <select
                            value={selectedDeckId ?? ""}
                            onChange={(event) => setSelectedDeckId(Number(event.target.value))}
                            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                        >
                            {decks.length === 0 ? (
                                <option value="">No decks yet</option>
                            ) : (
                                decks.map((deck) => (
                                    <option key={deck.id} value={deck.id}>
                                        {deck.name} • {getLevelLabel(deck.level)}
                                    </option>
                                ))
                            )}
                        </select>

                        {selectedDeck ? (
                            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                                <p className="font-semibold text-slate-900">{selectedDeck.name}</p>
                                <p className="mt-1">{getLevelLabel(selectedDeck.level)} • {questions.length} questions</p>
                            </div>
                        ) : null}

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
                                <label className="block text-sm font-semibold text-slate-700" htmlFor="question-term">
                                    Question term
                                </label>
                                <input
                                    id="question-term"
                                    value={formState.term}
                                    onChange={(event) => setFormState((current) => ({ ...current, term: event.target.value }))}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                                    placeholder="What does this word mean?"
                                />
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { key: "choiceA", label: "Choice A" },
                                    { key: "choiceB", label: "Choice B" },
                                    { key: "choiceC", label: "Choice C" },
                                    { key: "choiceD", label: "Choice D" },
                                ].map((choice) => (
                                    <div key={choice.key}>
                                        <label className="block text-sm font-semibold text-slate-700" htmlFor={choice.key}>
                                            {choice.label}
                                        </label>
                                        <input
                                            id={choice.key}
                                            value={formState[choice.key as keyof CreateQuestionPayload] as string}
                                            onChange={(event) => setFormState((current) => ({ ...current, [choice.key]: event.target.value }))}
                                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700" htmlFor="correct-index">
                                    Correct answer
                                </label>
                                <select
                                    id="correct-index"
                                    value={formState.correctIndex}
                                    onChange={(event) => setFormState((current) => ({ ...current, correctIndex: Number(event.target.value) }))}
                                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white"
                                >
                                    <option value={0}>A</option>
                                    <option value={1}>B</option>
                                    <option value={2}>C</option>
                                    <option value={3}>D</option>
                                </select>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedDeckId}
                                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-5 py-3 font-semibold text-white shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? "Saving..." : editingId === null ? "Create question" : "Save changes"}
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
                                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Questions</p>
                                <h2 className="text-2xl font-bold text-slate-900">Current deck</h2>
                            </div>
                            <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                                {questions.length} questions
                            </div>
                        </div>

                        {!selectedDeck ? (
                            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
                                Create a deck first, then add questions to it.
                            </div>
                        ) : loading ? (
                            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
                                Loading questions...
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
                                No questions yet for this deck.
                            </div>
                        ) : (
                            <div className="mt-6 space-y-3">
                                {questions.map((question) => (
                                    <div key={question.id} className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{question.term}</h3>
                                                <p className="mt-2 text-sm text-slate-600">
                                                    A. {question.choiceA} • B. {question.choiceB}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    C. {question.choiceC} • D. {question.choiceD}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                                                Correct: {['A', 'B', 'C', 'D'][question.correctIndex]}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(question)}
                                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(question)}
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
