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

	auto init = reinterpret_cast<decltype(&SteamAPI_InitFlat)>(
		GetProcAddress(dll, "SteamAPI_InitFlat")
	);

	auto shutdown = reinterpret_cast<decltype(&SteamAPI_Shutdown)>(
		GetProcAddress(dll, "SteamAPI_Shutdown")
	);

	auto get_user = reinterpret_cast<decltype(&SteamAPI_SteamUser_v023)>(
		GetProcAddress(dll, "SteamAPI_SteamUser_v023")
	);

	auto get_steam_id = reinterpret_cast<decltype(&SteamAPI_ISteamUser_GetSteamID)>(
		GetProcAddress(dll, "SteamAPI_ISteamUser_GetSteamID")
	);

	if (!init || !shutdown || !get_user || !get_steam_id) {
		OutputDebugStringA("Steamworks: Missing DLL exports\n");
		FreeLibrary(dll);
		return 0;
	}

	OutputDebugStringA("Steamworks: Initialising\n");

	SteamErrMsg error{};
	ESteamAPIInitResult result = init(&error);

	if (result != k_ESteamAPIInitResult_OK) {
		OutputDebugStringA("Steamworks: Initialisation failed: ");
		OutputDebugStringA(error);
		OutputDebugStringA("\n");
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