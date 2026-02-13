
import fs from 'fs';
import path from 'path';

const CSV_FILE = path.join(process.cwd(), 'public', 'data', 'schedule.csv');

const TARGETS = [
    'WOWOW',
    '衛星劇場',
    'チャンネル銀河',
    'LaLa',
    'アジアドラマ',
    'ホームドラマ',
    'BS11',
    'BS12',
    'J:COM',
    '日テレプラス'
];

try {
    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n');
    let hasError = false;

    // 1. Check Total Count
    if (lines.length < 50) {
        console.error(`[FAIL] Total items too low: ${lines.length} (Expected > 50)`);
        hasError = true;
    } else {
        console.log(`[OK] Total items: ${lines.length}`);
    }

    // 2. Check Channel Coverage
    TARGETS.forEach(target => {
        // Simple string match might be too loose, but let's start with it.
        // Ideally we parse CSV, but grep-like check is robust enough for "presence".
        const count = lines.filter(l => l.includes(target)).length;
        if (count > 0) {
            console.log(`[OK] ${target}: ${count} items`);
        } else {
            console.error(`[FAIL] Missing channel data: ${target}`);
            hasError = true;
        }
    });

    if (hasError) {
        console.error('Data verification failed.');
        process.exit(1);
    } else {
        console.log('Data verification passed.');
        process.exit(0);
    }

} catch (e) {
    console.error('Verification script failed:', e);
    process.exit(1);
}
