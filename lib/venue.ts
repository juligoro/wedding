// Venue navigation links, shared by the confirmation email and the landing FAQ.

// Google Maps link for the venue (override with EVENT_MAP_URL in your env).
const DEFAULT_MAP_URL =
  "https://www.google.com/maps?q=Janos+Quinta,+Av.+Pres.+Arturo+Umberto+Illia+12802-12900,+B1669+Del+Viso,+Provincia+de+Buenos+Aires&ftid=0x95bc993b005e22c9:0xb3cf995bc6679d2c&entry=gps&shh=CAE&lucs=,94297699,94231188,94280568,47071704,94218641,94282134,100813464,94286869&g_ep=CAISEjI2LjIyLjIuOTIxMTAxNzU3MBgAIIgnKkksOTQyOTc2OTksOTQyMzExODgsOTQyODA1NjgsNDcwNzE3MDQsOTQyMTg2NDEsOTQyODIxMzQsMTAwODEzNDY0LDk0Mjg2ODY5QgJBUg%3D%3D&skid=df8b08af-b870-4b0a-82ee-56f71f9299ee&g_st=ia";

// Waze deep link to the venue (override with EVENT_WAZE_URL in your env).
const DEFAULT_WAZE_URL = "https://waze.com/ul?q=Janos%20Quinta%20Del%20Viso&navigate=yes";

export function getMapUrl(): string {
  return (process.env.EVENT_MAP_URL || DEFAULT_MAP_URL).trim();
}

export function getWazeUrl(): string {
  return (process.env.EVENT_WAZE_URL || DEFAULT_WAZE_URL).trim();
}
