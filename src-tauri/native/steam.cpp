#include <cstdint>
#include <steam/steam_api.h>

extern "C" uint64_t ssod_steam_id() {
	if (!SteamAPI_Init()) {
		return 0;
	}

	ISteamUser* user = SteamUser();

	if (!user) {
		SteamAPI_Shutdown();
		return 0;
	}

	const uint64_t steam_id = user->GetSteamID().ConvertToUint64();

	SteamAPI_Shutdown();

	return steam_id;
}