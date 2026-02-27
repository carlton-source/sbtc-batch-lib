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

    ;; For generic token, process first few transfers directly
    ;; This is a simplified version - production would use contract-specific batch functions
    (let
      (
        (total (fold add-amounts recipients u0))
      )
      ;; Update global stats
      (var-set total-batches-processed (+ (var-get total-batches-processed) u1))
      
      ;; Return validation info - actual transfers handled by frontend calling individual transfers
      ;; or by using batch-transfer-sbtc for sBTC specifically
      (ok {
        recipient-count: recipient-count,
        total-amount: total,
        note: "Use batch-transfer-sbtc for sBTC or call transfers individually"
      })
    )
  )
)

;; ============================================
;; PRIVATE FUNCTIONS
;; ============================================

;; Helper for sBTC batch transfer - processes one recipient
(define-private (transfer-sbtc-to-recipient
  (recipient {to: principal, amount: uint})
  (context {sender: principal, count: uint, total: uint, all-ok: bool}))
  (if (get all-ok context)
    (let
      (
        (amount (get amount recipient))
        (to-address (get to recipient))
      )
      ;; sBTC contract address - Clarinet auto-remaps for testnet/mainnet
      (match (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token transfer 
              amount 
              (get sender context) 
              to-address 
              none)
        success
        {
          sender: (get sender context),
          count: (+ (get count context) u1),
          total: (+ (get total context) amount),
          all-ok: true
        }
        error
        (merge context {all-ok: false})
      )
    )
    context
  )
)

;; Update sender statistics
(define-private (update-sender-stats (sender principal) (transfer-count uint) (amount uint))
  (match (map-get? sender-stats sender)
    existing-stats
    (map-set sender-stats sender {
      total-batches: (+ (get total-batches existing-stats) u1),
      total-transfers: (+ (get total-transfers existing-stats) transfer-count),
      total-amount: (+ (get total-amount existing-stats) amount)
    })
    (map-set sender-stats sender {
      total-batches: u1,
      total-transfers: transfer-count,
      total-amount: amount
    })
  )
)

;; ============================================
;; READ-ONLY FUNCTIONS
;; ============================================

;; Get total batches processed by this contract
(define-read-only (get-total-batches)
  (var-get total-batches-processed)
)

;; Get statistics for a specific sender
(define-read-only (get-sender-stats (sender principal))
  (map-get? sender-stats sender)
)

;; Calculate total amount for a batch (for fee estimation / preview)
(define-read-only (calculate-batch-total (recipients (list 200 {to: principal, amount: uint})))
  (fold add-amounts recipients u0)
)

;; Add amounts helper
(define-private (add-amounts (recipient {to: principal, amount: uint}) (total uint))
  (+ total (get amount recipient))
)

;; Validate a batch before execution
(define-read-only (validate-batch (recipients (list 200 {to: principal, amount: uint})))
  (let
    (
      (count (len recipients))
      (total (fold add-amounts recipients u0))
    )
    (if (is-eq count u0)
      {valid: false, error: u1, recipient-count: u0, total-amount: u0} ;; Empty list
      (if (> count MAX-RECIPIENTS)
        {valid: false, error: u2, recipient-count: count, total-amount: total} ;; Too many recipients
        {valid: true, error: u0, recipient-count: count, total-amount: total}
      )
    )
  )
)

;; Get contract info
(define-read-only (get-contract-info)
  {
    name: "sBTC Batch Transfer Library",
    version: u1,
    max-recipients: MAX-RECIPIENTS,
    total-batches: (var-get total-batches-processed)
  }
)

;; ============================================
;; TEST HELPER FUNCTIONS
;; ============================================
;; These functions are for local testing with mock tokens
;; Production code should use batch-transfer-sbtc

;; Batch transfer mock-sbtc to multiple recipients (FOR TESTING ONLY)
(define-public (batch-transfer-mock
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
        (result (fold transfer-mock-to-recipient recipients {sender: sender, count: u0, total: u0, all-ok: true}))
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