// Remotion CLI configuration. Applies to `remotion studio` and `remotion render`.
// Docs: https://www.remotion.dev/docs/config
import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// High quality for social platforms (Reels / Shorts / TikTok re-encode aggressively).
Config.setCodec('h264');
Config.setCrf(18);
