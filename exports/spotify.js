// Imports
const base64 = require('base-64')

// Spotify API ids
const clientId = process.env.spotifyID
const clientSecret = process.env.spotifySecret

async function singleSong (link) {
    async function getSongName(link) {
      async function getAccessToken() {
        const response = await fetch('https://accounts.spotify.com/api/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + base64.encode(`${clientId}:${clientSecret}`)
          },
          body: 'grant_type=client_credentials'
        });
        return response.json();
      }
      const parts = link.split('/');
      const songUri = parts[parts.length - 1];
      const accessToken = await getAccessToken();
      const response = await fetch(`https://api.spotify.com/v1/tracks/${songUri}`, {
        headers: {
          'Authorization': `Bearer ${accessToken.access_token}`
        }
      });
      const songName = response.json();
      return songName;
    }
    function names(resp) {
      let names = ''
      for (let i = 0; i < resp.artists.length; i++) {
        names += resp.artists[i].name
        if (i != resp.artists.length - 1) {
          names += ' & '      
        }
      }
      return names
    }
    let nameResponse = []
    let duration = []
    await getSongName(link).then(resp => {
      nameResponse.push(resp.name + ' by ' + names(resp))
      duration.push(resp.duration_ms)
    });
    return [nameResponse, duration]
}

async function playlist (playlistId) {
  async function getAccessToken() {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + base64.encode(`${clientId}:${clientSecret}`)
        },
        body: 'grant_type=client_credentials'
      });
      return response.json();
    }
  function names(resp) {
      let names = ''
      for (let i = 0; i < resp.artists.length; i++) {
        names += resp.artists[i].name
        if (i != resp.artists.length - 1) {
          names += ' & '      
        }
      }
      return names
    }
  playlistId = playlistId.split("/").pop().split("?")[0];      

  const accessToken = await getAccessToken();

  let durations = [];
  let tracks = [];
  let offset = 0;
  let limit = 100;
  let moreTracksAvailable = true;

  while (moreTracksAvailable) {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${accessToken.access_token}`
      }
  });
  
    const data = await response.json();
    for (track in data.items) {
      durations.push(data.items[track].track.duration_ms / 1000)
      tracks.push(data.items[track].track.name + ' by ' + names(data.items[track].track));
    }
    if (tracks.length < data.total) {
      offset += limit;
    } else {
      moreTracksAvailable = false;
    }
  }
  return [tracks, durations]
}

async function getPlaylistInfo(link) {
  async function getAccessToken() {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + base64.encode(`${clientId}:${clientSecret}`)
      },
      body: 'grant_type=client_credentials'
    });
    return response.json();
  }
  const parts = link.split('/');
  const playlistId = parts[parts.length - 1];
  const accessToken = await getAccessToken();

  let playlistInfo = []

  await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken.access_token}`
    }
  }) .then(response => response.json()).then(data => {
    playlistInfo[0] = data.name;
    playlistInfo[1] = data.images[0].url;
    playlistInfo[2] = data.owner.display_name
  });
  return playlistInfo
}


async function parse(url) {
    if (url.includes('playlist')) {
      return playlist(url)
    } else {
      return singleSong(url)
    }
}

module.exports = { parse, getPlaylistInfo }