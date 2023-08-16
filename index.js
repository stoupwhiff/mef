require('dotenv').config();

const express = require('express');
const cors = require('cors');
const puppeteer = require("puppeteer");
const app = express();
const http = require('http');
const chromium = require('chromium');

app.use(cors());

app.set('view engine', 'ejs');
app.use('/css', express.static(__dirname + '/css'));

app.get('/', (req, res) => {
    res.render('search', { results: [] });
});

app.get('/search', async (req, res) => {

    const scrape = async () => {

        console.log("process.env.PRODUCTION", process.env.PRODUCTION)
        if(process.env.PRODUCTION) {
            console.log("process.env.PUPPETEER_EXECUTABLE_PATH", process.env.PUPPETEER_EXECUTABLE_PATH)
        }

        const browser = await puppeteer.launch({
            headless: "new",
            executablePath: process.env.PRODUCTION ? process.env.PUPPETEER_EXECUTABLE_PATH : chromium.path,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--single-process',
                '--no-zygote',
                '--disable-gl-drawing-for-tests',
                '--disable-canvas-aa',
                '--disable-2d-canvas-clip-aa',
            ],
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(10000)
        page.setViewport({width: 1024, height: 768})
        page.waitForNetworkIdle();
        const searchTerm = req.query.query || "";
        console.time("goto");
        await page.goto(`https://www.amazon.it/s?k=${searchTerm}`, { waitUntil: "load" })
            .catch((err) => console.log("error loading url", err));
        console.timeEnd("goto");

        try {
            const paginationButton = await page.$(".s-pagination-next");
            if (paginationButton) {
                await paginationButton.click();
                await page.waitForSelector(".s-pagination-next", { timeout: 10000 });
            } else {
                console.log("Pagination button not found, seems like we've reached the last page.");
            }
        } catch (error) {
            console.error("Pagination button not found:", error);
        }
        console.log("pagination done");
        const resultContainers = await page.$$("[data-component-type='s-search-result']");
        const amazonSearchArray = [];

        for (const result of resultContainers) {
            const title = await result.$eval("h2", node => node.textContent.trim());
            console.log("title", title);
            try {
                const price = await result.$eval("span.a-price[data-a-color='base'] span.a-offscreen", node => node.innerText.trim());
                const url = await result.$eval('a.a-link-normal', node => node.href);
                const imageUrl = await result.$eval('img.s-image', node => node.src);

                amazonSearchArray.push({
                    title,
                    price,
                    url,
                    imageUrl
                });
            } catch (error) {
                console.error("Failed to extract some data for a product: ", error);
            }
        }

        console.log("amazonSearchArray", amazonSearchArray.length);

        if (amazonSearchArray.length > 0) {
            const AFFILIATE_TAG = process.env.AFFILIATE_TAG;

            for(let item of amazonSearchArray) {
                item.url = item.url + "&tag=" + AFFILIATE_TAG;
            }

            const results = amazonSearchArray;

            await browser.close();
            res.render('search', { results });

        }

        // if after 10 seconds the page is still loading, we assume there are no more results
        await page.waitForSelector(".s-pagination-next", { timeout: 20000 }).catch( async () => {
            console.log("No more results found.");
            res.render('search', { results: amazonSearchArray || [] });
            await browser.close();
        });
    };

    scrape().catch(error => async () => {
        console.error("Scraping failed:", error);
        if (browser) {
            await browser.close();
        }
        res.status(500).send("Something went wrong.");
    });;



});

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});