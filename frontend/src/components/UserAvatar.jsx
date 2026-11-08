function getInitials(name) {
  return String(name || "Sweety")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function UserAvatar({ className, name, photo }) {
  return (
    <span className={className} aria-hidden="true">
      {photo
        ? <img alt="" src={photo} />
        : getInitials(name)}
    </span>
  );
}
