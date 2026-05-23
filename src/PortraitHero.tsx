import { useMemo, useState } from "react";

type Props = {
  url?: string;
  name: string;
  bandClass: string;
  /** hero = deck; medium = dual columns; thumb = inline */
  size?: "hero" | "medium" | "thumb";
};

function initials(name: string): string {
  const parts = name.replace(/\//g, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function PortraitHero({ url, name, bandClass, size = "hero" }: Props) {
  const [failed, setFailed] = useState(false);
  const showImg = url && !failed;
  const ini = useMemo(() => initials(name), [name]);
  const cls =
    size === "hero"
      ? "portrait-hero portrait-hero--deck"
      : size === "medium"
        ? "portrait-hero portrait-hero--medium"
        : "portrait-hero portrait-hero--thumb";

  return (
    <div className={`${cls} ${bandClass}`}>
      {showImg ? (
        <img
          src={url}
          alt=""
          className="portrait-hero-img"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer-when-downgrade"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="portrait-hero-fallback" aria-hidden="true">
          {ini}
        </span>
      )}
    </div>
  );
}
