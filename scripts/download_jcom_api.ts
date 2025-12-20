
import axios from 'axios';
import * as fs from 'fs';

const URL = 'https://www2.myjcom.jp/special/common/js/jcom_api.js';

async function downloadApiScript() {
    try {
        const response = await axios.get(URL);
        fs.writeFileSync('jcom_api.js', response.data);
        console.log('Downloaded jcom_api.js');
    } catch (e) {
        console.error(e);
    }
}

downloadApiScript();
