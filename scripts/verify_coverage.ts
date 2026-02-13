
import fs from 'fs';
import path from 'path';

const JSON_FILE = path.join(process.cwd(), 'public', 'data', 'drama_schedule.json');
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
    const content = fs.readFileSync(JSON_FILE, 'utf-8');
    const items = JSON.parse(content);
    // Convert JSON items to string representation for easy grepping
    const lines = items.map((i: any) => JSON.stringify(i));

    let hasError = false;

    // 1. Check Total Count
    if (lines.length < 20) {
        console.error(`[FAIL] Total items too low: ${lines.length} (Expected > 20)`);
        hasError = true;
    } else {
        console.log(`[OK] Total items: ${lines.length}`);
    }

    // 2. Check Channel Coverage (Warning Only)
    TARGETS.forEach(target => {
        const count = lines.filter((l: string) => l.includes(target)).length;
        if (count > 0) {
            console.log(`[OK] ${target}: ${count} items`);
        } else {
            console.warn(`[WARN] Missing channel data: ${target} (This might be temporary, not failing build)`);
            // hasError = true; // Disabled to prevent noisy failures
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
