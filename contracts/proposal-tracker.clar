(define-constant contract-owner tx-sender)

(define-map proposals u32 {description: (string-ascii 256), yes-votes: u32, no-votes: u32})
(define-map votes {proposal-id: u32, voter: principal} bool)

(define-data-var proposal-count u32 u0)

(define-public (create-proposal (description (string-ascii 256)))
  (let ((proposal-id (var-get proposal-count)))
    (map-insert proposals proposal-id {description: description, yes-votes: u0, no-votes: u0})
    (var-set proposal-count (+ proposal-id u1))
    (ok proposal-id)))

(define-read-only (get-proposal (proposal-id u32))
  (map-get? proposals proposal-id))

(define-public (vote (proposal-id u32) (vote-yes bool))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) (err u1))))
    (asserts! (is-none (map-get? votes {proposal-id: proposal-id, voter: tx-sender})) (err u2))
    (map-set votes {proposal-id: proposal-id, voter: tx-sender} vote-yes)
    (if vote-yes
        (map-set proposals proposal-id (merge proposal {yes-votes: (+ (get yes-votes proposal) u1)}))
        (map-set proposals proposal-id (merge proposal {no-votes: (+ (get no-votes proposal) u1)})))
    (ok true)))

(define-read-only (get-vote-counts (proposal-id u32))
  (match (map-get? proposals proposal-id)
    some-proposal (ok {yes: (get yes-votes some-proposal), no: (get no-votes some-proposal)})
(err u1)))