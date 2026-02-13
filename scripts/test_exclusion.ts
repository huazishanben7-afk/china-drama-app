
import { isChineseDrama } from './crawl_jcom';

const title = "[中] DEATH & DETAIL 事実は語る";
const result = isChineseDrama(title);

if (result === true) {
    console.log(`[PASS] Included because of positive indicator: ${title}`);
} else {
    console.error(`[FAIL] Wrongly excluded despite positive indicator: ${title}`);
    process.exit(1);
}

const title2 = "DEATH & DETAIL 事実は語る";
const result2 = isChineseDrama(title2);

if (result2 === false) {
    console.log(`[PASS] Excluded as expected without positive indicator: ${title2}`);
} else {
    console.error(`[FAIL] Logically should be excluded but was included: ${title2}`);
    process.exit(1);
}
