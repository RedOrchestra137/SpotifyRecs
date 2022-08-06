const dotenv = require('dotenv');
dotenv.config();

//Spotify API only allows for a limited number of tracks to be manipulated in a single call
const TRACK_LIMIT_ADD = 50
const TRACK_LIMIT_REMOVE = 100


var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});

function setTokens(){
  spotifyApi.setAccessToken(process.env.ACCESS_TOKEN)
  spotifyApi.setRefreshToken(process.env.REFRESH_TOKEN)
}

async function generateNewPlaylist(){
    setTokens()
    console.log("generating")
    var seed = await getSeedValues();
    console.log("seeding done")
    var seedTracks = seed[1]
    var seedArtists = seed[0]
    var tally = {}
    var lo = 0
    var hi = 2
    var tmp
    do{
      await spotifyApi.getRecommendations({
        seed_artists:seedArtists.slice(lo,hi),
        seed_tracks:seedTracks.slice(lo,hi),
        limit:10
      }).then(data=>{
        data.body.tracks.forEach(track=>{
          if(!tally[track.id]){
            tally[track.id] = 1
          }
          else{
            tally[track.id] += 1
          }
        })
      },error=>{
        console.log("error. ",error)
      })
      tmp = hi;
      console.clear()
      console.log("progress: "+Math.round(hi*100/(seedArtists.length/3),2)+"%")
      hi += 2;
      lo = tmp;
    }
    while(hi<seedArtists.length/3)
    console.log("generated")
    trackIDS = await sort_object(tally)
    var finalList = await eliminateOldTracks(trackIDS);
    return finalList;
  }
  
  
  async function addToSavedTracks(trackList){
    setTokens()
    await spotifyApi.addToMySavedTracks(trackList)
    .then(function(data) {
      console.log('Added track!');
    }, function(err) {
      console.log('Something went wrong!', err);
    });
  }
  
  async function getSeedValues(){
    setTokens()
    console.log("seeding")
    var seedArtists = []
    var seedTracks = []
    var seedGenres = []
    var checkedAlbums = []
    var limit = TRACK_LIMIT_ADD;
    var offset = 0;
    do{
      var tracks  = await spotifyApi.getMySavedTracks({limit:limit,offset:offset})
      .then((success)=>{
        return success.body.items
      },error=>{
        console.log(error)
      })
      tracks.forEach(track=>{
        seedTracks.push(track.track.id)
        track.track.artists.forEach(artist=>{
          if(!seedArtists.includes(artist.id)){
            seedArtists.push(artist.id)
          }
        })
      })
      offset+=limit;
      
    }
    while(tracks.length>0);
    seedArtists = shuffleArray(seedArtists)
    seedTracks = shuffleArray(seedTracks)
    return [seedArtists,seedTracks]
  }
  
  function sort_object(obj) {
    console.log("sorting")
    var items = Object.keys(obj).map(
      (key) => { return [key, obj[key]] });
    items.sort(
      (first, second) => { return second[1] - first[1] }
    );
    var keys = items.map(
      (e) => { return e[0] });
    
    return keys
  } 
  
  async function eliminateOldTracks(tracklist){
    setTokens()
    console.log("eliminating")
    var convertedList = []
    tracklist.forEach(track=>{
      convertedList.push(track)
    })
  
    var finaltrackList = []
    let i = 0
    while (finaltrackList.length<50&&i<convertedList.length){
      var curBool = await spotifyApi.containsMySavedTracks([convertedList[i]]).then(data=>{
        return data.body[0]
      },error=>{
        console.log("error: ",error)
      })
      if(!curBool){
        finaltrackList.push(convertedList[i])
      }
      i++;
    }
    return finaltrackList; 
  }
  
  function shuffleArray(array){
    retarr = array
    for (let i = retarr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = retarr[i];
      retarr[i] = retarr[j];
      retarr[j] = temp;
    }
    return retarr
  }
  
async function emptyPlaylist(playlistID,limit,offset){
  setTokens()
    console.log("emptying")
    var playListTracks = []
    do{
      var tracks  = await spotifyApi.getPlaylistTracks(playlistID,{limit:limit,offset:offset})
      .then((success)=>{
        return success.body.items
      },error=>{
        console.log(error)
      })
      tracks.forEach(track=>{
        playListTracks.push(
          {
            "uri":"spotify:track:"+track.track.id
          })
      })
      offset+=limit;
    }
    while(tracks.length>0);
  
    if(playListTracks.length>TRACK_LIMIT_REMOVE){
      var repeats = playListTracks.length/TRACK_LIMIT_REMOVE-1
      var last = playListTracks%TRACK_LIMIT_REMOVE
      for (let index = 0; index < repeats; index++) {
        spotifyApi.removeTracksFromPlaylist(playlistID,playListTracks.splice(index*TRACK_LIMIT_REMOVE,index*TRACK_LIMIT_REMOVE+TRACK_LIMIT_REMOVE)).then(success=>{
        },error=>{
          console.log("error: ",error)
        })
      }
      spotifyApi.removeTracksFromPlaylist(playlistID,playListTracks.splice(repeats*TRACK_LIMIT_REMOVE,repeats*TRACK_LIMIT_REMOVE+last)).then(success=>{
        console.log("playlist successfully cleared")
        return true;
      },error=>{
        console.log("error: ",error)
      })

    }
    spotifyApi.removeTracksFromPlaylist(playlistID,playListTracks).then(success=>{
      console.log("playlist successfully cleared")
      return true;
    },error=>{
      console.log("error: ",error)
    })
    return false;
  }

  async function initPlaylists(){
    setTokens()
    var uPlaylists = await spotifyApi.getUserPlaylists().then(success=>{
      return success.body;
    },error=>{
      console.log(error)
    })
  
    uPlaylists.items.forEach(async playlist => 
      {
        var curPL = await spotifyApi.getPlaylistTracks(playlist.id).then(function(data) {
          return data.body;
        }, function(err) {
          console.log('Something went wrong!', err);
        });
  
        var trackList = []
        await curPL.items.forEach(track=>{
          trackList.push(track.track.id)
        })
  
        if(trackList.length>TRACK_LIMIT_ADD){
          var repeats = trackList.length/TRACK_LIMIT_ADD-1
          var last = trackList.length%TRACK_LIMIT_ADD
          for (let i = 0; i < repeats; i++) {
            await addToSavedTracks(trackList.slice(i*TRACK_LIMIT_ADD,i*TRACK_LIMIT_ADD+TRACK_LIMIT_ADD))
          }
          if(last!=0){
            await addToSavedTracks(trackList.slice(repeats*TRACK_LIMIT_ADD,repeats*TRACK_LIMIT_ADD+last))
          }
        }
        else{
          await addToSavedTracks(trackList)
        }
  });
  }
module.exports = {emptyPlaylist,eliminateOldTracks,getSeedValues,sort_object,addToSavedTracks,generateNewPlaylist,initPlaylists}