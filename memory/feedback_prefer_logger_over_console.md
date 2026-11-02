---
name: Prefer logger module over console.log
description: Use the project's logger module instead of console.log for logging
type: feedback
---

Use the project's logger module (from `src/observability/logger.js`) instead of `console.log` for logging in K9 project code.

**Why:** The project has a dedicated logger module that provides structured logging, which is better for observability and consistency.

**How to apply:** When writing new code or modifying existing code in the k9 project, import and use `logger` instead of console.log/console.error.

Example:
```javascript
import { logger } from './observability/logger.js';
logger.info('message');
```
