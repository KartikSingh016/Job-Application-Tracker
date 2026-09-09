import { Link } from "react-router-dom";

// Career-launch illustration + first-run CTA, lifted from the Stitch design.
export default function EmptyState() {
  return (
    <section className="card empty-state">
      <div className="empty-art">
        <svg viewBox="0 0 200 200" fill="none" width="100%" height="100%" aria-hidden="true">
          <circle cx="100" cy="100" r="76" fill="#F1F5F9" />
          <circle cx="100" cy="100" r="64" fill="#E2E8F0" opacity="0.5" />
          {/* floating job cards */}
          <rect x="35" y="45" width="45" height="30" rx="6" fill="#CBD5E1" opacity="0.6" transform="rotate(-12 35 45)" />
          <rect x="130" y="55" width="40" height="28" rx="6" fill="#FED7AA" opacity="0.7" transform="rotate(15 130 55)" />
          {/* sparkles */}
          <path d="M150 35L152 40L157 42L152 44L150 49L148 44L143 42L148 40L150 35Z" fill="#F59E0B" />
          <path d="M48 135L49.5 139L53.5 140.5L49.5 142L48 146L46.5 142L42.5 140.5L46.5 139L48 135Z" fill="#F59E0B" />
          {/* exhaust */}
          <path d="M94 134C94 146 100 158 100 158C100 158 106 146 106 134Z" fill="#EA580C" />
          <path d="M96 134C96 142 100 150 100 150C100 150 104 142 104 134Z" fill="#FBBF24" />
          {/* booster + body */}
          <path d="M91 126H109V133H91V126Z" fill="#64748B" />
          <path d="M85 96C85 64 100 48 100 48C100 48 115 64 115 96V126H85V96Z" fill="#1E293B" />
          <path d="M100 48C100 48 115 64 115 96V126H100V48Z" fill="#0F172A" />
          {/* fins */}
          <path d="M85 106L68 122C67 123 67 125 68.5 125.5L85 126V106Z" fill="#F59E0B" />
          <path d="M115 106L132 122C133 123 133 125 131.5 125.5L115 126V106Z" fill="#D97706" />
          {/* porthole */}
          <circle cx="100" cy="85" r="12" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M96 79C102 79 107 84 106 90" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
          {/* clouds */}
          <path
            d="M50 162C50 156 55 152 61 152C63 147 68 143 74 143C81 143 87 148 88 154C91 152 95 152 98 153C102 147 108 144 114 144C121 144 127 149 128 156C131 154 135 154 138 156C143 156 147 160 147 165C147 170 143 174 138 174H60C54.5 174 50 168.6 50 162Z"
            fill="#F8FAFC"
            stroke="#E2E8F0"
            strokeWidth="2"
          />
        </svg>
      </div>

      <h3>No applications yet</h3>
      <p>
        Your job hunt starts here! Track companies, stage updates, interview rounds, and notes in
        one place.
      </p>
      <Link to="/new" className="btn btn-primary">
        Create First Application
      </Link>
    </section>
  );
}
