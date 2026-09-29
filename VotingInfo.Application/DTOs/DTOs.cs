using System;
using System.Collections.Generic;

namespace VotingInfo.Application.DTOs
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }

        public static ApiResponse<T> Ok(T data, string message = "Success") =>
            new() { Success = true, Message = message, Data = data };

        public static ApiResponse<T> Fail(string message, List<string>? errors = null) =>
            new() { Success = false, Message = message, Errors = errors };
    }

    public class PaginatedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    }

    // Auth DTOs
    public class LoginRequest { public string Username { get; set; } = ""; public string Password { get; set; } = ""; }
    public class LoginResponse
    {
        public string Token { get; set; } = "";
        public string RefreshToken { get; set; } = "";
        public UserDto User { get; set; } = null!;
    }
    public class RefreshRequest { public string RefreshToken { get; set; } = ""; }
    public class ChangePasswordRequest { public string CurrentPassword { get; set; } = ""; public string NewPassword { get; set; } = ""; }
    public class ResetPasswordRequest { public string NewPassword { get; set; } = ""; }

    // User DTOs
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string Mobile { get; set; } = "";
        public string Role { get; set; } = "";
        public string Status { get; set; } = "";
        public List<string> Permissions { get; set; } = new();
        public List<WardDto> AssignedWards { get; set; } = new();
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUserRequest
    {
        public string Name { get; set; } = "";
        public string Username { get; set; } = "";
        public string Email { get; set; } = "";
        public string Mobile { get; set; } = "";
        public string Password { get; set; } = "";
        public string Role { get; set; } = "";
        public string Status { get; set; } = "Active";
        public List<Guid> WardIds { get; set; } = new();
    }

    public class UpdateUserRequest
    {
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Mobile { get; set; } = "";
        public string Status { get; set; } = "Active";
        public List<Guid> WardIds { get; set; } = new();
    }

    public class UpdateStatusRequest { public string Status { get; set; } = ""; }

    // Ward DTOs
    public class WardDto
    {
        public Guid Id { get; set; }
        public string WardNumber { get; set; } = "";
        public string WardNameHindi { get; set; } = "";
        public string WardNameEnglish { get; set; } = "";
        public string? DescriptionHindi { get; set; }
        public string? DescriptionEnglish { get; set; }
        public string Status { get; set; } = "";
        public int VoterCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class CreateWardRequest
    {
        public string WardNumber { get; set; } = "";
        public string WardNameHindi { get; set; } = "";
        public string WardNameEnglish { get; set; } = "";
        public string? DescriptionHindi { get; set; }
        public string? DescriptionEnglish { get; set; }
        public string Status { get; set; } = "Active";
    }

    // Voter DTOs
    public class VoterDto
    {
        public Guid Id { get; set; }
        public string EpicNumber { get; set; } = "";
        public string FullNameHindi { get; set; } = "";
        public string FullNameEnglish { get; set; } = "";
        public string? FatherHusbandNameHindi { get; set; }
        public string? FatherHusbandNameEnglish { get; set; }
        public string Gender { get; set; } = "";
        public int? Age { get; set; }
        public string? MobileNumber { get; set; }
        public string? HouseNumber { get; set; }
        public string? AddressHindi { get; set; }
        public Guid WardId { get; set; }
        public WardDto? Ward { get; set; }
        public string? BoothNumber { get; set; }
        public string? BoothName { get; set; }
        public string? SerialNumber { get; set; }
        public string? Area { get; set; }
        public string Status { get; set; } = "";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class VoterQueryParams
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
        public Guid? WardId { get; set; }
        public string? BoothNumber { get; set; }
        public string? Gender { get; set; }
        public string? Status { get; set; }
        public int? MinAge { get; set; }
        public int? MaxAge { get; set; }
        public string SortBy { get; set; } = "FullNameHindi";
        public bool SortDesc { get; set; } = false;
    }

    // Interest Option DTOs
    public class InterestOptionDto
    {
        public Guid Id { get; set; }
        public string NameHindi { get; set; } = "";
        public string NameEnglish { get; set; } = "";
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Public Submission DTOs
    public class SubmitInterestRequest
    {
        public Guid InterestOptionId { get; set; }
        public string SessionId { get; set; } = "";
        public string Language { get; set; } = "hi";
        public string Source { get; set; } = "website";
    }

    public class SubmitInterestResponse { public Guid SubmissionId { get; set; } }

    public class SendOtpRequest { public Guid SubmissionId { get; set; } public string MobileNumber { get; set; } = ""; }
    public class VerifyOtpRequest { public Guid SubmissionId { get; set; } public string Otp { get; set; } = ""; }

    public class PublicSubmissionDto
    {
        public Guid Id { get; set; }
        public Guid InterestOptionId { get; set; }
        public InterestOptionDto? InterestOption { get; set; }
        public string? MobileNumber { get; set; }
        public string? MaskedMobile { get; set; }
        public bool IsOtpVerified { get; set; }
        public DateTime? OtpVerifiedAt { get; set; }
        public string SessionId { get; set; } = "";
        public string Language { get; set; } = "";
        public string Source { get; set; } = "";
        public string Status { get; set; } = "";
        public DateTime CreatedAt { get; set; }
    }

    public class SubmissionQueryParams
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
        public bool? OtpVerified { get; set; }
        public string? Language { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
    }

    // Audit Log DTOs
    public class AuditLogDto
    {
        public Guid Id { get; set; }
        public Guid? UserId { get; set; }
        public string? UserName { get; set; }
        public string Action { get; set; } = "";
        public string EntityType { get; set; } = "";
        public string? EntityId { get; set; }
        public string Description { get; set; } = "";
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Dashboard DTOs
    public class DashboardStatsDto
    {
        public int TotalWards { get; set; }
        public int TotalAdmins { get; set; }
        public int TotalWardAdmins { get; set; }
        public int TotalVoters { get; set; }
        public int ActiveVoters { get; set; }
        public int InactiveVoters { get; set; }
        public int MaleVoters { get; set; }
        public int FemaleVoters { get; set; }
        public int OtherVoters { get; set; }
        public int TotalSubmissions { get; set; }
        public int VerifiedSubmissions { get; set; }
        public List<WardVoterCount> WardWiseCount { get; set; } = new();
        public List<BoothVoterCount> BoothWiseCount { get; set; } = new();
        public List<ImportHistoryDto> RecentImports { get; set; } = new();
    }

    public class WardVoterCount { public string WardName { get; set; } = ""; public int Count { get; set; } }
    public class BoothVoterCount { public string BoothName { get; set; } = ""; public int Count { get; set; } }

    public class ImportHistoryDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = "";
        public int TotalRows { get; set; }
        public int Inserted { get; set; }
        public int Updated { get; set; }
        public int Duplicates { get; set; }
        public int Invalid { get; set; }
        public int Failed { get; set; }
        public int MissingWard { get; set; }
        public string ImportedBy { get; set; } = "";
        public DateTime ImportedAt { get; set; }
    }

    // Content DTOs
    public class ContentItemDto
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = "";
        public string ValueHindi { get; set; } = "";
        public string ValueEnglish { get; set; } = "";
        public string Type { get; set; } = "";
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateContentRequest { public string ValueHindi { get; set; } = ""; public string ValueEnglish { get; set; } = ""; }

    // Gallery DTOs
    public class GalleryImageDto
    {
        public Guid Id { get; set; }
        public string TitleHindi { get; set; } = "";
        public string TitleEnglish { get; set; } = "";
        public string ImageUrl { get; set; } = "";
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; }
    }

    // Import DTOs
    public class ImportPreviewResult
    {
        public Guid ImportId { get; set; }
        public int TotalRows { get; set; }
        public List<VoterImportRow> ValidRows { get; set; } = new();
        public List<InvalidImportRow> InvalidRows { get; set; } = new();
        public List<VoterImportRow> DuplicateRows { get; set; } = new();
        public List<VoterImportRow> MissingWardRows { get; set; } = new();
    }

    public class VoterImportRow
    {
        public int RowNumber { get; set; }
        public string EpicNumber { get; set; } = "";
        public string FullNameHindi { get; set; } = "";
        public string FullNameEnglish { get; set; } = "";
        public string? FatherHusbandNameHindi { get; set; }
        public string? FatherHusbandNameEnglish { get; set; }
        public string Gender { get; set; } = "";
        public int? Age { get; set; }
        public string? MobileNumber { get; set; }
        public string? HouseNumber { get; set; }
        public string? AddressHindi { get; set; }
        public string? BoothNumber { get; set; }
        public string? BoothName { get; set; }
        public string? SerialNumber { get; set; }
        public string? Area { get; set; }
        public Guid? WardId { get; set; }
    }

    public class InvalidImportRow
    {
        public int RowNumber { get; set; }
        public string EpicNumber { get; set; } = "";
        public string Error { get; set; } = "";
    }

    public class UserQueryParams
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
    }

    public class WardQueryParams
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
        public string? Status { get; set; }
    }

    public class AuditLogQueryParams
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 25;
        public string? Search { get; set; }
    }
}
