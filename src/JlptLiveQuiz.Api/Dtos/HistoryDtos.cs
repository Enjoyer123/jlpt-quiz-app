namespace JlptLiveQuiz.Api.Dtos;

public record PlayerResultDto(string Nickname, int TotalScore, int Rank);

public record GameHistoryDto(
    int Id,
    string RoomCode,
    int DeckId,
    DateTime PlayedAt,
    int TotalQuestions,
    int PlayerCount
);

public record GameHistoryDetailDto(
    int Id,
    string RoomCode,
    int DeckId,
    DateTime PlayedAt,
    int TotalQuestions,
    List<PlayerResultDto> PlayerResults
);