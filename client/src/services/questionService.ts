import { fetchJson, postJson } from "./apiClient";

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

export interface CreateQuestionPayload {
    term: string;
    choiceA: string;
    choiceB: string;
    choiceC: string;
    choiceD: string;
    correctIndex: number;
}

export interface UpdateQuestionPayload extends CreateQuestionPayload {}

export async function createQuestion(deckId: number, payload: CreateQuestionPayload): Promise<Question> {
    return postJson<Question>(`/api/decks/${deckId}/questions`, payload);
}

export async function updateQuestion(id: number, payload: UpdateQuestionPayload): Promise<void> {
    await fetchJson<void>(`/api/questions/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });
}

export async function deleteQuestion(id: number): Promise<void> {
    await fetchJson<void>(`/api/questions/${id}`, {
        method: "DELETE",
    });
}
