using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VotingInfo.Application.Interfaces;
using VotingInfo.Infrastructure.Authentication;
using VotingInfo.Infrastructure.Data;
using VotingInfo.Infrastructure.Services;

namespace VotingInfo.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
        {
            services.AddDbContext<AppDbContext>(opt =>
                opt.UseSqlServer(config.GetConnectionString("DefaultConnection")));

            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<IAuditService, AuditService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IWardService, WardService>();
            services.AddScoped<IVoterService, VoterService>();
            services.AddScoped<IVoterImportService, VoterImportService>();
            services.AddScoped<IInterestOptionService, InterestOptionService>();
            services.AddScoped<IPublicService, PublicService>();
            services.AddScoped<ISubmissionReportService, SubmissionReportService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IContentService, ContentService>();
            services.AddScoped<IGalleryService, GalleryService>();
            services.AddScoped<IFileStorageService, LocalFileStorageService>();
            services.AddScoped<ISmsService, ConsoleSmsService>();

            return services;
        }
    }
}
