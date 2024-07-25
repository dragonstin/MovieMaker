const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

const wikipedia = require('../wikipedia')

const watson = require('../credentials/watson-nlu.json')
const Assistantv2 = require('ibm-watson/assistant/v2.js')
const { IamAuthenticator } = require('ibm-watson/auth')
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js')

// const nlu = new NaturalLanguageUnderstandingV1({
//     iam_apikey: watsonApiKey,
//     version: '2024-07-05',
//     url: 'https://gateway.watsonplatform.net/natural-language-understanding/api'
// })

const assistant = new Assistantv2({
    version: '2024-07-05',
    authenticator: new IamAuthenticator({
        apikey : watson.apikey
    }),
    url: watson.url
})

const state = require('./state.js')

async function robot() {
    console.log('> [text-robot] Stating...')
    const content = state.load()

    await fetchContentFromWikipedia(content)
    sanitizeContent(content)
    breakContnteIntoSentences(content)
    limitMaximumSentences(content)
    await fetchKeywordOfAllSentences(content)

    state.save(content)
    
    // const searchAndFetchWikipedia = async content => {
    //     await wikipedia(content);
    // };

    // console(searchAndFetchWikipedia)

    async function fetchContentFromWikipedia(content) {
        // const searchAndFetchWikipedia =  await wikipedia(content)

        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        console.log('a')
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2?timeout=300")
        console.log('b')
        console.log(wikipediaAlgorithm)
        const wikipediaResponde = await wikipediaAlgorithm.pipe(content.searchTerm)
        console.log('c')
        console.log(wikipediaResponde)
        const wikipediaContent = wikipediaResponde.get()
        console.log('d')
        
        content.sourceContentOriginal = wikipediaContent.content
        console.log('e')
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
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, (error, response) => {
                if (error) {
                    reject(error)
                    return
                }

                const keywords = response.keywords.map((keyword) => {
                    return keyword.text
                })

                resolve(keywords)
            })
        })
    }

}

module.exports = robot