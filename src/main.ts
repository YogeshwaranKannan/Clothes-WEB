// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { AppComponent } from './app/app.component';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));

import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";

const path = window.location.pathname;
const segments = path.split("/");

// Check if the first path segment is "wisegrocer" (case-insensitive)
if (
  segments.length > 1 &&
  segments[1].toLowerCase() === "dolphin-naturals" &&
  segments[1] !== "dolphin-naturals"
) {
  segments[1] = "dolphin-naturals";

  const newUrl =
    segments.join("/") + window.location.search + window.location.hash;

  // Redirect to the canonical URL
  window.location.replace(newUrl);
} else {
  bootstrapApplication(AppComponent, appConfig).catch((err) =>
    console.error(err),
  );
}
