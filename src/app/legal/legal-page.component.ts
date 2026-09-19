import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { LEGAL_PAGES, LegalPage } from "./legal-content";

@Component({
  selector: "app-legal-page",
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page" *ngIf="page as p">
      <div class="legal-container">
        <a class="legal-back" routerLink="/">&larr; Back to home</a>

        <h1 class="legal-title">{{ p.title }}</h1>
        <p class="legal-updated">Last updated: {{ p.updated }}</p>

        <p class="legal-intro" *ngIf="p.intro">{{ p.intro }}</p>

        <section class="legal-section" *ngFor="let s of p.sections">
          <h2>{{ s.heading }}</h2>
          <ng-container *ngFor="let line of s.body">
            <li *ngIf="line.startsWith('- ')">{{ line.slice(2) }}</li>
            <p *ngIf="!line.startsWith('- ')">{{ line }}</p>
          </ng-container>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .legal-page {
        background: #fff;
        min-height: 60vh;
        padding: 2.5rem 1rem 4rem;
      }
      .legal-container {
        max-width: 820px;
        margin: 0 auto;
      }
      .legal-back {
        display: inline-block;
        margin-bottom: 1.5rem;
        color: var(--color-primary, #0b5ed7);
        text-decoration: none;
        font-size: 0.95rem;
        font-weight: 600;
      }
      .legal-back:hover {
        text-decoration: underline;
      }
      .legal-title {
        font-size: 2rem;
        font-weight: 800;
        color: #14231f;
        margin: 0 0 0.35rem;
      }
      .legal-updated {
        color: #6b7770;
        font-size: 0.9rem;
        margin: 0 0 1.5rem;
      }
      .legal-intro {
        font-size: 1.05rem;
        color: #2a332e;
        margin-bottom: 2rem;
        line-height: 1.6;
      }
      .legal-section {
        margin-bottom: 1.8rem;
      }
      .legal-section h2 {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--color-primary, #0b5ed7);
        margin: 0 0 0.6rem;
      }
      .legal-section p {
        color: #2a332e;
        line-height: 1.65;
        margin: 0 0 0.7rem;
      }
      .legal-section li {
        color: #2a332e;
        line-height: 1.65;
        margin: 0 0 0.4rem 1.2rem;
      }
      @media (max-width: 600px) {
        .legal-title {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class LegalPageComponent {
  private route = inject(ActivatedRoute);
  page: LegalPage | undefined;

  constructor() {
    const slug = this.route.snapshot.data["slug"] as string;
    this.page = LEGAL_PAGES[slug];
  }
}
