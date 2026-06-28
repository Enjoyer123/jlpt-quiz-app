namespace JlptLiveQuiz.Api.Models;

public class Question
{
    public int Id { get; set; }
    public string Term { get; set; } = string.Empty;
    public string ChoiceA { get; set; } = string.Empty;
    public string ChoiceB { get; set; } = string.Empty;
    public string ChoiceC { get; set; } = string.Empty;
    public string ChoiceD { get; set; } = string.Empty;
    public int CorrectIndex { get; set; } // 0=A, 1=B, 2=C, 3=D

    public int DeckId { get; set; }
    public Deck? Deck { get; set; }
}