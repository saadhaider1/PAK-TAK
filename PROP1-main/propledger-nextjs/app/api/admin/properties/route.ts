import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Helper to parse metadata from description
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

    // Fallback for old format (Returns: X | Duration: Y) - Only if not in METADATA
    const legacyMetadata: any = {};
    if (!result.returns && description?.includes('Returns:')) {
        const returnsMatch = description.match(/Returns:\s*([^|]*)/);
        if (returnsMatch) legacyMetadata.returns = returnsMatch[1].trim();
    }
    if (!result.duration && description?.includes('Duration:')) {
        const durationMatch = description.match(/Duration:\s*([^|]*)/);
        if (durationMatch) legacyMetadata.duration = durationMatch[1].trim();
    }
    if (!result.min_investment && description?.includes('Min Investment:')) {
        const minMatch = description.match(/Min Investment:\s*PKR\s*([^|]*)/);
        if (minMatch) {
            const val = minMatch[1].trim().replace(/,/g, '');
            legacyMetadata.min_investment = parseFloat(val);
        }
    }

    Object.assign(result, legacyMetadata);
    return Object.keys(result).length > 0 ? result : null;
}

// Helper to format description with metadata
function formatDescriptionWithMetadata(description: string, metadata: any) {
    // Remove existing metadata block
    let cleanDescription = description.replace(/\[METADATA\][\s\S]*?\[\/METADATA\]/, '').trim();

    // Remove legacy metadata patterns if we are updating
    cleanDescription = cleanDescription
        .replace(/Returns:[^|]*\|?/g, '')
        .replace(/Duration:[^|]*\|?/g, '')
        .replace(/Min Investment: PKR[^|]*\|?/g, '') // Fixed pattern
        .trim();

    // Clean up any trailing/leading whitespace or pipes left over
    cleanDescription = cleanDescription.replace(/\|\s*$/g, '').trim();

    if (Object.keys(metadata).length > 0) {
        return cleanDescription + '\n\n[METADATA]' + JSON.stringify(metadata) + '[/METADATA]';
    }
    return cleanDescription;
}

// GET - Fetch all properties for admin (including inactive)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyType = searchParams.get('property_type');

        const supabase = createSupabaseAdminClient();

        let query = supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter by property_type if specified
        if (propertyType && propertyType !== 'all') {
            // Map listing_type to property_type filter
            if (propertyType === 'investment') {
                query = query.in('property_type', ['commercial', 'mixed']);
            } else if (propertyType === 'crowdfunding') {
                query = query.eq('property_type', 'land');
            } else if (propertyType === 'property') {
                query = query.in('property_type', ['residential', 'industrial']);
            }
        }

        const { data: properties, error } = await query;

        if (error) {
            console.error('Error fetching properties:', error);
            return NextResponse.json({
                success: false,
                message: error.message
            }, { status: 500 });
        }

        // Parse metadata for each property
        const enrichedProperties = properties?.map(prop => {
            const metadata = parseMetadata(prop.description);
            // Clean description for frontend (Optional: remove metadata tag)
            const description = prop.description
                .replace(/\[METADATA\][\s\S]*?\[\/METADATA\]/, '')
                .replace(/\[DOCUMENTS\][\s\S]*?\[\/DOCUMENTS\]/, '')
                .trim();

            return {
                ...prop,
                description, // cleaned description
                ...metadata // spread returns, duration, risk_level, etc.
            };
        });

        return NextResponse.json({
            success: true,
            properties: enrichedProperties || [],
            count: enrichedProperties?.length || 0
        });

    } catch (error) {
        console.error('Admin properties GET error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch properties'
        }, { status: 500 });
    }
}

// POST - Create new property
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields (only use columns that exist in DB)
        const requiredFields = ['title', 'location', 'property_type'];
        for (const field of requiredFields) {
            if (body[field] === undefined || body[field] === null || body[field] === '') {
                return NextResponse.json({
                    success: false,
                    message: `${field} is required`
                }, { status: 400 });
            }
        }
        // price must be present (0 is valid)
        if (body.price === undefined || body.price === null || body.price === '') {
            return NextResponse.json({ success: false, message: 'price is required' }, { status: 400 });
        }

        const supabase = createSupabaseAdminClient();

        // Build metadata object
        const metadata: any = {};
        if (body.returns) metadata.returns = body.returns;
        if (body.duration) metadata.duration = body.duration;
        if (body.min_investment) metadata.min_investment = body.min_investment;
        if (body.risk_level) metadata.risk_level = body.risk_level;
        if (body.payment_schedule) metadata.payment_schedule = body.payment_schedule;
        if (body.key_features) metadata.key_features = body.key_features;

        // Format description with metadata
        const description = formatDescriptionWithMetadata(body.description || '', metadata);

        // Get first user ID for owner_id (foreign key). Non-fatal if not found.
        const { data: users } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .single();

        const propertyData: Record<string, any> = {
            title: body.title,
            description: description,
            location: body.location,
            price: parseFloat(body.price) || 0,
            token_price: parseFloat(body.token_price) || 100,
            total_tokens: parseInt(body.total_tokens) || 1000,
            available_tokens: parseInt(body.available_tokens) || parseInt(body.total_tokens) || 1000,
            property_type: body.property_type,
            owner_id: users?.id ?? null,
            image_url: body.image_url || '',
            is_active: true
        };

        const { data: property, error } = await supabase
            .from('properties')
            .insert([propertyData])
            .select()
            .single();

        if (error) {
            console.error('Error creating property:', error);
            return NextResponse.json({
                success: false,
                message: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            property,
            message: 'Property created successfully'
        });

    } catch (error) {
        console.error('Admin properties POST error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to create property'
        }, { status: 500 });
    }
}

// PUT - Update existing property
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.id) {
            return NextResponse.json({
                success: false,
                message: 'Property ID is required'
            }, { status: 400 });
        }

        const supabase = createSupabaseAdminClient();

        // Build update object - only use existing DB columns
        const updates: Record<string, any> = {
            updated_at: new Date().toISOString()
        };

        // Only include fields that exist in the database
        const allowedFields = [
            'title', 'location', 'price', 'token_price',
            'total_tokens', 'available_tokens', 'property_type',
            'image_url', 'is_active'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (['price', 'token_price'].includes(field)) {
                    updates[field] = parseFloat(body[field]) || 0;
                } else if (['total_tokens', 'available_tokens'].includes(field)) {
                    updates[field] = parseInt(body[field]) || 0;
                } else if (field === 'is_active') {
                    updates[field] = Boolean(body[field]);
                } else {
                    updates[field] = body[field];
                }
            }
        }

        // Handle description with metadata
        const metadata: any = {};
        if (body.returns) metadata.returns = body.returns;
        if (body.duration) metadata.duration = body.duration;
        if (body.min_investment) metadata.min_investment = body.min_investment;
        if (body.risk_level) metadata.risk_level = body.risk_level;
        if (body.payment_schedule) metadata.payment_schedule = body.payment_schedule;
        if (body.key_features) metadata.key_features = body.key_features;

        if (body.description !== undefined || Object.keys(metadata).length > 0) {
            // If description is provided, us it, else fetch existing? 
            // Ideally the PUT body has the current description. 
            // If body.description is missing, we might overwrite it with empty string + metadata if we are not careful.
            // But usually PUT sends full object. Code below assumes body.description is present if we are updating it.

            const descToUse = body.description || '';
            updates.description = formatDescriptionWithMetadata(descToUse, metadata);
        }

        const { data: property, error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', body.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating property:', error);
            return NextResponse.json({
                success: false,
                message: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            property,
            message: 'Property updated successfully'
        });

    } catch (error) {
        console.error('Admin properties PUT error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to update property'
        }, { status: 500 });
    }
}

// DELETE - Soft delete property
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({
                success: false,
                message: 'Property ID is required'
            }, { status: 400 });
        }

        const supabase = createSupabaseAdminClient();

        // Soft delete - set is_active to false
        const { error } = await supabase
            .from('properties')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', parseInt(id));

        if (error) {
            console.error('Error deleting property:', error);
            return NextResponse.json({
                success: false,
                message: error.message
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Property deleted successfully'
        });

    } catch (error) {
        console.error('Admin properties DELETE error:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to delete property'
        }, { status: 500 });
    }
}
