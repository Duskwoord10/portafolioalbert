if (-not ('AlbertCmsCredential.Native' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;

namespace AlbertCmsCredential {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct Credential {
    public UInt32 Flags;
    public UInt32 Type;
    public string TargetName;
    public string Comment;
    public Int64 LastWritten;
    public UInt32 CredentialBlobSize;
    public IntPtr CredentialBlob;
    public UInt32 Persist;
    public UInt32 AttributeCount;
    public IntPtr Attributes;
    public string TargetAlias;
    public string UserName;
  }

  public static class Native {
    [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CredWrite(ref Credential value, UInt32 flags);

    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CredRead(string target, UInt32 type, UInt32 flags, out IntPtr value);

    [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CredDelete(string target, UInt32 type, UInt32 flags);

    [DllImport("advapi32.dll", EntryPoint = "CredFree")]
    private static extern void CredFree(IntPtr value);

    public static void Save(string target, string user, string password) {
      byte[] bytes = Encoding.Unicode.GetBytes(password);
      IntPtr blob = Marshal.AllocCoTaskMem(bytes.Length);
      try {
        Marshal.Copy(bytes, 0, blob, bytes.Length);
        Credential value = new Credential {
          Type = 1, TargetName = target, UserName = user,
          CredentialBlobSize = (UInt32)bytes.Length, CredentialBlob = blob,
          Persist = 2
        };
        if (!CredWrite(ref value, 0)) throw new Win32Exception(Marshal.GetLastWin32Error());
      } finally {
        for (int i = 0; i < bytes.Length; i++) bytes[i] = 0;
        for (int i = 0; i < password.Length * 2; i++) Marshal.WriteByte(blob, i, 0);
        Marshal.FreeCoTaskMem(blob);
      }
    }

    public static string Load(string target, string user) {
      IntPtr pointer;
      if (!CredRead(target, 1, 0, out pointer)) {
        int error = Marshal.GetLastWin32Error();
        if (error == 1168) return null;
        throw new Win32Exception(error);
      }
      try {
        Credential value = (Credential)Marshal.PtrToStructure(pointer, typeof(Credential));
        if (!String.Equals(value.UserName, user, StringComparison.Ordinal))
          throw new InvalidOperationException("El usuario de la credencial no coincide.");
        byte[] bytes = new byte[value.CredentialBlobSize];
        try {
          Marshal.Copy(value.CredentialBlob, bytes, 0, bytes.Length);
          return Encoding.Unicode.GetString(bytes);
        } finally {
          for (int i = 0; i < bytes.Length; i++) bytes[i] = 0;
        }
      } finally { CredFree(pointer); }
    }

    public static void Remove(string target) {
      if (!CredDelete(target, 1, 0)) {
        int error = Marshal.GetLastWin32Error();
        if (error != 1168) throw new Win32Exception(error);
      }
    }
  }
}
'@
}

$script:StagingCredentialTarget = 'AlbertSanfleCMS/staging/asanfle@methodicatechnology.com'
$script:StagingCredentialUser = 'asanfle@methodicatechnology.com'

function Get-StagingCredential {
  return [AlbertCmsCredential.Native]::Load($script:StagingCredentialTarget, $script:StagingCredentialUser)
}

function Set-StagingCredential([string] $Password) {
  [AlbertCmsCredential.Native]::Save($script:StagingCredentialTarget, $script:StagingCredentialUser, $Password)
}

function Remove-StagingCredential {
  [AlbertCmsCredential.Native]::Remove($script:StagingCredentialTarget)
}
