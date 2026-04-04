import Cookies from "js-cookie";

export function getOrCreateCookieId(): string | null {
  if (typeof window === "undefined") return null;

  let stored = Cookies.get("cookieId") || localStorage.getItem("cookieId");
  if (!stored || !/^-?\d+$/.test(stored)) {
    stored = String(-(1000000000 + Math.floor(Math.random() * 1000000000)));
    Cookies.set("cookieId", stored, { path: "/" });
    localStorage.setItem("cookieId", stored);
  } else {
    Cookies.set("cookieId", stored, { path: "/" });
    localStorage.setItem("cookieId", stored);
  }

  return stored;
}
