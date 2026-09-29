using System;
using System.Collections.Generic;

namespace VotingInfo.Domain.Entities
{
    public abstract class BaseEntity
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    public class User : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty; // SuperAdmin, Admin, WardAdmin
        public string Status { get; set; } = "Active"; // Active, Inactive, Blocked
        public bool IsDeleted { get; set; } = false;
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
        public ICollection<UserWard> UserWards { get; set; } = new List<UserWard>();
        public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    }

    public class UserWard : BaseEntity
    {
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public Guid WardId { get; set; }
        public Ward Ward { get; set; } = null!;
    }

    public class Ward : BaseEntity
    {
        public string WardNumber { get; set; } = string.Empty;
        public string WardNameHindi { get; set; } = string.Empty;
        public string WardNameEnglish { get; set; } = string.Empty;
        public string? DescriptionHindi { get; set; }
        public string? DescriptionEnglish { get; set; }
        public string Status { get; set; } = "Active";
        public bool IsDeleted { get; set; } = false;
        public ICollection<Voter> Voters { get; set; } = new List<Voter>();
        public ICollection<UserWard> UserWards { get; set; } = new List<UserWard>();
    }

    public class Voter : BaseEntity
    {
        public string EpicNumber { get; set; } = string.Empty;
        public string FullNameHindi { get; set; } = string.Empty;
        public string FullNameEnglish { get; set; } = string.Empty;
        public string? FatherHusbandNameHindi { get; set; }
        public string? FatherHusbandNameEnglish { get; set; }
        public string Gender { get; set; } = string.Empty; // Male, Female, Other
        public DateTime? DateOfBirth { get; set; }
        public int? Age { get; set; }
        public string? MobileNumber { get; set; }
        public string? HouseNumber { get; set; }
        public string? AddressHindi { get; set; }
        public string? AddressEnglish { get; set; }
        public Guid WardId { get; set; }
        public Ward Ward { get; set; } = null!;
        public string? BoothNumber { get; set; }
        public string? BoothName { get; set; }
        public string? SerialNumber { get; set; }
        public string? Area { get; set; }
        public string Status { get; set; } = "Active";
        public bool IsDeleted { get; set; } = false;
    }

    public class InterestOption : BaseEntity
    {
        public string NameHindi { get; set; } = string.Empty;
        public string NameEnglish { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 1;
        public bool IsDeleted { get; set; } = false;
        public ICollection<PublicInterestSubmission> Submissions { get; set; } = new List<PublicInterestSubmission>();
    }

    public class PublicInterestSubmission : BaseEntity
    {
        public Guid InterestOptionId { get; set; }
        public InterestOption InterestOption { get; set; } = null!;
        public string? MobileNumber { get; set; }
        public bool IsOtpVerified { get; set; } = false;
        public DateTime? OtpVerifiedAt { get; set; }
        public string? OtpHash { get; set; }
        public DateTime? OtpExpiry { get; set; }
        public int OtpAttempts { get; set; } = 0;
        public int OtpResendCount { get; set; } = 0;
        public DateTime? LastOtpSentAt { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string Language { get; set; } = "hi";
        public string Source { get; set; } = "website";
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class AuditLog : BaseEntity
    {
        public Guid? UserId { get; set; }
        public User? User { get; set; }
        public string Action { get; set; } = string.Empty;
        public string EntityType { get; set; } = string.Empty;
        public string? EntityId { get; set; }
        public string Description { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
    }

    public class ContentItem : BaseEntity
    {
        public string Key { get; set; } = string.Empty;
        public string ValueHindi { get; set; } = string.Empty;
        public string ValueEnglish { get; set; } = string.Empty;
        public string Type { get; set; } = "text"; // text, image, html
    }

    public class GalleryImage : BaseEntity
    {
        public string TitleHindi { get; set; } = string.Empty;
        public string TitleEnglish { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public int DisplayOrder { get; set; } = 1;
        public bool IsActive { get; set; } = true;
        public bool IsDeleted { get; set; } = false;
    }

    public class ImportHistory : BaseEntity
    {
        public string FileName { get; set; } = string.Empty;
        public int TotalRows { get; set; }
        public int Inserted { get; set; }
        public int Updated { get; set; }
        public int Duplicates { get; set; }
        public int Invalid { get; set; }
        public int Failed { get; set; }
        public int MissingWard { get; set; }
        public Guid ImportedBy { get; set; }
        public string ImportedByName { get; set; } = string.Empty;
        public string? TempDataJson { get; set; } // stores preview data temporarily
        public string Mode { get; set; } = "Upsert";
        public string Status { get; set; } = "Pending"; // Pending, Confirmed, Cancelled
    }
}
