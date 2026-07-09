namespace JlptLiveQuiz.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Deck> Decks { get; set; } = new List<Deck>();
    public ICollection<GameHistory> GameHistories { get; set; } = new List<GameHistory>();
}