#include <windows.h>
#include <cstdint>
#include <steam/steam_api.h>
#include <steam/steam_api_flat.h>

extern "C" uint64_t ssod_steam_id() {
	OutputDebugStringA("Steamworks: Loading DLL\n");

	HMODULE dll = LoadLibraryW(L"steam_api64.dll");

	if (!dll) {
		OutputDebugStringA("Steamworks: DLL not found\n");
		return 0;
	}

	using init_fn = bool (__cdecl *)();
	using shutdown_fn = void (__cdecl *)();
	using get_user_fn = ISteamUser* (__cdecl *)();
	using get_steam_id_fn = uint64_t (__cdecl *)(ISteamUser*);

	auto init = reinterpret_cast<init_fn>(GetProcAddress(dll, "SteamAPI_Init"));
	auto shutdown = reinterpret_cast<shutdown_fn>(GetProcAddress(dll, "SteamAPI_Shutdown"));
	auto get_user = reinterpret_cast<get_user_fn>(GetProcAddress(dll, "SteamAPI_SteamUser_v023"));
	auto get_steam_id = reinterpret_cast<get_steam_id_fn>(GetProcAddress(dll, "SteamAPI_ISteamUser_GetSteamID"));

	if (!init || !shutdown || !get_user || !get_steam_id) {
		OutputDebugStringA("Steamworks: Missing DLL exports\n");
		FreeLibrary(dll);
		return 0;
	}

	OutputDebugStringA("Steamworks: Initialising\n");

	if (!init()) {
		OutputDebugStringA("Steamworks: Initialisation failed\n");
		FreeLibrary(dll);
		return 0;
	}

	OutputDebugStringA("Steamworks: Initialised\n");

	ISteamUser* user = get_user();

	if (!user) {
		OutputDebugStringA("Steamworks: No Steam user interface\n");
		shutdown();
		FreeLibrary(dll);
		return 0;
	}

	OutputDebugStringA("Steamworks: Retrieving SteamID\n");

	uint64_t steam_id = get_steam_id(user);

	OutputDebugStringA("Steamworks: SteamID retrieved\n");

	shutdown();
	FreeLibrary(dll);

	return steam_id;
}