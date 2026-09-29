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
    public class InterestOptionsController : BaseController
    {
        private readonly IInterestOptionService _svc;
        public InterestOptionsController(IInterestOptionService svc) => _svc = svc;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _svc.GetAllAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] string nameHindi, [FromForm] string nameEnglish,
            [FromForm] int displayOrder = 1, IFormFile? image = null)
        {
            try { return Ok(await _svc.CreateAsync(nameHindi, nameEnglish, displayOrder, image)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromForm] string nameHindi, [FromForm] string nameEnglish,
            [FromForm] int displayOrder = 1, IFormFile? image = null)
        {
            try { return Ok(await _svc.UpdateAsync(id, nameHindi, nameEnglish, displayOrder, image)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] bool isActive)
        {
            try { await _svc.UpdateStatusAsync(id, isActive); return Ok<object>(null!, "Updated"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try { await _svc.DeleteAsync(id); return Ok<object>(null!, "Deleted"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }
    }

    [Route("api/public")]
    [ApiController]
    public class PublicController : BaseController
    {
        private readonly IPublicService _public;
        private readonly IInterestOptionService _options;
        private readonly IContentService _content;
        private readonly IGalleryService _gallery;

        public PublicController(IPublicService pub, IInterestOptionService opts, IContentService content, IGalleryService gallery)
        { _public = pub; _options = opts; _content = content; _gallery = gallery; }

        [HttpGet("interest-options")]
        public async Task<IActionResult> GetOptions() => Ok(await _options.GetAllAsync(activeOnly: true));

        [HttpGet("content")]
        public async Task<IActionResult> GetContent() => Ok(await _content.GetAllAsync());

        [HttpGet("gallery")]
        public async Task<IActionResult> GetGallery() => Ok(await _gallery.GetAllAsync(activeOnly: true));

        [HttpPost("interests")]
        public async Task<IActionResult> SubmitInterest([FromBody] SubmitInterestRequest req)
        {
            try
            {
                var ua = Request.Headers.UserAgent.ToString();
                var result = await _public.SubmitInterestAsync(req, IpAddress, ua);
                return Ok(result);
            }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPost("otp/send")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest req)
        {
            try { await _public.SendOtpAsync(req); return Ok<object>(null!, "OTP sent"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPost("otp/verify")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest req)
        {
            try { await _public.VerifyOtpAsync(req); return Ok<object>(null!, "OTP verified"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }
    }

    [Authorize]
    public class ReportsController : BaseController
    {
        private readonly IDashboardService _dashboard;
        private readonly ISubmissionReportService _submissions;
        private readonly AppDbContext _db;

        public ReportsController(IDashboardService dashboard, ISubmissionReportService submissions, AppDbContext db)
        { _dashboard = dashboard; _submissions = submissions; _db = db; }

        private async Task<List<Guid>> GetUserWardIds()
        {
            if (CurrentUserRole == Roles.SuperAdmin) return new List<Guid>();
            return await _db.UserWards.Where(uw => uw.UserId == CurrentUserId).Select(uw => uw.WardId).ToListAsync();
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            var wardIds = await GetUserWardIds();
            return Ok(await _dashboard.GetStatsAsync(CurrentUserId, CurrentUserRole, wardIds));
        }

        [HttpGet("public-interests")]
        public async Task<IActionResult> PublicInterests([FromQuery] SubmissionQueryParams p)
        {
            var showFull = User.HasClaim("permission", Permissions.ViewFullMobile);
            return Ok(await _submissions.GetAllAsync(p, showFull));
        }

        [HttpGet("public-interests/export")]
        public async Task<IActionResult> ExportSubmissions([FromQuery] SubmissionQueryParams p)
        {
            var bytes = await _submissions.ExportAsync(p);
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "submissions.xlsx");
        }
    }

    [Authorize]
    public class ContentController : BaseController
    {
        private readonly IContentService _content;
        private readonly IGalleryService _gallery;
        public ContentController(IContentService content, IGalleryService gallery) { _content = content; _gallery = gallery; }

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _content.GetAllAsync());

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateContentRequest req)
        {
            try { return Ok(await _content.UpdateAsync(id, req)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }
    }

    [Authorize]
    public class GalleryController : BaseController
    {
        private readonly IGalleryService _gallery;
        public GalleryController(IGalleryService gallery) => _gallery = gallery;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _gallery.GetAllAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] string titleHindi, [FromForm] string titleEnglish, IFormFile image)
        {
            try { return Ok(await _gallery.CreateAsync(titleHindi, titleEnglish, image)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromForm] string titleHindi, [FromForm] string titleEnglish, IFormFile? image = null)
        {
            try { return Ok(await _gallery.UpdateAsync(id, titleHindi, titleEnglish, image)); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try { await _gallery.DeleteAsync(id); return Ok<object>(null!, "Deleted"); }
            catch (Exception ex) { return Fail(ex.Message); }
        }
    }

    [Authorize]
    public class AuditLogsController : BaseController
    {
        private readonly IAuditService _audit;
        public AuditLogsController(IAuditService audit) => _audit = audit;

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] AuditLogQueryParams p) =>
            Ok(await _audit.GetAllAsync(p));
    }
}
