using JlptLiveQuiz.Api.Dtos;
using Microsoft.EntityFrameworkCore;

namespace JlptLiveQuiz.Api.Endpoints;

public static class QuestionEndpoints
{
    public static void MapQuestionEndpoints(this WebApplication app)
    {
        app.MapPost("/api/decks/{deckId:int}/questions", async (int deckId, CreateQuestionDto dto, AppDbContext db) =>
        {
            var deckExists = await db.Decks.AnyAsync(d => d.Id == deckId);
            if (!deckExists) return Results.NotFound("Deck ไม่พบ");

            var question = dto.ToEntity(deckId);
            db.Questions.Add(question);
            await db.SaveChangesAsync();
            return Results.Created($"/api/questions/{question.Id}", question.ToDto());
        }).RequireAuthorization();

        var group = app.MapGroup("/api/questions").RequireAuthorization();

        group.MapPut("/{id:int}", async (int id, UpdateQuestionDto dto, AppDbContext db) =>
        {
            var question = await db.Questions.FindAsync(id);
            if (question is null) return Results.NotFound();

            question.Term = dto.Term;
            question.ChoiceA = dto.ChoiceA;
            question.ChoiceB = dto.ChoiceB;
            question.ChoiceC = dto.ChoiceC;
            question.ChoiceD = dto.ChoiceD;
            question.CorrectIndex = dto.CorrectIndex;
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var question = await db.Questions.FindAsync(id);
            if (question is null) return Results.NotFound();

            db.Questions.Remove(question);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}