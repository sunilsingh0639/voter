using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VotingInfo.Domain.Constants;
using VotingInfo.Domain.Entities;

namespace VotingInfo.Infrastructure.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(AppDbContext db)
        {
            await db.Database.MigrateAsync();

            // Seed wards
            if (!await db.Wards.IgnoreQueryFilters().AnyAsync())
            {
                var wards = Enumerable.Range(1, 10).Select(i => new Ward
                {
                    WardNumber = i.ToString(),
                    WardNameHindi = $"वार्ड {i}",
                    WardNameEnglish = $"Ward {i}",
                    Status = "Active"
                }).ToList();
                db.Wards.AddRange(wards);
                await db.SaveChangesAsync();
            }

            // Seed super admin
            if (!await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Role == Roles.SuperAdmin))
            {
                var superAdmin = new User
                {
                    Name = "Super Admin",
                    Username = "superadmin",
                    Email = "superadmin@village.local",
                    Mobile = "9999999999",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = Roles.SuperAdmin,
                    Status = UserStatus.Active
                };
                db.Users.Add(superAdmin);
                await db.SaveChangesAsync();
            }

            // Seed interest options
            if (!await db.InterestOptions.IgnoreQueryFilters().AnyAsync())
            {
                db.InterestOptions.AddRange(
                    new InterestOption { NameHindi = "उम्मीदवार A", NameEnglish = "Candidate A", DisplayOrder = 1 },
                    new InterestOption { NameHindi = "उम्मीदवार B", NameEnglish = "Candidate B", DisplayOrder = 2 },
                    new InterestOption { NameHindi = "उम्मीदवार C", NameEnglish = "Candidate C", DisplayOrder = 3 },
                    new InterestOption { NameHindi = "अन्य", NameEnglish = "Other", DisplayOrder = 4 }
                );
                await db.SaveChangesAsync();
            }

            // Seed content items
            if (!await db.ContentItems.AnyAsync())
            {
                var items = new List<ContentItem>
                {
                    new() { Key = "hero_title", ValueHindi = "ग्राम सूचना पोर्टल", ValueEnglish = "Village Information Portal", Type = "text" },
                    new() { Key = "hero_subtitle", ValueHindi = "आपके गाँव की जानकारी, एक जगह", ValueEnglish = "Your village information, all in one place", Type = "text" },
                    new() { Key = "about_text", ValueHindi = "यह पोर्टल आपके गाँव की सभी महत्वपूर्ण जानकारी प्रदान करता है।", ValueEnglish = "This portal provides all important information about your village.", Type = "text" },
                    new() { Key = "contact_info", ValueHindi = "ग्राम पंचायत कार्यालय, संपर्क: 9999999999", ValueEnglish = "Gram Panchayat Office, Contact: 9999999999", Type = "text" },
                    new() { Key = "popup_title", ValueHindi = "आप किसे पसंद करते हैं?", ValueEnglish = "Who do you prefer?", Type = "text" },
                };
                db.ContentItems.AddRange(items);
                await db.SaveChangesAsync();
            }
        }
    }
}
