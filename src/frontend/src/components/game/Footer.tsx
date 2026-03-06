export function Footer() {
  const year = new Date().getFullYear();
  const utm = encodeURIComponent(window.location.hostname);

  return (
    <footer
      className="text-center py-6 text-xs"
      style={{ color: "oklch(0.4 0.02 260)" }}
    >
      © {year}. Built with ♥ using{" "}
      <a
        href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${utm}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline transition-all"
        style={{ color: "oklch(0.55 0.05 260)" }}
      >
        caffeine.ai
      </a>
    </footer>
  );
}
