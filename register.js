const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const commands = [
  {
    name: 'play',
    description: 'play a song or video',
    options: [
      {
        name: 'song',
        description: 'link or youtube search',
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: 'p',
    description: 'play a song or video',
    options: [
      {
        name: 'song',
        description: 'link or youtube search',
        type: 3,
        required: true,
      }
    ]
  },
  {
    name: 'volume',
    description: 'set how loud rythm is',
    options: [
      {
        name: 'percentage',
        description: '0-100',
        type: 4,
        required: false,
      }
    ]
  },
  {
    name: 'np',
    description: 'displays rythm\'s current song',
  },
  {
    name: 'loop',
    description: 'loops the current song',
  },
  {
    name: 'pause',
    description: 'pauses rythm\'s current song',
  },
  {
    name: 'resume',
    description: 'resumes rythm\'s current song',
  },
  {
    name: 'dc',
    description: 'disconnects rythm from current voice channel',
  },
  {
    name: 'disconnect',
    description: 'disconnects rythm from current voice channel',
  },
  {
    name: 'join',
    description: 'connects rythm to your current voice channel',
  },
  {
    name: 'mute',
    description: 'mutes rythm',
  },
  {
    name: 'queuelength',
    description: 'devtool',
  },
  //{
  //  name: 'leaveserver',
  //  description: 'byebye',
  //},
];

const rest = new REST({ version: '9' }).setToken('MTA1MDg4Mzc0NTIzMTY4MzY1NA.Guw2Tj.miWIlv2CwluFSsLTPHVlOXw-cpotRZ7hDyMi1k');

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands('1050883745231683654'), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();