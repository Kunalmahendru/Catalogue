import { InstagramIcon } from "./Icons.jsx";

const POINTS = [
  { title: "Made by hand", text: "Every set is shaped, painted and finished by hand, so each one is a little different." },
  { title: "Every style", text: "Chrome, French, 3D charms and everything in between, with new looks added all the time." },
  { title: "Made for you", text: "Custom designs, your size and wholesale or bulk orders. Just tell us what you have in mind." },
];

export default function About({ site }) {
  return (
    <section className="about" id="about" aria-labelledby="about-title">
      <div className="about__copy">
        <p className="eyebrow">✦ About</p>
        <h2 id="about-title">Hi, we're {site.brand}</h2>
        <p className="about__lead">
          We make premium handmade press-on nails: salon-style nail art you can put on at home, reuse, and wear to match your mood.
          From a quiet French tip to a full 3D charm moment, there is a set for every look.
        </p>
        <p className="about__lead">
          {site.stats.orders_delivered} orders delivered across {site.stats.states} states, and counting. Browse the catalogue, pick a look and book it on WhatsApp.
        </p>
        <a className="btn btn--ghost" href={site.instagram_url} target="_blank" rel="noreferrer">
          <InstagramIcon /> Follow @{site.instagram}
        </a>
      </div>
      <ul className="about__points">
        {POINTS.map((p) => (
          <li key={p.title}>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
