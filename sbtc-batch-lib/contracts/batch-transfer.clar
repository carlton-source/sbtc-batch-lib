;; title: batch-transfer
;; version: 1.0.0
;; summary: Batch multiple SIP-010 token transfers in a single transaction
;; description: Enables efficient bulk transfers of sBTC and other SIP-010 tokens
;;              by batching up to 200 transfers in one transaction, reducing fees
;;              and improving UX for payroll, airdrops, and multi-recipient payments.
;;
;; Network addresses (Clarinet auto-remaps):
;;   Simnet/Devnet: SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
;;   Testnet:       ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token
;;   Mainnet:       SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token

;; traits
;; Using official deployed SIP-010 trait from mainnet
(use-trait sip-010-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; constants
(define-constant ERR-EMPTY-LIST (err u100))
(define-constant ERR-TRANSFER-FAILED (err u101))
(define-constant ERR-UNAUTHORIZED (err u102))
(define-constant ERR-INVALID-AMOUNT (err u103))
(define-constant ERR-TOO-MANY-RECIPIENTS (err u104))

(define-constant MAX-RECIPIENTS u200)

;; data vars
(define-data-var contract-owner principal tx-sender)
(define-data-var total-batches-processed uint u0)

;; data maps - Track batch statistics per sender
(define-map sender-stats principal {
  total-batches: uint,
  total-transfers: uint,
  total-amount: uint
})

;; ============================================
;; PUBLIC FUNCTIONS
;; ============================================

;; Batch transfer sBTC to multiple recipients
;; Uses the sBTC contract (Clarinet auto-remaps for different networks)
(define-public (batch-transfer-sbtc
  (recipients (list 200 {to: principal, amount: uint})))
  (let
    (
      (sender tx-sender)
      (recipient-count (len recipients))
    )
    ;; Validate list is not empty
    (asserts! (> recipient-count u0) ERR-EMPTY-LIST)
    ;; Validate not too many recipients
    (asserts! (<= recipient-count MAX-RECIPIENTS) ERR-TOO-MANY-RECIPIENTS)
    
    ;; Process transfers using fold
    (let
      (
        (result (fold transfer-sbtc-to-recipient recipients {sender: sender, count: u0, total: u0, all-ok: true}))
      )
      (asserts! (get all-ok result) ERR-TRANSFER-FAILED)

      ;; Update global stats
      (var-set total-batches-processed (+ (var-get total-batches-processed) u1))
      
      ;; Update sender stats
      (update-sender-stats sender recipient-count (get total result))
      
      (ok {
        transfers-completed: (get count result),
        total-amount: (get total result)
      })
    )
  )
)

;; Generic batch transfer for any SIP-010 token
;; Note: Due to Clarity limitations with traits in fold, this uses a simpler approach
;; For production, consider separate functions per token or use batch-transfer-sbtc directly
(define-public (batch-transfer-generic
  (token <sip-010-trait>)
  (recipients (list 200 {to: principal, amount: uint})))
  (let
    (
      (sender tx-sender)
      (recipient-count (len recipients))
    )
    ;; Validate list is not empty
    (asserts! (> recipient-count u0) ERR-EMPTY-LIST)
    ;; Validate not too many recipients
    (asserts! (<= recipient-count MAX-RECIPIENTS) ERR-TOO-MANY-RECIPIENTS)