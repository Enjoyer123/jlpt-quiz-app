using JlptLiveQuiz.Api.Dtos;
using JlptLiveQuiz.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JlptLiveQuiz.Api.Endpoints;

public static class DeckEndpoints
{
    public static void MapDeckEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/decks").RequireAuthorization();

        group.MapGet("/", async (AppDbContext db, string? level) =>
        {
            var query = db.Decks.AsQueryable();

            if (!string.IsNullOrEmpty(level) && Enum.TryParse<JlptLevel>(level, ignoreCase: true, out var parsedLevel))
                query = query.Where(d => d.Level == parsedLevel);

            var decks = await query.ToListAsync();
            return Results.Ok(decks.Select(d => d.ToDto()));
        });


        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            var deck = await db.Decks.FindAsync(id);
            if (deck is null) return Results.NotFound();

            var questions = await db.Questions
                .Where(q => q.DeckId == id)
                .Select(q => q.ToDto())
                .ToListAsync();

            return Results.Ok(deck.ToDetailDto(questions));
        });

        group.MapPost("/", async (CreateDeckDto dto, AppDbContext db) =>
        {
            var deck = dto.ToEntity();
            db.Decks.Add(deck);
            await db.SaveChangesAsync();
            return Results.Created($"/api/decks/{deck.Id}", deck.ToDto());
        });

        group.MapPut("/{id:int}", async (int id, UpdateDeckDto dto, AppDbContext db) =>
        {
            var deck = await db.Decks.FindAsync(id);
            if (deck is null) return Results.NotFound();

            deck.Name = dto.Name;
            deck.Level = dto.Level;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var deck = await db.Decks.FindAsync(id);
            if (deck is null) return Results.NotFound();

            db.Decks.Remove(deck);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}