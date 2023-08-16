require('dotenv').config();

const express = require('express');
const cors = require('cors');
const puppeteer = require("puppeteer");
const app = express();
const http = require('http');
const chrome = require('chrome-aws-lambda');

app.use(cors());

app.set('view engine', 'ejs');
app.use('/css', express.static(__dirname + '/css'));

app.get('/', (req, res) => {
    res.render('search', { results: [] });
});

app.get('/search', async (req, res) => {

    const scrape = async () => {

        const browser = await puppeteer.launch({
            headless: "new",
            executablePath: "/opt/render/project/.chrome/chrome/linux-115.0.5790.170",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
            ],
        });
        const page = await browser.newPage();
        const searchTerm = req.query.query || "";
        await page.goto(`https://www.amazon.it/s?k=${searchTerm}`);
        await page.waitForTimeout(1000);

        const resultContainers = await page.$$("[data-component-type='s-search-result']");
        const amazonSearchArray = [];

        for (const result of resultContainers) {
            const title = await result.$eval("h2", node => node.textContent.trim());

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

        if (amazonSearchArray.length > 0) {
            const AFFILIATE_TAG = process.env.AFFILIATE_TAG;
            amazonSearchArray.forEach(item => {
                item.url = item.url + "&tag=" + AFFILIATE_TAG;
            });

            const results = amazonSearchArray;

            res.render('search', { results });

            await browser.close();
        }
    };

    scrape();



});

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});