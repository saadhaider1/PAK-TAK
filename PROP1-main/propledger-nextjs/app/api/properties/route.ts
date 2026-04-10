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

export async function GET() {
    try {
        const properties = await db.getProperties();

        // Parse metadata for each property
        const enrichedProperties = properties.map(prop => {
            const metadata = parseMetadata(prop.description || '');
            // Clean description for frontend (remove metadata tags)
            const description = (prop.description || '')
                .replace(/\[METADATA\][\s\S]*?\[\/METADATA\]/, '')
                .replace(/\[DOCUMENTS\][\s\S]*?\[\/DOCUMENTS\]/, '')
                .trim();

            return {
                ...prop,
                description, // cleaned description
                ...(metadata || {}), // spread returns, duration, documents, etc.
                documents: metadata?.documents || [] // ensure documents is always an array
            };
        });

        return NextResponse.json({
            success: true,
            properties: enrichedProperties,
            count: enrichedProperties.length
        });

    } catch (error) {
        console.error('Get properties error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to fetch properties' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const requiredFields = ['title', 'location', 'price', 'token_price', 'total_tokens', 'property_type', 'owner_id'];
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { success: false, message: `${field} is required` },
                    { status: 400 }
                );
            }
        }

        // Set available_tokens to total_tokens if not provided
        if (!body.available_tokens) {
            body.available_tokens = body.total_tokens;
        }

        // Set is_active to true by default
        if (body.is_active === undefined) {
            body.is_active = true;
        }

        const property = await db.createProperty(body);

        return NextResponse.json({
            success: true,
            property,
            message: 'Property created successfully'
        });

    } catch (error) {
        console.error('Create property error:', error);
        return NextResponse.json(
            { success: false, message: error instanceof Error ? error.message : 'Failed to create property' },
            { status: 500 }
        );
    }
}
