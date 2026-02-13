
import axios from 'axios';
import * as cheerio from 'cheerio';

const URL = 'https://bangumi.org/epg/bs?broad_cast_date=20251229';

async function run() {
    try {
        console.log(`Fetching ${URL}...`);
        const res = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);

        // 1. チャンネルヘッダー周辺の解析
        console.log('--- Channel Header Parsing ---');
        // li.station_line とか .station_area とかを探す
        // 画像が含まれている場所を探す
        $('img').slice(0, 10).each((i, el) => {
            console.log(`Img[${i}]: src=${$(el).attr('src')}, alt=${$(el).attr('alt')}, parentClass=${$(el).parent().attr('class')}`);
        });

        // テキストでBS11を探す
        const bs11 = $('*:contains("BS11")').first();
        if (bs11.length) {
            console.log(`BS11 found in tag: ${bs11.prop('tagName')}, Class: ${bs11.attr('class')}`);
            console.log(`Parent: ${bs11.parent().prop('tagName')}, Class: ${bs11.parent().attr('class')}`);
            console.log(`GrandParent: ${bs11.parent().parent().prop('tagName')}, Class: ${bs11.parent().parent().attr('class')}`);
        }

        // 2. 番組セルの詳細解析
        console.log('--- Program Cell Parsing ---');
        // 最初の列の最初の3つの番組
        const col1 = $('#program_line_1 .program_text').slice(0, 3);
        col1.each((i, el) => {
            const $p = $(el);
            console.log(`\nProgram[${i}]:`);
            console.log(`Title: ${$p.find('.program_title').text().trim()}`);
            console.log(`Detail: ${$p.find('.program_detail').text().trim()}`);
            console.log(`Time Class: ${$p.parent().find('.program_time').attr('class')}`);
            console.log(`Time Text: ${$p.parent().find('.program_time').text().replace(/\s+/g, ' ')}`);
            console.log(`Full HTML: ${$p.parent().html()?.substring(0, 200)}...`);
        });

    } catch (e: any) {
        console.error(e.message);
    }
}

run();
