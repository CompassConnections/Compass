type BuildInfo = {
  commitSha: string;
  commitRef: string;
  commitMessage: string;
  commitDate: string;
  buildDate: string;
};

export async function getLiveUpdateInfo(): Promise<BuildInfo> {
  const res = await fetch("/live-update.json", { cache: "no-store" });
  return res.json();
}
