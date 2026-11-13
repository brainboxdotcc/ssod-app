fn main() {
	#[cfg(target_os = "windows")]
	{
		cc::Build::new()
			.cpp(true)
			.file("native/steam.cpp")
			.include("native/steamworks/public")
			.compile("ssod_steam");

		println!("cargo:rustc-link-search=native=native/steamworks/redistributable_bin/win64");
		println!("cargo:rustc-link-lib=dylib=steam_api64");
	}

	tauri_build::build();
}