require('dotenv').config(); //initializes dotenv
const Discord = require('discord.js'); //imports discord.js
const fs=require('fs');
const DisVoice=require('@discordjs/voice');
const child_process= require("child_process");
const client = new Discord.Client({
    intents:[
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMessages,
        Discord.IntentsBitField.Flags.GuildVoiceStates,
    ]
});
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  let commands=client.application.commands;
  commands.create(
    {
      name: 'play',
      description: 'Plays music! This is this bot\'s only role in life.',
      options:[
        {
          name: 'link',
          description: 'How do you want to know what to play?',
          required: true,
          type: Discord.ApplicationCommandOptionType.String
        },
        {
          name: 'loop',
          description: 'Should this song loop?',
          required: false,
          type: Discord.ApplicationCommandOptionType.Boolean
        }
      ]
    })
    commands.create({
      name: 'stop',
      description: 'Stop playing the song, you motherfucker!',
    })
});
let player;
function playSong (member, songLink, shouldLoop)
{

  var command="yt-dlp"
  var argumentsList=[
      songLink,
      "--no-playlist",
      "--sponsorblock-remove",
      "all",
      "--extract-audio",
      "--audio-format",
      "mp3",
      "-o",
      'mp3/play.mp3'
  ]
  try {
      fs.unlinkSync("mp3/play.mp3");
  } catch(error) {
      console.log(error);
  }
  console.log("Deleting old mp3/play.mp3!");
  const childProcess = child_process.spawn(command, argumentsList);
  childProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
  
  });
  childProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
  });
  childProcess.on('close', (code) => {
      console.log(`Child process exited with code ${code}`);
      console.log("Done")
      const channel=member.voice.channel;
      const connection = DisVoice.joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
      });
      player = DisVoice.createAudioPlayer();
      console.log('The connection has entered the Ready state - ready to play audio! #loop');
      console.log("mp3/play.mp3");
      connection.subscribe(player);
      player.play(DisVoice.createAudioResource("mp3/play.mp3"));
      player.on(DisVoice.AudioPlayerStatus.Idle, () => {
          if (shouldLoop) player.play(DisVoice.createAudioResource("mp3/play.mp3"));
          else {
              stopSong(connection);
          }
      })
  });
}

function stopSong (connection)
{
  try{ connection.destroy(); } catch {console.log("Couldn't destroy connection")}
  //try {player.stop(); } catch {console.log("Couldn't stop player.")}
  connection=null; //player=null;
  console.log("Stopped voice!");
}
client.on('interactionCreate', async(interaction)=> {
  if (!interaction.isCommand()) {
      return;
  }
  const {commandName, options}=interaction
  if (commandName=="play") {
      let link=options.getString("link");
      let loop=options.getBoolean("loop");
      if (loop==null) loop=false;
      playSong(interaction.member, link, loop);
      interaction.reply("Playing song: "+link+"\nLoop status: "+loop);
  }
  if (commandName=="stop") {
      const channel=interaction.member.voice.channel;
      const connection = DisVoice.getVoiceConnection(channel.guild.id);
      stopSong(connection);
      interaction.reply("Stopping whatever is playing!");
  }
});
//this line must be at the very end
client.login(process.env.CLIENT_TOKEN); //signs the bot in with tokenik