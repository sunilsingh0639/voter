using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VotingInfo.Application.DTOs;
using VotingInfo.Application.Interfaces;
using VotingInfo.Domain.Constants;
using VotingInfo.Domain.Entities;
using VotingInfo.Infrastructure.Data;

namespace VotingInfo.Infrastructure.Services
{
    public class AuditService : IAuditService
    {
        private readonly AppDbContext _db;
        public AuditService(AppDbContext db) => _db = db;

        public async Task LogAsync(Guid? userId, string action, string entityType, string? entityId, string description, string? ipAddress = null)
        {
            _db.AuditLogs.Add(new AuditLog
            {
                UserId = userId, Action = action, EntityType = entityType,
                EntityId = entityId, Description = description, IpAddress = ipAddress
            });
            await _db.SaveChangesAsync();
        }

        public async Task<PaginatedResult<AuditLogDto>> GetAllAsync(AuditLogQueryParams p)
        {
            var q = _db.AuditLogs.Include(a => a.User).AsNoTracking().AsQueryable();
            if (!string.IsNullOrEmpty(p.Search))
                q = q.Where(a => a.Action.Contains(p.Search) || a.Description.Contains(p.Search) || (a.User != null && a.User.Username.Contains(p.Search)));
            var total = await q.CountAsync();
            var items = await q.OrderByDescending(a => a.CreatedAt)
                .Skip((p.Page - 1) * p.PageSize).Take(p.PageSize)
                .Select(a => new AuditLogDto
                {
                    Id = a.Id, UserId = a.UserId, UserName = a.User != null ? a.User.Username : null,
                    Action = a.Action, EntityType = a.EntityType, EntityId = a.EntityId,
                    Description = a.Description, IpAddress = a.IpAddress, CreatedAt = a.CreatedAt
                }).ToListAsync();
            return new PaginatedResult<AuditLogDto> { Items = items, Page = p.Page, PageSize = p.PageSize, TotalCount = total };
        }
    }

    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;
        public UserService(AppDbContext db, IAuditService audit) { _db = db; _audit = audit; }

        public async Task<PaginatedResult<UserDto>> GetAllAsync(UserQueryParams p, Guid requestingUserId)
        {
            var q = _db.Users.IgnoreQueryFilters()
                .Include(u => u.UserWards).ThenInclude(uw => uw.Ward)
                .Where(u => !u.IsDeleted).AsNoTracking().AsQueryable();
            if (!string.IsNullOrEmpty(p.Role)) q = q.Where(u => u.Role == p.Role);
            if (!string.IsNullOrEmpty(p.Status)) q = q.Where(u => u.Status == p.Status);
            if (!string.IsNullOrEmpty(p.Search))
                q = q.Where(u => u.Name.Contains(p.Search) || u.Username.Contains(p.Search) || u.Mobile.Contains(p.Search));
            var total = await q.CountAsync();
            var items = await q.OrderBy(u => u.Name).Skip((p.Page - 1) * p.PageSize).Take(p.PageSize).ToListAsync();
            return new PaginatedResult<UserDto> { Items = items.Select(MapToDto).ToList(), Page = p.Page, PageSize = p.PageSize, TotalCount = total };
        }

        public async Task<UserDto> GetByIdAsync(Guid id)
        {
            var user = await _db.Users.IgnoreQueryFilters()
                .Include(u => u.UserWards).ThenInclude(uw => uw.Ward)
                .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted)
                ?? throw new Exception("User not found");
            return MapToDto(user);
        }

        public async Task<UserDto> CreateAsync(CreateUserRequest req, Guid createdBy)
        {
            if (await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == req.Username))
                throw new Exception("Username already exists");
            var user = new User
            {
                Name = req.Name, Username = req.Username, Email = req.Email,
                Mobile = req.Mobile, Role = req.Role, Status = req.Status,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            foreach (var wid in req.WardIds)
                _db.UserWards.Add(new UserWard { UserId = user.Id, WardId = wid });
            await _db.SaveChangesAsync();
            await _audit.LogAsync(createdBy, AuditActions.UserCreated, "User", user.Id.ToString(), $"Created user {user.Username}");
            return await GetByIdAsync(user.Id);
        }

        public async Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest req, Guid updatedBy)
        {
            var user = await _db.Users.IgnoreQueryFilters()
                .Include(u => u.UserWards)
                .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted)
                ?? throw new Exception("User not found");
            user.Name = req.Name; user.Email = req.Email; user.Mobile = req.Mobile;
            user.Status = req.Status; user.UpdatedAt = DateTime.UtcNow;
            _db.UserWards.RemoveRange(user.UserWards);
            foreach (var wid in req.WardIds)
                _db.UserWards.Add(new UserWard { UserId = user.Id, WardId = wid });
            await _db.SaveChangesAsync();
            await _audit.LogAsync(updatedBy, AuditActions.UserUpdated, "User", id.ToString(), $"Updated user {user.Username}");
            return await GetByIdAsync(id);
        }

        public async Task UpdateStatusAsync(Guid id, string status, Guid updatedBy)
        {
            var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted)
                ?? throw new Exception("User not found");
            user.Status = status; user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            var action = status == UserStatus.Blocked ? AuditActions.UserBlocked : AuditActions.UserEnabled;
            await _audit.LogAsync(updatedBy, action, "User", id.ToString(), $"User {user.Username} status changed to {status}");
        }

        public async Task DeleteAsync(Guid id, Guid deletedBy)
        {
            var user = await _db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == id)
                ?? throw new Exception("User not found");
            user.IsDeleted = true; user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task<UserDto> GetProfileAsync(Guid userId) => await GetByIdAsync(userId);

        private static UserDto MapToDto(User u) => new()
        {
            Id = u.Id, Name = u.Name, Username = u.Username, Email = u.Email, Mobile = u.Mobile,
            Role = u.Role, Status = u.Status, CreatedAt = u.CreatedAt,
            Permissions = u.Role switch
            {
                Roles.SuperAdmin => Permissions.SuperAdminPermissions.ToList(),
                Roles.Admin => Permissions.AdminPermissions.ToList(),
                _ => Permissions.WardAdminPermissions.ToList()
            },
            AssignedWards = u.UserWards.Select(uw => new WardDto
            {
                Id = uw.Ward.Id, WardNumber = uw.Ward.WardNumber,
                WardNameHindi = uw.Ward.WardNameHindi, WardNameEnglish = uw.Ward.WardNameEnglish,
                Status = uw.Ward.Status
            }).ToList()
        };
    }

    public class WardService : IWardService
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;
        public WardService(AppDbContext db, IAuditService audit) { _db = db; _audit = audit; }

        public async Task<PaginatedResult<WardDto>> GetAllAsync(WardQueryParams p, Guid? userId = null)
        {
            var q = _db.Wards.AsNoTracking().AsQueryable();
            if (!string.IsNullOrEmpty(p.Search))
                q = q.Where(w => w.WardNameHindi.Contains(p.Search) || w.WardNameEnglish.Contains(p.Search) || w.WardNumber.Contains(p.Search));
            if (!string.IsNullOrEmpty(p.Status)) q = q.Where(w => w.Status == p.Status);
            var total = await q.CountAsync();
            var items = await q.OrderBy(w => w.WardNumber).Skip((p.Page - 1) * p.PageSize).Take(p.PageSize)
                .Select(w => new WardDto
                {
                    Id = w.Id, WardNumber = w.WardNumber, WardNameHindi = w.WardNameHindi,
                    WardNameEnglish = w.WardNameEnglish, DescriptionHindi = w.DescriptionHindi,
                    DescriptionEnglish = w.DescriptionEnglish, Status = w.Status,
                    VoterCount = w.Voters.Count(v => !v.IsDeleted),
                    CreatedAt = w.CreatedAt, UpdatedAt = w.UpdatedAt
                }).ToListAsync();
            return new PaginatedResult<WardDto> { Items = items, Page = p.Page, PageSize = p.PageSize, TotalCount = total };
        }

        public async Task<WardDto> GetByIdAsync(Guid id)
        {
            var w = await _db.Wards.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new Exception("Ward not found");
            return new WardDto
            {
                Id = w.Id, WardNumber = w.WardNumber, WardNameHindi = w.WardNameHindi,
                WardNameEnglish = w.WardNameEnglish, DescriptionHindi = w.DescriptionHindi,
                DescriptionEnglish = w.DescriptionEnglish, Status = w.Status,
                CreatedAt = w.CreatedAt, UpdatedAt = w.UpdatedAt
            };
        }

        public async Task<WardDto> CreateAsync(CreateWardRequest req, Guid createdBy)
        {
            if (await _db.Wards.AnyAsync(w => w.WardNumber == req.WardNumber))
                throw new Exception("Ward number already exists");
            var ward = new Ward
            {
                WardNumber = req.WardNumber, WardNameHindi = req.WardNameHindi,
                WardNameEnglish = req.WardNameEnglish, DescriptionHindi = req.DescriptionHindi,
                DescriptionEnglish = req.DescriptionEnglish, Status = req.Status
            };
            _db.Wards.Add(ward);
            await _db.SaveChangesAsync();
            await _audit.LogAsync(createdBy, AuditActions.WardCreated, "Ward", ward.Id.ToString(), $"Created ward {ward.WardNumber}");
            return await GetByIdAsync(ward.Id);
        }

        public async Task<WardDto> UpdateAsync(Guid id, CreateWardRequest req, Guid updatedBy)
        {
            var ward = await _db.Wards.FirstOrDefaultAsync(w => w.Id == id)
                ?? throw new Exception("Ward not found");
            if (await _db.Wards.AnyAsync(w => w.WardNumber == req.WardNumber && w.Id != id))
                throw new Exception("Ward number already exists");
            ward.WardNumber = req.WardNumber; ward.WardNameHindi = req.WardNameHindi;
            ward.WardNameEnglish = req.WardNameEnglish; ward.DescriptionHindi = req.DescriptionHindi;
            ward.DescriptionEnglish = req.DescriptionEnglish; ward.Status = req.Status;
            ward.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _audit.LogAsync(updatedBy, AuditActions.WardUpdated, "Ward", id.ToString(), $"Updated ward {ward.WardNumber}");
            return await GetByIdAsync(id);
        }

        public async Task UpdateStatusAsync(Guid id, string status, Guid updatedBy)
        {
            var ward = await _db.Wards.FirstOrDefaultAsync(w => w.Id == id)
                ?? throw new Exception("Ward not found");
            ward.Status = status; ward.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id, Guid deletedBy)
        {
            var ward = await _db.Wards.FirstOrDefaultAsync(w => w.Id == id)
                ?? throw new Exception("Ward not found");
            ward.IsDeleted = true; ward.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }
}
