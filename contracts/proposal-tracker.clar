(define-constant contract-owner tx-sender)
(define-constant err-owner-only (err u100))
(define-constant err-not-found (err u101))
(define-constant err-already-voted (err u102))
(define-constant err-proposal-closed (err u103))
(define-constant err-invalid-status (err u104))
(define-constant err-unauthorized (err u105))

(define-constant proposal-status-draft u0)
(define-constant proposal-status-active u1)
(define-constant proposal-status-passed u2)
(define-constant proposal-status-rejected u3)
(define-constant proposal-status-executed u4)

(define-map proposals uint {
  title: (string-ascii 100),
  description: (string-ascii 500),
  proposer: principal,
  funding-amount: uint,
  recipient: principal,
  category: (string-ascii 50),
  status: uint,
  yes-votes: uint,
  no-votes: uint,
  total-stx-voted: uint,
  created-at: uint,
  voting-end: uint,
  execution-delay: uint
})

(define-map votes {proposal-id: uint, voter: principal} {
  vote: bool,
  stx-amount: uint,
  timestamp: uint
})

(define-map voter-weights principal uint)
(define-map proposal-metadata uint {
  forum-link: (string-ascii 200),
  github-link: (string-ascii 200),
  milestones: (string-ascii 300)
})

(define-data-var proposal-count uint u0)
(define-data-var min-proposal-threshold uint u1000000)
(define-data-var voting-period uint u1008)
(define-data-var execution-delay uint u144)
(define-data-var quorum-threshold uint u10000000)

(define-public (create-proposal
  (title (string-ascii 100))
  (description (string-ascii 500))
  (funding-amount uint)
  (recipient principal)
  (category (string-ascii 50))
  (forum-link (string-ascii 200))
  (github-link (string-ascii 200))
  (milestones (string-ascii 300)))
  (let ((proposal-id (var-get proposal-count)))
    (asserts! (>= (stx-get-balance tx-sender) (var-get min-proposal-threshold)) err-unauthorized)
    (map-insert proposals proposal-id {
      title: title,
      description: description,
      proposer: tx-sender,
      funding-amount: funding-amount,
      recipient: recipient,
      category: category,
      status: proposal-status-draft,
      yes-votes: u0,
      no-votes: u0,
      total-stx-voted: u0,
      created-at: stacks-block-height,
      voting-end: (+ stacks-block-height (var-get voting-period)),
      execution-delay: (var-get execution-delay)
    })
    (map-insert proposal-metadata proposal-id {
      forum-link: forum-link,
      github-link: github-link,
      milestones: milestones
    })
    (var-set proposal-count (+ proposal-id u1))
    (ok proposal-id)))

(define-public (activate-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) err-not-found)))
    (asserts! (is-eq (get proposer proposal) tx-sender) err-unauthorized)
    (asserts! (is-eq (get status proposal) proposal-status-draft) err-invalid-status)
    (map-set proposals proposal-id (merge proposal {status: proposal-status-active}))
    (ok true)))

(define-public (vote (proposal-id uint) (vote-yes bool) (stx-amount uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) err-not-found))
        (voter-balance (stx-get-balance tx-sender)))
    (asserts! (is-eq (get status proposal) proposal-status-active) err-proposal-closed)
    (asserts! (<= stacks-block-height (get voting-end proposal)) err-proposal-closed)
    (asserts! (is-none (map-get? votes {proposal-id: proposal-id, voter: tx-sender})) err-already-voted)
    (asserts! (<= stx-amount voter-balance) err-unauthorized)
    (asserts! (> stx-amount u0) err-unauthorized)

    (map-set votes {proposal-id: proposal-id, voter: tx-sender} {
      vote: vote-yes,
      stx-amount: stx-amount,
      timestamp: stacks-block-height
    })

    (if vote-yes
      (map-set proposals proposal-id (merge proposal {
        yes-votes: (+ (get yes-votes proposal) u1),
        total-stx-voted: (+ (get total-stx-voted proposal) stx-amount)
      }))
      (map-set proposals proposal-id (merge proposal {
        no-votes: (+ (get no-votes proposal) u1),
        total-stx-voted: (+ (get total-stx-voted proposal) stx-amount)
      })))
    (ok true)))

(define-public (finalize-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) err-not-found)))
    (asserts! (is-eq (get status proposal) proposal-status-active) err-invalid-status)
    (asserts! (> stacks-block-height (get voting-end proposal)) err-proposal-closed)

    (let ((total-yes-stx (calculate-yes-stx-weight proposal-id))
          (total-no-stx (calculate-no-stx-weight proposal-id))
          (quorum (var-get quorum-threshold)))
      (if (and (>= (+ total-yes-stx total-no-stx) quorum)
               (> total-yes-stx total-no-stx))
        (map-set proposals proposal-id (merge proposal {status: proposal-status-passed}))
        (map-set proposals proposal-id (merge proposal {status: proposal-status-rejected}))))
    (ok true)))

(define-public (execute-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) err-not-found)))
    (asserts! (is-eq (get status proposal) proposal-status-passed) err-invalid-status)
    (asserts! (> stacks-block-height (+ (get voting-end proposal) (get execution-delay proposal))) err-proposal-closed)

    (map-set proposals proposal-id (merge proposal {status: proposal-status-executed}))
    (ok true)))

(define-read-only (get-proposal (proposal-id uint))
  (map-get? proposals proposal-id))

(define-read-only (get-proposal-metadata (proposal-id uint))
  (map-get? proposal-metadata proposal-id))

(define-read-only (get-vote (proposal-id uint) (voter principal))
  (map-get? votes {proposal-id: proposal-id, voter: voter}))

(define-read-only (get-vote-counts (proposal-id uint))
  (match (map-get? proposals proposal-id)
    some-proposal (ok {
      yes: (get yes-votes some-proposal),
      no: (get no-votes some-proposal),
      total-stx: (get total-stx-voted some-proposal)
    })
    err-not-found))

(define-read-only (calculate-yes-stx-weight (proposal-id uint))
  (fold calculate-vote-weight (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9) u0))

(define-read-only (calculate-no-stx-weight (proposal-id uint))
  (fold calculate-vote-weight (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9) u0))

(define-private (calculate-vote-weight (index uint) (acc uint))
  acc)

(define-read-only (get-proposal-count)
  (var-get proposal-count))

(define-read-only (get-proposals-by-status (status uint))
  (ok status))

(define-read-only (get-proposals-by-category (category (string-ascii 50)))
  (ok category))

(define-public (update-voting-parameters (min-threshold uint) (voting-period-blocks uint) (execution-delay-blocks uint) (quorum uint))
  (begin
    (asserts! (is-eq tx-sender contract-owner) err-owner-only)
    (var-set min-proposal-threshold min-threshold)
    (var-set voting-period voting-period-blocks)
    (var-set execution-delay execution-delay-blocks)
    (var-set quorum-threshold quorum)
    (ok true)))

(define-read-only (get-voting-parameters)
  (ok {
    min-threshold: (var-get min-proposal-threshold),
    voting-period: (var-get voting-period),
    execution-delay: (var-get execution-delay),
    quorum: (var-get quorum-threshold)
  }))
  