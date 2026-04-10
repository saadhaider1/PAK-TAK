import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper to parse metadata from description
function parseMetadata(description: string) {
    const result: any = {};

    // Parse METADATA
    const metadataRegex = /\[METADATA\]([\s\S]*?)\[\/METADATA\]/;
    const metaMatch = description?.match(metadataRegex);
    if (metaMatch && metaMatch[1]) {
        try {
            const meta = JSON.parse(metaMatch[1]);
            Object.assign(result, meta);
        } catch (e) {
            console.error('Error parsing metadata:', e);
        }
    }

    // Parse DOCUMENTS
    const docsRegex = /\[DOCUMENTS\]([\s\S]*?)\[\/DOCUMENTS\]/;
    const docsMatch = description?.match(docsRegex);
    if (docsMatch && docsMatch[1]) {
        try {
            result.documents = JSON.parse(docsMatch[1]);
        } catch (e) {
            console.error('Error parsing documents:', e);
        }
    }

    return Object.keys(result).length > 0 ? result : null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid property ID' },
                { status: 400 }
            );
        }

        const property = await db.getPropertyById(id);

        if (!property) {
            return NextResponse.json(
                { success: false, message: 'Property not found' },
                { status: 404 }
            );
        }

        // Parse metadata from description
        const metadata = parseMetadata(property.description || '');
        // Clean description for frontend (remove metadata tags)
        const description = (property.description || '')
            .replace(/\[METADATA\][\s\S]*?\[\/METADATA\]/, '')
            .replace(/\[DOCUMENTS\][\s\S]*?\[\/DOCUMENTS\]/, '')
            .trim();

        const enrichedProperty = {
            ...property,
            description, // cleaned description
            ...(metadata || {}), // spread returns, duration, documents, etc.
            documents: metadata?.documents || [] // ensure documents is always an array
        };

        return NextResponse.json({
            success: true,
            property: enrichedProperty
        });

    } catch (error) {
        console.error('Get property error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to fetch property' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid property ID' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const property = await db.updateProperty(id, body);

        return NextResponse.json({
            success: true,
            property,
            message: 'Property updated successfully'
        });

    } catch (error) {
        console.error('Update property error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to update property' },
            { status: 500 }
        );
    }
}
