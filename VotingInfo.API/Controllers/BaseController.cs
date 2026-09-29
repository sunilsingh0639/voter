using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using VotingInfo.Application.DTOs;

namespace VotingInfo.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public abstract class BaseController : ControllerBase
    {
        protected Guid CurrentUserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.Empty.ToString());

        protected string CurrentUserRole =>
            User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

        protected string IpAddress =>
            HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        protected new IActionResult Ok<T>(T data, string message = "Success") =>
            base.Ok(ApiResponse<T>.Ok(data, message));

        protected IActionResult Fail(string message, int statusCode = 400) =>
            StatusCode(statusCode, ApiResponse<object>.Fail(message));
    }
}
