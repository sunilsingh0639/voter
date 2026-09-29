using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using VotingInfo.Application.Interfaces;

namespace VotingInfo.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _basePath;
        private readonly string _baseUrl;

        public LocalFileStorageService(IConfiguration config)
        {
            _basePath = config["FileStorage:BasePath"] ?? "wwwroot/uploads";
            _baseUrl = config["FileStorage:BaseUrl"] ?? "/uploads";
        }

        public async Task<string> SaveImageAsync(IFormFile file, string folder)
        {
            var dir = Path.Combine(_basePath, folder);
            Directory.CreateDirectory(dir);
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            if (!Array.Exists(allowed, e => e == ext))
                throw new InvalidOperationException("Invalid image type");
            var fileName = $"{Guid.NewGuid()}{ext}";
            var path = Path.Combine(dir, fileName);
            using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);
            return $"{_baseUrl}/{folder}/{fileName}";
        }

        public void DeleteImage(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl)) return;
            var relative = imageUrl.Replace(_baseUrl, _basePath.Replace("\\", "/"));
            var path = relative.Replace("/", Path.DirectorySeparatorChar.ToString());
            if (File.Exists(path)) File.Delete(path);
        }
    }

    public class ConsoleSmsService : ISmsService
    {
        public Task<bool> SendOtpAsync(string mobileNumber, string otp)
        {
            Console.WriteLine($"[SMS] To: {mobileNumber} OTP: {otp}");
            return Task.FromResult(true);
        }
    }
}
