using Microsoft.AspNetCore.SignalR;

namespace JlptLiveQuiz.Api.Hubs;

public class GameHub : Hub
{
    private readonly RoomManager _roomManager;

    public GameHub(RoomManager roomManager)
    {
        _roomManager = roomManager;
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
}