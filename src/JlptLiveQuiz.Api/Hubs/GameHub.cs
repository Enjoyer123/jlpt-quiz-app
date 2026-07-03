using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using JlptLiveQuiz.Api.Models;
namespace JlptLiveQuiz.Api.Hubs;

public class GameHub : Hub
{
    private readonly RoomManager _roomManager;
    private readonly AppDbContext _dbContext;

    public GameHub(RoomManager roomManager, AppDbContext dbContext)
    {
        _roomManager = roomManager;
        _dbContext = dbContext;
    }

    public async Task CreateRoom(int deckId)
    {
        var room = _roomManager.CreateRoom(Context.ConnectionId, deckId);
        await Groups.AddToGroupAsync(Context.ConnectionId, room.RoomCode);
        await Clients.Caller.SendAsync("RoomCreated", room.RoomCode);
    }

    public async Task JoinRoom(string roomCode, string nickname)
    {
        var player = new PlayerState
        {
            ConnectionId = Context.ConnectionId,
            Nickname = nickname
        };

        var success = _roomManager.AddPlayer(roomCode, player);
        if (!success)
        {
            await Clients.Caller.SendAsync("ErrorOccurred", "ไม่พบห้องหรือเกมเริ่มไปแล้ว");
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);

        var room = _roomManager.GetRoom(roomCode);
        var playerNames = room!.Players.Select(p => p.Nickname).ToList();
        await Clients.Group(roomCode).SendAsync("PlayerJoined", playerNames);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }

    public async Task StartGame(string roomCode)
    {
        var room = _roomManager.GetRoom(roomCode);
        if (room is null) return;
        if (room.HostConnectionId != Context.ConnectionId) return;
        if (room.Status != RoomStatus.Lobby) return;

        // load all questions from the deck at once
        var questions = await _dbContext.Questions
            .Where(q => q.DeckId == room.DeckId)
            .ToListAsync();

        if (questions.Count == 0) return;

        room.Status = RoomStatus.InProgress;
        room.Questions = questions;
        room.CurrentQuestionIndex = 0;

        await SendQuestion(room);
    }

    private async Task SendQuestion(RoomState room)
    {
        var question = room.Questions[room.CurrentQuestionIndex];
        room.CurrentQuestionId = question.Id;
        room.CurrentAnswers = new List<PlayerAnswer>();

        room.QuestionStartTimeMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        await Clients.Group(room.RoomCode).SendAsync("QuestionStarted", new
        {
            questionId = question.Id,
            term = question.Term,
            choices = new[] { question.ChoiceA, question.ChoiceB, question.ChoiceC, question.ChoiceD },
            questionIndex = room.CurrentQuestionIndex,
            totalQuestions = room.Questions.Count,
            timeLimit = 20
        });
    }

    public async Task SubmitAnswer(string roomCode, int questionId, int selectedIndex)
    {
        var room = _roomManager.GetRoom(roomCode);
        if (room is null || room.Status != RoomStatus.InProgress) return;
        if (room.CurrentQuestionId != questionId) return;

        var question = room.Questions[room.CurrentQuestionIndex];
        var isCorrect = selectedIndex == question.CorrectIndex;
        var answerTimeMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        var player = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
        if (player is null) return;

        bool shouldContinue;

        lock (room.Lock)
        {
            var alreadyAnswered = room.CurrentAnswers.Any(a => a.ConnectionId == Context.ConnectionId);
            if (alreadyAnswered)
            {
                shouldContinue = false;
            }
            else
            {
                // Update streak and calculate points inside lock to prevent race condition
                if (isCorrect) player.Streak++;
                else player.Streak = 0;

                var points = CalculatePoints(
                    isCorrect,
                    answerTimeMs,
                    room.QuestionStartTimeMs,
                    20,
                    player.Streak
                );

                var answer = new PlayerAnswer
                {
                    ConnectionId = Context.ConnectionId,
                    SelectedIndex = selectedIndex,
                    AnswerTimeMs = answerTimeMs,
                    IsCorrect = isCorrect,
                    PointsEarned = points
                };

                room.CurrentAnswers.Add(answer);
                shouldContinue = true;
            }
        }

        // If already answered, stop here
        if (!shouldContinue) return;

        // Notify everyone how many players have answered
        await Clients.Group(roomCode).SendAsync("PlayerAnswered", new
        {
            answeredCount = room.CurrentAnswers.Count,
            totalPlayers = room.Players.Count
        });

        // If all players have answered, end the question immediately
        if (room.CurrentAnswers.Count >= room.Players.Count)
        {
            await EndQuestion(room);
        }
    }

    public async Task NextQuestion(string roomCode)
    {
        var room = _roomManager.GetRoom(roomCode);
        if (room is null) return;
        if (room.HostConnectionId != Context.ConnectionId) return;

        room.CurrentQuestionIndex++;

        if (room.CurrentQuestionIndex >= room.Questions.Count)
        {
            // finish the game
            room.Status = RoomStatus.Finished;

            var rankedPlayers = room.Players
                .OrderByDescending(p => p.TotalScore)
                .ToList();

            // Persist ลง database
            var gameHistory = new GameHistory
            {
                RoomCode = room.RoomCode,
                DeckId = room.DeckId,
                PlayedAt = DateTime.UtcNow,
                TotalQuestions = room.Questions.Count,
                PlayerResults = rankedPlayers.Select((p, index) => new PlayerResult
                {
                    Nickname = p.Nickname,
                    TotalScore = p.TotalScore,
                    Rank = index + 1
                }).ToList()
            };

            _dbContext.GameHistories.Add(gameHistory);
            await _dbContext.SaveChangesAsync();

            var finalLeaderboard = rankedPlayers
                .Select(p => new { nickname = p.Nickname, score = p.TotalScore });

            await Clients.Group(roomCode).SendAsync("GameEnded", finalLeaderboard);
            return;
        }

        await SendQuestion(room);
    }

    private async Task EndQuestion(RoomState room)
    {
        var question = room.Questions[room.CurrentQuestionIndex];

        // update player scores based on answers
        foreach (var answer in room.CurrentAnswers)
        {
            var player = room.Players.FirstOrDefault(p => p.ConnectionId == answer.ConnectionId);
            if (player is null) continue;
            player.TotalScore += answer.PointsEarned;
        }

        var leaderboard = room.Players
            .OrderByDescending(p => p.TotalScore)
            .Select(p => new { nickname = p.Nickname, score = p.TotalScore });

        await Clients.Group(room.RoomCode).SendAsync("QuestionEnded", new
        {
            correctIndex = question.CorrectIndex,
            leaderboard
        });
    }

    private int CalculatePoints(bool isCorrect, long answerTimeMs, long questionStartTimeMs, int timeLimit, int streak)
    {
        if (!isCorrect)
        {
            return 0;
        }

        // milliseconds → seconds
        var timeUsed = (answerTimeMs - questionStartTimeMs) / 1000.0;

        var basePoints = Math.Max(0, (timeLimit - timeUsed) / timeLimit * 1000);

        var streakBonus = (streak - 1) * 50;

        return (int)(basePoints + streakBonus);
    }
}