const fs = require('fs')
const gm = require('gm').subClass({ imageMagick: true });
const state = require('./state.js')
const spawn = require('child_process').spawn
const path = require('path')
const rootPath = path.resolve(__dirname, '..')

async function robot() {
    console.log('> [video-robot] Starting...')

    const content = state.load()

    await convertAllImages(content)
    await createAllSentenceImages(content)
    await createYoutubeThumbnail()
    await createAfterEffectsScript(content)
    await renderVideoWithAfterEffects()
    
    
    state.save(content)

    async function convertAllImages(content) {
        console.log("convertAllImages")
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            await convertImage(sentenceIndex)
            // exit()
        }
    }

    async function convertImage(sentenceIndex) {
        console.log("convertImage")
        return new Promise((resolve, reject) => {
            const inputFile = `${sentenceIndex}-original.png[0]`
            const outputFile = `./content/${sentenceIndex}-converted.png`
            const width = 1920
            const height = 1080

            console.log(inputFile)
            // console.log(gm('0-original.png[0]').out('-resize','240x240').write('0-test.png', function (err) {
            //     if (!err) console.log('done');
            //     else {
            //         console.log(err)
            //     }
            //   }))

            console.log(
                gm('0-original.png[0]')
                .resize(240, 240)
                .noProfile()
                .write('/path/to/resize.png', function (err) {
                    if (!err) console.log('done');
                    else {
                            console.log(err)
                        }
                })
            )
            // gm()
            //     .in(inputFile)
            //     .out('(')
            //     .out('-clone')
            //     .out('0')
            //     .out('-background', 'white')
            //     .out('-blur', '0x9')
            //     .out('-resize', `${width}x${height}^`)
            //     .out(')')
            //     .out('(')
            //     .out('-clone')
            //     .out('0')
            //     .out('-background', 'white')
            //     .out('-resize', `${width}x${height}`)
            //     .out(')')
            //     .out('-delete', '0')
            //     .out('-gravity', 'center')
            //     .out('-compose', 'over')
            //     .out('-composite')
            //     .out('-extent', `${width}x${height}`)
            //     .write(outputFile, (error) => {
            //         if (error) {
            //             console.log(error)
            //             return reject(error)
            //         }
            //         console.log(`> [video-robot] Image converted: ${outputFile}`)
            //         resolve()
            //     })

        })

    }

    async function createAllSentenceImages(content) {
        console.log('createAllSentenceImages')
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
            await createSentenceImage(sentenceIndex, content.sentences[sentenceIndex].text)
        }
    }

    async function createSentenceImage(sentenceIndex, sentenceText) {
        console.log('createSentenceImage')
        return new Promise((resolve, reject) => {
            const outputFile = `./content/${sentenceIndex}-sentence.png`

            const templateSettings = {
                0: {
                    size: '1920x400',
                    gravity: 'center'
                },
                1: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                2: {
                    size: '800x1080',
                    gravity: 'west'
                },
                3: {
                    size: '1920x400',
                    gravity: 'center'
                },
                4: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                5: {
                    size: '800x1080',
                    gravity: 'west'
                },
                6: {
                    size: '1920x400',
                    gravity: 'center'
                }

            }

            gm()
                .out('-size', templateSettings[sentenceIndex].size)
                .out('-gravity', templateSettings[sentenceIndex].gravity)
                .out('-background', 'transparent')
                .out('-fill', 'white')
                .out('-kerning', '-1')
                .out(`caption:${sentenceText}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error)
                    }

                    console.log(`> [video-robot] Sentence created: ${outputFile}`)
                    resolve()
                })
        })
    }

    async function createYoutubeThumbnail() {
        console.log('createYoutubeThumbnail')
        return new Promise((resolve, reject) => {
            gm()
                .in('./content/0-converted.png')
                .write('./content/youtube-thumbnail.jpg', (error) => {
                    if (error) {
                        return reject(error)
                    }

                    console.log('> [video-robot] YouTube thumbnail created')
                    resolve()
                })

        })

    }

    async function createAfterEffectsScript(content) {
        console.log('createAfterEffectsScript')
        await state.saveScript(content)
    }

    async function renderVideoWithAfterEffects() {
        console.log('renderVideoWithAfterEffects')
        return new Promise((resolve, reject) => {
            // const aerenderFilePath = 'C:/Program Files/Adobe/Adobe After Effects CC 2019/Support Files/aerender'
            const aerenderFilePath = 'C:/Program Files/Adobe/Adobe After Effects 2020/Support Files/aerender'
            const templateFilePath = `${rootPath}/templates/1/template.aep`
            const destinationFilePath = `${rootPath}/content/output.mov`
            const logFilePath = `${rootPath}/content/logAfterEffects.txt`

            console.log('> [video-robot] Starting After Effects')

            const aerender = spawn(aerenderFilePath, [
                
                '-comp', 'main',
                '-project', templateFilePath, 
                '-output', destinationFilePath
            ])
            
            console.log(spawn)
            aerender.stdout.on('data', (data) =>{
                process.stdout.write(data)
            })

            aerender.on('close', () => {
                console.log('> [video-robot] After Effects closed')
                resolve
            })
        })
    }

}
module.exports = robot