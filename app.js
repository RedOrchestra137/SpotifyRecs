var express = require("express");
var app = express();
var util = require('./utilFuncs')
const dotenv = require('dotenv');
dotenv.config();


//Authorization
var scopes = ['playlist-modify-public','playlist-modify-public','user-library-modify','playlist-read-private','user-library-read']
var code;
var SpotifyWebApi = require('spotify-web-api-node');
var spotifyApi = new SpotifyWebApi({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI
});


app.use(express.static(__dirname))

app.get("/returncode",(req,res)=>{
  var retstate = req.query.state;
  if(process.env.STATE==retstate){
    console.log("Code: "+req.query.code)
    code = req.query.code;
    spotifyApi.authorizationCodeGrant(code).then(
      function(data) {
        // Set the access token on the API object to use it in later calls
        spotifyApi.setAccessToken(data.body['access_token']);
        process.env.ACCESS_TOKEN = data.body['access_token']
        spotifyApi.setRefreshToken(data.body['refresh_token']);
        process.env.REFRESH_TOKEN = data.body['refresh_token']
        res.send('authorized, you can proceed using other endpoints now')
      },
      function(err) {
        console.log('Something went wrong!', err);
      }
    );
  }

})
app.get("/getAuthURL",(req,res)=>{
  var authorizeURL = spotifyApi.createAuthorizeURL(scopes, process.env.STATE);

  if(authorizeURL){
    res.redirect(authorizeURL)
  }
  else{
    res.status(403).send();
  }
})

app.use((req,res,next)=>{
  if(code){
    next();
  }
  else{
    res.redirect('/getAuthURL')
  }
})
app.get("/prepPlaylists",async (req,res)=>{
 await util.initPlaylists();
 res.send("prepped user playlists")
})

app.get("/generatePlaylist",async (req,res)=>{
  var generatedIDS = await util.generateNewPlaylist();
  var discoverAnytime = []
  generatedIDS.forEach(trackID=>{
    discoverAnytime.push("spotify:track:"+trackID) 
  })

  await spotifyApi.addTracksToPlaylist(process.env.DISCOVER_ID,discoverAnytime)
  console.log("Done")
  res.send("new tracks generated")
})

app.get("/emptyPlaylist",async(req,res)=>{
  var check  = await util.emptyPlaylist(process.env.DISCOVER_ID,50,0)
  if(check){
    res.send("Playlist successfully cleared").status(200)
  }
  else{
    res.send().status(500)
  }

})

app.listen(process.env.PORT,()=>{console.log(`app listening on port ${process.env.PORT}`)})