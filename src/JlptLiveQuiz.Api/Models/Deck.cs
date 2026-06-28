namespace JlptLiveQuiz.Api.Models;

public enum JlptLevel
{
    N5,
    N4,
    N3,
    N2,
    N1
}

public class Deck
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public JlptLevel Level { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}