import { WhatsAppIcon } from "./Icons.jsx";
import { bulkMessage, whatsappUrl } from "../links.js";

const PERKS = ["Reusable press-ons", "Premium quality", "Customized designs made for you", "Share any design on WhatsApp", "Bulk orders welcome", "Wholesale available"];

export default function Offer({ site }) {
  return (
    <section className="offer" aria-labelledby="offer-title">
      <div className="offer__inner">
        <div className="offer__copy">
          <p className="eyebrow">✦ Press-on nails</p>
          <h2 id="offer-title">Premium handmade press‑ons</h2>
          <ul className="offer__perks">
            {PERKS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="offer__cta">
          <p>Planning a bulk or custom order? Tell us what you need.</p>
          <a className="btn btn--wa" href={whatsappUrl(site, bulkMessage())} target="_blank" rel="noreferrer">
            <WhatsAppIcon /> Get a quote
          </a>
        </div>
      </div>
    </section>
  );
}
