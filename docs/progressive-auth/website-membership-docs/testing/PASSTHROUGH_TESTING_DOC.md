# ⚠️ Deprecated — Use the Definitive Guide

This document is deprecated. Please follow the definitive passthrough testing guide instead:

👉 ../DEFINITIVE_PASSTHROUGH_TESTING_GUIDE.md

Summary:
- Current, working approach is the automated NextAuth JWT method with TEST_MODE.
- This file contained legacy auth flows that led to 401s (Headers cookie, manual GUID, programmatic callback).
- Reducing surface area prevents drift and maintains a single source of truth.
