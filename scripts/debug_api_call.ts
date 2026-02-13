
import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    try {
        console.log('Navigating to home...');
        await page.goto('https://www.dimora.jp/', { waitUntil: 'networkidle2' });

        console.log('Clicking Genre Search to load scripts...');
        const genreBtn = await page.waitForSelector('a[title="ジャンル別番組検索"]');
        if (genreBtn) await genreBtn.click();
        await new Promise(r => setTimeout(r, 5000));

        const result = await page.evaluate(() => {
            // Replicate logic to build params
            let n = "", p = "", a = "", b = "";
            let k, h = 0;
            for (k = 0; k < 10; k++) { n += "&kwin" + k + "="; if (h < 10) { p += "&kwin_ter" + k + "="; } }
            for (k = 0; k < 5; k++) { a += "&kwout" + h + "="; if (h < 5) { b += "&kwout_ter" + h + "="; } }

            // Determine ch_type for BS
            // Assume broada4 is BS.
            let c = 0;
            try {
                // @ts-ignore
                if (typeof PubFncString !== 'undefined') {
                    // @ts-ignore
                    c = parseInt(PubFncString.getNumber("broada4"));
                } else {
                    c = 4; // Fallback guess
                }
            } catch (e) { c = 4; }

            // Allow override to verify logic
            if (isNaN(c) || c === 0) c = 4;

            // Adding BS(4) and maybe CS(8)? Let's stick to 4 for now (BS).
            // Actually, usually these enable everything selected.
            // Let's force c = 12 (4+8) ? Or just 4. 
            // In the original code it sums them up.

            console.log('Using ch_type:', c);

            let l = "&kw_num=" + n + a + p + b + "&ch_type=" + c + "&sr_type=";
            l += "&BRTABLED=&BRTABLEB=&BRTABLEC=";
            // genre_Nm=31 (Overseas Drama)
            // isLogin=1 (Hardcoded in original script)
            // @ts-ignore
            const isLoginVal = (typeof isLogin !== 'undefined') ? isLogin : "1";
            l += "&genre_Nm=31&rebroad=&start_time=&end_time=&br_strtime=&br_endtime=&max_num=1000&isLogin=" + isLoginVal;

            console.log('Payload:', l);

            // Execute callIF2
            // @ts-ignore
            if (typeof callIF2 === 'function') {
                // @ts-ignore
                const response = callIF2("searchKW", l);
                return { status: 'Success', data: response, ch_type_used: c };
            } else {
                return { status: 'Error', data: 'callIF2 not found' };
            }
        });

        console.log('--- API Call Result ---');
        console.log('Status:', result.status);
        console.log('Channel Type Used:', result.ch_type_used);
        if (result.data) {
            console.log('Data Length:', result.data.length);
            console.log('Sample Data (First 200 chars):', result.data.substring(0, 200));
        }
        console.log('-----------------------');

    } catch (e) { console.error(e); }

    await browser.close();
})();
