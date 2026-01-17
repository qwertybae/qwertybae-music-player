// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Song {
    name: String,
    path: String,
    cover: String,
}

// scan music folder
#[tauri::command]
fn get_songs(music_folder: String) -> Result<Vec<Song>, String> {
    println!("🔍 Scanning folder: {}", music_folder);
    
    let mut songs = Vec::new();
    
    let entries = fs::read_dir(&music_folder)
        .map_err(|e| format!("Cannot read folder '{}': {}", music_folder, e))?;
    
    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
        let path = entry.path();
        
        println!(" Found file: {:?}", path);
        
        if let Some(ext) = path.extension() {
            if ext == "mp3" || ext == "MP3" {
                let file_name = path.file_stem()
                    .and_then(|n| n.to_str())
                    .unwrap_or("")
                    .to_string();
                
                let song_path = path.to_str().unwrap_or("").to_string();
                
                // cover with the same name (check both png and jpg)
                let mut cover_path = PathBuf::from(&music_folder);
                cover_path.push(format!("{}.png", file_name));
                
                if !cover_path.exists() {
                    cover_path = PathBuf::from(&music_folder);
                    cover_path.push(format!("{}.jpg", file_name));
                }
                
                let cover = if cover_path.exists() {
                    println!("  Found cover: {:?}", cover_path);
                    cover_path.to_str().unwrap_or("").to_string()
                } else {
                    println!(" No cover for: {}", file_name);
                    String::new()
                };
                
                songs.push(Song {
                    name: file_name.clone(),
                    path: song_path,
                    cover,
                });
                
                println!(" Added song: {}", file_name);
            }
        }
    }
    
    songs.sort_by(|a, b| a.name.cmp(&b.name));
    println!(" Total songs found: {}", songs.len());
    Ok(songs)
}

#[tauri::command]
fn get_music_folder() -> String {
    
    let current = std::env::current_dir().unwrap_or_default();
    println!(" Current directory: {:?}", current);
    
    
    let mut path = current.clone();
    if path.ends_with("src-tauri") {
        path.pop(); 
    }
    path.push("music");
    
    println!("Music folder path: {:?}", path);
    println!("Folder exists: {}", path.exists());
    
    if !path.exists() {
        println!("  Creating music folder...");
        let _ = fs::create_dir_all(&path);
    }
    
    if let Ok(entries) = fs::read_dir(&path) {
        println!(" Contents of music folder:");
        for entry in entries {
            if let Ok(entry) = entry {
                println!("  - {:?}", entry.file_name());
            }
        }
    }
    
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