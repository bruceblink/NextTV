import { NextResponse } from 'next/server';
import { initDatabaseOnce } from '@/app/lib/initDB';

export async function GET() {
    try {
        // 调用“一步到位”初始化函数
        await initDatabaseOnce();

        return NextResponse.json({ message: 'Database seeded successfully' });
    } catch (error) {
        console.error('Seed API error:', error);
        return NextResponse.json({ error: (error as any).message || error }, { status: 500 });
    }
}