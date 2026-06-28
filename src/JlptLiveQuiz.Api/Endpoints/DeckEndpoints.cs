using JlptLiveQuiz.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace JlptLiveQuiz.Api.Endpoints;

public static class DeckEndpoints
{
    public static void MapDeckEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/decks");

        group.MapGet("/", async (AppDbContext db) =>
        {
            var decks = await db.Decks.ToListAsync();
            return Results.Ok(decks.Select(d => d.ToDto()));
        });


        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
        {
            // สั่ง Include เพื่อหนีบเอา Questions ติดมาด้วย
            var deck = await db.Decks
                               .Include(d => d.Questions)
                               .FirstOrDefaultAsync(d => d.Id == id);

            return deck is null ? Results.NotFound() : Results.Ok(deck.ToDto());
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