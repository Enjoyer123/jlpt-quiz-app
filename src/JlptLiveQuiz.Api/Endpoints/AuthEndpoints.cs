using BCrypt.Net;
using JlptLiveQuiz.Api.Dtos;
using JlptLiveQuiz.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace JlptLiveQuiz.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/register", async (RegisterDto dto, AppDbContext db) =>
        {
            var exists = await db.Users.AnyAsync(u => u.Email == dto.Email);
            if (exists) return Results.BadRequest("Email นี้ถูกใช้งานแล้ว");

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Ok("Register สำเร็จ");
        });

        group.MapPost("/login", async (LoginDto dto, AppDbContext db, IConfiguration config, HttpContext http) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user is null) return Results.Unauthorized();

            var isValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!isValid) return Results.Unauthorized();

            var token = GenerateToken(user, config);

            // Set HttpOnly cookie แทนส่ง token กลับมา
            http.Response.Cookies.Append("jwt", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // true ตอน production
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(7)
            });

            return Results.Ok(new { email = user.Email });
        });

        // เพิ่ม logout endpoint
        group.MapPost("/logout", (HttpContext http) =>
        {
            http.Response.Cookies.Delete("jwt");
            return Results.Ok();
        });
    }

    private static string GenerateToken(User user, IConfiguration config)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}