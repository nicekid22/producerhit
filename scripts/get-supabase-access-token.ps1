# Lit le token Supabase CLI depuis le Credential Manager Windows.
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class NativeMethods {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public int Flags;
    public int Type;
    public string TargetName;
    public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize;
    public IntPtr CredentialBlob;
    public int Persist;
    public int AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
  }
  [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
  public static extern bool CredRead(string target, int type, int reservedFlag, out IntPtr credentialPtr);
  [DllImport("advapi32.dll", SetLastError = true)]
  public static extern bool CredFree(IntPtr cred);
}
"@

$target = "Supabase CLI:supabase"
$ptr = [IntPtr]::Zero
if (-not [NativeMethods]::CredRead($target, 1, 0, [ref]$ptr)) {
  Write-Error "Token Supabase introuvable (npx supabase login)"
  exit 1
}
try {
  $cred = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][NativeMethods+CREDENTIAL])
  $bytes = New-Object byte[] $cred.CredentialBlobSize
  [Runtime.InteropServices.Marshal]::Copy($cred.CredentialBlob, $bytes, 0, $cred.CredentialBlobSize)
  $token = [Text.Encoding]::UTF8.GetString($bytes).TrimEnd([char]0)
  Write-Output $token
}
finally {
  [NativeMethods]::CredFree($ptr) | Out-Null
}
