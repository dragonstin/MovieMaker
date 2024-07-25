/*
Isso retorna exatatente o mesmo conteúdo do Algorithmia
By Marcuth :) @1Marcuth [14/12/22]
*/

import wiki from "wikipedia" // npm i wikipedia

async function getFromWikipedia(pageName) {
    const pageContent = {}

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