// Imports
const fs = require('fs');
const ytdl = require('ytdl-core');
const yt = require('youtube-search-without-api-key');

// Create cookie to allow ytdl library to access 'sensitive' videos
const COOKIE = process.env.cookie;

// Create headers for ydtl to use COOKIE and set the audio quality to highest
const ydtlHeaders = { requestOptions: { headers: { cookie: COOKIE, }, }, quality: "highestaudio" } 

function isValid (url) {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
  '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    return !!urlPattern.test(url);
}

async function videoInfo(url) {
    try { ytdl.getInfo(url, ydtlHeaders) } catch (err) { console.log(err) }
    var info
    await ytdl.getInfo(url, ydtlHeaders).then(response => {
        info = {
            length: response.videoDetails.lengthSeconds,
            channelName: response.videoDetails.author.name,
            title: response.videoDetails.title,
            url: url,
            thumbnail: response.videoDetails.thumbnails[response.videoDetails.thumbnails.length - 1].url
        }
    })
    return info
}

async function download(url) {
    try { ytdl.getInfo(url, ydtlHeaders) } catch (err) { console.log(err) }
    let audioStream = ytdl(url, { filter: 'audioonly', dlChunkSize: 0 })
    let audioFile = fs.createWriteStream(('pipe.mp3'))
    audioStream.pipe(audioFile)
    await new Promise((resolve, reject) => {
      audioStream.on('finish', resolve)
      audioStream.on('error', reject)
    })
    return
}

// using npm module:
async function searchYT(query) {
    let response
    await yt.search(query).then(resp => {
        response = resp[0].url
    })
    return response
}

async function searchYTTopFive(query) {
  let response = []
  await yt.search(query).then(resp => {
      response[0] = resp[0].url
      response[1] = resp[1].url
      response[2] = resp[2].url
      response[3] = resp[3].url
      response[4] = resp[4].url
  })
  return response
}
 
async function search(search) {
  if (isValid(search)) {
    return search
  } else { 
    return (await searchYT(search))
  }
}

async function searchTopFive(search) {
  if (isValid(search)) {
    return search
  } else { 
    return (await searchYTTopFive(search))
  }
}

module.exports = { videoInfo, download, search, searchTopFive }
