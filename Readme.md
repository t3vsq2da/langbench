# 🚀 LangBench — Cross-Platform Programming Language Benchmarking Tool

**LangBench** is a utility for comparing the performance of programs written in different programming languages.  
It automatically runs benchmarks, measures execution time, memory usage, and other system metrics, then outputs summarized results.

## Running

Make the script executable (if not already):

```bash
chmod +x bench.mjs
```

Run the benchmark:

```bash
./bench.mjs [options]
```

## Available Options

| Short Flag | Name               | Possible Values                        | Description |
|------------|--------------------|----------------------------------------|-------------|
| `-t`       | `tests`            | Space-separated list of test names     | Specifies which tests to run. Example: `-t fib sort json` |
| `-l`       | `langs`            | Space-separated list of languages      | Limits execution to the specified languages. Example: `-l rust go elixir` |
| `-ac`      | `attempts-count`   | Integer ≥ 1                            | Number of repeated runs for each test. The final result uses the best (least resource-intensive) attempt. |
| `-fm`      | `fast-mode`        | `true` / `false`                                   | Skips extended tests (those prefixed with `++`). Speeds up execution at the cost of reduced detail. |
| `-ls`      | `log-stage`        | `true` / `false`                       | Whether to log high-level progress stages (e.g., “Running test…”, “Analyzing results…”). |
| `-lc`      | `log-commands`     | `true` / `false`                       | Log all executed system commands. |
| `-la`      | `log-attempts`     | `true` / `false`                       | Show detailed output for each individual measurement attempt. |
| `-li`      | `log-individual`   | `0`, `1`, `2`                          | Per-test logging verbosity:<br>• `0` — only overall summary<br>• `1` — results for each individual test<br>• `2` — more detailed information for each test |
| `-lh`      | `log-hardware`     | `true` / `false`                       | Print hardware and OS information before testing. |

## Usage Examples

### Run only the `fib` test for C++ (compiled with Clang) and Rust, 3 attempts, with stage logging:
```bash
./bench.mjs -t fib -l "cpp clang" rust
```

> **Note**: Language identifiers like `"cpp clang"` allow specifying compiler variants.

### Fast run without extended tests and minimal logging:
```bash
./bench.mjs -fm -ls false -li 0 -lh false
```

### `langs.json` — Language Configuration

Each programming language is defined as a separate key and may include the following fields:

- **`folder`** — path to the directory containing source code files for this language.  
- **`req`** *(optional)* — list of required tools (e.g., `gcc`, `node`, `elixir`). If any are missing, LangBench will warn you before running tests.  
- **`build`** *(optional)* — command to compile the program. It supports placeholders:  
  - `<src>` → replaced with the full path to the source file,  
  - `<out>` → replaced with the name of the output executable.  
- **`run`** *(optional)* — command to run the program. May include `<src>` (useful for interpreted languages like Python or Elixir).  
- **`ext`** *(optional)* — source file extension (e.g., `"cpp"`, `"rs"`, `"exs"`).  
- **`out`** *(optional)* — name of the output file, **used only for measuring binary size**. Required when the output filename cannot be determined automatically (e.g., Elixir scripts don’t produce a single executable).

> If `build` is specified but `run` is omitted, the compiled program will be executed directly as an executable (`./<out>`).  
> For interpreted languages (e.g., Python), only `run` is needed.

### `tests.json` — Test Definitions

Each test is defined as a separate key and includes:

- **`src`** — the base name of the source file **without extension**. This name is also used for the output executable (when applicable).  
- **`asserts`** *(optional)* — expected output validation rules:  
  - Keys are command-line arguments passed to the program.  
  - Values are the **exact expected output** (including newlines).  
  - If a value is `null`, output validation is **skipped** for that run (only exit code or performance is checked).

### Special Name Prefixes

- Any test or language name starting with **`--`** is **always excluded** from all runs (useful for temporarily disabling items).  
- Any name starting with **`++`** is **excluded in fast mode** (`-fm`) but included in full benchmark runs.

> Example: a test named `++memory-heavy` will run only in normal mode, but will be skipped when the `-fm` flag is used.