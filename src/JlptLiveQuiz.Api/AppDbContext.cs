using Microsoft.EntityFrameworkCore;
using JlptLiveQuiz.Api.Models;

namespace JlptLiveQuiz.Api;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Deck> Decks { get; set; }
    public DbSet<Question> Questions { get; set; }
}