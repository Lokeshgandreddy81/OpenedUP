# Openedup signup confirmation email

Use this subject and HTML in Supabase **Authentication → Emails → Confirm sign up** after custom SMTP is enabled. The confirmation link remains Supabase's one-time `{{ .ConfirmationURL }}` so it follows the app's PKCE callback flow.

**Subject**

```text
Finish setting up your Openedup account
```

**HTML body**

```html
<div style="margin:0;padding:32px 16px;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#172033">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5eaf2;border-radius:16px">
    <tr>
      <td style="padding:36px 36px 12px">
        <p style="margin:0;color:#1746bf;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Openedup</p>
        <h1 style="margin:20px 0 12px;color:#101828;font-size:28px;line-height:1.2">Confirm your email</h1>
        <p style="margin:0;color:#475467;font-size:15px;line-height:1.7">
          {{ if .Data.full_name }}Hi {{ .Data.full_name }},{{ else }}Welcome,{{ end }} thanks for creating an Openedup account. Confirm that you own this email address to finish signing up and open your workspace.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 36px">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#1746bf;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">Confirm email and continue</a>
        <p style="margin:18px 0 0;color:#667085;font-size:13px;line-height:1.6">This link is for the address {{ .Email }}. It can only be used once and may expire. If it has expired, return to Openedup and request a new confirmation email.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 36px 28px">
        <p style="margin:0 0 8px;color:#667085;font-size:12px;line-height:1.6">If the button does not work, copy and paste this link into the browser where you use Openedup:</p>
        <p style="margin:0;word-break:break-all;font-size:12px;line-height:1.6"><a href="{{ .ConfirmationURL }}" style="color:#1746bf">{{ .ConfirmationURL }}</a></p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 36px;border-top:1px solid #eef1f5">
        <p style="margin:0;color:#667085;font-size:12px;line-height:1.6">If you did not create this account, you can ignore this email. No account access is granted until the address is confirmed.</p>
        <p style="margin:12px 0 0;color:#98a2b3;font-size:11px">Openedup</p>
      </td>
    </tr>
  </table>
</div>
```
