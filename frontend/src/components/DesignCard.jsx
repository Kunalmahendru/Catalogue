import { memo } from "react";
import { formatPrice, thumbUrl } from "../links.js";

function DesignCard({ design, onOpen }) {
  return (
    <button className="card" onClick={() => onOpen(design)} aria-label={`View ${design.title}`}>
      <div className="card__media">
        <img src={thumbUrl(design)} alt={design.title} loading="lazy" decoding="async" draggable="false" />
        {design.featured && <span className="badge">✦ Fave</span>}
      </div>
      <div className="card__body">
        <h3>{design.title}</h3>
        <p>
          <span>{design.category}</span>
          <span className="dot" />
          <span>{formatPrice(design.price)}</span>
        </p>
      </div>
    </button>
  );
}

export default memo(DesignCard);
