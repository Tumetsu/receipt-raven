# Uploads Directory Cleanup

This document describes the automatic cleanup system for managing disk space usage in the uploads directory.

## Overview

Receipt Raven includes an automatic cleanup system that prevents the uploads directory from consuming unlimited disk space. When configured, the system automatically deletes the oldest uploaded files to keep total disk usage below a specified limit.

## Features

- **Configurable disk limit**: Set maximum disk space (e.g., 1GB, 500MB)
- **Automatic cleanup**: Runs on server startup, after each upload, and periodically
- **Non-blocking**: Cleanup after uploads runs asynchronously (doesn't slow down upload response)
- **Smart deletion**: Deletes oldest files first based on modification time
- **Comprehensive logging**: All cleanup operations are logged for monitoring
- **Optional**: Cleanup is only enabled when configured

## Configuration

Configure the cleanup system using environment variables in your `.env` file:

```bash
# Maximum disk space for uploads directory
# Supported formats: "1GB", "500MB", "2.5GB", "100MB", etc.
# Leave empty or comment out to disable automatic cleanup
MAX_UPLOADS_DISK_SIZE=1GB

# How often to run periodic cleanup (in hours)
# Default: 24 (once per day)
CLEANUP_INTERVAL_HOURS=24
```

### Example Configurations

**Small deployment (500MB limit):**
```bash
MAX_UPLOADS_DISK_SIZE=500MB
CLEANUP_INTERVAL_HOURS=12
```

**Medium deployment (2GB limit):**
```bash
MAX_UPLOADS_DISK_SIZE=2GB
CLEANUP_INTERVAL_HOURS=24
```

**Large deployment (10GB limit):**
```bash
MAX_UPLOADS_DISK_SIZE=10GB
CLEANUP_INTERVAL_HOURS=48
```

**Disabled (no automatic cleanup):**
```bash
# MAX_UPLOADS_DISK_SIZE=
# CLEANUP_INTERVAL_HOURS=24
```

## How It Works

The cleanup system operates in three modes:

### 1. On Server Startup
- Runs immediately when the server starts
- Cleans up any excess files from previous sessions
- Ensures you start with a clean state

### 2. After Each Upload (Async)
- Triggers automatically after each successful file upload
- Runs in the background (doesn't block the upload response)
- Provides responsive cleanup without affecting user experience

### 3. Periodic Cleanup
- Runs at regular intervals (configured via `CLEANUP_INTERVAL_HOURS`)
- Acts as a safety net to catch any edge cases
- Default: once per day

### Cleanup Process

When cleanup runs:

1. **Check if needed**: Scans uploads directory and calculates total size
2. **Skip if under limit**: If total size ≤ configured limit, no action taken
3. **Sort by age**: If over limit, sorts all files by modification time (oldest first)
4. **Delete oldest files**: Removes files one by one until total size is under limit
5. **Log results**: Reports files deleted, space freed, and final size

## File Deletion Order

Files are deleted based on **modification time** (oldest first):
- The file that was modified longest ago is deleted first
- Continues deleting oldest files until under the limit
- More recent uploads are preserved

## Database Consistency

**Important Note**: The current implementation does not update database references when deleting files. This means:

- The `receipts` table may reference files that no longer exist
- This is intentional for the initial implementation
- Future versions may add database cleanup or soft-deletion

**Recommendation**: Set your disk limit high enough to keep files for your typical use case. For example:
- If you process ~100 receipts/month at ~2MB each, use at least 500MB-1GB
- This ensures recent receipts remain accessible

## Monitoring

The cleanup system provides detailed logging:

```
[INFO] Cleanup scheduler enabled: max size 1GB, checking every 24h
[INFO] Running initial cleanup on startup...
[INFO] Total size 1.2GB exceeds limit 1GB, starting cleanup
[INFO] Deleted old file: 1698765432123-receipt.jpg (2.5MB)
[INFO] Deleted old file: 1698765434567-receipt.png (1.8MB)
[INFO] Cleanup complete: deleted 2 files, freed 4.3MB, size reduced from 1.2GB to 1.19GB
[INFO] Background cleanup completed: 2 files deleted
```

**Log Levels:**
- `INFO`: Normal operations (cleanup running, files deleted)
- `WARN`: Non-critical issues (invalid config, file access errors)
- `ERROR`: Critical failures (directory access issues)
- `DEBUG`: Detailed information (no cleanup needed, directory doesn't exist)

## Performance Impact

The cleanup system is designed for minimal performance impact:

- **Upload response time**: Not affected (cleanup runs async after response sent)
- **Startup time**: Minimal delay (~100-500ms for typical directories)
- **Background CPU**: Very low (only runs periodically)
- **Disk I/O**: Low (only when cleanup is needed)

**Typical cleanup performance:**
- 1000 files: ~100-200ms to scan and analyze
- Deletion: ~10-50ms per file
- Total: Usually completes in under 1 second

## Troubleshooting

### Cleanup Not Running

**Check environment variables:**
```bash
# In your .env file, ensure MAX_UPLOADS_DISK_SIZE is set
MAX_UPLOADS_DISK_SIZE=1GB
```

**Check logs on startup:**
```
[INFO] Cleanup scheduler enabled: max size 1GB, checking every 24h
```

If you see:
```
[INFO] MAX_UPLOADS_DISK_SIZE not configured, cleanup scheduler disabled
```
Then the environment variable is not set.

### Invalid Format Error

If you see:
```
[WARN] Invalid MAX_UPLOADS_DISK_SIZE format: 1G. Expected format: "1GB", "500MB", etc.
```

**Valid formats:**
- ✅ `1GB`, `500MB`, `2.5GB`, `100KB`
- ❌ `1G`, `500M`, `1 GB`, `1gb` (case-sensitive)

### Files Not Being Deleted

**Possible reasons:**
1. Total size is still under limit (check logs)
2. File permissions issue (cleanup will log warnings)
3. Files are very recent and limit is very tight

**Check actual directory size:**
```bash
du -sh ./uploads
```

## Migration and Cleanup

If you're enabling cleanup on an existing installation with many files:

1. **Check current size:**
   ```bash
   du -sh ./uploads
   ```

2. **Set appropriate limit** (higher than current size if you want to keep existing files)

3. **Start server** - cleanup runs on startup

4. **Monitor logs** to see what was deleted

5. **Adjust limit** if needed

## Best Practices

1. **Set realistic limits**: Account for your typical usage patterns
2. **Monitor disk space**: Check logs regularly to ensure cleanup is working
3. **Consider retention**: Set limit high enough for your typical data retention needs
4. **Test configuration**: Try different limits in development before production
5. **Plan for growth**: Leave headroom for usage spikes

## API Impact

The cleanup system has no impact on the API:
- No new endpoints
- No changes to request/response formats
- Upload endpoint behavior unchanged (just faster with async cleanup)

## Docker Deployment

When using Docker, the uploads directory is typically mounted as a volume:

```yaml
volumes:
  - ./uploads:/app/uploads
```

**Important**: The cleanup manages the directory inside the container. Ensure:
- Volume permissions are correct (container can write/delete)
- Your host has sufficient disk space
- Disk limit matches your host capacity

## Future Enhancements

Potential improvements for future versions:

- [ ] Database reference cleanup (mark receipts as "file deleted")
- [ ] Configurable cleanup strategy (by age, by usage, etc.)
- [ ] Cleanup metrics endpoint (`/api/cleanup/stats`)
- [ ] Manual cleanup trigger endpoint (`POST /api/cleanup/run`)
- [ ] Notification on cleanup (webhook, email)
- [ ] Graduated retention (delete old files more aggressively)
- [ ] Archive to S3/object storage before deletion

## FAQ

**Q: Will my receipts be deleted?**
A: Yes, the oldest uploaded files will be deleted when the disk limit is exceeded. This is intentional to prevent unlimited disk growth.

**Q: Can I recover deleted files?**
A: No, deletions are permanent. Plan your disk limit accordingly.

**Q: Should I disable cleanup in production?**
A: Generally no - cleanup prevents disk space issues. Set a high limit if you need long retention.

**Q: What happens to database records when files are deleted?**
A: Currently, database records remain unchanged. They may reference non-existent files.

**Q: Can I manually clean up old files?**
A: Yes, you can delete files from the uploads directory manually. The database cleanup feature is planned for a future release.

**Q: How do I disable cleanup temporarily?**
A: Comment out or remove `MAX_UPLOADS_DISK_SIZE` from your `.env` file and restart the server.
