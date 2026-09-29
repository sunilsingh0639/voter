using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using VotingInfo.Application.DTOs;

namespace VotingInfo.Application.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request, string ipAddress);
        Task<(string token, string refreshToken)> RefreshTokenAsync(string refreshToken);
        Task LogoutAsync(Guid userId);
        Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
        Task ResetPasswordAsync(Guid userId, string newPassword);
    }

    public interface IUserService
    {
        Task<PaginatedResult<UserDto>> GetAllAsync(UserQueryParams p, Guid requestingUserId);
        Task<UserDto> GetByIdAsync(Guid id);
        Task<UserDto> CreateAsync(CreateUserRequest request, Guid createdBy);
        Task<UserDto> UpdateAsync(Guid id, UpdateUserRequest request, Guid updatedBy);
        Task UpdateStatusAsync(Guid id, string status, Guid updatedBy);
        Task DeleteAsync(Guid id, Guid deletedBy);
        Task<UserDto> GetProfileAsync(Guid userId);
    }

    public interface IWardService
    {
        Task<PaginatedResult<WardDto>> GetAllAsync(WardQueryParams p, Guid? userId = null);
        Task<WardDto> GetByIdAsync(Guid id);
        Task<WardDto> CreateAsync(CreateWardRequest request, Guid createdBy);
        Task<WardDto> UpdateAsync(Guid id, CreateWardRequest request, Guid updatedBy);
        Task UpdateStatusAsync(Guid id, string status, Guid updatedBy);
        Task DeleteAsync(Guid id, Guid deletedBy);
    }

    public interface IVoterService
    {
        Task<PaginatedResult<VoterDto>> GetAllAsync(VoterQueryParams p, Guid userId, string userRole, List<Guid> wardIds);
        Task<VoterDto> GetByIdAsync(Guid id, Guid userId, string userRole, List<Guid> wardIds);
        Task<VoterDto> UpdateAsync(Guid id, VoterDto dto, Guid updatedBy);
        Task<byte[]> ExportAsync(VoterQueryParams p, Guid userId, string userRole, List<Guid> wardIds);
    }

    public interface IVoterImportService
    {
        Task<ImportPreviewResult> PreviewAsync(IFormFile file, Guid wardId, string mode, Guid userId);
        Task<ImportHistoryDto> ConfirmAsync(Guid importId, Guid userId);
        Task<byte[]> GetErrorFileAsync(Guid importId);
        Task<List<ImportHistoryDto>> GetHistoryAsync();
    }

    public interface IInterestOptionService
    {
        Task<List<InterestOptionDto>> GetAllAsync(bool activeOnly = false);
        Task<InterestOptionDto> CreateAsync(string nameHindi, string nameEnglish, int displayOrder, IFormFile? image);
        Task<InterestOptionDto> UpdateAsync(Guid id, string nameHindi, string nameEnglish, int displayOrder, IFormFile? image);
        Task UpdateStatusAsync(Guid id, bool isActive);
        Task DeleteAsync(Guid id);
    }

    public interface IPublicService
    {
        Task<SubmitInterestResponse> SubmitInterestAsync(SubmitInterestRequest request, string ipAddress, string userAgent);
        Task SendOtpAsync(SendOtpRequest request);
        Task VerifyOtpAsync(VerifyOtpRequest request);
    }

    public interface ISubmissionReportService
    {
        Task<PaginatedResult<PublicSubmissionDto>> GetAllAsync(SubmissionQueryParams p, bool showFullMobile);
        Task<byte[]> ExportAsync(SubmissionQueryParams p);
    }

    public interface IDashboardService
    {
        Task<DashboardStatsDto> GetStatsAsync(Guid userId, string userRole, List<Guid> wardIds);
    }

    public interface IAuditService
    {
        Task LogAsync(Guid? userId, string action, string entityType, string? entityId, string description, string? ipAddress = null);
        Task<PaginatedResult<AuditLogDto>> GetAllAsync(AuditLogQueryParams p);
    }

    public interface IContentService
    {
        Task<List<ContentItemDto>> GetAllAsync();
        Task<ContentItemDto> UpdateAsync(Guid id, UpdateContentRequest request);
    }

    public interface IGalleryService
    {
        Task<List<GalleryImageDto>> GetAllAsync(bool activeOnly = false);
        Task<GalleryImageDto> CreateAsync(string titleHindi, string titleEnglish, IFormFile image);
        Task<GalleryImageDto> UpdateAsync(Guid id, string titleHindi, string titleEnglish, IFormFile? image);
        Task DeleteAsync(Guid id);
    }

    public interface IJwtService
    {
        string GenerateToken(UserDto user);
        string GenerateRefreshToken();
        Guid? ValidateToken(string token);
    }

    public interface ISmsService
    {
        Task<bool> SendOtpAsync(string mobileNumber, string otp);
    }

    public interface IFileStorageService
    {
        Task<string> SaveImageAsync(IFormFile file, string folder);
        void DeleteImage(string imageUrl);
    }
}
