# ⚠️ Deprecated — Use the Definitive Guide

This document has been superseded. Please read the definitive passthrough testing guide:

👉 ./DEFINITIVE_PASSTHROUGH_TESTING_GUIDE.md

Reason:
- The chosen method is the automated NextAuth JWT flow with TEST_MODE.
- This file contained legacy flows (Headers cookie, manual GUID, programmatic callback) that are not supported.
- Keeping a single, correct source of truth prevents drift and 401 confusion.
