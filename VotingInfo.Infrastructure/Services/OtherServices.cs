using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using VotingInfo.Application.DTOs;
using VotingInfo.Application.Interfaces;
using VotingInfo.Domain.Constants;
using VotingInfo.Domain.Entities;
using VotingInfo.Infrastructure.Data;

namespace VotingInfo.Infrastructure.Services
{
    public class PublicService : IPublicService
    {
        private readonly AppDbContext _db;
        private readonly ISmsService _sms;
        private readonly IAuditService _audit;

        public PublicService(AppDbContext db, ISmsService sms, IAuditService audit)
        { _db = db; _sms = sms; _audit = audit; }

        public async Task<SubmitInterestResponse> SubmitInterestAsync(SubmitInterestRequest req, string ipAddress, string userAgent)
        {
            var option = await _db.InterestOptions.FindAsync(req.InterestOptionId)
                ?? throw new Exception("Interest option not found");

            // Check for existing active submission by session
            var existing = await _db.PublicInterestSubmissions
                .FirstOrDefaultAsync(s => s.SessionId == req.SessionId);

            if (existing != null)
            {
                existing.InterestOptionId = req.InterestOptionId;
                existing.Language = req.Language;
                existing.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
                return new SubmitInterestResponse { SubmissionId = existing.Id };
            }

            var submission = new PublicInterestSubmission
            {
                InterestOptionId = req.InterestOptionId,
                SessionId = req.SessionId,
                Language = req.Language,
                Source = req.Source,
                IpAddress = ipAddress,
                UserAgent = userAgent
            };
            _db.PublicInterestSubmissions.Add(submission);
            await _db.SaveChangesAsync();
            await _audit.LogAsync(null, AuditActions.PublicSubmission, "PublicInterestSubmission", submission.Id.ToString(), "Interest submitted");
            return new SubmitInterestResponse { SubmissionId = submission.Id };
        }

        public async Task SendOtpAsync(SendOtpRequest req)
        {
            var mobileRegex = new System.Text.RegularExpressions.Regex(@"^[6-9]\d{9}$");
            if (!mobileRegex.IsMatch(req.MobileNumber)) throw new Exception("Invalid mobile number");

            var submission = await _db.PublicInterestSubmissions.FindAsync(req.SubmissionId)
                ?? throw new Exception("Submission not found");

            // Rate limiting: max 3 resends
            if (submission.OtpResendCount >= 3) throw new Exception("Maximum OTP resend limit reached");
            if (submission.LastOtpSentAt.HasValue && (DateTime.UtcNow - submission.LastOtpSentAt.Value).TotalSeconds < 60)
                throw new Exception("Please wait before requesting another OTP");

            var otp = GenerateOtp();
            submission.MobileNumber = req.MobileNumber;
            submission.OtpHash = HashOtp(otp);
            submission.OtpExpiry = DateTime.UtcNow.AddMinutes(5);
            submission.OtpAttempts = 0;
            submission.OtpResendCount++;
            submission.LastOtpSentAt = DateTime.UtcNow;
            submission.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            await _sms.SendOtpAsync(req.MobileNumber, otp);
        }

        public async Task VerifyOtpAsync(VerifyOtpRequest req)
        {
            var submission = await _db.PublicInterestSubmissions.FindAsync(req.SubmissionId)
                ?? throw new Exception("Submission not found");

            if (submission.IsOtpVerified) throw new Exception("Already verified");
            if (submission.OtpAttempts >= 5) throw new Exception("Maximum OTP attempts exceeded");
            if (!submission.OtpExpiry.HasValue || submission.OtpExpiry < DateTime.UtcNow)
                throw new Exception("OTP has expired");

            submission.OtpAttempts++;
            if (submission.OtpHash != HashOtp(req.Otp))
            {
                await _db.SaveChangesAsync();
                throw new Exception("Invalid OTP");
            }

            submission.IsOtpVerified = true;
            submission.OtpVerifiedAt = DateTime.UtcNow;
            submission.OtpHash = null;
            submission.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        private static string GenerateOtp()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[4];
            rng.GetBytes(bytes);
            return (Math.Abs(BitConverter.ToInt32(bytes, 0)) % 900000 + 100000).ToString();
        }

        private static string HashOtp(string otp)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(otp));
            return Convert.ToHexString(bytes);
        }
    }

    public class InterestOptionService : IInterestOptionService
    {
        private readonly AppDbContext _db;
        private readonly IFileStorageService _storage;
        private readonly IAuditService _audit;

        public InterestOptionService(AppDbContext db, IFileStorageService storage, IAuditService audit)
        { _db = db; _storage = storage; _audit = audit; }

        public async Task<List<InterestOptionDto>> GetAllAsync(bool activeOnly = false)
        {
            var q = _db.InterestOptions.AsNoTracking().AsQueryable();
            if (activeOnly) q = q.Where(o => o.IsActive);
            return await q.OrderBy(o => o.DisplayOrder).Select(o => MapToDto(o)).ToListAsync();
        }

        public async Task<InterestOptionDto> CreateAsync(string nameHindi, string nameEnglish, int displayOrder, IFormFile? image)
        {
            var opt = new InterestOption { NameHindi = nameHindi, NameEnglish = nameEnglish, DisplayOrder = displayOrder };
            if (image != null) opt.ImageUrl = await _storage.SaveImageAsync(image, "interests");
            _db.InterestOptions.Add(opt);
            await _db.SaveChangesAsync();
            await _audit.LogAsync(null, AuditActions.InterestOptionCreated, "InterestOption", opt.Id.ToString(), $"Created option {nameHindi}");
            return MapToDto(opt);
        }

        public async Task<InterestOptionDto> UpdateAsync(Guid id, string nameHindi, string nameEnglish, int displayOrder, IFormFile? image)
        {
            var opt = await _db.InterestOptions.FindAsync(id) ?? throw new Exception("Option not found");
            opt.NameHindi = nameHindi; opt.NameEnglish = nameEnglish; opt.DisplayOrder = displayOrder;
            if (image != null)
            {
                if (!string.IsNullOrEmpty(opt.ImageUrl)) _storage.DeleteImage(opt.ImageUrl);
                opt.ImageUrl = await _storage.SaveImageAsync(image, "interests");
            }
            opt.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return MapToDto(opt);
        }

        public async Task UpdateStatusAsync(Guid id, bool isActive)
        {
            var opt = await _db.InterestOptions.FindAsync(id) ?? throw new Exception("Option not found");
            opt.IsActive = isActive; opt.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var opt = await _db.InterestOptions.FindAsync(id) ?? throw new Exception("Option not found");
            opt.IsDeleted = true; opt.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        private static InterestOptionDto MapToDto(InterestOption o) => new()
        {
            Id = o.Id, NameHindi = o.NameHindi, NameEnglish = o.NameEnglish,
            ImageUrl = o.ImageUrl, IsActive = o.IsActive, DisplayOrder = o.DisplayOrder, CreatedAt = o.CreatedAt
        };
    }

    public class SubmissionReportService : ISubmissionReportService
    {
        private readonly AppDbContext _db;
        public SubmissionReportService(AppDbContext db) => _db = db;

        public async Task<PaginatedResult<PublicSubmissionDto>> GetAllAsync(SubmissionQueryParams p, bool showFullMobile)
        {
            var q = _db.PublicInterestSubmissions.Include(s => s.InterestOption).AsNoTracking().AsQueryable();
            if (p.OtpVerified.HasValue) q = q.Where(s => s.IsOtpVerified == p.OtpVerified.Value);
            if (!string.IsNullOrEmpty(p.Language)) q = q.Where(s => s.Language == p.Language);
            if (p.From.HasValue) q = q.Where(s => s.CreatedAt >= p.From.Value);
            if (p.To.HasValue) q = q.Where(s => s.CreatedAt <= p.To.Value);

            var total = await q.CountAsync();
            var items = await q.OrderByDescending(s => s.CreatedAt)
                .Skip((p.Page - 1) * p.PageSize).Take(p.PageSize)
                .Select(s => new PublicSubmissionDto
                {
                    Id = s.Id, InterestOptionId = s.InterestOptionId,
                    InterestOption = s.InterestOption == null ? null : new InterestOptionDto { Id = s.InterestOption.Id, NameHindi = s.InterestOption.NameHindi, NameEnglish = s.InterestOption.NameEnglish },
                    MobileNumber = showFullMobile ? s.MobileNumber : null,
                    MaskedMobile = s.MobileNumber != null ? "******" + s.MobileNumber.Substring(Math.Max(0, s.MobileNumber.Length - 4)) : null,
                    IsOtpVerified = s.IsOtpVerified, OtpVerifiedAt = s.OtpVerifiedAt,
                    SessionId = s.SessionId, Language = s.Language, Source = s.Source,
                    Status = s.Status, CreatedAt = s.CreatedAt
                }).ToListAsync();
            return new PaginatedResult<PublicSubmissionDto> { Items = items, Page = p.Page, PageSize = p.PageSize, TotalCount = total };
        }

        public async Task<byte[]> ExportAsync(SubmissionQueryParams p)
        {
            p.Page = 1; p.PageSize = 100000;
            var result = await GetAllAsync(p, false);
            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("Submissions");
            ws.Cell(1, 1).Value = "Date"; ws.Cell(1, 2).Value = "Interest";
            ws.Cell(1, 3).Value = "Mobile (Masked)"; ws.Cell(1, 4).Value = "OTP Status";
            ws.Cell(1, 5).Value = "Language"; ws.Cell(1, 6).Value = "Source";
            int row = 2;
            foreach (var s in result.Items)
            {
                ws.Cell(row, 1).Value = s.CreatedAt.ToString("yyyy-MM-dd HH:mm");
                ws.Cell(row, 2).Value = s.InterestOption?.NameHindi;
                ws.Cell(row, 3).Value = s.MaskedMobile;
                ws.Cell(row, 4).Value = s.IsOtpVerified ? "Verified" : "Pending";
                ws.Cell(row, 5).Value = s.Language;
                ws.Cell(row, 6).Value = s.Source;
                row++;
            }
            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            return ms.ToArray();
        }
    }

    public class DashboardService : IDashboardService
    {
        private readonly AppDbContext _db;
        public DashboardService(AppDbContext db) => _db = db;

        public async Task<DashboardStatsDto> GetStatsAsync(Guid userId, string userRole, List<Guid> wardIds)
        {
            var voterQ = _db.Voters.AsNoTracking().AsQueryable();
            if (userRole != Roles.SuperAdmin) voterQ = voterQ.Where(v => wardIds.Contains(v.WardId));

            var stats = new DashboardStatsDto
            {
                TotalVoters = await voterQ.CountAsync(),
                ActiveVoters = await voterQ.CountAsync(v => v.Status == "Active"),
                InactiveVoters = await voterQ.CountAsync(v => v.Status == "Inactive"),
                MaleVoters = await voterQ.CountAsync(v => v.Gender == "Male"),
                FemaleVoters = await voterQ.CountAsync(v => v.Gender == "Female"),
                OtherVoters = await voterQ.CountAsync(v => v.Gender == "Other"),
            };

            if (userRole == Roles.SuperAdmin)
            {
                stats.TotalWards = await _db.Wards.CountAsync();
                stats.TotalAdmins = await _db.Users.CountAsync(u => u.Role == Roles.Admin);
                stats.TotalWardAdmins = await _db.Users.CountAsync(u => u.Role == Roles.WardAdmin);
                stats.TotalSubmissions = await _db.PublicInterestSubmissions.CountAsync();
                stats.VerifiedSubmissions = await _db.PublicInterestSubmissions.CountAsync(s => s.IsOtpVerified);
            }

            stats.WardWiseCount = await _db.Wards.AsNoTracking()
                .Select(w => new WardVoterCount { WardName = w.WardNameHindi, Count = w.Voters.Count(v => !v.IsDeleted) })
                .OrderByDescending(x => x.Count).Take(10).ToListAsync();

            stats.RecentImports = await _db.ImportHistories.AsNoTracking()
                .OrderByDescending(h => h.CreatedAt).Take(5)
                .Select(h => new ImportHistoryDto
                {
                    Id = h.Id, FileName = h.FileName, TotalRows = h.TotalRows,
                    Inserted = h.Inserted, Updated = h.Updated, ImportedAt = h.CreatedAt
                }).ToListAsync();

            return stats;
        }
    }

    public class ContentService : IContentService
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;
        public ContentService(AppDbContext db, IAuditService audit) { _db = db; _audit = audit; }

        public async Task<List<ContentItemDto>> GetAllAsync() =>
            await _db.ContentItems.AsNoTracking()
                .Select(c => new ContentItemDto { Id = c.Id, Key = c.Key, ValueHindi = c.ValueHindi, ValueEnglish = c.ValueEnglish, Type = c.Type, UpdatedAt = c.UpdatedAt })
                .ToListAsync();

        public async Task<ContentItemDto> UpdateAsync(Guid id, UpdateContentRequest req)
        {
            var item = await _db.ContentItems.FindAsync(id) ?? throw new Exception("Content not found");
            item.ValueHindi = req.ValueHindi; item.ValueEnglish = req.ValueEnglish; item.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _audit.LogAsync(null, AuditActions.ContentChanged, "ContentItem", id.ToString(), $"Updated content {item.Key}");
            return new ContentItemDto { Id = item.Id, Key = item.Key, ValueHindi = item.ValueHindi, ValueEnglish = item.ValueEnglish, Type = item.Type, UpdatedAt = item.UpdatedAt };
        }
    }

    public class GalleryService : IGalleryService
    {
        private readonly AppDbContext _db;
        private readonly IFileStorageService _storage;
        public GalleryService(AppDbContext db, IFileStorageService storage) { _db = db; _storage = storage; }

        public async Task<List<GalleryImageDto>> GetAllAsync(bool activeOnly = false)
        {
            var q = _db.GalleryImages.AsNoTracking().AsQueryable();
            if (activeOnly) q = q.Where(g => g.IsActive);
            return await q.OrderBy(g => g.DisplayOrder).Select(g => new GalleryImageDto
            {
                Id = g.Id, TitleHindi = g.TitleHindi, TitleEnglish = g.TitleEnglish,
                ImageUrl = g.ImageUrl, DisplayOrder = g.DisplayOrder, IsActive = g.IsActive
            }).ToListAsync();
        }

        public async Task<GalleryImageDto> CreateAsync(string titleHindi, string titleEnglish, IFormFile image)
        {
            var url = await _storage.SaveImageAsync(image, "gallery");
            var img = new GalleryImage { TitleHindi = titleHindi, TitleEnglish = titleEnglish, ImageUrl = url };
            _db.GalleryImages.Add(img);
            await _db.SaveChangesAsync();
            return new GalleryImageDto { Id = img.Id, TitleHindi = img.TitleHindi, TitleEnglish = img.TitleEnglish, ImageUrl = img.ImageUrl, DisplayOrder = img.DisplayOrder, IsActive = img.IsActive };
        }

        public async Task<GalleryImageDto> UpdateAsync(Guid id, string titleHindi, string titleEnglish, IFormFile? image)
        {
            var img = await _db.GalleryImages.FindAsync(id) ?? throw new Exception("Image not found");
            img.TitleHindi = titleHindi; img.TitleEnglish = titleEnglish; img.UpdatedAt = DateTime.UtcNow;
            if (image != null)
            {
                if (!string.IsNullOrEmpty(img.ImageUrl)) _storage.DeleteImage(img.ImageUrl);
                img.ImageUrl = await _storage.SaveImageAsync(image, "gallery");
            }
            await _db.SaveChangesAsync();
            return new GalleryImageDto { Id = img.Id, TitleHindi = img.TitleHindi, TitleEnglish = img.TitleEnglish, ImageUrl = img.ImageUrl, DisplayOrder = img.DisplayOrder, IsActive = img.IsActive };
        }

        public async Task DeleteAsync(Guid id)
        {
            var img = await _db.GalleryImages.FindAsync(id) ?? throw new Exception("Image not found");
            img.IsDeleted = true; img.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }
}
