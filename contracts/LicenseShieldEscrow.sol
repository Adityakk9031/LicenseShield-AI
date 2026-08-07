// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LicenseShieldEscrow
 * @dev Manages $0.01 USDC escrow locking, backend settlement, and refunds for LicenseShield AI audits.
 */
contract LicenseShieldEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

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

    event AuditFeeLocked(bytes32 indexed auditId, address indexed buyer, uint256 amount, bytes32 payloadHash);
    event AuditSettled(bytes32 indexed auditId, address indexed treasury, uint256 amount);
    event AuditRefunded(bytes32 indexed auditId, address indexed buyer, uint256 amount);
    event TreasuryWalletUpdated(address indexed oldTreasury, address indexed newTreasury);
    event AuditFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(address _usdcToken, address _treasuryWallet, uint256 _auditFee) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC token");
        require(_treasuryWallet != address(0), "Invalid treasury wallet");
        require(_auditFee > 0, "Audit fee must be > 0");

        usdcToken = IERC20(_usdcToken);
        treasuryWallet = _treasuryWallet;
        auditFee = _auditFee;
    }

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
