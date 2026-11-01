// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title LicenseShieldEscrow
 * @dev Hybrid Web3 M2M Settlement & Pre-Funded USDC Deposit Vault for LicenseShield AI.
 *      Supports both:
 *      1. Per-scan on-chain escrow locking (`lockAuditFee` -> `settleAudit` / `refundAudit`)
 *      2. Pre-funded Agent Deposit Vault + EIP-712 off-chain cryptographic micro-vouchers (`depositVault` -> `settleWithSignature`)
 */
contract LicenseShieldEscrow is Ownable, ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    bytes32 public constant AUDIT_VOUCHER_TYPEHASH =
        keccak256(
            "AuditVoucher(address buyer,bytes32 auditId,bytes32 payloadHash,uint256 fee,uint256 deadline)"
        );

    IERC20 public immutable usdcToken;
    address public treasuryWallet;
    uint256 public auditFee; // 10000 = $0.01 USDC (6 decimals)

    enum AuditState { Pending, Completed, Refunded }

    struct AuditRequest {
        address buyer;
        uint256 amount;
        bytes32 payloadHash;
        AuditState state;
        uint256 timestamp;
    }

    mapping(bytes32 => AuditRequest) public audits;
    mapping(address => uint256) public vaultBalances;

    event AuditFeeLocked(bytes32 indexed auditId, address indexed buyer, uint256 amount, bytes32 payloadHash);
    event AuditSettled(bytes32 indexed auditId, address indexed treasury, uint256 amount);
    event AuditRefunded(bytes32 indexed auditId, address indexed buyer, uint256 amount);
    event VaultDeposited(address indexed agent, uint256 amount, uint256 newBalance);
    event VaultWithdrawn(address indexed agent, uint256 amount, uint256 newBalance);
    event VoucherSettled(bytes32 indexed auditId, address indexed buyer, uint256 amount, bytes32 payloadHash);
    event TreasuryWalletUpdated(address indexed oldTreasury, address indexed newTreasury);
    event AuditFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _usdcToken, address _treasuryWallet, uint256 _auditFee)
        Ownable(msg.sender)
        EIP712("LicenseShieldEscrow", "1")
    {
        require(_usdcToken != address(0), "Invalid USDC token");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        require(_auditFee > 0, "Audit fee must be > 0");

        usdcToken = IERC20(_usdcToken);
        treasuryWallet = _treasuryWallet;
        auditFee = _auditFee;
    }

    // ── Mode 1: Pre-Funded Agent Deposit Vault + EIP-712 Signatures ─────────────

    /**
     * @notice Pre-funds an AI agent's USDC deposit vault once for zero-latency EIP-712 micro-validations.
     * @param amount Amount of USDC (6 decimals) to deposit into the vault.
     */
    function depositVault(uint256 amount) external nonReentrant {
        require(amount > 0, "Deposit must be > 0");
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        vaultBalances[msg.sender] += amount;
        emit VaultDeposited(msg.sender, amount, vaultBalances[msg.sender]);
    }

    /**
     * @notice Withdraws unused USDC from the caller's deposit vault.
     * @param amount Amount of USDC to withdraw.
     */
    function withdrawVault(uint256 amount) external nonReentrant {
        require(amount > 0, "Withdraw must be > 0");
        require(vaultBalances[msg.sender] >= amount, "Insufficient vault balance");
        vaultBalances[msg.sender] -= amount;
        usdcToken.safeTransfer(msg.sender, amount);
        emit VaultWithdrawn(msg.sender, amount, vaultBalances[msg.sender]);
    }

    /**
     * @notice Settles an off-chain EIP-712 signed AuditVoucher against the agent's pre-funded vault balance.
     */
    function settleWithSignature(
        address buyer,
        bytes32 auditId,
        bytes32 payloadHash,
        uint256 fee,
        uint256 deadline,
        bytes calldata signature
    ) external onlyOwner nonReentrant {
        require(block.timestamp <= deadline, "Voucher expired");
        require(audits[auditId].buyer == address(0), "Audit ID already used");
        require(fee >= auditFee, "Fee below minimum auditFee");

        bytes32 structHash = keccak256(
            abi.encode(AUDIT_VOUCHER_TYPEHASH, buyer, auditId, payloadHash, fee, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, signature);
        require(signer == buyer && signer != address(0), "Invalid EIP-712 signature");

        if (vaultBalances[buyer] >= fee) {
            vaultBalances[buyer] -= fee;
        } else {
            // Fallback to ERC20 allowance pull if vault wasn't pre-funded
            usdcToken.safeTransferFrom(buyer, address(this), fee);
        }

        audits[auditId] = AuditRequest({
            buyer: buyer,
            amount: fee,
            payloadHash: payloadHash,
            state: AuditState.Completed,
            timestamp: block.timestamp
        });

        usdcToken.safeTransfer(treasuryWallet, fee);
        emit VoucherSettled(auditId, buyer, fee, payloadHash);
    }

    // ── Mode 2: Per-Scan On-Chain Escrow Lock ───────────────────────────────────

    /**
     * @notice Locks $0.01 USDC from buyer into escrow for a specific audit.
     * @param auditId Unique audit identifier generated off-chain or by buyer.
     * @param payloadHash Hash of dependency payload being audited.
     */
    function lockAuditFee(bytes32 auditId, bytes32 payloadHash) external nonReentrant {
        require(audits[auditId].buyer == address(0), "Audit ID already exists");

        usdcToken.safeTransferFrom(msg.sender, address(this), auditFee);

        audits[auditId] = AuditRequest({
            buyer: msg.sender,
            amount: auditFee,
            payloadHash: payloadHash,
            state: AuditState.Pending,
            timestamp: block.timestamp
        });

        emit AuditFeeLocked(auditId, msg.sender, auditFee, payloadHash);
    }

    /**
     * @notice Settles audit payment by transferring locked USDC to treasury after backend analysis succeeds.
     * @param auditId Unique audit identifier.
     */
    function settleAudit(bytes32 auditId) external onlyOwner nonReentrant {
        AuditRequest storage audit = audits[auditId];
        require(audit.buyer != address(0), "Audit does not exist");
        require(audit.state == AuditState.Pending, "Audit is not pending");

        audit.state = AuditState.Completed;
        usdcToken.safeTransfer(treasuryWallet, audit.amount);

        emit AuditSettled(auditId, treasuryWallet, audit.amount);
    }

    /**
     * @notice Refunds locked USDC back to buyer if backend analysis fails.
     * @param auditId Unique audit identifier.
     */
    function refundAudit(bytes32 auditId) external onlyOwner nonReentrant {
        AuditRequest storage audit = audits[auditId];
        require(audit.buyer != address(0), "Audit does not exist");
        require(audit.state == AuditState.Pending, "Audit is not pending");

        audit.state = AuditState.Refunded;
        usdcToken.safeTransfer(audit.buyer, audit.amount);

        emit AuditRefunded(auditId, audit.buyer, audit.amount);
    }

    /**
     * @notice Updates the treasury wallet address.
     */
    function setTreasuryWallet(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury wallet");
        emit TreasuryWalletUpdated(treasuryWallet, _newTreasury);
        treasuryWallet = _newTreasury;
    }

    /**
     * @notice Updates the audit fee.
     */
    function setAuditFee(uint256 _newFee) external onlyOwner {
        require(_newFee > 0, "Audit fee must be > 0");
        emit AuditFeeUpdated(auditFee, _newFee);
        auditFee = _newFee;
    }
}
