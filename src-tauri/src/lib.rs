
#[cfg(target_os = "windows")]
#[tauri::command]
fn get_steam_id() -> Option<String> {
	use libloading::{Library, Symbol};
	use std::ffi::{c_char, c_void, CStr};

	unsafe {
		let library = Library::new("steam_api64.dll").ok()?;

		type Init = unsafe extern "C" fn() -> bool;
		type GetHSteamUser = unsafe extern "C" fn() -> i32;
		type GetHSteamPipe = unsafe extern "C" fn() -> i32;
		type GetSteamUser = unsafe extern "C" fn(i32, i32, *const c_char) -> *mut c_void;
		type GetSteamID = unsafe extern "C" fn(*mut c_void) -> u64;

		let init: Symbol<Init> = library.get(b"SteamAPI_Init\0").ok()?;
		let get_user: Symbol<GetHSteamUser> = library.get(b"SteamAPI_GetHSteamUser\0").ok()?;
		let get_pipe: Symbol<GetHSteamPipe> = library.get(b"SteamAPI_GetHSteamPipe\0").ok()?;
		let get_interface: Symbol<GetSteamUser> = library.get(b"SteamInternal_FindOrCreateUserInterface\0").ok()?;
		let get_steam_id: Symbol<GetSteamID> = library.get(b"SteamAPI_ISteamUser_GetSteamID\0").ok()?;

		if !init() {
			return None;
		}

		let user = get_user();
		let pipe = get_pipe();

		if user == 0 || pipe == 0 {
			return None;
		}

		let interface = get_interface(user, pipe, b"SteamUser023\0".as_ptr().cast());

		if interface.is_null() {
			return None;
		}

		let steam_id = get_steam_id(interface);

		if steam_id == 0 {
			return None;
		}

		Some(steam_id.to_string())
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
