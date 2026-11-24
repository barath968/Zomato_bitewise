const ICONS = [
  { icon: "restaurant", top: "12%", left: "6%", size: 18, rotate: -12 },
  { icon: "local_cafe", top: "22%", left: "88%", size: 16, rotate: 14 },
  { icon: "ramen_dining", top: "38%", left: "4%", size: 20, rotate: 8 },
  { icon: "flatware", top: "48%", left: "92%", size: 17, rotate: -18 },
  { icon: "bakery_dining", top: "58%", left: "8%", size: 16, rotate: 10 },
  { icon: "lunch_dining", top: "68%", left: "86%", size: 19, rotate: -8 },
  { icon: "icecream", top: "78%", left: "12%", size: 15, rotate: 16 },
  { icon: "kebab_dining", top: "18%", left: "48%", size: 14, rotate: -6 },
  { icon: "set_meal", top: "72%", left: "52%", size: 16, rotate: 12 },
  { icon: "soup_kitchen", top: "88%", left: "78%", size: 15, rotate: -10 },
  { icon: "restaurant_menu", top: "32%", left: "72%", size: 14, rotate: 7 },
  { icon: "dinner_dining", top: "84%", left: "28%", size: 17, rotate: -14 },
  { icon: "tapas", top: "28%", left: "28%", size: 15, rotate: -9 },
  { icon: "egg_alt", top: "52%", left: "38%", size: 14, rotate: 11 },
  { icon: "fastfood", top: "42%", left: "58%", size: 16, rotate: -7 },
  { icon: "local_pizza", top: "62%", left: "68%", size: 15, rotate: 13 },
] as const;

/** Soft, sparse food/cuisine icons — decorative only, not eye-catching. */
export function FoodDecorBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {ICONS.map((item) => (
        <span
          key={`${item.icon}-${item.top}-${item.left}`}
          className="material-symbols-outlined absolute select-none text-bw-text/[0.08]"
          style={{
            top: item.top,
            left: item.left,
            fontSize: item.size,
            transform: `rotate(${item.rotate}deg)`,
          }}
        >
          {item.icon}
        </span>
      ))}
    </div>
  );
}
