#include <windows.h>
#include <cstdint>
#include <steam/steam_api.h>

extern "C" uint64_t ssod_steam_id() {
	HMODULE dll = LoadLibraryW(L"steam_api64.dll");

	if (!dll) {
		return 0;
	}

	using init_fn = bool (__cdecl *)();
	using shutdown_fn = void (__cdecl *)();
	using get_user_fn = HSteamUser (__cdecl *)();
	using get_pipe_fn = HSteamPipe (__cdecl *)();
	using find_interface_fn = void* (__cdecl *)(HSteamUser, HSteamPipe, const char*);
	using get_steam_id_fn = uint64_t (__cdecl *)(void*);

	auto init = reinterpret_cast<init_fn>(GetProcAddress(dll, "SteamAPI_Init"));
	auto shutdown = reinterpret_cast<shutdown_fn>(GetProcAddress(dll, "SteamAPI_Shutdown"));
	auto get_user = reinterpret_cast<get_user_fn>(GetProcAddress(dll, "SteamAPI_GetHSteamUser"));
	auto get_pipe = reinterpret_cast<get_pipe_fn>(GetProcAddress(dll, "SteamAPI_GetHSteamPipe"));
	auto find_interface = reinterpret_cast<find_interface_fn>(GetProcAddress(dll, "SteamInternal_FindOrCreateUserInterface"));
	auto get_steam_id = reinterpret_cast<get_steam_id_fn>(GetProcAddress(dll, "SteamAPI_ISteamUser_GetSteamID"));

	uint64_t result = 0;

	if (init && shutdown && get_user && get_pipe && find_interface && get_steam_id && init()) {
		void* user = find_interface(get_user(), get_pipe(), STEAMUSER_INTERFACE_VERSION);

		if (user) {
			result = get_steam_id(user);
		}

		shutdown();
	}

	FreeLibrary(dll);
	return result;
}