fn main() {
	#[cfg(target_os = "windows")]
	{
		cc::Build::new()
			.cpp(true)
			.file("native/steam.cpp")
			.include("native/steamworks/public")
			.compile("ssod_steam");
	}

	tauri_build::build();
}