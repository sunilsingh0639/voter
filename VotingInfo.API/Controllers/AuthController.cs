using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VotingInfo.Application.DTOs;
using VotingInfo.Application.Interfaces;

namespace VotingInfo.API.Controllers
{
    public class AuthController : BaseController
    {
        private readonly IAuthService _auth;
        public AuthController(IAuthService auth) => _auth = auth;

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var result = await _auth.LoginAsync(req, IpAddress);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex) { return Fail(ex.Message, 401); }
            catch (Exception ex) { return Fail(ex.Message); }
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
        {
            try
            {
                var (token, refresh) = await _auth.RefreshTokenAsync(req.RefreshToken);
                return Ok(new { token, refreshToken = refresh });
            }
            catch (UnauthorizedAccessException ex) { return Fail(ex.Message, 401); }
        }

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _auth.LogoutAsync(CurrentUserId);
            return Ok<object>(null!, "Logged out");
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
        {
            try
            {
                await _auth.ChangePasswordAsync(CurrentUserId, req);
                return Ok<object>(null!, "Password changed");
            }
            catch (UnauthorizedAccessException ex) { return Fail(ex.Message, 401); }
            catch (Exception ex) { return Fail(ex.Message); }
        }
    }
}
