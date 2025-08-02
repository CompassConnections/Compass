function capitalizeOne(str: string) {
  if (!str) return "";
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}


export function capitalize(str: string) {
  return str
    .split(" ")
    .map(word => capitalizeOne(word))
    .join(" ");
}