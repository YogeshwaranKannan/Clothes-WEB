import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-loading-screen",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./loading-screen.component.html",
  styleUrls: ["./loading-screen.component.scss"],
})
export class LoadingScreenComponent {
  @Input() show = false;
  @Input() message = "Loading...";

  /**
   * true (default): overlay is `position: fixed` and covers the whole
   * viewport — unchanged behavior for existing callers (product detail,
   * checkout review, cart summary).
   *
   * false: overlay is `position: absolute` and only covers its own
   * positioned host element instead of the whole screen. Use this for a
   * loader nested under the persistent app shell (<app-header>/<app-navbar>
   * in app.component.html) — e.g. <app-categories> on Home — so it never
   * paints over the header/navbar while that section's own data reloads.
   */
  @Input() fullScreen = true;
}
