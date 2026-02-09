# IDP Access Token Claims after 2FA (Step‑Up) Refresh

Purpose
- Ensure refreshed access tokens issued after successful 2FA reflect step‑up authentication status so downstream services and our app see consistent claims.

Required OIDC claims after 2FA
- amr: must be a JSON array including:
  - "pwd" (password, if used initially)
  - "mfa" (indicates multi‑factor has been satisfied)
  - a concrete factor used: e.g., "totp", "sms", "otp", "hwk", "bio"
- acr: set to your step‑up level (current convention: "3")
- auth_time: unix timestamp (seconds) for when 2FA completed

Example JWT payload fragment (post‑2FA)
```json path=null start=null
{
  "sub": "jon.ranes@payez.net",
  "amr": ["pwd", "mfa", "totp"],
  "acr": "3",
  "auth_time": 1757467862
}
```

Implementation notes (C# / System.IdentityModel.Tokens.Jwt)
- Emit amr as multiple claims with the same type "amr"; JwtSecurityTokenHandler will serialize them as a JSON array in the JWT payload.
- acr is typically a string claim and can be compared lexically; use your policy’s numeric/string convention consistently.
- auth_time should be an integer (seconds since epoch).

```csharp path=null start=null
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

// ... inside your token issuance logic after verifying 2FA ...
var claims = new List<Claim>
{
    new("sub", userEmail),
    new("acr", "3"),
    new("auth_time", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64),

    // Emit AMR as multiple claims — handler will serialize as JSON array
    new("amr", "pwd"),                 // if password was used
    new("amr", "mfa"),                 // indicates multi‑factor satisfied
    new("amr", secondFactorMethod)      // e.g. "totp", "sms", "otp", etc.
};

var descriptor = new SecurityTokenDescriptor
{
    Subject = new ClaimsIdentity(claims),
    Expires = DateTime.UtcNow.AddHours(1),
    SigningCredentials = signingCreds,
    Audience = "idp.payez.net",
    Issuer = "idp.payez.net"
};

var handler = new JwtSecurityTokenHandler();
var token = handler.CreateToken(descriptor);
var jwt = handler.WriteToken(token);
```

Refresh endpoint behavior
- On refresh issuance, look up server‑side session for the subject.
- If twoFactorCompleted == true:
  - Add amr entries ("mfa" + the concrete second factor used)
  - Set acr to "3"
  - Set auth_time to the 2FA completion timestamp
- If not complete, keep single‑factor claims (e.g., amr ["pwd"], acr "1").

Validation checklist
- Decode the issued token and assert:
  - amr is a JSON array (not a JSON‑encoded string) and contains "mfa" and the specific factor
  - acr == "3"
  - auth_time present and reasonable (± clock skew)
- Exercise both paths (pre‑2FA and post‑2FA refresh) in tests.

Client alignment
- Our app updates Redis session to reflect 2FA (amr includes "mfa", acr = "3").
- With the IDP emitting matching amr/acr on the refreshed bearer, discrepancy warnings disappear and downstream services relying on bearer claims see the correct step‑up status.

Common pitfalls to avoid
- Emitting amr as a JSON‑encoded string (e.g., "[\"pwd\"]") instead of a proper array
- Forgetting to include the concrete second factor (only "mfa" without "totp"/"sms", etc.)
- Missing auth_time or emitting it as a non‑integer type

Rollout notes
- Ship IDP change, then verify via a manual 2FA flow:
  - Complete login (pwd), trigger 2FA (totp/sms), then refresh/tokens issuance.
  - Decode token and confirm amr/acr/auth_time values.
- Monitor logs for any remaining discrepancies; alert if mismatches persist > 5 minutes post‑2FA.

