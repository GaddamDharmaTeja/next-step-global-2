# GridFS Image Storage

Images and uploaded documents are now stored in MongoDB GridFS instead of the local `uploads/` folder.

## Runtime Requirements

- `MONGODB_URI` must be configured in every environment that accepts uploads.
- `MONGODB_DB` should point to the app database.
- `GRIDFS_BUCKET` is optional. If omitted, the bucket name is `uploads`, creating `uploads.files` and `uploads.chunks`.

## Upload Flow

- Admin upload APIs receive base64 upload payloads from the current frontend.
- The server validates file type and size.
- Files are written to GridFS through the existing MongoDB connection.
- API responses return usable URLs like `/api/images/<ObjectId>`.
- Frontend image rendering continues to use normal image URLs.

## Image Serving

Images and uploaded documents are served through:

```txt
GET /api/images/:id
```

The route validates ObjectIds, streams from GridFS, sets the stored content type, and returns `404` for missing files.

## One-Time Migration

Run the migration only after MongoDB is configured and the app can connect successfully:

```bash
npm run check:mongo
npm run migrate:uploads-gridfs
```

The migration scans stored data for legacy `/uploads/...` URLs, uploads existing files into GridFS, replaces those stored paths with `/api/images/<ObjectId>`, and deletes each local file only after that file is uploaded and the URL replacement succeeds. Missing files are skipped and reported.

## Deployment Notes

- Do not rely on persistent local disk for uploads.
- The `uploads/` directory is only needed temporarily until the migration has run.
- Legacy `/uploads/...` URLs are served read-only as a compatibility fallback until migration is complete.
- Back up the database and the legacy `uploads/` folder before running the migration in production.
- After migration, new uploads no longer need `uploads/` to exist.
