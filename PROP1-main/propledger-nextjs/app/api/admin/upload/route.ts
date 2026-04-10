import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fileType = formData.get('type') as string || 'image'; // 'image' or 'document'

        if (!file) {
            return NextResponse.json({
                success: false,
                message: 'No file uploaded'
            }, { status: 400 });
        }

        // Define valid types based on file category
        let validTypes: string[];
        let uploadFolder: string;
        let maxSize: number;

        if (fileType === 'document') {
            validTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain'
            ];
            uploadFolder = 'documents';
            maxSize = 10 * 1024 * 1024; // 10MB for documents
        } else {
            validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
            uploadFolder = 'properties';
            maxSize = 5 * 1024 * 1024; // 5MB for images
        }

        // Validate file type
        if (!validTypes.includes(file.type)) {
            const allowedFormats = fileType === 'document'
                ? 'PDF, DOC, DOCX, XLS, XLSX, TXT'
                : 'JPEG, PNG, WebP, GIF';
            return NextResponse.json({
                success: false,
                message: `Invalid file type. Allowed: ${allowedFormats}`
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            return NextResponse.json({
                success: false,
                message: `File too large. Maximum size is ${maxSizeMB}MB`
            }, { status: 400 });
        }

        // Create unique filename
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const extension = file.name.split('.').pop() || (fileType === 'document' ? 'pdf' : 'jpg');
        const filename = `${fileType === 'document' ? 'doc' : 'property'}_${timestamp}.${extension}`;

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), 'public', 'uploads', uploadFolder);
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        const filepath = join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Return the public URL
        const fileUrl = `/uploads/${uploadFolder}/${filename}`;

        return NextResponse.json({
            success: true,
            url: fileUrl,
            filename: filename,
            originalName: file.name,
            fileType: fileType,
            message: `${fileType === 'document' ? 'Document' : 'Image'} uploaded successfully`
        });

    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to upload file'
        }, { status: 500 });
    }
}
