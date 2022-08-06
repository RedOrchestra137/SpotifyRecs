# SpotifyRecsAlternative
Alternative to Spotify Discover Weekly

## Intro
Simple NodeJS backend that allows you to generate a playlist of new tracks that are guaranteed not to be in your library.
For this to work we'll need to do some preparation first. If, however, you are already satisfied with the quantity of tracks in your liked playlist this may not be necessary. 
The API can only perform checks on your saved or 'liked' tracks, so if we want the playlist to be mostly unique we'll need to adapt to that. 

First off, set up an application via the Spotify Developer Dashboard. You'll need the client id and secret to use later on. Also set a redirect uri like so: your_domain/returncode

## Authorization

In order to be able to do anything, you'll need a token first. To get one, you simply navigate to any route within the domain that hosts the application. You'll be redirected to the spotify website, where you can log in and grant the application access to certain parts of your account.
After that, you can call any of the endpoints that's provided in the Node server. 

## Environment Variables

Another essential part in getting this to work is to create a .env file in the root directory of your cloned repo, the one that also contains app.js.

It should be structured like this, filling in your own values ofc


```
(see intro for where to get id and secret)

CLIENT_ID= ____

CLIENT_SECRET= ____

REDIRECT_URI = your_domain/returncode

(Can be found in playlist url. https://open.spotify.com/playlist/your_playlist_id?si=other_stuff)
DISCOVER_ID = your_playlist_id

STATE = random_value

(eg. 3000)
PORT = ____

```
## Endpoints

*your_domain/prepPlaylists* | **GET**

To add all tracks in your current playlists to your liked ones, for use in checks later on.

*your_domain/generatePlaylist* | **GET**

Fill your provided playlist based on a randomly chosen portion of tracks and artists in your library, guaranteed not to contain any duplicate tracks from your liked playlist. This is sort of like the Discover Weekly feature Spotify offers, except you can use it as often as you want instead of having to wait a week for a measly 30 tracks.

Might take a couple minutes to fully complete depending on the length of your saved tracks playlist.

*your_domain/emptyPlaylist* | **GET**

Empty your provided playlist in case the generated tracks weren't to your liking or you'd simply like to generate more.

*your_domain/getAuthURL* | **GET**

Get url to authorize yourself with Spotify. Should be called automatically.

*your_domain/returncode* | **GET**

Set Access Token and Refresh Token for your current session.
