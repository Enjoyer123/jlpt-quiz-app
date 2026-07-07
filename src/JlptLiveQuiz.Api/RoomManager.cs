using System.Collections.Concurrent;

namespace JlptLiveQuiz.Api;

public class RoomManager
{
    private readonly ConcurrentDictionary<string, RoomState> _rooms = new();

    public RoomState CreateRoom(string hostConnectionId, int deckId)
    {
        var roomCode = GenerateRoomCode();
        var room = new RoomState
        {
            RoomCode = roomCode,
            HostConnectionId = hostConnectionId,
            DeckId = deckId,
            Status = RoomStatus.Lobby
        };
        _rooms[roomCode] = room;
        return room;
    }

    public RoomState? GetRoom(string roomCode) =>
        _rooms.TryGetValue(roomCode, out var room) ? room : null;

    public bool AddPlayer(string roomCode, PlayerState player)
    {
        var room = GetRoom(roomCode);
        if (room is null || room.Status != RoomStatus.Lobby) return false;
        lock (room.Lock)
        {
            room.Players.Add(player);
        }
        return true;
    }

    public void RemovePlayer(string roomCode, string connectionId)
    {
        var room = GetRoom(roomCode);
        if (room is null) return;
        lock (room.Lock)
        {
            room.Players.RemoveAll(p => p.ConnectionId == connectionId);
        }
    }

    public void RemoveRoom(string roomCode) =>
        _rooms.TryRemove(roomCode, out _);

    private static string GenerateRoomCode() =>
        Guid.NewGuid().ToString("N")[..6].ToUpper();
}