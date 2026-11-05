export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  const ten =
    digits.length === 13 && digits.startsWith("977")
      ? digits.slice(3)
      : digits.length === 11 && digits.startsWith("0")
        ? digits.slice(1)
        : digits.length === 10
          ? digits
          : null;
  if (!ten || !/^9\d{9}$/.test(ten)) return null;
  return `+977${ten}`;
}

export function formatPhone(stored: string) {
  const digits = stored.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }
  const local = digits.startsWith("977") && digits.length === 13 ? digits.slice(3) : digits;
  if (local.length !== 10) return stored;
  return `+977 ${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
}

export function phonesMatch(a: string, b: string) {
  const left = a.replace(/\D/g, "").slice(-10);
  const right = b.replace(/\D/g, "").slice(-10);
  return left.length === 10 && left === right;
}
