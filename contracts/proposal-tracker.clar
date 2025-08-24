(define-constant contract-owner tx-sender)

(define-map proposals uint {description: (string-ascii 256), yes-votes: uint, no-votes: uint})
(define-map votes {proposal-id: uint, voter: principal} bool)

(define-data-var proposal-count uint u0)

(define-public (create-proposal (description (string-ascii 256)))
  (let ((proposal-id (var-get proposal-count)))
    (map-insert proposals proposal-id {description: description, yes-votes: u0, no-votes: u0})
    (var-set proposal-count (+ proposal-id u1))
    (ok proposal-id)))

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id))

(define-public (vote (proposal-id uint) (vote-yes bool))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) (err u1))))
    (asserts! (is-none (map-get? votes {proposal-id: proposal-id, voter: tx-sender})) (err u2))
    (map-set votes {proposal-id: proposal-id, voter: tx-sender} vote-yes)
    (if vote-yes
      (map-set proposals proposal-id (merge proposal {yes-votes: (+ (get yes-votes proposal) u1)}))
      (map-set proposals proposal-id (merge proposal {no-votes: (+ (get no-votes proposal) u1)})))
    (ok true)))

(define-read-only (get-vote-counts (proposal-id uint))
  (match (map-get? proposals proposal-id)
    some-proposal (ok {yes: (get yes-votes some-proposal), no: (get no-votes some-proposal)})
    (err u1)))