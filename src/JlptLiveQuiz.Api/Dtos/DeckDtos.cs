using JlptLiveQuiz.Api.Models;

namespace JlptLiveQuiz.Api.Dtos;

public record DeckDto(int Id, string Name, JlptLevel Level, DateTime CreatedAt);

public record CreateDeckDto(string Name, JlptLevel Level);

public record UpdateDeckDto(string Name, JlptLevel Level);

public static class DeckMapping
{
    public static DeckDto ToDto(this Deck deck) =>
        new(deck.Id, deck.Name, deck.Level, deck.CreatedAt);

    public static Deck ToEntity(this CreateDeckDto dto) =>
        new() { Name = dto.Name, Level = dto.Level };
}