// const algorithmia = require('algorithmia')
// const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const getFromWikipedia = require('./wikipedia')

const watson = require('../credentials/watson-nlu.json')
const Assistantv2 = require('ibm-watson/assistant/v2.js')
const { IamAuthenticator } = require('ibm-watson/auth')
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js')

const nlu = new NaturalLanguageUnderstandingV1({
    version: '2024-07-05',
    authenticator: new IamAuthenticator({
        apikey : watson.apikey
    }),
    serviceUrl: watson.url
})

const state = require('./state.js')
const { response } = require('express')

async function robot() {
    console.log('> [text-robot] Stating...')
    const content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContnteIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeywordOfAllSentences(content)

    state.save(content)
    
    async function fetchContentFromWikipedia(content) {
        // const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        // const wikipediaAlgorithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2?timeout=300")
        // const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
        // const wikipediaContent = wikipediaResponde.get()
        const wikipediaContent = await getFromWikipedia(content.searchTerm)

        content.sourceContentOriginal = wikipediaContent.content
        console.log('> [text-robot] Fetching done!')
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
        const withouDatesInParantheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)

        content.sourceContentSanitized = withouDatesInParantheses

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n')

            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }

                return true
            })

            return withoutBlankLinesAndMarkdown.join(' ')
        }

        function removeDatesInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
        }
    }

    function breakContnteIntoSentences(content) {
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                image: []
            })
        })
    }

    function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchKeywordOfAllSentences(content) {
        console.log('> [text-robot] Starting to fetch keywords form Watson')
        for (const sentence of content.sentences) {
            console.log(`> [text-robot] Sentence: "${sentence.text}"`)
            
            sentence.keywords = await fetchtWatsonAndReturnKeywords(sentence.text)
            
            console.log(`> [text-robot] Keywords: "${sentence.keywords.join(',')}ln"`)
        }
    }

    async function fetchtWatsonAndReturnKeywords(sentence) {
        try {
            // Perform the NLU analysis
            const analysisResults = await nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            });
    
            // Extract and process the keywords from the response
            const keywords = analysisResults.result.keywords.map((keyword) => {
                return keyword.text;
            });
    
            return keywords;
    
        } catch (err) {
            console.error('Error:', err);
            throw err; // Re-throw the error so it can be handled by the caller
        }
    }

}

module.exports = robot