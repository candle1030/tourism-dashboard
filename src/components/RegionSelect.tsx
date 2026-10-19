"use client";

import { useRouter } from "next/navigation";

type Option = { region_code: string; region_name: string };

export default function RegionSelect({ options, value }: { options: Option[]; value: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-ink-3">지역</span>
      <select
        value={value}
        onChange={(e) => router.push(`/?region=${e.target.value}`)}
        className="rounded-lg border border-line bg-surface px-3 py-2 text-ink"
      >
        {options.map((o) => (
          <option key={o.region_code} value={o.region_code}>
            {o.region_name}
          </option>
        ))}
      </select>
    </label>
  );
}
