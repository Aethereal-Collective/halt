// Pure EVM request analysis. Input: an EIP-1193 { method, params } object.
// Output: null when nothing stands out, otherwise a finding for the warning modal.

export const RISK = { MEDIUM: "medium", HIGH: "high", CRITICAL: "critical" };

const SELECTORS = {
	"0x095ea7b3": "approve", // approve(address,uint256)
	"0x39509351": "increaseAllowance", // increaseAllowance(address,uint256)
	"0xa22cb465": "setApprovalForAll", // setApprovalForAll(address,bool)
	"0x87517c45": "permit2Approve", // Permit2 approve(address,address,uint160,uint48)
};

// Anything at or above 2^128 is treated as "unlimited": nobody approves that much on purpose.
const UNLIMITED = 2n ** 128n;

const PERMIT_TYPES = new Set(["Permit", "PermitSingle", "PermitBatch", "PermitTransferFrom", "PermitBatchTransferFrom", "PermitWitnessTransferFrom"]);

export function analyzeRequest({ method, params = [] }) {
	switch (method) {
		case "eth_sendTransaction":
			return analyzeTx(params[0] || {});
		case "eth_signTypedData":
		case "eth_signTypedData_v3":
		case "eth_signTypedData_v4":
			return analyzeTypedData(params[1]);
		case "eth_sign":
			return { risk: RISK.CRITICAL, code: "eth_sign", details: {} };
		default:
			return null;
	}
}

export function analyzeTx(tx) {
	const data = String(tx.data || tx.input || "").toLowerCase();
	const name = SELECTORS[data.slice(0, 10)];
	if (!name) return null;
	const args = words(data.slice(10));
	const token = tx.to;

	if (name === "setApprovalForAll") {
		if (BigInt("0x" + (args[1] || "0")) === 0n) return null; // revoking is fine
		return { risk: RISK.CRITICAL, code: "set_approval_for_all", details: { token, spender: addr(args[0]) } };
	}
	if (name === "permit2Approve") {
		return { risk: RISK.HIGH, code: "permit2_approve", details: { token: addr(args[0]), spender: addr(args[1]) } };
	}
	const amount = BigInt("0x" + (args[1] || "0"));
	if (amount === 0n) return null;
	const unlimited = amount >= UNLIMITED;
	return {
		risk: unlimited ? RISK.HIGH : RISK.MEDIUM,
		code: unlimited ? "unlimited_approval" : "approval",
		details: { token, spender: addr(args[0]), amount: unlimited ? "unlimited" : amount.toString() },
	};
}

export function analyzeTypedData(raw) {
	let typed;
	try {
		typed = typeof raw === "string" ? JSON.parse(raw) : raw;
	} catch {
		return null;
	}
	if (!typed || typeof typed !== "object") return null;
	const { primaryType, message = {}, domain = {} } = typed;

	if (PERMIT_TYPES.has(primaryType)) {
		return {
			risk: RISK.HIGH,
			code: "permit_signature",
			details: { type: primaryType, spender: message.spender, token: domain.verifyingContract, contract: domain.name },
		};
	}
	if (primaryType === "OrderComponents" && Array.isArray(message.consideration)) {
		const offerer = String(message.offerer || "").toLowerCase();
		const paysOfferer = message.consideration.some((c) => String(c.recipient || "").toLowerCase() === offerer);
		if (!paysOfferer) return { risk: RISK.CRITICAL, code: "seaport_zero_listing", details: { offerItems: message.offer?.length || 0 } };
	}
	return null;
}

function words(hex) {
	const out = [];
	for (let i = 0; i < hex.length; i += 64) out.push(hex.slice(i, i + 64));
	return out;
}

const addr = (word = "") => "0x" + word.slice(24);
