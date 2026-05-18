// Claude CLI bridge. Spawns the system `claude` binary with a prompt and
// captures stdout. The CLI uses the user's existing Claude Pro/Max
// subscription via the Anthropic OAuth login it manages itself — Memex does
// not store an API key.
//
// We pass the prompt on stdin so it can be arbitrary length without bumping
// into argv limits. cwd defaults to the vault root so the CLI can read /
// write project files when given file-tool permissions.

use std::io::Write;
use std::path::Path;
use std::process::{Command, Stdio};
use std::time::Duration;

const DEFAULT_TIMEOUT_SECS: u64 = 600;

#[derive(Debug, Clone, serde::Serialize)]
pub struct CliResult {
    pub stdout: String,
    pub stderr: String,
    pub status: i32,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct CliStatus {
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<String>,
}

pub fn check() -> CliStatus {
    match locate() {
        Some(path) => {
            let v = Command::new(&path)
                .arg("--version")
                .output()
                .ok()
                .and_then(|o| {
                    if o.status.success() {
                        Some(String::from_utf8_lossy(&o.stdout).trim().to_string())
                    } else {
                        None
                    }
                });
            CliStatus {
                installed: true,
                version: v,
                path: Some(path),
            }
        }
        None => CliStatus {
            installed: false,
            version: None,
            path: None,
        },
    }
}

pub fn run_prompt(prompt: &str, cwd: &str) -> Result<CliResult, String> {
    let path = locate().ok_or_else(|| {
        "claude CLI not found on PATH. Install: https://docs.claude.com/en/docs/claude-code"
            .to_string()
    })?;
    let dir = Path::new(cwd);
    if !dir.is_dir() {
        return Err(format!("cwd is not a directory: {cwd}"));
    }
    // --print so the CLI exits after producing output (non-interactive).
    // --allowedTools so Claude can actually edit the vault Memex spawned
    // it on — without this, every Write/Edit in an ingest workflow gets
    // silently denied in --print mode. The user installed Memex with the
    // intent of letting it maintain the vault, so we pre-authorize the
    // tools that the Ingest / Lint prompts need. MEMEX_CLAUDE_TOOLS env
    // var overrides if a user wants a tighter set.
    let allowed = std::env::var("MEMEX_CLAUDE_TOOLS")
        .unwrap_or_else(|_| "Read,Write,Edit,Glob,Grep,Bash".to_string());
    let mut child = Command::new(&path)
        .arg("--print")
        .arg("--allowedTools")
        .arg(&allowed)
        .current_dir(dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("spawn claude failed: {e}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(prompt.as_bytes())
            .map_err(|e| format!("stdin write failed: {e}"))?;
    }

    let output = wait_with_timeout(child, Duration::from_secs(DEFAULT_TIMEOUT_SECS))?;
    Ok(CliResult {
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        status: output.status.code().unwrap_or(-1),
    })
}

fn locate() -> Option<String> {
    // Honor MEMEX_CLAUDE_PATH override first, otherwise try `which claude`.
    if let Ok(p) = std::env::var("MEMEX_CLAUDE_PATH") {
        if !p.is_empty() {
            return Some(p);
        }
    }
    let which = Command::new("/usr/bin/which").arg("claude").output().ok()?;
    if !which.status.success() {
        return None;
    }
    let s = String::from_utf8_lossy(&which.stdout).trim().to_string();
    if s.is_empty() {
        None
    } else {
        Some(s)
    }
}

fn wait_with_timeout(
    mut child: std::process::Child,
    timeout: Duration,
) -> Result<std::process::Output, String> {
    let start = std::time::Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(_)) => {
                return child
                    .wait_with_output()
                    .map_err(|e| format!("wait failed: {e}"));
            }
            Ok(None) => {
                if start.elapsed() >= timeout {
                    let _ = child.kill();
                    return Err(format!("claude CLI timed out after {}s", timeout.as_secs()));
                }
                std::thread::sleep(Duration::from_millis(80));
            }
            Err(e) => return Err(format!("try_wait failed: {e}")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn check_returns_status_struct() {
        // We don't assert installed/not — the test host may or may not have
        // claude. We just verify the struct comes back populated correctly.
        let s = check();
        if s.installed {
            assert!(s.path.is_some());
        } else {
            assert!(s.path.is_none());
            assert!(s.version.is_none());
        }
    }

    #[test]
    fn run_prompt_rejects_invalid_cwd() {
        // Independent of whether claude is on PATH — we want the error path.
        let unique = std::env::temp_dir().join("memex-claude-no-such-xyz");
        let _ = std::fs::remove_dir_all(&unique);
        let res = run_prompt("hi", unique.to_str().unwrap());
        assert!(res.is_err(), "expected error for missing cwd");
    }

    #[test]
    fn locate_honors_env_override() {
        let prev = std::env::var("MEMEX_CLAUDE_PATH").ok();
        unsafe {
            std::env::set_var("MEMEX_CLAUDE_PATH", "/tmp/fake-claude");
        }
        let p = locate();
        assert_eq!(p.as_deref(), Some("/tmp/fake-claude"));
        if let Some(v) = prev {
            unsafe {
                std::env::set_var("MEMEX_CLAUDE_PATH", v);
            }
        } else {
            unsafe {
                std::env::remove_var("MEMEX_CLAUDE_PATH");
            }
        }
    }
}
