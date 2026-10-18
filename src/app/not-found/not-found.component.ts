import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="not-found">
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <a routerLink="/" class="btn btn-primary">Back to home</a>
    </section>
  `,
  styles: [
    `
      .not-found {
        text-align: center;
        padding: 4rem 1rem;
      }
      .not-found h1 {
        font-size: 1.75rem;
        margin-bottom: 0.75rem;
      }
      .not-found p {
        margin-bottom: 1.5rem;
      }
    `,
  ],
})
export class NotFoundComponent {}
