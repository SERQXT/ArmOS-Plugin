#!/usr/bin/env python3
"""Generate a proposal_sig for a given proposal_id + SIGNING_SECRET.

Usage:
  python3 setup-sig.py <proposal_id>                         # prompts for secret
  SIGNING_SECRET=mysecret python3 setup-sig.py <proposal_id>

The output sig value goes in:
  engagement.json → feedback.proposal_sig
"""
import hmac, hashlib, sys, os

proposal_id = sys.argv[1] if len(sys.argv) > 1 else input("proposal_id: ").strip()
secret = os.environ.get("SIGNING_SECRET") or input("SIGNING_SECRET: ").strip()

sig = hmac.new(secret.encode(), proposal_id.encode(), hashlib.sha256).hexdigest()

print(f"\nproposal_id:  {proposal_id}")
print(f"proposal_sig: {sig}")
print()
print("Add to your engagement JSON:")
print('  "feedback": {')
print('    "enabled": true,')
print('    "worker_url": "https://domo-proposal-feedback.YOUR_ACCOUNT.workers.dev",')
print(f'    "proposal_id": "{proposal_id}",')
print(f'    "proposal_sig": "{sig}"')
print('  }')
