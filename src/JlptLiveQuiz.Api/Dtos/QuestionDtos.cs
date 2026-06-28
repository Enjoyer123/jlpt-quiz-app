using JlptLiveQuiz.Api.Models;

namespace JlptLiveQuiz.Api.Dtos;

public record QuestionDto(
    int Id, string Term,
    string ChoiceA, string ChoiceB, string ChoiceC, string ChoiceD,
    int CorrectIndex, int DeckId);

public record CreateQuestionDto(
    string Term,
    string ChoiceA, string ChoiceB, string ChoiceC, string ChoiceD,
    int CorrectIndex);

public record UpdateQuestionDto(
    string Term,
    string ChoiceA, string ChoiceB, string ChoiceC, string ChoiceD,
    int CorrectIndex);

public static class QuestionMapping
{
    public static QuestionDto ToDto(this Question q) =>
        new(q.Id, q.Term, q.ChoiceA, q.ChoiceB, q.ChoiceC, q.ChoiceD, q.CorrectIndex, q.DeckId);

    public static Question ToEntity(this CreateQuestionDto dto, int deckId) =>
        new()
        {
            Term = dto.Term,
            ChoiceA = dto.ChoiceA, ChoiceB = dto.ChoiceB,
            ChoiceC = dto.ChoiceC, ChoiceD = dto.ChoiceD,
            CorrectIndex = dto.CorrectIndex,
            DeckId = deckId
        };
}