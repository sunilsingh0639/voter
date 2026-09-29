using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
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
    public class VoterImportService : IVoterImportService
    {
        private readonly AppDbContext _db;
        private readonly IAuditService _audit;

        public VoterImportService(AppDbContext db, IAuditService audit) { _db = db; _audit = audit; }

        public async Task<ImportPreviewResult> PreviewAsync(IFormFile file, Guid wardId, string mode, Guid userId)
        {
            var ward = await _db.Wards.FindAsync(wardId) ?? throw new Exception("Ward not found");

            var valid = new List<VoterImportRow>();
            var invalid = new List<InvalidImportRow>();
            var duplicates = new List<VoterImportRow>();

            using var stream = file.OpenReadStream();
            using var wb = new XLWorkbook(stream);
            var ws = wb.Worksheets.First();
            var rows = ws.RowsUsed().Skip(1).ToList(); // skip header

            // Get existing EPIC numbers for duplicate check
            var existingEpics = await _db.Voters.Where(v => v.WardId == wardId)
                .Select(v => v.EpicNumber).ToHashSetAsync();

            int rowNum = 2;
            foreach (var row in rows)
            {
                var epicNumber = row.Cell(1).GetString().Trim();
                var nameHindi = row.Cell(2).GetString().Trim();
                var nameEnglish = row.Cell(3).GetString().Trim();
                var fatherHindi = row.Cell(4).GetString().Trim();
                var gender = row.Cell(5).GetString().Trim();
                var ageStr = row.Cell(6).GetString().Trim();
                var mobile = row.Cell(7).GetString().Trim();
                var houseNo = row.Cell(8).GetString().Trim();
                var address = row.Cell(9).GetString().Trim();
                var booth = row.Cell(10).GetString().Trim();
                var boothName = row.Cell(11).GetString().Trim();
                var serial = row.Cell(12).GetString().Trim();
                var area = row.Cell(13).GetString().Trim();

                var errors = new List<string>();
                if (string.IsNullOrEmpty(epicNumber)) errors.Add("EPIC Number is required");
                if (string.IsNullOrEmpty(nameHindi)) errors.Add("Name (Hindi) is required");
                if (!new[] { "Male", "Female", "Other" }.Contains(gender)) errors.Add("Invalid gender");

                if (errors.Count > 0)
                {
                    invalid.Add(new InvalidImportRow { RowNumber = rowNum, EpicNumber = epicNumber, Error = string.Join("; ", errors) });
                    rowNum++; continue;
                }

                int.TryParse(ageStr, out var age);
                var importRow = new VoterImportRow
                {
                    RowNumber = rowNum, EpicNumber = epicNumber, FullNameHindi = nameHindi,
                    FullNameEnglish = nameEnglish, FatherHusbandNameHindi = fatherHindi,
                    Gender = gender, Age = age > 0 ? age : null, MobileNumber = mobile,
                    HouseNumber = houseNo, AddressHindi = address, BoothNumber = booth,
                    BoothName = boothName, SerialNumber = serial, Area = area, WardId = wardId
                };

                if (existingEpics.Contains(epicNumber) && mode == "InsertOnly")
                    duplicates.Add(importRow);
                else
                    valid.Add(importRow);

                rowNum++;
            }

            // Save preview to ImportHistory
            var history = new ImportHistory
            {
                FileName = file.FileName, TotalRows = rows.Count,
                Inserted = 0, Updated = 0, Duplicates = duplicates.Count,
                Invalid = invalid.Count, Failed = 0, MissingWard = 0,
                ImportedBy = userId, ImportedByName = "",
                Mode = mode, Status = "Pending",
                TempDataJson = JsonSerializer.Serialize(new { valid, invalid, duplicates, wardId })
            };
            _db.ImportHistories.Add(history);
            await _db.SaveChangesAsync();

            return new ImportPreviewResult
            {
                ImportId = history.Id, TotalRows = rows.Count,
                ValidRows = valid, InvalidRows = invalid, DuplicateRows = duplicates
            };
        }

        public async Task<ImportHistoryDto> ConfirmAsync(Guid importId, Guid userId)
        {
            var history = await _db.ImportHistories.FindAsync(importId)
                ?? throw new Exception("Import not found");
            if (history.Status != "Pending") throw new Exception("Import already processed");

            var data = JsonSerializer.Deserialize<JsonElement>(history.TempDataJson!);
            var wardId = data.GetProperty("wardId").GetGuid();
            var validRows = JsonSerializer.Deserialize<List<VoterImportRow>>(data.GetProperty("valid").GetRawText())!;

            int inserted = 0, updated = 0, failed = 0;
            const int batchSize = 500;

            using var tx = await _db.Database.BeginTransactionAsync();
            try
            {
                var existingVoters = await _db.Voters.Where(v => v.WardId == wardId)
                    .ToDictionaryAsync(v => v.EpicNumber);

                for (int i = 0; i < validRows.Count; i += batchSize)
                {
                    var batch = validRows.Skip(i).Take(batchSize);
                    foreach (var row in batch)
                    {
                        try
                        {
                            if (existingVoters.TryGetValue(row.EpicNumber, out var existing))
                            {
                                existing.FullNameHindi = row.FullNameHindi;
                                existing.FullNameEnglish = row.FullNameEnglish;
                                existing.FatherHusbandNameHindi = row.FatherHusbandNameHindi;
                                existing.Gender = row.Gender; existing.Age = row.Age;
                                existing.MobileNumber = row.MobileNumber; existing.HouseNumber = row.HouseNumber;
                                existing.AddressHindi = row.AddressHindi; existing.BoothNumber = row.BoothNumber;
                                existing.BoothName = row.BoothName; existing.SerialNumber = row.SerialNumber;
                                existing.Area = row.Area; existing.UpdatedAt = DateTime.UtcNow;
                                updated++;
                            }
                            else
                            {
                                _db.Voters.Add(new Voter
                                {
                                    EpicNumber = row.EpicNumber, FullNameHindi = row.FullNameHindi,
                                    FullNameEnglish = row.FullNameEnglish, FatherHusbandNameHindi = row.FatherHusbandNameHindi,
                                    Gender = row.Gender, Age = row.Age, MobileNumber = row.MobileNumber,
                                    HouseNumber = row.HouseNumber, AddressHindi = row.AddressHindi,
                                    WardId = wardId, BoothNumber = row.BoothNumber, BoothName = row.BoothName,
                                    SerialNumber = row.SerialNumber, Area = row.Area, Status = "Active"
                                });
                                inserted++;
                            }
                        }
                        catch { failed++; }
                    }
                    await _db.SaveChangesAsync();
                }

                history.Inserted = inserted; history.Updated = updated; history.Failed = failed;
                history.Status = "Confirmed"; history.TempDataJson = null;
                await _db.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch
            {
                await tx.RollbackAsync();
                throw;
            }

            await _audit.LogAsync(userId, AuditActions.VoterImport, "Voter", importId.ToString(),
                $"Import confirmed: {inserted} inserted, {updated} updated, {failed} failed");

            return new ImportHistoryDto
            {
                Id = history.Id, FileName = history.FileName, TotalRows = history.TotalRows,
                Inserted = inserted, Updated = updated, Duplicates = history.Duplicates,
                Invalid = history.Invalid, Failed = failed, ImportedAt = history.CreatedAt
            };
        }

        public async Task<byte[]> GetErrorFileAsync(Guid importId)
        {
            var history = await _db.ImportHistories.FindAsync(importId)
                ?? throw new Exception("Import not found");

            using var wb = new XLWorkbook();
            var ws = wb.Worksheets.Add("Errors");
            ws.Cell(1, 1).Value = "Row Number";
            ws.Cell(1, 2).Value = "EPIC Number";
            ws.Cell(1, 3).Value = "Error";

            if (history.TempDataJson != null)
            {
                var data = JsonSerializer.Deserialize<JsonElement>(history.TempDataJson);
                var invalidRows = JsonSerializer.Deserialize<List<InvalidImportRow>>(data.GetProperty("invalid").GetRawText())!;
                int row = 2;
                foreach (var r in invalidRows)
                {
                    ws.Cell(row, 1).Value = r.RowNumber;
                    ws.Cell(row, 2).Value = r.EpicNumber;
                    ws.Cell(row, 3).Value = r.Error;
                    row++;
                }
            }

            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            return ms.ToArray();
        }

        public async Task<List<ImportHistoryDto>> GetHistoryAsync()
        {
            return await _db.ImportHistories.AsNoTracking()
                .OrderByDescending(h => h.CreatedAt).Take(20)
                .Select(h => new ImportHistoryDto
                {
                    Id = h.Id, FileName = h.FileName, TotalRows = h.TotalRows,
                    Inserted = h.Inserted, Updated = h.Updated, Duplicates = h.Duplicates,
                    Invalid = h.Invalid, Failed = h.Failed, ImportedBy = h.ImportedByName,
                    ImportedAt = h.CreatedAt
                }).ToListAsync();
        }
    }
}
