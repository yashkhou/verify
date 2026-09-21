# Security Policy

## Supported versions

Security fixes are applied to the latest released version of each package in this repository.

## Reporting a vulnerability

Please do not open a public issue for a vulnerability that could expose user data, bypass an approval boundary, forge evidence, or execute unintended commands.

Use GitHub's private vulnerability reporting for this repository when available. Include:

- the affected package and version;
- a minimal reproduction;
- the security boundary that is bypassed;
- expected versus observed behavior;
- any suggested mitigation.

If private reporting is unavailable, contact the maintainer through the GitHub profile linked from this repository and avoid publishing exploit details until a fix is available.

## Scope

Verify is defensive infrastructure, not a sandbox. In particular, Repo Verify can execute commands explicitly configured by the repository maintainer. Treat configuration changes as code changes and review them accordingly.
