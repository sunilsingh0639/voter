namespace VotingInfo.Domain.Constants
{
    public static class Roles
    {
        public const string SuperAdmin = "SuperAdmin";
        public const string Admin = "Admin";
        public const string WardAdmin = "WardAdmin";
    }

    public static class Permissions
    {
        public const string ViewVoters = "VIEW_VOTERS";
        public const string ImportVoters = "IMPORT_VOTERS";
        public const string ExportVoters = "EXPORT_VOTERS";
        public const string ManageWards = "MANAGE_WARDS";
        public const string ManageAdmins = "MANAGE_ADMINS";
        public const string ManageWardAdmins = "MANAGE_WARD_ADMINS";
        public const string ManageInterestOptions = "MANAGE_INTEREST_OPTIONS";
        public const string ViewPublicSubmissions = "VIEW_PUBLIC_SUBMISSIONS";
        public const string ManageContent = "MANAGE_CONTENT";
        public const string ViewAuditLogs = "VIEW_AUDIT_LOGS";
        public const string ViewFullMobile = "VIEW_FULL_MOBILE";
        public const string ManageSettings = "MANAGE_SETTINGS";

        public static readonly string[] SuperAdminPermissions = new[]
        {
            ViewVoters, ImportVoters, ExportVoters, ManageWards, ManageAdmins,
            ManageWardAdmins, ManageInterestOptions, ViewPublicSubmissions,
            ManageContent, ViewAuditLogs, ViewFullMobile, ManageSettings
        };

        public static readonly string[] AdminPermissions = new[]
        {
            ViewVoters, ExportVoters, ManageWardAdmins, ViewPublicSubmissions
        };

        public static readonly string[] WardAdminPermissions = new[]
        {
            ViewVoters, ExportVoters
        };
    }

    public static class UserStatus
    {
        public const string Active = "Active";
        public const string Inactive = "Inactive";
        public const string Blocked = "Blocked";
    }

    public static class AuditActions
    {
        public const string Login = "LOGIN";
        public const string Logout = "LOGOUT";
        public const string UserCreated = "USER_CREATED";
        public const string UserUpdated = "USER_UPDATED";
        public const string UserBlocked = "USER_BLOCKED";
        public const string UserEnabled = "USER_ENABLED";
        public const string WardCreated = "WARD_CREATED";
        public const string WardUpdated = "WARD_UPDATED";
        public const string VoterImport = "VOTER_IMPORT";
        public const string VoterExport = "VOTER_EXPORT";
        public const string InterestOptionCreated = "INTEREST_OPTION_CREATED";
        public const string PublicSubmission = "PUBLIC_SUBMISSION";
        public const string ContentChanged = "CONTENT_CHANGED";
        public const string PasswordChanged = "PASSWORD_CHANGED";
        public const string PasswordReset = "PASSWORD_RESET";
    }
}
