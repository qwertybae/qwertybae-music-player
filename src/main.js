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
const progressFill=document.getElementById('progressFill');
const progressBar=document.querySelector('.progress-bar');
const playIcon=document.getElementById('playIcon');

// load songs
async function loadSongs() {
  try {
    const musicFolder=await invoke('get_music_folder');
    console.log('Music folder:',musicFolder);

    songs=await invoke('get_songs', { musicFolder: musicFolder });
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


function displayPlaylist() {

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
    isPlaying = false;
  } else {
    audioPlayer.play();
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
  isPlaying = true;  
  currentIndex=(currentIndex+1)%songs.length;
  loadSong(currentIndex);  
};

audioPlayer.onplay = () => {
  isPlaying = true;
  playBtn.classList.add('playing');
};

audioPlayer.onpause = () => {
  isPlaying = false;
  playBtn.classList.remove('playing');
};

audioPlayer.ontimeupdate = () => {
  if(audioPlayer.duration) {
    const progress=(audioPlayer.currentTime/audioPlayer.duration) * 100;
    progressFill.style.width=progress+'%';
  }
}

progressBar.onclick =(e) => {
  const rect=progressBar.getBoundingClientRect();
  const percent=(e.clientX-rect.left)/rect.width;
  audioPlayer.currentTime=percent*audioPlayer.duration;
};

window.addEventListener('DOMContentLoaded',() => {
  loadSongs();
});