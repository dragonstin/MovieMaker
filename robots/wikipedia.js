/*
Isso retorna exatatente o mesmo conteúdo do Algorithmia
By Marcuth :) @1Marcuth [14/12/22]
*/

const wiki = require("wikipedia") // npm i wikipedia

async function getFromWikipedia(searchTerm) {
    const pageContent = {}

    const searchResults = await wiki.search(searchTerm);
    console.log(searchResults)

    const pageName = searchResults.results[0].title
    console.log(pageName)

    const page = await wiki.page(pageName)
    pageContent.content = await page.content()
    pageContent.images = await page.images()
    pageContent.links = await page.links()
    pageContent.pageid = page.pageid
    pageContent.references = await page.references()
    pageContent.summary = await page.summary()
    pageContent.title = page.title
    pageContent.url = page.fullurl

    return pageContent
}

module.exports = getFromWikipedia