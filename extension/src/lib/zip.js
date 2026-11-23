// Minimal read-only ZIP reader for the repo archive scan (ADR-0011). Works on bytes already in memory.
// It never writes anything and never turns an entry name into a file path. Every decompression is bounded by
// the size the archive declares, so a zip bomb (declared small, inflates huge) is rejected, not expanded.

export class ZipError extends Error {
	constructor(code) {
		super(code);
		this.code = code; // "bad_archive" | "zip64" | "unsupported"
	}
}

const MAX_ENTRIES = 1_000_000;
const u16 = (d, o) => d[o] | (d[o + 1] << 8);
const u32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0;

// Returns [{ name, method, flags, compSize, size, offset }] from the central directory.
export function listEntries(data) {
	if (!(data instanceof Uint8Array) || data.length < 22) throw new ZipError("bad_archive");

	// End-of-central-directory record: 22 bytes plus an optional comment of up to 65535 bytes.
	let eocd = -1;
	for (let i = data.length - 22, min = Math.max(0, data.length - 22 - 65535); i >= min; i--) {
		if (u32(data, i) === 0x06054b50 && i + 22 + u16(data, i + 20) <= data.length) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0) throw new ZipError("bad_archive");

	const count = u16(data, eocd + 10);
	const cdSize = u32(data, eocd + 12);
	const cdOffset = u32(data, eocd + 16);
	if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) throw new ZipError("zip64");
	if (count > MAX_ENTRIES) throw new ZipError("unsupported");
	if (cdOffset + cdSize > eocd) throw new ZipError("bad_archive");

	const text = new TextDecoder("utf-8");
	const entries = [];
	let p = cdOffset;
	for (let n = 0; n < count; n++) {
		if (p + 46 > data.length || u32(data, p) !== 0x02014b50) throw new ZipError("bad_archive");
		const compSize = u32(data, p + 20);
		const size = u32(data, p + 24);
		const offset = u32(data, p + 42);
		if (compSize === 0xffffffff || size === 0xffffffff || offset === 0xffffffff) throw new ZipError("zip64");
		const nameLen = u16(data, p + 28);
		const next = p + 46 + nameLen + u16(data, p + 30) + u16(data, p + 32);
		if (next > data.length) throw new ZipError("bad_archive");
		entries.push({ name: text.decode(data.subarray(p + 46, p + 46 + nameLen)), flags: u16(data, p + 8), method: u16(data, p + 10), compSize, size, offset });
		p = next;
	}
	return entries;
}

// Returns the entry's bytes, or null when it is encrypted, uses an unsupported method, or declares more than
// maxBytes. Throws ZipError("bad_archive") when the data is corrupt or inflates beyond its declared size.
export async function readEntry(data, entry, maxBytes) {
	if (entry.flags & 1 || entry.size > maxBytes) return null;
	if (entry.method !== 0 && entry.method !== 8) return null;

	const o = entry.offset;
	if (o + 30 > data.length || u32(data, o) !== 0x04034b50) throw new ZipError("bad_archive");
	const start = o + 30 + u16(data, o + 26) + u16(data, o + 28);
	const end = start + entry.compSize;
	if (end > data.length) throw new ZipError("bad_archive");
	const raw = data.subarray(start, end);

	if (entry.method === 0) {
		if (raw.length !== entry.size) throw new ZipError("bad_archive");
		return raw;
	}

	const out = new Uint8Array(entry.size);
	let len = 0;
	const reader = new ReadableStream({
		start(c) {
			c.enqueue(raw);
			c.close();
		},
	})
		.pipeThrough(new DecompressionStream("deflate-raw"))
		.getReader();
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			if (len + value.length > entry.size) throw new ZipError("bad_archive"); // inflates past what it declared
			out.set(value, len);
			len += value.length;
		}
	} catch (e) {
		reader.cancel().catch(() => {});
		throw e instanceof ZipError ? e : new ZipError("bad_archive");
	}
	if (len !== entry.size) throw new ZipError("bad_archive");
	return out;
}
