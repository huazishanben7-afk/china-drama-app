
import { fetchJcomData } from './crawl_jcom';

async function verify() {
    console.log("Verifying J:COM blog links...");
    const schedules = await fetchJcomData();

    console.log(`Scoped ${schedules.length} items from J:COM crawler.`);

    const withBlogUrl = schedules.filter(s => s.blogUrl);
    console.log(`Items with blogUrl: ${withBlogUrl.length}`);

    if (withBlogUrl.length > 0) {
        console.log("Success! Found matches.");
        console.log("Sample matches:");
        withBlogUrl.slice(0, 5).forEach(s => {
            console.log(`- ${s.title} -> ${s.blogUrl}`);
        });
    } else {
        console.log("Warning: No blog URLs found. This might be due to no matching titles or logic error.");
        // Log some titles to debug matching
        console.log("Sample Titles from J:COM:");
        schedules.slice(0, 5).forEach(s => console.log(`- ${s.title}`));
    }
}

verify();
