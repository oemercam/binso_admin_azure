# Deployment Runbook
Use existing validated flow: local/release checks -> push -> full CI -> immutable artifact -> explicit manual Production deploy -> DB migration -> Azure staging -> smoke/health -> swap -> production health -> release record. Never deploy an unvalidated local artifact.
