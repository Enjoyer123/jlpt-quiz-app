using JlptLiveQuiz.Api.Models;

namespace JlptLiveQuiz.Api;

public enum RoomStatus
{
    Lobby,
    InProgress,
    Finished
}

public class PlayerState
{
    public string ConnectionId { get; set; } = string.Empty;
    public string Nickname { get; set; } = string.Empty;
    public int TotalScore { get; set; } = 0;
}

public class RoomState
{
    public string RoomCode { get; set; } = string.Empty;
    public string HostConnectionId { get; set; } = string.Empty;
    public int DeckId { get; set; }
    public RoomStatus Status { get; set; } = RoomStatus.Lobby;
    public List<PlayerState> Players { get; set; } = new();

    public List<Question> Questions { get; set; } = new();
    public int CurrentQuestionIndex { get; set; } = 0;
    public int CurrentQuestionId { get; set; } = 0;
    public List<PlayerAnswer> CurrentAnswers { get; set; } = new();
}

public class PlayerAnswer
{
    public string ConnectionId { get; set; } = string.Empty;
    public int SelectedIndex { get; set; }
    public long AnswerTimeMs { get; set; }
    public bool IsCorrect { get; set; }
    public int PointsEarned { get; set; }
}