using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VotingInfo.Application.DTOs;
using VotingInfo.Application.Interfaces;
using VotingInfo.Domain.Constants;
using VotingInfo.Infrastructure.Data;

namespace VotingInfo.API.Controllers
{
    [Authorize]
    public class UsersController : BaseController
    {
        private readonly IUserService _users;
        private readonly IAuthService _auth;
        public UsersController(IUserService users, IAuthService auth) { _users = users; _auth = auth; }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] UserQueryParams p)
        {
            var result = await _users.GetAllAsync(p, CurrentUserId);
            return Ok(result);
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var result = await _users.GetProfileAsync(CurrentUserId);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try { return Ok(await _users.GetByIdAsync(id)); }
            catch (Exception ex) { return Fail(ex.Message, 404); }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest req)
        {
            try { return Ok(await _users.CreateAsync(req, CurrentUserId)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest req)
        {
            try { return Ok(await _users.UpdateAsync(id, req, CurrentUserId)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest req)
        {
            try { await _users.UpdateStatusAsync(id, req.Status, CurrentUserId); return Ok<object>(null!, "Status updated"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest req)
        {
            try { await _auth.ResetPasswordAsync(id, req.NewPassword); return Ok<object>(null!, "Password reset"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try { await _users.DeleteAsync(id, CurrentUserId); return Ok<object>(null!, "Deleted"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }
    }

    [Authorize]
    public class WardsController : BaseController
    {
        private readonly IWardService _wards;
        public WardsController(IWardService wards) => _wards = wards;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] WardQueryParams p)
        {
            var result = await _wards.GetAllAsync(p);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try { return Ok(await _wards.GetByIdAsync(id)); }
            catch (Exception ex) { return Fail(ex.Message, 404); }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateWardRequest req)
        {
            try { return Ok(await _wards.CreateAsync(req, CurrentUserId)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateWardRequest req)
        {
            try { return Ok(await _wards.UpdateAsync(id, req, CurrentUserId)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusRequest req)
        {
            try { await _wards.UpdateStatusAsync(id, req.Status, CurrentUserId); return Ok<object>(null!, "Status updated"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try { await _wards.DeleteAsync(id, CurrentUserId); return Ok<object>(null!, "Deleted"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }
    }

    [Authorize]
    public class VotersController : BaseController
    {
        private readonly IVoterService _voters;
        private readonly IVoterImportService _import;
        private readonly AppDbContext _db;

        public VotersController(IVoterService voters, IVoterImportService import, AppDbContext db)
        { _voters = voters; _import = import; _db = db; }

        private async Task<List<Guid>> GetUserWardIds()
        {
            if (CurrentUserRole == Roles.SuperAdmin) return new List<Guid>();
            return await _db.UserWards.Where(uw => uw.UserId == CurrentUserId)
                .Select(uw => uw.WardId).ToListAsync();
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] VoterQueryParams p)
        {
            try
            {
                var wardIds = await GetUserWardIds();
                var result = await _voters.GetAllAsync(p, CurrentUserId, CurrentUserRole, wardIds);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex) { return Fail(ex.Message, 403); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            try
            {
                var wardIds = await GetUserWardIds();
                return Ok(await _voters.GetByIdAsync(id, CurrentUserId, CurrentUserRole, wardIds));
            }
            catch (UnauthorizedAccessException ex) { return Fail(ex.Message, 403); }
        }

        [HttpGet("export")]
        public async Task<IActionResult> Export([FromQuery] VoterQueryParams p)
        {
            try
            {
                var wardIds = await GetUserWardIds();
                var bytes = await _voters.ExportAsync(p, CurrentUserId, CurrentUserRole, wardIds);
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "voters.xlsx");
            }
            catch (UnauthorizedAccessException ex) { return Fail(ex.Message, 403); }
        }

        [HttpPost("import/preview")]
        public async Task<IActionResult> ImportPreview([FromForm] IFormFile file, [FromForm] Guid wardId, [FromForm] string mode)
        {
            try { return Ok(await _import.PreviewAsync(file, wardId, mode, CurrentUserId)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPost("import/{importId}/confirm")]
        public async Task<IActionResult> ImportConfirm(Guid importId)
        {
            try { return Ok(await _import.ConfirmAsync(importId, CurrentUserId)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpGet("import/{importId}/errors")]
        public async Task<IActionResult> ImportErrors(Guid importId)
        {
            try
            {
                var bytes = await _import.GetErrorFileAsync(importId);
                return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "errors.xlsx");
            }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpGet("import/history")]
        public async Task<IActionResult> ImportHistory()
        {
            return Ok(await _import.GetHistoryAsync());
        }
    }
}
