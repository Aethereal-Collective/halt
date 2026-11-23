// Scans a repository zip that is already in memory (ADR-0011). Pure: no network, no storage, nothing is written
// or executed. Files are unpacked one at a time, scanned in batches, and dropped; only findings are kept.
import { listEntries, readEntry, ZipError } from "./zip.js";
import { isScannable, mergeScans, scanRepo } from "./repo-scan.js";

export const ARCHIVE_LIMITS = {
	entryBytes: 1_000_000, // a single file larger than this is reported by name, not scanned
	totalBytes: 2_000_000_000, // unpacked bytes of scanned files; stops a bomb made of many mid-size files
	batchFiles: 40,
	batchBytes: 2_000_000,
	keepFindings: 300, // findings kept in the result; findingsTotal holds the real count
};

// Entry names come from the repo, so they are untrusted text: strip control and bidi characters before display.
const cleanName = (s) => s.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, "?").slice(0, 300);

// codeload wraps everything in one top-level folder (`<repo>-<ref>/`). Drop it so paths look like the repo.
function stripRoot(names) {
	const first = names[0]?.split("/")[0];
	return first && names.every((n) => n.startsWith(first + "/")) ? (n) => n.slice(first.length + 1) : (n) => n;
}

export async function scanArchive(data, { onProgress = () => {}, limits = ARCHIVE_LIMITS } = {}) {
	const files = listEntries(data).filter((e) => !e.name.endsWith("/"));
	const strip = stripRoot(files.map((e) => e.name));
	const candidates = files.map((entry) => ({ entry, path: cleanName(strip(entry.name)) })).filter((c) => isScannable(c.path));

	const parts = [];
	const tooLarge = [];
	let tooLargeCount = 0;
	let unreadable = 0;
	let read = 0;
	let done = 0;
	let unpacked = 0;
	let stopped = false;
	let batch = [];
	let batchBytes = 0;
	const decoder = new TextDecoder("utf-8");

	const flush = () => {
		if (batch.length) parts.push(scanRepo(batch));
		batch = [];
		batchBytes = 0;
	};

	onProgress({ done: 0, total: candidates.length });
	for (const { entry, path } of candidates) {
		if (unpacked > limits.totalBytes) {
			stopped = true;
			break;
		}
		if (entry.size > limits.entryBytes) {
			tooLargeCount++;
			if (tooLarge.length < 10) tooLarge.push(path);
		} else {
			try {
				const bytes = await readEntry(data, entry, limits.entryBytes);
				// A NUL byte means this is binary data under a code-like name; there is nothing to read as text.
				if (!bytes || bytes.subarray(0, 8000).includes(0)) unreadable++;
				else {
					const content = decoder.decode(bytes);
					read++;
					unpacked += bytes.length;
					batch.push({ path, content });
					batchBytes += content.length;
					if (batch.length >= limits.batchFiles || batchBytes >= limits.batchBytes) flush();
				}
			} catch (e) {
				if (!(e instanceof ZipError)) throw e;
				unreadable++; // one corrupt entry must not hide the rest of the repo
			}
		}
		done++;
		if (done % 20 === 0) onProgress({ done, total: candidates.length });
	}
	flush();
	onProgress({ done, total: candidates.length });

	const merged = mergeScans(parts);
	return {
		ok: true,
		level: merged.level,
		findings: merged.findings.slice(0, limits.keepFindings),
		findingsTotal: merged.findings.length,
		read,
		candidates: candidates.length,
		totalEntries: files.length,
		tooLargeCount,
		tooLarge,
		unreadable,
		unread: candidates.length - done, // only non-zero when the scan stopped early
		stopped,
		zipBytes: data.length,
	};
}
