const title = await page.$$eval("h2", (nodes) =>
    nodes.map(n => n.textContent.trim())
);

const price = await page.$$eval(
    "[data-component-type='s-search-result'] span.a-price[data-a-color='base'] span.a-offscreen",
    (nodes) => nodes.map((n) => n.innerText)
);

const urls = await page.$$eval('a.a-link-normal', links => {
    return links.map(link => link.href)
});

const imageUrls = await page.$$eval('img.s-image', images => {
    return images.map(image => image.src)
});

const amazonSearchArray = title.map((value, index) => {
    return {
        title: title[index],
        price: price[index],
        url: urls[index],
        imageUrl: imageUrls[index]
    };
});

if (amazonSearchArray.length > 0) {
    const filteredAmazonSearchArray = amazonSearchArray.filter(
        (item) => item.title.trim() && item.price && item.url && item.imageUrl && item.price !== "Sponsored"
    );

    const sortedAmazonSearchArray = [...filteredAmazonSearchArray];
    sortedAmazonSearchArray.sort((a, b) => {
        const priceA = parseFloat(a.price.replace('€', ''));
        const priceB = parseFloat(b.price.replace('€', ''));
        return priceA - priceB;
    });
    const AFFILIATE_TAG = process.env.AFFILIATE_TAG;
    sortedAmazonSearchArray.forEach(item => {
        item.url = item.url + "&tag=" + AFFILIATE_TAG;
    });

    const results = sortedAmazonSearchArray;

    res.render('search', { results });

    await browser.close();
}