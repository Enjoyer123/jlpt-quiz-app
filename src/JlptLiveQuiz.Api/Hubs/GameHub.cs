using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
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

        // Check if the player has already answered
        var alreadyAnswered = room.CurrentAnswers.Any(a => a.ConnectionId == Context.ConnectionId);
        if (alreadyAnswered) return;

        var question = room.Questions[room.CurrentQuestionIndex];
        var isCorrect = selectedIndex == question.CorrectIndex;
        var answerTimeMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

        var answer = new PlayerAnswer
        {
            ConnectionId = Context.ConnectionId,
            SelectedIndex = selectedIndex,
            AnswerTimeMs = answerTimeMs,
            IsCorrect = isCorrect,
            PointsEarned = 0 // TODO: implement scoring logic
        };

        room.CurrentAnswers.Add(answer);

        // Tell everyone how many players have answered
        await Clients.Group(roomCode).SendAsync("PlayerAnswered", new
        {
            answeredCount = room.CurrentAnswers.Count,
            totalPlayers = room.Players.Count
        });

        // if everyone has answered, end the question immediately
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
            var finalLeaderboard = room.Players
                .OrderByDescending(p => p.TotalScore)
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
            if (answer.IsCorrect) player.TotalScore += 1000; // placeholder
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
}