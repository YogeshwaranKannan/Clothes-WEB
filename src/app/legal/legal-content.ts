export interface LegalSection {
  heading: string;
  body: string[]; // paragraphs; a line starting with "- " is rendered as a bullet
}

export interface LegalPage {
  slug: string;
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}

const STORE_NAME = "Dolphin Supermarket & Organic Store";
const STORE_ADDRESS = "Vadaseri Road, Ullikkottai, Tamil Nadu - 614018";
const STORE_EMAIL = "dolphinsupermarket@gmail.com";
const STORE_PHONE = "+91 93450 48872";
const LAST_UPDATED = "14 August 2026";

export const LEGAL_PAGES: Record<string, LegalPage> = {
  "terms-of-service": {
    slug: "terms-of-service",
    title: "Terms of Service",
    updated: LAST_UPDATED,
    intro: `These Terms of Service ("Terms") govern your use of the ${STORE_NAME} website and ordering service. By browsing our site or placing an order, you agree to these Terms.`,
    sections: [
      {
        heading: "1. Who can order",
        body: [
          "Our website is for placing grocery and organic-produce orders for personal or household use. You must be able to enter a legally binding agreement to place an order, and you're responsible for the accuracy of the delivery details and contact information you give us.",
        ],
      },
      {
        heading: "2. Orders and pricing",
        body: [
          "Prices, offers, and product availability shown on the site can change without notice, and occasional errors in a listed price or description may occur. If we discover a pricing error on an order you've placed, we'll contact you before dispatching it.",
          "- We may cancel or adjust an order if an item is out of stock, incorrectly priced, or unavailable at the time of packing",
          "- Placing an order does not guarantee availability until we confirm it",
        ],
      },
      {
        heading: "3. Delivery",
        body: [
          "We deliver to the areas we currently serve around Ullikkottai and nearby localities. Delivery windows are estimates, not guarantees, and can be affected by weather, traffic, or stock availability. Please see our Shipping Policy for full details.",
        ],
      },
      {
        heading: "4. Payments",
        body: [
          "Payments are processed through the payment options shown at checkout. We do not store your full card or UPI credentials on our servers — that's handled by our payment provider.",
        ],
      },
      {
        heading: "5. Returns, refunds and cancellations",
        body: [
          "Our Refund Policy explains how to report a damaged, incorrect, or missing item, and how refunds are issued for eligible cases.",
        ],
      },
      {
        heading: "6. Acceptable use",
        body: [
          "You agree not to misuse the site — for example, by attempting to access accounts that aren't yours, interfering with the site's operation, or submitting false order or payment information.",
        ],
      },
      {
        heading: "7. Limitation of liability",
        body: [
          `${STORE_NAME} is not liable for delays or losses caused by circumstances outside our reasonable control, such as courier delays, weather, or supplier shortages. Nothing in these Terms limits any right you have under Indian consumer protection law.`,
        ],
      },
      {
        heading: "8. Changes to these Terms",
        body: [
          "We may update these Terms from time to time. The version posted on this page is the one that applies to your orders going forward.",
        ],
      },
      {
        heading: "9. Contact",
        body: [
          `Questions about these Terms can be sent to ${STORE_EMAIL} or ${STORE_PHONE}. Our full contact details are on the Contact Us page.`,
        ],
      },
    ],
  },

  "privacy-policy": {
    slug: "privacy-policy",
    title: "Privacy Policy",
    updated: LAST_UPDATED,
    intro: `This Privacy Policy explains what information ${STORE_NAME} collects when you use our website, and how we use and protect it.`,
    sections: [
      {
        heading: "1. Information we collect",
        body: [
          "- Contact details you give us: name, phone number, email address, and delivery address",
          "- Order details: items purchased, order value, and order history",
          "- Payment confirmation from our payment provider (we do not receive or store your full card, UPI PIN, or net-banking credentials)",
          "- Basic technical data such as browser type and pages visited, used to keep the site working properly",
        ],
      },
      {
        heading: "2. How we use it",
        body: [
          "- To take, pack, and deliver your orders",
          "- To contact you about an order — confirmations, delivery updates, or issues with an item",
          "- To respond to questions sent through the Contact Us page",
          "- To improve the site and our product range",
        ],
      },
      {
        heading: "3. What we don't do",
        body: [
          "We do not sell your personal information to third parties, and we do not use your order history for third-party advertising.",
        ],
      },
      {
        heading: "4. Sharing information",
        body: [
          "We share only what's needed to fulfil your order: your delivery details with our delivery staff or courier partner, and payment information with our payment gateway provider. These partners are only permitted to use your data to complete the service we've asked them for.",
        ],
      },
      {
        heading: "5. Data retention",
        body: [
          "We keep order records for as long as needed for accounting, warranty, and legal purposes. You can ask us to delete your account information at any time, subject to what we're required to retain by law.",
        ],
      },
      {
        heading: "6. Your choices",
        body: [
          "- Ask us to correct inaccurate contact or delivery details",
          "- Ask us what information we hold about you",
          "- Ask us to delete your account information, where we're not required to keep it",
        ],
      },
      {
        heading: "7. Security",
        body: [
          "We take reasonable technical and organisational steps to protect your information, but no method of storage or transmission over the internet is completely secure.",
        ],
      },
      {
        heading: "8. Contact",
        body: [
          `For privacy questions or requests, write to ${STORE_EMAIL} or call ${STORE_PHONE}.`,
        ],
      },
    ],
  },

  "data-protection": {
    slug: "data-protection",
    title: "Data Protection Statement",
    updated: LAST_UPDATED,
    intro: `This statement sets out, in short form, how ${STORE_NAME} handles the personal data of customers who order through our website, alongside our Privacy Policy.`,
    sections: [
      {
        heading: "1. Lawful basis for processing",
        body: [
          "We process your contact and order details because it's necessary to fulfil the order contract between us, to respond to your enquiries, and to meet our accounting and tax obligations.",
        ],
      },
      {
        heading: "2. Where your data is stored",
        body: [
          "Order and account data is stored on secure servers used to run our website and order management system. Access is limited to staff who need it to process your orders.",
        ],
      },
      {
        heading: "3. Third parties involved in your order",
        body: [
          "- Our payment gateway, to process payment for your order",
          "- Delivery staff or courier partners, to deliver your order to the address you provide",
          "- Our website hosting provider, which stores the site and its data",
        ],
      },
      {
        heading: "4. Data minimisation",
        body: [
          "We only ask for the information needed to take and deliver an order — we don't collect data we don't have a use for.",
        ],
      },
      {
        heading: "5. Your rights",
        body: [
          "You can ask what data we hold about you, ask us to correct it, or ask us to delete it where we're not legally required to keep it. Contact us using the details below to make a request.",
        ],
      },
      {
        heading: "6. Contact",
        body: [
          `For any data protection request, email ${STORE_EMAIL} or call ${STORE_PHONE}. We'll aim to respond within a reasonable time.`,
        ],
      },
    ],
  },

  "contact-us": {
    slug: "contact-us",
    title: "Contact Us",
    updated: LAST_UPDATED,
    sections: [
      {
        heading: "Store address",
        body: [`${STORE_NAME}`, STORE_ADDRESS],
      },
      {
        heading: "Get in touch",
        body: [
          `- Email: ${STORE_EMAIL}`,
          `- Phone: ${STORE_PHONE}`,
          "- Hours: Open daily for orders and store visits",
        ],
      },
      {
        heading: "Order support",
        body: [
          "For questions about an existing order — delivery status, a missing item, or a damaged product — please have your order number ready and reach out through the phone number or email above, or visit our Refund Policy for how returns are handled.",
        ],
      },
    ],
  },

  "refund-policy": {
    slug: "refund-policy",
    title: "Refund Policy",
    updated: LAST_UPDATED,
    intro: `At ${STORE_NAME}, freshness and quality are our commitment. Here's how we handle damaged, incorrect, or missing items.`,
    sections: [
      {
        heading: "1. Reporting an issue",
        body: [
          "If an item arrives damaged, spoiled, incorrect, or missing from your order, please contact us within 24 hours of delivery with your order number and, where possible, a photo of the item.",
        ],
      },
      {
        heading: "2. What we offer",
        body: [
          "- A replacement of the affected item where stock is available",
          "- A refund to your original payment method, or store credit, where a replacement isn't possible",
          "- Because we sell fresh produce and perishables, we're only able to accept issues reported promptly — we can't accept returns of perishable goods once they've been consumed or kept beyond a reasonable inspection period",
        ],
      },
      {
        heading: "3. Non-returnable items",
        body: [
          "Fresh produce, dairy, and perishable items can only be exchanged or refunded if there's a genuine quality, damage, or accuracy issue reported promptly — not for a simple change of mind, given their limited shelf life.",
        ],
      },
      {
        heading: "4. Refund timing",
        body: [
          "Once a refund is approved, it's processed back to your original payment method; the time it takes to reflect in your account depends on your bank or payment provider.",
        ],
      },
      {
        heading: "5. How to reach us",
        body: [
          `Email ${STORE_EMAIL} or call ${STORE_PHONE} with your order number to start a return or refund.`,
        ],
      },
    ],
  },

  "shipping-policy": {
    slug: "shipping-policy",
    title: "Shipping Policy",
    updated: LAST_UPDATED,
    sections: [
      {
        heading: "1. Delivery area",
        body: [
          "We currently deliver to Ullikkottai and surrounding localities we service from our store on Vadaseri Road. If your address falls outside our delivery area, this will be shown at checkout.",
        ],
      },
      {
        heading: "2. Delivery time",
        body: [
          "Most orders are delivered the same day or next day, depending on when the order is placed and the items selected. Estimated delivery windows are shown at checkout and are not guaranteed, as fresh-produce sourcing and local conditions can affect timing.",
        ],
      },
      {
        heading: "3. Delivery charges",
        body: [
          "Any delivery charge for your order, or the minimum order value for free delivery, is shown at checkout before you pay.",
        ],
      },
      {
        heading: "4. Order tracking and issues",
        body: [
          "If your order hasn't arrived within the estimated window, contact us with your order number and we'll check its status with our delivery team.",
        ],
      },
      {
        heading: "5. Contact",
        body: [
          `For delivery questions, reach us at ${STORE_EMAIL} or ${STORE_PHONE}.`,
        ],
      },
    ],
  },
};
