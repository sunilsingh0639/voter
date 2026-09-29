using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VotingInfo.Application.DTOs;
using VotingInfo.Application.Interfaces;
using VotingInfo.Domain.Constants;
using VotingInfo.Infrastructure.Data;

namespace VotingInfo.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _db;
        private readonly IJwtService _jwt;
        private readonly IAuditService _audit;

        public AuthService(AppDbContext db, IJwtService jwt, IAuditService audit)
        { _db = db; _jwt = jwt; _audit = audit; }

        public async Task<LoginResponse> LoginAsync(LoginRequest req, string ipAddress)
        {
            var user = await _db.Users.IgnoreQueryFilters()
                .Include(u => u.UserWards).ThenInclude(uw => uw.Ward)
                .FirstOrDefaultAsync(u => u.Username == req.Username && !u.IsDeleted);

            if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid credentials");
            if (user.Status == UserStatus.Blocked)
                throw new UnauthorizedAccessException("Account is blocked");
            if (user.Status == UserStatus.Inactive)
                throw new UnauthorizedAccessException("Account is inactive");

            var permissions = user.Role switch
            {
                Roles.SuperAdmin => Permissions.SuperAdminPermissions.ToList(),
                Roles.Admin => Permissions.AdminPermissions.ToList(),
                _ => Permissions.WardAdminPermissions.ToList()
            };

            var dto = MapToDto(user, permissions);
            var token = _jwt.GenerateToken(dto);
            var refresh = _jwt.GenerateRefreshToken();
            user.RefreshToken = refresh;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _db.SaveChangesAsync();
            await _audit.LogAsync(user.Id, AuditActions.Login, "User", user.Id.ToString(), $"User {user.Username} logged in", ipAddress);
            return new LoginResponse { Token = token, RefreshToken = refresh, User = dto };
        }

        public async Task<(string token, string refreshToken)> RefreshTokenAsync(string refreshToken)
        {
            var user = await _db.Users.IgnoreQueryFilters()
                .Include(u => u.UserWards).ThenInclude(uw => uw.Ward)
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && !u.IsDeleted);

            if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
                throw new UnauthorizedAccessException("Invalid refresh token");
            if (user.Status != UserStatus.Active)
                throw new UnauthorizedAccessException("Account is not active");

            var permissions = user.Role switch
            {
                Roles.SuperAdmin => Permissions.SuperAdminPermissions.ToList(),
                Roles.Admin => Permissions.AdminPermissions.ToList(),
                _ => Permissions.WardAdminPermissions.ToList()
            };
            var dto = MapToDto(user, permissions);
            var newToken = _jwt.GenerateToken(dto);
            var newRefresh = _jwt.GenerateRefreshToken();
            user.RefreshToken = newRefresh;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            await _db.SaveChangesAsync();
            return (newToken, newRefresh);
        }

        public async Task LogoutAsync(Guid userId)
        {
            var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                await _db.SaveChangesAsync();
                await _audit.LogAsync(userId, AuditActions.Logout, "User", userId.ToString(), $"User {user.Username} logged out");
            }
        }

        public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest req)
        {
            var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new Exception("User not found");
            if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
                throw new UnauthorizedAccessException("Current password is incorrect");
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _audit.LogAsync(userId, AuditActions.PasswordChanged, "User", userId.ToString(), "Password changed");
        }

        public async Task ResetPasswordAsync(Guid userId, string newPassword)
        {
            var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId)
                ?? throw new Exception("User not found");
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _audit.LogAsync(userId, AuditActions.PasswordReset, "User", userId.ToString(), $"Password reset for {user.Username}");
        }

        private static UserDto MapToDto(Domain.Entities.User user, System.Collections.Generic.List<string> permissions) => new()
        {
            Id = user.Id, Name = user.Name, Username = user.Username, Email = user.Email,
            Mobile = user.Mobile, Role = user.Role, Status = user.Status, Permissions = permissions,
            AssignedWards = user.UserWards.Select(uw => new WardDto
            {
                Id = uw.Ward.Id, WardNumber = uw.Ward.WardNumber,
                WardNameHindi = uw.Ward.WardNameHindi, WardNameEnglish = uw.Ward.WardNameEnglish,
                Status = uw.Ward.Status
            }).ToList(),
            CreatedAt = user.CreatedAt
        };
    }
}
