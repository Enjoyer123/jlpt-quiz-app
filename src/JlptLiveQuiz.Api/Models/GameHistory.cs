namespace JlptLiveQuiz.Api.Models;

public class GameHistory
{
    public int Id { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public int DeckId { get; set; }
    public DateTime PlayedAt { get; set; } = DateTime.UtcNow;
    public int TotalQuestions { get; set; }
    public int? UserId { get; set; }
    public User? User { get; set; }
    public ICollection<PlayerResult> PlayerResults { get; set; } = new List<PlayerResult>();
}

public class PlayerResult
{
    public int Id { get; set; }
    public string Nickname { get; set; } = string.Empty;
    public int TotalScore { get; set; }
    public int Rank { get; set; }
    public int GameHistoryId { get; set; }
    public GameHistory? GameHistory { get; set; }
}