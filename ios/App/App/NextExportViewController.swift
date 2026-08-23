import Capacitor
import Foundation

/// Resolves a URL path against the files Next.js's static export actually wrote.
///
/// Capacitor's stock `CapacitorRouter` maps **every** extension-less path to `index.html` — correct
/// for a single-page app, wrong for us. `scripts/build_web_view.sh` strips
/// `getStaticProps`/`getStaticPaths` so the export emits one file per route, including literal
/// bracketed files for the dynamic ones: `[username].html`, `blog/[slug].html`, `vote/[id].html`,
/// `alerts/[id].html`, `messages/[channelId].html`. Each reads its own route from `router.query` at
/// runtime.
///
/// Under the stock router a *hard* navigation to `/someone` or `/blog/a-post` was served
/// `index.html`, so the app silently showed the home page instead of the requested one. Client-side
/// `next/link` navigation was unaffected, which is why sidebar links worked and profile and blog
/// links did not — and why it looked like a crash rather than a routing bug.
///
/// Android never had this: `WebViewLocalServer` already resolves extension-less paths against
/// `.html` files itself.
struct NextExportRouter: Router {
    var basePath: String = ""

    func route(for path: String) -> String {
        // Real assets (.js, .css, .png, .json, …) pass straight through.
        guard URL(fileURLWithPath: path).pathExtension.isEmpty else {
            return basePath + path
        }

        let trimmed = path.hasSuffix("/") ? String(path.dropLast()) : path
        guard !trimmed.isEmpty else { return basePath + "/index.html" }

        // /about -> /about.html
        if fileExists(trimmed + ".html") {
            return basePath + trimmed + ".html"
        }
        // /foo -> /foo/index.html
        if fileExists(trimmed + "/index.html") {
            return basePath + trimmed + "/index.html"
        }
        // /someone -> /[username].html ; /blog/a-post -> /blog/[slug].html
        if let bracketed = bracketedSibling(of: trimmed) {
            return basePath + bracketed
        }

        // Genuinely unknown. index.html keeps the app usable rather than showing a blank WebView,
        // and matches what the stock router would have done.
        return basePath + "/index.html"
    }

    private func fileExists(_ relativePath: String) -> Bool {
        FileManager.default.fileExists(atPath: basePath + relativePath)
    }

    /// The dynamic-route template living beside the requested path, e.g. `blog/[slug].html` for
    /// `/blog/a-post`. Next guarantees at most one dynamic segment per directory level, so the first
    /// match is unambiguous; sorting only keeps the choice stable across runs.
    private func bracketedSibling(of path: String) -> String? {
        let directory = (path as NSString).deletingLastPathComponent
        let searchPath = basePath + (directory.isEmpty ? "" : directory)

        guard let entries = try? FileManager.default.contentsOfDirectory(atPath: searchPath) else {
            return nil
        }

        guard let match = entries
            .filter({ $0.hasPrefix("[") && $0.hasSuffix("].html") })
            .sorted()
            .first
        else { return nil }

        return (directory.isEmpty ? "" : directory) + "/" + match
    }
}

/// Exists only to install `NextExportRouter`. Referenced from `Base.lproj/Main.storyboard`, which
/// otherwise instantiates `CAPBridgeViewController` directly.
class NextExportViewController: CAPBridgeViewController {
    override func router() -> Router {
        return NextExportRouter()
    }
}
