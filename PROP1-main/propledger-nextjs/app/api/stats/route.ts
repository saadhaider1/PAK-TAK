import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        console.log('Fetching stats from PHP backend...');

        // Fetch stats from PHP backend with no-cache
        const response = await fetch('http://localhost/PROPLEDGER/admin/get_stats.php', {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
            },
        });

        console.log('PHP response status:', response.status);

        if (!response.ok) {
            console.error('PHP backend returned error:', response.status);
            return NextResponse.json({
                success: true,
                stats: {
                    totalProperties: 0,
                    totalUsers: 0,
                    totalInvestments: 0,
                }
            });
        }

        const data = await response.json();
        console.log('Stats received from PHP:', data);

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Stats fetch error:', error);
        return NextResponse.json({
            success: true,
            stats: {
                totalProperties: 0,
                totalUsers: 0,
                totalInvestments: 0,
            }
        });
    }
}
