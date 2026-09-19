import { Component, Input } from "@angular/core";
import { companyname } from "../../utils/constant";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  openInNewTab(route: string): void {
    const cleanCompany = companyname.replace(/^\/+|\/+$/g, "");
    const cleanRoute = route.replace(/^\/+/, "");

    const url = `${window.location.origin}/${cleanCompany}/${cleanRoute}`;

    console.log("Opening:", url);

    window.open(url, "_blank");
  }
}
