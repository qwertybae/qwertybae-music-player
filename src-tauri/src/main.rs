// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Song {
    name: String,
    path: String,
    cover: String,
}

// scan music folder
#[tauri::command]
fn get_songs(app: tauri::AppHandle, music_folder: String) -> Result<Vec<Song>, String> {
    let mut songs = Vec::new();
    
    let entries = fs::read_dir(&music_folder)
        .map_err(|e| format!("Cannot read folder: {}", e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
        let path = entry.path();
        
        if let Some(ext) = path.extension() {
            if ext == "mp3" {
                let file_name = path.file_stem()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();
                
                let song_path = path.to_str().unwrap_or("").to_string();
                
                // cover with the same name
                let mut cover_path = PathBuf::from(&music_folder);
                cover_path.push(format!("{}.png", file_name));
                
                let cover = if cover_path.exists() {
                    cover_path.to_str().unwrap_or("").to_string()
                } else {
                    String::new()
                };
                
                songs.push(Song {
                    name: file_name,
                    path: song_path,
                    cover,
                });
            }
        }
    }
    
    songs.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(songs)
}

#[tauri::command]
fn get_music_folder() -> String {
    // 
    let mut path = std::env::current_dir().unwrap_or_default();
    path.push("music");
    path.to_str().unwrap_or("").to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_songs, get_music_folder])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn main() {
    run();
}