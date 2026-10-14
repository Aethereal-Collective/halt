import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeRequest, RISK } from "../extension/src/lib/tx.js";

const SPENDER = "1111111111111111111111111111111111111111";
const pad = (hex) => hex.padStart(64, "0");
const MAX = "f".repeat(64);

test("unlimited approve is high risk", () => {
	const data = "0x095ea7b3" + pad(SPENDER) + MAX;
	const r = analyzeRequest({ method: "eth_sendTransaction", params: [{ to: "0xtoken", data }] });
	assert.equal(r.risk, RISK.HIGH);
	assert.equal(r.code, "unlimited_approval");
	assert.equal(r.details.spender, "0x" + SPENDER);
});

test("small approve is medium, zero approve is ignored", () => {
	const small = analyzeRequest({ method: "eth_sendTransaction", params: [{ data: "0x095ea7b3" + pad(SPENDER) + pad("64") }] });
	assert.equal(small.risk, RISK.MEDIUM);
	assert.equal(small.details.amount, "100");
	assert.equal(analyzeRequest({ method: "eth_sendTransaction", params: [{ data: "0x095ea7b3" + pad(SPENDER) + pad("0") }] }), null);
});

test("setApprovalForAll(true) is critical, (false) is ignored", () => {
	const on = analyzeRequest({ method: "eth_sendTransaction", params: [{ data: "0xa22cb465" + pad(SPENDER) + pad("1") }] });
	assert.equal(on.risk, RISK.CRITICAL);
	assert.equal(analyzeRequest({ method: "eth_sendTransaction", params: [{ data: "0xa22cb465" + pad(SPENDER) + pad("0") }] }), null);
});

test("EIP-2612 and Permit2 signatures are high risk", () => {
	for (const primaryType of ["Permit", "PermitSingle", "PermitBatchTransferFrom"]) {
		const typed = JSON.stringify({ primaryType, domain: { name: "USDT" }, message: { spender: "0xbad" } });
		const r = analyzeRequest({ method: "eth_signTypedData_v4", params: ["0xme", typed] });
		assert.equal(r.code, "permit_signature", primaryType);
	}
});

test("Seaport order that pays the offerer nothing is critical", () => {
	const order = (recipient) => JSON.stringify({ primaryType: "OrderComponents", message: { offerer: "0xMe", offer: [{}], consideration: [{ recipient }] } });
	assert.equal(analyzeRequest({ method: "eth_signTypedData_v4", params: ["0xme", order("0xScammer")] }).risk, RISK.CRITICAL);
	assert.equal(analyzeRequest({ method: "eth_signTypedData_v4", params: ["0xme", order("0xme")] }), null);
});

test("eth_sign is critical; plain transfers and unknown methods pass", () => {
	assert.equal(analyzeRequest({ method: "eth_sign", params: [] }).risk, RISK.CRITICAL);
	assert.equal(analyzeRequest({ method: "eth_sendTransaction", params: [{ to: "0xabc", value: "0x1" }] }), null);
	assert.equal(analyzeRequest({ method: "eth_chainId" }), null);
	assert.equal(analyzeRequest({ method: "eth_signTypedData_v4", params: ["0xme", "not json"] }), null);
});
