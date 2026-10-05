# Binso One authentication security flow

## Registration
1. Company submits business name, email, password, plan and legal consent.
2. No product session is granted yet.
3. Binso One sends a six-digit email verification code valid for 10 minutes.
4. The code is rate-limited, stored only as a keyed hash and invalidated after five attempts or successful use.
5. On successful verification the email is marked verified and the 14-day trial starts from that moment.
6. Owner accounts are redirected to Authenticator enrollment before protected product APIs are available.

## Login
1. Email and password are always required.
2. Accounts without Authenticator MFA receive a fresh six-digit email login code.
3. Accounts with Authenticator MFA must provide TOTP or a one-time recovery code.
4. Owner, Admin and Finance roles cannot use protected product APIs until Authenticator MFA is enabled.
5. Normal users can keep email OTP as the second factor or enable Authenticator MFA voluntarily.

## Authenticator enrollment
- TOTP secret is generated server-side and encrypted at rest.
- Pending enrollment expires after 15 minutes.
- Enrollment is completed only after a valid six-digit TOTP is verified.
- Eight one-time recovery codes are generated and only their hashes are stored.
- Recovery codes are displayed once to the user.

## Operational requirements
- APP_ENCRYPTION_KEY must be configured in production.
- Microsoft Graph must be configured with GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET and GRAPH_SENDER_USER_ID. Production sender is one@binso.ch; SPF/DKIM/DMARC must be verified for binso.ch.
- Production tests must cover registration, resend, invalid/expired codes, attempt exhaustion, email OTP login, TOTP login, recovery-code login and privileged-role MFA gating.
