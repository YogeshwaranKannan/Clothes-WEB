import { Component } from "@angular/core";
import { companyname } from "../../utils/constant";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  // Real hrefs (not click handlers) so search engines can follow these links
  readonly legalBase = `/${companyname.replace(/^\/+|\/+$/g, "")}`;
}
