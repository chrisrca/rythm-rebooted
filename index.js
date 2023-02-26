// Imports
const { joinVoiceChannel, getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, AttachmentBuilder } = require('discord.js')
const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates ] })
const spotify = require('./exports/spotify')
const url = require('./exports/url')
const time = require('./exports/time')
let audioPlayer = createAudioPlayer()

// General Music Settings
const settings = {
  volume: 0.25,
  paused: false,
  interactionInfo: null,
  currentResource: null,
  currentResourceDuration: 0,
  currentTrackInfo: {
    name: '',
    url: '',
    thumbnail: '',
    requestUser: null,
  },
  lastPlayed: null,
  looping: false,
}

// Queue of songs
let songQueue = []

// Logs when bot is initialized and sets status
client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  client.user.setActivity("music! 🎵", { type: ActivityType.Listening });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'play' || interaction.commandName === 'p') {
      // Check if user is in voice channel 
      if (interaction.member.voice.channelId != null) {
          // Searches youtube for query or returns url if already valid
          await url.search(interaction.options._hoistedOptions[0].value)
              .then(async songurl => {
                  // Checks if link is spotify url
                  if (songurl.includes('https://open.spotify.com/')) {
                    interaction.reply('<:spotify:1055352951062929508> **Searching** 🔎 `' + songurl + '`')
                    if (!songurl.includes('https://open.spotify.com/playlist')) {
                      spotify.parse(songurl).then(async name => {
                        await url.search(name[0][0]).then(resp => { songQueue.push([interaction, resp, name[1][0]]); playEmbed(interaction, resp) })
                        if (audioPlayer.state.status === 'idle' && songQueue.length > 0) {
                          tmpSong = songQueue.shift()
                          if (tmpSong != undefined) {
                            playSong(tmpSong[0], tmpSong[1])	
                          }
                        }
                      })  
                    } else {
                      await spotify.parse(songurl).then(async name => {
                        playlistEmbed(interaction, songurl, name[0])
                        await queuePlaylist(interaction, name[0], name[1])
                      })
                      if (audioPlayer.state.status === 'idle' && songQueue.length > 0) {
                        tmpSong = songQueue.shift()
                        if (tmpSong != undefined) {
                          playSong(tmpSong[0], tmpSong[1])	
                        }
                      }
                    }
                  } else { 
                    // Link is a youtube link
                    interaction.reply('<:youtube:1052117673942724669> **Searching** 🔎 `' + songurl + '`')
                    // Push song to queue
                    songQueue.push([interaction, songurl])
                    playEmbed(interaction, songurl)
                    if (audioPlayer.state.status === 'idle' && songQueue.length > 0) {
                      tmpSong = songQueue.shift()
                      if (tmpSong != undefined) {
                        playSong(tmpSong[0], tmpSong[1])	
                      }
                    }
                  }                  
              })
      } else {
        interaction.reply(':x: **You have to be in a voice channel to use this command.**')
      }
      // Queue playlist nested function 
      async function queuePlaylist(interaction, name, duration) {
        for (let i = 0; i < name.length; i++) {
          songQueue.push([interaction, await url.search(name[i]), duration])
          if (audioPlayer.state.status === 'idle' && songQueue.length == 1 && i == 0) {
            tmpSong = songQueue.shift()
            if (tmpSong != undefined) {
              playSong(tmpSong[0], tmpSong[1])	
            }
          }
        }
      }
  }
  if (interaction.commandName === 'dc' || interaction.commandName === 'disconnect') {
    try {
        const connection = getVoiceConnection(interaction.member.voice.guild.id)
        audioPlayer.stop(true)
        connection.destroy()
        songQueue = []
        settings.paused = false
        settings.interactionInfo = null
        settings.currentResource = null
        settings.currentResourceDuration = 0
        settings.currentTrackInfo = {
          name: '',
          url: '',
          thumbnail: '',
          requestUser: null,
        }
        settings.lastPlayed = null
        settings.looping = false
        audioPlayer = createAudioPlayer()
        interaction.reply(':mailbox_with_no_mail: **Successfully disconnected!**') 
    } catch (err) {
        interaction.reply(':x: **I\'m not in a voice channel right now.**') 
    }
  }
  if (interaction.commandName === 'join') {
    if (interaction.member.voice.channelId != null) {
        try {
            joinVoiceChannel({ 
                channelId: interaction.member.voice.channelId,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false
            })
            interaction.reply(':mailbox: **Successfully connected!**')
        } catch (err) {
            interaction.reply(':x: **An error occured while attempting to connect to your voice channel.**')
        }
    } else {
        interaction.reply(':x: **You have to be in a voice channel to use this command.**')
    }
  }
  if (interaction.commandName === 'volume') {
    let empty = true
    try {
      if (interaction.options._hoistedOptions[0].value > 0) {}
    } 
    catch (err) {
      if (settings.volume == 0) {
        interaction.reply(':mute: **Rythm is currently muted**')
      } else if (settings.volume*100 > 0 && settings.volume*100 <= 33) {
        interaction.reply(`:speaker: **The volume is currently at** \`` + settings.volume*100 + '%`')
      } else if (settings.volume*100 > 33 && settings.volume*100 <= 66) {
        interaction.reply(`:sound: **The volume is currently at** \`` + settings.volume*100 + '%`')
      } else {
        interaction.reply(`:loud_sound: **The volume is currently at** \`` + settings.volume*100 + '%`')
      }
      empty = false
    }
    if (empty) {
      if (interaction.options._hoistedOptions[0].value >= 0 && interaction.options._hoistedOptions[0].value <= 100) {
          settings.volume = interaction.options._hoistedOptions[0].value / 100
          try { currentResource.volume.setVolume(settings.volume) } catch (err) {}
          if (settings.volume == 0) {
              interaction.reply(':mute: **Muted rythm**')
          } else if (settings.volume*100 > 0 && settings.volume*100 <= 33) {
              interaction.reply(`:speaker: **Set the volume to** \`` + settings.volume*100 + '%`')
          } else if (settings.volume*100 > 33 && settings.volume*100 <= 66) {
              interaction.reply(`:sound: **Set the volume to** \`` + settings.volume*100 + '%`')
          } else {
              interaction.reply(`:loud_sound: **Set the volume to** \`` + settings.volume*100 + '%`')
          }
      }
      else {
          interaction.reply(':x: **Volume must be between 0 and 100.**')
      }
    }
  }
  if (interaction.commandName === 'mute') {
    settings.volume = 0
    try { currentResource.volume.setVolume(settings.volume) } catch (err) {}
    interaction.reply(':mute: **Muted rythm**')
  }
  if (interaction.commandName === 'pause') {
    settings.paused = true
    audioPlayer.pause()
    interaction.reply(':pause_button: **Pausing song**')
  }
  if (interaction.commandName === 'resume') {
    settings.paused = false
    audioPlayer.unpause()
    interaction.reply(':arrow_forward: **Resuming song**')
  }
  if (interaction.commandName === 'np') {
    function getResponse(num) {
      if (num >= 0.00 && num < 3.33) {
          return "🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 3.33 && num < 6.66) {
          return "▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 6.66 && num < 9.99) {
          return "▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 9.99 && num < 13.32) {
          return "▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 13.32 && num < 16.65) {
          return "▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 16.65 && num < 19.98) {
          return "▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 19.98 && num < 23.31) {
          return "▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 23.31 && num < 26.64) {
          return "▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 26.64 && num < 29.97) {
          return "▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 29.97 && num < 33.30) {
          return "▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 33.30 && num < 36.63) {
          return "▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 36.63 && num < 39.96) {
          return "▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 39.96 && num < 43.29) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 43.29 && num < 46.62) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 46.62 && num < 49.95) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 49.95 && num < 53.28) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 53.28 && num < 56.61) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 56.61 && num < 59.94) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 59.94 && num < 63.27) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 63.27 && num < 66.60) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬▬";
      } else if (num >= 66.60 && num < 69.93) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬▬";
      } else if (num >= 69.93 && num < 73.26) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬▬";
      } else if (num >= 73.26 && num < 76.59) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬▬";
      } else if (num >= 76.59 && num < 79.92) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬▬";
      } else if (num >= 79.92 && num < 83.25) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬▬";
      } else if (num >= 83.25 && num < 86.58) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬▬";
      } else if (num >= 86.58 && num < 89.91) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬▬";
      } else if (num >= 89.91 && num < 93.24) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬▬";
      } else if (num >= 93.24 && num < 96.57) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘▬";
      } else if (num >= 96.57 && num < 100) {
          return "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘";
      } else {
        return "🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
      }
    }
    if (audioPlayer.state.playbackDuration != undefined) {
      let playBackDuration = Math.trunc(audioPlayer.state.playbackDuration / 1000)
      let progressBar = '`' + getResponse(Number(playBackDuration)/settings.currentResourceDuration * 100) + '`'
      if (settings.paused) {
        const attachments = new AttachmentBuilder('./resources/rythmPaused.png', {name: 'rythmPaused.png'})
        const embed = new EmbedBuilder()
        .setColor('ed3227')
        .setAuthor({ name: 'Paused ♪', iconURL: 'attachment://rythmPaused.png' })
        .setDescription(`[${settings.currentTrackInfo.name}](${settings.currentTrackInfo.url})`)
        .setThumbnail(settings.currentTrackInfo.thumbnail)
        .addFields(
          {name: progressBar, value: ('`' + time.convert(Number(playBackDuration)) + ' / ' + time.convert(settings.currentResourceDuration) + '`')},
        )
        .setFooter({ text: `Requested by ${settings.currentTrackInfo.requestUser.user.username}`, iconURL: settings.currentTrackInfo.requestUser.user.displayAvatarURL()})
        interaction.reply({ embeds: [embed], files: [ `./resources/rythmPaused.png` ] })
      } else {
        const attachments = new AttachmentBuilder('./resources/rythmRotating.gif', {name: 'rythmRotating.gif'})
        const embed = new EmbedBuilder()
        .setColor('ed3227')
        .setAuthor({ name: 'Now Playing ♪', iconURL: 'attachment://rythmRotating.gif' })
        .setDescription(`[${settings.currentTrackInfo.name}](${settings.currentTrackInfo.url})`)
        .setThumbnail(settings.currentTrackInfo.thumbnail)
        .addFields(
          {name: progressBar, value: ('`' + time.convert(Number(playBackDuration)) + ' / ' + time.convert(settings.currentResourceDuration) + '`')},
        )
        .setFooter({ text: `Requested by ${settings.currentTrackInfo.requestUser.user.username}`, iconURL: settings.currentTrackInfo.requestUser.user.displayAvatarURL()})
        interaction.reply({ embeds: [embed], files: [ `./resources/rythmRotating.gif` ] })
      }
      
    } else {
      interaction.reply(':x: **I am not currently playing anything.**')
    }
  }
  if (interaction.commandName === 'queuelength') {
    interaction.reply(`[QueueLength] ${songQueue.length}`)
  }
  if (interaction.commandName === 'loop') {
    if (interaction.member.voice.channelId != null) {
        if (settings.looping) {
          interaction.reply(':arrow_right: **No longer looping.**')       
          settings.looping = false
        } else {
          interaction.reply(':repeat: **Looping track.**')       
          settings.looping = true
        }
    } else {
        interaction.reply(':x: **You have to be in a voice channel to use this command.**')
    }
  }
  //if (interaction.commandName === 'leaveserver') {
  //  interaction.guild.leave()
  //}
});

function playlistEmbed(interaction, songurl, name) {
  spotify.getPlaylistInfo(songurl).then(playlistInfo => {
    const embed = new EmbedBuilder()
      .setColor('f62b34')
      .setAuthor({ name: `Added to queue`, iconURL: interaction.user.displayAvatarURL() })
      .setTitle(playlistInfo[0])
      .setURL(songurl)
      .addFields({ name: playlistInfo[2], value: `${name.length} songs added to queue` })
      .setThumbnail(playlistInfo[1])
      interaction.channel.send({ embeds: [embed] })
  })
}

// Play song using interaction and url
function playEmbed(interaction, songurl) {
  url.videoInfo(songurl).then(info => {
    settings.currentResourceDuration = info.length
    if (info.length == 0) {
      interaction.channel.send(':x: **I am not able to play livestreams.**')
    } else {
      // let eta = 0
      // console.log(songQueue[2][2])
      // for (duration in songQueue[2][2]) {
      //   eta += Math.trunc(songQueue[2][2][duration])
      //   console.log(eta + '\n')
      // }
      settings.currentTrackInfo.requestUser = interaction.member
      settings.currentTrackInfo.name = info.title
      settings.currentTrackInfo.url = info.url
      settings.currentTrackInfo.thumbnail = info.thumbnail
      const embed = new EmbedBuilder()
      .setColor('f62b34')
      .setAuthor({ name: 'Added to queue', iconURL: interaction.user.displayAvatarURL() })
      .setTitle(info.title)
      .setURL(info.url)
      .setThumbnail(info.thumbnail)
      .addFields(
        { name: 'Channel', value: info.channelName, inline: true }, 
        { name: 'Song Duration', value: time.convert(info.length), inline: true }, 
        // { name: 'Estimaged time until playing', value: time.convert(eta), inline: true }, 
        { name: 'Position in queue', value: String(songQueue.length + 1) })
      interaction.channel.send({ embeds: [embed] })
    }
  })
}

function playSong(interaction, songurl) {
  url.videoInfo(songurl).then(info => {
    settings.currentResourceDuration = info.length
    if (info.length == 0) {
      interaction.channel.send(':x: **I am not able to play livestreams.**')
    } else {
      const attachments = new AttachmentBuilder('./resources/rythmRotating.gif', {name: 'rythmRotating.gif'})
      settings.currentTrackInfo.requestUser = interaction.member
      settings.currentTrackInfo.name = info.title
      settings.currentTrackInfo.url = info.url
      settings.currentTrackInfo.thumbnail = info.thumbnail
      const embed = new EmbedBuilder()
      .setColor('f62b34')
      .setAuthor({ name: 'Now Playing', iconURL: 'attachment://rythmRotating.gif' })
      .setTitle(info.title)
      .setURL(info.url)
      .setThumbnail(info.thumbnail)
      .addFields({ name: 'Song Duration', value: time.convert(info.length)}) 
      .setFooter({ text: `Requested by ${settings.currentTrackInfo.requestUser.user.username}`, iconURL: settings.currentTrackInfo.requestUser.user.displayAvatarURL()})
      if (settings.lastPlayed != null) { settings.lastPlayed.delete() }
      interaction.channel.send({ embeds: [embed], files: [ `./resources/rythmRotating.gif` ]}).then(message => settings.lastPlayed = message) 
      url.download(songurl).then(() => {
        const voiceChannel = interaction.member.voice
        const voiceConnection = joinVoiceChannel({ 
          channelId: voiceChannel.channelId,
          guildId: interaction.guildId,
          adapterCreator: interaction.guild.voiceAdapterCreator,
          selfDeaf: false
        })
        const connection = getVoiceConnection(voiceChannel.guild.id)
        currentResource = createAudioResource('./pipe.mp3', { inlineVolume: true });
        currentResource.volume.setVolume(settings.volume);
        connection.subscribe(audioPlayer)
        audioPlayer.play(currentResource)
      })
    }
  })
}

audioPlayer.on(AudioPlayerStatus.Idle, () => {
  if (songQueue.length == 0 && settings.interactionInfo != null) { settings.lastPlayed.delete() }
  // console.log(settings.interactionInfo)
  if (!settings.looping) {
    tmpSong = songQueue.shift()
    settings.interactionInfo = tmpSong
    if (tmpSong != undefined) {
      playSong(tmpSong[0], tmpSong[1])	
    }
  } else {
    songQueue.unshift(settings.interactionInfo)
    tmpSong = songQueue.shift()
    settings.interactionInfo = tmpSong
    if (tmpSong != undefined) {
      playSong(tmpSong[0], tmpSong[1])	
    }   	
  }
});

client.login(process.env.token);