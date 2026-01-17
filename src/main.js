import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";

let songs=[];
let currentIndex=0;
let isPlaying=false;

const audioPlayer=document.getElementById('audioPlayer');
const albumArt=document.getElementById('albumArt');
const songTitle=document.getElementById('songTitle');
const playBtn=document.getElementById('playBtn');
const prevBtn=document.getElementById('prevBtn');
const nextBtn=document.getElementById('nextBtn');
const songList=document.getElementById('songList');

// load songs
async function loadSongs() {
  try {
    const musicFolder=await invoke('get_music_folder');
    console.log('Music folder:',musicFolder);

    songs=await invoke('get_songs', { musicFolder });
    console.log('Found songs: ', songs);

    if(songs.length>0)
    {
      displayPlaylist();
      loadSong(0);
    } else {
      songTitle.textContent='No songs found in music folder';
    }
  } catch(error ){
    console.error('Error loading songs:', error);
    songTitle.textContent='Error: '+error;
  }
}

// display playlist
function displayPlaylist() {
  songList.innerHTML='';
  songs.forEach((song, index) => {
    const li=document.createElement('li');
    li.textContent=song.name;
    li.onclick=() => loadSong(index);
    if (index===currentIndex)
    {
      li.classList.add('active');
    }
    songList.appendChild(li);
  });
}

function loadSong(index) {
  if(songs.length===0) return;
  
  currentIndex=index;
  const song=songs[currentIndex];

  //convert file paths to urls
  const audioSrc=convertFileSrc(song.path);
  const coverSrc=song.cover?convertFileSrc(song.cover):'';

  console.log('Loading song:', song.name);
  console.log('Audio source:', audioSrc);
  console.log('Cover source:', coverSrc);

  audioPlayer.src=audioSrc;
  songTitle.textContent=song.name;
  albumArt.src=coverSrc || 'https://via.placeholder.com/300x300?text=No+Cover';

  displayPlaylist();

  if(isPlaying) {
    audioPlayer.play();
  }
}

// play/pause
playBtn.onclick=() => {
  if(isPlaying){
    audioPlayer.pause();
    playBtn.textContent='▶ Play';
    isPlaying = false;
  } else {
    audioPlayer.play();
    playBtn.textContent='⏸ Pause';
    isPlaying=true;
  }
};

prevBtn.onclick=() => {
  currentIndex=(currentIndex-1+songs.length)%songs.length;
  loadSong(currentIndex);
};

nextBtn.onclick=() => {
  currentIndex=(currentIndex+1)%songs.length;
  loadSong(currentIndex);
};

audioPlayer.onended=()=> {
  nextBtn.click();
};

audioPlayer.onplay = () => {
  isPlaying = true;
  playBtn.textContent = '⏸ Pause';
};

audioPlayer.onpause = () => {
  isPlaying = false;
  playBtn.textContent = '▶ Play';
};


window.addEventListener('DOMContentLoaded',() => {
  loadSongs();
});