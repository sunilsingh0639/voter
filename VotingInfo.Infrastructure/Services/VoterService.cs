using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using VotingInfo.Application.DTOs;
using VotingInfo.Application.Interfaces;
using VotingInfo.Domain.Constants;
using VotingInfo.Infrastructure.Data;

namespace VotingInfo.Infrastructure.Services
{
    public class VoterService : IVoterService
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public VoterService(AppDbContext db, IAuditService audit) { _db = db; _audit = audit; }

        private IQueryable<Domain.Entities.Voter> BuildAuthorizedQuery(Guid userId, string userRole, List<Guid> wardIds)
        {
            var q = _db.Voters.Include(v => v.Ward).AsNoTracking().AsQueryable();
            // CRITICAL: enforce ward-level authorization at DB query level
            if (userRole != Roles.SuperAdmin)
                q = q.Where(v => wardIds.Contains(v.WardId));
            return q;
        }

        public async Task<PaginatedResult<VoterDto>> GetAllAsync(VoterQueryParams p, Guid userId, string userRole, List<Guid> wardIds)
        {
            var q = BuildAuthorizedQuery(userId, userRole, wardIds);

            if (!string.IsNullOrEmpty(p.Search))
                q = q.Where(v => v.FullNameHindi.Contains(p.Search) || v.FullNameEnglish.Contains(p.Search) || v.EpicNumber.Contains(p.Search));
            if (p.WardId.HasValue)
            {
                // Extra check: non-SuperAdmin cannot query wards outside their assignment
                if (userRole != Roles.SuperAdmin && !wardIds.Contains(p.WardId.Value))
                    throw new UnauthorizedAccessException("Access denied to this ward");
                q = q.Where(v => v.WardId == p.WardId.Value);
            }
            if (!string.IsNullOrEmpty(p.BoothNumber)) q = q.Where(v => v.BoothNumber == p.BoothNumber);
            if (!string.IsNullOrEmpty(p.Gender)) q = q.Where(v => v.Gender == p.Gender);
            if (!string.IsNullOrEmpty(p.Status)) q = q.Where(v => v.Status == p.Status);
            if (p.MinAge.HasValue) q = q.Where(v => v.Age >= p.MinAge);
            if (p.MaxAge.HasValue) q = q.Where(v => v.Age <= p.MaxAge);

            q = p.SortBy switch
            {
                "epicNumber" => p.SortDesc ? q.OrderByDescending(v => v.EpicNumber) : q.OrderBy(v => v.EpicNumber),
                _ => p.SortDesc ? q.OrderByDescending(v => v.FullNameHindi) : q.OrderBy(v => v.FullNameHindi)
            };

            var total = await q.CountAsync();
            var items = await q.Skip((p.Page - 1) * p.PageSize).Take(p.PageSize).Select(v => MapToDto(v)).ToListAsync();
            return new PaginatedResult<VoterDto> { Items = items, Page = p.Page, PageSize = p.PageSize, TotalCount = total };
        }

        public async Task<VoterDto> GetByIdAsync(Guid id, Guid userId, string userRole, List<Guid> wardIds)
        {
            var q = BuildAuthorizedQuery(userId, userRole, wardIds);
            var voter = await q.FirstOrDefaultAsync(v => v.Id == id)
                ?? throw new UnauthorizedAccessException("Voter not found or access denied");
            return MapToDto(voter);
        }

        public async Task<VoterDto> UpdateAsync(Guid id, VoterDto dto, Guid updatedBy)
        {
            var voter = await _db.Voters.FindAsync(id) ?? throw new Exception("Voter not found");
            voter.FullNameHindi = dto.FullNameHindi; voter.FullNameEnglish = dto.FullNameEnglish;
            voter.MobileNumber = dto.MobileNumber; voter.HouseNumber = dto.HouseNumber;
            voter.Status = dto.Status; voter.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return await GetByIdAsync(id, updatedBy, Roles.SuperAdmin, new List<Guid>());
        }

        public async Task<byte[]> ExportAsync(VoterQueryParams p, Guid userId, string userRole, List<Guid> wardIds)
        {
            p.Page = 1; p.PageSize = 100000;
            var result = await GetAllAsync(p, userId, userRole, wardIds);
            await _audit.LogAsync(userId, AuditActions.VoterExport, "Voter", null, $"Exported {result.TotalCount} voters");

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("Voters");
            var headers = new[] { "Serial No", "EPIC Number", "Name (Hindi)", "Name (English)", "Father/Husband", "Gender", "Age", "Ward", "Booth", "House No", "Area", "Status" };
            for (int i = 0; i < headers.Length; i++) ws.Cell(1, i + 1).Value = headers[i];
            int row = 2;
            foreach (var v in result.Items)
            {
                ws.Cell(row, 1).Value = v.SerialNumber;
                ws.Cell(row, 2).Value = v.EpicNumber;
                ws.Cell(row, 3).Value = v.FullNameHindi;
                ws.Cell(row, 4).Value = v.FullNameEnglish;
                ws.Cell(row, 5).Value = v.FatherHusbandNameHindi;
                ws.Cell(row, 6).Value = v.Gender;
                ws.Cell(row, 7).Value = v.Age;
                ws.Cell(row, 8).Value = v.Ward?.WardNameHindi;
                ws.Cell(row, 9).Value = v.BoothNumber;
                ws.Cell(row, 10).Value = v.HouseNumber;
                ws.Cell(row, 11).Value = v.Area;
                ws.Cell(row, 12).Value = v.Status;
                row++;
            }
            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            return ms.ToArray();
        }

        private static VoterDto MapToDto(Domain.Entities.Voter v) => new()
        {
            Id = v.Id, EpicNumber = v.EpicNumber, FullNameHindi = v.FullNameHindi,
            FullNameEnglish = v.FullNameEnglish, FatherHusbandNameHindi = v.FatherHusbandNameHindi,
            FatherHusbandNameEnglish = v.FatherHusbandNameEnglish, Gender = v.Gender,
            Age = v.Age, MobileNumber = v.MobileNumber, HouseNumber = v.HouseNumber,
            AddressHindi = v.AddressHindi, WardId = v.WardId,
            Ward = v.Ward == null ? null : new WardDto { Id = v.Ward.Id, WardNumber = v.Ward.WardNumber, WardNameHindi = v.Ward.WardNameHindi, WardNameEnglish = v.Ward.WardNameEnglish, Status = v.Ward.Status },
            BoothNumber = v.BoothNumber, BoothName = v.BoothName, SerialNumber = v.SerialNumber,
            Area = v.Area, Status = v.Status, CreatedAt = v.CreatedAt, UpdatedAt = v.UpdatedAt
        };
    }
}
