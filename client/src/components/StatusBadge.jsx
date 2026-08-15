const STATUS_CLASS = {
  Applied: "badge badge-applied",
  Interviewing: "badge badge-interviewing",
  Offer: "badge badge-offer",
  Rejected: "badge badge-rejected",
  Withdrawn: "badge badge-withdrawn",
};

export default function StatusBadge({ status }) {
  return <span className={STATUS_CLASS[status] || "badge"}>{status}</span>;
}
