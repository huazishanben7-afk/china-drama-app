
import axios from 'axios';
import * as fs from 'fs';

const URL = 'https://www2.myjcom.jp/special/tv/hualiu/common2022/js/scripts.js';

async function downloadScript() {
    try {
        const response = await axios.get(URL);
        fs.writeFileSync('scripts.js', response.data);
        console.log('Downloaded scripts.js');
    } catch (e) {
        console.error(e);
    }
}

downloadScript();
