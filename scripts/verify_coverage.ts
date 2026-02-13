
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
    console.log(`Total lines: ${lines.length}`);

    TARGETS.forEach(target => {
        const found = lines.filter(l => l.includes(target));
        if (found.length > 0) {
            console.log(`[OK] ${target}: ${found.length} items`);
        } else {
            console.error(`[FAIL] ${target}: 0 items`);
        }
    });

} catch (e) {
    console.error(e);
}
