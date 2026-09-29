using Microsoft.EntityFrameworkCore;
using VotingInfo.Domain.Entities;

namespace VotingInfo.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<UserWard> UserWards => Set<UserWard>();
        public DbSet<Ward> Wards => Set<Ward>();
        public DbSet<Voter> Voters => Set<Voter>();
        public DbSet<InterestOption> InterestOptions => Set<InterestOption>();
        public DbSet<PublicInterestSubmission> PublicInterestSubmissions => Set<PublicInterestSubmission>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<ContentItem> ContentItems => Set<ContentItem>();
        public DbSet<GalleryImage> GalleryImages => Set<GalleryImage>();
        public DbSet<ImportHistory> ImportHistories => Set<ImportHistory>();

        protected override void OnModelCreating(ModelBuilder mb)
        {
            // User
            mb.Entity<User>(e => {
                e.HasIndex(u => u.Username).IsUnique();
                e.HasQueryFilter(u => !u.IsDeleted);
                e.Property(u => u.Username).HasMaxLength(100);
                e.Property(u => u.Email).HasMaxLength(200);
                e.Property(u => u.Mobile).HasMaxLength(15);
            });

            // UserWard
            mb.Entity<UserWard>(e => {
                e.HasOne(uw => uw.User).WithMany(u => u.UserWards).HasForeignKey(uw => uw.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(uw => uw.Ward).WithMany(w => w.UserWards).HasForeignKey(uw => uw.WardId).OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(uw => new { uw.UserId, uw.WardId }).IsUnique();
            });

            // Ward
            mb.Entity<Ward>(e => {
                e.HasIndex(w => w.WardNumber).IsUnique();
                e.HasQueryFilter(w => !w.IsDeleted);
            });

            // Voter
            mb.Entity<Voter>(e => {
                e.HasIndex(v => v.EpicNumber).IsUnique();
                e.HasIndex(v => v.WardId);
                e.HasIndex(v => v.BoothNumber);
                e.HasIndex(v => v.Gender);
                e.HasIndex(v => v.Status);
                e.HasQueryFilter(v => !v.IsDeleted);
                e.HasOne(v => v.Ward).WithMany(w => w.Voters).HasForeignKey(v => v.WardId).OnDelete(DeleteBehavior.Restrict);
            });

            // InterestOption
            mb.Entity<InterestOption>(e => {
                e.HasQueryFilter(o => !o.IsDeleted);
            });

            // PublicInterestSubmission
            mb.Entity<PublicInterestSubmission>(e => {
                e.HasIndex(s => s.SessionId);
                e.HasIndex(s => s.MobileNumber);
                e.HasIndex(s => s.CreatedAt);
                e.HasOne(s => s.InterestOption).WithMany(o => o.Submissions).HasForeignKey(s => s.InterestOptionId).OnDelete(DeleteBehavior.Restrict);
            });

            // AuditLog
            mb.Entity<AuditLog>(e => {
                e.HasIndex(a => a.CreatedAt);
                e.HasOne(a => a.User).WithMany(u => u.AuditLogs).HasForeignKey(a => a.UserId).IsRequired(false).OnDelete(DeleteBehavior.SetNull);
            });

            // ContentItem
            mb.Entity<ContentItem>(e => {
                e.HasIndex(c => c.Key).IsUnique();
            });

            // GalleryImage
            mb.Entity<GalleryImage>(e => {
                e.HasQueryFilter(g => !g.IsDeleted);
            });
        }
    }
}
