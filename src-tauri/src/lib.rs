
#[cfg(target_os = "windows")]
#[tauri::command]
fn get_steam_id() -> Option<String> {
	use libloading::Library;
	use std::ffi::c_void;

	type SteamInit = unsafe extern "C" fn(*mut c_void) -> i32;
	type SteamShutdown = unsafe extern "C" fn();
	type SteamUser = unsafe extern "C" fn() -> *mut c_void;
	type SteamGetId = unsafe extern "C" fn(*mut c_void) -> u64;

	unsafe {
		let library = Library::new("steam_api64.dll").ok()?;

		let init = library.get::<SteamInit>(b"SteamAPI_InitFlat\0").ok()?;
		let shutdown = library.get::<SteamShutdown>(b"SteamAPI_Shutdown\0").ok()?;
		let get_id = library.get::<SteamGetId>(b"SteamAPI_ISteamUser_GetSteamID\0").ok()?;

		// Find a supported ISteamUser accessor exported by the DLL.
		let versions: &[&[u8]] = &[
			b"SteamAPI_SteamUser_v024\0",
			b"SteamAPI_SteamUser_v023\0",
			b"SteamAPI_SteamUser_v022\0",
			b"SteamAPI_SteamUser_v021\0",
			b"SteamAPI_SteamUser_v020\0",
		];

		let mut user_interface: Option<SteamUser> = None;

		for version in versions {
			if let Ok(symbol) = library.get::<SteamUser>(version) {
				user_interface = Some(*symbol);
				break;
			}
		}

		let user_interface = user_interface?;

		// SteamAPI_InitFlat returns 0 on success.
		if init(std::ptr::null_mut()) != 0 {
			return None;
		}

		let user = user_interface();

		let steam_id = if user.is_null() {
			0
		} else {
			get_id(user)
		};

		shutdown();

		if steam_id == 0 {
			None
		} else {
			Some(steam_id.to_string())
		}
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
