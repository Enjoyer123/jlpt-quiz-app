using JlptLiveQuiz.Api.Dtos;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace JlptLiveQuiz.Api.Endpoints;

public static class HistoryEndpoints
{
    public static void MapHistoryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/history").RequireAuthorization();

        group.MapGet("/", async (HttpContext http, AppDbContext db, int page = 1) =>
        {
            var userId = int.Parse(http.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var pageSize = 10;

            var histories = await db.GameHistories
                .Where(h => h.UserId == userId)
                .OrderByDescending(h => h.PlayedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(h => new GameHistoryDto(
                    h.Id,
                    h.RoomCode,
                    h.DeckId,
                    h.PlayedAt,
                    h.TotalQuestions,
                    h.PlayerResults.Count
                ))
                .ToListAsync();

            return Results.Ok(histories);
        });

        group.MapGet("/{roomCode}", async (string roomCode, HttpContext http, AppDbContext db) =>
        {
            var userId = int.Parse(http.User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var history = await db.GameHistories
                .Include(h => h.PlayerResults)
                .FirstOrDefaultAsync(h => h.RoomCode == roomCode && h.UserId == userId);

            if (history is null) return Results.NotFound();

            var dto = new GameHistoryDetailDto(
                history.Id,
                history.RoomCode,
                history.DeckId,
                history.PlayedAt,
                history.TotalQuestions,
                history.PlayerResults
                    .OrderBy(p => p.Rank)
                    .Select(p => new PlayerResultDto(p.Nickname, p.TotalScore, p.Rank))
                    .ToList()
            );

            return Results.Ok(dto);
        });
    }
}