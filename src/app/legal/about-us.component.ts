import { Component } from "@angular/core";
import { LegalPageComponent } from "./legal-page.component";

// Renders the "about-us" entry from legal-content.ts using the shared
// policy-page layout (the route supplies `data.slug`).
@Component({
  selector: "app-about-us",
  standalone: true,
  imports: [LegalPageComponent],
  template: `<app-legal-page></app-legal-page>`,
})
export class AboutUsComponent {}
