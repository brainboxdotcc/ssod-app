#[cfg(target_os = "windows")]
unsafe extern "C" {
	fn ssod_steam_id() -> u64;
}

#[cfg(target_os = "windows")]
#[tauri::command]
fn get_steam_id() -> Option<String> {
	let id = unsafe { ssod_steam_id() };

	if id == 0 {
		None
	} else {
		Some(id.to_string())
	}
}

#[cfg(not(target_os = "windows"))]
#[tauri::command]
fn get_steam_id() -> Option<String> {
	None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder::default()
		.invoke_handler(tauri::generate_handler![get_steam_id])
		.setup(|app| {
			if cfg!(debug_assertions) {
				app.handle().plugin(
					tauri_plugin_log::Builder::default()
						.level(log::LevelFilter::Info)
						.build(),
				)?;
			}

			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while building tauri application");
}