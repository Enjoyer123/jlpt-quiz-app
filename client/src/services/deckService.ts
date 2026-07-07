import { fetchJson, postJson } from "./apiClient";

export interface Deck {
    id: number;
    name: string;
    level: number;
    createdAt: string;
}

export interface DeckDetail extends Deck {
    questions: Question[];
}

export interface DeckSummary extends Deck {
    questionCount: number;
}

export interface Question {
    id: number;
    term: string;
    choiceA: string;
    choiceB: string;
    choiceC: string;
    choiceD: string;
    correctIndex: number;
    deckId: number;
}

export interface CreateDeckPayload {
    name: string;
    level: number;
}

export interface UpdateDeckPayload extends CreateDeckPayload {}

export const levelOptions = [
    { value: 0, label: "N5" },
    { value: 1, label: "N4" },
    { value: 2, label: "N3" },
    { value: 3, label: "N2" },
    { value: 4, label: "N1" },
] as const;

export function getLevelLabel(level: number): string {
    return levelOptions.find((option) => option.value === level)?.label ?? `Level ${level}`;
}

export function getLevelOptions() {
    return levelOptions;
}

export async function getDecks(): Promise<Deck[]> {
    return fetchJson<Deck[]>("/api/decks");
}

export async function getDeck(id: number): Promise<DeckDetail> {
    return fetchJson<DeckDetail>(`/api/decks/${id}`);
}

export async function getDeckSummaries(): Promise<DeckSummary[]> {
    const decks = await getDecks();

    return Promise.all(
        decks.map(async (deck) => {
            const detail = await getDeck(deck.id);
            return {
                ...deck,
                questionCount: detail.questions.length,
            };
        })
    );
}

export async function createDeck(payload: CreateDeckPayload): Promise<Deck> {
    return postJson<Deck>("/api/decks", payload);
}

export async function updateDeck(id: number, payload: UpdateDeckPayload): Promise<void> {
    await fetchJson<void>(`/api/decks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteDeck(id: number): Promise<void> {
    await fetchJson<void>(`/api/decks/${id}`, {
        method: "DELETE",
    });
}
