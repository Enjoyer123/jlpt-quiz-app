import { fetchJson } from "./apiClient";

export interface GameHistoryDto {
    id: number;
    roomCode: string;
    deckId: number;
    playedAt: string;
    totalQuestions: number;
    playerCount: number;
}

export interface PlayerResultDto {
    nickname: string;
    totalScore: number;
    rank: number;
}

export interface GameHistoryDetailDto {
    id: number;
    roomCode: string;
    deckId: number;
    playedAt: string;
    totalQuestions: number;
    playerResults: PlayerResultDto[];
}

export async function getHistory(page = 1): Promise<GameHistoryDto[]> {
    return fetchJson<GameHistoryDto[]>(`/api/history?page=${page}`, { method: "GET" });
}

export async function getHistoryDetail(roomCode: string): Promise<GameHistoryDetailDto> {
    return fetchJson<GameHistoryDetailDto>(`/api/history/${encodeURIComponent(roomCode)}`, { method: "GET" });
}
